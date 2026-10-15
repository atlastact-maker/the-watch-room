"use client";

// THE RESOURCING PAGE. The second page of the briefing: what the county
// actually has at the start of the shift, station by station — the
// appliances in the bays and available, the ones still committed to a
// job that started before the operator sat down and when they clear,
// and the ones off the run and why. The mobilising screen shows the
// same bays once the shift is running; this is the look before the
// first call, so nobody is surprised to find a pump missing.

import type { ServiceCode, StatusCode } from "@/lib/sim/types";
import { STATUS_LABELS } from "@/lib/sim/types";
import { INTENSITY_META, type PreShiftState, type ShiftIntensity } from "@/lib/sim/shift";
import type { StationWithAppliances } from "../page";

type Kind = "available" | "committed" | "off";

const SERVICE_ORDER: ServiceCode[] = ["Fire", "Ambulance", "Police"];
const SERVICE_COLOUR: Record<ServiceCode, string> = { Fire: "#ef4444", Ambulance: "#10b981", Police: "#3b82f6" };
const AREA_LABEL: Record<string, string> = { Southern: "South", Eastern: "East", Western: "West", ForceWide: "Force-wide" };
const AREA_ORDER: Record<string, number> = { Southern: 0, Eastern: 1, Western: 2, ForceWide: 3 };
const KIND_LABEL: Record<Kind, string> = { available: "Available", committed: "Committed", off: "Off the run" };
const KIND_CLASS: Record<Kind, string> = {
  available: "border-(--color-ok)/50 bg-(--color-ok)/10 text-(--color-text)",
  committed: "border-(--color-amber)/60 bg-(--color-amber)/10 text-(--color-amber)",
  off: "border-(--color-critical)/50 bg-(--color-critical)/10 text-(--color-critical) line-through decoration-(--color-critical)/70",
};
const DOT_CLASS: Record<Kind, string> = { available: "bg-(--color-ok)", committed: "bg-(--color-amber)", off: "bg-(--color-critical)" };

type Props = {
  stations: StationWithAppliances[];
  intensity: ShiftIntensity;
  startHour: number;
  covered: ServiceCode[];
  /** The roll for this shift, by appliance id; absent means available. */
  roll: Record<string, PreShiftState>;
  /** When the roll was made — the committed units' return times count from it. */
  rolledAt: number;
  onBack: () => void;
  onBegin: () => void;
};

function kindOf(ps: PreShiftState | undefined): Kind {
  if (!ps) return "available";
  return ps.status === 8 ? "off" : "committed";
}

function minutesFrom(at: number | undefined, from: number): number | null {
  if (!at) return null;
  return Math.max(1, Math.round((at - from) / 60_000));
}

