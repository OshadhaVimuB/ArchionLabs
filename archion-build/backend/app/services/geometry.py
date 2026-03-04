"""
Architectural Geometry Engine — LayoutSolver

Algorithmically generates structured FloorPlan objects from room requirements
using a strip-packing placement algorithm with post-processing for walls,
doors, and windows.
"""

import random
from typing import Dict, List, Tuple, Optional

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
# Standard room sizes (width, height) in meters
# ---------------------------------------------------------------------------
STANDARD_ROOM_SIZES: Dict[RoomType, Tuple[float, float]] = {
    RoomType.LIVING_ROOM: (6.0, 5.0),
    RoomType.BEDROOM:     (4.0, 4.0),
    RoomType.BATHROOM:    (2.5, 3.0),
    RoomType.KITCHEN:     (3.5, 4.0),
    RoomType.DINING_ROOM: (4.0, 4.5),
    RoomType.GARAGE:      (6.0, 6.0),
    RoomType.HALLWAY:     (2.0, 4.0),
    RoomType.CLOSET:      (1.5, 2.0),
    RoomType.LAUNDRY:     (2.5, 2.5),
    RoomType.OFFICE:      (3.5, 3.5),
    RoomType.BALCONY:     (3.0, 1.5),
    RoomType.ENTRANCE:    (2.5, 2.5),
    RoomType.STORAGE:     (2.0, 2.0),
    RoomType.OTHER:       (3.0, 3.0),
}

# Priority tiers determine placement order (lower number = placed first)
PRIORITY_TIERS: Dict[RoomType, int] = {
    RoomType.LIVING_ROOM: 1,
    RoomType.KITCHEN:     1,
    RoomType.DINING_ROOM: 1,
    RoomType.BEDROOM:     2,
    RoomType.OFFICE:      2,
    RoomType.BATHROOM:    3,
    RoomType.CLOSET:      3,
    RoomType.LAUNDRY:     3,
    RoomType.HALLWAY:     3,
    RoomType.STORAGE:     3,
    RoomType.GARAGE:      2,
    RoomType.BALCONY:     3,
    RoomType.ENTRANCE:    1,
    RoomType.OTHER:       3,
}

# Layout constraints
DEFAULT_MAX_BUILDING_WIDTH = 20.0   # metres
WALL_THICKNESS = 0.15               # metres
DOOR_WIDTH = 0.9                    # metres
WINDOW_WIDTH = 1.2                  # metres
MIN_WALL_LENGTH_FOR_WINDOW = 1.5    # metres
RANDOMIZATION_FACTOR = 0.15         # ±15 %


