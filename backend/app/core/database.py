"""
AIRWISE AI — Centralized MongoDB Database Configuration & Session Management
Provides MongoDB client lifecycle management, atomic sequence generation,
query adaptation, connection pooling, and resilient testing/development fallback.
"""

import time
from datetime import datetime, timezone
from typing import Any, Dict, Generator, List, Optional, Tuple, Union
import pymongo
from pymongo import MongoClient, ReturnDocument
from pymongo.database import Database

from app.core.config import settings
from app.core.logging import logger
from app.models.base import AndExpression, BinaryExpression, CountExpression, MongoModel, OrExpression


class MongoQuery:
    """Provides high-level querying and aggregation over MongoDB collections."""
    def __init__(self, session_or_db: Any, *targets: Any):
        if hasattr(session_or_db, "_db"):
            self.session = session_or_db
            self.db = session_or_db._db
        else:
            self.session = None
            self.db = session_or_db

        self.targets = targets
        self.model_class: Optional[Any] = None
        self.target_field: Optional[str] = None
        self.is_count_query: bool = False

        if targets:
            first = targets[0]
            if isinstance(first, CountExpression):
                self.is_count_query = True
                self.target_field = first.field_name
                if getattr(first, "model_class", None):
                    self.model_class = first.model_class
            elif isinstance(first, type) and issubclass(first, MongoModel):
                self.model_class = first
            elif hasattr(first, "name"):
                self.target_field = first.name

        self._filter: Dict[str, Any] = {}
        self._sort: List[Tuple[str, int]] = []
        self._skip: int = 0
        self._limit: int = 0

    def _resolve_collection(self) -> Any:
        if self.model_class and hasattr(self.model_class, "get_collection_name"):
            coll_name = self.model_class.get_collection_name()
            return self.db[coll_name]
        return self.db["default"]

    def filter(self, *criteria: Any) -> "MongoQuery":
        for criterion in criteria:
            if criterion is None:
                continue
            if isinstance(criterion, (BinaryExpression, AndExpression, OrExpression)):
                mongo_crit = criterion.to_mongo_filter()
            elif isinstance(criterion, dict):
                mongo_crit = criterion
            else:
                continue

            for k, v in mongo_crit.items():
                if k in self._filter and isinstance(self._filter[k], dict) and isinstance(v, dict):
                    self._filter[k].update(v)
                else:
                    self._filter[k] = v
        return self

    def filter_by(self, **kwargs: Any) -> "MongoQuery":
        for k, v in kwargs.items():
            self._filter[k] = v
        return self

    def options(self, *args: Any) -> "MongoQuery":
        return self

    def join(self, *args: Any, **kwargs: Any) -> "MongoQuery":
        return self

    def outerjoin(self, *args: Any, **kwargs: Any) -> "MongoQuery":
        return self

    def order_by(self, *orderings: Any) -> "MongoQuery":
        for ord_item in orderings:
            if isinstance(ord_item, tuple) and len(ord_item) == 2:
                self._sort.append(ord_item)
            elif isinstance(ord_item, str):
                self._sort.append((ord_item, 1))
            elif hasattr(ord_item, "desc"):
                self._sort.append(ord_item.desc())
            elif hasattr(ord_item, "asc"):
                self._sort.append(ord_item.asc())
        return self

    def offset(self, n: int) -> "MongoQuery":
        self._skip = n
        return self

    def skip(self, n: int) -> "MongoQuery":
        self._skip = n
        return self

    def limit(self, n: int) -> "MongoQuery":
        self._limit = n
        return self

    def _resolve_row(self, primary_inst: Any) -> Any:
        if len(self.targets) <= 1:
            return primary_inst
        row = [primary_inst]
        for t in self.targets[1:]:
            field_name = getattr(t, "name", str(t))
            target_model = getattr(t, "model_class", None)
            val = None
            if target_model and hasattr(primary_inst, "id"):
                target_coll_name = target_model.get_collection_name()
                fk_candidates = [
                    f"{target_model.__name__.lower()}_id",
                    "reviewed_by_id" if target_model.__name__ == "User" else None,
                    "user_id" if target_model.__name__ == "User" else None,
                    "location_id" if target_model.__name__ == "Location" else None,
                ]
                related_doc = None
                for fk in fk_candidates:
                    if fk and hasattr(primary_inst, fk) and getattr(primary_inst, fk) is not None:
                        related_doc = self.db[target_coll_name].find_one({"id": getattr(primary_inst, fk)})
                        if related_doc:
                            break
                if related_doc and field_name in related_doc:
                    val = related_doc[field_name]
            row.append(val)
        return tuple(row)

    def first(self) -> Optional[Any]:
        coll = self._resolve_collection()
        cursor = coll.find(self._filter)
        if self._sort:
            cursor = cursor.sort(self._sort)
        if self._skip:
            cursor = cursor.skip(self._skip)
        docs = list(cursor.limit(1))
        if not docs:
            return None
        doc = docs[0]
        if self.model_class and hasattr(self.model_class, "from_dict"):
            inst = self.model_class.from_dict(doc)
            if self.session and hasattr(inst, "id") and inst.id is not None:
                self.session._tracked[f"{self.model_class.get_collection_name()}_{inst.id}"] = inst
            return self._resolve_row(inst)
        return doc

    def all(self) -> List[Any]:
        coll = self._resolve_collection()
        cursor = coll.find(self._filter)
        if self._sort:
            cursor = cursor.sort(self._sort)
        if self._skip:
            cursor = cursor.skip(self._skip)
        if self._limit:
            cursor = cursor.limit(self._limit)
        docs = list(cursor)
        if self.model_class and hasattr(self.model_class, "from_dict"):
            results = []
            for d in docs:
                inst = self.model_class.from_dict(d)
                if self.session and hasattr(inst, "id") and inst.id is not None:
                    self.session._tracked[f"{self.model_class.get_collection_name()}_{inst.id}"] = inst
                results.append(self._resolve_row(inst))
            return results
        return docs

    def count(self) -> int:
        coll = self._resolve_collection()
        return coll.count_documents(self._filter)

    def scalar(self) -> Any:
        coll = self._resolve_collection()
        if self.is_count_query:
            return coll.count_documents(self._filter)
        doc = coll.find_one(self._filter)
        if not doc:
            return 0 if self.is_count_query else None
        if self.target_field and self.target_field in doc:
            return doc[self.target_field]
        for k in ["count", "id", "seq"]:
            if k in doc:
                return doc[k]
        return 1

    def delete(self) -> int:
        coll = self._resolve_collection()
        res = coll.delete_many(self._filter)
        if self.session and hasattr(self.session, "_tracked"):
            coll_name = self.model_class.get_collection_name() if self.model_class else ""
            prefix = f"{coll_name}_"
            for key in list(self.session._tracked.keys()):
                if key.startswith(prefix):
                    del self.session._tracked[key]
        return res.deleted_count

    def update(self, values: Dict[Any, Any], **kwargs: Any) -> int:
        coll = self._resolve_collection()
        update_doc = {}
        for k, v in values.items():
            field_name = getattr(k, "name", str(k))
            update_doc[field_name] = v
        if not update_doc:
            return 0
        res = coll.update_many(self._filter, {"$set": update_doc})
        if self.session and hasattr(self.session, "_tracked"):
            coll_name = self.model_class.get_collection_name() if self.model_class else ""
            prefix = f"{coll_name}_"
            for key, entity in list(self.session._tracked.items()):
                if key.startswith(prefix):
                    for fk, fv in update_doc.items():
                        setattr(entity, fk, fv)
        return res.modified_count

    def distinct(self, field: Any = None) -> List[Any]:
        coll = self._resolve_collection()
        field_name = getattr(field, "name", str(field)) if field else "id"
        return coll.distinct(field_name, self._filter)


