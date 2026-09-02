// Weather + time-of-day model for The Watch Room.
//
// A single WeatherState is rolled per shift (or when the patch changes) and
// surfaces across the dashboard. Conditions feed into several downstream
// systems:
//
//   • Blue-light ETAs scale by a rush-hour / quiet-hour factor
//   • HEMS availability — helicopters grounded at night unless the aircraft
//     has night-capability (most NWAA helicopters are day-only)
//   • BA cylinder duration shrinks in cold weather (increased consumption)
//   • Fire growth accelerates with strong wind
//   • Wildfire spread scales with wind + rain presence
//
// All values are rolled from realistic UK ranges for Greater Manchester so
// every shift plays slightly differently without authoring per-scenario.

export type WindDirection =
  | "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

export type Precipitation = "clear" | "drizzle" | "rain" | "heavy_rain" | "sleet" | "snow";

export type TimeBand =
  | "pre_dawn"   // 03:00–06:00
  | "morning"    // 06:00–09:00  (rush hour)
  | "daytime"    // 09:00–16:00
  | "evening"    // 16:00–19:00  (rush hour)
  | "night"      // 19:00–22:00
  | "overnight"; // 22:00–03:00

export type WeatherState = {
  /** Wall-clock hour (0–23) at shift start. Drives time-of-day effects. */
  hourOfDay: number;
  /** Compass wind direction (where it's coming FROM). */
  windDir: WindDirection;
  /** Wind speed in mph. Light < 10, Moderate 10–20, Strong 20+. */
  windMph: number;
  /** Air temperature °C. */
  tempC: number;
  /** Relative humidity %. */
  humidityPct: number;
  /** Current precipitation state. */
  precip: Precipitation;
  /** Plain-English one-line summary for the weather widget. */
  summary: string;
};

/** Roll a realistic Greater Manchester weather state. Seeded optionally
 *  so tests / replays can reproduce. `fixedHour` pins the shift-start
 *  hour (operator-chosen on the briefing screen) instead of rolling it. */
export function rollWeather(seed?: number, fixedHour?: number): WeatherState {
  const rng = mulberry32(seed ?? Math.floor(Date.now() / 1000));

  const rolledHour = Math.floor(rng() * 24);
  const hourOfDay =
    fixedHour !== undefined && fixedHour >= 0 && fixedHour <= 23
      ? Math.floor(fixedHour)
      : rolledHour;
  // Wind direction weighted toward prevailing south-westerlies.
  const dirBag: WindDirection[] = [
    "SW", "SW", "SW", "W", "W", "NW", "S", "NE", "N", "E", "SE",
  ];
  const windDir = dirBag[Math.floor(rng() * dirBag.length)];
  // Wind speed — biased low, occasional gusts.
  const windRoll = rng();
  const windMph =
    windRoll < 0.55
      ? Math.round(4 + rng() * 8)           // 4–12 mph  (calm → light)
      : windRoll < 0.9
        ? Math.round(12 + rng() * 12)       // 12–24 mph (moderate)
        : Math.round(24 + rng() * 14);      // 24–38 mph (strong)
  // Temperature — seasonal-ish range, Manchester maritime climate.
  const tempC = Math.round(((3 + rng() * 22) * 10)) / 10; // 3–25°C
  const humidityPct = Math.round(55 + rng() * 40); // 55–95%
  // Precipitation — Manchester-reality-adjusted.
  const precipRoll = rng();
  const precip: Precipitation =
    precipRoll < 0.55
      ? "clear"
      : precipRoll < 0.75
        ? "drizzle"
        : precipRoll < 0.9
          ? "rain"
          : precipRoll < 0.96
            ? "heavy_rain"
            : tempC < 4
              ? (precipRoll < 0.98 ? "sleet" : "snow")
              : "rain";

  const summary = buildSummary({ windDir, windMph, tempC, precip });
  return { hourOfDay, windDir, windMph, tempC, humidityPct, precip, summary };
}

function buildSummary(w: {
  windDir: WindDirection;
  windMph: number;
  tempC: number;
  precip: Precipitation;
}): string {
  const wind =
    w.windMph < 10
      ? `Light ${w.windDir}`
      : w.windMph < 20
        ? `Moderate ${w.windDir}`
        : `Strong ${w.windDir}`;
  const cond =
    w.precip === "clear"
      ? "clear"
      : w.precip === "drizzle"
        ? "drizzle"
        : w.precip === "rain"
          ? "rain"
          : w.precip === "heavy_rain"
            ? "heavy rain"
            : w.precip === "sleet"
              ? "sleet"
              : "snow";
  return `${cond}, ${w.tempC.toFixed(0)}°C, ${wind} ${w.windMph} mph`;
}

export function timeBandForHour(hour: number): TimeBand {
  if (hour >= 3 && hour < 6) return "pre_dawn";
  if (hour >= 6 && hour < 9) return "morning";
  if (hour >= 9 && hour < 16) return "daytime";
  if (hour >= 16 && hour < 19) return "evening";
  if (hour >= 19 && hour < 22) return "night";
  return "overnight";
}

export function timeBandLabel(band: TimeBand): string {
  return {
    pre_dawn: "Pre-dawn",
    morning: "Morning rush",
    daytime: "Daytime",
    evening: "Evening rush",
    night: "Night",
    overnight: "Overnight",
  }[band];
}

