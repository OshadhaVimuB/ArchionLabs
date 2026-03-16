from __future__ import annotations

import json
import os
import re
import time
import traceback
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


def _extract_json(text: str) -> str:
    """Strip markdown code fences and return the raw JSON string."""
    text = text.strip()
    # Remove ```json ... ``` or ``` ... ``` wrappers
    match = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", text)
    if match:
        return match.group(1).strip()
    return text

    # system prompt
_SYSTEM_PROMPT = """\
You are a senior Sri Lankan structural architect with 20+ years of experience \
in building compliance, accessibility design, and construction management. \
You specialize in:
- Sri Lankan Urban Development Authority (UDA) Planning & Development Regulations
- ISO 21542:2011 accessibility standards
- Sri Lankan construction materials, methods, and cost estimation in LKR
- Emergency egress, fire safety, and crowd-flow analysis

You will receive MEASURED SPATIAL DATA extracted from an actual 3D building model. \
Your task is to reason from this data to produce a compliance recommendation.

REASONING STEPS (follow in order):
1. ANALYZE the root cause using the measured values and spatial context provided.
   Quantify the deficiency (e.g. "0.31 m below minimum, 25.8% deficiency").
2. ASSESS safety impact — who is affected and what happens if unaddressed.
3. PLAN a primary solution using the actual geometry (wall positions, available \
   space, structural risk).  If wall relocation is feasible per the spatial data, \
   specify which wall to move and by how much.  If not feasible, explain the \
   constraint and propose an alternative approach.
4. ESTIMATE cost in LKR using current Sri Lankan construction rates.
5. LIST at least 4 step-by-step implementation actions.
6. PROVIDE 2–3 alternative approaches with brief cost indications.

OUTPUT FORMAT — respond with a JSON object with these exact keys:
{
  "analysis": "Root cause analysis with quantified deficiency and safety impact",
  "solution": "Primary solution with specific dimensions, materials, and approach",
  "implementation_steps": ["Step 1: ...", "Step 2: ...", ...],
  "complexity": "low | medium | high",
  "estimated_cost_lkr": "range like 200000-500000",
  "regulation_reference": "Specific UDA section and/or ISO clause numbers",
  "alternative_solutions": ["Alternative 1 with cost note", "Alternative 2 ..."]
}

CRITICAL: base your analysis and solution on the measured spatial data provided. \
Do not invent dimensions or constraints that are not in the data."""

# Severity depth instructions
_SEVERITY_DEPTH: dict[str, str] = {
    "critical": (
        "\nSEVERITY: CRITICAL — immediate safety risk.  Your response must include:\n"
        "- Detailed safety impact with emergency-scenario analysis\n"
        "- Any interim measures to reduce risk before permanent fix\n"
        "- At least 6 implementation steps\n"
        "- At least 3 alternative solutions\n"
        "- Full regulatory citation chain (UDA section + ISO clause)\n"
    ),
    "high": (
        "\nSEVERITY: HIGH — significant accessibility/safety impairment.  "
        "Provide detailed analysis with specific measurements and at least 5 implementation steps.\n"
    ),
    "medium": (
        "\nSEVERITY: MEDIUM — reduces compliance without immediate danger.  "
        "Provide practical analysis. At least 4 implementation steps.\n"
    ),
    "low": (
        "\nSEVERITY: LOW — minor deviation.  "
        "Provide concise analysis. At least 4 implementation steps.\n"
    ),
}

#AI Consultant
_MODEL = "gemini-2.5-flash"


class AIConsultant:
    """Hybrid AI compliance consultant using parameter-based Gemini prompting."""

    def __init__(self) -> None:
        from google import genai
        from google.genai import types as genai_types

        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY not set in environment")

        self._client = genai.Client(api_key=api_key)
        self._types = genai_types
        self._max_retries = 2
        self._retry_base_delay = 1.0
        self._cache: dict[str, dict] = {}
        print(f"[AI Consultant] Initialized — model: {_MODEL} (google-genai SDK)")

    def clear_cache(self) -> None:
        self._cache.clear()

# Promt contruction
def _build_prompt(
        self,
        violation: dict,
        building_context: dict,
        wall_segments: list | None,
        boundary_coords: list | None,
    ) -> str:
        """Build a parameter-grounded prompt for a single violation."""
        from core.parameter_extractor import extract_parameters
        from shapely.geometry import Polygon

        building_type = building_context.get("building_type", "residential")
        floor_area = building_context.get("total_floor_area_sqm", 0.0)

        # Build boundary polygon
        if boundary_coords and len(boundary_coords) >= 3:
            try:
                pts = [tuple(p[:2]) for p in boundary_coords]
                if pts[0] != pts[-1]:
                    pts.append(pts[0])
                boundary_polygon = Polygon(pts)
                if not boundary_polygon.is_valid:
                    boundary_polygon = boundary_polygon.buffer(0)
            except Exception:
                boundary_polygon = Polygon()
        else:
            boundary_polygon = Polygon()

        # Extract parameters
        params = extract_parameters(
            violation=violation,
            building_type=building_type,
            floor_area_m2=floor_area,
            wall_segments=wall_segments or [],
            boundary_polygon=boundary_polygon,
        )

        # Assemble prompt
        severity = violation.get("severity", "medium")
        depth_instr = _SEVERITY_DEPTH.get(severity, _SEVERITY_DEPTH["medium"])

        prompt = params.to_prompt_sections()
        prompt += depth_instr
        prompt += (
            f"\nViolation to analyse:\n"
            f"  ID: {violation.get('id', '')}\n"
            f"  Type: {violation.get('type', '')}\n"
            f"  Description: {violation.get('description', '')}\n"
            f"  Regulation cited by compliance checker: {violation.get('regulation', '')}\n\n"
            "Provide your structured JSON recommendation based on the spatial "
            "data and regulatory context above."
        )

        # --- MACHINE LEARNING INSIGHT INJECTION ---
        ml_risk_score = building_context.get("ml_risk_score")
        if ml_risk_score is not None:
            prompt += (
                f"\n\n--- MACHINE LEARNING INSIGHT ---\n"
                f"Our local predictive model analyzed the simulation trajectories and calculated a "
                f"Crowd Crush Risk Score of {ml_risk_score}/10 based on agent density and flow velocity. "
                "Please mention this risk score in your analysis and factor it into the urgency of your solution.\n"
            )

        return prompt
