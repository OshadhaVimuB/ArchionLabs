"""
Application configuration settings.
"""

import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Database
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'archion.db'}")

# CORS
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

# API
API_V1_PREFIX = "/api/v1"
PROJECT_NAME = "Archion Build"
PROJECT_VERSION = "1.0.0"
PROJECT_DESCRIPTION = "AI-powered architectural floor plan generator"
