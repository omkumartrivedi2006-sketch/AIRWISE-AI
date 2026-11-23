"""
AIRWISE AI — Pytest Configuration & Test Fixtures
Provides isolated MongoDB database sessions and TestClient.
"""

import sys
from pathlib import Path
import mongomock
import pytest

# Ensure backend root is on Python sys.path
backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from app.core.database import MongoSession, get_db, init_db_indexes
from app.main import app
from fastapi.testclient import TestClient


@pytest.fixture
def db_session():
    """Provides an isolated in-memory MongoDB session for every test."""
    client = mongomock.MongoClient()
    test_db = client["test_airwise_db"]
    init_db_indexes(test_db)
    session = MongoSession(test_db)
    yield session


@pytest.fixture
def client(db_session):
    """Provides a TestClient with overridden get_db dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
