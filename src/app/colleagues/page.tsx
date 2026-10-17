import type { Metadata } from "next";
import { ConsoleShell } from "@/app/menu/console-shell";
import { consoleSession, consoleUser } from "@/app/menu/console-session";
import { createClient } from "@/lib/supabase/server";
import { loadColleagues, searchOperators } from "@/lib/operators";
import { ColleaguesView } from "./colleagues-view";

export const metadata: Metadata = { title: "Colleagues · The Watch Room" };

export default async function ColleaguesPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; notice?: string | string[] }> }) {
  const { q, notice } = await searchParams;
  const session = await consoleSession();
  const supabase = await createClient();
  const query = typeof q === "string" ? q.trim().slice(0, 40) : "";
  const [mine, found] = await Promise.all([loadColleagues(supabase), searchOperators(supabase, query, query ? 40 : 12)]);
  return (
    <ConsoleShell {...consoleUser(session)} active="colleagues" title="Colleagues">
      <ColleaguesView rows={mine.rows} found={found.rows} query={query} notice={typeof notice === "string" ? notice : undefined} missing={mine.missing || found.missing} />
    </ConsoleShell>
  );
}
