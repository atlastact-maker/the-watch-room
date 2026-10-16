import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicShell } from "@/app/menu/console-shell";
import { ResetView } from "./reset-view";

export const metadata: Metadata = { title: "Set a new password · The Watch Room" };

// Recovery links land here in one of two shapes depending on the Supabase
// email template: `?code=…` (the default ConfirmationURL redirect) or
// already authenticated via /auth/confirm with type=recovery. A code
// cannot be exchanged here: this is a Server Component, where the
// Supabase client's cookie writes are swallowed (see lib/supabase/server),
// so it goes to /auth/confirm, which can set cookies, and comes back with
// a session.
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  if (code) redirect(`/auth/confirm?code=${encodeURIComponent(code)}&next=/reset-password`);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <PublicShell brandLine="Operator access" width="narrow" links={[{ href: "/login", label: "Log in", button: true }]}>
      <ResetView email={user?.email ?? null} />
    </PublicShell>
  );
}
