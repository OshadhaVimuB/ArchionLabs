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
import base64
import io

from app.config import ANTHROPIC_API_KEY, ANTHROPIC_MODEL
from app.database import get_db

from app.models.db_models import Project, ChatHistory
from app.services.geometry import LayoutSolver
from app.services.claude_intent import IntentParser
from app.services.model3d import generate_threejs_json, generate_cadquery_script
from app.models.floorplan import FloorPlan
from app.services.dashboard_sync import sync_project_to_dashboard

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
    model: str | None = Field(
        None,
        description="The AI model to use for generation",
    )
    current_floorplan: dict | None = Field(
        None,
        description="The existing floor plan to modify (optional)",
    )


class GenerateResponse(BaseModel):
    """Response body containing the generated floor plan."""
    project_id: str = Field(..., description="ID of the persisted project")
    floorplan: dict = Field(..., description="The generated FloorPlan object")
    message: str = Field(..., description="Summary message for the chat assistant")


class ExtractRequest(BaseModel):
    """Request body for extracting floor plans from uploaded files."""
    file_name: str = Field(..., description="Original file name")
    mime_type: str = Field(..., description="MIME type of the file")
    file_data: str = Field(..., description="Base64 encoded file data")
    model: str | None = Field(
        None,
        description="The AI model to use for extraction",
    )


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
# Endpoint — List User Projects
# ---------------------------------------------------------------------------


