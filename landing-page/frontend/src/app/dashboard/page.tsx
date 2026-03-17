import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./SignOutButton";
import { BuildSection } from "@/components/dashboard/BuildSection";
import { SimSection } from "@/components/dashboard/SimSection";
import { CommunitySection } from "@/components/dashboard/CommunitySection";
import { ViewerSection } from "@/components/dashboard/ViewerSection";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Archion<span className="text-neutral-500">Labs</span>
            </h1>
            <div className="h-5 w-px bg-neutral-700" />
            <span className="text-sm text-neutral-500">Dashboard</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {user.user_metadata?.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="avatar"
                  className="w-8 h-8 rounded-full border border-neutral-700"
                />
              )}
              <span className="text-sm text-neutral-400">
                {user.user_metadata?.full_name || user.email}
              </span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-white mb-2">
            Hello, {user.user_metadata?.full_name?.split(" ")[0] || "there"} 👋
          </h2>
          <p className="text-neutral-500">
            Manage all your Archion microservices from one place.
          </p>
        </div>

        {/* Service Grid — Live Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BuildSection />
          <SimSection />
          <CommunitySection />
          <ViewerSection />
        </div>

        {/* Account Details */}
        <div className="mt-10 bg-[#161616] border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">
            Account Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-xs text-neutral-600">Email</span>
              <p className="text-sm text-white mt-0.5">{user.email}</p>
            </div>
            <div>
              <span className="text-xs text-neutral-600">Auth Provider</span>
              <p className="text-sm text-white mt-0.5 capitalize">
                {user.app_metadata?.provider || "email"}
              </p>
            </div>
            <div>
              <span className="text-xs text-neutral-600">User ID</span>
              <p className="text-sm text-neutral-500 mt-0.5 font-mono text-xs">
                {user.id}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
