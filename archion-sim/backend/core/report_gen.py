"""PDF report generator for architectural compliance audit reports."""

from __future__ import annotations

import io
from datetime import datetime
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    PageBreak,
)

# Theme colors
CYAN = HexColor("#06b6d4")
DARK = HexColor("#18181b")
GRAY = HexColor("#71717a")
LIGHT_GRAY = HexColor("#e4e4e7")
RED = HexColor("#DC2626")
GREEN = HexColor("#16a34a")
ORANGE = HexColor("#F59E0B")
YELLOW = HexColor("#EAB308")
BLUE = HexColor("#3B82F6")

REPORTS_DIR = Path(__file__).parent.parent / "reports"
REPORTS_DIR.mkdir(exist_ok=True)

SEVERITY_COLORS = {
    "critical": RED,
    "high": ORANGE,
    "medium": YELLOW,
    "low": BLUE,
}

PAGE_W, PAGE_H = A4

# Style
def _styles() -> dict[str, ParagraphStyle]:
    return {
        "title": ParagraphStyle(
            "title", fontName="Helvetica-Bold", fontSize=24,
            leading=30, alignment=TA_CENTER, textColor=DARK,
        ),
        "subtitle": ParagraphStyle(
            "subtitle", fontName="Helvetica", fontSize=13,
            leading=18, alignment=TA_CENTER, textColor=GRAY,
        ),
        "h1": ParagraphStyle(
            "h1", fontName="Helvetica-Bold", fontSize=16,
            leading=22, textColor=DARK, spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "h2", fontName="Helvetica-Bold", fontSize=12,
            leading=16, textColor=DARK, spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "body", fontName="Helvetica", fontSize=10,
            leading=14, textColor=DARK,
        ),
        "caption": ParagraphStyle(
            "caption", fontName="Helvetica", fontSize=8,
            leading=10, textColor=GRAY, alignment=TA_CENTER,
        ),
        "badge_pass": ParagraphStyle(
            "badge_pass", fontName="Helvetica-Bold", fontSize=14,
            leading=18, alignment=TA_CENTER, textColor=GREEN,
        ),
        "badge_fail": ParagraphStyle(
            "badge_fail", fontName="Helvetica-Bold", fontSize=14,
            leading=18, alignment=TA_CENTER, textColor=RED,
        ),
    }

# Chart Helper
def _fig_to_image(fig: plt.Figure, width: float = 160 * mm, height: float = 80 * mm) -> Image:
    """Convert a matplotlib figure to a reportlab Image."""
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    buf.seek(0)
    return Image(buf, width=width, height=height)

def _violations_bar_chart(violations: list[dict]) -> Image:
    """Bar chart of violation counts by type."""
    type_counts: dict[str, int] = {}
    type_severity: dict[str, str] = {}
    for v in violations:
        vt = v.get("type", "unknown").replace("_", " ").title()
        type_counts[vt] = type_counts.get(vt, 0) + 1
        type_severity.setdefault(vt, v.get("severity", "medium"))

    if not type_counts:
        fig, ax = plt.subplots(figsize=(6, 3))
        ax.text(0.5, 0.5, "No violations", ha="center", va="center")
        ax.set_axis_off()
        return _fig_to_image(fig)

    sev_colors = {
        "critical": "#DC2626", "high": "#F59E0B",
        "medium": "#EAB308", "low": "#3B82F6",
    }
    labels = list(type_counts.keys())
    counts = list(type_counts.values())
    colors = [sev_colors.get(type_severity.get(l, "medium"), "#6B7280") for l in labels]

    fig, ax = plt.subplots(figsize=(6, 3))
    bars = ax.barh(labels, counts, color=colors, edgecolor="white", height=0.5)
    ax.set_xlabel("Count", fontsize=9)
    ax.set_title("Violations by Type", fontsize=11, fontweight="bold")
    ax.tick_params(labelsize=8)
    for bar, count in zip(bars, counts):
        ax.text(bar.get_width() + 0.1, bar.get_y() + bar.get_height() / 2,
                str(count), va="center", fontsize=8, fontweight="bold")
    ax.invert_yaxis()
    fig.tight_layout()
    return _fig_to_image(fig)

