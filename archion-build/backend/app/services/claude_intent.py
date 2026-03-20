"""
Natural Language Intent Parser for Archion Build.

Extracts room requirements from user text using:
1. Anthropic Claude (primary, when ANTHROPIC_API_KEY is set)
2. Regex-based keyword extraction (fallback)

Also provides:
- Vision-based floor plan extraction from images
- Direct LLM-based full floor plan generation
- Floor plan modification from existing plans
- Post-processing validation & repair
"""

import json
import logging
import math
import re
import uuid
from typing import List, Optional, Dict, Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Room keyword mappings for regex fallback
# ---------------------------------------------------------------------------
ROOM_KEYWORDS = {
    "living room": "living_room",
    "living": "living_room",
    "lounge": "living_room",
    "bedroom": "bedroom",
    "bed room": "bedroom",
    "bathroom": "bathroom",
    "bath room": "bathroom",
    "washroom": "bathroom",
    "restroom": "bathroom",
    "toilet": "bathroom",
    "kitchen": "kitchen",
    "dining room": "dining_room",
    "dining": "dining_room",
    "garage": "garage",
    "hallway": "hallway",
    "hall": "hallway",
    "corridor": "hallway",
    "closet": "closet",
    "walk-in closet": "closet",
    "laundry": "laundry",
    "laundry room": "laundry",
    "office": "office",
    "study": "office",
    "home office": "office",
    "balcony": "balcony",
    "patio": "balcony",
    "entrance": "entrance",
    "foyer": "entrance",
    "entryway": "entrance",
    "storage": "storage",
    "store room": "storage",
    "storeroom": "storage",
}

# Default room set when we can't extract anything meaningful
DEFAULT_ROOMS = [
    {"type": "living_room", "name": "Living Room"},
    {"type": "kitchen", "name": "Kitchen"},
    {"type": "bedroom", "name": "Bedroom 1"},
    {"type": "bathroom", "name": "Bathroom 1"},
]

# Valid room types for validation
VALID_ROOM_TYPES = {
    "living_room", "bedroom", "bathroom", "kitchen",
    "dining_room", "garage", "hallway", "closet",
    "laundry", "office", "balcony", "entrance",
    "storage", "other",
}

# Default aspect ratios per room type (width : height)
ROOM_ASPECT_RATIOS = {
    "living_room": (1.2, 1.0),
    "bedroom": (1.0, 1.0),
    "bathroom": (0.83, 1.0),
    "kitchen": (0.875, 1.0),
    "dining_room": (0.89, 1.0),
    "garage": (1.0, 1.0),
    "hallway": (0.5, 1.0),
    "closet": (0.75, 1.0),
    "laundry": (1.0, 1.0),
    "office": (1.0, 1.0),
    "balcony": (2.0, 1.0),
    "entrance": (1.0, 1.0),
    "storage": (1.0, 1.0),
    "other": (1.0, 1.0),
}

# System prompt for room-list extraction
SYSTEM_PROMPT = """You are an architectural intent parser. Given a user's description of a house or floor plan, extract the room requirements.

Return ONLY a valid JSON object with this exact structure:
{
  "rooms": [
    {"type": "<room_type>", "name": "<display_name>", "area_hint": <area_in_sqm_or_null>}
  ]
}

Valid room types are: living_room, bedroom, bathroom, kitchen, dining_room, garage, hallway, closet, laundry, office, balcony, entrance, storage, other.

Rules:
- If the user says "3 bedrooms", create 3 separate bedroom entries named "Bedroom 1", "Bedroom 2", "Bedroom 3".
- Always include an entrance unless the user explicitly says no entrance.
- If the user mentions a "house" without specifics, include at minimum: living room, kitchen, 1 bedroom, 1 bathroom, and entrance.
- Number duplicate rooms (e.g. "Bathroom 1", "Bathroom 2").
- If the user specifies a total area (e.g. "120m²"), distribute areas proportionally among rooms. Use these typical ratios:
  - Living room: ~25% of total area
  - Kitchen: ~12%
  - Each bedroom: ~12-15%
  - Each bathroom: ~5-6%
  - Hallway: ~8%
  - Entrance: ~4%
  - Other rooms: distribute remaining area
- If no total area is specified, set area_hint to null (the system will use standard sizes).
- Return ONLY the JSON object, no markdown, no explanation."""


