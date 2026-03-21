"""
Upload router — POST /api/upload
Accepts a 3D model file (and optional MTL + texture files) via multipart form data.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.services.upload_service import save_upload

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("", status_code=201, summary="Upload a 3D model")
async def upload_model(
    model_file: Annotated[
        UploadFile,
        File(description="Primary 3D model file (.gltf, .glb, .obj, .fbx, .stl)"),
    ],
    mtl_file: Annotated[
        UploadFile | None,
        File(description="MTL material file (required for textured OBJ models)"),
    ] = None,
    texture_files: Annotated[
        list[UploadFile] | None,
        File(description="Texture image files (.jpg, .png, .tga …) that accompany the MTL"),
    ] = None,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """
    Upload a 3D model to persistent server-side storage.

    For **OBJ** models you can also upload the accompanying `.mtl` file and any
    texture images in the same request so that the viewer can reconstruct materials.

    Returns a `model_id` that can be used to:
    - Fetch the model file via `GET /api/models/{model_id}/file`
    - Create a shareable link via `POST /api/share`
    """
    record = await save_upload(
        model_file=model_file,
        db=db,
        mtl_file=(mtl_file if mtl_file and mtl_file.filename else None),
        texture_files=(
            [tf for tf in texture_files if tf.filename] if texture_files else None
        ),
    )

    return {
        "model_id": record.id,
        "original_filename": record.original_filename,
        "model_format": record.model_format,
        "file_size": record.file_size,
        "created_at": record.created_at.isoformat(),
        "model_url": f"/api/models/{record.id}/file",
        "mtl_url": f"/api/models/{record.id}/mtl" if record.mtl_path else None,
    }
