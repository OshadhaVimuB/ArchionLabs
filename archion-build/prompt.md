# Archion Build - Implementation Breakdown (Next.js Version)

This document contains a step-by-step implementation guide to build the Archion Build application from scratch, partitioned into logical commits. Authentication and Login functionalities have been explicitly excluded from these prompts.

---

## Commit 1: Project Setup and Foundational Models
**Description:** Initialize the backend and frontend, establish the database structure, and define the single source of truth data models for architectural elements.

**Prompt to implement:**
> Initialize a full-stack application with a FastAPI backend and a Next.js (App Router)/TypeScript frontend. 
> 1. Set up the backend structural boilerplates: `main.py`, `config.py`, and SQLite `database.py`. Do not implement any authentication or login features.
> 2. Create the Pydantic models in `backend/app/models/floorplan.py` to represent architectural primitives: `Point2D`, `BoundingBox`, `Wall`, `Room`, `Door`, `Window`, `Level`, and a unified `FloorPlan` object.
> 3. Define the SQLAlchemy database schemas in `backend/app/models/db_models.py` for `Project` (containing serialized FloorPlan JSON) and `ChatHistory`. Remove any User-related foreign keys.
> 4. Initialize the basic Next.js app structure with an empty `frontend/src/app/page.tsx`, `frontend/src/app/layout.tsx`, and global CSS resets.

---

## Commit 2: Architectural Geometry Engine (Backend)
**Description:** Build the core logic that algorithmically generates floor plans based on room requirements.

**Prompt to implement:**
> Implement the layout solver in `backend/app/services/geometry.py`.
> Create a `LayoutSolver` class that takes a parsed natural language intent and outputs a structured `FloorPlan` object.
> The engine should:
> 1. Support standard room sizes with randomized variations (+/- 15%).
> 2. Use a strip-packing algorithm to place rooms alongside each other based on priority tiers.
> 3. Post-process the layout to generate bounding `Wall`s, determine exterior walls, and insert `Door`s between adjacent rooms and `Window`s on exterior walls.

---

## Commit 3: Intent Parsing and Generation API (Backend)
**Description:** Connect the natural language inputs to the layout solver via REST endpoints.

**Prompt to implement:**
> Build the Natural Language processing and API generation layer for the backend.
> 1. Implement an intent parser (e.g., `backend/app/services/groq_intent.py`) that uses an LLM (or regex fallback) to extract room requirements (number of bedrooms, bathrooms, area, etc.) from user text constraints.
> 2. Create `backend/app/routers/generate.py`. Add a POST `/api/v1/generate/floorplan` endpoint that accepts user text, runs the intent parser, feeds the results to the `LayoutSolver` (from Commit 2), and persists the generated `FloorPlan` and chat history into the SQLite database. Ensure this endpoint is public (no Auth).

---

## Commit 4: Frontend State Management and API Integration
**Description:** Set up the frontend to communicate with the backend and manage global application state.

**Prompt to implement:**
> Implement the API layer and state management using Zustand on the frontend.
> 1. Create `frontend/src/services/api.ts` with wrapper functions for `fetch`. Implement logic to call `/api/v1/generate/floorplan` (Remove any JWT token/Authorization headers).
> 2. Create `frontend/src/store/useFloorPlanStore.ts` using Zustand. It should hold the current `floorPlan` state, a history of chat `messages`, UI modes (`viewMode` like generate/view3d, and `viewerTab`), and loading states. Note: Mark this file with the `"use client"` directive since Zustand manages client-side state.
> 3. Create basic TypeScript definition files (`frontend/src/types/floorplan.ts`) mapping to the backend Pydantic models.

---

## Commit 5: 2D Floor Plan Rendering (Frontend)
**Description:** Build the interactive 2D SVG rendering viewer for generated floor plans.

**Prompt to implement:**
> Create the `FloorPlanViewer2D.tsx` component in `frontend/src/components/` to visualize the architectural data. Ensure it uses `"use client"`.
> 1. Subscribe to the floor plan from the Zustand store. If empty, show a placeholder empty state.
> 2. Parse the `FloorPlan` object and render an interactive SVG.
> 3. Draw a grid background, then map and render the filled SVG polygons/rectangles for `rooms` matching predefined room type colors. Add text labels for room names and calculated areas.
> 4. Render the `walls` as `<line>` elements (make exterior walls thicker), and render `doors` and `windows` over the wall boundaries.

---

## Commit 6: 3D Model Generation and Rendering (Full Stack)
**Description:** Translate the 2D elements into extruded 3D geometry using Three.js and generate CadQuery offline scripts.

**Prompt to implement:**
> Add 3D visualization capabilities to both backend and frontend.
> 1. Backend: Implement `backend/app/services/model3d.py`. Create functions to emit a descriptive Three.js JSON representation and CadQuery Python scripts from the `FloorPlan` model. Add endpoints for these in `generate.py`.
> 2. Frontend: Implement `frontend/src/components/Viewer3D.tsx` (marked with `"use client"`) using `@react-three/fiber` and `@react-three/drei`.
> 3. Render extruded 3D meshes for walls, floor tiles, windows, and doors, applying proper lighting (`AmbientLight`, `DirectionalLight`), shadows, and orbit controls.

---

## Commit 7: Editor UI and Chat Assistant (Frontend)
**Description:** Assemble the core user experience, combining the viewers, chat window, and property sidebars.

**Prompt to implement:**
> Implement the main Editor layout components in `frontend/src/components/`.
> 1. Create `FloorPlanEditor.tsx` with a standard 3-panel layout: Left (Specifications), Center (Canvas toggle between 2D/3D), Right (Design Assistant).
> 2. Implement `DesignAssistant.tsx` as a chat interface that reads messages from the Zustand store, accepts user typed requests, and calls the API store action to generate the plan.
> 3. Integrate the previously built `FloorPlanViewer2D` and `Viewer3D` into the center canvas along with an `EditorToolbar.tsx`. Ensure interactive elements are marked as `"use client"`.

---

## Commit 8: Projects and Sharing (Full Stack)
**Description:** Add project history listing and public shareable URLs.

**Prompt to implement:**
> Implement Project History and Sharing features.
> 1. Backend: Build `backend/app/routers/projects.py` to list/retrieve/delete floor plan projects from the database. Build `backend/app/routers/share.py` to generate read-only `share_id` links. (Ensure these do not require authentication).
> 2. Frontend: Create `Sidebar.tsx` to display previous projects fetched from the API.
> 3. Frontend: Create `SharePanel.tsx` to request a share link from the backend and display it. Set up Next.js dynamic routing by creating `frontend/src/app/share/[id]/page.tsx` to load and display the read-only states when visiting shared links.