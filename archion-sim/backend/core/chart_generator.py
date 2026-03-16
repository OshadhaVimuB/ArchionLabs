from __future__ import annotations

from io import BytesIO
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker

# Color Palette
_SEVERITY_COLORS = {
    "critical": "#DC2626",
    "high": "#F59E0B",
    "medium": "#FCD34D",
    "low": "#3B82F6",
}

_PRIMARY_BLUE = "#2563EB"
_BG_COLOR = "#FFFFFF"
_TEXT_COLOR = "#1F2937"
_GRID_COLOR = "#E5E7EB"

CHARTS_DIR = Path(__file__).parent.parent / "reports" / "charts"
CHARTS_DIR.mkdir(parents=True, exist_ok=True)


def _apply_style(ax: plt.Axes) -> None:
    """Apply consistent styling to chart axes."""
    ax.set_facecolor(_BG_COLOR)
    ax.tick_params(colors=_TEXT_COLOR, labelsize=9)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color(_GRID_COLOR)
    ax.spines["bottom"].set_color(_GRID_COLOR)
    ax.grid(axis="y", color=_GRID_COLOR, linewidth=0.5, alpha=0.7)


# Violations by severity bar chart
def generate_violations_chart(violations_by_severity: dict) -> str:
    """Generate bar chart of violations by severity.
    """
    severities = ["critical", "high", "medium", "low"]
    counts = [violations_by_severity.get(s, 0) for s in severities]
    colors = [_SEVERITY_COLORS[s] for s in severities]
    labels = [s.capitalize() for s in severities]

    fig, ax = plt.subplots(figsize=(6, 3.5), dpi=150)
    fig.patch.set_facecolor(_BG_COLOR)

    bars = ax.bar(labels, counts, color=colors, width=0.55, edgecolor="white", linewidth=0.8)

    # Value labels on bars
    for bar, count in zip(bars, counts):
        if count > 0:
            ax.text(
                bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.15,
                str(count), ha="center", va="bottom",
                fontsize=11, fontweight="bold", color=_TEXT_COLOR,
            )

    ax.set_ylabel("Count", fontsize=10, color=_TEXT_COLOR)
    ax.set_title("Violations by Severity", fontsize=12, fontweight="bold", color=_TEXT_COLOR, pad=12)
    ax.yaxis.set_major_locator(mticker.MaxNLocator(integer=True))
    _apply_style(ax)

    fig.tight_layout()
    path = str(CHARTS_DIR / "violations_chart.png")
    fig.savefig(path, dpi=150, bbox_inches="tight", facecolor=_BG_COLOR)
    plt.close(fig)
    return path

