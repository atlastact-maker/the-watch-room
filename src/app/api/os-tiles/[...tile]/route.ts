import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Ordnance Survey raster tile proxy.
//
// The key never reaches the browser. OS Data Hub keys carry NO referrer,
// domain or IP restriction — a key in a client-side tile URL is a key
// anyone can lift and spend, and at zoom 17-20 we are drawing Premium
// data that bills against a monthly allowance. OS say plainly not to
// embed it ("the user's browser is not a trusted environment"), so the
// tile URL points here and this route adds the key server-side.
//
// Path: /api/os-tiles/<layer>/<z>/<x>/<y>.png
// e.g.  /api/os-tiles/Light_3857/19/258361/167163.png

/** The only layers we serve. OS publishes seven; these are the two that
 *  work in Web Mercator with a plain Leaflet setup. */
const ALLOWED_LAYERS = new Set(["Light_3857", "Road_3857", "Outdoor_3857"]);

/** OS Maps API serves zoom 7-20 in EPSG:3857. Below 7 does not exist;
 *  17-20 is Premium data. */
const MIN_ZOOM = 7;
const MAX_ZOOM = 20;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ tile: string[] }> },
): Promise<Response> {
  const key = process.env.OS_DATA_HUB_KEY;
  if (!key) {
    // No key configured — the client falls back to OpenStreetMap, so a
    // 404 here is the expected quiet path, not an error worth logging.
    return new Response("OS mapping not configured", { status: 404 });
  }

  // Gate to signed-in operators so a scraper can't spend the monthly
  // premium allowance. Same rule as the routing proxy.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("unauthorized", { status: 401 });

  const { tile } = await context.params;
  if (tile.length !== 4) return new Response("bad tile path", { status: 400 });

  const [layer, zRaw, xRaw, yRaw] = tile;
  if (!ALLOWED_LAYERS.has(layer)) {
    return new Response("unknown layer", { status: 400 });
  }

  const z = Number(zRaw);
  const x = Number(xRaw);
  const y = Number(yRaw.replace(/\.png$/i, ""));
  if (!Number.isInteger(z) || !Number.isInteger(x) || !Number.isInteger(y)) {
    return new Response("bad tile coords", { status: 400 });
  }
  if (z < MIN_ZOOM || z > MAX_ZOOM) {
    return new Response("zoom out of range", { status: 400 });
  }
  // Guard the x/y range for the zoom so a malformed request can't be
  // used to fan out arbitrary upstream calls.
  const limit = 2 ** z;
  if (x < 0 || x >= limit || y < 0 || y >= limit) {
    return new Response("tile out of range", { status: 400 });
  }

  const upstream = `https://api.os.uk/maps/raster/v1/zxy/${layer}/${z}/${x}/${y}.png?key=${encodeURIComponent(key)}`;

  let res: Response;
  try {
    res = await fetch(upstream, {
      // Tiles are immutable for a given z/x/y, so let the platform cache
      // them hard — every cache hit is a premium transaction not spent.
      next: { revalidate: 60 * 60 * 24 * 30 },
      headers: { Accept: "image/png" },
    });
  } catch {
    return new Response("upstream unreachable", { status: 502 });
  }

  if (!res.ok) {
    // 401/403 = bad or paused key; 404 = no data at this tile (common at
    // the edges of GB). Pass the status through so the client can fall
    // back rather than showing a broken-image square.
    return new Response(null, { status: res.status });
  }

  const body = await res.arrayBuffer();
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "image/png",
      // Immutable per coordinate — cache in the browser and at the edge.
      "Cache-Control": "public, max-age=86400, s-maxage=2592000, immutable",
    },
  });
}
