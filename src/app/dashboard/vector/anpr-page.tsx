"use client";

// ANPR on the MDT — the car's own camera and the fixed sites. Reads are
// the same deterministic traffic the desk console sees (a pure function
// of the camera and the second, nothing stored), so the shift always
// reads the same plates and a reload invents nothing. Most of it is
// nothing at all; a hit is a plate that matched a record worth acting
// on, and the officer reviews it before anything happens.

import { useState } from "react";
import type { Appliance } from "@/lib/sim/types";
import type { RecordIndex, VehicleRecord } from "@/lib/sim/records";
import { ANPR_SITES, hitsBetween, siteById } from "@/lib/sim/anpr";
import { generateVehicle, randomVrm } from "@/lib/sim/leds-db";

type Read = {
  id: string;
  atMs: number;
  vrm: string;
  vehicle: VehicleRecord;
  source: string;
  camera: string;
  confidence: number;
  /** Markers that make the read a hit. */
  markers: string[];
  authored: boolean;
};

const ALERT = new Set(["STOLEN", "ANPR INTEREST", "PNC MARKER", "NO INSURANCE"]);
const SLOT_MS = 6500;

function stamp(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}
function hms(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-GB", { hour12: false });
}
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
}
const describe = (v: VehicleRecord) => [v.colour, v.make, v.model].filter(Boolean).join(" ") || "Unknown vehicle";

/** The car's camera over the last while: one plate every few seconds,
 *  the job's own vehicles slipped in so the hit the crew came for goes
 *  past them. */
function mountedReads(appliance: Appliance, camera: string, fromMs: number, toMs: number, jobVehicles: VehicleRecord[]): Read[] {
  const out: Read[] = [];
  const first = Math.floor(fromMs / SLOT_MS);
  const last = Math.floor(toMs / SLOT_MS);
  for (let slot = first; slot <= last; slot++) {
    const key = `${appliance.id}:${camera}:${slot}`;
    const h = hash(key);
    if (h % 7 === 0) continue; // a gap in the traffic
    const atMs = slot * SLOT_MS + (h % 4000);
    if (atMs > toMs || atMs < fromMs) continue;
    let vehicle: VehicleRecord;
    let authored = false;
    if (jobVehicles.length && h % 53 === 3) {
      vehicle = jobVehicles[(h >>> 8) % jobVehicles.length];
      authored = true;
    } else {
      const vrm = randomVrm(key);
      vehicle = generateVehicle(vrm);
    }
    const markers = (vehicle.markers ?? []).filter((m) => ALERT.has(m));
    out.push({ id: `m:${key}`, atMs, vrm: vehicle.vrm, vehicle, source: `${appliance.callsign} (${camera.toLowerCase()} camera)`, camera, confidence: 88 + (h % 12), markers, authored });
  }
  return out;
}

export type AnprPageProps = {
  appliance: Appliance;
  incidentRef: string;
  now: number;
  index?: RecordIndex;
  /** The job's own vehicles — the plates the crew is looking for. */
  jobVehicles: VehicleRecord[];
  onOpenPnc: (vrm: string) => void;
  onSelectVehicle?: (vrm: string) => void;
  onNote?: (text: string) => void;
};

