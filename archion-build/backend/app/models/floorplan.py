"""
Pydantic models for architectural floor plan primitives.

These models represent the single source of truth for all architectural
elements used throughout the application.
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum
import uuid


class RoomType(str, Enum):
    """Enumeration of supported room types."""
    LIVING_ROOM = "living_room"
    BEDROOM = "bedroom"
    BATHROOM = "bathroom"
    KITCHEN = "kitchen"
    DINING_ROOM = "dining_room"
    GARAGE = "garage"
    HALLWAY = "hallway"
    CLOSET = "closet"
    LAUNDRY = "laundry"
    OFFICE = "office"
    BALCONY = "balcony"
    ENTRANCE = "entrance"
    STORAGE = "storage"
    OTHER = "other"


class Point2D(BaseModel):
    """A 2D coordinate point."""
    x: float = Field(..., description="X coordinate in meters")
    y: float = Field(..., description="Y coordinate in meters")


class BoundingBox(BaseModel):
    """Axis-aligned bounding box defined by two corner points."""
    min_point: Point2D = Field(..., description="Bottom-left corner")
    max_point: Point2D = Field(..., description="Top-right corner")

    @property
    def width(self) -> float:
        return self.max_point.x - self.min_point.x

    @property
    def height(self) -> float:
        return self.max_point.y - self.min_point.y

    @property
    def area(self) -> float:
        return self.width * self.height


class Wall(BaseModel):
    """A wall segment between two points."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique ID for frontend selection")
    start: Point2D = Field(..., description="Wall start point")
    end: Point2D = Field(..., description="Wall end point")
    thickness: float = Field(default=0.15, description="Wall thickness in meters")
    is_exterior: bool = Field(default=False, description="Whether this is an exterior wall")


class Door(BaseModel):
    """A door placed on a wall."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique ID for frontend selection")
    position: Point2D = Field(..., description="Door center position")
    width: float = Field(default=0.9, description="Door width in meters")
    wall_start: Point2D = Field(..., description="Start point of the host wall")
    wall_end: Point2D = Field(..., description="End point of the host wall")
    is_exterior: bool = Field(default=False, description="Whether this is an exterior door")


class Window(BaseModel):
    """A window placed on an exterior wall."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique ID for frontend selection")
    position: Point2D = Field(..., description="Window center position")
    width: float = Field(default=1.2, description="Window width in meters")
    wall_start: Point2D = Field(..., description="Start point of the host wall")
    wall_end: Point2D = Field(..., description="End point of the host wall")


class Room(BaseModel):
    """A room defined by its bounding box and metadata."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique ID for frontend selection")
    name: str = Field(..., description="Room display name")
    room_type: RoomType = Field(..., description="Type of room")
    bounding_box: BoundingBox = Field(..., description="Room boundary")
    area: Optional[float] = Field(None, description="Room area in square meters")
    vertices: Optional[List[Point2D]] = Field(
        None, description="Optional polygon vertices for non-rectangular rooms"
    )

    def model_post_init(self, __context):
        """Calculate area from bounding box if not provided."""
        if self.area is None:
            self.area = self.bounding_box.area


class Level(BaseModel):
    """A single floor level containing rooms, walls, doors, and windows."""
    level_number: int = Field(default=0, description="Floor level number (0 = ground)")
    name: str = Field(default="Ground Floor", description="Level display name")
    height: float = Field(default=2.8, description="Floor-to-ceiling height in meters")
    rooms: List[Room] = Field(default_factory=list, description="Rooms on this level")
    walls: List[Wall] = Field(default_factory=list, description="Walls on this level")
    doors: List[Door] = Field(default_factory=list, description="Doors on this level")
    windows: List[Window] = Field(default_factory=list, description="Windows on this level")


class FloorPlan(BaseModel):
    """
    Unified floor plan object — the top-level data structure
    representing a complete architectural plan.
    """
    name: str = Field(default="Untitled Plan", description="Floor plan name")
    levels: List[Level] = Field(default_factory=list, description="Building levels")
    total_area: Optional[float] = Field(None, description="Total area in square meters")
    width: Optional[float] = Field(None, description="Overall width in meters")
    height: Optional[float] = Field(None, description="Overall depth in meters")
    metadata: Optional[dict] = Field(
        default_factory=dict, description="Additional metadata"
    )

    def model_post_init(self, __context):
        """Calculate total area from all levels if not provided."""
        if self.total_area is None and self.levels:
            self.total_area = sum(
                room.area for level in self.levels for room in level.rooms if room.area
            )
