import { redirect } from "next/navigation";
import { getProfile } from "@/lib/api/profile";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
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

  const initialProfile = await getProfile().catch(() => null);

  return (
    <AppShell initialProfile={initialProfile} userId={user.id}>
      {children}
    </AppShell>
  );
}
