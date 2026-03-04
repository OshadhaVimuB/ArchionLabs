"""
SQLAlchemy ORM models for database persistence.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, DateTime, Integer
from sqlalchemy.dialects.sqlite import JSON

from app.database import Base


def generate_uuid() -> str:
    """Generate a new UUID string."""
    return str(uuid.uuid4())


class Project(Base):
    """
    Represents a saved floor plan project.
    The floor plan data is stored as serialized JSON.
    """
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, default="Untitled Project")
    description = Column(Text, nullable=True)
    floorplan_data = Column(JSON, nullable=True)  # Serialized FloorPlan JSON
    share_id = Column(String(64), nullable=True, unique=True, index=True)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self):
        return f"<Project(id={self.id}, name={self.name})>"


class ChatHistory(Base):
    """
    Stores chat conversation history for design assistant interactions.
    """
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(String, nullable=False, index=True)
    role = Column(String(20), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    def __repr__(self):
        return f"<ChatHistory(id={self.id}, role={self.role})>"
