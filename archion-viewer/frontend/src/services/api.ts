/**
 * API service layer for communicating with the backend.
 *
 * All endpoints are public — no JWT / Authorization headers are attached.
 */

import type { GenerateRequest, GenerateResponse, FloorPlan } from "@/types/floorplan";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// ---------------------------------------------------------------------------
// Generic Fetch Wrapper
// ---------------------------------------------------------------------------

export class ApiError extends Error {
    constructor(
        public status: number,
        public detail: string,
    ) {
        super(detail);
        this.name = "ApiError";
    }
}

async function fetchApi<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
        ...options,
    });

    if (!response.ok) {
        let detail = response.statusText;
        try {
            const errorBody = await response.json();
            detail = errorBody.detail ?? detail;
        } catch {
            // response body wasn't JSON — keep statusText
        }
        throw new ApiError(response.status, detail);
    }

    return response.json();
}

// ---------------------------------------------------------------------------
// API Endpoints
// ---------------------------------------------------------------------------

/**
 * Generate a floor plan from a natural language prompt.
 */
export async function generateFloorPlan(
    request: GenerateRequest,
): Promise<GenerateResponse> {
    return fetchApi<GenerateResponse>("/generate", {
        method: "POST",
        body: JSON.stringify(request),
    });
}

/**
 * Fetch project details (if backend supports it).
 */
export async function fetchProject(projectId: string): Promise<FloorPlan> {
    return fetchApi<FloorPlan>(`/projects/${projectId}`);
}

/**
 * List all projects (if backend supports it).
 */
export async function listProjects(): Promise<{ projects: { id: string; name: string }[] }> {
    return fetchApi(`/projects`);
}
