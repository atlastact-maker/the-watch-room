"use client";

import type { WeatherState } from "@/lib/sim/weather";
import {
  hemsAvailable,
  timeBandForHour,
  timeBandLabel,
} from "@/lib/sim/weather";

/**
 * Compact weather chip shown in the dashboard header.
 *
 * Primary glyph is a single-line summary of conditions (wind, rain, temp).
 * Hover expands to show time band + operational effects the operator
 * needs to know: HEMS available? rush-hour ETA inflation? cold BA hit?
 */
export function WeatherChip({ weather }: { weather: WeatherState }) {
  const band = timeBandForHour(weather.hourOfDay);
  const hems = hemsAvailable(weather);
  const rushHour = band === "morning" || band === "evening";
  const cold = weather.tempC < 5;
  const strongWind = weather.windMph >= 20;

  const tone =
    strongWind || !hems
      ? "border-(--color-amber)/60 bg-(--color-amber)/10 text-(--color-amber)"
      : "border-(--color-border) bg-(--color-surface-raised) text-(--color-text-dim)";

  return (
    <div
      className={
        "group relative rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest transition-colors " +
        tone
      }
      title={weather.summary}
    >
      <span className="mr-1">{precipGlyph(weather.precip)}</span>
      <span className="mr-1 text-(--color-text)">{weather.tempC.toFixed(0)}°C</span>
      <span className="mr-1">{weather.windDir}</span>
      <span>{weather.windMph} mph</span>
      <span className="mx-1 text-(--color-border)">|</span>
      <span>
        {String(weather.hourOfDay).padStart(2, "0")}:00 · {timeBandLabel(band)}
      </span>

      {/* Hover panel — operational effects. */}
      <div className="pointer-events-none absolute right-0 top-full z-[1000] mt-1 w-72 rounded-sm border border-(--color-border) bg-(--color-surface) p-3 opacity-0 shadow-2xl shadow-black/70 transition-opacity group-hover:opacity-100">
        <div className="font-mono text-[9px] uppercase tracking-widest text-(--color-amber)">
          Weather · {weather.summary}
        </div>
        <ul className="mt-2 space-y-1 font-mono text-[10px] leading-snug">
          <EffectRow
            label="HEMS"
            value={hems ? "Available" : "Grounded"}
            good={hems}
          />
          <EffectRow
            label="Road ETAs"
            value={
              rushHour
                ? "Rush-hour — inflated"
                : band === "overnight" || band === "pre_dawn"
                  ? "Quiet — fastest"
                  : "Normal"
            }
            good={!rushHour}
          />
          <EffectRow
            label="BA consumption"
            value={cold ? "Elevated (cold)" : "Normal"}
            good={!cold}
          />
          <EffectRow
            label="Fire growth"
            value={strongWind ? "Wind-driven · faster spread" : "Normal"}
            good={!strongWind}
          />
        </ul>
      </div>
    </div>
  );
}

function EffectRow({
  label,
  value,
  good,
}: {
  label: string;
  value: string;
  good: boolean;
}) {
  return (
    <li className="flex items-baseline justify-between gap-3">
      <span className="text-(--color-text-dim)">{label}</span>
      <span className={good ? "text-(--color-ok)" : "text-(--color-amber)"}>
        {value}
      </span>
    </li>
  );
}

function precipGlyph(precip: WeatherState["precip"]): string {
  switch (precip) {
    case "clear":
      return "☀";
    case "drizzle":
      return "🌦";
    case "rain":
      return "🌧";
    case "heavy_rain":
      return "⛈";
    case "sleet":
      return "❄";
    case "snow":
      return "❄";
  }
}