// ---- Effect multipliers ---------------------------------------------------

/** Blue-light ETA multiplier based on time of day. Rush hours + overnight
 *  HGV movements bump road times; quiet middle of the night is fastest. */
export function etaTrafficMultiplier(hour: number): number {
  const band = timeBandForHour(hour);
  switch (band) {
    case "morning":
      return 1.25;       // 07-09 peak
    case "evening":
      return 1.30;       // 16-19 worst in Manchester
    case "daytime":
      return 1.05;
    case "night":
      return 0.95;
    case "overnight":
      return 0.85;       // empty roads
    case "pre_dawn":
      return 0.9;
  }
}

/** Precipitation additive ETA modifier (0..0.15 slower). */
export function etaPrecipMultiplier(precip: Precipitation): number {
  switch (precip) {
    case "clear":
      return 1.0;
    case "drizzle":
      return 1.03;
    case "rain":
      return 1.08;
    case "heavy_rain":
      return 1.15;
    case "sleet":
      return 1.20;
    case "snow":
      return 1.35;
  }
}

/** HEMS availability — night grounds most UK air ambulances (NWAA
 *  Barton has night-capable rotorcraft since 2022, but we model the
 *  conservative case for scoring purposes). Returns false when HEMS
 *  cannot launch. */
export function hemsAvailable(w: WeatherState): boolean {
  const band = timeBandForHour(w.hourOfDay);
  if (band === "overnight" || band === "pre_dawn") return false;
  // Strong wind / heavy precip also ground most airframes.
  if (w.windMph >= 35) return false;
  if (w.precip === "heavy_rain" || w.precip === "sleet" || w.precip === "snow") {
    return false;
  }
  return true;
}

/** BA cylinder-duration multiplier. Cold weather raises consumption.
 *  1.0 at 15°C, 0.90 at 0°C, 0.83 at −5°C. */
export function baDurationMultiplier(tempC: number): number {
  if (tempC >= 15) return 1.0;
  if (tempC >= 5) return 0.95;
  if (tempC >= 0) return 0.9;
  return 0.83;
}

/** Fire-growth multiplier from wind speed. Applied to scene.fireSeat
 *  growthRateMpm when computing fireRadiusM in the sim. */
export function fireGrowthWindMultiplier(windMph: number): number {
  if (windMph < 10) return 1.0;
  if (windMph < 20) return 1.08;
  if (windMph < 30) return 1.18;
  return 1.3;
}

// ---- Small deterministic PRNG ---------------------------------------------

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Live weather
// ---------------------------------------------------------------------------

/** What /api/weather returns — Open-Meteo's current block, trimmed. */
export type LiveWeatherReading = {
  tempC: number;
  humidityPct: number;
  precipMm: number;
  weatherCode: number;
  windMph: number;
  windFromDeg: number;
  isDay: boolean;
  observedAt: string | null;
};

/** Compass point a wind is blowing FROM, from a bearing in degrees. */
export function windDirFromDegrees(deg: number): WindDirection {
  const dirs: WindDirection[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const idx = Math.round(((deg % 360) + 360) % 360 / 45) % 8;
  return dirs[idx];
}

/**
 * WMO weather code → the sim's precipitation state.
 *
 * Open-Meteo publishes the WMO 4677 code table. The sim only cares how
 * hard it is coming down and whether it is frozen, because that is what
 * drives fire behaviour, road speeds and whether the aircraft flies.
 */
export function precipFromWmoCode(code: number, precipMm: number): Precipitation {
  // 71-77 snow, 85-86 snow showers.
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  // 66-67 freezing rain, 56-57 freezing drizzle.
  if (code === 66 || code === 67 || code === 56 || code === 57) return "sleet";
  // 51-55 drizzle.
  if (code >= 51 && code <= 55) return "drizzle";
  // 95-99 thunderstorm, 82 violent showers, 65 heavy rain.
  if (code >= 95 || code === 82 || code === 65) return "heavy_rain";
  // 61-63 rain, 80-81 showers.
  if ((code >= 61 && code <= 63) || code === 80 || code === 81) {
    return precipMm >= 4 ? "heavy_rain" : "rain";
  }
  return "clear";
}

/**
 * Turn a live reading into the shift's weather state.
 *
 * `hourOfDay` stays the operator's chosen shift hour rather than the real
 * clock — they picked a night shift because they wanted to run one, and
 * the sim's darkness, HEMS grounding and day-crewed turnout all key off
 * it. Everything else is what is actually happening outside.
 */
export function weatherFromLive(
  live: LiveWeatherReading,
  hourOfDay: number,
): WeatherState {
  const windDir = windDirFromDegrees(live.windFromDeg);
  const windMph = Math.round(live.windMph);
  const tempC = Math.round(live.tempC * 10) / 10;
  const humidityPct = Math.round(live.humidityPct);
  const precip = precipFromWmoCode(live.weatherCode, live.precipMm);
  return {
    hourOfDay,
    windDir,
    windMph,
    tempC,
    humidityPct,
    precip,
    summary: buildSummary({ windDir, windMph, tempC, precip }),
  };
}
