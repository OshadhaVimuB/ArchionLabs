"""
SQLAlchemy ORM models for the Archion Viewer backend.

Two tables:
  - model_uploads  : stores metadata + disk paths for uploaded 3D model files.
  - share_tokens   : stores secure, expiring share links that point to a model upload.
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ModelUpload(Base):
    """One row per uploaded 3D model (including optional MTL + textures)."""

    __tablename__ = "model_uploads"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    original_filename: Mapped[str] = mapped_column(String, nullable=False)
    # Format string that matches the frontend (gltf, obj, fbx, stl)
    model_format: Mapped[str] = mapped_column(String, nullable=False)
    # Path relative to UPLOAD_DIR, e.g. "<uuid>/model.gltf"
    file_path: Mapped[str] = mapped_column(String, nullable=False)
    # MTL path relative to UPLOAD_DIR (OBJ models only)
    mtl_path: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    # JSON-encoded dict: {original_filename: relative_path, lowercase_filename: relative_path}
    texture_paths_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    shares: Mapped[list["ShareToken"]] = relationship(
        "ShareToken", back_populates="model", cascade="all, delete-orphan"
    )


class ShareToken(Base):
    """One row per generated share link."""

    __tablename__ = "share_tokens"

    token: Mapped[str] = mapped_column(String, primary_key=True)
    model_id: Mapped[str] = mapped_column(
        String, ForeignKey("model_uploads.id", ondelete="CASCADE"), nullable=False
    )
    # Human-readable name shown to recipients
    model_name: Mapped[str] = mapped_column(String, nullable=False)
    # Copied from ModelUpload for quick access without a join
    model_format: Mapped[str] = mapped_column(String, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    # SHA-256 hex hash of the password; null means no password required
    password_hash: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    watermark_text: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    access_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    model: Mapped["ModelUpload"] = relationship("ModelUpload", back_populates="shares")
