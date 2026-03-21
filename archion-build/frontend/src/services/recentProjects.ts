/**
 * Saves a project reference to the landing-page Supabase `projects` table
 * so it appears as a "Recent" item on the dashboard.
 *
 * This is a best-effort operation — if Supabase is not configured or the user
 * is not authenticated, it silently no-ops.
 */

import { supabase } from "@/lib/supabaseClient";

export async function saveRecentProject(
    name: string,
    description: string,
    sourceProjectId: string,
): Promise<void> {
    if (!supabase) return; // Supabase not configured

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) return; // Not authenticated

        // Upsert to avoid duplicates when the same project is regenerated
        await supabase.from("projects").upsert(
            {
                user_id: user.id,
                name,
                description,
                source: "build",
                source_project_id: sourceProjectId,
                updated_at: new Date().toISOString(),
            },
            {
                onConflict: "user_id,source,source_project_id",
                ignoreDuplicates: false,
            },
        );
    } catch (err) {
        // Best-effort — don't break the app if this fails
        console.warn("[recentProjects] Failed to save:", err);
    }
}
