import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase admin client using the service role key.
 * This bypasses Row Level Security and can see ALL projects,
 * including those with user_id = NULL (anonymous).
 *
 * Only use this on the server side (never expose the service role key
 * to the browser).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    // Fallback: if no service role key, return null so callers
    // can fall back to the regular RLS-bound client.
    return null;
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
