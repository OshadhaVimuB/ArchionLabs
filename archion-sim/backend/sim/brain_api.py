import os
import torch
import torch.nn as nn
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Archion MARL Brain API")

# 1. The exact same brain structure from Colab
class AgentBrain(nn.Module):
    def __init__(self):
        super().__init__()
        self.common = nn.Linear(5, 64) 
        self.actor = nn.Linear(64, 4)  
        self.critic = nn.Linear(64, 1)

    def forward(self, state):
        x = torch.relu(self.common(state))
        action_probs = torch.softmax(self.actor(x), dim=-1)
        state_value = self.critic(x)
        return action_probs, state_value

# 2. Load your downloaded .pth file
current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, "archion_marl_brain_v1.pth")

brain = None 

try:
    temp_brain = AgentBrain()
    temp_brain.load_state_dict(torch.load(model_path, map_location=torch.device('cpu'), weights_only=True))
    temp_brain.eval() 
    brain = temp_brain
    print("\n✅ SUCCESS: Loaded trained MARL brain successfully!\n")
except FileNotFoundError:
    print(f"\n❌ WARNING: Could not find {model_path}. Endpoint will return fallback actions.\n")

# 3. Create the endpoint for the simulation engine to call
class BatchStateRequest(BaseModel):
    states: list[list[float]]

@app.post("/act_batch")
async def get_actions(req: BatchStateRequest):
    if brain is None:
        return {"actions": [0] * len(req.states)}

    with torch.no_grad():
        tensor_states = torch.FloatTensor(req.states)
        action_probs, _ = brain(tensor_states)

        best_actions = []
        for i, probs in enumerate(action_probs):
            action = torch.argmax(probs).item()
            if action == 3:
                ray_front, ray_left, ray_right = req.states[i][0:3]
                if ray_front < 1.0:
                    action = 1 if ray_left > ray_right else 2 
                else:
                    action = 0 
            best_actions.append(action)

    return {"actions": best_actions}