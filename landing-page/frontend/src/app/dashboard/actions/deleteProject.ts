"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Server Action to delete a project from the Supabase projects table.
 * 
 * Because we've updated the RLS policies in the database to allow
 * deletion where user_id IS NULL (anonymous projects), the regular
 * Supabase client is sufficient.
 */
export async function deleteProject(projectId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) {
    console.error("Error deleting project:", error);
    throw new Error(`Failed to delete project: ${error.message}`);
  }

  // Revalidate the dashboard path to refresh the list
  revalidatePath("/dashboard");
  
  return { success: true };
}
