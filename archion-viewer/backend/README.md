# Archion Viewer — Backend

FastAPI backend for the **Archion Viewer 3D** frontend.  
Provides persistent server-side storage for 3D model files and a secure, token-based share link system.

---

## Features

| Area | Detail |
|---|---|
| **Model Upload** | Accept FBX, OBJ, STL, glTF / GLB files via multipart form. Optional MTL + texture files for OBJ. |
| **Model Serving** | Stream model / MTL / texture files directly from disk. |
| **Share Tokens** | Create expiring, optionally password-protected share links. SHA-256 password hashing (compatible with the frontend's Web Crypto API). |
| **Watermarks** | Watermark text stored per share token, rendered by the frontend overlay. |
| **Access Tracking** | Each share token records how many times it has been validated. |

---

## Tech Stack

- **Python 3.11+**
- **FastAPI** — REST API framework
- **SQLAlchemy 2** — ORM with SQLite (swappable to Postgres)
- **Pydantic v2** — request/response validation
- **Uvicorn** — ASGI server

---

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, router registration
│   ├── config.py            # Settings loaded from .env
│   ├── database.py          # SQLAlchemy engine + session factory
│   ├── models/
│   │   └── db_models.py     # ModelUpload & ShareToken ORM models
│   ├── routers/
│   │   ├── upload.py        # POST /api/upload
│   │   ├── models.py        # GET|DELETE /api/models/…
│   │   └── share.py         # CRUD /api/share/…
│   └── services/
│       ├── upload_service.py
│       └── share_service.py
├── uploads/                 # Created at runtime — stores uploaded files
├── .env.example
├── requirements.txt
└── README.md
```

---

## Quick Start

```bash
# 1. Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS / Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
copy .env.example .env        # Windows
# cp .env.example .env        # macOS / Linux
# Edit .env as needed

# 4. Run the development server
uvicorn app.main:app --reload --port 8000
```

The API will be available at **http://localhost:8000**.  
Interactive docs: **http://localhost:8000/docs**

---

## API Reference

### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Welcome message |
| `GET` | `/api/health` | Liveness probe |

### Upload

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/upload` | Upload a 3D model (multipart). Fields: `model_file` (required), `mtl_file` (optional), `texture_files` (optional, multiple). Returns `model_id`. |

### Models

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/models/{id}` | Model metadata + file URLs |
| `GET` | `/api/models/{id}/file` | Download model binary |
| `GET` | `/api/models/{id}/mtl` | Download MTL file |
| `GET` | `/api/models/{id}/texture/{filename}` | Download texture file |
| `DELETE` | `/api/models/{id}` | Delete model + files (cascades to shares) |

### Share

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/share` | Create share token. Body: `model_id`, `model_name`, `expiry_days`, `watermark_text`, `password?` |
| `GET` | `/api/share` | List all active (non-revoked) share tokens |
| `GET` | `/api/share/{token}/validate` | Validate token. Returns metadata or 401/403/410. Increments access counter. |
| `GET` | `/api/share/{token}/model` | Serve model file via share token (password via `?password=` or `X-Share-Password` header) |
| `GET` | `/api/share/{token}/mtl` | Serve MTL file via share token |
| `DELETE` | `/api/share/{token}` | Revoke a share token |

---

## Frontend Integration

The backend is designed to work alongside (or replace) the frontend's current localStorage-based share system.

**To use server-side sharing from the frontend**, update `shareManager.ts` to call these endpoints instead of writing to `localStorage`.  
The `modelDataUrl` field in `ShareConfig` can be set to `/api/share/{token}/model` so that `SharedViewerGate.tsx` can `fetch()` the model directly from the backend — no code changes are needed in the viewer component.

---

## Security Notes

- Uploaded filenames are validated to reject path-traversal sequences (`..`, `/`, `\`).
- Only known model / texture extensions are accepted.
- File size is capped at `MAX_UPLOAD_SIZE` (default 100 MB).
- Passwords are never stored in plain text — only their SHA-256 hash is persisted.
- CORS origins are restricted to the values in `CORS_ORIGINS` (`.env`).
