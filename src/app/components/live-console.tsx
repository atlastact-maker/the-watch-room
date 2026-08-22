"use client";

// Landing-page "NWRC console" — the real-time card next to the hero.
//
// Genuinely live:
//   • UTC clock + the sim's actual time band (rush hour / overnight…)
//   • Current Greater Manchester weather from Open-Meteo (keyless),
//     refreshed every 10 minutes
//   • Capability states derived from the SAME rules the sim runs:
//     HEMS grounded 22:00–06:00 local / strong wind / heavy rain,
//     drone team daylight-only, roads state from the time band
//
// Simulated-live (clearly game flavour):
//   • Unit availability drifting around a band-dependent baseline
//   • A procedural CAD feed stamped with the real clock
//
// No real 999 data is shown — there is no public feed, and faking one
// would cross the project's authenticity bar.

import { useEffect, useRef, useState } from "react";
import { timeBandForHour, timeBandLabel } from "@/lib/sim/weather";

type ServiceCounts = { stations: number; appliances: number };
type Props = {
  fire: ServiceCounts;
  ambulance: ServiceCounts;
  police: ServiceCounts;
};

type Wx = {
  tempC: number;
  windMph: number;
  windDir: string;
  precipMm: number;
  isDay: boolean;
};

const WIND_DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

function windDirLabel(deg: number): string {
  return WIND_DIRS[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
}

/** Local (Europe/London) hour — the sim's HEMS grounding window is
 *  22:00–06:00 local, not UTC. */
function londonHour(d: Date): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hour12: false,
      timeZone: "Europe/London",
    }).format(d),
  );
}

// Procedural CAD feed material — plausible GM call types + districts.
const CAD_TYPES: { text: string; service: "F" | "A" | "P" }[] = [
  { text: "AFA · commercial premises", service: "F" },
  { text: "Bin fire · open ground", service: "F" },
  { text: "Smoke issuing · derelict", service: "F" },
  { text: "Lift release · persons inside", service: "F" },
  { text: "ALS · chest pain", service: "A" },
  { text: "Cardiac arrest · CPR in progress", service: "A" },
  { text: "Fall · elderly · no injury", service: "A" },
  { text: "RTC · damage only", service: "P" },
  { text: "Concern for welfare", service: "P" },
  { text: "Disorder · town centre", service: "P" },
];
const CAD_PLACES = [
  "Rochdale OL16",
  "Bolton BL1",
  "Salford M6",
  "Wythenshawe M22",
  "Stockport SK1",
  "Bury BL9",
  "Oldham OL8",
  "Eccles M30",
  "Wigan WN1",
  "Ashton-under-Lyne OL6",
];

type CadLine = { id: number; time: string; text: string; service: "F" | "A" | "P" };

