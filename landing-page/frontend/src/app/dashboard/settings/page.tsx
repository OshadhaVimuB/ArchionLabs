import { Header } from "@/components/dashboard/Header";
import { createClient } from "@/lib/supabase/server";
import { ProfileSettingsForm } from "@/components/dashboard/ProfileSettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <Header user={user} title="Settings" />
      <main className="flex-1 overflow-y-auto p-8 bg-zinc-50/50 dark:bg-[#09090b] transition-colors">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Profile Settings</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage your account settings and preferences.</p>
        </div>
        <ProfileSettingsForm user={user} />
      </main>
    </>
  );
}
