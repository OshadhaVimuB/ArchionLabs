"""
Archion Build - FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import (
    API_V1_PREFIX,
    CORS_ORIGINS,
    PROJECT_NAME,
    PROJECT_VERSION,
    PROJECT_DESCRIPTION,
)
from app.database import engine, Base
from app.routers import generate

# Create all database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI application
app = FastAPI(
    title=PROJECT_NAME,
    version=PROJECT_VERSION,
    description=PROJECT_DESCRIPTION,
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(generate.router, prefix=API_V1_PREFIX)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "message": f"Welcome to {PROJECT_NAME}",
        "version": PROJECT_VERSION,
    }


@app.get(f"{API_V1_PREFIX}/health")
async def health_check():
    """API health check."""
    return {"status": "healthy"}
