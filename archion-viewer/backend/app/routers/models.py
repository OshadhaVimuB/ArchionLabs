"""
Models router — serves stored model files and metadata.

GET  /api/models/{model_id}                    — metadata
GET  /api/models/{model_id}/file               — primary model file
GET  /api/models/{model_id}/mtl                — MTL material file (OBJ only)
GET  /api/models/{model_id}/texture/{filename} — texture image file (OBJ only)
DELETE /api/models/{model_id}                  — delete model + files
"""
import json
import shutil

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config import UPLOAD_DIR
from app.database import get_db
from app.models.db_models import ModelUpload

router = APIRouter(prefix="/models", tags=["models"])


def _get_or_404(model_id: str, db: Session) -> ModelUpload:
    model = db.get(ModelUpload, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model


def _safe_file_response(file_path, filename: str, media_type: str = "application/octet-stream") -> FileResponse:
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    return FileResponse(path=str(file_path), filename=filename, media_type=media_type)


@router.get("/{model_id}", summary="Get model metadata")
def get_model_info(model_id: str, db: Session = Depends(get_db)):
    """Return metadata for a stored model, including URLs to its files."""
    model = _get_or_404(model_id, db)
    texture_map: dict = json.loads(model.texture_paths_json) if model.texture_paths_json else {}
    # Deduplicate: the map stores both original-case and lowercase keys
    unique_textures = list({v: k for k, v in texture_map.items()}.values())

    return {
        "model_id": model.id,
        "original_filename": model.original_filename,
        "model_format": model.model_format,
        "file_size": model.file_size,
        "created_at": model.created_at.isoformat(),
        "model_url": f"/api/models/{model.id}/file",
        "mtl_url": f"/api/models/{model.id}/mtl" if model.mtl_path else None,
        "texture_filenames": unique_textures,
    }


@router.get("/{model_id}/file", summary="Download model file")
def get_model_file(model_id: str, db: Session = Depends(get_db)):
    """Serve the primary 3D model binary (glTF, FBX, OBJ, STL …)."""
    model = _get_or_404(model_id, db)
    return _safe_file_response(
        UPLOAD_DIR / model.file_path,
        filename=model.original_filename,
    )


@router.get("/{model_id}/mtl", summary="Download MTL file")
def get_mtl_file(model_id: str, db: Session = Depends(get_db)):
    """Serve the MTL material file for an OBJ model."""
    model = _get_or_404(model_id, db)
    if not model.mtl_path:
        raise HTTPException(status_code=404, detail="No MTL file associated with this model")
    return _safe_file_response(
        UPLOAD_DIR / model.mtl_path,
        filename=model.mtl_path.rsplit("/", 1)[-1],
        media_type="text/plain",
    )


@router.get("/{model_id}/texture/{filename}", summary="Download texture file")
def get_texture_file(model_id: str, filename: str, db: Session = Depends(get_db)):
    """Serve a texture image file that accompanies an OBJ+MTL model."""
    # Block path traversal
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid texture filename")

    model = _get_or_404(model_id, db)
    if not model.texture_paths_json:
        raise HTTPException(status_code=404, detail="No textures associated with this model")

    texture_map: dict = json.loads(model.texture_paths_json)
    rel_path = texture_map.get(filename) or texture_map.get(filename.lower())
    if not rel_path:
        raise HTTPException(status_code=404, detail=f"Texture '{filename}' not found")

    return _safe_file_response(UPLOAD_DIR / rel_path, filename=filename)


@router.delete("/{model_id}", status_code=204, summary="Delete a model")
def delete_model(model_id: str, db: Session = Depends(get_db)):
    """
    Permanently delete a model and all its files from disk.
    All associated share tokens are also removed (cascade).
    """
    model = _get_or_404(model_id, db)
    upload_dir = UPLOAD_DIR / model_id
    if upload_dir.exists():
        shutil.rmtree(upload_dir)
    db.delete(model)
    db.commit()
