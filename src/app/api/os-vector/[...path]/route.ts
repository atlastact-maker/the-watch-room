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
// The key never reaches the browser. OS Data Hub keys carry no referrer,
// domain or IP restriction, so a key in a style URL is a key anyone can
// lift and spend against the account's allowance.
//
// The style JSON gets one extra step: MapLibre reads absolute URLs out of
// it for its sources, sprite and glyphs, and those point straight back at
// api.os.uk. We rewrite them to point here instead, so the browser never
// learns the upstream host and never needs a key of its own.

const UPSTREAM = "https://api.os.uk/maps/vector/v1/vts";
const PROXY = "/api/os-vector";

/** Path segments we will forward. Anything else is refused rather than
 *  turned into an open proxy against the OS estate. */
const ALLOWED_ROOTS = new Set(["resources", "tile"]);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
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
  if (path.length === 0 || !ALLOWED_ROOTS.has(path[0])) {
    return new Response("unknown resource", { status: 400 });
  }
  // No traversal, no absolute URLs smuggled through a segment.
  if (path.some((p) => p.includes("..") || p.includes("//"))) {
    return new Response("bad path", { status: 400 });
  }

  const suffix = path.map(encodeURIComponent).join("/");
  // Keep any query OS itself asked for (the style JSON references sprites
  // and glyphs with their own parameters), then add the key.
  const incoming = new URLSearchParams(request.nextUrl.search);
  incoming.delete("key");
  incoming.set("key", key);
  const upstream = `${UPSTREAM}/${suffix}?${incoming.toString()}`;

  let res: Response;
  try {
    res = await fetch(upstream, {
      // Tiles and sprites are immutable per path; the style changes rarely.
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
  } catch {
    return new Response("upstream unreachable", { status: 502 });
  }

  if (!res.ok) return new Response(null, { status: res.status });

  const contentType = res.headers.get("content-type") ?? "application/octet-stream";
  const isStyle = contentType.includes("json") && path[0] === "resources";

  if (isStyle) {
    // Point every absolute OS URL in the document back at this route, so
    // the browser fetches sources, sprite and glyphs through us. Done as a
    // string replace over the whole document rather than by walking known
    // fields, because the style spec puts URLs in several places and OS
    // may add more.
    const text = (await res.text()).split(UPSTREAM).join(PROXY);
    return new Response(text, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
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
