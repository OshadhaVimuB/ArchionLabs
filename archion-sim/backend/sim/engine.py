"""
MARL-powered trajectory engine for pedestrian simulation.
This module defines a SimulationEngine class that generates trajectories for multiple agents 
navigating a 2D floor plan.
"""

from __future__ import annotations

import json
import math
import random
import threading
import requests
import os
from dataclasses import dataclass, field
from pathlib import Path

from shapely.geometry import LineString, MultiPolygon, Point, Polygon
from shapely.ops import unary_union

try:
    import anthropic
    _ANTHROPIC_AVAILABLE = True
except ImportError:
    _ANTHROPIC_AVAILABLE = False

SIM_HZ = 10            # steps per second
SIM_DURATION = 60       # seconds
TOTAL_STEPS = 600       # 60s * 10hz

N_STANDARD_MIN, N_STANDARD_MAX = 1, 50
STEP_SIZE = 0.09        # metres per tick (~0.9 m/s at 10 Hz)
TURN_RATE = 0.15        # max radians of heading change per tick
WALL_MARGIN = 0.3       # stay this far from polygon boundary
WALL_THICKNESS = 0.35   # buffer around each wall/furniture segment

# The URL for our new standalone AI Brain
BRAIN_API_URL = "http://127.0.0.1:8001/act_batch"


def _build_polygon(boundaries: list[list[float]]) -> Polygon:
    """Build a Shapely polygon, closing the ring if needed."""
    coords = [tuple(p[:2]) for p in boundaries]
    if coords and coords[0] != coords[-1]:
        coords.append(coords[0])
    return Polygon(coords)


def _sample_inside(poly: Polygon, rng: random.Random) -> tuple[float, float]:
    """Rejection-sample a random point inside *poly*."""
    minx, miny, maxx, maxy = poly.bounds
    for _ in range(10_000):
        x = rng.uniform(minx, maxx)
        y = rng.uniform(miny, maxy)
        if poly.contains(Point(x, y)):
            return x, y
    c = poly.centroid
    return c.x, c.y


