"""
Tests for Pydantic models (Commit 1).
"""

from app.models.floorplan import (
    BoundingBox,
    Door,
    FloorPlan,
    Level,
    Point2D,
    Room,
    RoomType,
    Wall,
    Window,
)


# ---------------------------------------------------------------------------
# Point2D
# ---------------------------------------------------------------------------

class TestPoint2D:
    def test_creation(self):
        p = Point2D(x=1.5, y=2.5)
        assert p.x == 1.5
        assert p.y == 2.5


# ---------------------------------------------------------------------------
# BoundingBox
# ---------------------------------------------------------------------------

class TestBoundingBox:
    def test_computed_properties(self):
        bb = BoundingBox(
            min_point=Point2D(x=0, y=0),
            max_point=Point2D(x=4, y=3),
        )
        assert bb.width == 4.0
        assert bb.height == 3.0
        assert bb.area == 12.0

    def test_zero_area(self):
        bb = BoundingBox(
            min_point=Point2D(x=5, y=5),
            max_point=Point2D(x=5, y=5),
        )
        assert bb.area == 0.0


# ---------------------------------------------------------------------------
# Wall
# ---------------------------------------------------------------------------

class TestWall:
    def test_defaults(self):
        w = Wall(
            start=Point2D(x=0, y=0),
            end=Point2D(x=4, y=0),
        )
        assert w.thickness == 0.15
        assert w.is_exterior is False

    def test_exterior_wall(self):
        w = Wall(
            start=Point2D(x=0, y=0),
            end=Point2D(x=4, y=0),
            is_exterior=True,
        )
        assert w.is_exterior is True


# ---------------------------------------------------------------------------
# Door / Window
# ---------------------------------------------------------------------------

class TestDoor:
    def test_defaults(self):
        d = Door(
            position=Point2D(x=2, y=0),
            wall_start=Point2D(x=0, y=0),
            wall_end=Point2D(x=4, y=0),
        )
        assert d.width == 0.9
        assert d.is_exterior is False


class TestWindow:
    def test_defaults(self):
        w = Window(
            position=Point2D(x=2, y=0),
            wall_start=Point2D(x=0, y=0),
            wall_end=Point2D(x=4, y=0),
        )
        assert w.width == 1.2


# ---------------------------------------------------------------------------
# Room
# ---------------------------------------------------------------------------

class TestRoom:
    def test_auto_area_from_bbox(self):
        room = Room(
            name="Bedroom",
            room_type=RoomType.BEDROOM,
            bounding_box=BoundingBox(
                min_point=Point2D(x=0, y=0),
                max_point=Point2D(x=4, y=4),
            ),
        )
        assert room.area == 16.0

    def test_explicit_area(self):
        room = Room(
            name="Office",
            room_type=RoomType.OFFICE,
            bounding_box=BoundingBox(
                min_point=Point2D(x=0, y=0),
                max_point=Point2D(x=3, y=3),
            ),
            area=10.0,
        )
        assert room.area == 10.0


# ---------------------------------------------------------------------------
# RoomType enum
# ---------------------------------------------------------------------------

class TestRoomType:
    def test_all_values(self):
        expected = {
            "living_room", "bedroom", "bathroom", "kitchen",
            "dining_room", "garage", "hallway", "closet",
            "laundry", "office", "balcony", "entrance",
            "storage", "other",
        }
        actual = {rt.value for rt in RoomType}
        assert actual == expected


# ---------------------------------------------------------------------------
# FloorPlan
# ---------------------------------------------------------------------------

class TestFloorPlan:
    def test_auto_total_area(self):
        room1 = Room(
            name="Room A",
            room_type=RoomType.BEDROOM,
            bounding_box=BoundingBox(
                min_point=Point2D(x=0, y=0),
                max_point=Point2D(x=4, y=4),
            ),
        )
        room2 = Room(
            name="Room B",
            room_type=RoomType.KITCHEN,
            bounding_box=BoundingBox(
                min_point=Point2D(x=4, y=0),
                max_point=Point2D(x=7, y=4),
            ),
        )
        plan = FloorPlan(
            levels=[Level(rooms=[room1, room2])]
        )
        assert plan.total_area == 16.0 + 12.0

    def test_empty_plan(self):
        plan = FloorPlan()
        assert plan.levels == []
        assert plan.total_area is None
