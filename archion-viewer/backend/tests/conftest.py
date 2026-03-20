"""
Pytest configuration and shared fixtures for Archion Viewer backend tests.
"""

import os
import sys
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Ensure the backend package is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Force SQLite for tests before importing any app code
os.environ["DATABASE_URL"] = "sqlite:///./test_archion_viewer.db"
os.environ["SUPABASE_JWT_SECRET"] = "test-secret-key-for-unit-tests"

from app.database import Base, get_db
from app.main import app


# ---------------------------------------------------------------------------
# In-memory SQLite test database
# ---------------------------------------------------------------------------

TEST_DATABASE_URL = "sqlite:///./test_archion_viewer.db"

test_engine = create_engine(
    TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture()
def db_session():
    """Provide a clean database session for each test."""
    Base.metadata.create_all(bind=test_engine)
    session = TestSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture()
def client(db_session):
    """Provide a FastAPI TestClient with the test DB overridden."""
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as tc:
        yield tc
    app.dependency_overrides.clear()