export function ResourcingBrief({ stations, intensity, startHour, covered, roll, rolledAt, onBack, onBegin }: Props) {
  const services = SERVICE_ORDER.filter((s) => covered.includes(s));
  const shown = stations
    .filter((s) => services.includes(s.service) && s.appliances.length > 0)
    .slice()
    .sort((a, b) => SERVICE_ORDER.indexOf(a.service) - SERVICE_ORDER.indexOf(b.service) || (AREA_ORDER[a.area] ?? 9) - (AREA_ORDER[b.area] ?? 9) || a.name.localeCompare(b.name));
  const all = shown.flatMap((s) => s.appliances);
  const count = (svc: ServiceCode | null, kind: Kind) => all.filter((a) => (svc === null || a.service === svc) && kindOf(roll[a.id]) === kind).length;
  const meta = INTENSITY_META[intensity];
  const hh = (h: number) => `${String(((h % 24) + 24) % 24).padStart(2, "0")}:00`;

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden p-6">
      <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-6">
        <div className="justify-self-start">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-sm border border-(--color-border) px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim) transition-colors hover:border-(--color-amber-dim) hover:text-(--color-amber)"
          >
            ← Change the briefing
          </button>
        </div>
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-(--color-amber-dim)">Watch Room // Pre-shift Briefing · Resourcing</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">What you have at {hh(startHour)}</h1>
          <p className="mt-1 text-sm text-(--color-text-muted)">
            <strong className="font-bold text-(--color-text)">{meta.label}.</strong> {meta.blurb} The committed units clear on their own; the off-run ones stay off.
          </p>
        </div>
        <div aria-hidden />
      </div>

      {/* The strip: every covered service, its count and its split. */}
      <div className="mb-4 grid flex-none gap-3" style={{ gridTemplateColumns: `repeat(${services.length}, minmax(0, 1fr))` }}>
        {services.map((svc) => {
          const total = all.filter((a) => a.service === svc).length;
          const av = count(svc, "available"), co = count(svc, "committed"), off = count(svc, "off");
          const pct = (n: number) => (total ? `${(n / total) * 100}%` : "0%");
          return (
            <section key={svc} className="rounded-sm border border-(--color-border) bg-(--color-surface) p-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-(--color-text)">
                  <span className="inline-block h-2.5 w-2.5 rounded-[1px]" style={{ background: SERVICE_COLOUR[svc] }} />
                  {svc}
                </p>
                <p className="font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
                  {av} of {total} available
                </p>
              </div>
              <div className="mt-2 flex h-2 w-full overflow-hidden rounded-[1px] bg-(--color-border-subtle)">
                <span className="bg-(--color-ok)" style={{ width: pct(av) }} />
                <span className="bg-(--color-amber)" style={{ width: pct(co) }} />
                <span className="bg-(--color-critical)" style={{ width: pct(off) }} />
              </div>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
                <span className="text-(--color-ok)">{av} available</span> · <span className="text-(--color-amber)">{co} committed</span> · <span className="text-(--color-critical)">{off} off the run</span>
              </p>
            </section>
          );
        })}
      </div>

      {/* The bays: a card per station, the appliances as chips, the
          exceptions written out underneath. Scrolls inside the page. */}
      <div className="min-h-0 flex-1 overflow-y-auto rounded-sm border border-(--color-border) bg-(--color-bg)/40 p-3">
        {services.map((svc) => (
          <section key={svc} className="mb-5 last:mb-0">
            <h2 className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-(--color-text-dim)">
              <span className="inline-block h-2 w-2 rounded-[1px]" style={{ background: SERVICE_COLOUR[svc] }} />
              {svc} · {shown.filter((s) => s.service === svc).length} stations
            </h2>
            <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))" }}>
              {shown.filter((s) => s.service === svc).map((s) => {
                const kinds = s.appliances.map((a) => ({ a, ps: roll[a.id], kind: kindOf(roll[a.id]) }));
                const inBay = kinds.filter((k) => k.kind === "available").length;
                const exceptions = kinds.filter((k) => k.kind !== "available");
                const empty = inBay === 0;
                return (
                  <article key={s.id} className={`rounded-sm border p-2.5 ${empty ? "border-(--color-critical)/50 bg-(--color-critical)/5" : "border-(--color-border) bg-(--color-surface)"}`}>
                    <header className="flex items-baseline justify-between gap-2">
                      <span className="min-w-0 truncate">
                        <b className="font-mono text-xs text-(--color-text)">{s.id}</b>
                        <span className="ml-2 text-[12px] text-(--color-text-muted)">{s.name}</span>
                      </span>
                      <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">{AREA_LABEL[s.area] ?? s.area}</span>
                    </header>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {kinds.map(({ a, kind }) => (
                        <span key={a.id} className={`inline-flex items-baseline gap-1.5 rounded-[2px] border px-1.5 py-0.5 font-mono text-[11px] ${KIND_CLASS[kind]}`} title={`${a.callsign} · ${a.typeName} · ${KIND_LABEL[kind]}`}>
                          <b>{a.callsign}</b>
                          <small className="text-[9px] uppercase tracking-wider opacity-80">{a.type}</small>
                        </span>
                      ))}
                    </div>
                    {exceptions.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {exceptions.map(({ a, ps, kind }) => {
                          const mins = minutesFrom(ps?.availableAt, rolledAt);
                          return (
                            <li key={a.id} className="flex items-start gap-1.5 text-[11px] leading-snug text-(--color-text-muted)">
                              <span className={`mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${DOT_CLASS[kind]}`} />
                              <span>
                                <b className="font-mono text-(--color-text)">{a.callsign}</b> · {STATUS_LABELS[(ps?.status ?? 7) as StatusCode]}
                                {ps?.reason ? ` — ${ps.reason}` : ""}
                                {mins !== null ? ` · back in ~${mins} min` : ""}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    <p className={`mt-2 font-mono text-[10px] uppercase tracking-widest ${empty ? "text-(--color-critical)" : "text-(--color-text-dim)"}`}>
                      {empty ? "Station empty" : `${inBay} of ${s.appliances.length} in the bay`}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-4 flex flex-none items-center justify-between gap-4">
        <p className="font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
          <span className="text-(--color-ok)">■</span> available · <span className="text-(--color-amber)">■</span> committed, clears during the shift · <span className="text-(--color-critical)">■</span> off the run all shift
        </p>
        <button
          type="button"
          onClick={onBegin}
          className="inline-flex h-14 shrink-0 items-center justify-center rounded-sm bg-(--color-amber) px-8 font-mono text-base font-medium uppercase tracking-widest text-black transition-colors hover:bg-amber-400"
        >
          Begin Shift · {hh(startHour)} →
        </button>
      </div>
    </div>
  );
}
