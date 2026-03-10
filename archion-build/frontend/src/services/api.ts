/**
 * API service layer for communicating with the Archion Build backend.
 *
 * All endpoints are public — no JWT / Authorization headers are attached.
 */

import type { GenerateRequest, GenerateResponse } from "@/types/floorplan";

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

    return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Endpoint Functions
// ---------------------------------------------------------------------------

/**
 * Generate a floor plan from a natural-language prompt.
 *
 * POST /api/v1/generate/floorplan
 */
export async function generateFloorPlan(
    prompt: string,
    model?: string,
    current_floorplan?: any,
): Promise<GenerateResponse> {
    const body: GenerateRequest = { prompt, model, current_floorplan };

    return fetchApi<GenerateResponse>("/generate/floorplan", {
        method: "POST",
        body: JSON.stringify(body),
    });
}

/**
 * Extract a floor plan from an uploaded file (Image, PDF, DXF).
 *
 * POST /api/v1/generate/extract-floorplan
 */
export async function extractFloorPlan(
    file_name: string,
    mime_type: string,
    file_data: string,
): Promise<GenerateResponse> {
    return fetchApi<GenerateResponse>("/generate/extract-floorplan", {
        method: "POST",
        body: JSON.stringify({ file_name, mime_type, file_data }),
    });
}
