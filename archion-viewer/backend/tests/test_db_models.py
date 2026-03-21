"""
Tests for the Archion Viewer ORM models (ModelUpload, ShareToken).
"""

import uuid
from datetime import datetime, timedelta

from app.models.db_models import ModelUpload, ShareToken


class TestModelUpload:
    """Unit tests for the ModelUpload ORM model."""

    def test_create_model_record(self, db_session):
        model = ModelUpload(
            id="test-uuid-1",
            original_filename="office.glb",
            model_format="gltf",
            file_path="test-uuid-1/office.glb",
            file_size=5000,
        )
        db_session.add(model)
        db_session.commit()

        fetched = db_session.get(ModelUpload, "test-uuid-1")
        assert fetched is not None
        assert fetched.original_filename == "office.glb"
        assert fetched.model_format == "gltf"
        assert fetched.file_size == 5000
        assert fetched.mtl_path is None
        assert fetched.texture_paths_json is None

    def test_model_with_mtl(self, db_session):
        model = ModelUpload(
            id="test-uuid-2",
            original_filename="house.obj",
            model_format="obj",
            file_path="test-uuid-2/house.obj",
            mtl_path="test-uuid-2/house.mtl",
            file_size=3000,
        )
        db_session.add(model)
        db_session.commit()

        fetched = db_session.get(ModelUpload, "test-uuid-2")
        assert fetched.mtl_path == "test-uuid-2/house.mtl"

    def test_auto_uuid_default(self, db_session):
        """When id is not specified, the default lambda should generate one."""
        model = ModelUpload(
            original_filename="auto_id.glb",
            model_format="gltf",
            file_path="auto/auto_id.glb",
            file_size=100,
        )
        db_session.add(model)
        db_session.commit()
        assert model.id is not None
        # Should look like a UUID
        assert len(model.id) == 36  # standard UUID string


class TestShareToken:
    """Unit tests for the ShareToken ORM model."""

    def _seed_model(self, db_session, model_id="share-model-1"):
        model = ModelUpload(
            id=model_id,
            original_filename="test.glb",
            model_format="gltf",
            file_path=f"{model_id}/test.glb",
            file_size=1024,
        )
        db_session.add(model)
        db_session.commit()
        return model

    def test_create_share_token(self, db_session):
        self._seed_model(db_session)
        share = ShareToken(
            token="abc123def456",
            model_id="share-model-1",
            model_name="My Model",
            model_format="gltf",
            expires_at=datetime.utcnow() + timedelta(days=7),
            watermark_text="CONFIDENTIAL",
        )
        db_session.add(share)
        db_session.commit()

        fetched = db_session.get(ShareToken, "abc123def456")
        assert fetched.model_name == "My Model"
        assert fetched.is_revoked is False
        assert fetched.access_count == 0

    def test_cascade_delete(self, db_session):
        """Deleting a model should cascade-delete its share tokens."""
        model = self._seed_model(db_session, "cascade-test")
        share = ShareToken(
            token="cascade-token",
            model_id="cascade-test",
            model_name="Cascade Test",
            model_format="gltf",
            expires_at=datetime.utcnow() + timedelta(days=7),
            watermark_text="test",
        )
        db_session.add(share)
        db_session.commit()

        db_session.delete(model)
        db_session.commit()

        assert db_session.get(ShareToken, "cascade-token") is None
