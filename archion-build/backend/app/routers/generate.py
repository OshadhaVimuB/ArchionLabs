"""
Floor Plan Generation Router.

Provides the public POST endpoint for generating floor plans
from natural language descriptions.
"""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.config import GROQ_API_KEY, GROQ_MODEL
from app.database import get_db
from app.models.db_models import Project, ChatHistory
from app.services.geometry import LayoutSolver
from app.services.groq_intent import IntentParser
from app.services.model3d import generate_threejs_json, generate_cadquery_script
from app.models.floorplan import FloorPlan

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/generate", tags=["Generation"])

# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------


class GenerateRequest(BaseModel):
    """Request body for floor plan generation."""
    prompt: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Natural language description of the desired floor plan",
        examples=["I need a house with 3 bedrooms, 2 bathrooms, a kitchen, and a living room"],
    )


class GenerateResponse(BaseModel):
    """Response body containing the generated floor plan."""
    project_id: str = Field(..., description="ID of the persisted project")
    floorplan: dict = Field(..., description="The generated FloorPlan object")
    message: str = Field(..., description="Summary message for the chat assistant")


class ModelRequest(BaseModel):
    """Request body for 3D model / script generation."""
    project_id: str = Field(..., description="ID of the project to generate from")


class ThreeJSResponse(BaseModel):
    """Response body containing Three.js mesh JSON."""
    project_id: str
    data: dict = Field(..., description="Three.js mesh description JSON")


class CadQueryResponse(BaseModel):
    """Response body containing CadQuery Python script."""
    project_id: str
    script: str = Field(..., description="CadQuery Python script text")


# ---------------------------------------------------------------------------
# Endpoint — Floor Plan Generation
# ---------------------------------------------------------------------------


@router.post("/floorplan", response_model=GenerateResponse)
async def generate_floorplan(
    request: GenerateRequest,
    db: Session = Depends(get_db),
):
    """
    Generate a floor plan from a natural language description.

    This endpoint is **public** (no authentication required).

    Pipeline:
    1. Parse the user prompt into room requirements (LLM or regex fallback).
    2. Feed the rooms into the ``LayoutSolver`` to produce a ``FloorPlan``.
    3. Persist the project and chat history into the database.
    4. Return the floor plan with metadata.
    """
    try:
        # 1. Parse intent
        parser = IntentParser(api_key=GROQ_API_KEY, model=GROQ_MODEL)
        room_requirements = parser.parse(request.prompt)
        logger.info(f"Parsed {len(room_requirements)} rooms from prompt")

        # 2. Generate floor plan
        solver = LayoutSolver()
        floorplan = solver.solve(room_requirements)
        floorplan_dict = floorplan.model_dump()

        # Build a human-readable summary
        room_names = [r["name"] for r in room_requirements]
        summary = (
            f"Generated a floor plan with {len(room_requirements)} rooms: "
            f"{', '.join(room_names)}. "
            f"Total area: {floorplan.total_area:.1f} m²."
        )

        # 3. Persist project
        project = Project(
            name=f"Plan — {room_names[0] if room_names else 'Custom'}",
            description=request.prompt,
            floorplan_data=floorplan_dict,
        )
        db.add(project)
        db.flush()  # Get the generated ID

        # 4. Persist chat history
        user_message = ChatHistory(
            project_id=project.id,
            role="user",
            content=request.prompt,
        )
        assistant_message = ChatHistory(
            project_id=project.id,
            role="assistant",
            content=summary,
        )
        db.add(user_message)
        db.add(assistant_message)
        db.commit()

        logger.info(f"Project {project.id} created successfully")

        return GenerateResponse(
            project_id=project.id,
            floorplan=floorplan_dict,
            message=summary,
        )

    except Exception as e:
        db.rollback()
        logger.error(f"Floor plan generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Floor plan generation failed: {str(e)}",
        )


# ---------------------------------------------------------------------------
# Endpoint — Three.js JSON
# ---------------------------------------------------------------------------


@router.post("/threejs", response_model=ThreeJSResponse)
async def generate_threejs(
    request: ModelRequest,
    db: Session = Depends(get_db),
):
    """
    Generate a Three.js JSON mesh description from a persisted project.

    Public endpoint (no authentication required).
    """
    project = db.query(Project).filter(Project.id == request.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        plan = FloorPlan(**project.floorplan_data)
        data = generate_threejs_json(plan)
        return ThreeJSResponse(project_id=request.project_id, data=data)
    except Exception as e:
        logger.error(f"Three.js generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Three.js generation failed: {str(e)}",
        )


# ---------------------------------------------------------------------------
# Endpoint — CadQuery Script
# ---------------------------------------------------------------------------


@router.post("/cadquery", response_model=CadQueryResponse)
async def generate_cadquery(
    request: ModelRequest,
    db: Session = Depends(get_db),
):
    """
    Generate a CadQuery Python script from a persisted project.

    Public endpoint (no authentication required).
    """
    project = db.query(Project).filter(Project.id == request.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        plan = FloorPlan(**project.floorplan_data)
        script = generate_cadquery_script(plan)
        return CadQueryResponse(project_id=request.project_id, script=script)
    except Exception as e:
        logger.error(f"CadQuery generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"CadQuery generation failed: {str(e)}",
        )
