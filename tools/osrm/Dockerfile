# The Watch Room's own router: OSRM with Greater Manchester loaded, car and
# foot profiles, behind Caddy on one port. Built by the "Build OSRM image"
# GitHub workflow and pushed to ghcr.io; deployed anywhere that runs a
# container (Railway, Fly.io, a small VPS). No quota, no third party.
#
# The car graph answers /route/v1/driving and /table/v1/driving; the foot
# graph answers /route/v1/foot (hose runs). /health answers 200.
#
# Nothing is apt-installed: the OSRM image tracks an old Debian whose
# mirrors move, so the proxy and curl come in as static binaries.

ARG EXTRACT_URL=https://download.geofabrik.de/europe/united-kingdom/england/greater-manchester-latest.osm.pbf

FROM curlimages/curl:latest AS fetch
ARG EXTRACT_URL
WORKDIR /home/curl_user
RUN curl -fsSL -o gm.osm.pbf "$EXTRACT_URL"

FROM ghcr.io/project-osrm/osrm-backend:v5.27.1

COPY --from=caddy:2 /usr/bin/caddy /usr/local/bin/caddy
COPY --from=curlimages/curl:latest /usr/bin/curl /usr/local/bin/curl

WORKDIR /data

# Car: extract, partition, customise (the MLD pipeline), then drop the
# source so the image stays small.
COPY --from=fetch /home/curl_user/gm.osm.pbf car/gm.osm.pbf
RUN osrm-extract -p /opt/car.lua car/gm.osm.pbf \
 && osrm-partition car/gm.osrm \
 && osrm-customize car/gm.osrm \
 && rm car/gm.osm.pbf

COPY --from=fetch /home/curl_user/gm.osm.pbf foot/gm.osm.pbf
RUN osrm-extract -p /opt/foot.lua foot/gm.osm.pbf \
 && osrm-partition foot/gm.osrm \
 && osrm-customize foot/gm.osrm \
 && rm foot/gm.osm.pbf

COPY Caddyfile /etc/caddy/Caddyfile
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV PORT=8080 XDG_DATA_HOME=/tmp XDG_CONFIG_HOME=/tmp
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s \
  CMD curl -fsS "http://127.0.0.1:${PORT}/health" || exit 1

ENTRYPOINT ["/entrypoint.sh"]
