"""
Tests for Archion Sim health and core API endpoints.
"""


class TestHealthEndpoint:
    """Verify the health check endpoint."""

    def test_health_check(self, client):
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "archion-sim-backend"


class TestProcessModelEndpoint:
    """Tests for the /api/process-model endpoint."""

    def test_unsupported_file_type(self, client):
        """Uploading a .txt file should return 400."""
        response = client.post(
            "/api/process-model",
            files={"file": ("test.txt", b"not a 3d model", "text/plain")},
        )
        assert response.status_code == 400
        assert "Unsupported file type" in response.json()["detail"]

    def test_missing_file(self, client):
        """Uploading with no file should return 422."""
        response = client.post("/api/process-model")
        assert response.status_code == 422


class TestComplianceEndpoints:
    """Tests for the compliance configuration endpoints."""

    def test_compliance_init_valid(self, client):
        response = client.post(
            "/api/compliance/init",
            json={"building_type": "residential"},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
        assert response.json()["building_type"] == "residential"

    def test_compliance_init_invalid_type(self, client):
        response = client.post(
            "/api/compliance/init",
            json={"building_type": "spaceship"},
        )
        assert response.status_code == 400
        assert "Invalid building type" in response.json()["detail"]

    def test_compliance_report_idle(self, client):
        """Before any audit, the report endpoint should return idle."""
        response = client.get("/api/compliance/report")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ("idle", "done")


class TestSimulationEndpoints:
    """Tests for simulation start and trajectory endpoints."""

    def test_get_trajectories_initial(self, client):
        """Before any simulation, trajectories should be empty or idle."""
        response = client.get("/api/get-trajectories")
        assert response.status_code == 200

    def test_simulation_configure(self, client):
        """POST /api/simulation/configure should accept valid config."""
        response = client.post(
            "/api/simulation/configure",
            json={"roles": []},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "ok"


class TestAnalyticsEndpoint:
    """Tests for the analytics endpoint."""

    def test_analytics_no_sim_data(self, client):
        """Should return error when no simulation has been run."""
        response = client.get("/api/analytics")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "error"
