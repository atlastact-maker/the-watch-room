"use client";

// The county plate on the operator console: Greater Manchester drawn from the
// same boundary bake the desk map uses, every real station on it as a
// service-coloured mark, and a few responders running real routes across
// it. A vector picture of the patch rather than a raster map, so it sits
// in the dark console without a beige tile in sight and needs nothing
// from outside the site to draw.

import { useEffect, useRef, useState } from "react";
import boundaries from "@/lib/sim/patch_boundaries.json";
import type { ServiceCode } from "@/lib/sim/types";
import { Icon } from "./icons";
import { SERVICE_TINT } from "./menu-types";
import styles from "./watch-menu.module.css";

export type PlateStation = { lat: number; lng: number; service: ServiceCode };

export { SERVICE_TINT };

const W = 800, H = 560, PAD = 34;

/** Web Mercator, scaled to put the county in the plate. */
const merc = (lat: number, lng: number): [number, number] => {
  const sin = Math.sin((lat * Math.PI) / 180);
  return [(lng + 180) / 360, 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)];
};
type Ring = [number, number][];
const RINGS: { area: string; ring: Ring }[] = Object.entries(boundaries as Record<string, number[][][]>).flatMap(([area, rings]) => rings.map((r) => ({ area, ring: r.map(([lat, lng]) => [lat, lng] as [number, number]) })));
const ALL = RINGS.flatMap((r) => r.ring).map(([lat, lng]) => merc(lat, lng));
const minX = Math.min(...ALL.map((p) => p[0])), maxX = Math.max(...ALL.map((p) => p[0]));
const minY = Math.min(...ALL.map((p) => p[1])), maxY = Math.max(...ALL.map((p) => p[1]));
const SCALE = Math.min((W - PAD * 2) / (maxX - minX), (H - PAD * 2) / (maxY - minY));
const OX = (W - (maxX - minX) * SCALE) / 2, OY = (H - (maxY - minY) * SCALE) / 2;
/** A point on the plate, from a lat/lng. */
export const plateXY = (lat: number, lng: number): [number, number] => {
  const [x, y] = merc(lat, lng);
  return [OX + (x - minX) * SCALE, OY + (y - minY) * SCALE];
};
const pathOf = (ring: Ring, step = 1): string => {
  const pts = ring.filter((_, i) => i % step === 0 || i === ring.length - 1).map(([lat, lng]) => plateXY(lat, lng));
  return `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}Z`;
};
const AREA_PATHS = RINGS.map((r) => ({ area: r.area, d: pathOf(r.ring, 2) }));
const AREA_LABEL: Record<string, [number, number]> = (() => {
  const out: Record<string, [number, number]> = {};
  for (const [area, rings] of Object.entries(boundaries as Record<string, number[][][]>)) {
    const main = rings[0];
    const pts = main.map(([lat, lng]) => plateXY(lat, lng));
    out[area] = [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
  }
  return out;
})();

/** Three responders crossing the county, one per service: the routes are
 *  asked for once from the desk's own router. */
const JOURNEYS: { service: ServiceCode; from: [number, number]; to: [number, number]; delay: number }[] = [
  { service: "Fire", from: [53.4755, -2.2454], to: [53.3905, -2.2608], delay: 0 },
  { service: "Ambulance", from: [53.5767, -2.4283], to: [53.4873, -2.3252], delay: 14 },
  { service: "Police", from: [53.4098, -2.1574], to: [53.4891, -2.0968], delay: 28 },
];

type Route = { path: [number, number][]; lengths: number[]; total: number; service: ServiceCode; delay: number };
function along(route: Route, progress: number): [number, number] {
  const distance = progress * route.total;
  let i = route.lengths.findIndex((l) => l >= distance);
  if (i < 0) i = route.lengths.length - 1;
  const start = i ? route.lengths[i - 1] : 0;
  const f = (distance - start) / (route.lengths[i] - start || 1);
  const a = route.path[i], b = route.path[i + 1] ?? a;
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}

export function CountyPlate({ stations, caption }: { stations: PlateStation[]; caption?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const movers = useRef<SVGGElement>(null);
  const [visible, setVisible] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);

  // The roads, once the plate is on screen. Without a router the plate
  // stands as the county and its stations; nothing else depends on it.
  useEffect(() => {
    if (!visible || routes.length) return;
    const controller = new AbortController();
    void Promise.all(
      JOURNEYS.map(async (j) => {
        const params = new URLSearchParams({ fromLat: String(j.from[0]), fromLng: String(j.from[1]), toLat: String(j.to[0]), toLng: String(j.to[1]) });
        const res = await fetch(`/api/route-eta?${params}`, { signal: controller.signal });
        if (!res.ok) return null;
        const data = (await res.json()) as { coords?: unknown };
        if (!Array.isArray(data.coords) || data.coords.length < 2) return null;
        const path = (data.coords as unknown[]).filter((p): p is [number, number] => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite)).map(([lat, lng]) => plateXY(lat, lng));
        if (path.length < 2) return null;
        let total = 0;
        const lengths = path.slice(1).map((p, i) => { total += Math.hypot(p[0] - path[i][0], p[1] - path[i][1]); return total; });
        return { path, lengths, total, service: j.service, delay: j.delay } satisfies Route;
      }),
    )
      .then((rs) => { if (!controller.signal.aborted) setRoutes(rs.filter((r): r is Route => r !== null)); })
      .catch(() => { /* The plate stands without the roads. */ });
    return () => controller.abort();
  }, [visible, routes.length]);

  useEffect(() => {
    if (!movers.current || !routes.length) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0, last = 0, elapsed = 6;
    const groups = [...movers.current.children];
    const draw = (t: number) => {
      routes.forEach((route, i) => {
        const phase = (t - route.delay + 48) % 48;
        const progress = phase < 4 ? 0 : phase < 24 ? (phase - 4) / 20 : phase < 34 ? 1 : 1 - (phase - 34) / 14;
        const g = groups[i];
        const [x, y] = along(route, progress);
        g.querySelector(".mover")?.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
        g.querySelector(".scene")?.setAttribute("opacity", phase < 34 ? "1" : "0");
        g.querySelector(".ring")?.setAttribute("r", String(9 + (phase % 2) * 5));
        g.querySelector(".ring")?.setAttribute("opacity", String(0.7 - (phase % 2) * 0.3));
      });
    };
    const tick = (now: number) => { if (last) elapsed += (now - last) / 1000; last = now; draw(elapsed); frame = requestAnimationFrame(tick); };
    const sync = () => { cancelAnimationFrame(frame); last = 0; draw(elapsed); if (visible && !paused && !media.matches && !document.hidden) frame = requestAnimationFrame(tick); };
    media.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => { cancelAnimationFrame(frame); media.removeEventListener("change", sync); document.removeEventListener("visibilitychange", sync); };
  }, [routes, visible, paused]);

  return (
    <div className={styles.plate} ref={root}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Greater Manchester: fire and rescue, ambulance and police stations, with live response routes">
        <defs>
          <pattern id="plate-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#1b2224" strokeWidth="1" /></pattern>
          <radialGradient id="plate-glow" cx="50%" cy="45%" r="60%"><stop offset="0" stopColor="#1a2426" /><stop offset="1" stopColor="#101315" /></radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#plate-glow)" />
        <rect width={W} height={H} fill="url(#plate-grid)" />
        {AREA_PATHS.map((a, i) => <path key={i} d={a.d} fill="#1a2325" stroke="#3a4a4c" strokeWidth="1.2" strokeLinejoin="round" />)}
        {AREA_PATHS.map((a, i) => <path key={`in-${i}`} d={a.d} fill="none" stroke="#e6b65c" strokeOpacity=".16" strokeWidth="5" strokeLinejoin="round" />)}
        {Object.entries(AREA_LABEL).map(([area, [x, y]]) => <text key={area} x={x} y={y} textAnchor="middle" className={styles.plateArea}>{area.toUpperCase()}</text>)}
        <g>
          {stations.map((s, i) => {
            const [x, y] = plateXY(s.lat, s.lng);
            return <g key={i}><circle cx={x} cy={y} r="5.5" fill={SERVICE_TINT[s.service]} opacity=".12" /><circle cx={x} cy={y} r="2.4" fill={SERVICE_TINT[s.service]} stroke="#101315" strokeWidth=".8" /></g>;
          })}
        </g>
        <g>{routes.map((r, i) => <path key={i} d={`M${r.path.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}`} fill="none" stroke={SERVICE_TINT[r.service]} strokeOpacity=".35" strokeWidth="1.5" strokeDasharray="3 4" />)}</g>
        <g ref={movers}>
          {routes.map((r, i) => {
            const end = r.path[r.path.length - 1];
            return (
              <g key={i}>
                <g className="scene" transform={`translate(${end[0].toFixed(1)} ${end[1].toFixed(1)})`}>
                  <circle className="ring" r="9" fill="none" stroke={SERVICE_TINT[r.service]} strokeWidth="1.5" opacity=".6" />
                  <path d="M0-5.5 5.5 0 0 5.5-5.5 0Z" fill="#101315" stroke={SERVICE_TINT[r.service]} strokeWidth="2" />
                </g>
                <g className="mover"><circle r="8" fill={SERVICE_TINT[r.service]} opacity=".18" /><circle r="3.6" fill={SERVICE_TINT[r.service]} stroke="#f4f4f6" strokeWidth="1.5" /></g>
              </g>
            );
          })}
        </g>
      </svg>
      <div className={styles.plateHead}>
        <span>County plate · live</span>
        <span className={styles.plateKey}>{(["Fire", "Ambulance", "Police"] as ServiceCode[]).map((s) => <i key={s}><b style={{ background: SERVICE_TINT[s] }} />{s === "Fire" ? "Fire & rescue" : s}</i>)}</span>
      </div>
      {caption && <div className={styles.plateCaption}>{caption}</div>}
      <button type="button" className={styles.platePause} onClick={() => setPaused((p) => !p)} aria-pressed={paused} aria-label={paused ? "Resume route animation" : "Pause route animation"}>{paused ? <Icon.play /> : <Icon.pause />}</button>
    </div>
  );
}
