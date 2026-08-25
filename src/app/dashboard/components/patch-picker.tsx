"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { AREAS } from "@/lib/sim/areas";
import type { AreaCode, ServiceCode } from "@/lib/sim/types";
import {
  ALL_SERVICES,
  scenarioCovered,
  scenarioServices,
} from "@/lib/sim/coverage";
import { INTENSITY_META, type ShiftIntensity } from "@/lib/sim/shift";
import { timeBandForHour } from "@/lib/sim/weather";
import { SCENARIOS } from "@/lib/sim/scenarios";
import type { StationWithAppliances } from "../page";

type Patch = Exclude<AreaCode, "ForceWide">;

// Leaflet touches window at import time — must be client-only.
const PatchBriefingMap = dynamic(
  () => import("./patch-briefing-map").then((m) => m.PatchBriefingMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
        Loading map…
      </div>
    ),
  },
);

type Props = {
  stationsByArea: Record<AreaCode, StationWithAppliances[]>;
  onSelect: (
    area: Patch,
    intensity: ShiftIntensity,
    startHour: number,
    coveredServices: ServiceCode[],
  ) => void;
};

const INTENSITY_ORDER: ShiftIntensity[] = ["quiet", "normal", "busy"];

const SEVERITY_COLOUR: Record<string, string> = {
  low: "#94a3b8",
  moderate: "#eab308",
  high: "#f97316",
  major: "#ef4444",
};

const SERVICE_COLOUR: Record<ServiceCode, string> = {
  Fire: "#ef4444",
  Ambulance: "#10b981",
  Police: "#3b82f6",
};

/** Availability hints for the chosen start hour. Mirrors the sim's
 *  actual rules where they exist (HEMS grounding hours, rush-hour ETA
 *  multipliers); the rest is operational flavour the shift will honour. */
function hintsForHour(hour: number): { tone: "ok" | "warn" | "dim"; text: string }[] {
  const band = timeBandForHour(hour);
  const heliGrounded = band === "overnight" || band === "pre_dawn"; // 22:00–06:00
  const dark = heliGrounded || band === "night"; // 19:00 onwards
  const rush = band === "morning" || band === "evening";
  const out: { tone: "ok" | "warn" | "dim"; text: string }[] = [];

  out.push(
    heliGrounded
      ? {
          tone: "warn",
          text: "HEMS grounded overnight — NWAA critical care car covers by road (doctor + CCP)",
        }
      : {
          tone: "ok",
          text: "HEMS flying (weather permitting) — you'll pick its landing zone on scene",
        },
  );
  out.push(
    dark
      ? { tone: "warn", text: "Drone team — no flying in the hours of darkness" }
      : { tone: "ok", text: "Drone team available in daylight" },
  );
  out.push({
    tone: "ok",
    text: "NPAS 21 (Barton) — day & night, weather permitting",
  });
  if (rush) {
    out.push({ tone: "warn", text: "Rush-hour traffic will slow blue-light runs" });
  } else if (band === "overnight" || band === "pre_dawn") {
    out.push({ tone: "ok", text: "Quiet roads — fastest response times of the day" });
  }
  out.push({
    tone: "dim",
    text: "Final availability locks in with the weather roll at shift start",
  });
  return out;
}

