"use client";

// THE RESOURCES SCREEN. Dynamic deployment from the desk: how many of
// each type the county has and what state they are in, every station's
// bay, the stations with nobody in them and for how long, the cover
// moves the board suggests and the ones under way, and a form to send
// any free unit to stand by at any station. The mobilising screen is
// for a job; this is for the county between jobs.

import { useState } from "react";
import type { ServiceCode } from "@/lib/sim/types";
import { SERVICE_SHORT, etaLabel, hhmmss } from "./model";
import type { BayRow } from "./mob-screen";
import type { ResourcePicture } from "./resources-model";

type Filter = ServiceCode | "All";
const FILTERS: Filter[] = ["Fire", "Ambulance", "Police", "All"];
const SVC_CLASS: Record<ServiceCode, string> = { Fire: "fire", Ambulance: "amb", Police: "pol" };

export type ResourcesScreenProps = {
  picture: ResourcePicture;
  now: number;
  /** What the operator covers from this position. */
  covered: ServiceCode[];
  /** This shift so far: cover moves made, station-minutes without cover. */
  stats: { moves: number; gapMinutes: number };
  onSendStandby: (suggestionId: string) => void;
  onMoveToStandby: (applianceId: string, stationId: string) => void;
  onRecallStandby: (applianceId: string) => void;
  onPick: (applianceId: string) => void;
  onOpenBays: (stationId: string) => void;
};

const since = (t: number | null, now: number) => (t === null ? "just now" : `${Math.max(1, Math.round((now - t) / 60_000))} min`);

