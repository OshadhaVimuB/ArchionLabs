"""
Share router — manages secure, token-based model sharing.

POST   /api/share                      — create a share link
GET    /api/share                      — list active share links
GET    /api/share/{token}/validate     — validate token & get metadata (increments access counter)
GET    /api/share/{token}/model        — serve the model file via the share token
GET    /api/share/{token}/mtl          — serve the MTL file via the share token
DELETE /api/share/{token}              — revoke a share link
"""
from datetime import datetime

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.config import UPLOAD_DIR
from app.database import get_db
from app.models.db_models import ShareToken
from app.services import share_service

router = APIRouter(prefix="/share", tags=["share"])


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class CreateShareRequest(BaseModel):
    model_id: str = Field(..., description="ID returned by POST /api/upload")
    model_name: str = Field(..., description="Human-readable name shown to the recipient")
    expiry_days: int = Field(7, ge=1, le=365, description="Days until the link expires")
    watermark_text: str = Field(
        "",
        description="Text shown in the watermark overlay. Auto-generated if empty.",
    )
    password: str | None = Field(
        None,
        description="Optional plain-text password (will be hashed with SHA-256 server-side).",
    )


# ---------------------------------------------------------------------------
# Internal helper
# ---------------------------------------------------------------------------

def _share_to_dict(share: ShareToken) -> dict:
    """Serialise a ShareToken (with .model already loaded) to a JSON-safe dict."""
    return {
        "token": share.token,
        "model_name": share.model_name,
        "model_format": share.model_format,
        "expires_at": share.expires_at.isoformat(),
        "watermark_text": share.watermark_text,
        "created_at": share.created_at.isoformat(),
        "access_count": share.access_count,
        "is_revoked": share.is_revoked,
        "is_expired": datetime.utcnow() > share.expires_at,
        "has_password": share.password_hash is not None,
        # URLs for the authenticated file endpoints below
        "model_url": f"/api/share/{share.token}/model",
        "mtl_url": f"/api/share/{share.token}/mtl" if share.model.mtl_path else None,
        # Frontend route shown to users
        "share_url": f"/share/{share.token}",
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("", status_code=201, summary="Create a share link")
def create_share(body: CreateShareRequest, db: Session = Depends(get_db)):
    """
    Generate a new share token for a previously uploaded model.

    The token is included in a `/share/<token>` URL that can be sent to anyone.
    Optionally protect it with a password and set an expiry window.
    """
    share = share_service.create_share(
        db=db,
        model_id=body.model_id,
        model_name=body.model_name,
        expiry_days=body.expiry_days,
        watermark_text=body.watermark_text,
        password=(body.password.strip() if body.password and body.password.strip() else None),
    )
    return _share_to_dict(share)


@router.get("", summary="List active share links")
def list_shares(db: Session = Depends(get_db)):
    """Return all non-revoked share tokens, newest first."""
    return [_share_to_dict(s) for s in share_service.list_shares(db)]


@router.get("/{token}/validate", summary="Validate a share token")
def validate_share(
    token: str,
    password: str | None = Query(None, description="Plain-text password (if the share is protected)"),
    x_share_password: str | None = Header(None, description="Alternative to ?password="),
    db: Session = Depends(get_db),
):
    """
    Validate a share token and return its metadata.

    - If valid and no password is needed, returns the share config immediately.
    - If a password is required but not supplied, returns **401** with header
      `X-Password-Required: true`.
    - If the password is wrong, returns **403**.
    - If the token is expired, returns **410**.

    Calling this endpoint increments the access counter once.
    """
    share = share_service.validate_share(
        db=db,
        token=token,
        password=password or x_share_password,
        increment_access=True,
    )
    return _share_to_dict(share)


@router.get("/{token}/model", summary="Download model via share token")
def get_shared_model(
    token: str,
    password: str | None = Query(None),
    x_share_password: str | None = Header(None),
    db: Session = Depends(get_db),
):
    """
    Serve the model binary after validating the share token.
    Does **not** bump the access counter (only `/validate` does).
    """
    share = share_service.validate_share(
        db=db,
        token=token,
        password=password or x_share_password,
        increment_access=False,
    )
    file_path = UPLOAD_DIR / share.model.file_path
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Model file not found on disk")
    return FileResponse(
        path=str(file_path),
        filename=share.model.original_filename,
        media_type="application/octet-stream",
    )


@router.get("/{token}/mtl", summary="Download MTL file via share token")
def get_shared_mtl(
    token: str,
    password: str | None = Query(None),
    x_share_password: str | None = Header(None),
    db: Session = Depends(get_db),
):
    """Serve the MTL material file after validating the share token."""
    share = share_service.validate_share(
        db=db,
        token=token,
        password=password or x_share_password,
        increment_access=False,
    )
    if not share.model.mtl_path:
        raise HTTPException(status_code=404, detail="No MTL file for this model")
    file_path = UPLOAD_DIR / share.model.mtl_path
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="MTL file not found on disk")
    return FileResponse(
        path=str(file_path),
        filename=share.model.mtl_path.rsplit("/", 1)[-1],
        media_type="text/plain",
    )


@router.delete("/{token}", status_code=204, summary="Revoke a share link")
def revoke_share(token: str, db: Session = Depends(get_db)):
    """Permanently revoke a share token so it can no longer be used."""
    share_service.revoke_share(db=db, token=token)
