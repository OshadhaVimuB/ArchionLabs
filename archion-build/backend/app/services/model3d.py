"""
3D Model Generation Service.

Provides functions to translate a 2D ``FloorPlan`` into:
1. A Three.js-consumable JSON representation (meshes, positions, colours).
2. A CadQuery Python script for offline CAD export (STEP / STL).
"""

from typing import Any, Dict, List

from app.models.floorplan import FloorPlan, Level, Room, Wall, Door, Window

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

WALL_HEIGHT = 2.8          # metres (floor-to-ceiling)
FLOOR_THICKNESS = 0.05     # metres
DOOR_HEIGHT = 2.1          # metres
WINDOW_HEIGHT = 1.2        # metres
WINDOW_BOTTOM = 0.9        # metres above floor
WALL_THICKNESS_EXT = 0.20  # metres – exterior walls
WALL_THICKNESS_INT = 0.15  # metres – interior walls

# Per-room-type colours (hex strings)
ROOM_COLORS: Dict[str, str] = {
    "living_room": "#3b82f6",
    "bedroom":     "#8b5cf6",
    "bathroom":    "#06b6d4",
    "kitchen":     "#f59e0b",
    "dining_room": "#10b981",
    "garage":      "#6b7280",
    "hallway":     "#a78bfa",
    "closet":      "#78716c",
    "laundry":     "#14b8a6",
    "office":      "#6366f1",
    "balcony":     "#22d3ee",
    "entrance":    "#f97316",
    "storage":     "#9ca3af",
    "other":       "#64748b",
}

WALL_COLOR = "#e2e8f0"
DOOR_COLOR = "#facc15"
WINDOW_COLOR = "#38bdf8"


# ======================================================================
# Three.js JSON Generator
# ======================================================================


def generate_threejs_json(plan: FloorPlan) -> Dict[str, Any]:
    """
    Convert a ``FloorPlan`` into a JSON-serialisable dict describing every
    3D mesh needed by the frontend ``Viewer3D`` component.

    Returns::

        {
            "metadata": { ... },
            "meshes": [
                {
                    "id": "floor-0",
                    "type": "floor",
                    "position": [x, y, z],
                    "dimensions": [w, h, d],
                    "rotation": [rx, ry, rz],
                    "color": "#3b82f6",
                    "opacity": 1.0,
                    "label": "Living Room",
                },
                ...
            ]
        }
    """
    meshes: List[Dict[str, Any]] = []

    for level in plan.levels:
        level_y = level.level_number * WALL_HEIGHT
        meshes.extend(_floor_meshes(level, level_y))
        meshes.extend(_wall_meshes(level, level_y))
        meshes.extend(_door_meshes(level, level_y))
        meshes.extend(_window_meshes(level, level_y))

    return {
        "metadata": {
            "name": plan.name,
            "total_area": plan.total_area,
            "width": plan.width,
            "height": plan.height,
            "wall_height": WALL_HEIGHT,
        },
        "meshes": meshes,
    }


# -- Floor tiles -----------------------------------------------------------

def _floor_meshes(level: Level, base_y: float) -> List[Dict[str, Any]]:
    meshes: List[Dict[str, Any]] = []
    for i, room in enumerate(level.rooms):
        bb = room.bounding_box
        w = bb.max_point.x - bb.min_point.x
        d = bb.max_point.y - bb.min_point.y
        cx = bb.min_point.x + w / 2
        cz = bb.min_point.y + d / 2
        color = ROOM_COLORS.get(room.room_type.value, ROOM_COLORS["other"])
        meshes.append({
            "id": f"floor-L{level.level_number}-{i}",
            "type": "floor",
            "position": [round(cx, 3), round(base_y + FLOOR_THICKNESS / 2, 3), round(cz, 3)],
            "dimensions": [round(w, 3), FLOOR_THICKNESS, round(d, 3)],
            "rotation": [0, 0, 0],
            "color": color,
            "opacity": 0.85,
            "label": room.name,
        })
    return meshes


# -- Walls -----------------------------------------------------------------

def _wall_meshes(level: Level, base_y: float) -> List[Dict[str, Any]]:
    meshes: List[Dict[str, Any]] = []
    for i, wall in enumerate(level.walls):
        sx, sy = wall.start.x, wall.start.y
        ex, ey = wall.end.x, wall.end.y
        dx = ex - sx
        dy = ey - sy
        length = (dx ** 2 + dy ** 2) ** 0.5
        if length < 0.01:
            continue

        thickness = WALL_THICKNESS_EXT if wall.is_exterior else WALL_THICKNESS_INT
        cx = (sx + ex) / 2
        cz = (sy + ey) / 2
        cy = base_y + WALL_HEIGHT / 2

        # Determine rotation around Y axis
        import math
        angle = math.atan2(dy, dx)

        meshes.append({
            "id": f"wall-L{level.level_number}-{i}",
            "type": "wall",
            "position": [round(cx, 3), round(cy, 3), round(cz, 3)],
            "dimensions": [round(length, 3), round(WALL_HEIGHT, 3), round(thickness, 3)],
            "rotation": [0, round(-angle, 4), 0],
            "color": WALL_COLOR,
            "opacity": 0.9,
            "is_exterior": wall.is_exterior,
        })
    return meshes


# -- Doors -----------------------------------------------------------------