# ---------------------------------------------------------------------------
# Full floor plan generation prompt (direct LLM → FloorPlan JSON)
# ---------------------------------------------------------------------------
FULL_GENERATION_PROMPT = """You are an expert architectural AI assistant. Generate a complete, accurate floor plan from the user's description.

CRITICAL DESIGN RULES:
1. Use REAL-WORLD METERS for all coordinates. Typical residential range: 0 to 25 meters.
2. All walls MUST be perfectly horizontal (start.y == end.y) or perfectly vertical (start.x == end.x). NO diagonal walls.
3. Rooms MUST tile together with shared walls — no gaps between adjacent rooms.
4. Every room MUST have 4 walls forming a closed rectangle.
5. Doors connect adjacent rooms — they MUST sit exactly on shared wall segments.
6. Windows go on EXTERIOR walls only.
7. There MUST be at least one exterior door on the Entrance room.

REALISTIC SIZE GUIDELINES (meters):
- Living room: 5×5 to 7×6
- Kitchen: 3×3.5 to 4×5
- Bedroom: 3.5×3.5 to 5×5
- Bathroom: 2×2.5 to 3×3.5
- Hallway: 1.5×3 to 2×6
- Entrance: 2×2 to 3×3
- Closet: 1.5×2 to 2×2.5
- Balcony: 2.5×1.5 to 4×2
- Office: 3×3 to 4×4
- Garage: 5×5 to 7×7
- Dining room: 3.5×4 to 5×5

LAYOUT STRATEGY:
- Arrange rooms in a compact rectangular footprint.
- Place public rooms (living, kitchen, dining, entrance) in the front/center.
- Place private rooms (bedrooms, bathrooms) together.
- Connect rooms logically with a hallway if there are many rooms.
- Total footprint should match the user's requested area if specified.

Return ONLY a valid JSON object with this structure:
{
  "name": "<descriptive plan name>",
  "total_area": <total_area_sqm>,
  "width": <overall_width_m>,
  "height": <overall_depth_m>,
  "metadata": {},
  "levels": [
    {
      "level_number": 0,
      "name": "Ground Floor",
      "height": 2.8,
      "rooms": [
        {
          "id": "room_<n>",
          "name": "Living Room",
          "room_type": "living_room",
          "bounding_box": { "min_point": { "x": 0, "y": 0 }, "max_point": { "x": 6, "y": 5 } },
          "area": 30,
          "vertices": null
        }
      ],
      "walls": [
        {
          "id": "wall_<n>",
          "start": { "x": 0, "y": 0 },
          "end": { "x": 6, "y": 0 },
          "thickness": 0.15,
          "is_exterior": true
        }
      ],
      "doors": [
        {
          "id": "door_<n>",
          "position": { "x": 3, "y": 0 },
          "width": 0.9,
          "wall_start": { "x": 0, "y": 0 },
          "wall_end": { "x": 6, "y": 0 },
          "is_exterior": true
        }
      ],
      "windows": [
        {
          "id": "window_<n>",
          "position": { "x": 3, "y": 5 },
          "width": 1.2,
          "wall_start": { "x": 0, "y": 5 },
          "wall_end": { "x": 6, "y": 5 }
        }
      ],
      "texts": [],
      "furniture": []
    }
  ]
}

CRITICAL RULES:
- room_type MUST be one of: living_room, bedroom, bathroom, kitchen, dining_room, garage, hallway, closet, laundry, office, balcony, entrance, storage, other.
- ALL coordinates in real-world meters (0 to ~25m range).
- Walls generated from room bounding boxes — 4 walls per room, shared walls between adjacent rooms can be listed once.
- Doors MUST have position on a wall, with wall_start and wall_end matching actual wall endpoints.
- Windows on exterior walls at their midpoints.
- Return ONLY the JSON. No markdown, no explanation. Start with { and end with }."""


