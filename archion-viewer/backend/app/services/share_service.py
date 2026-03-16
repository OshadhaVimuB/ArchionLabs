"""
Share token service — creates, validates, lists, and revokes share tokens.
"""
import hashlib
import secrets
from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.db_models import ModelUpload, ShareToken


# ---------------------------------------------------------------------------
# Crypto helpers
# ---------------------------------------------------------------------------

def _hash_password(password: str) -> str:
    """
    SHA-256 hash of a plain-text password.
    Matches the Web Crypto API implementation in the frontend shareManager.ts,
    so passwords set client-side and server-side are interoperable.
    """
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def _generate_token() -> str:
    """32-character URL-safe hex token (128 bits of entropy)."""
    return secrets.token_hex(16)


# ---------------------------------------------------------------------------
# CRUD operations
# ---------------------------------------------------------------------------

def create_share(
    db: Session,
    model_id: str,
    model_name: str,
    expiry_days: int,
    watermark_text: str,
    password: str | None = None,
) -> ShareToken:
    """
    Create and persist a new share token for the given model.
    Raises HTTPException(404) if the model does not exist.
    """
    model = db.get(ModelUpload, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    token = _generate_token()
    expires_at = datetime.utcnow() + timedelta(days=expiry_days)
    password_hash = _hash_password(password) if password else None
    effective_watermark = watermark_text or (
        f"ARCHION VIEWER · {(model_name or model.original_filename).upper()} · CONFIDENTIAL"
    )

    share = ShareToken(
        token=token,
        model_id=model_id,
        model_name=model_name or model.original_filename,
        model_format=model.model_format,
        expires_at=expires_at,
        password_hash=password_hash,
        watermark_text=effective_watermark,
    )
    db.add(share)
    db.commit()
    db.refresh(share)
    # Eagerly load the relationship so the router can access share.model
    db.refresh(share, attribute_names=["model"])
    return share


def validate_share(
    db: Session,
    token: str,
    password: str | None = None,
    increment_access: bool = True,
) -> ShareToken:
    """
    Validate a share token and (optionally) increment its access counter.

    Returns the ShareToken on success.
    Raises:
        HTTPException(404)  — token not found or revoked
        HTTPException(410)  — link expired
        HTTPException(401)  — password required (header X-Password-Required set)
        HTTPException(403)  — wrong password
    """
    share = (
        db.query(ShareToken)
        .options(joinedload(ShareToken.model))
        .filter(ShareToken.token == token)
        .first()
    )

    if not share or share.is_revoked:
        raise HTTPException(status_code=404, detail="Share token not found")

    if datetime.utcnow() > share.expires_at:
        raise HTTPException(status_code=410, detail="Share link has expired")

    if share.password_hash:
        if not password:
            raise HTTPException(
                status_code=401,
                detail="Password required",
                headers={"X-Password-Required": "true"},
            )
        if _hash_password(password) != share.password_hash:
            raise HTTPException(status_code=403, detail="Incorrect password")

    if increment_access:
        share.access_count += 1
        db.commit()
        db.refresh(share)

    return share


def list_shares(db: Session) -> list[ShareToken]:
    """Return all non-revoked share tokens, newest first, with model eagerly loaded."""
    return (
        db.query(ShareToken)
        .options(joinedload(ShareToken.model))
        .filter(ShareToken.is_revoked.is_(False))
        .order_by(ShareToken.created_at.desc())
        .all()
    )


def revoke_share(db: Session, token: str) -> None:
    """Mark a share token as revoked. Raises HTTPException(404) if not found."""
    share = db.get(ShareToken, token)
    if not share:
        raise HTTPException(status_code=404, detail="Share token not found")
    share.is_revoked = True
    db.commit()
