"use client";

// Orders of the Day — a short notices strip under the live console.
// Condition-driven lines come from the same live weather + clock rules
// the sim runs; one rotating admin notice (seeded by the date) keeps the
// board feeling maintained without pretending to be real 999 data.

import { useEffect, useState } from "react";

const ADMIN_NOTICES = [
  "Hydrant inspection programme · Rochdale district — expect isolated hydrants out of service",
  "Multi-agency exercise scheduled — Trafford Park industrial estate, tabletop only",
  "BA compressor maintenance · Ashton — cylinders serviced off-site today",
  "Winter driving standards reminder — all blue-light drivers, section 4.2",
  "Fleet workshop backlog — spare pump appliances limited across the area",
  "PPE contamination audit underway — bag and tag after every job",
  "New PRI packs issued for high-rise premises — review before booking on",
  "Airwave mast maintenance · north of the county — expect brief dead spots",
];

type Wx = { windMph: number; precipMm: number; isDay: boolean };

function londonHour(d: Date): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hour12: false,
      timeZone: "Europe/London",
    }).format(d),
  );
}

export function DailyOrders() {
  const [wx, setWx] = useState<Wx | null>(null);
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    setToday(new Date());
    let cancelled = false;
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=53.48&longitude=-2.24" +
        "&current=precipitation,wind_speed_10m,is_day&wind_speed_unit=mph&timezone=UTC",
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (cancelled || !body?.current) return;
        setWx({
          windMph: Math.round(body.current.wind_speed_10m ?? 0),
          precipMm: body.current.precipitation ?? 0,
          isDay: body.current.is_day === 1,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!today) return null;

  const hour = londonHour(today);
  const night = hour >= 22 || hour < 6;

  const lines: { text: string; tone: "warn" | "info" }[] = [];
  if (wx && wx.windMph >= 45) {
    lines.push({
      text: "Wind warning in force — NWAA and NPAS operations restricted",
      tone: "warn",
    });
  }
  if (wx && wx.precipMm >= 2) {
    lines.push({
      text: "Surface water flood risk — expect extended travel times and pumping requests",
      tone: "warn",
    });
  }
  if (night) {
    lines.push({
      text: "Night operations — HEMS stood down, drone unit offline until first light",
      tone: "info",
    });
  }
  // Rotating admin notice, stable for the whole day.
  const dayOfYear = Math.floor(
    (today.getTime() - Date.UTC(today.getUTCFullYear(), 0, 0)) / 86_400_000,
  );
  lines.push({ text: ADMIN_NOTICES[dayOfYear % ADMIN_NOTICES.length], tone: "info" });

  const dateLabel = today
    .toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" })
    .toUpperCase();

  return (
    <div className="mt-4 rounded-sm border border-(--color-border) bg-(--color-surface)/90 backdrop-blur">
      <div className="flex items-center justify-between border-b border-(--color-border-subtle) px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
          Orders of the day
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)/70">
          {dateLabel}
        </span>
      </div>
      <ul className="space-y-1.5 px-4 py-2.5">
        {lines.map((l) => (
          <li key={l.text} className="flex items-start gap-2 font-mono text-[11px] leading-snug">
            <span
              className={
                "mt-1 size-1.5 shrink-0 rounded-full " +
                (l.tone === "warn" ? "dot-live bg-(--color-amber)" : "bg-(--color-text-dim)")
              }
            />
            <span className={l.tone === "warn" ? "text-(--color-amber)" : "text-(--color-text-muted)"}>
              {l.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
