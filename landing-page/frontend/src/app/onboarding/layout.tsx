import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingLayout({
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

  // If the user already has a full name set, they have completed the onboarding process.
  // Bounce them back to the dashboard immediately if they try to access /onboarding.
  if (user.user_metadata?.full_name) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
