"""
Application configuration settings.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env file from the backend root
load_dotenv(BASE_DIR / ".env")

# Database — set to Supabase Postgres connection string in production
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'archion.db'}")

# Supabase JWT Secret — used to verify access tokens from the frontend
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")

# CORS
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,http://localhost:3002,http://127.0.0.1:3002,http://localhost:3003,http://127.0.0.1:3003,http://localhost:3004,http://127.0.0.1:3004,http://localhost:5173,http://127.0.0.1:5173"
).split(",")

# API
API_V1_PREFIX = "/api/v1"
PROJECT_NAME = "Archion Build"
PROJECT_VERSION = "1.0.0"
PROJECT_DESCRIPTION = "AI-powered architectural floor plan generator"

# Anthropic Claude (optional — regex fallback is used when not set)
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", None)
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-3-5-haiku-20241022")
