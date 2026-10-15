"use client";

// THE RESOURCING PAGE. The second page of the briefing, in the desk's
// own CAD: what the county actually has at the start of the shift. The
// strip counts each service, the table counts each type, and the bays
// show every station with its appliances — the ones still committed to
// a job that started before the operator sat down and when they clear,
// and the ones off the run and why. The mobilising screen shows the
// same bays once the shift is running; this is the look before the
// first call, so nobody is surprised to find a pump missing.

import { useState } from "react";
import "../vector/vector.css";
import type { ServiceCode, StatusCode } from "@/lib/sim/types";
import { STATUS_LABELS } from "@/lib/sim/types";
import { INTENSITY_META, type PreShiftState, type ShiftIntensity } from "@/lib/sim/shift";
import { RELIEF_START, shiftForHour } from "@/lib/sim/police-callsigns";
import { useVectorTheme } from "../vector/theme";
import { SERVICE_SHORT } from "../vector/model";
import { buildResourcePicture } from "../vector/resources-model";
import type { StationWithAppliances } from "../page";

type Filter = ServiceCode | "All";
const FILTERS: Filter[] = ["Fire", "Ambulance", "Police", "All"];
const SVC_CLASS: Record<ServiceCode, string> = { Fire: "fire", Ambulance: "amb", Police: "pol" };
const RELIEF_LABEL = { early: "Earlies", afternoon: "Lates", night: "Nights" } as const;

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

const hh = (h: number) => `${String(((h % 24) + 24) % 24).padStart(2, "0")}:00`;

