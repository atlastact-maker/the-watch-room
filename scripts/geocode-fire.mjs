#!/usr/bin/env node
// Geocode UK postcodes via postcodes.io and merge lat/lng + admin info back into a fire-service stations JSON file.
// Usage: node scripts/geocode-fire.mjs data/research/fire/gmfrs_stations.json

import { readFile, writeFile } from "node:fs/promises";

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/geocode-fire.mjs <stations.json>");
  process.exit(1);
}

const raw = await readFile(file, "utf8");
const data = JSON.parse(raw);

// Collect every station with a postcode and no coords yet
const targets = [];
for (const area of data.areas) {
  for (const station of area.stations) {
    if (station.postcode && !station.coords) targets.push(station);
  }
}

if (targets.length === 0) {
  console.log("Nothing to geocode — every station with a postcode already has coords.");
  process.exit(0);
}

console.log(`Geocoding ${targets.length} postcodes via postcodes.io bulk endpoint...`);

const res = await fetch("https://api.postcodes.io/postcodes", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ postcodes: targets.map((s) => s.postcode) }),
});
if (!res.ok) {
  console.error(`postcodes.io returned ${res.status}: ${await res.text()}`);
  process.exit(1);
}
const body = await res.json();
if (body.status !== 200) {
  console.error(`postcodes.io status ${body.status}: ${JSON.stringify(body)}`);
  process.exit(1);
}

// Build a lookup keyed on the *queried* postcode so order doesn't matter
const byQuery = new Map();
for (const r of body.result) byQuery.set(r.query, r.result);

let hits = 0;
let misses = 0;
for (const station of targets) {
  const r = byQuery.get(station.postcode);
  if (!r) {
    console.warn(`  miss: ${station.id} ${station.name} (${station.postcode})`);
    misses++;
    continue;
  }
  station.coords = { lat: r.latitude, lng: r.longitude };
  station.admin = {
    district: r.admin_district,
    ward: r.admin_ward,
    parliamentary_constituency: r.parliamentary_constituency_2024 ?? r.parliamentary_constituency,
    police_force_area: r.pfa,
  };
  hits++;
}

await writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`Geocoded ${hits} stations. ${misses} misses. Wrote ${file}.`);
