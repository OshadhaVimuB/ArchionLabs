"""
Tests for the IntentParser regex fallback (Commit 3).
"""

from app.services.claude_intent import IntentParser, DEFAULT_ROOMS


class TestRegexParsing:
    """Test the regex-based (no LLM) intent parser."""

    def setup_method(self):
        # No API key → forces regex-only path
        self.parser = IntentParser(api_key=None)

    def test_multiple_rooms(self):
        rooms = self.parser.parse("3 bedrooms and 2 bathrooms")
        bedrooms = [r for r in rooms if r["type"] == "bedroom"]
        bathrooms = [r for r in rooms if r["type"] == "bathroom"]
        assert len(bedrooms) == 3
        assert len(bathrooms) == 2

    def test_single_rooms(self):
        rooms = self.parser.parse("a kitchen and a living room")
        types = {r["type"] for r in rooms}
        assert "kitchen" in types
        assert "living_room" in types

    def test_synonyms_toilet(self):
        rooms = self.parser.parse("I need a toilet and a study")
        types = {r["type"] for r in rooms}
        assert "bathroom" in types
        assert "office" in types

    def test_empty_prompt_returns_defaults(self):
        rooms = self.parser.parse("")
        assert rooms == DEFAULT_ROOMS

    def test_whitespace_prompt_returns_defaults(self):
        rooms = self.parser.parse("   ")
        assert rooms == DEFAULT_ROOMS

    def test_entrance_auto_added(self):
        rooms = self.parser.parse("2 bedrooms")
        types = [r["type"] for r in rooms]
        assert "entrance" in types

    def test_entrance_not_duplicated(self):
        rooms = self.parser.parse("an entrance and a bedroom")
        entrances = [r for r in rooms if r["type"] == "entrance"]
        assert len(entrances) == 1

    def test_count_capped_at_ten(self):
        rooms = self.parser.parse("99 bedrooms")
        bedrooms = [r for r in rooms if r["type"] == "bedroom"]
        assert len(bedrooms) == 10

    def test_room_naming_numbered(self):
        rooms = self.parser.parse("3 bedrooms")
        bedrooms = [r for r in rooms if r["type"] == "bedroom"]
        names = [r["name"] for r in bedrooms]
        assert "Bedroom 1" in names
        assert "Bedroom 2" in names
        assert "Bedroom 3" in names

    def test_gibberish_returns_defaults(self):
        rooms = self.parser.parse("asdfghjkl xyz 123")
        assert rooms == DEFAULT_ROOMS
