"""
Natural Language Intent Parser for Archion Build.

Extracts room requirements from user text using:
1. Anthropic Claude (primary, when ANTHROPIC_API_KEY is set)
2. Regex-based keyword extraction (fallback)
"""

import json
import logging
import re
from typing import List, Optional

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

# System prompt for the Claude LLM
SYSTEM_PROMPT = """You are an architectural intent parser. Given a user's description of a house or floor plan, extract the room requirements.

Return ONLY a valid JSON object with this exact structure:
{
  "rooms": [
    {"type": "<room_type>", "name": "<display_name>"}
  ]
}

Valid room types are: living_room, bedroom, bathroom, kitchen, dining_room, garage, hallway, closet, laundry, office, balcony, entrance, storage, other.

Rules:
- If the user says "3 bedrooms", create 3 separate bedroom entries named "Bedroom 1", "Bedroom 2", "Bedroom 3".
- Always include an entrance unless the user explicitly says no entrance.
- If the user mentions a "house" without specifics, include at minimum: living room, kitchen, 1 bedroom, 1 bathroom, and entrance.
- Number duplicate rooms (e.g. "Bathroom 1", "Bathroom 2").
- Return ONLY the JSON object, no markdown, no explanation."""


class IntentParser:
    """
    Parses natural language descriptions into room requirement lists
    compatible with ``LayoutSolver.solve()``.
    """

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key
        self.model = model or "claude-3-haiku-20240307"
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

        Returns a list of dicts like ``[{"type": "bedroom", "name": "Bedroom 1"}, ...]``
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
- If the user asks to add something, make sure its geometry makes sense and doesn't completely overlap existing bounds.
- If the user specifies furniture, add it to the `furniture` array INSIDE the `levels` array (`levels[0].furniture`) with its correct `type`, `width`, `depth`, `category` (e.g. 'living_room', 'bedroom', 'kitchen', 'bathroom'), and an `id`.
- If the user specifies text labels, add them to the `texts` array INSIDE the `levels` array (`levels[0].texts`) with `text`, `position`, `fontSize`, `color`, and `rotation`.
"""


        try:
            logger.info("Calling Claude LLM to modify floorplan...")
            response = client.messages.create(
                model=self.model,
                max_tokens=4096,
                temperature=0.3,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": prompt},
                ],
            )

            response_text = response.content[0].text.strip()
            
            # Clean up potential markdown formatting despite instructions
            if response_text.startswith("```"):
                matches = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", response_text)
                if matches:
                    response_text = matches.group(1).strip()
                
            parsed = json.loads(response_text)
            logger.info("Successfully modified floor plan with Claude LLM")
            return parsed

        except Exception as e:
            logger.error(f"Failed to modify floor plan with Claude LLM: {e}")
            return current_floorplan

    def extract_from_image(self, base64_image: str, media_type: str = "image/png") -> dict:
        """
        Use the Claude Vision model to extract a floor plan from a base64 encoded image.
        """
        client = self._get_anthropic_client()
        if client is None:
            raise ValueError("No API key available for vision extraction.")

        system_prompt = """You are an expert architectural AI assistant and computer vision specialist.
The user has uploaded an image of a floor plan.
Analyze the image and thoroughly extract ALL architectural elements into the following JSON format.
You must accurately identify every room, wall, door, and window visible in the image.

CRITICAL INSTRUCTIONS FOR COORDINATES AND GEOMETRY:
1. Coordinate Grid: Imagine a grid overlaid on the floor plan where the top-left is (0,0) and the bottom-right is (100, 100).
2. ALL `x` and `y` coordinates MUST be numbers between 0 and 100. DO NOT output any coordinate outside this range.
3. Orthogonal Walls: All walls MUST be perfectly horizontal (start.y == end.y) or perfectly vertical (start.x == end.x). DO NOT output diagonal walls.
4. Connected Geometry: Walls must connect at their endpoints to form closed rectangular rooms. The `min_point` and `max_point` of a room's `bounding_box` MUST perfectly align with its surrounding walls.
5. Doors & Windows: Every door and window MUST lie precisely ON a wall. Provide its center `position` and calculate `wall_start` and `wall_end` to match the exact start and end coordinates of the wall segment it overlaps.

Return ONLY a valid JSON object with this exact structure, representing the extracted floor plan:
{
  "name": "Extracted Plan",
  "total_area": 100,
  "width": null,
  "height": null,
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
          "bounding_box": { "min_point": { "x": 0, "y": 0 }, "max_point": { "x": 5, "y": 5 } },
          "area": 25,
          "vertices": null
        }
      ],
      "walls": [
        {
          "id": "wall_1",
          "start": { "x": 0, "y": 0 },
          "end": { "x": 5, "y": 0 },
          "thickness": 0.15,
          "is_exterior": true
        }
      ],
      "doors": [
        {
          "id": "door_1",
          "position": { "x": 2.5, "y": 0 },
          "width": 0.9,
          "wall_start": { "x": 0, "y": 0 },
          "wall_end": { "x": 5, "y": 0 },
          "is_exterior": false
        }
      ],
      "windows": [],
      "texts": [],
      "furniture": []
    }
  ]
}

