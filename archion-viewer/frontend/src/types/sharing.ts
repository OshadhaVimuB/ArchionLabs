// ---------------------------------------------------------------------------
// Share System Types
// ---------------------------------------------------------------------------

/**
 * A share configuration stored in localStorage for a particular token.
 * The model data is stored as a base64 data URI so the shared page can
 * reconstruct the blob URL client-side without a backend.
 */
export interface ShareConfig {
    /** Unique token used in the URL: /share/[token] */
    token: string;
    /** Base64 data URI of the model file (e.g. data:model/gltf+json;base64,...) */
    modelDataUrl: string;
    /** Format: "gltf" | "fbx" | "obj" | "stl" */
    modelFormat: string;
    /** Human-readable model name */
    modelName: string;
    /** MTL file text (for OBJ models), if any */
    mtlText?: string | null;
    /** ISO 8601 expiry date string */
    expiresAt: string;
    /** SHA-256 hex hash of the password, or null if no password set */
    passwordHash: string | null;
    /** Text shown in the watermark overlay */
    watermarkText: string;
    /** ISO 8601 creation date string */
    createdAt: string;
    /** Number of times the shared link has been accessed */
    accessCount: number;
}

/**
 * Result of validating a share token access attempt.
 */
export type ShareAccessResult =
    | { status: "allowed"; config: ShareConfig }
    | { status: "expired" }
    | { status: "notFound" }
    | { status: "passwordRequired" }
    | { status: "wrongPassword" };

/**
 * Options for creating a new share.
 */
export interface CreateShareOptions {
    modelDataUrl: string;
    modelFormat: string;
    modelName: string;
    mtlText?: string | null;
    /** Number of days until the link expires */
    expiryDays: number;
    /** Plain-text password (will be hashed before storage). Empty = no password. */
    password?: string;
    watermarkText?: string;
}