export function LiveConsole({ fire, ambulance, police }: Props) {
  // ---- clock ----
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ---- real weather (Open-Meteo, keyless) ----
  const [wx, setWx] = useState<Wx | null>(null);
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=53.48&longitude=-2.24" +
          "&current=temperature_2m,precipitation,wind_speed_10m,wind_direction_10m,is_day" +
          "&wind_speed_unit=mph&timezone=UTC",
      )
        .then((r) => (r.ok ? r.json() : null))
        .then((body) => {
          if (cancelled || !body?.current) return;
          setWx({
            tempC: body.current.temperature_2m,
            windMph: Math.round(body.current.wind_speed_10m),
            windDir: windDirLabel(body.current.wind_direction_10m ?? 0),
            precipMm: body.current.precipitation ?? 0,
            isDay: body.current.is_day === 1,
          });
        })
        .catch(() => {});
    load();
    const id = setInterval(load, 10 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // ---- availability drift (simulated) ----
  const totalAppliances = fire.appliances + ambulance.appliances + police.appliances;
  const [availPct, setAvailPct] = useState(86);
  useEffect(() => {
    if (!now) return;
    const band = timeBandForHour(now.getUTCHours());
    // Busy evenings run harder than the small hours.
    const baseline =
      band === "evening" || band === "night" ? 78 : band === "morning" ? 84 : 90;
    const id = setInterval(() => {
      setAvailPct((p) => {
        const drift = Math.random() < 0.5 ? -1 : 1;
        const next = p + drift;
        return Math.max(baseline - 6, Math.min(baseline + 5, next));
      });
    }, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now === null]);

  // ---- procedural CAD feed ----
  const [feed, setFeed] = useState<CadLine[]>([]);
  const idRef = useRef(0);
  useEffect(() => {
    const spawn = () => {
      const t = CAD_TYPES[Math.floor(Math.random() * CAD_TYPES.length)];
      const place = CAD_PLACES[Math.floor(Math.random() * CAD_PLACES.length)];
      const d = new Date();
      const time = [d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()]
        .map((n) => String(n).padStart(2, "0"))
        .join(":");
      idRef.current += 1;
      setFeed((prev) =>
        [{ id: idRef.current, time, text: `${t.text} · ${place}`, service: t.service }, ...prev].slice(0, 5),
      );
    };
    spawn();
    let timer: number;
    const loop = () => {
      timer = window.setTimeout(() => {
        spawn();
        loop();
      }, 6000 + Math.random() * 9000);
    };
    loop();
    return () => window.clearTimeout(timer);
  }, []);

  // ---- derived operational states (sim ruleset) ----
  const localHour = now ? londonHour(now) : 12;
  const band = now ? timeBandForHour(now.getUTCHours()) : "daytime";
  const heavyRain = (wx?.precipMm ?? 0) >= 2;
  const hemsGrounded =
    localHour >= 22 || localHour < 6 || (wx ? wx.windMph >= 35 || heavyRain : false);
  const dark = wx ? !wx.isDay : localHour >= 21 || localHour < 6;
  const rush = band === "morning" || band === "evening";

  const clock = now
    ? [now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()]
        .map((n) => String(n).padStart(2, "0"))
        .join(":")
    : "--:--:--";

  const available = Math.round((totalAppliances * availPct) / 100);

  return (
    <div className="rounded-sm border border-(--color-border) bg-(--color-surface)/90 backdrop-blur">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-(--color-border-subtle) px-4 py-2.5">
        <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
          <span className="dot-live size-1.5 rounded-full bg-(--color-critical)" />
          NWRC · Live picture
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
          Manchester
        </span>
      </div>

      {/* Clock + band */}
      <div className="flex items-baseline justify-between px-4 pt-3">
        <span className="font-mono text-3xl font-semibold tabular-nums tracking-tight text-(--color-text)">
          {clock}
          <span className="ml-2 text-sm text-(--color-text-dim)">UTC</span>
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-amber)">
          {timeBandLabel(band)}
        </span>
      </div>

      {/* Weather line — real */}
      <div className="px-4 pt-1.5 font-mono text-[11px] uppercase tracking-widest text-(--color-text-muted)">
        {wx ? (
          <>
            {wx.tempC.toFixed(0)}°C · {wx.windDir} {wx.windMph} mph ·{" "}
            {heavyRain ? "heavy rain" : wx.precipMm > 0.05 ? "rain" : "dry"} ·{" "}
            {wx.isDay ? "daylight" : "dark"}
            <span className="ml-2 text-[9px] text-(--color-text-dim)">live wx</span>
          </>
        ) : (
          <span className="text-(--color-text-dim)">WX link — acquiring…</span>
        )}
      </div>

      {/* Capability states — sim ruleset against the real conditions */}
      <ul className="mt-3 space-y-1 border-t border-(--color-border-subtle) px-4 py-2.5">
        <CapRow
          ok={!hemsGrounded}
          okText="HEMS · flying, weather permitting"
          warnText="HEMS · grounded — NWAA car covering by road"
        />
        <CapRow
          ok={!dark}
          okText="Drone team · daylight ops available"
          warnText="Drone team · no flying in darkness"
        />
        <CapRow
          ok
          okText={`NPAS 15 · available${(wx?.windMph ?? 0) >= 45 ? " — high winds, limited" : ", weather permitting"}`}
          warnText=""
        />
        <CapRow
          ok={!rush}
          okText={
            band === "overnight" || band === "pre_dawn"
              ? "Roads · quiet — fastest response times"
              : "Roads · normal running"
          }
          warnText="Roads · rush hour — blue-light runs slowed"
        />
      </ul>

      {/* Force status */}
      <div className="border-t border-(--color-border-subtle) px-4 py-2.5">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
            Force status
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-ok)">
            ~{available}/{totalAppliances} units on the run
          </span>
        </div>
        <ul className="mt-2 space-y-1.5">
          <ForceRow colour="#ef4444" label="Fire & Rescue" c={fire} />
          <ForceRow colour="#10b981" label="Ambulance" c={ambulance} />
          <ForceRow colour="#3b82f6" label="Police" c={police} />
        </ul>
      </div>

      {/* Procedural CAD feed */}
      <div className="border-t border-(--color-border-subtle) px-4 py-2.5">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
            Dispatch feed
          </span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)/70">
            simulation
          </span>
        </div>
        <ul className="mt-1.5 space-y-1 font-mono text-[11px] leading-snug">
          {feed.map((l) => (
            <li key={l.id} className="flex gap-2">
              <span className="shrink-0 tabular-nums text-(--color-text-dim)">{l.time}</span>
              <span
                className="shrink-0"
                style={{
                  color: l.service === "F" ? "#ef4444" : l.service === "A" ? "#10b981" : "#3b82f6",
                }}
              >
                ▌
              </span>
              <span className="truncate text-(--color-text-muted)">{l.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CapRow({
  ok,
  okText,
  warnText,
}: {
  ok: boolean;
  okText: string;
  warnText: string;
}) {
  return (
    <li className="flex items-center gap-2 font-mono text-[11px] leading-snug">
      <span
        className={
          "size-1.5 shrink-0 rounded-full " +
          (ok ? "bg-(--color-ok)" : "dot-live bg-(--color-amber)")
        }
      />
      <span className={ok ? "text-(--color-text-muted)" : "text-(--color-amber)"}>
        {ok ? okText : warnText}
      </span>
    </li>
  );
}

function ForceRow({
  colour,
  label,
  c,
}: {
  colour: string;
  label: string;
  c: ServiceCounts;
}) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-2 text-[13px] text-(--color-text)">
        <span className="inline-block h-2.5 w-2.5 rounded-[1px]" style={{ background: colour }} />
        {label}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
        {c.stations} stn · {c.appliances} units
      </span>
    </li>
  );
}