class IntentParser:
    """
    Parses natural language descriptions into room requirement lists
    compatible with ``LayoutSolver.solve()``, and provides direct
    full floor plan generation capabilities.
    """

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key
        self.model = model or "claude-3-5-haiku-20241022"
        self._anthropic_client = None

    def _get_anthropic_client(self):
        """Lazily initialise the Anthropic client."""
        if self._anthropic_client is None and self.api_key:
            try:
                import anthropic
                self._anthropic_client = anthropic.Anthropic(api_key=self.api_key)
            except ImportError:
                logger.warning("anthropic package not installed — falling back to regex parser")
                self._anthropic_client = None
            except Exception as e:
                logger.warning(f"Failed to initialise Anthropic client: {e}")
                self._anthropic_client = None
        return self._anthropic_client

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def parse(self, prompt: str) -> List[dict]:
        """
        Extract room requirements from a natural language prompt.

        Returns a list of dicts like ``[{"type": "bedroom", "name": "Bedroom 1", "area_hint": 16}, ...]``
        """
        if not prompt or not prompt.strip():
            logger.info("Empty prompt received — returning default rooms")
            return DEFAULT_ROOMS.copy()

        # Try LLM first if API key is available
        if self.api_key:
            result = self._parse_with_llm(prompt)
            if result:
                return result

        # Fallback to regex-based parsing
        result = self._parse_with_regex(prompt)
        return result if result else DEFAULT_ROOMS.copy()

    def generate_full_floorplan(self, prompt: str) -> Optional[dict]:
        """
        Generate a complete floor plan JSON directly from the LLM.
        Returns a validated & repaired FloorPlan dict, or None on failure.
        """
        client = self._get_anthropic_client()
        if client is None:
            return None

        try:
            logger.info("Generating full floor plan directly with Claude LLM...")
            response = client.messages.create(
                model=self.model,
                max_tokens=8192,
                temperature=0.2,
                system=FULL_GENERATION_PROMPT,
                messages=[
                    {"role": "user", "content": prompt},
                ],
            )

            response_text = response.content[0].text.strip()
            logger.info(f"Full generation response length: {len(response_text)} chars")

            # Clean up potential markdown formatting
            response_text = self._clean_json_response(response_text)
            parsed = json.loads(response_text)

            # Validate and repair
            parsed = self._validate_and_repair(parsed)

            logger.info("Successfully generated full floor plan with Claude LLM")
            return parsed

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse full generation JSON: {e}")
            return None
        except Exception as e:
            logger.error(f"Full floor plan generation failed: {e}")
            return None

    def modify_floorplan(self, current_floorplan: dict, prompt: str) -> dict:
        """
        Use the LLM to directly modify the existing floor plan JSON based on the user's prompt.
        """
        client = self._get_anthropic_client()
        if client is None:
            logger.warning("No API key available for modify_floorplan. Returning unchanged.")
            return current_floorplan
            
        system_prompt = f"""You are an expert architectural AI assistant.
The user wants to modify their existing floor plan. 
Below is the CURRENT state of the floor plan in JSON format. Use spatial reasoning to fulfill the user's request.
Modify this JSON to apply the request. 
You can add, remove, or modify objects inside the `rooms`, `walls`, `doors`, `windows`, `texts`, and `furniture` arrays.

Current Floor Plan JSON:
{json.dumps(current_floorplan)}

CRITICAL RULES:
- Return ONLY the finalized, modified valid JSON object of the floor plan.
- Do NOT output markdown code blocks (```json).
- Do NOT output any explanations or conversational text. Start with {{ and end with }}.
- All coordinates in REAL-WORLD METERS.
- All walls MUST be perfectly horizontal or perfectly vertical. NO diagonal walls.
- When adding a new room, ensure its bounding box tiles against existing rooms (shared edges, no gaps).
- Generate 4 walls for any new room, mark exterior walls appropriately.
- Place a door between the new room and its adjacent room on the shared wall.
- Place windows on new exterior walls if the wall is ≥ 1.5m long.
- Ensure room_type is one of: living_room, bedroom, bathroom, kitchen, dining_room, garage, hallway, closet, laundry, office, balcony, entrance, storage, other.
- If the user specifies furniture, add it to `levels[0].furniture` with `type`, `width`, `depth`, `category`, and an `id`.
- If the user specifies text labels, add them to `levels[0].texts` with `text`, `position`, `fontSize`, `color`, and `rotation`.
"""

        try:
            logger.info("Calling Claude LLM to modify floorplan...")
            response = client.messages.create(
                model=self.model,
                max_tokens=8192,
                temperature=0.2,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": prompt},
                ],
            )

            response_text = response.content[0].text.strip()
            response_text = self._clean_json_response(response_text)
            parsed = json.loads(response_text)

            # Validate and repair
            parsed = self._validate_and_repair(parsed)

            logger.info("Successfully modified floor plan with Claude LLM")
            return parsed

        except Exception as e:
            logger.error(f"Failed to modify floor plan with Claude LLM: {e}")
            return current_floorplan

    def extract_from_image(self, base64_image: str, media_type: str = "image/png") -> dict:
        """
        Use the Claude Vision model to extract a floor plan from a base64 encoded image.
        Returns coordinates in real-world meters directly.
        """
        client = self._get_anthropic_client()
        if client is None:
            raise ValueError("No API key available for vision extraction.")

        system_prompt = """You are an expert architectural AI assistant and computer vision specialist.
The user has uploaded an image of a floor plan. Analyze it carefully and extract ALL architectural elements.

CRITICAL INSTRUCTIONS FOR COORDINATES:
1. Output coordinates in REAL-WORLD METERS. Estimate real dimensions from the image:
   - A typical residential bedroom is 3.5-5m × 3.5-5m
   - A living room is 5-7m × 4-6m
   - A bathroom is 2-3m × 2.5-3.5m
   - A kitchen is 3-4m × 3.5-5m
   - A hallway is 1.5-2m wide
   - A standard door is ~0.9m wide
   - A standard window is ~1.2m wide
2. Place the 0,0 origin at the TOP-LEFT of the floor plan.
3. ALL walls MUST be perfectly horizontal (start.y == end.y) or perfectly vertical (start.x == end.x). NO diagonal walls.
4. Rooms MUST tile together — shared walls between adjacent rooms should have matching coordinates.
5. Every door and window MUST lie precisely ON a wall segment.

ROOM IDENTIFICATION:
- Carefully read any text labels in the image to identify room names and types.
- If no labels, infer room types from size, fixtures, and position.
- Use ONLY these room_type values: living_room, bedroom, bathroom, kitchen, dining_room, garage, hallway, closet, laundry, office, balcony, entrance, storage, other.
- Do NOT use variations like 'laundry_room', 'bed_room', 'master_bedroom' — map them to the correct type above.

Return ONLY a valid JSON object with this structure:
{
  "name": "Extracted Plan",
  "total_area": <total_area_sqm>,
  "width": <overall_width_m>,
  "height": <overall_depth_m>,
  "metadata": {},
  "levels": [
    {
      "level_number": 0,
      "name": "Ground Floor",
      "height": 2.8,
      "rooms": [
        {
          "id": "room_1",
          "name": "Living Room",
          "room_type": "living_room",
          "bounding_box": { "min_point": { "x": 0, "y": 0 }, "max_point": { "x": 6, "y": 5 } },
          "area": 30,
          "vertices": null
        }
      ],
      "walls": [
        {
          "id": "wall_1",
          "start": { "x": 0, "y": 0 },
          "end": { "x": 6, "y": 0 },
          "thickness": 0.15,
          "is_exterior": true
        }
      ],
      "doors": [
        {
          "id": "door_1",
          "position": { "x": 3, "y": 0 },
          "width": 0.9,
          "wall_start": { "x": 0, "y": 0 },
          "wall_end": { "x": 6, "y": 0 },
          "is_exterior": false
        }
      ],
      "windows": [
        {
          "id": "window_1",
          "position": { "x": 3, "y": 5 },
          "width": 1.2,
          "wall_start": { "x": 0, "y": 5 },
          "wall_end": { "x": 6, "y": 5 }
        }
      ],
      "texts": [],
      "furniture": []
    }
  ]
}

CRITICAL RULES:
- room_type MUST be ONE OF: living_room, bedroom, bathroom, kitchen, dining_room, garage, hallway, closet, laundry, office, balcony, entrance, storage, other.
- ALL coordinates in real-world meters.
- Each room needs 4 walls: top, bottom, left, right — derived from its bounding_box.
- Doors between adjacent rooms at shared wall midpoints.
- Windows on exterior walls at their midpoints.
- Return ONLY the JSON. No markdown, no explanation. Start with { and end with }."""

        try:
            logger.info("Calling Claude Vision to extract floorplan...")
            response = client.messages.create(
                model=self.model,
                max_tokens=8192,
                temperature=0.1,
                system=system_prompt,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": media_type,
                                    "data": base64_image,
                                },
                            },
                            {
                                "type": "text",
                                "text": "Analyze this floor plan image carefully. Identify every room, wall, door, and window. Output all coordinates in real-world meters based on estimated real dimensions. Make sure rooms tile together with shared walls and no gaps.",
                            },
                        ],
                    }
                ],
            )

            response_text = response.content[0].text.strip()
            logger.info(f"Vision extraction response length: {len(response_text)} chars")

            # Clean up potential markdown formatting
            response_text = self._clean_json_response(response_text)
            parsed = json.loads(response_text)

            # Validate and repair — no more scaling needed since coords are already in meters
            parsed = self._validate_and_repair(parsed)

            logger.info("Successfully extracted floor plan with Claude Vision")
            return parsed

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse vision extraction JSON: {e}")
            raise ValueError(f"Failed to parse extracted floor plan: {e}")
        except Exception as e:
            logger.error(f"Failed to extract floor plan with Claude Vision: {e}")
            raise e

    # ------------------------------------------------------------------
    # Validation & Repair
    # ------------------------------------------------------------------

    def _validate_and_repair(self, plan: dict) -> dict:
        """
        Validate and repair a floor plan JSON to ensure geometric consistency.
        
        Fixes:
        - Invalid room types
        - Missing/inconsistent walls (regenerates from room bounding boxes)
        - Missing doors between adjacent rooms
        - Missing windows on exterior walls
        - Missing IDs
        - Ensures min_point < max_point for all bounding boxes
        """
        if "levels" not in plan or not plan["levels"]:
            plan["levels"] = [{
                "level_number": 0,
                "name": "Ground Floor",
                "height": 2.8,
                "rooms": [],
                "walls": [],
                "doors": [],
                "windows": [],
                "texts": [],
                "furniture": [],
            }]

        for level in plan["levels"]:
            # Ensure all arrays exist
            level.setdefault("rooms", [])
            level.setdefault("walls", [])
            level.setdefault("doors", [])
            level.setdefault("windows", [])
            level.setdefault("texts", [])
            level.setdefault("furniture", [])
            level.setdefault("level_number", 0)
            level.setdefault("name", "Ground Floor")
            level.setdefault("height", 2.8)

            # Fix rooms
            for room in level["rooms"]:
                room.setdefault("id", f"room_{uuid.uuid4().hex[:8]}")
                room.setdefault("name", "Unknown Room")
                room.setdefault("vertices", None)

                # Fix room_type
                rt = room.get("room_type", "other")
                if rt not in VALID_ROOM_TYPES:
                    # Try common corrections
                    corrections = {
                        "laundry_room": "laundry",
                        "bed_room": "bedroom",
                        "bath_room": "bathroom",
                        "living": "living_room",
                        "master_bedroom": "bedroom",
                        "guest_bedroom": "bedroom",
                        "master_bathroom": "bathroom",
                        "guest_bathroom": "bathroom",
                        "powder_room": "bathroom",
                        "utility": "storage",
                        "utility_room": "storage",
                        "pantry": "storage",
                        "mudroom": "entrance",
                        "porch": "balcony",
                        "terrace": "balcony",
                        "den": "living_room",
                        "family_room": "living_room",
                        "dining": "dining_room",
                    }
                    room["room_type"] = corrections.get(rt, "other")

                # Fix bounding box
                if "bounding_box" in room:
                    bb = room["bounding_box"]
                    mp = bb.get("min_point", {"x": 0, "y": 0})
                    xp = bb.get("max_point", {"x": 1, "y": 1})
                    
                    # Ensure min < max
                    x1, x2 = min(mp["x"], xp["x"]), max(mp["x"], xp["x"])
                    y1, y2 = min(mp["y"], xp["y"]), max(mp["y"], xp["y"])
                    
                    # Ensure room has non-zero area
                    if abs(x2 - x1) < 0.1:
                        x2 = x1 + 3.0
                    if abs(y2 - y1) < 0.1:
                        y2 = y1 + 3.0

                    bb["min_point"] = {"x": round(x1, 2), "y": round(y1, 2)}
                    bb["max_point"] = {"x": round(x2, 2), "y": round(y2, 2)}
                    
                    # Recalculate area
                    room["area"] = round(abs(x2 - x1) * abs(y2 - y1), 2)

            # Regenerate walls from room bounding boxes for consistency
            level["walls"] = self._generate_walls_from_rooms(level["rooms"])

            # Regenerate doors between adjacent rooms if inadequate
            existing_doors = level.get("doors", [])
            generated_doors = self._generate_doors_from_rooms(level["rooms"])
            
            # Keep LLM doors that look valid, supplement with generated ones
            if len(existing_doors) < len(generated_doors) // 2:
                # LLM missed most doors — use generated ones
                level["doors"] = generated_doors
            else:
                # Validate and fix existing doors, add missing ones
                level["doors"] = self._merge_doors(existing_doors, generated_doors, level["walls"])

            # Ensure exterior door on entrance room if one exists
            self._ensure_entrance_door(level)

            # Regenerate windows on exterior walls if inadequate
            existing_windows = level.get("windows", [])
            generated_windows = self._generate_windows_from_walls(level["walls"])
            
            if len(existing_windows) < len(generated_windows) // 2:
                level["windows"] = generated_windows
            else:
                # Keep what we have but ensure IDs
                for w in level["windows"]:
                    w.setdefault("id", f"window_{uuid.uuid4().hex[:8]}")

            # Fix IDs on all elements
            for elem_list in [level["walls"], level["doors"], level["windows"]]:
                for elem in elem_list:
                    if "id" not in elem or not elem["id"]:
                        prefix = "wall" if "thickness" in elem else ("door" if "is_exterior" in elem else "window")
                        elem["id"] = f"{prefix}_{uuid.uuid4().hex[:8]}"

        # Update total_area and dimensions
        all_rooms = [r for level in plan["levels"] for r in level.get("rooms", [])]
        if all_rooms:
            plan["total_area"] = round(sum(r.get("area", 0) for r in all_rooms), 2)
            all_x = []
            all_y = []
            for r in all_rooms:
                bb = r.get("bounding_box", {})
                mp = bb.get("min_point", {})
                xp = bb.get("max_point", {})
                all_x.extend([mp.get("x", 0), xp.get("x", 0)])
                all_y.extend([mp.get("y", 0), xp.get("y", 0)])
            plan["width"] = round(max(all_x) - min(all_x), 2) if all_x else 0
            plan["height"] = round(max(all_y) - min(all_y), 2) if all_y else 0

        plan.setdefault("name", "Generated Plan")
        plan.setdefault("metadata", {})

        return plan

    def _generate_walls_from_rooms(self, rooms: List[dict]) -> List[dict]:
        """Generate consistent walls from room bounding boxes."""
        if not rooms:
            return []
        
        walls = []
        wall_set = set()  # Track (x1,y1,x2,y2) to deduplicate

        # Compute building bounding box for exterior wall detection
        all_x = []
        all_y = []
        for room in rooms:
            bb = room.get("bounding_box", {})
            mp = bb.get("min_point", {"x": 0, "y": 0})
            xp = bb.get("max_point", {"x": 1, "y": 1})
            all_x.extend([mp["x"], xp["x"]])
            all_y.extend([mp["y"], xp["y"]])

        bmin_x, bmax_x = min(all_x), max(all_x)
        bmin_y, bmax_y = min(all_y), max(all_y)
        eps = 0.01

        for room in rooms:
            bb = room.get("bounding_box", {})
            mp = bb.get("min_point", {"x": 0, "y": 0})
            xp = bb.get("max_point", {"x": 1, "y": 1})
            
            x1, y1 = round(mp["x"], 2), round(mp["y"], 2)
            x2, y2 = round(xp["x"], 2), round(xp["y"], 2)

            # Four edges: bottom, top, left, right
            edges = [
                (x1, y1, x2, y1),  # bottom
                (x1, y2, x2, y2),  # top
                (x1, y1, x1, y2),  # left
                (x2, y1, x2, y2),  # right
            ]

            for sx, sy, ex, ey in edges:
                # Normalize edge key (sort points for dedup)
                key = tuple(sorted([(sx, sy), (ex, ey)]))
                if key in wall_set:
                    continue
                wall_set.add(key)

                # Check if exterior
                is_ext = False
                if abs(sy - ey) < eps:  # horizontal
                    if abs(sy - bmin_y) < eps or abs(sy - bmax_y) < eps:
                        is_ext = True
                if abs(sx - ex) < eps:  # vertical
                    if abs(sx - bmin_x) < eps or abs(sx - bmax_x) < eps:
                        is_ext = True

                walls.append({
                    "id": f"wall_{uuid.uuid4().hex[:8]}",
                    "start": {"x": sx, "y": sy},
                    "end": {"x": ex, "y": ey},
                    "thickness": 0.15,
                    "is_exterior": is_ext,
                })

        return walls

    def _generate_doors_from_rooms(self, rooms: List[dict]) -> List[dict]:
        """Generate doors between adjacent rooms."""
        doors = []
        eps = 0.01

        for i, room_a in enumerate(rooms):
            for j, room_b in enumerate(rooms):
                if i >= j:
                    continue
                
                bb_a = room_a.get("bounding_box", {})
                bb_b = room_b.get("bounding_box", {})
                a_min = bb_a.get("min_point", {"x": 0, "y": 0})
                a_max = bb_a.get("max_point", {"x": 1, "y": 1})
                b_min = bb_b.get("min_point", {"x": 0, "y": 0})
                b_max = bb_b.get("max_point", {"x": 1, "y": 1})

                shared = self._find_shared_edge(a_min, a_max, b_min, b_max, eps)
                if shared is None:
                    continue

                sx, sy, ex, ey = shared
                mid_x = round((sx + ex) / 2, 2)
                mid_y = round((sy + ey) / 2, 2)
                
                doors.append({
                    "id": f"door_{uuid.uuid4().hex[:8]}",
                    "position": {"x": mid_x, "y": mid_y},
                    "width": 0.9,
                    "wall_start": {"x": sx, "y": sy},
                    "wall_end": {"x": ex, "y": ey},
                    "is_exterior": False,
                })

        return doors

    def _find_shared_edge(self, a_min, a_max, b_min, b_max, eps):
        """Find shared wall edge between two rooms."""
        # A's right edge == B's left edge
        if abs(a_max["x"] - b_min["x"]) < eps:
            lo = max(a_min["y"], b_min["y"])
            hi = min(a_max["y"], b_max["y"])
            if hi - lo > eps:
                x = round(a_max["x"], 2)
                return (x, round(lo, 2), x, round(hi, 2))

        # A's left edge == B's right edge
        if abs(a_min["x"] - b_max["x"]) < eps:
            lo = max(a_min["y"], b_min["y"])
            hi = min(a_max["y"], b_max["y"])
            if hi - lo > eps:
                x = round(a_min["x"], 2)
                return (x, round(lo, 2), x, round(hi, 2))

        # A's top edge == B's bottom edge
        if abs(a_max["y"] - b_min["y"]) < eps:
            lo = max(a_min["x"], b_min["x"])
            hi = min(a_max["x"], b_max["x"])
            if hi - lo > eps:
                y = round(a_max["y"], 2)
                return (round(lo, 2), y, round(hi, 2), y)

        # A's bottom edge == B's top edge
        if abs(a_min["y"] - b_max["y"]) < eps:
            lo = max(a_min["x"], b_min["x"])
            hi = min(a_max["x"], b_max["x"])
            if hi - lo > eps:
                y = round(a_min["y"], 2)
                return (round(lo, 2), y, round(hi, 2), y)

        return None

    def _merge_doors(self, existing: List[dict], generated: List[dict], walls: List[dict]) -> List[dict]:
        """Merge existing LLM doors with generated ones, deduplicating."""
        merged = []
        used_positions = set()

        for door in existing:
            door.setdefault("id", f"door_{uuid.uuid4().hex[:8]}")
            pos = door.get("position", {})
            key = (round(pos.get("x", 0), 1), round(pos.get("y", 0), 1))
            if key not in used_positions:
                used_positions.add(key)
                merged.append(door)

        for door in generated:
            pos = door.get("position", {})
            key = (round(pos.get("x", 0), 1), round(pos.get("y", 0), 1))
            if key not in used_positions:
                used_positions.add(key)
                merged.append(door)

        return merged

    def _ensure_entrance_door(self, level: dict):
        """Ensure there is an exterior door on the entrance room."""
        entrance_rooms = [r for r in level["rooms"] if r.get("room_type") == "entrance"]
        if not entrance_rooms:
            return

        # Check if there's already an exterior door
        has_ext_door = any(d.get("is_exterior", False) for d in level["doors"])
        if has_ext_door:
            return

        entrance = entrance_rooms[0]
        bb = entrance.get("bounding_box", {})
        mp = bb.get("min_point", {"x": 0, "y": 0})
        xp = bb.get("max_point", {"x": 1, "y": 1})

        # Find an exterior wall of this room
        ext_walls = [w for w in level["walls"] if w.get("is_exterior", False)]
        for wall in ext_walls:
            ws = wall["start"]
            we = wall["end"]
            # Check if this wall belongs to the entrance room
            if self._wall_on_room_boundary(ws, we, mp, xp):
                mid_x = round((ws["x"] + we["x"]) / 2, 2)
                mid_y = round((ws["y"] + we["y"]) / 2, 2)
                level["doors"].append({
                    "id": f"door_{uuid.uuid4().hex[:8]}",
                    "position": {"x": mid_x, "y": mid_y},
                    "width": 0.9,
                    "wall_start": {"x": ws["x"], "y": ws["y"]},
                    "wall_end": {"x": we["x"], "y": we["y"]},
                    "is_exterior": True,
                })
                return

    def _wall_on_room_boundary(self, ws, we, room_min, room_max, eps=0.01):
        """Check if a wall segment lies on the boundary of a room."""
        x1, y1 = ws["x"], ws["y"]
        x2, y2 = we["x"], we["y"]
        rx1, ry1 = room_min["x"], room_min["y"]
        rx2, ry2 = room_max["x"], room_max["y"]

        # Horizontal wall on room's top or bottom
        if abs(y1 - y2) < eps:
            if (abs(y1 - ry1) < eps or abs(y1 - ry2) < eps):
                if min(x1, x2) >= rx1 - eps and max(x1, x2) <= rx2 + eps:
                    return True
        # Vertical wall on room's left or right
        if abs(x1 - x2) < eps:
            if (abs(x1 - rx1) < eps or abs(x1 - rx2) < eps):
                if min(y1, y2) >= ry1 - eps and max(y1, y2) <= ry2 + eps:
                    return True
        return False

    def _generate_windows_from_walls(self, walls: List[dict]) -> List[dict]:
        """Generate windows on exterior walls that are long enough."""
        windows = []
        min_len = 1.5

        for wall in walls:
            if not wall.get("is_exterior", False):
                continue
            s = wall["start"]
            e = wall["end"]
            length = math.sqrt((e["x"] - s["x"])**2 + (e["y"] - s["y"])**2)
            if length < min_len:
                continue

            mid_x = round((s["x"] + e["x"]) / 2, 2)
            mid_y = round((s["y"] + e["y"]) / 2, 2)
            windows.append({
                "id": f"window_{uuid.uuid4().hex[:8]}",
                "position": {"x": mid_x, "y": mid_y},
                "width": 1.2,
                "wall_start": {"x": s["x"], "y": s["y"]},
                "wall_end": {"x": e["x"], "y": e["y"]},
            })

        return windows

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _clean_json_response(text: str) -> str:
        """Remove markdown formatting from LLM responses."""
        text = text.strip()
        if text.startswith("```"):
            matches = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
            if matches:
                text = matches.group(1).strip()
        # Remove any leading/trailing non-JSON characters
        start_idx = text.find("{")
        end_idx = text.rfind("}")
        if start_idx != -1 and end_idx != -1:
            text = text[start_idx:end_idx + 1]
        return text

    # ------------------------------------------------------------------
    # LLM-based parsing (Claude)
    # ------------------------------------------------------------------

    def _parse_with_llm(self, prompt: str) -> Optional[List[dict]]:
        """Use the Claude LLM to extract room requirements."""
        client = self._get_anthropic_client()
        if client is None:
            return None

        try:
            response = client.messages.create(
                model=self.model,
                max_tokens=2048,
                temperature=0.2,
                system=SYSTEM_PROMPT,
                messages=[
                    {"role": "user", "content": prompt},
                ],
            )

            response_text = response.content[0].text.strip()
            logger.info(f"Claude LLM response: {response_text}")

            # Clean up response
            response_text = self._clean_json_response(response_text)

            # Parse the JSON response
            parsed = json.loads(response_text)
            rooms = parsed.get("rooms", [])

            if not rooms:
                logger.warning("LLM returned empty rooms list")
                return None

            # Validate room types
            validated = []
            for room in rooms:
                room_type = room.get("type", "other")
                if room_type not in VALID_ROOM_TYPES:
                    room_type = "other"
                entry = {
                    "type": room_type,
                    "name": room.get("name", room_type.replace("_", " ").title()),
                }
                # Preserve area_hint if provided
                area_hint = room.get("area_hint")
                if area_hint is not None:
                    try:
                        entry["area_hint"] = float(area_hint)
                    except (ValueError, TypeError):
                        pass
                validated.append(entry)

            return validated if validated else None

        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse LLM JSON response: {e}")
            return None
        except Exception as e:
            logger.warning(f"Claude LLM call failed: {e}")
            return None

    # ------------------------------------------------------------------
    # Regex-based fallback parsing
    # ------------------------------------------------------------------

    def _parse_with_regex(self, prompt: str) -> List[dict]:
        """
        Extract room requirements using keyword matching and number parsing.

        Handles patterns like:
        - "3 bedrooms and 2 bathrooms"
        - "a house with a living room, kitchen, and 2 bedrooms"
        - "I want a bedroom, a bathroom, and a kitchen"
        """
        text = prompt.lower().strip()
        rooms: List[dict] = []

        # Track which room types have been found
        found_types: dict = {}

        # Sort keywords by length (longest first) to match multi-word phrases first
        sorted_keywords = sorted(ROOM_KEYWORDS.keys(), key=len, reverse=True)

        for keyword in sorted_keywords:
            room_type = ROOM_KEYWORDS[keyword]

            # Skip if we've already matched this room type
            if room_type in found_types:
                continue

            # Pattern: "<number> <keyword>(s)" e.g. "3 bedrooms"
            pattern = rf"(\d+)\s+{re.escape(keyword)}s?"
            match = re.search(pattern, text)
            if match:
                count = min(int(match.group(1)), 10)  # Cap at 10
                found_types[room_type] = count
                continue

            # Pattern: "a/an <keyword>" or just "<keyword>" present in text
            pattern = rf"\b{re.escape(keyword)}s?\b"
            match = re.search(pattern, text)
            if match:
                found_types[room_type] = 1
                continue

        # Build the room list with proper naming
        for room_type, count in found_types.items():
            display_base = room_type.replace("_", " ").title()
            if count == 1:
                rooms.append({"type": room_type, "name": display_base})
            else:
                for i in range(1, count + 1):
                    rooms.append({"type": room_type, "name": f"{display_base} {i}"})

        # If nothing was extracted, add an entrance and return defaults
        if not rooms:
            return DEFAULT_ROOMS.copy()

        # Always ensure there's an entrance unless one was already included
        if "entrance" not in found_types:
            rooms.append({"type": "entrance", "name": "Entrance"})

        return rooms
