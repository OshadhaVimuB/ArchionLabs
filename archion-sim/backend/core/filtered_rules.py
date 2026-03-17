from __future__ import annotations
from .compliance import ComplianceChecker
from .geometry import ExtractionResult

def run_context_aware_audit(geometry_data: ExtractionResult | dict, building_type: str, trajectories: dict | None = None):
    """
    Implementation of the Context-Aware Rules filtering stage.
    This bridge script takes the building type and geometry to perform a filtered compliance check.
    """
    checker = ComplianceChecker(building_type)
    
    # Handle both dict (from cache) and ExtractionResult objects
    if isinstance(geometry_data, dict):
        wall_segments = geometry_data.get("wall_segments", [])
        boundary_coords = geometry_data.get("boundary_coords", [])
        mesh_vertices = geometry_data.get("mesh_vertices")
        floor_area = geometry_data.get("floor_area", 0.0)
    else:
        wall_segments = geometry_data.obstacles
        boundary_coords = geometry_data.boundaries
        mesh_vertices = geometry_data.mesh_vertices
        floor_area = geometry_data.floor_area

    report = checker.run_full_audit(
        wall_segments=wall_segments,
        boundary_coords=boundary_coords,
        mesh_vertices=mesh_vertices,
        trajectories=trajectories,
        floor_area=floor_area
    )
    return report

def get_relevant_violations(geometry_data: ExtractionResult | dict, building_type: str, trajectories: dict | None = None):
    """Blueprint-specific function returning only violations."""
    report = run_context_aware_audit(geometry_data, building_type, trajectories)
    return [v.model_dump() for v in report.violations]
