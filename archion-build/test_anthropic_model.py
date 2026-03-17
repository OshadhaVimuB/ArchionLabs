import os
import anthropic
from dotenv import load_dotenv
from pathlib import Path

# Load .env
env_path = Path("backend") / ".env"
load_dotenv(env_path)

API_KEY = os.getenv("ANTHROPIC_API_KEY")
MODEL = "claude-sonnet-4-6"

# Minimal base64 for a 1x1 white pixel PNG
IMAGE_DATA = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="

def test_anthropic():
    if not API_KEY:
        print("Error: ANTHROPIC_API_KEY not found in .env")
        return

    client = anthropic.Anthropic(api_key=API_KEY)
    
    try:
        print(f"Testing model: {MODEL} with vision...")
        response = client.messages.create(
            model=MODEL,
            max_tokens=100,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/png",
                                "data": IMAGE_DATA,
                            },
                        },
                        {
                            "type": "text",
                            "text": "What is in this image?",
                        }
                    ],
                }
            ]
        )
        print("Success!")
        print(f"Response: {response.content[0].text}")
    except Exception as e:
        print(f"Error calling model {MODEL} with vision: {e}")

if __name__ == "__main__":
    test_anthropic()
