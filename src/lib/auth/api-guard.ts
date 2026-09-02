import { createClient } from "@/lib/supabase/server";
import { shiftAccess } from "./operator-access";

// The gate for route handlers.
//
// proxy.ts excludes api/ from its matcher on purpose — it runs on every
// request including prefetches, so a database round-trip does not belong
// there. That leaves each handler responsible for its own check, and
// "is there a session" is the wrong bar for these nine: every one of them
// spends somebody else's quota. The two Ordnance Survey proxies bill a
// metered Premium allowance, OpenRouteService has a daily cap, and the
// Overpass mirrors are community infrastructure under a fair-use policy
// where sustained abuse gets the deployment's IP blocked.
//
// So the bar is shift access, not a session. An advisor is a signed-in
// account with no map and no sim; they have no business pulling tiles.
// The routes' own comments always claimed they were gated "to signed-in
// operators" — this is the code finally matching the comment.

export type ShiftGate = { ok: true } | { ok: false; status: 401 | 403 };

// The role lookup reads user_roles, and one map pan fires dozens of tile
// requests — a SELECT per tile would be indefensible. Cache the verdict
// per account for a minute. The cost is that granting or revoking a role
// takes up to a minute to bite on the API routes; every page checks live,
// so nobody is looking at a screen the cache is lying about.
//
// A refusal caused by the lookup FAILING is never cached. Everything in
// operator-access fails closed, so an outage and "no role" both come back
// as no — and caching that for a minute would turn one Supabase blip into
// a minute of blank map for an operator mid-shift. A failed lookup is
// still refused, just not remembered.
const TTL_MS = 60_000;
const verdicts = new Map<string, { allowed: boolean; at: number }>();

export async function shiftGate(): Promise<ShiftGate> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401 };

  const now = Date.now();
  const hit = verdicts.get(user.id);
  if (hit && now - hit.at < TTL_MS) {
    return hit.allowed ? { ok: true } : { ok: false, status: 403 };
  }

  const { allowed, lookupFailed } = await shiftAccess(supabase, user.email);
  if (lookupFailed) return { ok: false, status: 403 };
  verdicts.set(user.id, { allowed, at: now });

  // Keep the map bounded on a long-lived instance.
  if (verdicts.size > 500) {
    for (const [id, v] of verdicts) {
      if (now - v.at >= TTL_MS) verdicts.delete(id);
    }
  }

  return allowed ? { ok: true } : { ok: false, status: 403 };
}
