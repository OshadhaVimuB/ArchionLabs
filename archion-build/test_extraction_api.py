import requests
import base64
import json

# Minimal base64 for a 1x1 white pixel PNG
IMAGE_DATA = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="

def test_extraction():
    url = "http://localhost:8000/api/v1/generate/extract-floorplan"
    payload = {
        "file_name": "test.png",
        "mime_type": "image/png",
        "file_data": IMAGE_DATA,
        "model": "claude-sonnet-4-6"
    }
    
    try:
        print(f"Sending request to {url}...")
        response = requests.post(url, json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_extraction()
