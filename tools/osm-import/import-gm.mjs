#!/usr/bin/env node
// Load Greater Manchester's roads and fire hydrants from OpenStreetMap
// into Supabase, so the desk stops asking the public Overpass mirrors.
//
// Source: the Geofabrik county extract (already clipped to Greater
// Manchester), downloaded to a cache folder on first run and re-used
// after. Pass --pbf <file> to read a file you already have, --fresh to
// download again.
//
// Two passes over the file. Nodes come before ways in a PBF, so the first
// pass keeps the hydrant nodes (they carry their own tags and coordinates)
// and every way with a highway tag we want, remembering which node ids
// the ways need. The second pass picks up just those nodes' coordinates.
// That keeps memory to the road network rather than every node in the
// county.
//
// Writes go through the Supabase REST API with the service role key in
// batches. --dry-run parses and counts without writing anything.
//
// Usage: node import-gm.mjs [.env] [--pbf file] [--fresh] [--dry-run]
//                            [--roads-only | --hydrants-only]

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Writable } from "node:stream";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const parseOSM = require("osm-pbf-parser");

const EXTRACT_URL = "https://download.geofabrik.de/europe/united-kingdom/england/greater-manchester-latest.osm.pbf";

// Every highway class a reader might want. The API route narrows this to
// the drivable/parkable set itself; keeping footways and paths here costs
// little and lets hose and foot routing use them later.
const HIGHWAYS = new Set([
  "motorway", "trunk", "primary", "secondary", "tertiary", "unclassified", "residential",
  "service", "living_street", "motorway_link", "trunk_link", "primary_link", "secondary_link",
  "tertiary_link", "pedestrian", "footway", "path", "cycleway", "track", "steps", "bridleway",
]);

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const envPath = args.find((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1] === "--pbf")) ?? ".env";
const dryRun = flag("--dry-run");
const doRoads = !flag("--hydrants-only");
const doHydrants = !flag("--roads-only");

let SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
let SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, "utf8");
  SUPABASE_URL = /^(?:NEXT_PUBLIC_)?SUPABASE_URL=(\S+)/m.exec(env)?.[1] ?? SUPABASE_URL;
  SERVICE_KEY = /^SUPABASE_SERVICE_ROLE_KEY=(\S+)/m.exec(env)?.[1] ?? SERVICE_KEY;
}
if (!dryRun && (!SUPABASE_URL || !SERVICE_KEY)) {
  console.error("Need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (in .env or the environment). Use --dry-run to parse only.");
  process.exit(2);
}
// Accept the project URL however it was pasted: with or without the
// scheme, or just the project ref from the dashboard.
if (SUPABASE_URL) {
  SUPABASE_URL = SUPABASE_URL.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//.test(SUPABASE_URL)) SUPABASE_URL = `https://${SUPABASE_URL}`;
  if (!/\./.test(SUPABASE_URL.replace(/^https?:\/\//, ""))) SUPABASE_URL = `${SUPABASE_URL}.supabase.co`;
  try {
    new URL(SUPABASE_URL);
  } catch {
    console.error(`SUPABASE_URL is not a usable address (${SUPABASE_URL.length} chars). It should look like https://abcdefghijkl.supabase.co — the Project URL on Supabase → Project Settings → API.`);
    process.exit(2);
  }
}
if (SERVICE_KEY && !/^[A-Za-z0-9._-]{40,}$/.test(SERVICE_KEY.trim())) {
  console.error(`SUPABASE_SERVICE_ROLE_KEY does not look like a key (${SERVICE_KEY.length} chars). It is the long service_role secret on Supabase → Project Settings → API.`);
  process.exit(2);
}
SERVICE_KEY = SERVICE_KEY?.trim();

/** A cheap round trip before the download and the parse, so a wrong key
 *  or URL is reported in a second rather than after two minutes. */
async function checkConnection() {
  let res;
  try {
    res = await fetch(`${SUPABASE_URL}/rest/v1/osm_import_meta?select=kind&limit=1`, { headers: headers() });
  } catch (e) {
    const host = new URL(SUPABASE_URL).hostname;
    const ref = host.split(".")[0];
    const shape = /^[a-z]{20}$/.test(ref) ? "a 20-letter project ref, which is the right shape" : `"${ref.length} characters, ${/^[a-z0-9]+$/.test(ref) ? "letters and digits" : "with characters a project ref never has"}", which is not the shape of a project ref`;
    const cause = e.cause?.code ? ` (${e.cause.code})` : "";
    throw new Error(`Cannot reach ${host}${cause}. The host part is ${shape}. SUPABASE_URL must be the Project URL from Supabase → Project Settings → API, like https://abcdefghijklmnopqrst.supabase.co`);
  }
  if (res.status === 401 || res.status === 403) throw new Error("Supabase refused the key — check SUPABASE_SERVICE_ROLE_KEY is the service_role secret, not the anon key.");
  if (res.status === 404) throw new Error("Table osm_import_meta is missing — run supabase/migrations/019_osm_map_data.sql in the SQL editor first.");
  if (!res.ok) throw new Error(`Supabase answered ${res.status}: ${(await res.text()).slice(0, 200)}`);
  console.log(`Connected to ${SUPABASE_URL}`);
}

// ---- The extract ----------------------------------------------------------

async function extractPath() {
  const given = opt("--pbf");
  if (given) {
    if (!fs.existsSync(given)) throw new Error(`No such file: ${given}`);
    return given;
  }
  const dir = path.join(os.homedir(), ".cache", "twr-osm");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "greater-manchester-latest.osm.pbf");
  if (fs.existsSync(file) && !flag("--fresh")) {
    console.log(`Using cached extract ${file} (${(fs.statSync(file).size / 1e6).toFixed(0)} MB; --fresh to re-download)`);
    return file;
  }
  console.log(`Downloading ${EXTRACT_URL} …`);
  const res = await fetch(EXTRACT_URL);
  if (!res.ok || !res.body) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  const tmp = `${file}.part`;
  await pipeline(res.body, fs.createWriteStream(tmp));
  fs.renameSync(tmp, file);
  console.log(`Saved ${file} (${(fs.statSync(file).size / 1e6).toFixed(0)} MB)`);
  return file;
}

// ---- Parsing --------------------------------------------------------------

/** Run `onItem` over every element in the file, in file order. */
async function scan(file, onItem) {
  const sink = new Writable({
    objectMode: true,
    write(items, _enc, next) {
      for (const item of items) onItem(item);
      next();
    },
  });
  await pipeline(fs.createReadStream(file), parseOSM(), sink);
}

/** Pass 1: hydrant nodes, wanted ways, and the node ids those ways need. */
async function collectShapes(file) {
  const hydrants = [];
  const ways = [];
  const needed = new Set();
  let seen = 0;
  await scan(file, (item) => {
    seen += 1;
    if (item.type === "node") {
      const t = item.tags ?? {};
      if (t.emergency === "fire_hydrant" || t.amenity === "fire_hydrant") {
        hydrants.push({ id: `osm-${item.id}`, ref: t.ref ?? t["fire_hydrant:ref"] ?? null, lat: item.lat, lng: item.lon });
      }
      return;
    }
    if (item.type !== "way") return;
    const hw = item.tags?.highway;
    if (!hw || !HIGHWAYS.has(hw)) return;
    if (item.tags?.area === "yes") return;
    if (!item.refs || item.refs.length < 2) return;
    ways.push({ id: item.id, name: item.tags?.name ?? null, highway: hw, refs: item.refs });
    for (const r of item.refs) needed.add(r);
  });
  return { hydrants, ways, needed, seen };
}

/** Pass 2: coordinates for just the nodes the ways reference. */
async function collectCoords(file, needed) {
  const coords = new Map();
  await scan(file, (item) => {
    if (item.type === "node" && needed.has(item.id)) coords.set(item.id, [item.lat, item.lon]);
  });
  return coords;
}

function buildRoadRows(ways, coords) {
  const rows = [];
  let dropped = 0;
  for (const w of ways) {
    const pts = [];
    for (const r of w.refs) {
      const c = coords.get(r);
      if (c) pts.push(c);
    }
    if (pts.length < 2) {
      dropped += 1;
      continue;
    }
    const wkt = pts.map(([lat, lng]) => `${lng.toFixed(7)} ${lat.toFixed(7)}`).join(",");
    rows.push({ id: w.id, name: w.name, highway: w.highway, geom: `SRID=4326;LINESTRING(${wkt})` });
  }
  return { rows, dropped };
}

function buildHydrantRows(hydrants) {
  return hydrants.map((h) => ({
    id: h.id,
    ref: h.ref,
    source: "osm",
    geom: `SRID=4326;POINT(${h.lng.toFixed(7)} ${h.lat.toFixed(7)})`,
  }));
}

// ---- Writing --------------------------------------------------------------

const headers = () => ({
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
});

async function rest(method, pathAndQuery, body, prefer) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
      method,
      headers: { ...headers(), ...(prefer ? { Prefer: prefer } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.ok) return res;
    const text = await res.text();
    if (res.status >= 500 || res.status === 429) {
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      continue;
    }
    throw new Error(`${method} ${pathAndQuery} → ${res.status}: ${text.slice(0, 300)}`);
  }
  throw new Error(`${method} ${pathAndQuery} kept failing`);
}

// TRUNCATE through a service-role-only function: deleting every road
// row by row would run into the API's statement timeout.
async function clearTable(kind) {
  await rest("POST", "rpc/osm_import_reset", { p_kind: kind });
}

async function upsertRows(table, rows, batchSize, label) {
  let done = 0;
  const batches = [];
  for (let i = 0; i < rows.length; i += batchSize) batches.push(rows.slice(i, i + batchSize));
  const workers = Array.from({ length: 4 }, async () => {
    for (;;) {
      const batch = batches.shift();
      if (!batch) return;
      await rest("POST", table, batch, "resolution=merge-duplicates,return=minimal");
      done += batch.length;
      if (done % (batchSize * 20) < batchSize || done === rows.length) {
        process.stdout.write(`\r${label}: ${done.toLocaleString()} / ${rows.length.toLocaleString()}`);
      }
    }
  });
  await Promise.all(workers);
  process.stdout.write("\n");
}

async function recordMeta(kind, rowCount, source) {
  await rest("POST", "osm_import_meta", [{ kind, row_count: rowCount, source, imported_at: new Date().toISOString() }], "resolution=merge-duplicates,return=minimal");
}

// ---- Main -----------------------------------------------------------------

const t0 = Date.now();
if (!dryRun) await checkConnection();
const file = await extractPath();
const sourceLabel = `${path.basename(file)} · ${fs.statSync(file).mtime.toISOString().slice(0, 10)}`;

console.log("Pass 1: shapes …");
const { hydrants, ways, needed, seen } = await collectShapes(file);
console.log(`  ${seen.toLocaleString()} elements read · ${ways.length.toLocaleString()} ways kept · ${hydrants.length.toLocaleString()} hydrants · ${needed.size.toLocaleString()} nodes needed`);

let roadRows = [];
if (doRoads) {
  console.log("Pass 2: coordinates …");
  const coords = await collectCoords(file, needed);
  const built = buildRoadRows(ways, coords);
  roadRows = built.rows;
  console.log(`  ${roadRows.length.toLocaleString()} roads built${built.dropped ? ` · ${built.dropped} dropped (nodes outside the extract)` : ""}`);
}
const hydrantRows = doHydrants ? buildHydrantRows(hydrants) : [];

if (dryRun) {
  const sample = roadRows.find((r) => r.name) ?? roadRows[0];
  if (sample) console.log("  e.g.", { id: sample.id, name: sample.name, highway: sample.highway, geom: `${sample.geom.slice(0, 60)}…` });
  if (hydrantRows[0]) console.log("  e.g.", hydrantRows[0]);
  console.log(`Dry run — nothing written. ${((Date.now() - t0) / 1000).toFixed(0)} s.`);
  process.exit(0);
}

if (doHydrants) {
  console.log("Writing hydrants …");
  await clearTable("hydrants");
  await upsertRows("osm_hydrants", hydrantRows, 500, "  hydrants");
  await recordMeta("hydrants", hydrantRows.length, sourceLabel);
}
if (doRoads) {
  console.log("Writing roads …");
  await clearTable("roads");
  await upsertRows("osm_roads", roadRows, 400, "  roads");
  await recordMeta("roads", roadRows.length, sourceLabel);
}
console.log(`Done in ${((Date.now() - t0) / 1000).toFixed(0)} s.`);
