# The Watch Room — own routing server (OSRM)

A container running OSRM with Greater Manchester loaded, two profiles
(car and foot) behind Caddy on one port. Every ETA, route line, redirect,
patrol leg and hose run can be answered here in a few milliseconds with no
quota. The desk uses it first when `OSRM_URL` is set, and still falls back
to OpenRouteService and the public OSRM demo server when it is not.

## How it gets built

The GitHub workflow **Build OSRM image** (`.github/workflows/build-osrm.yml`)
builds this folder and pushes `ghcr.io/atlastact-maker/twr-osrm:latest`.
Run it from the Actions tab; it also runs monthly so the roads stay fresh.
The first build takes about ten minutes.

Once, after the first build: on GitHub go to your profile → Packages →
`twr-osrm` → Package settings → Change visibility → **Public**. It is only
map data, and a public image is one the hosts below can pull without
credentials.

## Hosting it (pick one)

**Railway** (browser only, about $5 a month):
1. railway.com → New Project → **Deploy a Docker image** → `ghcr.io/atlastact-maker/twr-osrm:latest`.
2. Once it is running: Settings → Networking → **Generate Domain**. Railway
   sets `PORT` itself; the container honours it.
3. Copy the domain, e.g. `https://twr-osrm-production.up.railway.app`.

**Fly.io** (needs the `fly` CLI): in this folder, `fly launch --image ghcr.io/atlastact-maker/twr-osrm:latest --vm-memory 1024`, then `fly deploy`.

**Any VPS with Docker**: `docker run -d -p 80:8080 --restart unless-stopped ghcr.io/atlastact-maker/twr-osrm:latest`.

The graphs need about 700 MB of RAM for both profiles. Give the machine 1 GB.

## Telling the app about it

Add an environment variable to the deployment (Vercel → the project →
Settings → Environment Variables) named `OSRM_URL` with the server's
address, then redeploy. The admin page's Scenarios tab shows "Routing:
own OSRM at … · reachable" once it is live.

Test it in a browser:
`https://<your-host>/route/v1/driving/-2.2426,53.4808;-2.2100,53.4700?overview=false`
should answer JSON with `"code":"Ok"`.

## Refreshing

The monthly workflow rebuilds the image. Railway redeploys a `:latest`
image when you click **Redeploy** on the service (or turn on the
"check for image updates" option). Fly: `fly deploy` again.
