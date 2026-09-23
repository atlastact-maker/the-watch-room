// Our own OSRM router (tools/osrm), when the deployment has one. Set
// OSRM_URL to its address and every route and matrix request goes there
// first; unset, the routes fall back to OpenRouteService and the public
// demo server exactly as before.

export function ownOsrmBase(): string | null {
  const raw = process.env.OSRM_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(/^https?:\/\//.test(raw) ? raw : `https://${raw}`).origin;
  } catch {
    return null;
  }
}

/** A quick liveness check for the admin page: is the router answering? */
export async function ownOsrmStatus(): Promise<{ configured: false } | { configured: true; host: string; reachable: boolean }> {
  const base = ownOsrmBase();
  if (!base) return { configured: false };
  const host = new URL(base).host;
  try {
    const res = await fetch(`${base}/health`, { signal: AbortSignal.timeout(3_000), cache: "no-store" });
    return { configured: true, host, reachable: res.ok };
  } catch {
    return { configured: true, host, reachable: false };
  }
}