class LayoutSolver:
    """
    Takes a list of room requirement dicts and produces a fully populated
    ``FloorPlan`` object with rooms, walls, doors, and windows.

    Usage::

        solver = LayoutSolver()
        plan = solver.solve([
            {"type": "living_room", "name": "Living Room"},
            {"type": "bedroom",     "name": "Bedroom 1"},
        ])
    """

    def __init__(self, max_building_width: float = DEFAULT_MAX_BUILDING_WIDTH):
        self.max_building_width = max_building_width

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def solve(self, rooms: List[dict]) -> FloorPlan:
        """
        Generate a complete ``FloorPlan`` from a list of room requirements.

        Each dict in *rooms* must contain at minimum:
        - ``type``  — a valid ``RoomType`` value string (e.g. ``"bedroom"``)
        - ``name``  — a display name (e.g. ``"Bedroom 1"``)
        """
        # 1. Parse input into (RoomType, name) tuples
        parsed = self._parse_room_specs(rooms)

        # 2. Sort by priority tier
        parsed.sort(key=lambda r: PRIORITY_TIERS.get(r[0], 99))

        # 3. Compute randomised dimensions for each room
        room_dims: List[Tuple[RoomType, str, float, float]] = []
        for room_type, name in parsed:
            w, h = self._randomised_size(room_type)
            room_dims.append((room_type, name, w, h))

        # 4. Place rooms using strip-packing
        placed_rooms = self._strip_pack(room_dims)

        # 5. Post-process: walls, doors, windows
        building_bbox = self._compute_building_bbox(placed_rooms)
        walls = self._generate_walls(placed_rooms, building_bbox)
        doors = self._generate_doors(placed_rooms)
        windows = self._generate_windows(walls)

        # 6. Assemble the FloorPlan
        level = Level(
            level_number=0,
            name="Ground Floor",
            rooms=placed_rooms,
            walls=walls,
            doors=doors,
            windows=windows,
        )

        plan = FloorPlan(
            name="Generated Floor Plan",
            levels=[level],
            width=building_bbox.width,
            height=building_bbox.height,
        )

        return plan

    # ------------------------------------------------------------------
    # Input parsing
    # ------------------------------------------------------------------

    @staticmethod
    def _parse_room_specs(rooms: List[dict]) -> List[Tuple[RoomType, str]]:
        """Convert raw dicts to ``(RoomType, name)`` tuples."""
        parsed: List[Tuple[RoomType, str]] = []
        for spec in rooms:
            raw_type = spec.get("type", "other")
            name = spec.get("name", raw_type.replace("_", " ").title())
            try:
                room_type = RoomType(raw_type)
            except ValueError:
                room_type = RoomType.OTHER
            parsed.append((room_type, name))
        return parsed

    # ------------------------------------------------------------------
    # Dimension randomisation
    # ------------------------------------------------------------------

    @staticmethod
    def _randomised_size(room_type: RoomType) -> Tuple[float, float]:
        """Return base size ± up to ``RANDOMIZATION_FACTOR`` variation."""
        base_w, base_h = STANDARD_ROOM_SIZES.get(room_type, (3.0, 3.0))
        factor_w = 1.0 + random.uniform(-RANDOMIZATION_FACTOR, RANDOMIZATION_FACTOR)
        factor_h = 1.0 + random.uniform(-RANDOMIZATION_FACTOR, RANDOMIZATION_FACTOR)
        return round(base_w * factor_w, 2), round(base_h * factor_h, 2)

    # ------------------------------------------------------------------
    # Strip-packing placement
    # ------------------------------------------------------------------

    def _strip_pack(
        self, room_dims: List[Tuple[RoomType, str, float, float]]
    ) -> List[Room]:
        """
        Place rooms left-to-right in horizontal strips.

        When the accumulated width in the current strip exceeds
        ``self.max_building_width``, a new strip row is started below the
        current one.
        """
        placed: List[Room] = []
        cursor_x = 0.0
        cursor_y = 0.0
        strip_max_height = 0.0

        for room_type, name, w, h in room_dims:
            # Start a new strip if this room would exceed the max width
            if cursor_x + w > self.max_building_width and cursor_x > 0:
                cursor_y += strip_max_height
                cursor_x = 0.0
                strip_max_height = 0.0

            bbox = BoundingBox(
                min_point=Point2D(x=round(cursor_x, 2), y=round(cursor_y, 2)),
                max_point=Point2D(x=round(cursor_x + w, 2), y=round(cursor_y + h, 2)),
            )

            room = Room(
                name=name,
                room_type=room_type,
                bounding_box=bbox,
            )
            placed.append(room)

            cursor_x += w
            strip_max_height = max(strip_max_height, h)

        return placed

    # ------------------------------------------------------------------
    # Building bounding box
    # ------------------------------------------------------------------

    @staticmethod
    def _compute_building_bbox(rooms: List[Room]) -> BoundingBox:
        """Return the overall bounding box enclosing all rooms."""
        if not rooms:
            return BoundingBox(
                min_point=Point2D(x=0, y=0),
                max_point=Point2D(x=0, y=0),
            )
        min_x = min(r.bounding_box.min_point.x for r in rooms)
        min_y = min(r.bounding_box.min_point.y for r in rooms)
        max_x = max(r.bounding_box.max_point.x for r in rooms)
        max_y = max(r.bounding_box.max_point.y for r in rooms)
        return BoundingBox(
            min_point=Point2D(x=min_x, y=min_y),
            max_point=Point2D(x=max_x, y=max_y),
        )

    # ------------------------------------------------------------------
    # Wall generation
    # ------------------------------------------------------------------

    @staticmethod
    def _generate_walls(
        rooms: List[Room], building_bbox: BoundingBox
    ) -> List[Wall]:
        """
        Generate four wall segments per room.

        Walls that lie on the overall building boundary are marked as exterior.
        """
        walls: List[Wall] = []
        bmin = building_bbox.min_point
        bmax = building_bbox.max_point
        eps = 0.01  # tolerance for floating point comparison

        for room in rooms:
            rmin = room.bounding_box.min_point
            rmax = room.bounding_box.max_point

            # Four edges: bottom, top, left, right
            edges = [
                (Point2D(x=rmin.x, y=rmin.y), Point2D(x=rmax.x, y=rmin.y)),  # bottom
                (Point2D(x=rmin.x, y=rmax.y), Point2D(x=rmax.x, y=rmax.y)),  # top
                (Point2D(x=rmin.x, y=rmin.y), Point2D(x=rmin.x, y=rmax.y)),  # left
                (Point2D(x=rmax.x, y=rmin.y), Point2D(x=rmax.x, y=rmax.y)),  # right
            ]

            for start, end in edges:
                is_exterior = _is_exterior_edge(start, end, bmin, bmax, eps)
                walls.append(
                    Wall(
                        start=start,
                        end=end,
                        thickness=WALL_THICKNESS,
                        is_exterior=is_exterior,
                    )
                )

        return walls

    # ------------------------------------------------------------------
    # Door generation
    # ------------------------------------------------------------------

    @staticmethod
    def _generate_doors(rooms: List[Room]) -> List[Door]:
        """
        Insert a door between every pair of adjacent rooms that share a
        collinear wall edge.
        """
        doors: List[Door] = []
        seen_pairs: set = set()

        for i, room_a in enumerate(rooms):
            for j, room_b in enumerate(rooms):
                if i >= j:
                    continue
                pair_key = (i, j)
                if pair_key in seen_pairs:
                    continue

                shared = _shared_edge_segment(room_a, room_b)
                if shared is None:
                    continue

                seen_pairs.add(pair_key)
                start, end = shared
                mid = Point2D(
                    x=round((start.x + end.x) / 2, 2),
                    y=round((start.y + end.y) / 2, 2),
                )
                doors.append(
                    Door(
                        position=mid,
                        width=DOOR_WIDTH,
                        wall_start=start,
                        wall_end=end,
                        is_exterior=False,
                    )
                )

        return doors

    # ------------------------------------------------------------------
    # Window generation
    # ------------------------------------------------------------------

    @staticmethod
    def _generate_windows(walls: List[Wall]) -> List[Window]:
        """
        Place a window on every exterior wall that is long enough.
        """
        windows: List[Window] = []
        for wall in walls:
            if not wall.is_exterior:
                continue
            length = _edge_length(wall.start, wall.end)
            if length < MIN_WALL_LENGTH_FOR_WINDOW:
                continue
            mid = Point2D(
                x=round((wall.start.x + wall.end.x) / 2, 2),
                y=round((wall.start.y + wall.end.y) / 2, 2),
            )
            windows.append(
                Window(
                    position=mid,
                    width=WINDOW_WIDTH,
                    wall_start=wall.start,
                    wall_end=wall.end,
                )
            )
        return windows