export function AnprPage(props: AnprPageProps) {
  const { appliance, now, jobVehicles } = props;
  const [source, setSource] = useState<"mounted" | "fixed">("mounted");
  const [camera, setCamera] = useState<"Front" | "Rear">("Front");
  const [siteId, setSiteId] = useState(ANPR_SITES[0].id);
  const [paused, setPaused] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState<string | null>(null);
  const [range, setRange] = useState<15 | 60 | 240>(60);
  const [filter, setFilter] = useState<"all" | "alerts" | "job">("all");
  const [alertsOnly, setAlertsOnly] = useState(false);
  const [newestFirst, setNewestFirst] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [review, setReview] = useState<Record<string, { image?: boolean; description?: boolean; report?: boolean; result?: "confirmed" | "dismissed"; at?: number }>>({});
  const [showReport, setShowReport] = useState(false);
  const [activity, setActivity] = useState<{ at: number; text: string }[]>([]);

  const feedNow = paused ?? now;
  const windowFrom = feedNow - 10 * 60 * 1000;
  const reads: Read[] = source === "mounted"
    ? mountedReads(appliance, camera, windowFrom, feedNow, jobVehicles)
    : hitsBetween(windowFrom, feedNow).filter((h) => h.siteId === siteId).map((h) => {
        const v = props.index?.vehicles.find((x) => x.vrm.replace(/\s/g, "") === h.vrm.replace(/\s/g, "")) ?? generateVehicle(h.vrm);
        return { id: `f:${h.id}`, atMs: h.atMs, vrm: h.vrm, vehicle: v, source: `${siteById(h.siteId)?.name ?? h.siteId} ${h.direction}`, camera: "Fixed site", confidence: 97, markers: h.markers, authored: !!v.scenarioId };
      });
  const visible = reads
    .filter((r) => (!alertsOnly && filter === "all") || (filter === "alerts" || alertsOnly ? r.markers.length > 0 : true) && (filter !== "job" || r.authored))
    .sort((a, b) => (newestFirst ? b.atMs - a.atMs : a.atMs - b.atMs))
    .slice(0, 14);
  const latest = reads.reduce<Read | null>((m, r) => (!m || r.atMs > m.atMs ? r : m), null);
  const selected = reads.find((r) => r.id === selectedId) ?? visible.find((r) => r.markers.length > 0) ?? latest;

  const searchHits = searched
    ? [...mountedReads(appliance, "Front", now - range * 60000, now, jobVehicles), ...mountedReads(appliance, "Rear", now - range * 60000, now, jobVehicles), ...hitsBetween(now - range * 60000, now).map((h) => ({ id: `f:${h.id}`, atMs: h.atMs, vrm: h.vrm, vehicle: generateVehicle(h.vrm), source: `${siteById(h.siteId)?.name ?? h.siteId} ${h.direction}`, camera: "Fixed site", confidence: 97, markers: h.markers, authored: false }))]
        .filter((r) => r.vrm.replace(/\s/g, "").toUpperCase() === searched.replace(/\s/g, "").toUpperCase())
        .sort((a, b) => b.atMs - a.atMs)
    : [];

  const log = (text: string) => setActivity((a) => [{ at: now, text }, ...a].slice(0, 8));
  const rv = selected ? review[selected.id] ?? {} : {};
  const setRv = (patch: Partial<typeof rv>) => selected && setReview((r) => ({ ...r, [selected.id]: { ...r[selected.id], ...patch } }));
  const reviewed = !!rv.image && !!rv.description && !!rv.report;

  function confirm() {
    if (!selected) return;
    setRv({ result: "confirmed", at: now });
    log(`${selected.vrm} — match confirmed · ${selected.markers.join(" / ") || "no marker"}`);
    props.onNote?.(`ANPR match confirmed — ${selected.vrm} ${describe(selected.vehicle)} · ${selected.markers.join(" / ") || "no marker"} · read by ${selected.source} at ${hms(selected.atMs)}`);
    props.onSelectVehicle?.(selected.vrm);
  }
  function dismiss() {
    if (!selected) return;
    setRv({ result: "dismissed", at: now });
    log(`${selected.vrm} — dismissed as a mismatch`);
    props.onNote?.(`ANPR read ${selected.vrm} dismissed — does not match the vehicle in view`);
  }

  const status = (r: Read) => (review[r.id]?.result === "confirmed" ? "Confirmed" : review[r.id]?.result === "dismissed" ? "Dismissed" : r.markers.length ? "Review" : now - r.atMs < 8000 ? "Pending" : "No alert");

  const plate = (vrm: string, big = false) => <span className={`anpr-plate${big ? " big" : ""}`}>{vrm}</span>;

  return (
    <div className="anpr-page">
      <div className="pc-col">
        <section className="pc-card">
          <header><b>▣</b><span>CAMERA SOURCE</span></header>
          <div className="pc-card-body">
            <label className="pc-field inline"><span>Source</span>
              <select value={source} onChange={(e) => { setSource(e.target.value as "mounted" | "fixed"); setSelectedId(null); }}>
                <option value="mounted">Vehicle-mounted ANPR</option>
                <option value="fixed">Fixed site camera</option>
              </select>
            </label>
            {source === "mounted" ? (
              <>
                <label className="pc-field inline"><span>Resource</span><output>{appliance.callsign}</output></label>
                <label className="pc-field inline"><span>Camera</span>
                  <select value={camera} onChange={(e) => { setCamera(e.target.value as "Front" | "Rear"); setSelectedId(null); }}><option>Front</option><option>Rear</option></select>
                </label>
              </>
            ) : (
              <label className="pc-field inline"><span>Site</span>
                <select value={siteId} onChange={(e) => { setSiteId(e.target.value); setSelectedId(null); }}>{ANPR_SITES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              </label>
            )}
            <label className="pc-field inline"><span>Status</span><output><i className={`dot ${paused ? "warn" : "go"}`} />{paused ? `Feed paused ${hms(paused)}` : "Receiving reads"}</output></label>
            <button type="button" className="pc-mini wide" onClick={() => setPaused((p) => (p ? null : now))}>{paused ? "▶ Resume feed" : "❚❚ Pause feed"}</button>
          </div>
        </section>
        <section className="pc-card fill">
          <header><b>◉</b><span>CAMERA VIEW</span></header>
          <div className="pc-card-body">
            <div className="anpr-view">
              <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                <rect width="320" height="180" fill="#9fb8c8" />
                <rect y="70" width="320" height="110" fill="#3a4148" />
                <polygon points="0,180 120,70 200,70 320,180" fill="#4a535b" />
                <line x1="160" y1="70" x2="160" y2="180" stroke="#e5e7eb" strokeWidth="2" strokeDasharray="8 8" />
                <rect x="0" y="40" width="320" height="30" fill="#5f7d5a" />
                <g transform={`translate(${camera === "Front" ? 118 : 150} ${camera === "Front" ? 96 : 90})`}>
                  <rect width="84" height="52" rx="8" fill={latest?.vehicle.colour?.toLowerCase().includes("white") ? "#e5e7eb" : latest?.vehicle.colour?.toLowerCase().includes("black") ? "#1f2937" : latest?.vehicle.colour?.toLowerCase().includes("blue") ? "#3b5fa8" : latest?.vehicle.colour?.toLowerCase().includes("red") ? "#b3261e" : "#b8c0c8"} />
                  <rect x="10" y="6" width="64" height="18" rx="3" fill="#0f172a" opacity="0.7" />
                  <rect x="4" y="44" width="12" height="6" fill="#facc15" /><rect x="68" y="44" width="12" height="6" fill="#facc15" />
                </g>
              </svg>
              <span className="anpr-view-stamp">{latest ? stamp(latest.atMs) : stamp(feedNow)}</span>
              {latest && <div className="anpr-view-plate">{plate(latest.vrm, true)}</div>}
            </div>
          </div>
        </section>
        <section className="pc-card">
          <header><b>▤</b><span>READ DETAILS</span></header>
          <div className="pc-card-body">
            <dl className="pc-facts">
              <dt>Captured</dt><dd>{latest ? stamp(latest.atMs) : "—"}</dd>
              <dt>Source</dt><dd>{latest?.source ?? "—"}</dd>
              <dt>OCR confidence</dt><dd>{latest ? `${latest.confidence}%` : "—"}</dd>
            </dl>
            <p className="pc-info"><span>SIMULATED READS</span></p>
          </div>
        </section>
      </div>

      <div className="pc-col">
        <section className="pc-card">
          <header><b>⌕</b><span>SEARCH VRM</span></header>
          <div className="pc-card-body">
            <div className="anpr-search">
              <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") setSearched(query.trim() || null); }} placeholder="Enter registration…" />
              <button type="button" className="pc-primary" onClick={() => setSearched(query.trim() || null)}>Search VRM</button>
              <button type="button" className="pc-mini" onClick={() => { setQuery(""); setSearched(null); }}>Clear</button>
            </div>
            <div className="anpr-search-opts">
              <label className="pc-field inline"><span>Source</span><output>All cameras</output></label>
              <label className="pc-field inline"><span>Time range</span>
                <select value={range} onChange={(e) => setRange(Number(e.target.value) as 15 | 60 | 240)}><option value={15}>Last 15 minutes</option><option value={60}>Last hour</option><option value={240}>Last 4 hours</option></select>
              </label>
            </div>
            <p className="pc-info"><span>Search captured ANPR reads.</span></p>
          </div>
        </section>
        <section className="pc-card fill">
          <header><b>≡</b><span>LIVE READS</span>
            <span className="anpr-filter">
              <span>Filter:</span>
              <select value={filter} onChange={(e) => setFilter(e.target.value as "all" | "alerts" | "job")}><option value="all">All reads</option><option value="alerts">Alerts</option><option value="job">This job&apos;s vehicles</option></select>
              <button type="button" className={`anpr-toggle${alertsOnly ? " on" : ""}`} aria-pressed={alertsOnly} onClick={() => setAlertsOnly((v) => !v)}><i />Alerts only</button>
            </span>
          </header>
          <div className="pc-card-body">
            <table className="pc-table select anpr-reads">
              <thead><tr><th>Time</th><th>Registration</th><th>Vehicle</th><th>Status</th></tr></thead>
              <tbody>
                {visible.length === 0 && <tr><td colSpan={4} className="empty">No reads in the last ten minutes match the filter</td></tr>}
                {visible.map((r) => (
                  <tr key={r.id} className={`${selected?.id === r.id ? "on" : ""}${r.markers.length ? " hit" : ""}`} onClick={() => { setSelectedId(r.id); setShowReport(false); }}>
                    <td>{hms(r.atMs)}</td><td><b>{r.vrm}</b></td><td>{describe(r.vehicle)}</td><td className={status(r) === "Review" ? "warn" : status(r) === "Confirmed" ? "stop" : ""}>{status(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="anpr-reads-foot">
              <button type="button" className={`anpr-toggle${newestFirst ? " on" : ""}`} aria-pressed={newestFirst} onClick={() => setNewestFirst((v) => !v)}><i />Auto-scroll (newest first)</button>
              <span>{visible.length} reads displayed · {reads.length} in the last 10 min</span>
            </div>
            <div className="anpr-results">
              {!searched ? (
                <p className="pc-info"><span>Search results appear here when a VRM is entered.</span></p>
              ) : searchHits.length === 0 ? (
                <p className="pc-info warn"><span>No reads of {searched.toUpperCase()} in the last {range >= 60 ? `${range / 60} hour${range > 60 ? "s" : ""}` : `${range} minutes`}.</span></p>
              ) : (
                <table className="pc-table select">
                  <thead><tr><th>Time</th><th>Registration</th><th>Camera</th><th>Status</th></tr></thead>
                  <tbody>{searchHits.slice(0, 6).map((r) => <tr key={r.id} className={selected?.id === r.id ? "on" : ""} onClick={() => setSelectedId(r.id)}><td>{hms(r.atMs)}</td><td><b>{r.vrm}</b></td><td>{r.source}</td><td>{r.markers.length ? r.markers.join(" / ") : "No alert"}</td></tr>)}</tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="pc-col">
        <section className="pc-card">
          <header><b>◎</b><span>SELECTED READ</span></header>
          <div className="pc-card-body">
            {selected ? (
              <>
                <div className="anpr-selected">
                  {plate(selected.vrm, true)}
                  <div>
                    <strong>{describe(selected.vehicle)}</strong>
                    <span>Make/Model: {selected.vehicle.make || "—"} {selected.vehicle.model || ""}</span>
                    <span>Colour: {selected.vehicle.colour ?? "—"}</span>
                  </div>
                </div>
                {selected.markers.length > 0 ? (
                  <div className={`anpr-banner${rv.result === "confirmed" ? " stop" : rv.result === "dismissed" ? " off" : ""}`}>⚠ {rv.result === "confirmed" ? "MATCH CONFIRMED" : rv.result === "dismissed" ? "DISMISSED" : "POTENTIAL MATCH"} · {selected.markers.join(" / ")}</div>
                ) : (
                  <div className="anpr-banner off">NO MARKER HELD</div>
                )}
                <dl className="pc-facts">
                  <dt>Source</dt><dd>{selected.authored ? "Incident vehicle report" : selected.markers.length ? "PNC vehicle marker" : "Camera read"}</dd>
                  <dt>Reference</dt><dd>{selected.authored ? `${props.incidentRef}-V` : `ANPR-${(hash(selected.vrm) % 900 + 100)}`}</dd>
                  <dt>Record updated</dt><dd>{stamp(selected.atMs - (hash(selected.vrm) % 7200) * 1000)}</dd>
                </dl>
              </>
            ) : (
              <p className="pc-note">No read selected.</p>
            )}
          </div>
        </section>
        <section className="pc-card">
          <header><b>✓</b><span>REVIEW MATCH</span></header>
          <div className="pc-card-body">
            {(["image", "description", "report"] as const).map((k) => (
              <label key={k} className="anpr-check">
                <input type="checkbox" checked={!!rv[k]} disabled={!selected} onChange={(e) => setRv({ [k]: e.target.checked })} />
                <span>{k === "image" ? "Registration image matches" : k === "description" ? "Vehicle description matches" : "Source report reviewed"}</span>
              </label>
            ))}
            <div className="anpr-btns">
              <button type="button" className="pc-primary" disabled={!selected} onClick={() => selected && props.onOpenPnc(selected.vrm)}>Open PNC enquiry ›</button>
              <button type="button" className="pc-mini" disabled={!selected} onClick={() => { setShowReport((v) => !v); setRv({ report: true }); }}>{showReport ? "Hide source report" : "View source report"}</button>
            </div>
            {showReport && selected && (
              <div className="pc-brief">
                {(selected.vehicle.notes?.length ? selected.vehicle.notes : selected.markers.length ? selected.markers.map((m) => `${m} — marker held against ${selected.vrm}; confirm the vehicle in view before acting.`) : ["No report held against this plate."]).join("\n\n")}
              </div>
            )}
          </div>
        </section>
        <section className="pc-card">
          <header><b>✓</b><span>REVIEW RESULT</span></header>
          <div className="pc-card-body">
            <div className="anpr-btns">
              <button type="button" className="pc-mini" disabled={!selected || !reviewed || rv.result === "confirmed"} onClick={confirm}>Confirm match</button>
              <button type="button" className="pc-mini" disabled={!selected || rv.result === "dismissed"} onClick={dismiss}>Dismiss mismatch</button>
            </div>
            {selected && !reviewed && !rv.result && <p className="pc-info"><span>Tick the three checks to confirm a match.</span></p>}
            {rv.result && <p className={`pc-info ${rv.result === "confirmed" ? "go" : ""}`}><span>{rv.result === "confirmed" ? "Match confirmed — the vehicle is selected on the Vehicles tab." : "Dismissed as a mismatch."}{rv.at ? ` ${hms(rv.at)}` : ""}</span></p>}
          </div>
        </section>
        <section className="pc-card fill">
          <header><b>≡</b><span>ACTIVITY</span></header>
          <div className="pc-card-body">
            <div className="pc-log">
              {selected && <div className="row"><span>{hms(selected.atMs)}</span><span>Read received · {selected.vrm}</span></div>}
              {selected && selected.markers.length > 0 && !rv.result && <div className="row"><span>{hms(selected.atMs + 1000)}</span><span>Potential match flagged — awaiting operator review</span></div>}
              {activity.map((a, i) => <div key={i} className="row"><span>{hms(a.at)}</span><span>{a.text}</span></div>)}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
