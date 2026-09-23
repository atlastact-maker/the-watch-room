# The Watch Room — Greater Manchester map data import

Loads the county's roads and fire hydrants from OpenStreetMap into the
Supabase project, so the desk reads them from its own database instead of
the public Overpass mirrors. Any location in Greater Manchester, any number
of players, nothing external that can say no.

The source is the Geofabrik county extract, which is already clipped to
Greater Manchester. Nothing outside the county is loaded.

## One-time setup

1. Run `supabase/migrations/019_osm_map_data.sql` in the Supabase SQL editor
   (it enables PostGIS and creates the tables and functions).
2. In this folder:

   ```bash
   copy .env.example .env     # then fill in the URL and the service_role key
   npm install
   npm run import
   ```

   The first run downloads the extract (about 60 MB) to `~/.cache/twr-osm/`
   and re-uses it after. Parsing takes a minute or two; writing a few more.
   It prints the counts as it goes and records them in `osm_import_meta`,
   which the admin page's Scenarios tab shows as "Map data".

3. Nothing to deploy. The API routes already prefer the tables and fall back
   to Overpass only while they are empty.

## Refreshing

OpenStreetMap changes slowly. Re-run every few months:

```bash
node import-gm.mjs .env --fresh
```

`--roads-only` / `--hydrants-only` load one table; `--dry-run` parses and
counts without writing; `--pbf <file>` reads an extract you already have.

## What is loaded

| Table | Rows | What |
|---|---|---|
| `osm_roads` | one per OSM way | every `highway=*` way in the classes the sim uses, from motorways to footpaths, with name and class |
| `osm_hydrants` | one per node | every `emergency=fire_hydrant` (or the older `amenity=fire_hydrant`) node, with its plate `ref` where mapped, `source = 'osm'` |
| `osm_import_meta` | one per kind | row count, extract date, when it was loaded |

OSM's hydrant coverage in the UK is patchy: where none are mapped near a
job, the desk still synthesises kerbside hydrants on the nearest real roads,
now from `osm_roads`. A real hydrant dataset can be loaded into the same
table with its own `source` value later.
