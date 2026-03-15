import sys
import json
from app.services.groq_intent import IntentParser
from app.config import GROQ_API_KEY
from app.models.floorplan import FloorPlan, Level, Room, BoundingBox, Point2D, RoomType

def test_local():
    parser = IntentParser(api_key=GROQ_API_KEY)
    
    fp = FloorPlan(
        name="Test",
        levels=[
            Level(
                level_number=0,
                rooms=[Room(name="Bedroom 1", room_type=RoomType.BEDROOM, bounding_box=BoundingBox(min_point=Point2D(x=0,y=0), max_point=Point2D(x=5,y=5)))]
            )
        ]
    )
    fp_dict = fp.model_dump()
    print("Initial FP furniture:", fp_dict["levels"][0].get("furniture"))
    
    prompt = "Add a table and a bed to Bedroom 1"
    res_dict = parser.modify_floorplan(fp_dict, prompt)
    
    print("Modified FP furniture raw:", res_dict.get("levels", [{}])[0].get("furniture"))
    
    new_fp = FloorPlan(**res_dict)
    final_dict = new_fp.model_dump()
    print("Final FP furniture:", final_dict["levels"][0].get("furniture"))

if __name__ == "__main__":
    test_local()
