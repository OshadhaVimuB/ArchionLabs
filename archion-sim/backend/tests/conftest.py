"""
Pytest configuration and fixtures for Archion Sim backend tests.
"""

import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Ensure the backend package is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from main import app


@pytest.fixture()
def client():
    """Provide a FastAPI TestClient for the archion-sim backend."""
    with TestClient(app) as tc:
        yield tc
