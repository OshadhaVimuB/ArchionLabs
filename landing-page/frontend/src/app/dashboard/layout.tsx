import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Redirect new users to onboarding if they haven't set their profile name
  if (!user.user_metadata?.full_name) {
    redirect("/onboarding");
  }

  return (
    <div className="flex h-screen bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-50 overflow-hidden transition-colors">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
