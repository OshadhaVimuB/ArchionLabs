"""
Tests for the /api/models endpoints (metadata, file serving, deletion).
"""

from app.models.db_models import ModelUpload


class TestModelsEndpoints:
    """Tests for model metadata and file retrieval."""

    def _create_test_model(self, db_session) -> ModelUpload:
        """Helper to insert a test model record into DB."""
        model = ModelUpload(
            id="test-model-001",
            original_filename="test_building.glb",
            model_format="gltf",
            file_path="test-model-001/test_building.glb",
            file_size=1024,
        )
        db_session.add(model)
        db_session.commit()
        db_session.refresh(model)
        return model

    def test_get_model_metadata(self, client, db_session):
        """GET /api/models/{id} returns correct metadata."""
        self._create_test_model(db_session)
        response = client.get("/api/models/test-model-001")
        assert response.status_code == 200
        data = response.json()
        assert data["model_id"] == "test-model-001"
        assert data["original_filename"] == "test_building.glb"
        assert data["model_format"] == "gltf"
        assert data["file_size"] == 1024
        assert data["model_url"] == "/api/models/test-model-001/file"

    def test_get_model_not_found(self, client):
        """GET /api/models/{id} returns 404 for non-existent model."""
        response = client.get("/api/models/nonexistent-id")
        assert response.status_code == 404

    def test_delete_model(self, client, db_session):
        """DELETE /api/models/{id} removes the record."""
        self._create_test_model(db_session)
        response = client.delete("/api/models/test-model-001")
        assert response.status_code == 204

        # Verify it's gone
        response = client.get("/api/models/test-model-001")
        assert response.status_code == 404

    def test_delete_model_not_found(self, client):
        """DELETE /api/models/{id} returns 404 for non-existent model."""
        response = client.delete("/api/models/nonexistent-id")
        assert response.status_code == 404

    def test_get_mtl_no_mtl(self, client, db_session):
        """GET /api/models/{id}/mtl returns 404 when model has no MTL."""
        self._create_test_model(db_session)
        response = client.get("/api/models/test-model-001/mtl")
        assert response.status_code == 404

    def test_get_texture_no_textures(self, client, db_session):
        """GET /api/models/{id}/texture/foo.png returns 404 when no textures."""
        self._create_test_model(db_session)
        response = client.get("/api/models/test-model-001/texture/foo.png")
        assert response.status_code == 404

    def test_get_texture_path_traversal_blocked(self, client, db_session):
        """Path traversal in texture filename should be rejected."""
        self._create_test_model(db_session)
        response = client.get("/api/models/test-model-001/texture/../../etc/passwd")
        # FastAPI may return 400 (validation) or 404 (route mismatch) — either blocks traversal
        assert response.status_code in (400, 404)
