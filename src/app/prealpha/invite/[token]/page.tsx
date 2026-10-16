import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicShell } from "@/app/menu/console-shell";
import { InviteView, type InviteOutcome } from "./invite-view";

// The invitation link. Logged in as the invited account, the visit is
// the acceptance: the RPC ticks them as a tester and sends them on to
// the briefing. Logged out, it says what the link is and sends them to
// log in with the link as the way back.

export const metadata: Metadata = { title: "Invitation · The Watch Room" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let outcome: InviteOutcome = null;
  if (!UUID.test(token)) {
    outcome = "invalid";
  } else if (user) {
    const { data, error } = await supabase.rpc("accept_tester_invite", { p_token: token });
    if (error) {
      outcome = error.message.includes("accept_tester_invite") ? "not_ready" : "invalid";
    } else if (data === "ok") {
      redirect("/prealpha?invited=1");
    } else {
      outcome = data === "expired" ? "expired" : data === "wrong_account" ? "wrong_account" : "invalid";
    }
  }

  return (
    <PublicShell brandLine="Closed pre-alpha" chip="Closed pre-alpha" width="narrow" links={user ? [{ href: "/standby", label: "Your standing", button: true }] : [{ href: "/prealpha", label: "Pre-alpha briefing" }, { href: "/login", label: "Log in", button: true }]}>
      <InviteView outcome={outcome} here={`/prealpha/invite/${encodeURIComponent(token)}`} />
    </PublicShell>
  );
}
