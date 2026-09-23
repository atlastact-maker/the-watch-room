-- Greater Manchester roads and hydrants, held here instead of asked of the
-- public Overpass mirrors on every job. Run once (after 018), then load
-- the tables with tools/osm-import (see its README).
--
-- The two API routes (/api/osm-roads, /api/osm-hydrants) read these
-- first through the *_near functions and fall back to Overpass only when
-- the tables are empty or the functions are missing, so nothing breaks
-- before the import has run. The tables are written only by the import
-- script with the service role; no client ever writes them.

create extension if not exists postgis with schema extensions;

-- Drivable and walkable ways, one row per OSM way, clipped to the county
-- by the extract the import reads. `highway` is the raw OSM tag so a
-- reader can pick its own set (the roads route excludes motorway main
-- carriageways, for instance).
create table if not exists public.osm_roads (
  id bigint primary key,
  name text,
  highway text not null,
  geom extensions.geometry(LineString, 4326) not null
);
-- The *_near functions search in metres on geography, so the index is
-- on the geography cast; a plain geometry index would not be used.
create index if not exists osm_roads_geog_idx on public.osm_roads using gist ((geom::extensions.geography));
create index if not exists osm_roads_highway_idx on public.osm_roads (highway);

-- Fire hydrants. `source` says where a row came from ('osm' today; a
-- water-company or brigade dataset later gets its own value and wins on
-- the same spot). `ref` is the plate number where OSM has it.
create table if not exists public.osm_hydrants (
  id text primary key,
  ref text,
  source text not null default 'osm',
  geom extensions.geometry(Point, 4326) not null
);
create index if not exists osm_hydrants_geog_idx on public.osm_hydrants using gist ((geom::extensions.geography));

-- One row per import kind so the admin page can say when the data was
-- last refreshed and from what.
create table if not exists public.osm_import_meta (
  kind text primary key,
  row_count integer not null default 0,
  source text not null default '',
  imported_at timestamptz not null default now()
);

alter table public.osm_roads enable row level security;
alter table public.osm_hydrants enable row level security;
alter table public.osm_import_meta enable row level security;
-- No policies on purpose: the service role bypasses RLS for the import,
-- and everyone else reads through the security-definer functions below.

-- Roads within `radius_m` of a point, as [lat, lng] pairs in way order.
-- Capped at 2 km so a bad radius cannot pull half the county.
create or replace function public.roads_near(
  p_lat double precision,
  p_lng double precision,
  p_radius_m double precision,
  p_highways text[] default null
)
returns table (id bigint, name text, highway text, coords jsonb)
language sql stable security definer
set search_path = public, extensions
as $$
  select
    r.id,
    r.name,
    r.highway,
    (
      select jsonb_agg(jsonb_build_array(st_y(p.geom), st_x(p.geom)) order by p.path)
      from st_dumppoints(r.geom) p
    ) as coords
  from public.osm_roads r
  where st_dwithin(
          r.geom::geography,
          st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
          least(greatest(p_radius_m, 10), 2000)
        )
    and (p_highways is null or r.highway = any (p_highways))
  order by st_distance(r.geom, st_setsrid(st_makepoint(p_lng, p_lat), 4326))
  limit 800;
$$;

-- Hydrants within `radius_m` of a point, nearest first.
create or replace function public.hydrants_near(
  p_lat double precision,
  p_lng double precision,
  p_radius_m double precision
)
returns table (id text, ref text, source text, lat double precision, lng double precision)
language sql stable security definer
set search_path = public, extensions
as $$
  select h.id, h.ref, h.source, st_y(h.geom) as lat, st_x(h.geom) as lng
  from public.osm_hydrants h
  where st_dwithin(
          h.geom::geography,
          st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
          least(greatest(p_radius_m, 10), 2000)
        )
  order by st_distance(h.geom, st_setsrid(st_makepoint(p_lng, p_lat), 4326))
  limit 200;
$$;

-- The import empties a table before reloading it. A DELETE of every road
-- is slow enough to trip the API's statement timeout; TRUNCATE is not.
-- Service role only.
create or replace function public.osm_import_reset(p_kind text)
returns void
language plpgsql volatile security definer
set search_path = public
as $$
begin
  if p_kind = 'roads' then
    truncate table public.osm_roads;
  elsif p_kind = 'hydrants' then
    delete from public.osm_hydrants where source = 'osm';
  else
    raise exception 'unknown kind %', p_kind;
  end if;
end;
$$;

-- What the import has loaded, for the admin page.
create or replace function public.osm_map_status()
returns table (kind text, row_count integer, source text, imported_at timestamptz)
language sql stable security definer
set search_path = public
as $$
  select kind, row_count, source, imported_at from public.osm_import_meta order by kind;
$$;

revoke all on function public.roads_near(double precision, double precision, double precision, text[]) from public, anon;
revoke all on function public.hydrants_near(double precision, double precision, double precision) from public, anon;
revoke all on function public.osm_map_status() from public, anon;
revoke all on function public.osm_import_reset(text) from public, anon, authenticated;
grant execute on function public.osm_import_reset(text) to service_role;
grant execute on function public.roads_near(double precision, double precision, double precision, text[]) to authenticated, service_role;
grant execute on function public.hydrants_near(double precision, double precision, double precision) to authenticated, service_role;
grant execute on function public.osm_map_status() to authenticated, service_role;

notify pgrst, 'reload schema';