class MongoSession:
    """Session adapter wrapping a MongoDB database instance."""
    def __init__(self, db: Any):
        self._db = db
        self._tracked: Dict[str, Any] = {}
        self._dirty: set = set()

    @property
    def db(self) -> Any:
        return self._db

    @property
    def bind(self) -> Any:
        return None

    def __getattr__(self, name: str) -> Any:
        return getattr(self._db, name)

    def __getitem__(self, name: str) -> Any:
        return self._db[name]

    def add(self, entity: Any) -> None:
        if not hasattr(entity, "get_collection_name"):
            return
        coll_name = entity.get_collection_name()

        # Allocate auto-increment integer ID if not set
        if getattr(entity, "id", None) is None:
            entity.id = get_next_sequence_value(self._db, coll_name)

        key = f"{coll_name}_{entity.id}"
        self._tracked[key] = entity
        self._dirty.add(key)

    def add_all(self, entities: List[Any]) -> None:
        for e in entities:
            self.add(e)

    def flush(self) -> None:
        self.commit()

    def merge(self, entity: Any) -> Any:
        self.add(entity)
        return entity

    def expunge(self, entity: Any) -> None:
        pass

    def begin(self) -> Any:
        class DummyTx:
            def __enter__(self): return self
            def __exit__(self, *args): pass
        return DummyTx()

    def commit(self) -> None:
        for entity in list(self._tracked.values()):
            if hasattr(entity, "id") and hasattr(entity, "get_collection_name") and entity.id is not None:
                coll_name = entity.get_collection_name()
                doc = entity.to_dict() if hasattr(entity, "to_dict") else dict(entity)
                doc["id"] = entity.id
                self._db[coll_name].update_one({"id": entity.id}, {"$set": doc}, upsert=True)
        self._dirty.clear()

    def rollback(self) -> None:
        self._dirty.clear()

    def close(self) -> None:
        self._tracked.clear()
        self._dirty.clear()

    def refresh(self, entity: Any) -> None:
        if not hasattr(entity, "id") or not hasattr(entity, "get_collection_name"):
            return
        coll = self._db[entity.get_collection_name()]
        doc = coll.find_one({"id": entity.id})
        if doc:
            if "_id" in doc:
                del doc["_id"]
            for k, v in doc.items():
                setattr(entity, k, v)

    def delete(self, entity: Any) -> None:
        if not hasattr(entity, "id") or not hasattr(entity, "get_collection_name"):
            return
        coll_name = entity.get_collection_name()
        coll = self._db[coll_name]
        coll.delete_one({"id": entity.id})
        self._tracked.pop(f"{coll_name}_{entity.id}", None)

    def query(self, *targets: Any) -> MongoQuery:
        return MongoQuery(self, *targets)

    def execute(self, *args: Any, **kwargs: Any) -> Any:
        return None


