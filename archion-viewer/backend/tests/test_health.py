"""
Tests for Archion Viewer health endpoints.
"""


class TestHealthEndpoints:
    """Verify health and root endpoints respond correctly."""

    def test_root_endpoint(self, client):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Archion Viewer" in data["message"]
        assert "version" in data

    def test_health_endpoint(self, client):
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "service" in data
