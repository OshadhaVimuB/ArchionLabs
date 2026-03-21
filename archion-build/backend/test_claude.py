from app.services.claude_intent import IntentParser
from app.config import ANTHROPIC_API_KEY

print(f"API Key loaded: {'Yes' if ANTHROPIC_API_KEY else 'No'}")
print(f"Model: claude-3-haiku-20240307")

p = IntentParser(api_key=ANTHROPIC_API_KEY)
result = p.parse("a house with 3 bedrooms, 2 bathrooms, a kitchen, and a living room")

print("\nClaude API Result:")
for r in result:
    print(f"  - {r['name']} ({r['type']})")

print(f"\nTotal rooms: {len(result)}")
print("SUCCESS - Claude Haiku is working!")
