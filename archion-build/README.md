# Archion Build

**AI-powered architectural floor plan generator** that describe your ideal space in plain language and get an interactive 2D/3D floor plan in seconds.

---

## Overview

Archion Build is a full-stack web application that combines a FastAPI backend with a Next.js frontend to let users generate, visualize, and edit architectural floor plans through natural language. Simply describe your home or space (e.g. *"a 3-bedroom house with 2 bathrooms, an open kitchen, and a garage"*) and the AI produces a complete, editable floor plan complete with rooms, walls, doors, and windows.

---

## Features

- **Natural Language Generation** — Describe any floor plan in plain text; the AI extracts room requirements and lays them out automatically.
- **Interactive 2D Canvas** — Pan, zoom, draw walls, place doors/windows, add rooms, annotate with text, and drag elements around.
- **3D Visualization** — Switch to a real-time 3D view rendered with Three.js and React Three Fiber, with orbit controls for exploring the space.
- **AI Modification** — Ask the AI to modify an existing plan (e.g. *"add a walk-in closet to the master bedroom"*) and it surgically updates the layout.
- **Undo / Redo** — Full history stack with up to 50 snapshots.
- **Export** — Download the 2D canvas as PNG or PDF.
- **Room Specifications Panel** — Live-updating sidebar showing dimensions and area for every room.
- **Claude AI** — Powered by Anthropic Claude 3.5 Haiku for intelligent architectural understanding.
- **Persistent Projects** — Every generated plan is saved to a SQLite database with full chat history.
- **CadQuery Export** — Generate a standalone Python/CadQuery script for offline CAD export (STEP/STL).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| 3D Rendering | Three.js, @react-three/fiber, @react-three/drei |
| State Management | Zustand |
| UI Components | shadcn/ui, Radix UI, Tailwind CSS |
| Backend | FastAPI, Python |
| Database | SQLAlchemy + SQLite |
| AI / LLM | Anthropic Claude API (Claude 3.5 Haiku) |
| Validation | Pydantic v2 |
| Testing (BE) | pytest |
| Testing (FE) | Vitest |

---

## Project Structure

```
archion-build/
├── backend/
│   ├── app/
│   │   ├── config.py           # Environment & app settings
│   │   ├── database.py         # SQLAlchemy engine & session
│   │   ├── main.py             # FastAPI app entry point
│   │   ├── models/
│   │   │   ├── db_models.py    # ORM models (Project, ChatHistory)
│   │   │   └── floorplan.py    # Pydantic floor plan primitives
│   │   ├── routers/
│   │   │   └── generate.py     # /generate/* endpoints
│   │   └── services/
│   │       ├── geometry.py     # Strip-packing layout solver
│   │       ├── claude_intent.py # NL intent parser (LLM + regex)
│   │       └── model3d.py      # Three.js JSON & CadQuery exporter
│   ├── tests/
│   │   ├── test_api.py
│   │   ├── test_geometry.py
│   │   ├── test_intent_parser.py
│   │   └── test_models.py
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── app/                # Next.js app router
        ├── components/
        │   ├── FloorPlanEditor.tsx       # Root layout component
        │   ├── FloorPlanViewer2D.tsx     # Interactive canvas
        │   ├── Viewer3D.tsx              # Three.js 3D view
        │   ├── DesignAssistant.tsx       # Chat sidebar
        │   ├── RoomSpecsPanel.tsx        # Room dimensions sidebar
        │   ├── EditorToolbar.tsx         # Tool palette & controls
        │   ├── ElementPropertiesPanel.tsx # Selected element editor
        │   └── architectural-symbols.ts  # ISO-compliant draw helpers
        ├── services/api.ts     # Backend API client
        ├── store/
        │   ├── useFloorPlanStore.ts      # Global floor plan state
        │   └── useEditorStore.ts         # Editor tool & history state
        └── types/floorplan.ts  # Shared TypeScript types
```

---

## Getting Started

