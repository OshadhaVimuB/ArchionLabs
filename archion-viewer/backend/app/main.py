"""
Archion Viewer — FastAPI Backend
=================================
Handles persistent 3D model uploads and secure, token-based share link management
for the Archion Viewer 3D frontend (Next.js).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import (
    API_V1_PREFIX,
    CORS_ORIGINS,
    PROJECT_DESCRIPTION,
    PROJECT_NAME,
    PROJECT_VERSION,
)
from app.database import Base, engine

# Import ORM models so SQLAlchemy registers them before create_all
import app.models  # noqa: F401

# Import routers
from app.routers import upload, models, share

# ---------------------------------------------------------------------------
# Database initialisation
# ---------------------------------------------------------------------------
Base.metadata.create_all(bind=engine)

# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------
app = FastAPI(
    title=PROJECT_NAME,
    version=PROJECT_VERSION,
    description=PROJECT_DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(upload.router, prefix=API_V1_PREFIX)
app.include_router(models.router, prefix=API_V1_PREFIX)
app.include_router(share.router, prefix=API_V1_PREFIX)


# ---------------------------------------------------------------------------
# Root / health endpoints
# ---------------------------------------------------------------------------
@app.get("/", tags=["health"])
async def root():
    """Welcome message and version."""
    return {"message": f"Welcome to {PROJECT_NAME}", "version": PROJECT_VERSION}


@app.get(f"{API_V1_PREFIX}/health", tags=["health"])
async def health_check():
    """Simple liveness probe."""
    return {"status": "healthy", "service": PROJECT_NAME}
