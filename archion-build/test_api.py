import sys
import json
import urllib.request
import urllib.parse

def test_api():
    url = "http://localhost:8000/api/v1/generate/floorplan"
    data = {"prompt": "a house with 1 bedroom and 1 bathroom"}
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
    
    with urllib.request.urlopen(req) as response:
        res1 = json.loads(response.read().decode())
    
    fp = res1['floorplan']
    
    # second request to add furniture
    data2 = {
        "prompt": "Add a table and a bed to the bedroom, and a chair to the living room",
        "current_floorplan": fp
    }
    req2 = urllib.request.Request(url, data=json.dumps(data2).encode('utf-8'), headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req2) as response2:
        res2 = json.loads(response2.read().decode())
        
    fp2 = res2['floorplan']
    
    levels = fp2.get('levels', [])
    if levels:
        print("Furniture in level 0:")
        print(json.dumps(levels[0].get('furniture', []), indent=2))
        print("Texts in level 0:")
        print(json.dumps(levels[0].get('texts', []), indent=2))
    else:
        print("No levels found")

if __name__ == "__main__":
    test_api()