def _velocity_chart(velocity_timeline: list[dict]) -> Image:
    """Line chart of average velocity over time."""
    if not velocity_timeline:
        fig, ax = plt.subplots(figsize=(6, 2.5))
        ax.text(0.5, 0.5, "No data", ha="center", va="center")
        ax.set_axis_off()
        return _fig_to_image(fig, height=60 * mm)

    times = [p["time_sec"] for p in velocity_timeline]
    vels = [p["avg_velocity_ms"] for p in velocity_timeline]

    fig, ax = plt.subplots(figsize=(6, 2.5))
    ax.plot(times, vels, color="#06b6d4", linewidth=1.5)
    ax.axhline(y=0.2, color="#DC2626", linestyle="--", linewidth=0.8, label="Congestion threshold")
    ax.fill_between(times, vels, alpha=0.15, color="#06b6d4")
    ax.set_xlabel("Time (s)", fontsize=9)
    ax.set_ylabel("Avg Velocity (m/s)", fontsize=9)
    ax.set_title("Agent Velocity Over Time", fontsize=11, fontweight="bold")
    ax.legend(fontsize=7)
    ax.tick_params(labelsize=8)
    fig.tight_layout()
    return _fig_to_image(fig, height=60 * mm)

    
    def _severity_pie_chart(violations: list[dict]) -> Image:
    """Pie chart of violation counts by severity."""
    
    sev_counts: dict[str, int] = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for v in violations:
        s = v.get("severity", "medium")
        sev_counts[s] = sev_counts.get(s, 0) + 1

    labels = [k.title() for k, c in sev_counts.items() if c > 0]
    counts = [c for c in sev_counts.values() if c > 0]
    colors = ["#DC2626", "#F59E0B", "#EAB308", "#3B82F6"]
    colors = [c for c, cnt in zip(colors, sev_counts.values()) if cnt > 0]

    if not counts:
        fig, ax = plt.subplots(figsize=(5, 4))
        ax.text(0.5, 0.5, "No violations", ha="center", va="center")
        ax.set_axis_off()
        return _fig_to_image(fig, width=120 * mm, height=100 * mm)

    fig, ax = plt.subplots(figsize=(5, 4))
    wedges, texts, autotexts = ax.pie(
        counts, labels=labels, colors=colors, autopct="%1.0f%%",
        startangle=90, textprops={"fontsize": 9},
    )
    for t in autotexts:
        t.set_fontweight("bold")
        t.set_color("white")
    ax.set_title("Violations by Severity", fontsize=12, fontweight="bold")
    fig.tight_layout()
    return _fig_to_image(fig, width=120 * mm, height=100 * mm)


def _compliance_radar_chart(compliance_report: dict, analytics: dict) -> Image:
    """Radar/spider chart of compliance category scores."""
    categories = ["Corridor\nWidth", "Door\nWidth", "Turning\nSpace", "Ramp\nGradient", "Flow\nEfficiency"]
    violations = compliance_report.get("violations", [])

    # Compute per-category scores (100% minus penalty)
    type_map = {"corridor_width": 0, "door_width": 1, "turning_space": 2, "ramp_gradient": 3, "bottleneck": 4}
    penalties = [0.0] * 5
    type_counts = [0] * 5
    for v in violations:
        idx = type_map.get(v.get("type", ""), 4)
        sev_penalty = {"critical": 25, "high": 15, "medium": 8, "low": 3}
        penalties[idx] += sev_penalty.get(v.get("severity", "medium"), 5)
        type_counts[idx] += 1

    scores = [max(0, min(100, 100 - p)) for p in penalties]

    # Add efficiency score
    eff = analytics.get("efficiency_score", {}).get("average", 0.8)
    scores[4] = max(0, min(100, eff * 100))

    N = len(categories)
    angles = np.linspace(0, 2 * np.pi, N, endpoint=False).tolist()
    scores_plot = scores + [scores[0]]
    angles += [angles[0]]

    fig, ax = plt.subplots(figsize=(5, 4), subplot_kw=dict(polar=True))
    ax.fill(angles, scores_plot, color="#06b6d4", alpha=0.25)
    ax.plot(angles, scores_plot, color="#06b6d4", linewidth=2)
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(categories, fontsize=8)
    ax.set_ylim(0, 100)
    ax.set_yticks([25, 50, 75, 100])
    ax.set_yticklabels(["25", "50", "75", "100"], fontsize=7, color="#71717a")
    ax.set_title("Compliance Category Scores", fontsize=12, fontweight="bold", pad=20)
    fig.tight_layout()
    return _fig_to_image(fig, width=130 * mm, height=110 * mm)


def _heatmap_image(heatmap_data: dict) -> Image:
    """Full-page heatmap image."""
    grid = np.array(heatmap_data.get("grid", []))
    if grid.size == 0:
        fig, ax = plt.subplots(figsize=(7, 6))
        ax.text(0.5, 0.5, "No heatmap data", ha="center", va="center", fontsize=14)
        ax.set_axis_off()
        return _fig_to_image(fig, width=160 * mm, height=140 * mm)

    bounds = heatmap_data["bounds"]
    extent = [bounds["min_x"], bounds["max_x"], bounds["min_y"], bounds["max_y"]]

    fig, ax = plt.subplots(figsize=(7, 6))
    im = ax.imshow(grid, origin="lower", extent=extent, cmap="jet",
                   alpha=0.85, vmin=0, vmax=1, interpolation="bilinear")
    ax.set_xlabel("X (m)", fontsize=10)
    ax.set_ylabel("Y (m)", fontsize=10)
    ax.set_title("Pedestrian Density Heatmap", fontsize=13, fontweight="bold")
    cbar = plt.colorbar(im, ax=ax, label="Normalized Density", shrink=0.85)
    cbar.ax.tick_params(labelsize=8)
    fig.tight_layout()
    return _fig_to_image(fig, width=160 * mm, height=140 * mm)

