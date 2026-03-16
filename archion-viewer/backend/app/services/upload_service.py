"""
Upload service — validates, saves, and registers uploaded 3D model files.
"""
import json
import shutil
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.config import (
    FORMAT_MAP,
    MAX_UPLOAD_SIZE,
    SUPPORTED_MODEL_EXTENSIONS,
    SUPPORTED_TEXTURE_EXTENSIONS,
    UPLOAD_DIR,
)
from app.models.db_models import ModelUpload

_ALLOWED_EXTENSIONS = SUPPORTED_MODEL_EXTENSIONS | SUPPORTED_TEXTURE_EXTENSIONS | frozenset({".mtl"})


def _extension(filename: str) -> str:
    return Path(filename).suffix.lower()


def _assert_safe_filename(filename: str) -> None:
    """
    Reject filenames that contain path separators or traversal sequences.
    Raises HTTPException(400) on violation.
    """
    safe_name = Path(filename).name
    if (
        safe_name != filename
        or ".." in filename
        or "/" in filename
        or "\\" in filename
    ):
        raise HTTPException(status_code=400, detail=f"Invalid filename: {filename!r}")

    ext = _extension(filename)
    if ext not in _ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, detail=f"Unsupported file type: {ext!r}"
        )


async def save_upload(
    model_file: UploadFile,
    db: Session,
    mtl_file: UploadFile | None = None,
    texture_files: list[UploadFile] | None = None,
) -> ModelUpload:
    """
    Persist a model upload to disk and create a ModelUpload DB record.

    Files are written to UPLOAD_DIR/<new_uuid>/.
    Raises HTTPException on validation failures or I/O errors.
    """
    # --- Validate filenames up-front (security) ---
    model_filename = (model_file.filename or "").strip()
    if not model_filename:
        raise HTTPException(status_code=400, detail="Model filename is missing")
    _assert_safe_filename(model_filename)

    model_ext = _extension(model_filename)
    if model_ext not in SUPPORTED_MODEL_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported model format {model_ext!r}. "
                f"Accepted: {', '.join(sorted(SUPPORTED_MODEL_EXTENSIONS))}"
            ),
        )

    if mtl_file and mtl_file.filename:
        _assert_safe_filename(mtl_file.filename)

    for tf in texture_files or []:
        if tf.filename:
            _assert_safe_filename(tf.filename)

    model_format = FORMAT_MAP[model_ext]
    upload_id = str(uuid.uuid4())
    upload_dir = UPLOAD_DIR / upload_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    try:
        # --- Save model file ---
        model_content = await model_file.read()
        if len(model_content) > MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"Model file exceeds the {MAX_UPLOAD_SIZE // (1024 * 1024)} MB limit",
            )
        model_dest = upload_dir / model_filename
        model_dest.write_bytes(model_content)
        relative_model_path = f"{upload_id}/{model_filename}"

        # --- Save MTL file (OBJ models) ---
        relative_mtl_path: str | None = None
        if mtl_file and mtl_file.filename:
            mtl_content = await mtl_file.read()
            mtl_dest = upload_dir / mtl_file.filename
            mtl_dest.write_bytes(mtl_content)
            relative_mtl_path = f"{upload_id}/{mtl_file.filename}"

        # --- Save texture files ---
        texture_paths: dict[str, str] = {}
        for tf in texture_files or []:
            if not tf.filename:
                continue
            tex_content = await tf.read()
            tex_dest = upload_dir / tf.filename
            tex_dest.write_bytes(tex_content)
            rel = f"{upload_id}/{tf.filename}"
            # Store both original case and lowercase so lookups always succeed
            texture_paths[tf.filename] = rel
            texture_paths[tf.filename.lower()] = rel

        record = ModelUpload(
            id=upload_id,
            original_filename=model_filename,
            model_format=model_format,
            file_path=relative_model_path,
            mtl_path=relative_mtl_path,
            texture_paths_json=json.dumps(texture_paths) if texture_paths else None,
            file_size=len(model_content),
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    except HTTPException:
        shutil.rmtree(upload_dir, ignore_errors=True)
        raise
    except Exception as exc:
        shutil.rmtree(upload_dir, ignore_errors=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to save upload: {exc}"
        ) from exc
