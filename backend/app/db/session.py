"""
AIRWISE AI — Centralized MongoDB Database Session & Adapter
Re-exports native MongoDB connection, session, and dependency providers for backwards-compatibility.
"""

from typing import Any, Dict, Generator
from app.core.database import (
    Base,
    MongoSession,
    get_db,
    check_database_connection,
    get_mongodb_client,
)

# Compatibility alias for Session type hints across endpoints and services
Session = MongoSession


def check_db_health() -> Dict[str, Any]:
    """Liveness check on MongoDB connection."""
    return check_database_connection()


SessionLocal = MongoSession
