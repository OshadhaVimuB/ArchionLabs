"""
Tests for the share service and share-related DB models.
"""

import hashlib
from datetime import datetime, timedelta

import pytest
from sqlalchemy.orm import Session

from app.models.db_models import ModelUpload, ShareToken
from app.services.share_service import (
    _hash_password,
    _generate_token,
    create_share,
    validate_share,
    list_shares,
    revoke_share,
)


def _seed_model(db: Session, model_id: str = "share-test-model") -> ModelUpload:
    """Insert a model record that share tokens can reference."""
    model = ModelUpload(
        id=model_id,
        original_filename="building.glb",
        model_format="gltf",
        file_path=f"{model_id}/building.glb",
        file_size=2048,
    )
    db.add(model)
    db.commit()
    db.refresh(model)
    return model


# ---------------------------------------------------------------------------
# Crypto helpers
# ---------------------------------------------------------------------------

class TestCryptoHelpers:
    def test_hash_password_deterministic(self):
        assert _hash_password("secret") == _hash_password("secret")

    def test_hash_password_sha256(self):
        expected = hashlib.sha256(b"mypassword").hexdigest()
        assert _hash_password("mypassword") == expected

    def test_generate_token_length(self):
        token = _generate_token()
        assert len(token) == 32

    def test_generate_token_unique(self):
        tokens = {_generate_token() for _ in range(20)}
        assert len(tokens) == 20


# ---------------------------------------------------------------------------
# create_share
# ---------------------------------------------------------------------------

class TestCreateShare:
    def test_creates_share_token(self, db_session):
        _seed_model(db_session)
        share = create_share(
            db=db_session,
            model_id="share-test-model",
            model_name="My Building",
            expiry_days=7,
            watermark_text="CONFIDENTIAL",
        )
        assert share.token is not None
        assert len(share.token) == 32
        assert share.model_name == "My Building"
        assert share.watermark_text == "CONFIDENTIAL"
        assert share.is_revoked is False
        assert share.access_count == 0

    def test_creates_share_with_password(self, db_session):
        _seed_model(db_session)
        share = create_share(
            db=db_session,
            model_id="share-test-model",
            model_name="Protected",
            expiry_days=30,
            watermark_text="",
            password="secret123",
        )
        assert share.password_hash is not None
        assert share.password_hash == _hash_password("secret123")

    def test_auto_generates_watermark(self, db_session):
        _seed_model(db_session)
        share = create_share(
            db=db_session,
            model_id="share-test-model",
            model_name="Test Model",
            expiry_days=7,
            watermark_text="",
        )
        assert "ARCHION VIEWER" in share.watermark_text
        assert "TEST MODEL" in share.watermark_text

    def test_nonexistent_model_raises_404(self, db_session):
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc_info:
            create_share(
                db=db_session,
                model_id="does-not-exist",
                model_name="Test",
                expiry_days=7,
                watermark_text="",
            )
        assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# validate_share
# ---------------------------------------------------------------------------

class TestValidateShare:
    def test_valid_token(self, db_session):
        _seed_model(db_session)
        share = create_share(
            db=db_session,
            model_id="share-test-model",
            model_name="Valid",
            expiry_days=7,
            watermark_text="test",
        )
        result = validate_share(db=db_session, token=share.token)
        assert result.token == share.token
        assert result.access_count == 1  # incremented

    def test_expired_token_raises_410(self, db_session):
        _seed_model(db_session)
        share = create_share(
            db=db_session,
            model_id="share-test-model",
            model_name="Expired",
            expiry_days=1,
            watermark_text="test",
        )
        # Manually expire the token
        share.expires_at = datetime.utcnow() - timedelta(hours=1)
        db_session.commit()

        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc_info:
            validate_share(db=db_session, token=share.token)
        assert exc_info.value.status_code == 410

    def test_revoked_token_raises_404(self, db_session):
        _seed_model(db_session)
        share = create_share(
            db=db_session,
            model_id="share-test-model",
            model_name="Revoked",
            expiry_days=7,
            watermark_text="test",
        )
        revoke_share(db=db_session, token=share.token)

        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc_info:
            validate_share(db=db_session, token=share.token)
        assert exc_info.value.status_code == 404

    def test_password_required_raises_401(self, db_session):
        _seed_model(db_session)
        share = create_share(
            db=db_session,
            model_id="share-test-model",
            model_name="Protected",
            expiry_days=7,
            watermark_text="test",
            password="mypass",
        )
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc_info:
            validate_share(db=db_session, token=share.token, password=None)
        assert exc_info.value.status_code == 401

    def test_wrong_password_raises_403(self, db_session):
        _seed_model(db_session)
        share = create_share(
            db=db_session,
            model_id="share-test-model",
            model_name="Protected",
            expiry_days=7,
            watermark_text="test",
            password="correct",
        )
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc_info:
            validate_share(db=db_session, token=share.token, password="wrong")
        assert exc_info.value.status_code == 403

    def test_correct_password_succeeds(self, db_session):
        _seed_model(db_session)
        share = create_share(
            db=db_session,
            model_id="share-test-model",
            model_name="Protected",
            expiry_days=7,
            watermark_text="test",
            password="secret",
        )
        result = validate_share(db=db_session, token=share.token, password="secret")
        assert result.token == share.token


# ---------------------------------------------------------------------------
# list_shares / revoke_share
# ---------------------------------------------------------------------------

class TestListAndRevoke:
    def test_list_shares_returns_active(self, db_session):
        _seed_model(db_session)
        create_share(db=db_session, model_id="share-test-model", model_name="S1",
                     expiry_days=7, watermark_text="t")
        create_share(db=db_session, model_id="share-test-model", model_name="S2",
                     expiry_days=7, watermark_text="t")
        shares = list_shares(db=db_session)
        assert len(shares) == 2

    def test_revoked_shares_excluded(self, db_session):
        _seed_model(db_session)
        s1 = create_share(db=db_session, model_id="share-test-model", model_name="S1",
                          expiry_days=7, watermark_text="t")
        create_share(db=db_session, model_id="share-test-model", model_name="S2",
                     expiry_days=7, watermark_text="t")
        revoke_share(db=db_session, token=s1.token)
        shares = list_shares(db=db_session)
        assert len(shares) == 1

    def test_revoke_nonexistent_raises_404(self, db_session):
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc_info:
            revoke_share(db=db_session, token="does-not-exist")
        assert exc_info.value.status_code == 404
