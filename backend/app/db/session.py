"""
AIRWISE AI — Database Engine, Session Scoping & Resilience Management
Provides non-blocking startup and graceful degradation when PostgreSQL is not yet configured locally.
"""

import time
from typing import Any, Dict, Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings
from app.core.logging import logger

# Base Model Declaration
Base = declarative_base()

# SQLAlchemy Engine Configuration with resilient fallback
try:
    # Attempt to create engine using configured URL
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_timeout=settings.DB_POOL_TIMEOUT,
        pool_pre_ping=True,  # Proactively test connection liveliness
    )
except Exception as e:
    logger.warning("Could not initialize PostgreSQL engine with configured URL (%s): %s", settings.DATABASE_URL, e)
    # Fallback to in-memory SQLite so backend can still boot in local development without immediate DB
    engine = create_engine("sqlite:///:memory:", echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a thread-local scoped database session.
    Automatically closes sessions upon request completion or rolls back on exception.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        logger.error("Database transaction rolled back due to error: %s", e)
        raise
    finally:
        db.close()


def check_db_health() -> Dict[str, Any]:
    """
    Performs a non-disruptive liveness check on the database connection.
    Used by the /api/v1/health endpoint to report connection status.
    """
    start_time = time.perf_counter()
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        
        is_postgres = "postgres" in str(engine.url)
        return {
            "status": "connected" if is_postgres else "development_mock_fallback",
            "dialect": engine.dialect.name,
            "latency_ms": latency_ms,
            "details": "Operational" if is_postgres else "Using development fallback SQLite; configure DATABASE_URL for PostgreSQL",
        }
    except Exception as exc:
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        logger.warning("Database health check failed: %s", exc)
        return {
            "status": "unavailable",
            "dialect": engine.dialect.name if hasattr(engine, "dialect") else "unknown",
            "latency_ms": latency_ms,
            "details": "PostgreSQL is not responding. Ensure database is running and credentials in .env are correct.",
        }
