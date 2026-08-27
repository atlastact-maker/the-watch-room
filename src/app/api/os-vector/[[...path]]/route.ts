import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Ordnance Survey Vector Tile API proxy.
//
// One catch-all rather than a route per resource, because a vector style
// pulls four different kinds of thing — the style JSON, tiles, a sprite
// sheet and font glyph ranges — and the exact paths are OS's to choose,
// not ours to hardcode. Everything under
//
//   https://api.os.uk/maps/vector/v1/vts/<path>
//
// is reachable as /api/os-vector/<path>, with the key added here.
//
// The catch-all is OPTIONAL ([[...path]]) because the style's vector
// source points at the bare service root — /api/os-vector with no path at
// all — for its TileJSON. A required catch-all never routes that URL, the
// source 404s, and MapLibre renders a map with nothing on it.
//
// Every upstream request is forced to srs=3857. OS serve this API in
// British National Grid (27700) by default, and the Leaflet binding only
// speaks Web Mercator — un-forced, the tiles come back in the wrong
// projection and the geometry lands nowhere visible.
//
// The key never reaches the browser. OS Data Hub keys carry no referrer,
// domain or IP restriction, so a key in a style URL is a key anyone can
// lift and spend against the account's allowance. JSON responses get two
// rewrites before they leave: absolute api.os.uk URLs are pointed back at
// this route, and any key OS echoed into those URLs is stripped.

const UPSTREAM = "https://api.os.uk/maps/vector/v1/vts";
const PROXY = "/api/os-vector";

/** First path segments we will forward (besides the bare service root).
 *  Anything else is refused rather than turned into an open proxy. */
const ALLOWED_ROOTS = new Set(["resources", "tile"]);

/** The origin the browser reached us on. Behind Vercel's proxy,
 *  request.nextUrl can reflect the internal server address rather than
 *  the public host, so prefer the forwarded headers — an internal origin
 *  baked into the style would send the browser's sprite and tile
 *  requests somewhere unreachable. */
