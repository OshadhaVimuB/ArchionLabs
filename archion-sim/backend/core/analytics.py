from __future__ import annotations

import math

import numpy as np 
from scipy.ndimage import gaussian_filter
from shapely.geometry import Point, Polygon

SIM_HZ = 10 
DT = 1.0 / SIM_HZ  
SLOW_THRESHOLD = 0.2  
EXIT_THRESHOLD = 1.0 
HEATMAP_RESOLUTION = 0.5 

class AnalyticsEngine:
    """Process simulation trajectory data into performance metrics."""

    def __init__(
        self,
        trajectories: dict,
        boundary_coords: list,
        exit_pos: list | None = None,
        floor_area: float = 0.0,
    ) -> None:
        self._traj = trajectories
        self._boundary = boundary_coords
        self._exit_pos = exit_pos
        self._floor_area = floor_area
        self._polygon = self._build_polygon(boundary_coords)

        # Parse trajectory into numpy arrays
        self._frame_keys = sorted(trajectories.keys(), key=int)
        self._n_frames = len(self._frame_keys)

        if self._n_frames > 0:
            self._agent_ids = sorted(trajectories[self._frame_keys[0]].keys(), key=int)
        else:
            self._agent_ids = []
        self._n_agents = len(self._agent_ids)

        # Build position array: shape (n_frames, n_agents, 2)
        self._positions = np.zeros((self._n_frames, self._n_agents, 2))
        for fi, fk in enumerate(self._frame_keys):
            frame = trajectories[fk]
            for ai, aid in enumerate(self._agent_ids):
                if aid in frame:
                    self._positions[fi, ai] = frame[aid]["pos"]

        # Compute velocities: shape (n_frames-1, n_agents)
        if self._n_frames > 1:
            deltas = np.diff(self._positions, axis=0)
            self._velocities = np.linalg.norm(deltas, axis=2) / DT
        else:
            self._velocities = np.zeros((0, self._n_agents))

        print(f"[Analytics] Parsed {self._n_frames} frames, {self._n_agents} agents")

    @staticmethod
    def _build_polygon(coords: list) -> Polygon:
        pts = [tuple(p[:2]) for p in coords]
        if pts and pts[0] != pts[-1]:
            pts.append(pts[0])
        if len(pts) < 4:
            return Polygon()
        return Polygon(pts)

#Flow rate

    def _compute_flow_rate(self) -> list[dict]:
        """Track agents reaching boundary edge per time window."""
        if self._n_frames < 2 or self._n_agents == 0:
            return []

        boundary_np = np.array(self._boundary)
        window_frames = SIM_HZ * 10  # 10-second windows
        results: list[dict] = []

        # Track when each agent first reaches within EXIT_THRESHOLD of boundary
        exited_frame: dict[int, int] = {}

        for fi in range(self._n_frames):
            for ai in range(self._n_agents):
                if ai in exited_frame:
                    continue
                pos = self._positions[fi, ai]
                # Check distance to nearest boundary segment
                min_dist = self._point_to_polygon_boundary_dist(pos)
                if min_dist < EXIT_THRESHOLD:
                    exited_frame[ai] = fi

        # Bin exits into windows
        n_windows = max(1, math.ceil(self._n_frames / window_frames))
        for w in range(n_windows):
            start_frame = w * window_frames
            end_frame = min((w + 1) * window_frames, self._n_frames)
            exits_in_window = sum(
                1 for af in exited_frame.values()
                if start_frame <= af < end_frame
            )
            window_duration_min = (end_frame - start_frame) / SIM_HZ / 60.0
            rate = exits_in_window / window_duration_min if window_duration_min > 0 else 0
            results.append({
                "time_sec": round(start_frame / SIM_HZ, 1),
                "agents_per_minute": round(rate, 2),
            })

        return results

    def _point_to_polygon_boundary_dist(self, pos: np.ndarray) -> float:
        """Distance from a point to the nearest polygon boundary edge."""
        pt = Point(pos[0], pos[1])
        return self._polygon.exterior.distance(pt) if not self._polygon.is_empty else float("inf")

# Congestion index
    def _compute_congestion_index(self) -> dict:
            """Percentage of agent-frames where velocity < threshold."""
            if self._velocities.size == 0:
                return {"percentage": 0.0, "slow_threshold_ms": SLOW_THRESHOLD}

            slow_count = np.sum(self._velocities < SLOW_THRESHOLD)
            total = self._velocities.size
            pct = float(slow_count / total * 100)

            return {
                "percentage": round(pct, 1),
                "slow_threshold_ms": SLOW_THRESHOLD,
            }

# Efficiency score
def _compute_efficiency_score(self) -> dict:
        """Compare ideal path length vs actual path taken."""
        if self._n_frames < 2 or self._n_agents == 0:
            return {"average": 0.0, "per_agent": []}

        per_agent: list[float] = []
        for ai in range(self._n_agents):
            start = self._positions[0, ai]
            end = self._positions[-1, ai]
            ideal = float(np.linalg.norm(end - start))

            # Actual = sum of segment lengths
            segments = np.diff(self._positions[:, ai], axis=0)
            actual = float(np.sum(np.linalg.norm(segments, axis=1)))

            if actual > 0:
                eff = min(ideal / actual, 1.0)
            else:
                eff = 1.0 if ideal < 0.01 else 0.0

            per_agent.append(round(eff, 3))

        avg = float(np.mean(per_agent)) if per_agent else 0.0
        return {
            "average": round(avg, 3),
            "per_agent": per_agent,
        }