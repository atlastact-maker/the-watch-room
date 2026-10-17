import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ConsoleShell, PublicShell } from "@/app/menu/console-shell";
import { consoleSessionIfSignedIn, consoleUser } from "@/app/menu/console-session";
import { SettingsView } from "./settings-view";
import { discordSignInEnabled } from "@/lib/auth/discord";

export const metadata: Metadata = { title: "Settings · The Watch Room" };

// An account's own page: an applicant without shift access can still
// reach it, so they get the console surface without the sidebar of
// places they cannot go.
export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ discord?: string; reason?: string }> }) {
  const { discord, reason } = await searchParams;
  const discordEnabled = await discordSignInEnabled();
  const discordNotice = discord === "linked" || discord === "failed" || discord === "unlinked" ? discord : undefined;
  const discordReason = typeof reason === "string" ? reason.slice(0, 80) : undefined;
  const session = await consoleSessionIfSignedIn();
  if (!session) redirect("/login");
  if (!session.hasShift) {
    return (
      <PublicShell brandLine="Account settings" chip="Closed Pre-Alpha" links={[{ href: "/prealpha", label: "Pre-Alpha briefing" }, { href: "/standby", label: "Your standing", button: true }]}>
        <SettingsView discordEnabled={discordEnabled} discordNotice={discordNotice} discordReason={discordReason} />
      </PublicShell>
    );
  }
  return (
    <ConsoleShell {...consoleUser(session)} active="settings" title="Settings">
      <SettingsView discordEnabled={discordEnabled} discordNotice={discordNotice} discordReason={discordReason} />
    </ConsoleShell>
  );
}