function requestOrigin(request: NextRequest): string {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return request.nextUrl.origin;
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
): Promise<Response> {
  const key = process.env.OS_DATA_HUB_KEY;
  if (!key) {
    // No key configured — the client never offers the vector layers, so a
    // 404 here is the expected quiet path rather than an error.
    return new Response("OS mapping not configured", { status: 404 });
  }

  // Gate to signed-in operators so a scraper can't spend the allowance.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("unauthorized", { status: 401 });

  const { path } = await context.params;
  const segments = path ?? [];
  if (segments.length > 0 && !ALLOWED_ROOTS.has(segments[0])) {
    return new Response("unknown resource", { status: 400 });
  }
  // No traversal, no absolute URLs smuggled through a segment.
  if (segments.some((p) => p.includes("..") || p.includes("//"))) {
    return new Response("bad path", { status: 400 });
  }

  const suffix = segments.map(encodeURIComponent).join("/");
  // Keep any query OS itself asked for (styles reference sprites and
  // glyphs with their own parameters), then force projection and key.
  const incoming = new URLSearchParams(request.nextUrl.search);
  incoming.set("srs", "3857");
  incoming.set("key", key);
  const upstream =
    `${UPSTREAM}${suffix ? `/${suffix}` : ""}?${incoming.toString()}`;

  let res: Response;
  try {
    res = await fetch(upstream, {
      // Tiles and sprites are immutable per path; the style and service
      // metadata change rarely.
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
  } catch {
    return new Response("upstream unreachable", { status: 502 });
  }

  if (!res.ok) {
    // Pass the status through with a line a person can read in the
    // network tab. 401/403 from OS with a working key almost always means
    // the OS Vector Tile API product is not added to the Data Hub project
    // the key belongs to — each product has to be added per project.
    return new Response(
      `OS upstream error ${res.status} for ${segments[0] ?? "service root"}`,
      { status: res.status },
    );
  }

  const contentType =
    res.headers.get("content-type") ?? "application/octet-stream";

  if (contentType.includes("json")) {
    // Two rewrites over the whole document rather than a walk of known
    // fields, because the style spec scatters URLs across sources, sprite
    // and glyphs, the service root scatters them again, and OS may move
    // them: point absolute OS URLs back here, and strip the key OS echoes
    // into them so it never reaches the browser.
    // Absolute, not root-relative: MapLibre validates the sprite URL and
    // rejects anything without a scheme ("Invalid sprite URL ... must be
    // absolute"), so the proxy's own origin goes on the front. The origin
    // comes off the request, so it follows whatever host serves the app.
    const origin = requestOrigin(request);
    let text = (await res.text())
      .split(UPSTREAM)
      .join(`${origin}${PROXY}`)
      .replace(/key=[^&"\\]*&?/g, "");

    // The service root's tile index lists its tiles relative to itself
    // ("tile/{z}/{y}/{x}.pbf"). MapLibre resolves that against the source
    // URL, and with no trailing slash the last path segment is dropped —
    // every tile request lands on /api/tile/... and 404s, which paints a
    // fully loaded style with nothing. Normalise the entries to absolute
    // proxied URLs so nothing depends on browser URL resolution.
    if (segments.length === 0) {
      try {
        const doc: { tiles?: unknown } = JSON.parse(text);
        if (Array.isArray(doc.tiles)) {
          doc.tiles = doc.tiles.map((t) =>
            typeof t === "string" && !/^https?:\/\//.test(t)
              ? `${origin}${PROXY}/${t.replace(/^\.?\//, "")}`
              : t,
          );
          text = JSON.stringify(doc);
        }
      } catch {
        // not JSON after all — pass through untouched
      }
    }

    // For the style itself, go one further: resolve each vector source's
    // tile index HERE and inline the result, so the browser never fetches
    // or URL-resolves the index at all. Two reasons. Every failure so far
    // has been in the browser-side assembly of this chain, and each link
    // removed is a class of failure gone. And OS's tiles stop around z15
    // while the ground view sits at z19 — MapLibre only overzooms instead
    // of requesting tiles that don't exist if the source declares its
    // maxzoom, which lives in the index, so it must actually arrive.
    if (segments[0] === "resources" && segments[1] === "styles") {
      try {
        const style: {
          sources?: Record<
            string,
            { type?: string; url?: string; tiles?: string[]; minzoom?: number; maxzoom?: number }
          >;
        } = JSON.parse(text);
        for (const src of Object.values(style.sources ?? {})) {
          if (src?.type !== "vector" || typeof src.url !== "string") continue;
          const idxRes = await fetch(`${UPSTREAM}?${incoming.toString()}`, {
            next: { revalidate: 60 * 60 * 24 * 7 },
          });
          if (!idxRes.ok) continue;
          const idx: { tiles?: unknown; minzoom?: unknown; maxzoom?: unknown } =
            await idxRes.json();
          if (!Array.isArray(idx.tiles)) continue;
          delete src.url;
          src.tiles = idx.tiles.map((t) =>
            typeof t === "string" && !/^https?:\/\//.test(t)
              ? `${origin}${PROXY}/${t.replace(/^\.?\//, "")}`
              : String(t).split(UPSTREAM).join(`${origin}${PROXY}`),
          );
          src.minzoom = typeof idx.minzoom === "number" ? idx.minzoom : 0;
          // OS publish vector tiles to z15; overzoom covers the rest. The
          // index's own figure wins when it gives one.
          src.maxzoom = typeof idx.maxzoom === "number" ? idx.maxzoom : 15;
        }
        text = JSON.stringify(style);
      } catch {
        // leave the style as rewritten — the browser-side path still works
      }
    }
    return new Response(text, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // max-age=0 on purpose: the browser revalidates the style on every
        // map mount instead of trusting a copy for an hour — an hour of
        // staleness here is an hour of serving URLs a deploy may have
        // changed the shape of. The edge still caches (s-maxage) and is
        // purged on deploy, so revalidation stays cheap.
        "Cache-Control": "public, max-age=0, s-maxage=86400",
      },
    });
  }

  return new Response(await res.arrayBuffer(), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, s-maxage=2592000, immutable",
    },
  });
}
