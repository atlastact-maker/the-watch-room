import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ConsoleShell, PublicShell } from "@/app/menu/console-shell";
import { consoleSessionIfSignedIn, consoleUser } from "@/app/menu/console-session";
import { SettingsView } from "./settings-view";

export const metadata: Metadata = { title: "Settings · The Watch Room" };

// An account's own page: an applicant without shift access can still
// reach it, so they get the console surface without the sidebar of
// places they cannot go.
export default async function SettingsPage() {
  const session = await consoleSessionIfSignedIn();
  if (!session) redirect("/login");
  if (!session.hasShift) {
    return (
      <PublicShell brandLine="Account settings" chip="Closed pre-alpha" links={[{ href: "/prealpha", label: "Pre-alpha briefing" }, { href: "/standby", label: "Your standing", button: true }]}>
        <SettingsView />
      </PublicShell>
    );
  }
  return (
    <ConsoleShell {...consoleUser(session)} active="settings" title="Settings">
      <SettingsView />
    </ConsoleShell>
  );
}
