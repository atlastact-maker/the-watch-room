import type { Metadata } from "next";
import { PublicShell } from "@/app/menu/console-shell";
import { LoginView } from "./login-view";
import { discordSignInEnabled } from "@/lib/auth/discord";

export const metadata: Metadata = { title: "Sign in · The Watch Room" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  return (
    <PublicShell brandLine="Operator access" width="narrow" links={[{ href: "/prealpha", label: "Pre-Alpha briefing" }, { href: "/signup?prealpha=1", label: "Create an account", primary: true }]}>
      <LoginView error={error} next={next} discordEnabled={await discordSignInEnabled()} />
    </PublicShell>
  );
}