def _door_meshes(level: Level, base_y: float) -> List[Dict[str, Any]]:
    meshes: List[Dict[str, Any]] = []
    for i, door in enumerate(level.doors):
        sx, sy = door.wall_start.x, door.wall_start.y
        ex, ey = door.wall_end.x, door.wall_end.y
        dx = ex - sx
        dy = ey - sy

        import math
        angle = math.atan2(dy, dx)

        meshes.append({
            "id": f"door-L{level.level_number}-{i}",
            "type": "door",
            "position": [
                round(door.position.x, 3),
                round(base_y + DOOR_HEIGHT / 2, 3),
                round(door.position.y, 3),
            ],
            "dimensions": [round(door.width, 3), round(DOOR_HEIGHT, 3), 0.08],
            "rotation": [0, round(-angle, 4), 0],
            "color": DOOR_COLOR,
            "opacity": 0.7,
        })
    return meshes


# -- Windows ---------------------------------------------------------------

def _window_meshes(level: Level, base_y: float) -> List[Dict[str, Any]]:
    meshes: List[Dict[str, Any]] = []
    for i, win in enumerate(level.windows):
        sx, sy = win.wall_start.x, win.wall_start.y
        ex, ey = win.wall_end.x, win.wall_end.y
        dx = ex - sx
        dy = ey - sy

        import math
        angle = math.atan2(dy, dx)

        meshes.append({
            "id": f"window-L{level.level_number}-{i}",
            "type": "window",
            "position": [
                round(win.position.x, 3),
                round(base_y + WINDOW_BOTTOM + WINDOW_HEIGHT / 2, 3),
                round(win.position.y, 3),
            ],
            "dimensions": [round(win.width, 3), round(WINDOW_HEIGHT, 3), 0.05],
            "rotation": [0, round(-angle, 4), 0],
            "color": WINDOW_COLOR,
            "opacity": 0.35,
        })
    return meshes


# ======================================================================
# CadQuery Script Generator
# ======================================================================


def generate_cadquery_script(plan: FloorPlan) -> str:
    """
    Emit a standalone CadQuery Python script that recreates the floor plan
    as solid 3D geometry and exports it to STEP format.

    The generated script can be run offline::

        pip install cadquery
        python generated_script.py

    Returns the script as a string.
    """
    lines: List[str] = [
        '"""',
        f"CadQuery script for: {plan.name}",
        "Auto-generated by Archion Build.",
        '"""',
        "",
        "import cadquery as cq",
        "",
        "# ---------------------------------------------------------------------------",
        "# Constants",
        "# ---------------------------------------------------------------------------",
        f"WALL_HEIGHT = {WALL_HEIGHT}",
        f"FLOOR_THICKNESS = {FLOOR_THICKNESS}",
        f"DOOR_HEIGHT = {DOOR_HEIGHT}",
        f"WINDOW_HEIGHT = {WINDOW_HEIGHT}",
        f"WINDOW_BOTTOM = {WINDOW_BOTTOM}",
        "",
        "result = cq.Assembly()",
        "",
    ]

    for level in plan.levels:
        base_y = level.level_number * WALL_HEIGHT
        lines.append(f"# --- Level {level.level_number}: {level.name} ---")
        lines.append("")

        # Floor tiles
        for i, room in enumerate(level.rooms):
            bb = room.bounding_box
            w = round(bb.max_point.x - bb.min_point.x, 3)
            d = round(bb.max_point.y - bb.min_point.y, 3)
            cx = round(bb.min_point.x + w / 2, 3)
            cz = round(bb.min_point.y + d / 2, 3)
            var = f"floor_{level.level_number}_{i}"
            lines.append(f"# Floor: {room.name}")
            lines.append(
                f"{var} = cq.Workplane('XY')"
                f".box({w}, {d}, {FLOOR_THICKNESS})"
                f".translate(({cx}, {cz}, {round(base_y + FLOOR_THICKNESS / 2, 3)}))"
            )
            lines.append(f'result.add({var}, name="{var}")')
            lines.append("")

        # Walls
        for i, wall in enumerate(level.walls):
            sx, sy = wall.start.x, wall.start.y
            ex, ey = wall.end.x, wall.end.y
            dx = ex - sx
            dy = ey - sy
            length = round((dx ** 2 + dy ** 2) ** 0.5, 3)
            if length < 0.01:
                continue
            thickness = WALL_THICKNESS_EXT if wall.is_exterior else WALL_THICKNESS_INT
            cx = round((sx + ex) / 2, 3)
            cz = round((sy + ey) / 2, 3)
            cy = round(base_y + WALL_HEIGHT / 2, 3)

            import math
            angle_deg = round(math.degrees(math.atan2(dy, dx)), 2)
            var = f"wall_{level.level_number}_{i}"

            lines.append(f"# Wall {i} ({'exterior' if wall.is_exterior else 'interior'})")
            lines.append(
                f"{var} = cq.Workplane('XY')"
                f".box({length}, {thickness}, {WALL_HEIGHT})"
                f".rotate((0,0,0), (0,0,1), {angle_deg})"
                f".translate(({cx}, {cz}, {cy}))"
            )
            lines.append(f'result.add({var}, name="{var}")')
            lines.append("")

    lines.extend([
        "# ---------------------------------------------------------------------------",
        "# Export",
        "# ---------------------------------------------------------------------------",
        'result.save("archion_floorplan.step")',
        'print("Exported to archion_floorplan.step")',
        "",
    ])

    return "\n".join(lines)
