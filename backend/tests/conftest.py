"""
AIRWISE AI — Pytest Configuration & Test Fixtures
"""

import os
import sys
from pathlib import Path
import pytest

# Ensure backend root is on Python sys.path
backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="session")
def client():
    """Returns a TestClient instance for testing FastAPI endpoints."""
    with TestClient(app) as test_client:
        yield test_client
