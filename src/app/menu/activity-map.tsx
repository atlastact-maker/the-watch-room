"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./watch-menu.module.css";

const project = ([lng, lat]: number[]) => {
  const sin = Math.sin(lat * Math.PI / 180);
  return [(lng + 180) / 360 * 1048576, (.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * 1048576];
};
const centre = project([-2.254, 53.481]);
const xy = (coord: number[]) => { const p = project(coord); return [p[0] - centre[0] + 400, p[1] - centre[1] + 325]; };
const journeys = [
  { from: [-2.293, 53.486], to: [-2.202, 53.462], colour: "#e77225", delay: 0 },
  { from: [-2.232, 53.428], to: [-2.217, 53.516], colour: "#33883f", delay: 12 },
  { from: [-2.279, 53.527], to: [-2.311, 53.451], colour: "#1879d1", delay: 24 },
];
const tiles: { x: number; y: number; left: number; top: number }[] = [];
for (let x = Math.floor((centre[0] - 400) / 256); x <= Math.floor((centre[0] + 400) / 256); x++)
  for (let y = Math.floor((centre[1] - 325) / 256); y <= Math.floor((centre[1] + 325) / 256); y++)
    tiles.push({ x, y, left: x * 256 - centre[0] + 400, top: y * 256 - centre[1] + 325 });

type Route = { path: number[][]; lengths: number[]; total: number; colour: string; delay: number };
function position(route: Route, progress: number) {
  const distance = progress * route.total;
  let index = route.lengths.findIndex(length => length >= distance);
  if (index < 0) index = route.lengths.length - 1;
  const start = index ? route.lengths[index - 1] : 0;
  const fraction = (distance - start) / (route.lengths[index] - start || 1);
  const a = route.path[index], b = route.path[index + 1];
  return [a[0] + (b[0] - a[0]) * fraction, a[1] + (b[1] - a[1]) * fraction];
}

export function ActivityMap() {
  const root = useRef<HTMLDivElement>(null);
  const markers = useRef<SVGGElement>(null);
  const [visible, setVisible] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || routes.length) return;
    const controller = new AbortController();
    void Promise.all(journeys.map(async journey => {
      const params = new URLSearchParams({ fromLat: String(journey.from[1]), fromLng: String(journey.from[0]), toLat: String(journey.to[1]), toLng: String(journey.to[0]) });
      const response = await fetch(`/api/route-eta?${params}`, { signal: controller.signal });
      if (!response.ok) return null;
      const data = await response.json();
      if (!Array.isArray(data.coords) || data.coords.length < 2) return null;
      const path = data.coords.filter((p: unknown) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite)).map(([lat, lng]: number[]) => xy([lng, lat]));
      if (path.length < 2) return null;
      let total = 0;
      const lengths = path.slice(1).map((p: number[], i: number) => { total += Math.hypot(p[0] - path[i][0], p[1] - path[i][1]); return total; });
      return { path, lengths, total, colour: journey.colour, delay: journey.delay };
    })).then(result => { if (!controller.signal.aborted) setRoutes(result.filter((route): route is Route => route !== null)); }).catch(() => { /* The real map remains usable when routing is unavailable. */ });
    return () => controller.abort();
  }, [visible, routes.length]);

  useEffect(() => {
    if (!markers.current || !routes.length) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0, last = 0, elapsed = 8;
    const groups = [...markers.current.children];
    function draw(time: number) {
      routes.forEach((route, i) => {
        const phase = (time - route.delay + 48) % 48;
        const progress = phase < 4 ? 0 : phase < 23 ? (phase - 4) / 19 : phase < 32 ? 1 : 1 - (phase - 32) / 16;
        const group = groups[i];
        group.querySelector(".vehicle")?.setAttribute("transform", `translate(${position(route, progress)})`);
        group.querySelector(".support")?.setAttribute("transform", `translate(${position(route, 1 - ((phase + 12) % 48) / 48)})`);
        group.querySelector(".incident")?.setAttribute("opacity", phase < 32 ? "1" : "0");
        group.querySelector(".ring")?.setAttribute("r", String(12 + phase % 3 * 4));
      });
    }
    function tick(now: number) { if (last) elapsed += (now - last) / 1000; last = now; draw(elapsed); frame = requestAnimationFrame(tick); }
    function sync() { cancelAnimationFrame(frame); last = 0; draw(elapsed); if (visible && !paused && !media.matches && !document.hidden) frame = requestAnimationFrame(tick); }
    media.addEventListener("change", sync); document.addEventListener("visibilitychange", sync); sync();
    return () => { cancelAnimationFrame(frame); media.removeEventListener("change", sync); document.removeEventListener("visibilitychange", sync); };
  }, [routes, visible, paused]);

  return <div className={styles.map} ref={root}>
    {failed ? <p className={styles.mapError}>Map unavailable. Your watch is still ready to start.</p> : <svg viewBox="0 0 800 650" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Manchester map with simulated emergency resources">
      {visible && tiles.map(tile => <image key={`${tile.x}/${tile.y}`} x={tile.left} y={tile.top} width="256" height="256" href={`https://tile.openstreetmap.org/12/${tile.x}/${tile.y}.png`} onError={() => setFailed(true)} />)}
      <g ref={markers}>{routes.map((route, i) => <g key={i}>
        <g className="incident" transform={`translate(${route.path.at(-1)})`}><circle className="ring" r="17" stroke={route.colour} fill="none" strokeWidth="2" opacity=".65" /><path d="M0-8L8 0L0 8L-8 0Z" fill="white" stroke={route.colour} strokeWidth="2.5" /></g>
        <g className="vehicle"><circle r="10" fill={route.colour} opacity=".2" /><circle r="5" fill={route.colour} stroke="white" strokeWidth="2" /></g>
        <g className="support"><circle r="4" fill={route.colour} stroke="white" strokeWidth="1.5" /></g>
      </g>)}</g>
    </svg>}
    <button type="button" className={styles.mapPause} onClick={() => setPaused(p => !p)} aria-pressed={paused} aria-label={paused ? "Play map animation" : "Pause map animation"}>{paused ? "▶" : "Ⅱ"}</button>
    <div className={styles.mapCredit}>© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a></div>
  </div>;
}
