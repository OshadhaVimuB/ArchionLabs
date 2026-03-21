"""
Tests for the Archion Sim Pydantic schemas.
"""

from schemas import (
    AgentPosition,
    Obstacle,
    SimulationFrame,
    Violation,
    ViolationCoordinate,
    ComplianceReport,
)


class TestAgentPosition:
    def test_defaults(self):
        agent = AgentPosition(id="a1", x=1.0, y=2.0)
        assert agent.type == "standard"

    def test_custom_type(self):
        agent = AgentPosition(id="a2", x=0.0, y=0.0, type="specialist")
        assert agent.type == "specialist"


class TestObstacle:
    def test_creation(self):
        obs = Obstacle(points=[[0.0, 0.0], [1.0, 1.0]])
        assert len(obs.points) == 2


class TestSimulationFrame:
    def test_creation(self):
        frame = SimulationFrame(frame_id=0, data={"0": {"pos": [1, 2]}})
        assert frame.frame_id == 0
        assert "0" in frame.data


class TestViolation:
    def test_creation(self):
        v = Violation(
            id="v1",
            type="corridor_width",
            severity="critical",
            coordinate=ViolationCoordinate(x=1.0, y=2.0),
            measured_value=0.8,
            required_value=1.2,
            description="Corridor too narrow",
            regulation="BS 9999:2017 Sec 15.2",
        )
        assert v.severity == "critical"
        assert v.measured_value < v.required_value


class TestComplianceReport:
    def test_creation(self):
        report = ComplianceReport(
            standard="BS 9999:2017",
            building_type="residential",
            total_violations=1,
            violations=[
                Violation(
                    id="v1",
                    type="door_width",
                    severity="high",
                    coordinate=ViolationCoordinate(x=0.0, y=0.0),
                    measured_value=0.7,
                    required_value=0.8,
                    description="Door too narrow",
                    regulation="BS 9999:2017",
                )
            ],
            compliance_score=85.0,
            status="fail",
            summary={"critical": 0, "high": 1, "medium": 0, "low": 0},
        )
        assert report.status == "fail"
        assert report.total_violations == 1
        assert report.compliance_score == 85.0

    def test_passing_report(self):
        report = ComplianceReport(
            standard="BS 9999:2017",
            building_type="office",
            total_violations=0,
            violations=[],
            compliance_score=100.0,
            status="pass",
            summary={"critical": 0, "high": 0, "medium": 0, "low": 0},
        )
        assert report.status == "pass"
        assert len(report.violations) == 0
