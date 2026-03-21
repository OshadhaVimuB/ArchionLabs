import { createClient } from "@/lib/supabase/server";

/**
 * Backend service URLs — configure these via environment variables.
 * Defaults to localhost for development.
 */
const SERVICES = {
  build: process.env.ARCHION_BUILD_API_URL || "http://localhost:8000",
  sim: process.env.ARCHION_SIM_API_URL || "http://localhost:8001",
  community: process.env.ARCHION_COMMUNITY_API_URL || "http://localhost:5000",
  viewer: process.env.ARCHION_VIEWER_API_URL || "http://localhost:8002",
} as const;

export type ServiceName = keyof typeof SERVICES;

/**
 * Create an authenticated fetch function that automatically attaches
 * the Supabase JWT as a Bearer token for backend API calls.
 *
 * Usage (in Server Components or Route Handlers):
 * ```ts
 * const { authFetch } = await createAuthenticatedFetch();
 * const data = await authFetch("build", "/api/v1/generate/projects");
 * ```
 */
export async function createAuthenticatedFetch() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;

  async function authFetch<T = unknown>(
    service: ServiceName,
    path: string,
    options: RequestInit = {}
  ): Promise<{ data: T | null; error: string | null; status: number }> {
    const baseUrl = SERVICES[service];
    const url = `${baseUrl}${path}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        cache: "no-store",
      });

      if (response.status === 401) {
        return {
          data: null,
          error: "Unauthorized — please sign in again",
          status: 401,
        };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          data: null,
          error:
            (errorData as { detail?: string }).detail ||
            `Request failed with status ${response.status}`,
          status: response.status,
        };
      }

      const data = (await response.json()) as T;
      return { data, error: null, status: response.status };
    } catch (err) {
      return {
        data: null,
        error:
          err instanceof Error
            ? err.message
            : "Service unavailable — please try again later",
        status: 503,
      };
    }
  }

  return { authFetch, isAuthenticated: !!accessToken };
}
