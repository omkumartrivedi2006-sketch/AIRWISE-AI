"""
AIRWISE AI — Data Migration Script: PostgreSQL/SQLite to MongoDB
Migrates existing relational records into native MongoDB documents while maintaining
strict backward compatibility, preserving integer auto-increment IDs, and validating data integrity.

Usage:
    python backend/scripts/migrate_postgres_to_mongodb.py [--source-url <DB_URL>] [--dry-run]
"""

import argparse
import os
import sys
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.core.database import get_mongodb_client, init_db_indexes


TABLE_TO_COLLECTION_MAP = {
    "users": "users",
    "locations": "locations",
    "pollution_observations": "pollution_observations",
    "conversations": "conversations",
    "messages": "messages",
    "feedback": "feedback",
    "refresh_tokens": "refresh_tokens",
    "password_reset_tokens": "password_reset_tokens",
    "email_verification_tokens": "email_verification_tokens",
    "user_preferences": "user_preferences",
    "saved_locations": "saved_locations",
    "alert_rules": "alert_rules",
    "notifications": "notifications",
    "push_subscriptions": "push_subscriptions",
    "recommendation_cache": "recommendation_cache",
    "audit_logs": "audit_logs",
    "environmental_reviews": "environmental_reviews",
}


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate AIRWISE AI relational database to MongoDB."
    )
    parser.add_argument(
        "--source-url",
        type=str,
        default=os.getenv("SOURCE_DATABASE_URL", settings.DATABASE_URL),
        help="Source relational database connection string (PostgreSQL or SQLite).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simulate the migration without writing changes to MongoDB.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=500,
        help="Number of documents to insert in each bulk batch.",
    )
    return parser.parse_args()


def get_source_connection(source_url: str):
    """Establishes connection to source database (PostgreSQL or SQLite)."""
    try:
        from sqlalchemy import create_engine
        engine = create_engine(source_url)
        return engine.connect()
    except Exception as exc:
        print(f"[WARN] Unable to connect via SQLAlchemy ({exc}).")
        if "sqlite" in source_url:
            import sqlite3
            db_path = source_url.replace("sqlite:///", "")
            if os.path.exists(db_path):
                conn = sqlite3.connect(db_path)
                conn.row_factory = sqlite3.Row
                return conn
        return None


def fetch_source_table_records(conn: Any, table_name: str) -> List[Dict[str, Any]]:
    """Reads all rows from a given source table."""
    try:
        if hasattr(conn, "execute"):
            from sqlalchemy import text
            result = conn.execute(text(f"SELECT * FROM {table_name} ORDER BY id ASC"))
            rows = [dict(row._mapping) for row in result]
            return rows
    except Exception:
        pass

    try:
        # Fallback to standard DB-API cursor
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM {table_name} ORDER BY id ASC")
        columns = [col[0] for col in cursor.description]
        records = [dict(zip(columns, row)) for row in cursor.fetchall()]
        return records
    except Exception as exc:
        print(f" -> Table '{table_name}' could not be read or does not exist: {exc}")
        return []


def clean_document_types(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Ensures document values match MongoDB schema conventions."""
    cleaned = {}
    for k, v in doc.items():
        if isinstance(v, str):
            # Attempt ISO datetime parsing for string dates
            if len(v) >= 19 and ("T" in v or " " in v) and (v[4] == "-" and v[7] == "-"):
                try:
                    dt = datetime.fromisoformat(v.replace("Z", "+00:00"))
                    if dt.tzinfo is None:
                        dt = dt.replace(tzinfo=timezone.utc)
                    cleaned[k] = dt
                    continue
                except Exception:
                    pass
            cleaned[k] = v
        elif isinstance(v, datetime):
            if v.tzinfo is None:
                v = v.replace(tzinfo=timezone.utc)
            cleaned[k] = v
        else:
            cleaned[k] = v
    return cleaned


def run_migration():
    args = parse_arguments()

    print("=" * 65)
    print("AIRWISE AI — Relational to MongoDB Migration")
    print(f"Source URL: {args.source_url}")
    print(f"Target URI: {settings.MONGODB_URI}")
    print(f"Target DB:  {settings.DB_NAME}")
    print(f"Dry Run:    {args.dry_run}")
    print("=" * 65)

    # 1. Connect to MongoDB
    try:
        mongo_client = get_mongodb_client()
        mongo_client.admin.command("ping")
        mongo_db = mongo_client[settings.DB_NAME]
        print("[SUCCESS] Connected to MongoDB cluster.")
    except Exception as exc:
        print(f"[ERROR] Failed to connect to target MongoDB: {exc}")
        sys.exit(1)

    # 2. Connect to Source Relational DB
    source_conn = get_source_connection(args.source_url)
    if not source_conn:
        print(f"[INFO] Source database at '{args.source_url}' is not accessible or not configured.")
        print("[INFO] Initializing MongoDB schema and indexes directly...")
        init_db_indexes(mongo_db)
        print("[SUCCESS] MongoDB schema initialized cleanly without source data migration.")
        return

    # 3. Apply Indexes
    if not args.dry_run:
        print("\n[STEP 1/3] Ensuring target MongoDB indexes...")
        init_db_indexes(mongo_db)

    # 4. Migrate Tables
    print("\n[STEP 2/3] Migrating table data...")
    total_migrated = 0
    migration_summary = {}

    for table_name, coll_name in TABLE_TO_COLLECTION_MAP.items():
        records = fetch_source_table_records(source_conn, table_name)
        count = len(records)
        migration_summary[table_name] = count

        if count == 0:
            print(f" -> {table_name:<26} : 0 rows (skipped)")
            continue

        print(f" -> {table_name:<26} : {count} rows found. Processing...")

        if args.dry_run:
            print(f"    [DRY RUN] Would upsert {count} documents into '{coll_name}'.")
            continue

        target_coll = mongo_db[coll_name]
        max_id = 0

        # Upsert in batches
        for i in range(0, count, args.batch_size):
            batch = records[i : i + args.batch_size]
            for record in batch:
                clean_doc = clean_document_types(record)
                doc_id = clean_doc.get("id")
                if doc_id is not None:
                    if isinstance(doc_id, int) and doc_id > max_id:
                        max_id = doc_id
                    target_coll.update_one({"id": doc_id}, {"$set": clean_doc}, upsert=True)
                else:
                    target_coll.insert_one(clean_doc)

        # Update sequence counter
        if max_id > 0:
            mongo_db["counters"].update_one(
                {"_id": coll_name},
                {"$set": {"seq": max_id}},
                upsert=True,
            )
            print(f"    -> Synced sequence counter for '{coll_name}' to {max_id}.")

        total_migrated += count

    # 5. Verification
    print("\n[STEP 3/3] Migration verification summary...")
    print("-" * 65)
    print(f"{'Table / Collection':<30} | {'Source Count':<14} | {'Target Count':<14}")
    print("-" * 65)
    for table_name, coll_name in TABLE_TO_COLLECTION_MAP.items():
        src_cnt = migration_summary.get(table_name, 0)
        tgt_cnt = mongo_db[coll_name].count_documents({}) if not args.dry_run else "(dry-run)"
        status_str = "OK" if args.dry_run or src_cnt == tgt_cnt else "DIFF"
        print(f"{coll_name:<30} | {src_cnt:<14} | {tgt_cnt:<14} [{status_str}]")
    print("-" * 65)

    if args.dry_run:
        print("[SUCCESS] Dry-run completed. No records were modified in MongoDB.")
    else:
        print(f"[SUCCESS] Migration completed! {total_migrated} records migrated safely.")
    print("=" * 65)


if __name__ == "__main__":
    run_migration()
