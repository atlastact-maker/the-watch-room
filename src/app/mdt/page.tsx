import { redirect } from "next/navigation";
import { currentUser } from "@/lib/supabase/server";
import { effectiveShiftAccess } from "@/lib/auth/view-as";
import { CompanionClient } from "./companion-client";

// The companion tablet: a signed-in device joins the desk's live MDT by
// the code the desk shows. Same door as the desk — a tester outside the
// Pre-Alpha hours meets the standing-by page here too.

export const metadata = { title: "MDT companion — The Watch Room" };

export default async function MdtPage({ searchParams }: { searchParams: Promise<{ code?: string | string[] }> }) {
  const { supabase, user } = await currentUser();
  if (!user) redirect("/login?next=/mdt");
  const { hasShift } = await effectiveShiftAccess(supabase, user.email);
  if (!hasShift) redirect("/standby");
  const { code } = await searchParams;
  return <CompanionClient initialCode={typeof code === "string" ? code : undefined} />;
}
