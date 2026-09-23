#!/bin/sh
set -e

# One osrm-routed per profile on loopback; Caddy fronts both on $PORT.
# --max-table-size: the desk's station sweep sends up to 100 origins in
# one table request; the default cap is 100 coordinates in total.
osrm-routed --algorithm mld --port 5000 --max-table-size 2000 /data/car/gm.osrm &
osrm-routed --algorithm mld --port 5001 --max-table-size 2000 /data/foot/gm.osrm &

exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
