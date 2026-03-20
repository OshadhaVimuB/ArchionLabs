/**
 * Saves a project reference to the landing-page Supabase `projects` table
 * so it appears as a "Recent" item on the dashboard.
 *
 * Best-effort — silently no-ops if Supabase is not configured or user is unauthenticated.
 */

import { supabase } from "@/lib/supabaseClient";

export async function saveRecentProject(
    name: string,
    description: string,
    sourceProjectId: string,
): Promise<void> {
    if (!supabase) return;

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        await supabase.from("projects").upsert(
            {
                user_id: user.id,
                name,
                description,
                source: "viewer",
                source_project_id: sourceProjectId,
                updated_at: new Date().toISOString(),
            },
            {
                onConflict: "user_id,source,source_project_id",
                ignoreDuplicates: false,
            },
        );
    } catch (err) {
        console.warn("[recentProjects] Failed to save:", err);
    }
}
