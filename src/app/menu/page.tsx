import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasAdminAccess, hasShiftAccess } from "@/lib/auth/operator-access";
import { viewingAsTester } from "@/lib/auth/view-as";
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
  // A real admin may be looking at the place as a tester would.
  const realAdmin = await hasAdminAccess(supabase, user.email);
  const asTester = realAdmin && (await viewingAsTester());
  const isAdmin = realAdmin && !asTester;
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
      viewAs={realAdmin ? (asTester ? "tester" : "admin") : null}
    />
  </>;
}
