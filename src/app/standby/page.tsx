import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/auth/actions";
import { accessProfile } from "@/lib/auth/operator-access";

// Where a signed-in account lands while the game is in closed
// development and the account is not on the operator allowlist. The
// tone matters: these are early supporters and advisor applicants, not
// people being turned away.
//
// Three states, in order of standing:
//   role 'advisor'          — ACCEPTED onto the programme: the Advisor
//                             Room, with the reference material to review.
//   signup tick, no role    — applied; application acknowledged.
//   neither                 — invited to apply.

export const metadata = {
  title: "Standing by — The Watch Room",
};

export default async function StandbyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const applied = Boolean(
    (user?.user_metadata as { advisor?: unknown } | null)?.advisor,
  );
  const { role, icon } = await accessProfile(supabase, user?.email);
  const accepted = role === "advisor";

  return (
    <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-6">
      <div className="w-full max-w-lg space-y-6 border border-(--color-border) bg-(--color-bg)/90 p-8">
        <div className="space-y-1">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-(--color-amber-dim)">
            The Watch Room
          </div>
          <h1 className="font-mono text-xl uppercase tracking-[0.15em] text-(--color-text)">
            {accepted ? "Advisor Room" : "Standing by"}
          </h1>
          {accepted && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-sm border border-(--color-info)/60 bg-(--color-info)/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-(--color-info)">
              {icon && <span aria-hidden>{icon}</span>}
              <span>Development advisor</span>
            </div>
          )}
        </div>

        <div className="space-y-3 text-sm leading-relaxed text-(--color-text-muted)">
          {accepted ? (
            <>
              <p>
                You&apos;re on the{" "}
                <span className="text-(--color-info)">development advisor
                programme</span> — thank you. Your service background is
                what keeps this simulation honest.
              </p>
              <p>
                The most useful thing you can do right now: go through the
                reference material below with a red pen. Stations,
                appliances, callsigns, kit — if something reads wrong to
                someone who&apos;s lived it, we want to hear exactly that,
                in the Discord&apos;s advisor channels.
              </p>
            </>
          ) : (
            <>
              <p>
                The Watch Room is in closed development — shifts aren&apos;t
                open to operators yet. Your account is registered and will
                be ready the day the doors open.
              </p>
              {applied ? (
                <p>
                  Your{" "}
                  <span className="text-(--color-info)">advisor
                  application</span> has been received — thank you. We
                  review applications by hand; you&apos;ll see your standing
                  change here when yours is in.
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
                  is open — real operational experience shapes what gets
                  built.
                </p>
              )}
              <p>
                Development happens in the open on Discord — progress, dev
                diaries, and a say in what comes next.
              </p>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {accepted && (
            /* The glossary overlay carries the resource directory as a
               tab, so one door covers both. */
            <Link
              href="/glossary"
              className="border border-(--color-amber)/60 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-(--color-amber) transition-colors hover:bg-(--color-amber)/10"
            >
              Reference library
            </Link>
          )}
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
