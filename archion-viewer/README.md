<div align="center">

# ArchionViewer

**A professional-grade, full-stack 3D model viewer built for architects and designers.**  
Upload, inspect, annotate, and share GLTF · GLB · OBJ · FBX · STL models — complete with secure token-based sharing, watermarking, and password protection.

---

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%201.0.0-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Three.js](https://img.shields.io/badge/3D-Three.js%20%2B%20R3F-black?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Language-Python%203.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![SQLAlchemy](https://img.shields.io/badge/ORM-SQLAlchemy%202.0-red?style=for-the-badge)](https://www.sqlalchemy.org/)
[![TailwindCSS](https://img.shields.io/badge/Styles-Tailwind%20CSS%20v4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

</div>

---

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Architecture](#architecture)
4. [Project Structure](#project-structure)
5. [Backend — Setup & Reference](#backend--setup--reference)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Environment Variables](#environment-variables)
   - [Running the Server](#running-the-server)
   - [API Reference](#api-reference)
6. [Frontend — Setup & Reference](#frontend--setup--reference)
   - [Prerequisites](#prerequisites-1)
   - [Installation](#installation-1)
   - [Running the Dev Server](#running-the-dev-server)
   - [Pages & Routes](#pages--routes)
   - [Component Overview](#component-overview)
   - [State Management](#state-management)
7. [Full Stack Quickstart](#full-stack-quickstart)
8. [Supported Formats](#supported-formats)
9. [Security Model](#security-model)
10. [Contributing](#contributing)

---

## Overview

ArchionViewer is a full-stack web application that gives architects, engineers, and designers a frictionless way to:

- **Upload** 3D models from their desktop directly to a persistent server-side store.
- **Visualise** models in an interactive WebGL viewport with orbit controls, annotations, and lighting.
- **Share** any model with teammates or clients via a unique, time-limited URL — optionally protected by a password and a branded watermark.

The backend is a **FastAPI** REST API backed by **SQLAlchemy** (SQLite by default, easily swapped for PostgreSQL). The frontend is a **Next.js 16 + React** app that renders models via **React Three Fiber** and **Three.js**.

---

## Key Features

| Category | Features |
|---|---|
| **3D Rendering** | GLTF/GLB, OBJ+MTL+Textures, FBX, STL — all rendered in a real-time WebGL viewport |
| **Orbit Controls** | Mouse/touch orbit, pan, zoom via `@react-three/drei` |
| **Annotations** | Drop in-scene notes tied to exact 3D positions |
| **Floor Plans** | DXF floor plan parsing and 3D extrusion with typed room categories |
| **Upload Pipeline** | Single request for model + MTL + multiple texture files; 100 MB limit (configurable) |
| **Share Tokens** | Cryptographically random token per share; configurable expiry (1–365 days) |
| **Password Protection** | SHA-256 hashed password stored on the server; plain-text never persisted |
| **Watermarking** | Custom text overlay rendered over every shared view |
| **Access Counting** | Backend tracks how many times each share link has been opened |
| **Link Revocation** | Instantly revoke any share token without deleting the original model |
| **Persistent Storage** | All models live server-side — share links work across devices and sessions |
| **Interactive API Docs** | Swagger UI at `/docs`, ReDoc at `/redoc` |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Browser / Client                           │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────┐  │
│  │  /upload     │  │  /viewer     │  │  /share/[token]         │  │
│  │  Upload Page │  │  3D Viewer   │  │  SharedViewerGate       │  │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬────────────┘  │
│         │                 │                        │               │
│         └─────────────────┴────────────────────────┘               │
│                           │  REST / JSON                            │
└───────────────────────────┼─────────────────────────────────────────┘
                            │  HTTP
┌───────────────────────────┼─────────────────────────────────────────┐
│                    FastAPI Backend  (:8000)                         │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────┐  │
│  │  /api/upload │  │  /api/models │  │  /api/share             │  │
│  │  Router      │  │  Router      │  │  Router                 │  │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬────────────┘  │
│         │                 │                        │               │
│  ┌──────▼─────────────────▼────────────────────────▼────────────┐  │
│  │              SQLAlchemy ORM  (SessionLocal)                  │  │
│  └──────────────────────────┬───────────────────────────────────┘  │
│                             │                                       │
│           ┌─────────────────┴──────────────┐                       │
│           │  SQLite (dev)  /  PostgreSQL    │                       │
│           └────────────────────────────────┘                       │
│                                                                     │
│           ┌────────────────────────────────┐                       │
│           │  ./uploads/<uuid>/…            │  (file system)        │
│           └────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
archion-viewer/
│
├── backend/                        # FastAPI application
│   ├── .env.example                # Sample environment variables
│   ├── requirements.txt            # Python dependencies
│   └── app/
│       ├── __init__.py
│       ├── main.py                 # App factory, CORS, router registration
│       ├── config.py               # Env-driven settings (pydantic / dotenv)
│       ├── database.py             # SQLAlchemy engine, session, Base
│       ├── models/
│       │   └── db_models.py        # ModelUpload & ShareToken ORM tables
│       ├── routers/
│       │   ├── upload.py           # POST  /api/upload
│       │   ├── models.py           # GET / DELETE  /api/models/{id}/*
│       │   └── share.py            # POST / GET / DELETE  /api/share/*
│       └── services/
│           ├── upload_service.py   # File validation, chunked disk save
│           └── share_service.py    # Token generation, password hashing
│
└── frontend/                       # Next.js 16 application
    ├── package.json
    ├── next.config.ts
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── app/                        # Next.js App Router pages
    │   ├── layout.tsx              # Root layout (fonts, global CSS)
    │   ├── page.tsx                # Home / landing page
    │   ├── upload/
    │   │   └── page.tsx            # Upload & manage models
    │   ├── viewer/
    │   │   └── page.tsx            # Standalone 3D viewer
    │   └── share/
    │       └── [token]/
    │           └── page.tsx        # Token-gated shared viewer
    └── src/
        ├── components/
        │   ├── Viewer3D.tsx          # Core Three.js canvas + model loader
        │   ├── FloorPlanUploader.tsx # DXF → 3D floor plan pipeline
        │   ├── ShareModel.tsx        # Share-link creation UI
        │   ├── SharedViewerGate.tsx  # Token validation + password gate UI
        │   └── WatermarkOverlay.tsx  # Branded text overlay for shared views
        ├── store/
        │   └── useFloorPlanStore.ts  # Zustand store (model state, annotations)
        ├── services/
        ├── lib/
        │   ├── floorPlanProcessor.ts # DXF parsing & room geometry builder
        │   ├── shareManager.ts       # Share token CRUD (localStorage layer)
        │   └── watermark.ts          # Watermark generation helpers
        └── types/
            ├── floorplan.ts          # Room types, geometry primitives
            └── sharing.ts            # ShareConfig, CreateShareOptions, etc.
```

---

## Backend — Setup & Reference

### Prerequisites

| Requirement | Version |
|---|---|
| Python | ≥ 3.11 |
| pip | latest |
| (Optional) PostgreSQL | ≥ 14 |

### Installation

```bash
# 1. Move into the backend directory
cd archion-viewer/backend

# 2. Create and activate a virtual environment
python -m venv .venv
# Windows
.\.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create your environment file
cp .env.example .env
# Then edit .env with your preferred settings
```

### Environment Variables

Copy `.env.example` to `.env` and adjust the values:

| Variable | Default | Description |
|---|---|---|
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated list of allowed frontend origins |
| `DATABASE_URL` | `sqlite:///./archion_viewer.db` | SQLAlchemy DB URL. For Postgres: `postgresql://user:pass@host/db` |
| `UPLOAD_DIR` | `./uploads` | Directory where model files are stored on disk |
| `MAX_UPLOAD_SIZE` | `104857600` (100 MB) | Maximum accepted upload size in bytes |

### Running the Server

```bash
# Development (auto-reload on file changes)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

Once running, visit:

| URL | Description |
|---|---|
| `http://localhost:8000/docs` | Interactive Swagger UI |
| `http://localhost:8000/redoc` | ReDoc documentation |
| `http://localhost:8000/api/health` | Liveness probe |

---

### API Reference

#### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Welcome message + version |
| `GET` | `/api/health` | Liveness probe → `{"status":"healthy"}` |

---

#### Upload — `/api/upload`

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/upload` | Upload a 3D model to persistent storage |

**Request** — `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `model_file` | File | ✅ | Primary 3D model (`.gltf`, `.glb`, `.obj`, `.fbx`, `.stl`) |
| `mtl_file` | File | ⬜ | MTL material file (OBJ models only) |
| `texture_files` | File[] | ⬜ | Texture images (`.jpg`, `.png`, `.tga`, `.tiff`, `.webp`, …) |

**Response `201`**

```json
{
  "model_id": "d4e1f2a3-...",
  "original_filename": "building.glb",
  "model_format": "gltf",
  "file_size": 2048576,
  "created_at": "2026-03-16T10:00:00",
  "model_url": "/api/models/d4e1f2a3-.../file",
  "mtl_url": null
}
```

---

#### Models — `/api/models`

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/models/{model_id}` | Get model metadata & file URLs |
| `GET` | `/api/models/{model_id}/file` | Download the primary model file |
| `GET` | `/api/models/{model_id}/mtl` | Download the MTL material file (OBJ only) |
| `GET` | `/api/models/{model_id}/texture/{filename}` | Download a texture by filename |
| `DELETE` | `/api/models/{model_id}` | Delete model record and all files from disk |

---

#### Share — `/api/share`

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/share` | Create a new share token for an uploaded model |
| `GET` | `/api/share` | List all active (non-revoked) share tokens |
| `GET` | `/api/share/{token}/validate` | Validate a token; increments access counter |
| `GET` | `/api/share/{token}/model` | Serve the model file via the share token |
| `GET` | `/api/share/{token}/mtl` | Serve the MTL file via the share token |
| `DELETE` | `/api/share/{token}` | Revoke a share token |

**POST `/api/share` — Request Body**

```json
{
  "model_id": "d4e1f2a3-...",
  "model_name": "Office Block v3",
  "expiry_days": 7,
  "watermark_text": "Confidential — Archion Labs",
  "password": "optionalSecret"
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `model_id` | string | — | ID returned by `POST /api/upload` |
| `model_name` | string | — | Human-readable label shown to recipients |
| `expiry_days` | integer | `7` | 1–365 days until the link expires |
| `watermark_text` | string | `""` | Overlay text (auto-generated if empty) |
| `password` | string | `null` | Plain-text password — hashed SHA-256 before storage |

**Response `201`**

```json
{
  "token": "abc123xyz...",
  "model_name": "Office Block v3",
  "model_format": "gltf",
  "expires_at": "2026-03-23T10:00:00",
  "watermark_text": "Confidential — Archion Labs",
  "created_at": "2026-03-16T10:00:00",
  "access_count": 0,
  "is_revoked": false,
  "is_expired": false,
  "has_password": true,
  "model_url": "/api/share/abc123xyz.../model",
  "share_url": "/share/abc123xyz..."
}
```

---

## Frontend — Setup & Reference

### Prerequisites

| Requirement | Version |
|---|---|
| Node.js | ≥ 18 |
| npm / pnpm / yarn | latest |

### Installation

```bash
# 1. Move into the frontend directory
cd archion-viewer/frontend

# 2. Install dependencies
npm install
```

### Running the Dev Server

```bash
npm run dev
```

The app is available at `http://localhost:3000`.

| Script | Command | Purpose |
|---|---|---|
| Dev server | `npm run dev` | Hot-reload development server |
| Production build | `npm run build` | Optimised production build |
| Start production | `npm start` | Serve the built app |
| Lint | `npm run lint` | ESLint check |

---

### Pages & Routes

| Route | Page | Description |
|---|---|---|
| `/` | Home | Landing page — quick links to upload and viewer |
| `/upload` | Upload | Drag-and-drop upload form; manage existing models; create share links |
| `/viewer` | Viewer | Standalone 3D viewer for locally loaded files |
| `/share/[token]` | SharedViewerGate | Token-gated view — validates token, prompts for password if required, then renders the model with a watermark overlay |

---

### Component Overview

#### `Viewer3D.tsx`
The core 3D rendering component. Wraps a React Three Fiber `<Canvas>` and supports all five model formats dynamically. Features include:

- **Multi-format loader** — GLTF, FBX, OBJ (+MTL +textures), STL, all loaded via `three-stdlib`
- **Orbit controls** — orbit, pan, zoom via `@react-three/drei`
- **Auto-fit camera** — bounding-box traversal centres the camera on load
- **Grid helper** — optional ground-plane grid
- **Annotation pins** — clickable `<Html>` overlays anchored to 3D positions
- **Material texture mapping** — OBJ URL modifier patches MTL texture paths to server-side blobs

#### `FloorPlanUploader.tsx`
Handles DXF floor plan ingestion. Parses raw DXF into typed room entities (`RoomType`) and drives a 3D extrusion pipeline via `floorPlanProcessor.ts`.

#### `ShareModel.tsx`
UI for generating a share link from an already-uploaded model. Configures expiry, optional password, and watermark text, then calls `POST /api/share`.

#### `SharedViewerGate.tsx`
Route-level access gate for `/share/[token]`. Calls `GET /api/share/{token}/validate`, handles the `passwordRequired` / `wrongPassword` / `expired` / `notFound` states, and renders the `Viewer3D` + `WatermarkOverlay` on success.

#### `WatermarkOverlay.tsx`
A CSS-positioned overlay that renders the share's `watermark_text` diagonally across the viewport. Prevents casual screenshotting of proprietary models.

---

### State Management

Global state is managed with **Zustand** in `src/store/useFloorPlanStore.ts`.

Key slices managed by the store:

| State Key | Type | Purpose |
|---|---|---|
| `model` | `THREE.Object3D \| null` | Currently active scene object |
| `modelFormat` | `string` | Active format string (`gltf`, `obj`, `fbx`, `stl`) |
| `annotations` | `Annotation[]` | In-scene annotation pins |
| `floorPlanData` | `FloorPlan \| null` | Parsed floor plan geometry |

---

## Full Stack Quickstart

Start both services in two terminals:

```bash
# Terminal 1 — Backend
cd archion-viewer/backend
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

```bash
# Terminal 2 — Frontend
cd archion-viewer/frontend
npm install
npm run dev
```

Then open `http://localhost:3000` in your browser.

---

## Supported Formats

| Format | Extension(s) | Materials | Textures |
|---|---|---|---|
| glTF / glb | `.gltf`, `.glb` | ✅ Embedded | ✅ Embedded |
| Wavefront OBJ | `.obj` | ✅ via `.mtl` | ✅ Upload alongside |
| Autodesk FBX | `.fbx` | ✅ Embedded | ✅ Embedded |
| STL | `.stl` | ⬜ Default grey | ⬜ — |

> **Tip:** For the best visual result, export models as `.glb` — it bundles geometry, materials, and textures into a single binary file.

---

## Security Model

| Concern | Implementation |
|---|---|
| **Password storage** | Passwords are hashed with SHA-256 — plain text is never written to the database |
| **Path traversal** | Texture filename requests are validated server-side to reject `..` and path separators |
| **CORS** | Only origins listed in `CORS_ORIGINS` are allowed |
| **Token entropy** | Share tokens are generated with `secrets.token_urlsafe` (Python stdlib) |
| **Expiry enforcement** | `expires_at` is checked on every `/validate` call |
| **Revocation** | `is_revoked` flag stops access immediately without deleting the model |

---

## Contributing

1. Fork the repository and create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes and add tests where appropriate.
3. Run the linter and test suite.
4. Open a pull request with a clear description of the change.

---

<div align="center">

Built with care by **Archion Labs**

</div>