@dataclass
class SimulationEngine:
    """Pre-compute trajectory frames using the MARL Brain API."""

    boundaries: list[list[float]]
    obstacles: list[list[float]] = field(default_factory=list)
    exit_pos: list[float] | None = None
    roles: list[dict] = field(default_factory=list)
    n_standard: int = 30
    n_specialist: int = 3
    seed: int | None = 42

    _trajectories: dict | None = field(default=None, repr=False)
    _MODEL = "claude-3-haiku-20240307"

    def __post_init__(self):
        self.anthropic_client = None
        if _ANTHROPIC_AVAILABLE:
            api_key = os.getenv("ANTHROPIC_API_KEY")
            if api_key:
                self.anthropic_client = anthropic.Anthropic(api_key=api_key)

    def run(self) -> dict:
        n_total, rng, walk_area, agent_types, positions, headings, role_assignments, role_walk_areas, agent_colors = self._setup_environment()
        trajectories: dict[str, dict[str, dict]] = {}

        # --- THE NEW MARL BRAIN LOOP ---
        agent_goals = {}
        for frame in range(TOTAL_STEPS):
            frame_data: dict[str, dict] = {}
            
            # --- LLM STRATEGIC BRAIN ---
            if frame % 50 == 0 and self.anthropic_client:
                user_prompt = f"We have {n_total} pedestrian agents in a simulation. Present coordinates: {positions}. Generate a strategic 2D waypoint [x, y] for each agent to navigate toward. Return ONLY a pure JSON list of coordinate pairs, e.g. [[1.0, 2.0], [3.0, 4.0]]. Do not include markdown codeblocks or extra text."
                try:
                    response = self.anthropic_client.messages.create(
                        model=self._MODEL,
                        max_tokens=1000,
                        messages=[{"role": "user", "content": user_prompt}]
                    )
                    raw_text = "".join([c.text for c in response.content if hasattr(c, "text")]).strip()
                    clean_text = re.sub(r"```(?:json)?|```", "", raw_text).strip()
                    goals = json.loads(clean_text)
                    for aid in range(min(n_total, len(goals))):
                        agent_goals[aid] = goals[aid]
                        print(f"\033[95m🧠 [CLAUDE STRATEGY] Frame {frame}: Agent {aid} assigned waypoint {goals[aid]}\033[0m", flush=True)
                except Exception as e:
                    print(f"\033[91m[SimEngine] Claude API failed: {e}. Using random targets.\033[0m", flush=True)
                    for aid in range(n_total):
                        agent_goals[aid] = list(_sample_inside(role_walk_areas[aid], rng))
            
            # Gather what all agents "see" (The State)
            batch_states = []
            for aid in range(n_total):
                x, y = positions[aid]
                
                # --- REAL SENSOR DATA ---
                current_heading = headings[aid]
                agent_pt = Point(x, y)
                
                def shoot_ray(angle, max_dist):
                    end_x = x + math.cos(angle) * max_dist
                    end_y = y + math.sin(angle) * max_dist
                    ray = LineString([(x, y), (end_x, end_y)])
                    
                    hit = ray.intersection(role_walk_areas[aid].boundary)
                    if hit.is_empty:
                        return max_dist 
                    return agent_pt.distance(hit) 

                ray_front = shoot_ray(current_heading, 5.0)
                ray_left = shoot_ray(current_heading + 0.5, 5.0)
                ray_right = shoot_ray(current_heading - 0.5, 5.0)
                
                is_facing_door = 0.0 
                
                angle_to_exit = 0.0 
                if aid in agent_goals:
                    ex, ey = agent_goals[aid]
                    angle_to_exit = math.atan2(ey - y, x - x) # Fix: seems like intended ey-y, ex-x
                    # Wait, the original code had angle_to_exit = math.atan2(ey - y, ex - x)
                    # Let me keep it as ex-x
                    angle_to_exit = math.atan2(ey - y, ex - x)
                elif self.exit_pos is not None:
                    ex, ey = self.exit_pos
                    angle_to_exit = math.atan2(ey - y, ex - x)

                batch_states.append([ray_front, ray_left, ray_right, angle_to_exit, is_facing_door])

            # 2. Ask the Brain API what to do!
            try:
                response = requests.post(BRAIN_API_URL, json={"states": batch_states})
                actions = response.json().get("actions", [])
                if frame % 50 == 0:
                    print(f"\033[96m🤖 [MARL MOTOR] Frame {frame}: Executing physical actions -> {actions}\033[0m", flush=True)
            except Exception as e:
                if frame == 0:
                    print(f"[SimEngine] WARNING: Brain API failed or not running ({e}). Falling back to dummy actions.")
                actions = [0] * n_total

            # 3. Apply the AI's actions to move the agents
            for aid, action in enumerate(actions):
                x, y = positions[aid]
                heading = headings[aid]
                
                # The Brain's decisions translated to movement
                if action == 0:   # Move Forward
                    heading += rng.uniform(-0.05, 0.05) 
                    speed = STEP_SIZE
                elif action == 1: # Turn Left
                    heading += TURN_RATE
                    speed = STEP_SIZE * 0.5 
                elif action == 2: # Turn Right
                    heading -= TURN_RATE
                    speed = STEP_SIZE * 0.5
                elif action == 3: # Interact (Open Door)
                    speed = 0.0 # Stop to open the door
                else:
                    speed = STEP_SIZE
                
                dx = math.cos(heading) * speed
                dy = math.sin(heading) * speed
                nx, ny = x + dx, y + dy

                # Check wall collision using your original Shapely logic
                if role_walk_areas[aid].contains(Point(nx, ny)):
                    positions[aid] = [nx, ny]
                    headings[aid] = heading
                else:
                    headings[aid] = headings[aid] + math.pi + rng.uniform(-0.5, 0.5)

                frame_data[str(aid)] = {
                    "pos": [round(positions[aid][0], 4), round(positions[aid][1], 4)],
                    "type": agent_types[aid],
                    "color": agent_colors[aid],
                    "action": action 
                }

            trajectories[str(frame)] = frame_data

        self._trajectories = trajectories
        print(f"[SimEngine] MARL Brain generated {TOTAL_STEPS} frames for {n_total} agents")
        return trajectories

    def save(self, path) -> Path:
        """Write trajectories to a JSON file and return the path."""
        path = Path(path)
        data = self._trajectories if self._trajectories is not None else {}
        path.write_text(json.dumps(data))
        return path

    def _setup_environment(self):
        """Shared setup logic for both run() and stream()."""
        poly = _build_polygon(self.boundaries)

        if not poly.is_valid or poly.is_empty:
            poly = Polygon([(-5, -5), (5, -5), (5, 5), (-5, 5)])

        walk_area = poly.buffer(-WALL_MARGIN)
        if walk_area.is_empty or not walk_area.is_valid:
            walk_area = poly

        if self.obstacles:
            wall_polys = []
            for seg in self.obstacles:
                if len(seg) >= 4:
                    line = LineString([(seg[0], seg[1]), (seg[2], seg[3])])
                    wall_polys.append(line.buffer(WALL_THICKNESS))
            if wall_polys:
                walls_union = unary_union(wall_polys)
                walk_area = walk_area.difference(walls_union)
                if walk_area.is_empty or not walk_area.is_valid:
                    walk_area = poly.buffer(-WALL_MARGIN)

        rng = random.Random(self.seed)
        
        n_total = 0
        agent_types = []
        positions = []
        headings = []
        role_assignments = []
        role_walk_areas = []
        agent_colors = []

        if self.roles:
            per_role_exclusive = []  
            for role in self.roles:
                areas = role.get("areas", [])
                if areas:
                    cell_polys = [Polygon([(gx-0.5, gy-0.5), (gx+0.5, gy-0.5), (gx+0.5, gy+0.5), (gx-0.5, gy+0.5)]) for gx, gy in areas]
                    role_poly = unary_union(cell_polys).buffer(0.01)
                    intersected = walk_area.intersection(role_poly)
                    per_role_exclusive.append(intersected if not intersected.is_empty and intersected.is_valid else None)
                else:
                    per_role_exclusive.append(None)

            for role_idx, role in enumerate(self.roles):
                count = role.get("count", 0)
                color = role.get("color", "#ffffff")

                r_walk_area = walk_area 
                for other_idx, other_excl in enumerate(per_role_exclusive):
                    if other_idx != role_idx and other_excl is not None:
                        r_walk_area = r_walk_area.difference(other_excl)
                        if r_walk_area.is_empty or not r_walk_area.is_valid:
                            r_walk_area = walk_area 
                            break

                print(f"[SimEngine] Role '{role.get('name','?')}' walk_area area: {r_walk_area.area:.2f} m² (full={walk_area.area:.2f})", flush=True)

                for _ in range(count):
                    if n_total >= 2: break  
                    n_total += 1
                    agent_types.append("standard")
                    role_assignments.append(role_idx)
                    agent_colors.append(color)
                    role_walk_areas.append(r_walk_area)
                if n_total >= 2: break
                
            # Find a single common starting point
            if role_walk_areas:
                common_area = role_walk_areas[0]
                for r_area in role_walk_areas[1:]:
                    common_area = common_area.intersection(r_area)
                
                spawn_area = walk_area
                if common_area and not common_area.is_empty and common_area.is_valid:
                    spawn_area = common_area
                spawn_x, spawn_y = _sample_inside(spawn_area, rng)
                
                for _ in role_walk_areas:
                    positions.append([spawn_x + rng.uniform(-0.1, 0.1), spawn_y + rng.uniform(-0.1, 0.1)])
                    headings.append(rng.uniform(0, 2 * math.pi))
        else:
            self.n_standard = 2
            self.n_specialist = 0
            n_std = max(N_STANDARD_MIN, min(N_STANDARD_MAX, self.n_standard))
            n_spc = max(0, self.n_specialist)
            n_total = n_std + n_spc
            
            agent_types = (["standard"] * n_std) + (["specialist"] * n_spc)
            role_assignments = [0] * n_total
            role_walk_areas = [walk_area] * n_total
            agent_colors = ["#ffffff"] * n_total
            
            for _ in range(n_total):
                x, y = _sample_inside(walk_area, rng)
                positions.append([x, y])
                headings.append(rng.uniform(0, 2 * math.pi))

        print(f"[SimEngine:setup] Spawned {n_total} agents inside polygon", flush=True)
        return n_total, rng, walk_area, agent_types, positions, headings, role_assignments, role_walk_areas, agent_colors

    def _ask_claude_wall_decision(self, aid: int, ray_front: float, ray_left: float, ray_right: float) -> int:
        """Ask Claude what an agent should do when facing a wall. Returns action int."""
        user_prompt = (
            f"You are controlling pedestrian Agent {aid} in a building simulation. "
            f"The agent sees a wall {ray_front:.2f}m directly ahead. "
            f"Turning left gives {ray_left:.2f}m of clearance. "
            f"Turning right gives {ray_right:.2f}m of clearance. "
            f"Reply with ONLY one of these exact words: TURN_LEFT, TURN_RIGHT, or MOVE_FORWARD"
        )
        try:
            response = self.anthropic_client.messages.create(
                model=self._MODEL,
                max_tokens=20,
                messages=[{"role": "user", "content": user_prompt}]
            )
            decision = "".join([c.text for c in response.content if hasattr(c, "text")]).strip().upper()
            if "LEFT" in decision:
                print(f"\033[91m🆘 [CLAUDE WALL] Agent {aid} at wall ({ray_front:.2f}m) → TURN LEFT\033[0m", flush=True)
                return 1
            elif "RIGHT" in decision:
                print(f"\033[91m🆘 [CLAUDE WALL] Agent {aid} at wall ({ray_front:.2f}m) → TURN RIGHT\033[0m", flush=True)
                return 2
            else:
                print(f"\033[91m🆘 [CLAUDE WALL] Agent {aid} at wall ({ray_front:.2f}m) → MOVE FORWARD\033[0m", flush=True)
                return 0
        except Exception as e:
            print(f"\033[91m[CLAUDE WALL] API failed: {e}\033[0m", flush=True)
            return 1 if ray_left > ray_right else 2

    def stream(self):
        """Generator: yields frames indefinitely in real-time until the client disconnects.

        Claude is called:
        1. Every 50 frames for strategic waypoints (every 5 seconds).
        2. When an agent hits a wall < 1.2m — but with a 20-frame cooldown per agent,
           so it only asks Claude ONCE per wall encounter, not every frame.
        """
        n_total, rng, walk_area, agent_types, positions, headings, role_assignments, role_walk_areas, agent_colors = self._setup_environment()

        agent_goals = {}
        claude_wall_last_frame: dict[int, int] = {}
        claude_wall_action: dict[int, int] = {}


        WALL_TRIGGER_DIST = 1.2   # metres — start asking Claude when this close to a wall
        WALL_COOLDOWN = 20        # frames — don't ask again for 2 seconds after last answer
        STRATEGY_INTERVAL = 50    # frames — how often Claude gives new waypoints

        import time
        import traceback
        
        for frame in range(TOTAL_STEPS):
            try:
                frame_data: dict[str, dict] = {}

                # --- LLM STRATEGIC BRAIN ---
                if frame % STRATEGY_INTERVAL == 0 and self.anthropic_client:
                    minx, miny, maxx, maxy = walk_area.bounds
                    cx, cy = (minx + maxx) / 2, (miny + maxy) / 2
                    user_prompt = (
                        f"You are guiding {n_total} pedestrian agents to EXPLORE the entire floor plan.\n"
                        f"Building bounds: X=[{minx:.1f}, {maxx:.1f}], Y=[{miny:.1f}, {maxy:.1f}], Center=[{cx:.1f},{cy:.1f}].\n"
                        f"Agent current positions: {[[round(p[0],2), round(p[1],2)] for p in positions]}.\n"
                        f"RULES:\n"
                        f"- Send each agent to a DIFFERENT target coordinate.\n"
                        f"- The targets must be within the building bounds above.\n"
                        f"- Force agents to move long distances to opposite ends of the building.\n"
                        f"- Vary the targets each time — don't send them to the same places repeatedly.\n"
                        f"Return ONLY a JSON list of [x, y] pairs, one per agent. No markdown, no explanation."
                    )
                    
                    #Ask Claude async in background so we NEVER block the frame loop
                    def _fetch_strategy(_prompt=user_prompt, _frame=frame):
                        try:
                            response = self.anthropic_client.messages.create(
                                model=self._MODEL,
                                max_tokens=1000,
                                messages=[{"role": "user", "content": _prompt}]
                            )
                            raw_text = "".join([c.text for c in response.content if hasattr(c, "text")]).strip()
                            clean = re.sub(r"```(?:json)?|```", "", raw_text).strip()
                            goals = json.loads(clean)
                            for aid in range(min(n_total, len(goals))):
                                agent_goals[aid] = goals[aid]
                                print(f"\033[95m🧠 [CLAUDE STRATEGY] Frame {_frame}: Agent {aid} → waypoint {goals[aid]}\033[0m", flush=True)
                        except Exception as e:
                            print(f"\033[91m[SimEngine] Claude strategy failed: {e}\033[0m", flush=True)
                    
                    threading.Thread(target=_fetch_strategy, daemon=True).start()

                # --- SENSOR + MARL BATCH ---
                batch_states = []
                per_agent_rays = []

                for aid in range(n_total):
                    x, y = positions[aid]
                    heading = headings[aid]
                    agent_pt = Point(x, y)

                    def shoot_ray(angle, max_dist, _x=x, _y=y, _pt=agent_pt):
                        end_x = _x + math.cos(angle) * max_dist
                        end_y = _y + math.sin(angle) * max_dist
                        ray = LineString([(_x, _y), (end_x, end_y)])
                        hit = ray.intersection(role_walk_areas[aid].boundary)
                        if hit.is_empty:
                            return max_dist
                        return _pt.distance(hit)

                    ray_front = shoot_ray(heading, 5.0)
                    ray_left  = shoot_ray(heading + 0.5, 5.0)
                    ray_right = shoot_ray(heading - 0.5, 5.0)
                    per_agent_rays.append((ray_front, ray_left, ray_right))

                    angle_to_exit = 0.0
                    if aid in agent_goals:
                        ex, ey = agent_goals[aid]
                        angle_to_exit = math.atan2(ey - y, ex - x)
                    elif self.exit_pos:
                        ex, ey = self.exit_pos
                        angle_to_exit = math.atan2(ey - y, ex - x)

                    batch_states.append([ray_front, ray_left, ray_right, angle_to_exit, 0.0])
                
                # --- MARL MOTOR BRAIN ---
                try:
                    resp = requests.post(BRAIN_API_URL, json={"states": batch_states}, timeout=2)
                    actions = resp.json().get("actions", [0] * n_total)
                except Exception:
                    actions = [0] * n_total


                # --- APPLY ACTIONS + CLAUDE WALL OVERRIDE ---
                for aid, action in enumerate(actions):
                    x, y = positions[aid]
                    heading = headings[aid]
                    ray_front, ray_left, ray_right = per_agent_rays[aid]

                    #  WALL DETECTED — ask Claude in background, use heuristic immediately
                    if ray_front < WALL_TRIGGER_DIST:
                        frames_since_last_call = frame - claude_wall_last_frame.get(aid, -9999)

                        if frames_since_last_call >= WALL_COOLDOWN:
                            # Immediately use a smart heuristic.
                            immediate_action = 1 if ray_left > ray_right else 2

                            claude_wall_action[aid] = immediate_action
                            claude_wall_last_frame[aid] = frame
                            action = immediate_action

                            # Ask Claude async in background.
                            if self.anthropic_client:
                                _rf, _rl, _rr, _aid = ray_front, ray_left, ray_right, aid
                                def _ask_async(_aid=_aid, _rf=_rf, _rl=_rl, _rr=_rr):
                                    print(f"\033[93m📡 [AGENT {_aid}→CLAUDE] Wall {_rf:.2f}m ahead | Left={_rl:.2f}m Right={_rr:.2f}m — asking...\033[0m", flush=True)
                                    result = self._ask_claude_wall_decision(_aid, _rf, _rl, _rr)
                                    claude_wall_action[_aid] = result  # update for next encounter
                                threading.Thread(target=_ask_async, daemon=True).start()
                        else:
                            action = claude_wall_action.get(aid, action)

                    elif aid in claude_wall_action and ray_front >= WALL_TRIGGER_DIST + 0.3:
                        # Agent cleared the wall — MARL takes back over
                        del claude_wall_action[aid]

                    if action == 0:
                        heading += rng.uniform(-0.05, 0.05)
                        speed = STEP_SIZE
                    elif action == 1:
                        heading += TURN_RATE
                        speed = STEP_SIZE * 0.5
                    elif action == 2:
                        heading -= TURN_RATE
                        speed = STEP_SIZE * 0.5
                    else:
                        speed = STEP_SIZE # Fallback to move forward instead of stopping

                    dx = math.cos(heading) * speed
                    dy = math.sin(heading) * speed
                    nx, ny = x + dx, y + dy

                    # --- MOVEMENT LOGIC ---
                    if role_walk_areas[aid].contains(Point(nx, ny)):
                        positions[aid] = [nx, ny]
                        headings[aid] = heading
                    else:
                        headings[aid] = heading + math.pi + rng.uniform(-0.5, 0.5)

                    frame_data[str(aid)] = {
                        "pos": [round(positions[aid][0], 4), round(positions[aid][1], 4)],
                        "type": agent_types[aid],
                        "color": agent_colors[aid],
                        "action": int(action),
                        "rays": [round(ray_front, 2), round(ray_left, 2), round(ray_right, 2)],
                    }

                yield frame, frame_data

                time.sleep(0.05)
                
            except Exception as e:
                print(f"\033[91m[SimEngine] Loop crashed: {e}\n{traceback.format_exc()}\033[0m", flush=True)
                break