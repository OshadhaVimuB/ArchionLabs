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

# Database
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'archion.db'}")

# CORS
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
).split(",")

# API
API_V1_PREFIX = "/api/v1"
PROJECT_NAME = "Archion Build"
PROJECT_VERSION = "1.0.0"
PROJECT_DESCRIPTION = "AI-powered architectural floor plan generator"

# Groq LLM (optional — regex fallback is used when not set)
GROQ_API_KEY = os.getenv("GROQ_API_KEY", None)
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
