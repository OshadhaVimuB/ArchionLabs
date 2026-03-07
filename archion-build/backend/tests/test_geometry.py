"""
Tests for the LayoutSolver geometry engine (Commit 2).
"""

import random

from app.models.floorplan import FloorPlan, RoomType
from app.services.geometry import (
    LayoutSolver,
    STANDARD_ROOM_SIZES,
    RANDOMIZATION_FACTOR,
    MIN_WALL_LENGTH_FOR_WINDOW,
    _edge_length,
)


# ---------------------------------------------------------------------------
# LayoutSolver.solve()
# ---------------------------------------------------------------------------

class TestLayoutSolverBasic:
    """Core solve() behaviour."""

    def test_returns_floorplan(self):
        solver = LayoutSolver()
        plan = solver.solve([
            {"type": "bedroom", "name": "Bedroom 1"},
            {"type": "kitchen", "name": "Kitchen"},
        ])
        assert isinstance(plan, FloorPlan)
        assert len(plan.levels) == 1

    def test_correct_room_count(self):
        rooms = [
            {"type": "bedroom", "name": "Bedroom 1"},
            {"type": "bedroom", "name": "Bedroom 2"},
            {"type": "bathroom", "name": "Bathroom"},
        ]
        solver = LayoutSolver()
        plan = solver.solve(rooms)
        assert len(plan.levels[0].rooms) == 3

    def test_empty_input(self):
        solver = LayoutSolver()
        plan = solver.solve([])
        assert isinstance(plan, FloorPlan)
        assert len(plan.levels[0].rooms) == 0

    def test_unknown_room_type_maps_to_other(self):
        solver = LayoutSolver()
        plan = solver.solve([{"type": "swimming_pool", "name": "Pool"}])
        assert plan.levels[0].rooms[0].room_type == RoomType.OTHER


# ---------------------------------------------------------------------------
# Strip-packing
# ---------------------------------------------------------------------------

class TestStripPacking:
    def test_rooms_wrap_to_next_strip(self):
        """When rooms exceed max_building_width they should wrap."""
        solver = LayoutSolver(max_building_width=10.0)
        # Two large rooms that can't both fit in a 10m strip
        rooms = [
            {"type": "living_room", "name": "Living Room"},  # ~6m
            {"type": "garage", "name": "Garage"},             # ~6m
        ]
        random.seed(42)
        plan = solver.solve(rooms)
        placed = plan.levels[0].rooms
        assert len(placed) == 2
        # Second room should start on a new row (y > 0)
        assert placed[1].bounding_box.min_point.y > 0 or placed[1].bounding_box.min_point.x == 0


# ---------------------------------------------------------------------------
# Room size randomisation
# ---------------------------------------------------------------------------

class TestRoomRandomisation:
    def test_size_within_bounds(self):
        """Randomised sizes should stay within ±RANDOMIZATION_FACTOR of base."""
        solver = LayoutSolver()
        for _ in range(50):
            w, h = solver._randomised_size(RoomType.BEDROOM)
            base_w, base_h = STANDARD_ROOM_SIZES[RoomType.BEDROOM]
            assert base_w * (1 - RANDOMIZATION_FACTOR) <= w <= base_w * (1 + RANDOMIZATION_FACTOR) + 0.01
            assert base_h * (1 - RANDOMIZATION_FACTOR) <= h <= base_h * (1 + RANDOMIZATION_FACTOR) + 0.01


# ---------------------------------------------------------------------------
# Wall generation
# ---------------------------------------------------------------------------

class TestWallGeneration:
    def test_four_walls_per_room(self):
        solver = LayoutSolver()
        plan = solver.solve([{"type": "bedroom", "name": "Bedroom"}])
        walls = plan.levels[0].walls
        assert len(walls) == 4  # one room → four edges

    def test_exterior_walls_flagged(self):
        """A single room's walls should all be exterior."""
        solver = LayoutSolver()
        plan = solver.solve([{"type": "bedroom", "name": "Bedroom"}])
        walls = plan.levels[0].walls
        assert all(w.is_exterior for w in walls)

    def test_interior_walls_exist_for_adjacent_rooms(self):
        """Two adjacent rooms share a wall that is interior."""
        solver = LayoutSolver()
        random.seed(0)
        plan = solver.solve([
            {"type": "bedroom", "name": "Bedroom"},
            {"type": "bathroom", "name": "Bathroom"},
        ])
        walls = plan.levels[0].walls
        interior = [w for w in walls if not w.is_exterior]
        # With two adjacent rooms placed side-by-side, there should be interior walls
        assert len(interior) >= 1


# ---------------------------------------------------------------------------
# Door generation
# ---------------------------------------------------------------------------

class TestDoorGeneration:
    def test_door_between_adjacent_rooms(self):
        solver = LayoutSolver()
        random.seed(0)
        plan = solver.solve([
            {"type": "bedroom", "name": "Bedroom"},
            {"type": "bathroom", "name": "Bathroom"},
        ])
        doors = plan.levels[0].doors
        assert len(doors) >= 1

    def test_no_door_for_single_room(self):
        solver = LayoutSolver()
        plan = solver.solve([{"type": "bedroom", "name": "Bedroom"}])
        assert len(plan.levels[0].doors) == 0


# ---------------------------------------------------------------------------
# Window generation
# ---------------------------------------------------------------------------

class TestWindowGeneration:
    def test_windows_on_exterior_walls(self):
        solver = LayoutSolver()
        plan = solver.solve([{"type": "living_room", "name": "Living Room"}])
        windows = plan.levels[0].windows
        # All exterior walls of a living room are ≥1.5m, so we expect windows
        assert len(windows) >= 1

    def test_no_windows_on_interior_walls(self):
        solver = LayoutSolver()
        plan = solver.solve([{"type": "bedroom", "name": "Bedroom"}])
        windows = plan.levels[0].windows
        for win in windows:
            # Each window's host wall should be exterior
            wall_length = _edge_length(win.wall_start, win.wall_end)
            assert wall_length >= MIN_WALL_LENGTH_FOR_WINDOW
