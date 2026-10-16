import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SIGNUP_OPENS_AT, signupOpen } from "@/lib/auth/signup-window";
import { prealphaSignups } from "@/lib/prealpha";
import { PublicShell } from "@/app/menu/console-shell";
import { SignupView } from "./signup-view";

export const metadata: Metadata = { title: "Create an account · The Watch Room" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ advisor?: string; prealpha?: string }> }) {
  const { advisor, prealpha } = await searchParams;
  const open = signupOpen();
  const signups = await prealphaSignups(await createClient());
  return (
    <PublicShell brandLine="Operator registration" width="narrow" links={[{ href: "/prealpha", label: "Pre-Alpha briefing" }, { href: "/login", label: "Sign in", button: true }]}>
      <SignupView
        data={{
          open,
          opensOn: new Date(SIGNUP_OPENS_AT).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }),
          prealpha: prealpha === "1",
          advisor: advisor === "1",
          signups: { open: signups.open, closes: signups.closes },
        }}
      />
    </PublicShell>
  );
}
