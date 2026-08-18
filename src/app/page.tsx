import Link from "next/link";
import { LandingBackdrop } from "./components/landing-backdrop";

export default function LandingPage() {
  const now = new Date();
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const mm = String(now.getUTCMinutes()).padStart(2, "0");

  return (
    <>
    <LandingBackdrop />
    <div className="relative z-10 flex flex-1 flex-col">
      {/* status bar */}
      <header className="border-b border-(--color-border-subtle)">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
          <div className="flex items-center gap-2">
            <span className="dot-live size-1.5 rounded-full bg-(--color-amber)" />
            <span>The Watch Room</span>
            <span className="text-(--color-border)">|</span>
            <span className="text-(--color-text-dim)">Multi-Agency Operator</span>
            <span className="text-(--color-border)">|</span>
            <span>UTC {hh}:{mm}</span>
          </div>
          <div className="hidden sm:block">Build 0.1 · Pre-alpha</div>
        </div>
      </header>

      {/* hero */}
      <main className="flex flex-1 items-center">
        <div className="mx-auto grid w-full max-w-6xl gap-16 px-6 py-20 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
          <section>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-(--color-amber-dim)">
              Emergency Services Incident Manager
            </p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              The Watch Room
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-(--color-text-muted)">
              One operator. Three services. You command Fire, Ambulance and
              Police from a single unified seat — deciding who rolls, where,
              and how fast across Greater Manchester and Lancashire.
            </p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-(--color-text-dim)">
              Dwelling fires with persons reported. Motorway RTCs with
              entrapment. Chemical leaks, wildfires on the moors, mass
              casualty events, water rescues in full spate. Real stations.
              Real appliances. Real procedures. Live ticking clock.
            </p>
            <p className="mt-6 font-mono text-base text-(--color-amber)">
              Hesitation costs minutes. Minutes cost lives.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-sm bg-(--color-amber) px-6 font-mono text-sm font-medium uppercase tracking-widest text-black transition-colors hover:bg-amber-400"
              >
                Begin Shift
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-sm border border-(--color-border) px-6 font-mono text-sm font-medium uppercase tracking-widest text-(--color-text) transition-colors hover:border-(--color-amber-dim) hover:text-(--color-amber)"
              >
                Log in
              </Link>
            </div>

            <dl className="mt-14 grid grid-cols-2 gap-6 border-t border-(--color-border-subtle) pt-8 text-sm sm:grid-cols-4">
              <Stat k="Region" v="Greater Manchester · Lancashire" />
              <Stat k="Agencies" v="Fire & Rescue · Ambulance · Police" />
              <Stat k="Procedures" v="METHANE · JESIP · NDM" />
              <Stat k="Time model" v="Real-time, ticking" />
            </dl>
          </section>

          {/* services panel */}
          <aside className="flex flex-col gap-4">
            <div className="rounded-sm border border-(--color-border) bg-(--color-surface) p-5">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
                  Unified Operator
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-(--color-ok)/40 bg-(--color-ok)/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-(--color-ok)">
                  <span className="dot-live size-1.5 rounded-full bg-(--color-ok)" />
                  All Services Live
                </span>
              </div>
              <ul className="mt-4 divide-y divide-(--color-border-subtle)">
                <ServiceRow
                  service="fire"
                  name="Fire and Rescue Service"
                  detail="40 stations · WrL, TL, HART, TRU, HVP, Wildfire"
                />
                <ServiceRow
                  service="ambulance"
                  name="Ambulance Service"
                  detail="DCA, RRV, HART, HEMS, Critical Care Car"
                />
                <ServiceRow
                  service="police"
                  name="Police Service"
                  detail="Response, ARV, NPAS · coming online"
                />
              </ul>
              <p className="mt-5 font-mono text-[11px] leading-relaxed text-(--color-text-dim)">
                You run all three agencies from one console. Each service
                follows its own doctrine — BA boards, make-pumps, HART
                triggers, scene command, JESIP liaison — wired together so
                the multi-agency picture stays coherent.
              </p>
            </div>

            {/* Incident ticker */}
            <div className="rounded-sm border border-(--color-border) bg-(--color-surface) p-5">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
                  Scenario Library
                </p>
                <span className="font-mono text-[10px] uppercase tracking-widest text-(--color-amber-dim)">
                  10 live · more in dev
                </span>
              </div>
              <ul className="mt-3 space-y-1.5">
                <IncidentRow sev="major" title="Dwelling fire · persons reported" tag="F + A" />
                <IncidentRow sev="high" title="RTC · entrapment on the M60" tag="F + A + P" />
                <IncidentRow sev="major" title="HAZMAT · chemical leak at retail park" tag="F + A + P" />
                <IncidentRow sev="high" title="Wildfire · moorland" tag="F" />
                <IncidentRow sev="major" title="High-rise dwelling fire" tag="F + A" />
                <IncidentRow sev="moderate" title="Water rescue · flood" tag="F + A" />
                <IncidentRow sev="moderate" title="Healthcare premises fire alarm" tag="F" />
                <IncidentRow sev="low" title="Automatic fire alarm · industrial" tag="F" />
              </ul>
              <p className="mt-4 font-mono text-[11px] leading-relaxed text-(--color-text-dim)">
                Every scenario is researched against real incidents. No
                invented appliances, no made-up stations. Addresses,
                hydrants, hospitals — all real.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t border-(--color-border-subtle)">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
          <span>The Watch Room</span>
          <span>A serious game about decisions under pressure</span>
        </div>
      </footer>
    </div>
    </>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
        {k}
      </dt>
      <dd className="mt-1 text-(--color-text)">{v}</dd>
    </div>
  );
}

