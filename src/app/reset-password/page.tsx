import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./reset-form";

// Recovery links land here in one of two shapes depending on the Supabase
// email template: `?code=…` (default ConfirmationURL redirect — exchanged
// for a session here) or already-authenticated via /auth/confirm with
// type=recovery. Either way, a valid session lets the form set the new
// password; anything else shows the expired state.
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const supabase = await createClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code).catch(() => {});
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="relative z-10 flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim) hover:text-(--color-text)"
        >
          ← Log in
        </Link>

        <div className="mt-6 rounded-sm border border-(--color-border) bg-(--color-surface) p-8">
          <p className="font-mono text-[11px] uppercase tracking-widest text-(--color-amber-dim)">
            Watch Room Access
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Set a new password</h1>

          {user ? (
            <>
              <p className="mt-2 text-sm text-(--color-text-muted)">
                Signed in as <span className="text-(--color-text)">{user.email}</span>. Choose a
                new password below.
              </p>
              <div className="mt-8">
                <ResetPasswordForm />
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-(--color-text-muted)">
                This reset link is invalid or has expired.
              </p>
              <Link
                href="/forgot-password"
                className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-sm bg-(--color-amber) font-mono text-sm font-medium uppercase tracking-widest text-black transition-colors hover:bg-amber-400"
              >
                Request a new link
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
