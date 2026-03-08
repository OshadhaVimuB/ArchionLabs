"""
Tests for the /api/v1/generate/floorplan endpoint (Commit 3).
"""


class TestGenerateEndpoint:
    """Integration tests for the floor plan generation API."""

    def test_generate_success(self, client):
        response = client.post(
            "/api/v1/generate/floorplan",
            json={"prompt": "a house with 2 bedrooms and a kitchen"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "project_id" in data
        assert "floorplan" in data
        assert "message" in data
        assert isinstance(data["floorplan"]["levels"], list)

    def test_response_has_rooms(self, client):
        response = client.post(
            "/api/v1/generate/floorplan",
            json={"prompt": "1 bedroom and 1 bathroom"},
        )
        data = response.json()
        rooms = data["floorplan"]["levels"][0]["rooms"]
        assert len(rooms) >= 2

    def test_persists_project(self, client, db_session):
        from app.models.db_models import Project

        response = client.post(
            "/api/v1/generate/floorplan",
            json={"prompt": "a kitchen"},
        )
        assert response.status_code == 200
        project_id = response.json()["project_id"]
        project = db_session.query(Project).filter_by(id=project_id).first()
        assert project is not None
        assert project.floorplan_data is not None

    def test_persists_chat_history(self, client, db_session):
        from app.models.db_models import ChatHistory

        response = client.post(
            "/api/v1/generate/floorplan",
            json={"prompt": "2 bedrooms"},
        )
        project_id = response.json()["project_id"]
        messages = (
            db_session.query(ChatHistory)
            .filter_by(project_id=project_id)
            .all()
        )
        assert len(messages) == 2  # user + assistant
        roles = {m.role for m in messages}
        assert roles == {"user", "assistant"}

    def test_empty_prompt_rejected(self, client):
        response = client.post(
            "/api/v1/generate/floorplan",
            json={"prompt": ""},
        )
        assert response.status_code == 422

    def test_missing_prompt_rejected(self, client):
        response = client.post(
            "/api/v1/generate/floorplan",
            json={},
        )
        assert response.status_code == 422

    def test_health_endpoint(self, client):
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