export function ResourcesScreen({ picture, now, covered, stats, onSendStandby, onMoveToStandby, onRecallStandby, onPick, onOpenBays }: ResourcesScreenProps) {
  const [filter, setFilter] = useState<Filter>("All");
  const [unitId, setUnitId] = useState("");
  const [destId, setDestId] = useState("");
  const show = (svc: ServiceCode) => filter === "All" || filter === svc;
  const rows = picture.rows.filter((r) => show(r.service));
  const bays = picture.bays.filter((b) => show(b.service));
  const unit = picture.freeUnits.find((u) => u.applianceId === unitId) ?? null;
  const dests = unit ? picture.destinations.filter((d) => d.service === unit.service && d.stationId !== unit.stationId) : [];
  const dest = dests.find((d) => d.stationId === destId) ?? null;
  const empties = picture.gaps.length;
  const byService = (["Fire", "Ambulance", "Police"] as ServiceCode[]).filter((s) => covered.includes(s));

  return (
    <div className="vec-screen vec-resources">
      <div className="vec-screen-head">
        <h1><span className="dot" style={empties ? { background: "var(--vec-stop)" } : undefined} />RESOURCES · DYNAMIC DEPLOYMENT</h1>
        <span className="mono">{empties ? `${empties} STATION${empties === 1 ? "" : "S"} WITHOUT COVER` : "EVERY STATION COVERED"} · {picture.active.length} ON COVER MOVES · {hhmmss(now)}</span>
        <span style={{ flex: 1 }} />
        <span className="mono">THIS SHIFT · {stats.moves} MOVE{stats.moves === 1 ? "" : "S"} · {Math.round(stats.gapMinutes)} STATION-MIN UNCOVERED</span>
      </div>

      <div className="vec-res-strip">
        {byService.map((svc) => {
          const t = picture.totals[svc];
          return (
            <div key={svc} className={`svc ${SVC_CLASS[svc]}`}>
              <div className="vec-k">{svc}</div>
              <div className="vec-v big">{t.available}<small>/{t.total}</small></div>
              <div className="vec-small">available · {t.onJobs} on jobs · {t.offRun} off the run</div>
            </div>
          );
        })}
        <div className="svc gaps">
          <div className="vec-k">Stations without cover</div>
          <div className={`vec-v big ${empties ? "stop" : "go"}`}>{empties}</div>
          <div className="vec-small">{picture.suggestions.length ? `${picture.suggestions.length} move${picture.suggestions.length === 1 ? "" : "s"} suggested` : "nothing to send"}</div>
        </div>
      </div>

      <div className="vec-res-body">
        {/* ---- Types ---- */}
        <div className="vec-box">
          <header><span>Resource types</span><span className="mono">{rows.reduce((n, r) => n + r.total, 0)} units</span></header>
          <div className="vec-svctabs">
            {FILTERS.map((k) => (
              <button key={k} type="button" className={k === "All" ? "" : SVC_CLASS[k]} aria-pressed={filter === k} onClick={() => setFilter(k)}>{k === "All" ? "ALL" : SERVICE_SHORT[k]}</button>
            ))}
          </div>
          <div className="body">
            <table className="vec-table vec-res-table">
              <thead>
                <tr><th>Type</th><th title="In service: not off the run">In svc</th><th>Avail</th><th title="Standing by away from its station">Stby</th><th>Jobs</th><th>Ret</th><th title="Not free for another reason">Cmtd</th><th>Off</th><th title="Under crew complement">Short</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.service}:${r.type}`} className={r.available === 0 ? "none" : r.available === 1 ? "thin" : ""}>
                    <td><b className="mono">{r.code}</b><div className="dim">{r.name}</div></td>
                    <td className="mono">{r.total - r.offRun}</td>
                    <td className={`mono ${r.available === 0 ? "stop" : r.available === 1 ? "warn" : "go"}`}>{r.available}</td>
                    <td className="mono">{r.standingBy || "·"}</td>
                    <td className="mono">{r.onJobs || "·"}</td>
                    <td className="mono">{r.returning || "·"}</td>
                    <td className="mono">{r.committed || "·"}</td>
                    <td className="mono">{r.offRun || "·"}</td>
                    <td className="mono">{r.short || "·"}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={9}><div className="vec-tile-empty">No units of that service on the board</div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* ---- Bays ---- */}
        <div className="vec-box">
          <header><span>Station bays</span><span className="mono">{bays.length} stations · <span className={picture.gaps.filter((g) => show(g.service)).length ? "stop" : "go"}>{picture.gaps.filter((g) => show(g.service)).length} without cover</span></span></header>
          <div className="body">
            <div className="vec-bays">
              {bays.map((b) => <Bay key={b.stationId} bay={b} onPick={onPick} onOpenBays={onOpenBays} />)}
            </div>
          </div>
        </div>

        {/* ---- Cover ---- */}
        <div className="vec-res-side">
          <div className="vec-box">
            <header><span>Stations without cover</span><span className={`mono ${empties ? "stop" : "go"}`}>{empties ? `${empties} EMPTY` : "ALL COVERED"}</span></header>
            <div className="body">
              {picture.gaps.length === 0 ? (
                <div className="vec-tile-empty">Every station with front-line units has one in the bay</div>
              ) : (
                picture.gaps.map((g) => (
                  <div key={g.stationId} className="vec-row static" style={{ background: g.inbound ? "var(--vec-warn-tint)" : "var(--vec-stop-tint)" }}>
                    <span className="bar" style={{ background: g.inbound ? "var(--vec-warn)" : "var(--vec-stop)" }} />
                    <span className="body">
                      <span className="line1"><span>{g.name} <span style={{ fontWeight: 400, color: "var(--vec-text-muted)" }}>· {SERVICE_SHORT[g.service]}</span></span><span className="time">empty {since(g.since, now)}</span></span>
                      <span className="sub">
                        {g.inbound ? `${g.inbound.callsign} on the way${g.inbound.etaSec !== null ? ` · ${etaLabel(g.inbound.etaSec)}` : ""}` : g.suggestion ? `${g.suggestion.callsign} from ${g.suggestion.from} could cover · ${g.suggestion.travel}` : "Nobody in range with a unit to spare"}
                      </span>
                      {g.suggestion && !g.inbound && (
                        <span style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                          <button type="button" className="vec-btn mini" onClick={() => onSendStandby(g.suggestion!.id)}>SEND {g.suggestion.callsign}</button>
                        </span>
                      )}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="vec-box">
            <header><span>Cover moves</span><span className="mono">{picture.active.length ? `${picture.active.length} UNDER WAY` : "NONE"}</span></header>
            <div className="body">
              {picture.active.map((m) => (
                <div key={m.applianceId} className="vec-row static" style={{ background: m.phase === "standing" ? "var(--vec-go-tint)" : undefined }}>
                  <span className="bar" style={{ background: m.phase === "standing" ? "var(--vec-go)" : "var(--vec-work)" }} />
                  <span className="body">
                    <span className="line1">
                      <span><button type="button" className="vec-link" onClick={() => onPick(m.applianceId)}>{m.callsign}</button> <span style={{ fontWeight: 400, color: "var(--vec-text-muted)" }}>{m.type} · {m.from}</span> → {m.to}</span>
                      <span className="time">{m.phase === "standing" ? "STANDING BY" : m.phase === "returning" ? `HOME ${m.etaSec !== null ? etaLabel(m.etaSec) : ""}` : `ETA ${m.etaSec !== null ? etaLabel(m.etaSec) : "—"}`}</span>
                    </span>
                    <span className="sub" style={{ whiteSpace: "normal" }}>{m.reason}</span>
                    {m.phase !== "returning" && (
                      <span style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                        <button type="button" className="vec-btn mini" onClick={() => onRecallStandby(m.applianceId)}>RECALL</button>
                      </span>
                    )}
                  </span>
                </div>
              ))}
              {picture.active.length === 0 && <div className="vec-tile-empty">No unit is standing by away from its station</div>}
            </div>
          </div>

          <div className="vec-box">
            <header><span>Send a unit to stand by</span><span className="mono">{picture.freeUnits.length} FREE</span></header>
            <div className="body vec-res-form">
              <label>
                <span className="vec-k">Unit</span>
                <select className="vec-btn" value={unitId} onChange={(e) => { setUnitId(e.target.value); setDestId(""); }}>
                  <option value="">Choose a free unit…</option>
                  {picture.freeUnits.filter((u) => covered.includes(u.service)).map((u) => (
                    <option key={u.applianceId} value={u.applianceId}>{u.callsign} · {u.typeName} · {u.station}{u.lastInBay ? " (last in the bay)" : ""}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="vec-k">Stand by at</span>
                <select className="vec-btn" value={destId} disabled={!unit} onChange={(e) => setDestId(e.target.value)}>
                  <option value="">{unit ? "Choose a station…" : "Pick the unit first"}</option>
                  {dests.map((d) => (
                    <option key={d.stationId} value={d.stationId}>{d.name}{d.empty ? " — EMPTY" : ` — ${d.cover} in the bay`}</option>
                  ))}
                </select>
              </label>
              <div className="vec-small">
                {unit && unit.lastInBay ? `${unit.callsign} is the last front-line unit at ${unit.station} — sending it empties that station.` : dest ? `${dest.name} ${dest.empty ? "has nobody in the bay" : `has ${dest.cover} in the bay`}.` : "A unit on standby stays available and mobilises from where it is."}
              </div>
              <button type="button" className="vec-btn solid" disabled={!unit || !dest} onClick={() => { if (unit && dest) { onMoveToStandby(unit.applianceId, dest.stationId); setUnitId(""); setDestId(""); } }}>
                SEND TO STANDBY
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bay({ bay, onPick, onOpenBays }: { bay: BayRow; onPick: (id: string) => void; onOpenBays: (stationId: string) => void }) {
  const standing = (bay.visitors ?? []).filter((v) => v.phase === "standing");
  const inBay = bay.units.filter((u) => u.state === "in").length + standing.length;
  const live = bay.units.some((u) => u.state !== "off");
  const empty = inBay === 0 && live;
  return (
    <div className={`vec-bay ${empty ? "empty" : ""}`} onDoubleClick={() => onOpenBays(bay.stationId)} title="Double-click to look inside the station">
      <div className="hd"><b>{bay.id}</b><span>{bay.name}</span></div>
      <div className="units">
        {bay.units.map((u) => (
          <button key={u.applianceId} type="button" className={`unit ${u.state === "out" ? "out" : u.state === "off" ? "off" : u.state === "standby" ? "standby" : ""}`} onClick={() => onPick(u.applianceId)} title={u.state === "standby" ? "Away on a cover move" : undefined}>{u.callsign}</button>
        ))}
        {(bay.visitors ?? []).map((v) => (
          <button key={`v-${v.applianceId}`} type="button" className={`unit visitor${v.phase === "moving" ? " moving" : ""}`} onClick={() => onPick(v.applianceId)} title={v.phase === "moving" ? "On the way here to stand by" : "Standing by here"}>{v.callsign}</button>
        ))}
      </div>
      <div className="note">{empty ? "STATION EMPTY" : `${inBay} of ${bay.units.length + standing.length} in the bay`}</div>
    </div>
  );
}
