import type { Metadata } from "next";
import { ConsoleShell } from "@/app/menu/console-shell";
import { consoleSession, consoleUser } from "@/app/menu/console-session";
import { ReleaseNotes } from "./release-notes";

export const metadata: Metadata = {
  title: "Release notes · The Watch Room",
  description: "Every build of The Watch Room, release by release.",
};

export default async function ChangelogPage() {
  const session = await consoleSession();
  return (
    <ConsoleShell {...consoleUser(session)} active="updates" title="Release notes">
      <ReleaseNotes />
    </ConsoleShell>
  );
}
