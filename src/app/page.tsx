import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SIGNUP_OPENS_AT, signupOpen } from "@/lib/auth/signup-window";
import { prealphaOpensLabel, prealphaSignups } from "@/lib/prealpha";
import { PublicShell } from "@/app/menu/console-shell";
import { countyFacts, plateStations } from "@/app/menu/county-facts";
import { LandingView } from "./landing-view";

// The front door. Everything but registration, the auth flow and the
// briefing is gated, so it links only where a visitor can go.

export const metadata: Metadata = {
  title: "The Watch Room — Emergency Services Incident Management Simulator",
  description: "Command fire, ambulance and police from one operator position. Real stations, real resources, real roads. Now in closed pre-alpha.",
};

export default async function LandingPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  // Supabase sends the confirmation link to the project's Site URL, which
  // is the site root unless the link carries a redirect of its own, so a
  // confirmation can land here as /?code=… It cannot be exchanged here:
  // this is a Server Component, where the Supabase client's cookie writes
  // are swallowed (see lib/supabase/server). /auth/confirm is a route
  // handler and can set cookies, so hand the code to it.
  const { code } = await searchParams;
  if (code) redirect(`/auth/confirm?code=${encodeURIComponent(code)}`);

  // A live session belongs on its own standing, not the front door. The
  // gate on /menu passes operators through and sends everyone else to /standby.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/menu");

  const open = signupOpen();
  const signups = await prealphaSignups(supabase);
  return (
    <PublicShell
      width="wide"
      links={[{ href: "/prealpha", label: "Pre-alpha briefing" }, { href: "/login", label: "Log in", button: true }, ...(open ? [{ href: "/signup?prealpha=1", label: "Create an account", primary: true }] : [])]}
    >
      <LandingView
        data={{
          open,
          opensOn: new Date(SIGNUP_OPENS_AT).toLocaleDateString("en-GB", { day: "numeric", month: "long" }),
          signups: { open: signups.open, closed: signups.closed, closes: signups.closes, opens: signups.opens || prealphaOpensLabel() },
          facts: countyFacts(),
          stations: plateStations(),
        }}
      />
    </PublicShell>
  );
}
