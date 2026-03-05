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


# ---------------------------------------------------------------------------
# Endpoint
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