CRITICAL RULES:
- `room_type` MUST BE EXACTLY ONE OF: 'living_room', 'bedroom', 'bathroom', 'kitchen', 'dining_room', 'garage', 'hallway', 'closet', 'laundry', 'office', 'balcony', 'entrance', 'storage', 'other'. Do NOT use 'laundry_room' or 'bed_room'.
- All doors and windows MUST have `position`, `wall_start`, and `wall_end` coordinates pointing exactly to the start and end of the wall they belong to.
- Ensure all coordinate values are on the 0 to 100 grid.
- Return ONLY the finalized, valid JSON object of the floor plan.
- Do NOT output markdown code blocks (```json).
- Do NOT output any explanations or conversational text. Start with { and end with }.
"""

        try:
            logger.info("Calling Claude Vision to extract floorplan...")
            response = client.messages.create(
                model=self.model,
                max_tokens=4096,
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
                                "text": "Extract the floor plan from this image.",
                            },
                        ],
                    }
                ],
            )

            response_text = response.content[0].text.strip()
            
            # Clean up potential markdown formatting despite instructions
            if response_text.startswith("```"):
                matches = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", response_text)
                if matches:
                    response_text = matches.group(1).strip()
                
            parsed = json.loads(response_text)
            
            # Scale coordinates from 0-100 grid down to realistic meters (e.g. 100 units = 20 meters -> multiplier = 0.2)
            SCALE_FACTOR = 0.2
            
            if "levels" in parsed:
                for level in parsed["levels"]:
                    for room in level.get("rooms", []):
                        if "bounding_box" in room:
                            box = room["bounding_box"]
                            box["min_point"]["x"] *= SCALE_FACTOR
                            box["min_point"]["y"] *= SCALE_FACTOR
                            box["max_point"]["x"] *= SCALE_FACTOR
                            box["max_point"]["y"] *= SCALE_FACTOR
                            room["area"] = abs(box["max_point"]["x"] - box["min_point"]["x"]) * abs(box["max_point"]["y"] - box["min_point"]["y"])
                    
                    for wall in level.get("walls", []):
                        wall["start"]["x"] *= SCALE_FACTOR
                        wall["start"]["y"] *= SCALE_FACTOR
                        wall["end"]["x"] *= SCALE_FACTOR
                        wall["end"]["y"] *= SCALE_FACTOR
                    
                    for door in level.get("doors", []):
                        if "position" in door:
                            door["position"]["x"] *= SCALE_FACTOR
                            door["position"]["y"] *= SCALE_FACTOR
                        if "wall_start" in door:
                            door["wall_start"]["x"] *= SCALE_FACTOR
                            door["wall_start"]["y"] *= SCALE_FACTOR
                        if "wall_end" in door:
                            door["wall_end"]["x"] *= SCALE_FACTOR
                            door["wall_end"]["y"] *= SCALE_FACTOR
                            
                    for window in level.get("windows", []):
                        if "position" in window:
                            window["position"]["x"] *= SCALE_FACTOR
                            window["position"]["y"] *= SCALE_FACTOR
                        if "wall_start" in window:
                            window["wall_start"]["x"] *= SCALE_FACTOR
                            window["wall_start"]["y"] *= SCALE_FACTOR
                        if "wall_end" in window:
                            window["wall_end"]["x"] *= SCALE_FACTOR
                            window["wall_end"]["y"] *= SCALE_FACTOR

            logger.info("Successfully extracted and scaled floor plan with Claude Vision")
            return parsed

        except Exception as e:
            logger.error(f"Failed to extract floor plan with Claude Vision: {e}")
            raise e

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
                max_tokens=1024,
                temperature=0.3,
                system=SYSTEM_PROMPT,
                messages=[
                    {"role": "user", "content": prompt},
                ],
            )

            response_text = response.content[0].text.strip()
            logger.info(f"Claude LLM response: {response_text}")

            # Parse the JSON response
            parsed = json.loads(response_text)
            rooms = parsed.get("rooms", [])

            if not rooms:
                logger.warning("LLM returned empty rooms list")
                return None

            # Validate room types
            valid_types = {
                "living_room", "bedroom", "bathroom", "kitchen",
                "dining_room", "garage", "hallway", "closet",
                "laundry", "office", "balcony", "entrance",
                "storage", "other",
            }
            validated = []
            for room in rooms:
                room_type = room.get("type", "other")
                if room_type not in valid_types:
                    room_type = "other"
                validated.append({
                    "type": room_type,
                    "name": room.get("name", room_type.replace("_", " ").title()),
                })

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
            # Check for the keyword being present as a standalone phrase
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
