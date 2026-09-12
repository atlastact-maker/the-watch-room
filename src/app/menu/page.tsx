import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasAdminAccess, hasShiftAccess } from "@/lib/auth/operator-access";
import { AdvisorSync } from "@/app/components/advisor-sync";
import { WatchMenu, type MenuView } from "./watch-menu";

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // Advisor acceptance alone never admits a player to the menu or a shift.
  if (!(await hasShiftAccess(supabase, user.email))) redirect("/standby");
  const isAdmin = await hasAdminAccess(supabase, user.email);
  const params = await searchParams;
  const view: MenuView = params.view === "shift" || params.view === "guide" || params.view === "updates" ? params.view : "overview";
  const metadata = user.user_metadata ?? {};
  return <>
    <AdvisorSync />
    <WatchMenu
      key={view}
      view={view}
      userId={user.id}
      callsign={typeof metadata.callsign === "string" ? metadata.callsign : ""}
      email={user.email ?? ""}
      discord={typeof metadata.advisor_discord === "string" ? metadata.advisor_discord : ""}
      isAdmin={isAdmin}
    />
  </>;
}