# ======================================================================
# Module-level helper functions
# ======================================================================


def _is_exterior_edge(
    start: Point2D,
    end: Point2D,
    bmin: Point2D,
    bmax: Point2D,
    eps: float,
) -> bool:
    """Return ``True`` if the edge lies on the building boundary."""
    # Horizontal edge on the bottom or top boundary
    if abs(start.y - end.y) < eps:
        if abs(start.y - bmin.y) < eps or abs(start.y - bmax.y) < eps:
            return True
    # Vertical edge on the left or right boundary
    if abs(start.x - end.x) < eps:
        if abs(start.x - bmin.x) < eps or abs(start.x - bmax.x) < eps:
            return True
    return False


def _edge_length(a: Point2D, b: Point2D) -> float:
    """Return the Euclidean length of an edge."""
    return ((b.x - a.x) ** 2 + (b.y - a.y) ** 2) ** 0.5


def _shared_edge_segment(
    room_a: Room, room_b: Room
) -> Optional[Tuple[Point2D, Point2D]]:
    """
    Return the shared collinear wall segment between two axis-aligned rooms,
    or ``None`` if they don't share one.

    Two rooms share an edge when one room's boundary coordinate matches
    another's and their perpendicular ranges overlap.
    """
    a = room_a.bounding_box
    b = room_b.bounding_box
    eps = 0.01

    # Room A's right edge == Room B's left edge (vertical shared wall)
    if abs(a.max_point.x - b.min_point.x) < eps:
        overlap = _range_overlap(
            a.min_point.y, a.max_point.y, b.min_point.y, b.max_point.y
        )
        if overlap:
            x = a.max_point.x
            return Point2D(x=x, y=overlap[0]), Point2D(x=x, y=overlap[1])

    # Room A's left edge == Room B's right edge
    if abs(a.min_point.x - b.max_point.x) < eps:
        overlap = _range_overlap(
            a.min_point.y, a.max_point.y, b.min_point.y, b.max_point.y
        )
        if overlap:
            x = a.min_point.x
            return Point2D(x=x, y=overlap[0]), Point2D(x=x, y=overlap[1])

    # Room A's top edge == Room B's bottom edge (horizontal shared wall)
    if abs(a.max_point.y - b.min_point.y) < eps:
        overlap = _range_overlap(
            a.min_point.x, a.max_point.x, b.min_point.x, b.max_point.x
        )
        if overlap:
            y = a.max_point.y
            return Point2D(x=overlap[0], y=y), Point2D(x=overlap[1], y=y)

    # Room A's bottom edge == Room B's top edge
    if abs(a.min_point.y - b.max_point.y) < eps:
        overlap = _range_overlap(
            a.min_point.x, a.max_point.x, b.min_point.x, b.max_point.x
        )
        if overlap:
            y = a.min_point.y
            return Point2D(x=overlap[0], y=y), Point2D(x=overlap[1], y=y)

    return None


def _range_overlap(
    a_min: float, a_max: float, b_min: float, b_max: float
) -> Optional[Tuple[float, float]]:
    """
    Return the overlapping sub-range ``(lo, hi)`` of two 1-D intervals,
    or ``None`` if they don't overlap.
    """
    lo = max(a_min, b_min)
    hi = min(a_max, b_max)
    if hi - lo > 0.01:
        return (round(lo, 2), round(hi, 2))
    return None