### Prerequisites

- **Python** 3.10+
- **Node.js** 18+
- An **Anthropic API key** (optional — falls back to regex parsing if omitted)

---

### Backend Setup

```bash
cd archion-build/backend

# Install dependencies
pip install -r requirements.txt

# Create a .env file
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY=your_key_here (optional)

# Start the development server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

#### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `CORS_ORIGINS` | `http://localhost:3000,...` | Allowed frontend origins |
| `ANTHROPIC_API_KEY` | *(empty)* | Anthropic API key for LLM parsing |
| `ANTHROPIC_MODEL` | `claude-3-haiku-20240307` | Default Claude model |

---

### Frontend Setup

```bash
cd archion-build/frontend

# Install dependencies
npm install

# Create environment config
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > .env.local

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## API Reference

All endpoints are public — no authentication required.

### `POST /api/v1/generate/floorplan`

Generate or modify a floor plan from a natural language prompt.

**Request body:**
```json
{
  "prompt": "A house with 3 bedrooms, 2 bathrooms, a kitchen, and a living room",
  "model": "claude-3-haiku-20240307",
  "current_floorplan": null
}
```

Pass `current_floorplan` with an existing floor plan JSON to modify it rather than generate from scratch.

**Response:**
```json
{
  "project_id": "uuid",
  "floorplan": { ... },
  "message": "Generated a floor plan with 6 rooms. Total area: 94.3 m²."
}
```

### `POST /api/v1/generate/threejs`

Generate a Three.js mesh description from a saved project.

### `POST /api/v1/generate/cadquery`

Generate a standalone CadQuery Python script for offline CAD export.

### `GET /api/v1/health`

Health check — returns `{"status": "healthy"}`.

---

## How It Works

### Floor Plan Generation Pipeline

1. **Intent Parsing** — The user's prompt is sent to the Claude LLM (or processed with regex fallback if no API key is set). The parser extracts a structured list of room requirements: type, name, and count.

2. **Layout Solving** — The `LayoutSolver` places rooms using a **strip-packing algorithm**: rooms are sorted by priority tier (living areas first, then bedrooms, then service rooms) and placed left-to-right in horizontal strips, wrapping to a new row when the building width limit is reached. Each room's dimensions are randomized ±15% from standard sizes for natural variation.

3. **Post-processing** — Four wall segments are generated per room; walls on the building perimeter are flagged as exterior. Doors are inserted at every shared edge between adjacent rooms. Windows are placed on every exterior wall long enough to accommodate one.

4. **Persistence** — The project and chat history are saved to SQLite and the full floor plan JSON is returned to the frontend.

### 2D Editor

The canvas is a raw HTML5 `<canvas>` element rendered in a 60fps `requestAnimationFrame` loop. All coordinates are in meters. A configurable zoom/pan transform converts between world space and screen space.

**Available tools (keyboard shortcuts):**

| Tool | Shortcut | Description |
|---|---|---|
| Select | `V` | Click to select, drag to move |
| Wall | `W` | Click to place wall points; right-click or click first point to close |
| Room | `R` | Drag to draw a rectangular room |
| Door | `D` | Click on a wall to place a door |
| Window | `N` | Click on a wall to place a window |
| Text | `T` | Click to place an annotation |
| Eraser | `E` | Click to delete any element |
| Grid | `G` | Toggle grid visibility |
| Undo | `Ctrl+Z` | Undo last action |
| Redo | `Ctrl+Y` | Redo last undone action |

---

## Running Tests

### Backend

```bash
cd archion-build/backend
pytest
```

Test coverage includes:
- Pydantic model validation and computed properties
- Layout solver (strip packing, wall/door/window generation)
- Intent parser (regex fallback, number extraction, synonym handling)
- API endpoints (generation, persistence, chat history)

### Frontend

```bash
cd archion-build/frontend
npm test
```

Tests cover the Zustand store: initial state, setters, successful generation, and API error handling.
