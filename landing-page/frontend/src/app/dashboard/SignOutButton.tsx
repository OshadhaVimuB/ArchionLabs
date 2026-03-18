"use client";

import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <button
      onClick={handleSignOut}
      className="text-sm text-neutral-500 hover:text-white bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-xl transition-all duration-200"
    >
      Sign Out
    </button>
  );
}
