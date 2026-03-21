import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

PROJECT_NAME = "Archion Viewer API"
PROJECT_VERSION = "1.0.0"
PROJECT_DESCRIPTION = (
    "Backend API for Archion 3D Model Viewer — "
    "handles model file uploads, persistent storage, and secure share token management."
)

API_V1_PREFIX = "/api"

CORS_ORIGINS: list[str] = os.getenv(
    "CORS_ORIGINS", 
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,http://localhost:3002,http://127.0.0.1:3002,http://localhost:3003,http://127.0.0.1:3003,http://localhost:3004,http://127.0.0.1:3004"
).split(",")

DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./archion_viewer.db")

# Supabase JWT Secret — used to verify access tokens from the frontend
SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "")

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Maximum upload file size in bytes (default 100 MB)
MAX_UPLOAD_SIZE: int = int(os.getenv("MAX_UPLOAD_SIZE", str(100 * 1024 * 1024)))

SUPPORTED_MODEL_EXTENSIONS: frozenset[str] = frozenset({".gltf", ".glb", ".obj", ".fbx", ".stl"})
SUPPORTED_TEXTURE_EXTENSIONS: frozenset[str] = frozenset({
    ".jpg", ".jpeg", ".png", ".tga", ".bmp", ".gif", ".tiff", ".tif", ".webp",
})

# Map file extension → format string (matches frontend conventions)
FORMAT_MAP: dict[str, str] = {
    ".gltf": "gltf",
    ".glb": "gltf",
    ".obj": "obj",
    ".fbx": "fbx",
    ".stl": "stl",
}
