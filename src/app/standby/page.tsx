import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/auth/actions";

// Where a signed-in account lands while the game is in closed
// development and the account is not on the operator allowlist. The
// tone matters: these are early supporters and advisor applicants, not
// people being turned away.

export const metadata = {
  title: "Standing by — The Watch Room",
};

export default async function StandbyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdvisor = Boolean(
    (user?.user_metadata as { advisor?: unknown } | null)?.advisor,
  );

  return (
    <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-6">
      <div className="w-full max-w-lg space-y-6 border border-(--color-border) bg-(--color-bg)/90 p-8">
        <div className="space-y-1">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-(--color-amber-dim)">
            The Watch Room
          </div>
          <h1 className="font-mono text-xl uppercase tracking-[0.15em] text-(--color-text)">
            Standing by
          </h1>
        </div>

        <div className="space-y-3 text-sm leading-relaxed text-(--color-text-muted)">
          <p>
            The Watch Room is in closed development — shifts aren&apos;t open
            to operators yet. Your account is registered and will be ready
            the day the doors open.
          </p>
          {isAdvisor ? (
            <p>
              You&apos;re registered on the{" "}
              <span className="text-(--color-info)">development advisor
              programme</span> — thank you. Your service background is
              exactly what keeps this simulation honest, and we&apos;ll be in
              touch through the Discord as questions come up.
            </p>
          ) : (
            <p>
              Served in Fire, Ambulance, Police or Control? The{" "}
              <Link
                href="/signup?advisor=1"
                className="text-(--color-info) underline hover:text-(--color-text)"
              >
                development advisor programme
              </Link>{" "}
              is open — real operational experience shapes what gets built.
            </p>
          )}
          <p>
            Development happens in the open on Discord — progress, dev
            diaries, and a say in what comes next.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="https://discord.gg/YBN3sbphs3"
            target="_blank"
            rel="noreferrer"
            className="border border-(--color-info)/60 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-(--color-info) transition-colors hover:bg-(--color-info)/10"
          >
            Join the Discord
          </a>
          <Link
            href="/changelog"
            className="border border-(--color-border) px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim) transition-colors hover:text-(--color-text)"
          >
            Latest changes
          </Link>
          {user && (
            <form action={logout}>
              <button
                type="submit"
                className="px-2 py-2 font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim) underline-offset-4 hover:underline"
              >
                Sign out
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
