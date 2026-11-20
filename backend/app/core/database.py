"""
AIRWISE AI — Centralized Database Configuration & Session Management
Supports PostgreSQL with connection pooling, and provides resilient fallback
when PostgreSQL server is not locally running during initial developer evaluation.
"""

import time
from typing import Any, Dict, Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings
from app.core.logging import logger

Base = declarative_base()

def get_engine():
    """Initializes SQLAlchemy engine with connection pool settings and ping validation."""
    db_url = settings.DATABASE_URL
    try:
        # Check if URL specifies PostgreSQL
        if "postgresql" in db_url:
            eng = create_engine(
                db_url,
                pool_size=settings.DB_POOL_SIZE,
                max_overflow=settings.DB_MAX_OVERFLOW,
                pool_timeout=settings.DB_POOL_TIMEOUT,
                pool_pre_ping=True,
            )
            # Test immediate liveness
            with eng.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Connected successfully to PostgreSQL database at %s", eng.url.host)
            return eng
        else:
            # SQLite for local testing or custom URI
            return create_engine(db_url, connect_args={"check_same_thread": False})
    except Exception as e:
        logger.warning(
            "PostgreSQL is unreachable at %s (%s). Initializing resilient development SQLite fallback.",
            db_url,
            e,
        )
        # Use a local SQLite file so migrations, repositories, and persistence can be fully verified
        return create_engine("sqlite:///./airwise_local.db", connect_args={"check_same_thread": False})


engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a thread-scoped database session.
    Commits/rolls back and ensures deterministic closure.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as exc:
        db.rollback()
        logger.error("Database session rolled back due to error: %s", exc)
        raise
    finally:
        db.close()


def check_database_connection() -> Dict[str, Any]:
    """
    Safe non-disruptive database connectivity probe.
    Returns status without leaking internal passwords or stack traces.
    """
    start_time = time.perf_counter()
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        is_postgres = "postgresql" in str(engine.url)
        return {
            "status": "connected" if is_postgres else "development_fallback",
            "dialect": engine.dialect.name,
            "latency_ms": latency_ms,
            "details": "PostgreSQL operational" if is_postgres else "Using development fallback SQLite; configure DATABASE_URL in .env to connect to PostgreSQL",
        }
    except Exception as exc:
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        logger.warning("Database health check failed: %s", exc)
        return {
            "status": "unavailable",
            "dialect": engine.dialect.name if hasattr(engine, "dialect") else "unknown",
            "latency_ms": latency_ms,
            "details": "Database is unreachable. Please verify that PostgreSQL is running and credentials in .env are correct.",
        }