def get_next_sequence_value(db: Any, sequence_name: str) -> int:
    """Generates an atomic auto-increment integer sequence value."""
    try:
        ret = db.counters.find_one_and_update(
            {"_id": sequence_name},
            {"$inc": {"seq": 1}},
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
        return int(ret["seq"])
    except Exception:
        doc = db.counters.find_one({"_id": sequence_name})
        seq = 1 if not doc else int(doc.get("seq", 0)) + 1
        db.counters.update_one({"_id": sequence_name}, {"$set": {"seq": seq}}, upsert=True)
        return seq


# Global client and database singleton
_mongo_client: Optional[Any] = None
_mongo_db: Optional[Any] = None
_is_development_fallback: bool = False


_indexes_ensured: bool = False

def ensure_indexes_async(db: Any) -> None:
    """Provisions database indexes asynchronously in the background to prevent request blocking."""
    global _indexes_ensured
    if _indexes_ensured:
        return
    _indexes_ensured = True
    import threading
    threading.Thread(target=init_db_indexes, args=(db,), daemon=True).start()


def init_mongodb_client() -> Tuple[Any, Any, bool]:
    """Initializes MongoDB client with Atlas/production checks and resilient local fallback."""
    global _mongo_client, _mongo_db, _is_development_fallback
    if _mongo_db is not None:
        return _mongo_client, _mongo_db, _is_development_fallback

    mongo_uri = getattr(settings, "MONGODB_URI", "mongodb://localhost:27017")
    db_name = getattr(settings, "DB_NAME", "airwise_db")

    try:
        client = MongoClient(
            mongo_uri,
            serverSelectionTimeoutMS=getattr(settings, "MONGODB_TIMEOUT_MS", 3000),
            maxPoolSize=getattr(settings, "MONGODB_MAX_POOL_SIZE", 20),
            minPoolSize=getattr(settings, "MONGODB_MIN_POOL_SIZE", 0),
        )
        # Verify connection responsiveness
        client.admin.command("ping")
        _mongo_client = client
        _mongo_db = client[db_name]
        _is_development_fallback = False
        logger.info("Connected successfully to MongoDB database '%s' at %s", db_name, mongo_uri.split("@")[-1])
        ensure_indexes_async(_mongo_db)
        return _mongo_client, _mongo_db, _is_development_fallback
    except Exception as exc:
        if settings.is_production:
            logger.critical("FATAL: Production mode requires a reachable MongoDB database at %s. Error: %s", mongo_uri, exc)
            raise RuntimeError(f"MongoDB connection failed in production: {exc}") from exc

        logger.warning(
            "MongoDB is unreachable at %s (%s). Initializing resilient development in-memory MongoDB engine.",
            mongo_uri,
            exc,
        )
        import mongomock
        mock_client = mongomock.MongoClient()
        _mongo_client = mock_client
        _mongo_db = mock_client[db_name]
        _is_development_fallback = True
        ensure_indexes_async(_mongo_db)
        return _mongo_client, _mongo_db, _is_development_fallback


def get_mongodb_client() -> Any:
    """Returns the active MongoDB client instance."""
    client, _, _ = init_mongodb_client()
    return client


def get_database() -> Any:
    _, db, _ = init_mongodb_client()
    return db


def get_db() -> Generator[MongoSession, None, None]:
    """FastAPI dependency yielding a thread-scoped MongoSession adapter."""
    db = get_database()
    session = MongoSession(db)
    try:
        yield session
    finally:
        session.close()


def check_database_connection() -> Dict[str, Any]:
    """Safe non-disruptive database connectivity probe."""
    start_time = time.perf_counter()
    try:
        client, db, is_fallback = init_mongodb_client()
        if not is_fallback:
            client.admin.command("ping")
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return {
            "status": "connected" if not is_fallback else "development_fallback",
            "dialect": "mongodb",
            "database": getattr(settings, "DB_NAME", "airwise_db"),
            "latency_ms": latency_ms,
            "details": "MongoDB operational" if not is_fallback else "Using development in-memory MongoDB engine; configure MONGODB_URI in .env to connect to MongoDB / Atlas",
        }
    except Exception as exc:
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        logger.warning("MongoDB health check failed: %s", exc)
        return {
            "status": "unavailable",
            "dialect": "mongodb",
            "latency_ms": latency_ms,
            "details": f"Database is unreachable. Please verify that MongoDB is running and MONGODB_URI is correct: {exc}",
        }


def init_db_indexes(db: Any) -> None:
    """Provisions essential unique constraints and query indexes on all MongoDB collections."""
    try:
        # 1. users
        db.users.create_index([("email", pymongo.ASCENDING)], unique=True)
        db.users.create_index([("id", pymongo.ASCENDING)], unique=True)

        # 2. locations
        db.locations.create_index([("name", 1), ("city", 1), ("country", 1)], unique=True)
        db.locations.create_index([("id", pymongo.ASCENDING)], unique=True)
        db.locations.create_index([("city", pymongo.ASCENDING)])

        # 3. pollution_observations
        db.pollution_observations.create_index([("id", pymongo.ASCENDING)], unique=True)
        db.pollution_observations.create_index([("location_id", 1), ("observed_at", -1)])
        db.pollution_observations.create_index([("location_id", 1), ("observed_at", 1), ("provider", 1)])

        # 4. conversations & messages
        db.conversations.create_index([("id", pymongo.ASCENDING)], unique=True)
        db.conversations.create_index([("user_id", pymongo.ASCENDING)])
        db.messages.create_index([("id", pymongo.ASCENDING)], unique=True)
        db.messages.create_index([("conversation_id", 1), ("created_at", 1)])

        # 5. tokens
        db.refresh_tokens.create_index([("token_hash", pymongo.ASCENDING)], unique=True)
        db.password_reset_tokens.create_index([("token_hash", pymongo.ASCENDING)], unique=True)
        db.email_verification_tokens.create_index([("token_hash", pymongo.ASCENDING)], unique=True)

        # 6. user preferences & saved locations
        db.user_preferences.create_index([("user_id", pymongo.ASCENDING)], unique=True)
        db.saved_locations.create_index([("user_id", 1), ("location_id", 1)], unique=True)
        db.alert_rules.create_index([("user_id", 1), ("location_id", 1)])
        db.notifications.create_index([("user_id", 1), ("is_read", 1), ("created_at", -1)])
        db.recommendation_caches.create_index([("user_id", 1), ("cache_key", 1)])
        db.audit_logs.create_index([("created_at", -1), ("action", 1)])
        db.environmental_data_reviews.create_index([("observation_id", 1), ("created_at", -1)])
    except Exception as exc:
        logger.debug("MongoDB index creation notice: %s", exc)


# Compatibility aliases
Base = MongoModel
Session = MongoSession
SessionLocal = MongoSession