function ServiceRow({
  service,
  name,
  detail,
}: {
  service: "fire" | "ambulance" | "police";
  name: string;
  detail: string;
}) {
  // Accent per service — matches the in-sim colour coding.
  const accent =
    service === "fire"
      ? { bar: "bg-(--color-critical)", ring: "border-(--color-critical)/40", dot: "bg-(--color-critical)", label: "text-(--color-critical)" }
      : service === "ambulance"
        ? { bar: "bg-(--color-ok)", ring: "border-(--color-ok)/40", dot: "bg-(--color-ok)", label: "text-(--color-ok)" }
        : { bar: "bg-(--color-info)", ring: "border-(--color-info)/40", dot: "bg-(--color-info)", label: "text-(--color-info)" };
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`shrink-0 h-8 w-1 rounded-full ${accent.bar}`} aria-hidden />
        <div className="min-w-0">
          <div className="font-medium text-(--color-text)">{name}</div>
          <div className="truncate font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
            {detail}
          </div>
        </div>
      </div>
      <span
        className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border ${accent.ring} bg-(--color-bg) px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${accent.label}`}
      >
        <span className={`dot-live size-1.5 rounded-full ${accent.dot}`} />
        Live
      </span>
    </li>
  );
}

function IncidentRow({
  sev,
  title,
  tag,
}: {
  sev: "low" | "moderate" | "high" | "major";
  title: string;
  tag: string;
}) {
  const sevTone =
    sev === "major"
      ? "border-(--color-critical)/50 bg-(--color-critical)/10 text-(--color-critical)"
      : sev === "high"
        ? "border-(--color-amber)/50 bg-(--color-amber)/10 text-(--color-amber)"
        : sev === "moderate"
          ? "border-(--color-info)/40 bg-(--color-info)/10 text-(--color-info)"
          : "border-(--color-border) bg-(--color-surface-raised) text-(--color-text-dim)";
  return (
    <li className="grid grid-cols-[64px_1fr_auto] items-center gap-3 rounded-sm border border-(--color-border-subtle) bg-(--color-surface-raised)/40 px-2 py-1.5">
      <span
        className={
          "inline-flex justify-center rounded-sm border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest " +
          sevTone
        }
      >
        {sev}
      </span>
      <span className="truncate text-[13px] text-(--color-text)">{title}</span>
      <span className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
        {tag}
      </span>
    </li>
  );
}