export function PatchPicker({ stationsByArea, onSelect }: Props) {
  const [patch, setPatch] = useState<Patch>("Southern");
  const [intensity, setIntensity] = useState<ShiftIntensity>("normal");
  const [startHour, setStartHour] = useState<number>(8);
  // Which services the operator is covering this shift. All on by
  // default; at least one must stay selected. Drives which scenarios
  // are available — a job is locked unless every service its PDA calls
  // for is covered.
  const [covered, setCovered] = useState<ServiceCode[]>([...ALL_SERVICES]);

  function toggleService(svc: ServiceCode) {
    setCovered((prev) =>
      prev.includes(svc)
        ? prev.length > 1
          ? prev.filter((x) => x !== svc)
          : prev // never allow zero services
        : [...ALL_SERVICES.filter((x) => prev.includes(x) || x === svc)],
    );
  }

  const stationsForPatch = [
    ...stationsByArea[patch],
    ...stationsByArea.ForceWide,
  ];
  const scenariosForPatch = SCENARIOS.filter((s) => s.patch === patch);
  const availableForPatch = scenariosForPatch.filter((s) =>
    scenarioCovered(s, covered),
  );

  const stationCounts = {
    Fire: stationsForPatch.filter((s) => s.service === "Fire").length,
    Ambulance: stationsForPatch.filter((s) => s.service === "Ambulance").length,
    Police: stationsForPatch.filter((s) => s.service === "Police").length,
  };

  const hints = hintsForHour(startHour);

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden p-6">
      <div className="mb-4 flex items-baseline justify-between gap-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-(--color-amber-dim)">
            Watch Room // Pre-shift Briefing
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Pick your patch
          </h1>
        </div>
        <p className="max-w-md text-right text-sm text-(--color-text-muted)">
          Fire, Ambulance and Police resources for the area you pick.{" "}
          <strong className="font-bold text-(--color-text)">
            The red boundary is the ground you&apos;ll cover this shift.
          </strong>
        </p>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)_380px] gap-6">
        {/* --- Left rail: patch list --- */}
        <ul className="space-y-3 overflow-y-auto">
          {AREAS.map((a) => {
            const selected = a.code === patch;
            const count = SCENARIOS.filter(
              (s) => s.patch === a.code && scenarioCovered(s, covered),
            ).length;
            return (
              <li key={a.code}>
                <button
                  type="button"
                  onClick={() => setPatch(a.code)}
                  className={
                    "block w-full rounded-sm border p-4 text-left transition-colors " +
                    (selected
                      ? "border-(--color-amber) bg-(--color-amber)/10"
                      : "border-(--color-border) bg-(--color-surface) hover:border-(--color-amber-dim)")
                  }
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={
                        "font-mono text-xs uppercase tracking-widest " +
                        (selected
                          ? "text-(--color-amber)"
                          : "text-(--color-text-dim)")
                      }
                    >
                      Area
                    </span>
                    <span className="font-mono text-xs uppercase tracking-widest text-(--color-text-dim)">
                      {count} scenario{count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight">
                    {a.label}
                  </h2>
                  <p className="mt-2 text-sm leading-snug text-(--color-text-muted)">
                    {a.blurb}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>

        {/* --- Centre: map --- */}
        <div className="relative min-h-0 overflow-hidden rounded-sm border border-(--color-border) bg-(--color-surface)">
          <PatchBriefingMap patch={patch} />
          <div className="pointer-events-none absolute left-3 top-3 z-[400] rounded-sm border border-(--color-border) bg-(--color-bg)/85 px-3 py-2 font-mono text-xs uppercase tracking-widest text-(--color-text-muted) backdrop-blur">
            <div className="flex items-center gap-4">
              <LegendDot colour={SERVICE_COLOUR.Fire} label={`Fire · ${stationCounts.Fire}`} />
              <LegendDot
                colour={SERVICE_COLOUR.Ambulance}
                label={`Amb · ${stationCounts.Ambulance}`}
              />
              <LegendDot
                colour={SERVICE_COLOUR.Police}
                label={`Police · ${stationCounts.Police}`}
              />
            </div>
          </div>
        </div>

        {/* --- Right rail: incidents + specialists + shift setup ---
            The rail is exactly viewport-bounded: incidents and the
            specialist list scroll INTERNALLY, so the page itself never
            becomes scrollable however much is shown. */}
        <div className="flex min-h-0 flex-col gap-3">
          <section className="flex-none rounded-sm border border-(--color-border) bg-(--color-surface) p-3">
            <div className="mb-2 flex items-baseline justify-between">
              <p className="font-mono text-xs uppercase tracking-widest text-(--color-amber-dim)">
                Possible incidents
              </p>
              <span className="font-mono text-xs uppercase tracking-widest text-(--color-text-dim)">
                {availableForPatch.length}
                {availableForPatch.length !== scenariosForPatch.length &&
                  ` of ${scenariosForPatch.length}`}
              </span>
            </div>
            {scenariosForPatch.length === 0 ? (
              <p className="text-sm text-(--color-text-muted)">
                No scenarios wired for this patch yet. The shift will run but
                no 999 calls will come in — pick another patch to see incidents.
              </p>
            ) : (
              <ol className="max-h-36 space-y-2 overflow-y-auto pr-1">
                {scenariosForPatch.map((s, i) => {
                  const isCovered = scenarioCovered(s, covered);
                  const missing = scenarioServices(s).filter(
                    (svc) => !covered.includes(svc),
                  );
                  return (
                  <li
                    key={s.id}
                    className={
                      "rounded-sm border border-(--color-border-subtle) bg-(--color-bg) p-2.5" +
                      (isCovered ? "" : " opacity-45")
                    }
                  >
                    <div className="flex items-baseline gap-3">
                      <span
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold text-black"
                        style={{
                          background:
                            SEVERITY_COLOUR[s.severity] ?? "#f59e0b",
                        }}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-snug text-(--color-text)">
                          {s.title}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
                          {s.severity} · {s.type.replace(/_/g, " ")}
                        </p>
                        {!isCovered && (
                          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-widest text-(--color-critical)">
                            Locked — needs {missing.join(" + ")} cover
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section className="flex-none rounded-sm border border-(--color-border) bg-(--color-surface) p-3">
            <div className="mb-2 flex items-baseline justify-between">
              <p className="font-mono text-xs uppercase tracking-widest text-(--color-amber-dim)">
                Service coverage
              </p>
              <span className="font-mono text-xs uppercase tracking-widest text-(--color-text-dim)">
                {covered.length} of 3
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {ALL_SERVICES.map((svc) => {
                const on = covered.includes(svc);
                return (
                  <button
                    key={svc}
                    type="button"
                    onClick={() => toggleService(svc)}
                    className={
                      "flex items-center justify-center gap-2 rounded-sm border px-2 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors " +
                      (on
                        ? "border-(--color-amber) bg-(--color-amber)/10 text-(--color-text)"
                        : "border-(--color-border) text-(--color-text-dim) opacity-60 hover:opacity-100")
                    }
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-[1px]"
                      style={{ background: SERVICE_COLOUR[svc] }}
                    />
                    {svc === "Ambulance" ? "Amb" : svc}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 font-mono text-[11px] leading-snug text-(--color-text-dim)">
              Pick the services you&apos;ll run this shift. A job only comes in
              if you cover every service it needs — locked incidents show what
              you&apos;re missing.
            </p>
          </section>

          <section className="flex-none rounded-sm border border-(--color-border) bg-(--color-surface) p-3">
            <p className="font-mono text-xs uppercase tracking-widest text-(--color-amber-dim)">
              Shift intensity
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {INTENSITY_ORDER.map((i) => {
                const meta = INTENSITY_META[i];
                const selected = i === intensity;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIntensity(i)}
                    className={
                      "rounded-sm border px-3 py-2 text-left transition-colors " +
                      (selected
                        ? "border-(--color-amber) bg-(--color-amber)/10 text-(--color-amber)"
                        : "border-(--color-border) text-(--color-text-muted) hover:border-(--color-amber-dim)")
                    }
                  >
                    <div className="font-mono text-xs uppercase tracking-widest">
                      {meta.label}
                    </div>
                    <div className="mt-1 text-xs leading-snug">
                      {meta.blurb}
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="mt-4 font-mono text-xs uppercase tracking-widest text-(--color-amber-dim)">
              Shift start
            </p>
            <select
              value={startHour}
              onChange={(e) => setStartHour(Number(e.target.value))}
              className="mt-2 h-10 w-full rounded-sm border border-(--color-border) bg-(--color-bg) px-3 font-mono text-sm text-(--color-text) outline-none focus:border-(--color-amber)"
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </select>
            <ul className="mt-3 space-y-1.5">
              {hints.map((h) => (
                <li
                  key={h.text}
                  className={
                    "flex items-start gap-2 font-mono text-[11px] leading-snug " +
                    (h.tone === "warn"
                      ? "text-(--color-critical)"
                      : h.tone === "ok"
                        ? "text-(--color-ok)"
                        : "text-(--color-text-dim)")
                  }
                >
                  <span className="mt-px shrink-0">▸</span>
                  <span>{h.text}</span>
                </li>
              ))}
            </ul>
          </section>

          <button
            type="button"
            onClick={() => onSelect(patch, intensity, startHour, covered)}
            className="mt-1 inline-flex h-14 w-full shrink-0 items-center justify-center rounded-sm bg-(--color-amber) font-mono text-base font-medium uppercase tracking-widest text-black transition-colors hover:bg-amber-400"
          >
            Begin Shift · {patch} · {String(startHour).padStart(2, "0")}:00 →
          </button>
        </div>
      </div>
    </div>
  );
}

function LegendDot({ colour, label }: { colour: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className="inline-block h-2.5 w-2.5 rounded-[1px]"
        style={{ background: colour }}
      />
      {label}
    </span>
  );
}