export function ResourcingBrief({ stations, intensity, startHour, covered, roll, rolledAt, onBack, onBegin }: Props) {
  useVectorTheme();
  const [filter, setFilter] = useState<Filter>("All");
  const services = (["Fire", "Ambulance", "Police"] as ServiceCode[]).filter((s) => covered.includes(s));
  const show = (svc: ServiceCode) => services.includes(svc) && (filter === "All" || filter === svc);
  // The board as the shift will see it: the roll's statuses on the appliances.
  const rolled = stations.filter((s) => services.includes(s.service)).map((s) => ({ ...s, appliances: s.appliances.map((a) => (roll[a.id] ? { ...a, status: roll[a.id].status } : a)) }));
  const picture = buildResourcePicture({ stations: rolled, deployments: [], standbyMoves: {}, now: rolledAt });
  const meta = INTENSITY_META[intensity];
  const relief = shiftForHour(startHour);
  const rows = picture.rows.filter((r) => show(r.service));
  const bays = picture.bays.filter((b) => show(b.service));
  const minsBack = (at: number | undefined) => (at ? Math.max(1, Math.round((at - rolledAt) / 60_000)) : null);

  return (
    <div className="cad-application vec-brief" data-screen="resourcing">
      <div className="vec-screen">
        <div className="vec-screen-head">
          <h1><span className="dot" />PRE-SHIFT BRIEFING · RESOURCING</h1>
          <span className="mono">GREATER MANCHESTER · {meta.label.toUpperCase()} · START {hh(startHour)} · GMP {RELIEF_LABEL[relief].toUpperCase()} ON FROM {hh(RELIEF_START[relief])}</span>
          <span style={{ flex: 1 }} />
          <button type="button" className="vec-btn" onClick={onBack}>← CHANGE THE BRIEFING</button>
          <button type="button" className="vec-btn solid" onClick={onBegin}>BEGIN SHIFT · {hh(startHour)} →</button>
        </div>

        <div className="vec-res-strip">
          {services.map((svc) => {
            const t = picture.totals[svc];
            const committed = t.total - t.available - t.offRun;
            return (
              <div key={svc} className={`svc ${SVC_CLASS[svc]}`}>
                <div className="vec-k">{svc}</div>
                <div className="vec-v big">{t.available}<small>/{t.total}</small></div>
                <div className="vec-small"><span className="go">{t.available} available</span> · <span className="warn">{committed} committed</span> · <span className="stop">{t.offRun} off the run</span></div>
              </div>
            );
          })}
          <div className="svc gaps">
            <div className="vec-k">Stations empty at the start</div>
            <div className={`vec-v big ${picture.gaps.length ? "stop" : "go"}`}>{picture.gaps.length}</div>
            <div className="vec-small">{meta.blurb}</div>
          </div>
        </div>

        <div className="vec-res-body brief">
          <div className="vec-box">
            <header><span>Resource types</span><span className="mono">{rows.reduce((n, r) => n + r.total, 0)} units</span></header>
            <div className="vec-svctabs">
              {FILTERS.map((k) => (
                <button key={k} type="button" className={k === "All" ? "" : SVC_CLASS[k]} aria-pressed={filter === k} disabled={k !== "All" && !services.includes(k)} onClick={() => setFilter(k)}>{k === "All" ? "ALL" : SERVICE_SHORT[k]}</button>
              ))}
            </div>
            <div className="body">
              <table className="vec-table vec-res-table">
                <thead>
                  <tr><th>Type</th><th>Total</th><th>Avail</th><th title="Committed to a job that started before the shift; clears on its own">Cmtd</th><th>Off</th></tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={`${r.service}:${r.type}`} className={r.available === 0 ? "none" : r.available === 1 ? "thin" : ""}>
                      <td><b className="mono">{r.code}</b><div className="dim">{r.name}</div></td>
                      <td className="mono">{r.total}</td>
                      <td className={`mono ${r.available === 0 ? "stop" : r.available === 1 ? "warn" : "go"}`}>{r.available}</td>
                      <td className="mono">{r.committed || "·"}</td>
                      <td className="mono">{r.offRun || "·"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="vec-box">
            <header>
              <span>Station bays</span>
              <span className="mono">{bays.length} stations · <span className={picture.gaps.filter((g) => show(g.service)).length ? "stop" : "go"}>{picture.gaps.filter((g) => show(g.service)).length} without cover</span></span>
            </header>
            <div className="body">
              <div className="vec-bays">
                {bays.map((b) => {
                  const st = stations.find((s) => s.id === b.stationId);
                  const inBay = b.units.filter((u) => u.state === "in").length;
                  const live = b.units.some((u) => u.state !== "off");
                  const empty = inBay === 0 && live;
                  const exceptions = (st?.appliances ?? []).filter((a) => roll[a.id]);
                  return (
                    <div key={b.stationId} className={`vec-bay ${empty ? "empty" : ""}`}>
                      <div className="hd"><b>{b.id}</b><span>{b.name}</span></div>
                      <div className="units">
                        {b.units.map((u) => (
                          <span key={u.applianceId} className={`unit ${u.state === "out" ? "out" : u.state === "off" ? "off" : ""}`} title={roll[u.applianceId]?.reason}>{u.callsign}</span>
                        ))}
                      </div>
                      {exceptions.map((a) => {
                        const ps = roll[a.id];
                        const back = minsBack(ps.availableAt);
                        return (
                          <div key={a.id} className={`note ${ps.status === 8 ? "stop" : "warn"}`}>
                            {a.callsign} · {STATUS_LABELS[ps.status as StatusCode]} — {ps.reason}{back !== null ? ` · back ~${back} min` : ""}
                          </div>
                        );
                      })}
                      <div className="note">{empty ? "STATION EMPTY" : (picture.coverOf[b.stationId] ?? 1) === 0 ? "NO FRONT-LINE COVER" : `${inBay} of ${b.units.length} in the bay`}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="vec-statusbar">
          <span className="go">■ AVAILABLE</span>
          <span className="stop">■ COMMITTED · CLEARS DURING THE SHIFT</span>
          <span>■ OFF THE RUN ALL SHIFT</span>
          <span className="spacer" />
          <span className="mono">{stations.length} STATIONS · {picture.rows.reduce((n, r) => n + r.total, 0)} UNITS · POLICE CALLSIGNS CARRY THE RELIEF</span>
        </div>
      </div>
    </div>
  );
}
