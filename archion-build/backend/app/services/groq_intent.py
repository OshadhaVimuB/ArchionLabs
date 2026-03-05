"""
Natural Language Intent Parser for Archion Build.

Extracts room requirements from user text using:
1. Groq LLM (primary, when GROQ_API_KEY is set)
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

# System prompt for the Groq LLM
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
        self.model = model or "llama-3.3-70b-versatile"
        self._groq_client = None

    def _get_groq_client(self):
        """Lazily initialise the Groq client."""
        if self._groq_client is None and self.api_key:
            try:
                from groq import Groq
                self._groq_client = Groq(api_key=self.api_key)
            except ImportError:
                logger.warning("groq package not installed — falling back to regex parser")
                self._groq_client = None
            except Exception as e:
                logger.warning(f"Failed to initialise Groq client: {e}")
                self._groq_client = None
        return self._groq_client

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

    # ------------------------------------------------------------------
    # LLM-based parsing (Groq)
    # ------------------------------------------------------------------

    def _parse_with_llm(self, prompt: str) -> Optional[List[dict]]:
        """Use the Groq LLM to extract room requirements."""
        client = self._get_groq_client()
        if client is None:
            return None

        try:
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                model=self.model,
                temperature=0.3,
                max_tokens=1024,
            )

            response_text = chat_completion.choices[0].message.content.strip()
            logger.info(f"Groq LLM response: {response_text}")

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
            logger.warning(f"Groq LLM call failed: {e}")
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
