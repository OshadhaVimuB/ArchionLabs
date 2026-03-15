"use client";

import type { ShareConfig, ShareAccessResult, CreateShareOptions } from "@/types/sharing";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_PREFIX = "archion_share_";
const STORAGE_INDEX_KEY = "archion_share_index";

// ---------------------------------------------------------------------------
// Crypto Utilities
// ---------------------------------------------------------------------------

/**
 * Hash a plain-text password with SHA-256.
 * Returns a lowercase hex string, or null if password is empty.
 */
export async function hashPassword(password: string): Promise<string | null> {
    if (!password || password.trim() === "") return null;
    const encoder = new TextEncoder();
    const data = encoder.encode(password.trim());
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate a secure random token string (URL-safe base62).
 */
function generateToken(): string {
    const arr = new Uint8Array(24);
    crypto.getRandomValues(arr);
    // Encode as URL-safe base62-ish using hex (simple and safe)
    return Array.from(arr)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, 32);
}

// ---------------------------------------------------------------------------
// Index Management (list of all token IDs)
// ---------------------------------------------------------------------------

function getIndex(): string[] {
    try {
        const raw = localStorage.getItem(STORAGE_INDEX_KEY);
        return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
        return [];
    }
}

function addToIndex(token: string): void {
    const index = getIndex();
    if (!index.includes(token)) {
        index.push(token);
        localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(index));
    }
}

function removeFromIndex(token: string): void {
    const index = getIndex().filter((t) => t !== token);
    localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(index));
}

// ---------------------------------------------------------------------------
// CRUD Operations
// ---------------------------------------------------------------------------

/** Persist a share config to localStorage. */
function saveShareConfig(config: ShareConfig): void {
    localStorage.setItem(`${STORAGE_PREFIX}${config.token}`, JSON.stringify(config));
    addToIndex(config.token);
}

/** Read a share config from localStorage. Returns null if not found. */
export function getShareConfig(token: string): ShareConfig | null {
    try {
        const raw = localStorage.getItem(`${STORAGE_PREFIX}${token}`);
        if (!raw) return null;
        return JSON.parse(raw) as ShareConfig;
    } catch {
        return null;
    }
}

/**
 * Create a new share token and persist it.
 * Returns the generated ShareConfig.
 */
export async function createShareToken(options: CreateShareOptions): Promise<ShareConfig> {
    const token = generateToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + options.expiryDays * 24 * 60 * 60 * 1000).toISOString();

    const passwordHash = options.password
        ? await hashPassword(options.password)
        : null;

    const watermarkText =
        options.watermarkText ||
        `ARCHION VIEWER · ${options.modelName.toUpperCase()} · CONFIDENTIAL`;

    const config: ShareConfig = {
        token,
        modelDataUrl: options.modelDataUrl,
        modelFormat: options.modelFormat,
        modelName: options.modelName,
        mtlText: options.mtlText ?? null,
        expiresAt,
        passwordHash,
        watermarkText,
        createdAt: now.toISOString(),
        accessCount: 0,
    };

    saveShareConfig(config);
    return config;
}

/**
 * Validate a share token access attempt.
 * Pass a plaintext password string if the user supplied one.
 */
export async function validateShareAccess(
    token: string,
    password?: string
): Promise<ShareAccessResult> {
    const config = getShareConfig(token);

    if (!config) return { status: "notFound" };

    // Expiry check
    if (new Date() > new Date(config.expiresAt)) {
        return { status: "expired" };
    }

    // Password check
    if (config.passwordHash) {
        if (!password) {
            return { status: "passwordRequired" };
        }
        const inputHash = await hashPassword(password);
        if (inputHash !== config.passwordHash) {
            return { status: "wrongPassword" };
        }
    }

    // Record access
    const updated: ShareConfig = { ...config, accessCount: config.accessCount + 1 };
    saveShareConfig(updated);

    return { status: "allowed", config: updated };
}

/**
 * List all share configs from localStorage (may include expired ones).
 */
export function listShareTokens(): ShareConfig[] {
    const index = getIndex();
    return index
        .map((token) => getShareConfig(token))
        .filter((c): c is ShareConfig => c !== null)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Permanently revoke a share token.
 */
export function revokeShareToken(token: string): void {
    localStorage.removeItem(`${STORAGE_PREFIX}${token}`);
    removeFromIndex(token);
}

/**
 * Check whether a given config is still within its validity window.
 */
export function isShareExpired(config: ShareConfig): boolean {
    return new Date() > new Date(config.expiresAt);
}

/**
 * Returns remaining time as a human-readable string, e.g. "6 days 2 hrs".
 */
export function getRemainingTime(config: ShareConfig): string {
    const diffMs = new Date(config.expiresAt).getTime() - Date.now();
    if (diffMs <= 0) return "Expired";

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
}

/**
 * Convert a blob URL to a base64 data URI for persistent storage.
 */
export async function blobUrlToDataUrl(blobUrl: string): Promise<string> {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Build the full shareable URL for a given token.
 */
export function buildShareUrl(token: string): string {
    if (typeof window === "undefined") return `/share/${token}`;
    return `${window.location.origin}/share/${token}`;
}
