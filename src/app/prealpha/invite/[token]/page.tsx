import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// The invitation link. Logged in as the invited account, the visit is
// the acceptance: the RPC ticks them as a tester and sends them on to
// the briefing. Logged out, it says what the link is and sends them to
// log in with the link as the way back.

const btnPrimary =
  "inline-flex min-h-12 items-center justify-center rounded-sm bg-(--color-amber) px-6 py-3 text-center font-mono text-sm font-bold uppercase tracking-[0.2em] text-black transition-colors hover:bg-amber-400";
const btnGhost =
  "inline-flex min-h-12 items-center justify-center rounded-sm border border-(--color-border) px-6 py-3 text-center font-mono text-sm uppercase tracking-[0.2em] text-(--color-text) transition-colors hover:border-(--color-amber-dim) hover:text-(--color-amber)";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let outcome: "invalid" | "expired" | "wrong_account" | "not_ready" | null = null;
  if (!UUID.test(token)) {
    outcome = "invalid";
  } else if (user) {
    const { data, error } = await supabase.rpc("accept_tester_invite", { p_token: token });
    if (error) {
      outcome = error.message.includes("accept_tester_invite") ? "not_ready" : "invalid";
    } else if (data === "ok") {
      redirect("/prealpha?invited=1");
    } else {
      outcome = data === "expired" ? "expired" : data === "wrong_account" ? "wrong_account" : "invalid";
    }
  }

  const here = `/prealpha/invite/${encodeURIComponent(token)}`;

  return (
    <div className="relative z-10 flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link href="/" className="font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim) hover:text-(--color-text)">
          ← The Watch Room
        </Link>
        <div className="mt-6 rounded-sm border border-(--color-border) bg-(--color-surface) p-8">
          <p className="font-mono text-[11px] uppercase tracking-widest text-(--color-amber-dim)">Closed pre-alpha</p>
          {outcome === null ? (
            <>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">You&apos;re invited</h1>
              <p className="mt-3 text-sm leading-relaxed text-(--color-text-muted)">
                This link opens the pre-alpha to the account it was sent to. Log in and it is done; the briefing is on the other side.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Link href={`/login?next=${encodeURIComponent(here)}`} className={btnPrimary}>Log in to accept</Link>
                <Link href="/prealpha" className={btnGhost}>About the pre-alpha</Link>
              </div>
            </>
          ) : outcome === "wrong_account" ? (
            <>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">Wrong account</h1>
              <p className="mt-3 text-sm leading-relaxed text-(--color-text-muted)">
                This invitation was sent to a different email address. Log out, then log in as the account the email went to and open the link again.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Link href="/standby" className={btnGhost}>Back to your account</Link>
              </div>
            </>
          ) : outcome === "expired" ? (
            <>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">This link has expired</h1>
              <p className="mt-3 text-sm leading-relaxed text-(--color-text-muted)">
                Invitations last thirty days. Ask on the Discord, or request access from your standby page, and a fresh one will be sent.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Link href="/standby" className={btnPrimary}>Request access</Link>
              </div>
            </>
          ) : outcome === "not_ready" ? (
            <>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">Not quite ready</h1>
              <p className="mt-3 text-sm leading-relaxed text-(--color-text-muted)">
                Invitations are being set up on the server. Try the link again shortly.
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">That link doesn&apos;t work</h1>
              <p className="mt-3 text-sm leading-relaxed text-(--color-text-muted)">
                It may have been copied incompletely. Open it from the email again, or request access from your standby page.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Link href="/standby" className={btnPrimary}>Request access</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