@router.get("/projects")
async def list_projects(
    db: Session = Depends(get_db),
):
    """
    Return all projects belonging to the authenticated user.
    """
    projects = (
        db.query(Project)
        .order_by(Project.created_at.desc())
        .all()
    )
    return {
        "projects": [
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in projects
        ]
    }


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
        model_to_use = request.model if request.model else ANTHROPIC_MODEL
        parser = IntentParser(api_key=ANTHROPIC_API_KEY, model=model_to_use)

        if request.current_floorplan:
            # Modify existing plan
            logger.info("Modifying existing floor plan based on prompt")
            floorplan_dict = parser.modify_floorplan(request.current_floorplan, request.prompt)
            floorplan = FloorPlan(**floorplan_dict)
            floorplan_dict = floorplan.model_dump()
            room_names = [r.name for r in floorplan.levels[0].rooms] if floorplan.levels and floorplan.levels[0].rooms else []
            summary = "Updated floor plan based on your request."
        else:
            floorplan_dict = None

            # For powerful models, try direct LLM generation first
            if "sonnet" in model_to_use.lower() or "opus" in model_to_use.lower():
                logger.info(f"Attempting direct LLM generation with {model_to_use}")
                direct_result = parser.generate_full_floorplan(request.prompt)
                if direct_result:
                    floorplan_dict = direct_result
                    logger.info("Direct LLM generation succeeded")

            # Fallback: parse rooms then use LayoutSolver
            if floorplan_dict is None:
                logger.info("Using IntentParser → LayoutSolver pipeline")
                room_requirements = parser.parse(request.prompt)
                logger.info(f"Parsed {len(room_requirements)} rooms from prompt")

                solver = LayoutSolver()
                floorplan = solver.solve(room_requirements)
                floorplan_dict = floorplan.model_dump()

            floorplan = FloorPlan(**floorplan_dict)
            floorplan_dict = floorplan.model_dump()

            room_names = [r.name for r in floorplan.levels[0].rooms] if floorplan.levels and floorplan.levels[0].rooms else []
            total_area = floorplan.total_area or sum(
                r.area for level in floorplan.levels for r in level.rooms if r.area
            )
            summary = (
                f"Generated a floor plan with {len(room_names)} rooms: "
                f"{', '.join(room_names)}. "
                f"Total area: {total_area:.1f} m²."
            )

        # 3. Persist project
        project = Project(
            user_id=None,
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

        # 5. Sync to landing-page dashboard
        sync_project_to_dashboard(
            db,
            source_project_id=str(project.id),
            name=f"Plan — {room_names[0] if room_names else 'Custom'}",
            description=request.prompt,
        )
        db.commit()

        logger.info(f"Project {project.id} created successfully")

        return GenerateResponse(
            project_id=str(project.id),
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


@router.post("/extract-floorplan", response_model=GenerateResponse)
async def extract_floorplan(
    request: ExtractRequest,
    db: Session = Depends(get_db),
):
    """
    Extract a floor plan from an uploaded file (Image/PDF/DXF).
    """
    try:
        model_to_use = request.model if request.model else ANTHROPIC_MODEL
        parser = IntentParser(api_key=ANTHROPIC_API_KEY, model=model_to_use)

        base64_img = None
        img_media_type = "image/png"  # default for converted images

        if request.mime_type in ["image/png", "image/jpeg", "image/jpg"]:
            base64_img = request.file_data
            img_media_type = "image/png" if request.mime_type == "image/png" else "image/jpeg"
        elif request.mime_type == "application/pdf":
            import fitz # PyMuPDF
            file_bytes = base64.b64decode(request.file_data)
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            if len(doc) == 0:
                raise ValueError("PDF is empty")
            page = doc.load_page(0)
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2)) # 2x zoom for better resolution
            base64_img = base64.b64encode(pix.tobytes("png")).decode("utf-8")
            img_media_type = "image/png"
        elif request.mime_type == "application/dxf" or request.file_name.lower().endswith(".dxf"):
            import ezdxf
            import ezdxf.addons.drawing as drawing
            import ezdxf.addons.drawing.matplotlib as matplotlib_backend
            import matplotlib.pyplot as plt
            
            file_bytes = base64.b64decode(request.file_data)
            
            # Write to a temp file because ezdxf prefers file paths or text streams for some operations
            import tempfile
            import os
            
            fd, path = tempfile.mkstemp(suffix=".dxf")
            try:
                with os.fdopen(fd, 'wb') as f:
                    f.write(file_bytes)
                    
                doc = ezdxf.readfile(path)
                msp = doc.modelspace()
                
                # Render to PNG
                fig = plt.figure()
                ax = fig.add_axes([0, 0, 1, 1])
                ctx = drawing.RenderContext(doc)
                out = matplotlib_backend.MatplotlibBackend(ax)
                drawing.Frontend(ctx, out).draw_layout(msp, finalize=True)
                
                buf = io.BytesIO()
                fig.savefig(buf, format="png", dpi=300)
                plt.close(fig)
                base64_img = base64.b64encode(buf.getvalue()).decode("utf-8")
                img_media_type = "image/png"
                
            finally:
                os.remove(path)
                
        else:
             raise HTTPException(status_code=400, detail=f"Unsupported file type: {request.mime_type}")

        if not base64_img:
             raise HTTPException(status_code=400, detail="Failed to extract image from file")

        # Use vision model to extract floorplan
        floorplan_dict = parser.extract_from_image(base64_img, media_type=img_media_type)
        floorplan = FloorPlan(**floorplan_dict)

        room_names = [r.name for r in floorplan.levels[0].rooms] if floorplan.levels and floorplan.levels[0].rooms else []
        summary = f"Extracted floor plan from {request.file_name}."

        # 3. Persist project
        project = Project(
            user_id=None,
            name=f"Extracted Plan — {request.file_name}",
            description=f"Extracted from {request.file_name}",
            floorplan_data=floorplan_dict,
        )
        db.add(project)
        db.flush()  # Get the generated ID

        # 4. Persist chat history
        user_message = ChatHistory(
            project_id=project.id,
            role="user",
            content=f"Upload file {request.file_name}",
        )
        assistant_message = ChatHistory(
            project_id=project.id,
            role="assistant",
            content=summary,
        )
        db.add(user_message)
        db.add(assistant_message)
        db.commit()

        # 5. Sync to landing-page dashboard
        sync_project_to_dashboard(
            db,
            source_project_id=str(project.id),
            name=f"Extracted Plan — {request.file_name}",
            description=f"Extracted from {request.file_name}",
        )
        db.commit()

        logger.info(f"Project {project.id} created successfully from extract")

        return GenerateResponse(
            project_id=str(project.id),
            floorplan=floorplan_dict,
            message=summary,
        )

    except Exception as e:
        db.rollback()
        import traceback
        error_details = traceback.format_exc()
        logger.error(f"Floor plan extraction failed:\n{error_details}")
        raise HTTPException(
            status_code=500,
            detail=f"Floor plan extraction failed: {str(e)}",
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
