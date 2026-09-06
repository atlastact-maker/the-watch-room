"use client";

// The Dispatch workspace tiles. Each is the VECTOR rendering of something
// the simulator already tracks: the stack of waiting calls, the live
// incidents, the selected job's details, the units on its ground, its
// pre-determined attendance, the county's free resources, station cover,
// standby moves and the hospitals within reach. The dashboard client
// computes the rows; the tiles draw them and hand clicks back.

import { useState } from "react";
import type { Severity } from "@/lib/sim/incident_types";
import type { ServiceCode, StatusCode } from "@/lib/sim/types";
import { DRAG_MIME } from "../components/call-stack";
import { VectorTile, type TileLayout } from "./tile";
import { SERVICE_SHORT, copyText, etaLabel } from "./model";

type Area = { w: number; h: number };

/* ----------------------------------------------------------------------
   Calls
   ---------------------------------------------------------------------- */
export type CallRow = {
  id: string;
  service: ServiceCode;
  grade: string;
  standardMinutes: number | null;
  title: string;
  address: string;
  waitedSec: number;
  state: "ok" | "warn" | "breached";
  duplicateOf?: string | null;
  disposalBasis?: string | null;
};

export function CallsTile({
  layout,
  area,
  calls,
  ready,
  onToggleReady,
  onAnswer,
  onDecline,
  onClose,
}: {
  layout: TileLayout;
  area: Area;
  calls: CallRow[];
  ready: boolean;
  onToggleReady: () => void;
  onAnswer: (id: string) => void;
  onDecline: (id: string) => void;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<"All" | ServiceCode>("All");
  const [picked, setPicked] = useState<string | null>(null);
  const n = (s: ServiceCode) => calls.filter((c) => c.service === s).length;
  const shown = calls.filter((c) => filter === "All" || c.service === filter);
  const breached = calls.filter((c) => c.state === "breached").length;
  const selected = shown.find((c) => c.id === picked) ?? shown[0] ?? null;
  return (
    <VectorTile
      id="calls"
      title="Calls"
      count={calls.length ? `${calls.length} waiting` : undefined}
      flag={breached ? `${breached} PAST STANDARD` : undefined}
      layout={layout}
      area={area}
      onClose={onClose}
      minWidth={260}
      minHeight={200}
    >
      <div className="vec-tile-sub">
        <span>
          F {n("Fire")} · A {n("Ambulance")} · P {n("Police")}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={ready}
          onClick={onToggleReady}
          className="vec-btn mini"
          style={{
            background: ready ? "#197a4b" : "#a4640b",
            borderColor: ready ? "#197a4b" : "#a4640b",
            color: "#fff",
          }}
          title={ready ? "Ready — taking calls. Click to hold incoming calls." : "On hold — calls go to another position. Click to take calls."}
        >
          ● {ready ? "READY" : "ON HOLD"}
        </button>
      </div>
      <div className="vec-svctabs">
        {(["All", "Fire", "Ambulance", "Police"] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={filter === k}
            className={k === "Fire" ? "fire" : k === "Ambulance" ? "amb" : k === "Police" ? "pol" : ""}
            onClick={() => setFilter(k)}
          >
            {k === "All" ? "ALL" : SERVICE_SHORT[k]} {k === "All" ? calls.length : n(k)}
          </button>
        ))}
      </div>
      <div className="vec-tile-sub">
        <span>Unanswered</span>
        <span className={breached ? "stop" : "go"}>{breached ? `${breached} breached` : "All within standard"}</span>
      </div>
      {shown.length === 0 ? (
        <div className="vec-tile-empty">{ready ? "No calls waiting" : "Position on hold"}</div>
      ) : (
        shown.map((c) => {
          const on = selected?.id === c.id;
          const left = c.standardMinutes ? Math.max(0, c.standardMinutes * 60 - c.waitedSec) : null;
          return (
            <div key={c.id}>
              <button type="button" className={`vec-row ${on ? "on" : ""}`} onClick={() => setPicked(c.id)}>
                <span className={`vec-svc ${c.service}`} />
                <span className="body">
                  <span className="line1">
                    <span className={`grade ${c.state === "breached" ? "stop" : c.service === "Ambulance" ? "go" : ""}`}>
                      {SERVICE_SHORT[c.service][0]} · {c.grade}
                    </span>
                    <span className={`time ${c.state === "breached" ? "stop" : c.state === "warn" ? "warn" : ""}`}>
                      {etaLabel(c.waitedSec).replace("At scene", "0s")}
                    </span>
                  </span>
                  <span className="ttl">{c.title}</span>
                  <span className="sub">{c.address}</span>
                  <span className="tag">
                    <span>{c.duplicateOf ? `POSSIBLE DUPLICATE · ${c.duplicateOf}` : "UNANSWERED"}</span>
                    {c.disposalBasis && <span className="ok">RCRP</span>}
                  </span>
                </span>
              </button>
              {on && (
                <div className="vec-row static" style={{ background: "var(--vec-surface-raised)" }}>
                  <span className="actions" style={{ flex: 1, borderTop: 0 }}>
                    <span>
                      {c.standardMinutes ? `${c.standardMinutes}m standard · ${left !== null ? etaLabel(left).replace("At scene", "0s") : ""} left` : "No attendance standard"}
                    </span>
                    <span style={{ display: "flex", gap: 6 }}>
                      <button type="button" className="vec-btn mini" onClick={() => onDecline(c.id)} title="Close the call at the desk, nobody sent">
                        Close
                      </button>
                      <button type="button" className="vec-btn mini solid" onClick={() => onAnswer(c.id)}>
                        Answer call
                      </button>
                    </span>
                  </span>
                </div>
              )}
            </div>
          );
        })
      )}
    </VectorTile>
  );
}

/* ----------------------------------------------------------------------
   Live incidents
   ---------------------------------------------------------------------- */
export type IncidentRow = {
  id: string;
  ref: string;
  title: string;
  address: string;
  severity: Severity;
  elapsedMs: number;
  required: number;
  allocated: number;
  mobile: number;
  scene: number;
  resolved: boolean;
  /** Command handed over: who has it and the state. */
  command: { callsign: string; label: string } | null;
  commandOptions: { applianceId: string; callsign: string; typeName: string; advice?: string; comfortable?: boolean }[];
  selected: boolean;
  grade: string;
};

export function LiveIncidentsTile({
  layout,
  area,
  rows,
  now,
  onSelect,
  onOpen,
  onHandCommandTo,
  onDropAppliance,
  onClose,
}: {
  layout: TileLayout;
  area: Area;
  rows: IncidentRow[];
  now: number;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  onHandCommandTo: (incidentId: string, applianceId: string) => void;
  onDropAppliance: (incidentId: string, applianceId: string, stationId: string) => void;
  onClose: () => void;
}) {
  const [hot, setHot] = useState<string | null>(null);
  const open = rows.filter((r) => !r.resolved).length;
  void now;
  return (
    <VectorTile id="live" title="Live incidents" count={`${open} open`} layout={layout} area={area} onClose={onClose} minWidth={260} minHeight={180}>
      {rows.length === 0 ? (
        <div className="vec-tile-empty">Nothing running — answer a call to open a job</div>
      ) : (
        rows.map((r) => {
          const short = r.required - r.allocated;
          return (
            <div key={r.id}>
              <button
                type="button"
                className={`vec-row ${r.selected ? "on" : ""} ${hot === r.id ? "hot" : ""}`}
                onClick={() => onSelect(r.id)}
                onDoubleClick={() => onOpen(r.id)}
                title="Click to select · double-click to open the incident details"
                onDragOver={(e) => {
                  if (r.resolved || !e.dataTransfer.types.includes(DRAG_MIME)) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (hot !== r.id) setHot(r.id);
                }}
                onDragLeave={() => setHot((h) => (h === r.id ? null : h))}
                onDrop={(e) => {
                  setHot(null);
                  if (r.resolved) return;
                  const raw = e.dataTransfer.getData(DRAG_MIME);
                  if (!raw) return;
                  e.preventDefault();
                  try {
                    const { applianceId, stationId } = JSON.parse(raw);
                    if (applianceId && stationId) onDropAppliance(r.id, applianceId, stationId);
                  } catch {
                    /* malformed payload */
                  }
                }}
              >
                <span className="bar" style={r.command ? { background: "var(--vec-go)" } : undefined} />
                <span className="body">
                  <span className="line1">
                    <span>{r.ref}</span>
                    <span className="time">{fmtElapsed(r.elapsedMs)}</span>
                  </span>
                  <span className="ttl">{r.title}</span>
                  <span className="sub">{r.address}</span>
                  <span className="tag">
                    <span className="sev">{r.resolved ? "CLOSED" : r.severity.toUpperCase()}</span>
                    <span>{r.grade}</span>
                    {r.resolved ? null : short > 0 ? <span className="short">{short} SHORT</span> : <span className="ok">COMPLETE</span>}
                  </span>
                  {hot === r.id && <span className="tag" style={{ color: "var(--vec-warn)" }}>RELEASE TO MOBILISE HERE</span>}
                </span>
              </button>
              {r.selected && !r.resolved && (
                <div className="vec-drawer">
                  <div className="vec-stats" style={{ padding: "4px 0 2px" }}>
                    <div><div className="k">REQ</div><div className="v">{r.required}</div></div>
                    <div><div className="k">ALLOC</div><div className={`v ${short > 0 ? "stop" : ""}`}>{r.allocated}</div></div>
                    <div><div className="k">MOBILE</div><div className="v">{r.mobile}</div></div>
                    <div><div className="k">SCENE</div><div className="v">{r.scene}</div></div>
                  </div>
                  <div className={`cmd ${r.command ? "go" : ""}`}>
                    {r.command ? `COMMAND · ${r.command.callsign} ${r.command.label}` : "COMMAND · this desk"}
                  </div>
                  {!r.command && (
                    <div className="hand">
                      <span className="k">COMMAND HANDOVER</span>
                      {r.commandOptions.length === 0 ? (
                        <span style={{ fontSize: 10, color: "var(--vec-text-muted)" }}>Nothing on scene to take command</span>
                      ) : (
                        r.commandOptions.map((o) => (
                          <button
                            key={o.applianceId}
                            type="button"
                            className={`vec-btn mini ${o.comfortable ? "" : "stop"}`}
                            title={o.advice ? `${o.typeName} — ${o.advice}` : o.typeName}
                            onClick={() => onHandCommandTo(r.id, o.applianceId)}
                          >
                            {o.callsign}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  <div className="copies">
                    <button type="button" onClick={() => copyText(r.address)}>Copy address ⧉</button>
                    <button type="button" onClick={() => copyText(r.ref)}>Copy reference ⧉</button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </VectorTile>
  );
}

function fmtElapsed(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/* ----------------------------------------------------------------------
   Incident details
   ---------------------------------------------------------------------- */
export type IncidentDetail = {
  ref: string;
  title: string;
  state: string;
  elapsedMs: number;
  sinceUpdateMs: number;
  address1: string;
  address2: string;
  postcode: string;
  latlng: string;
  property: string;
  access: string;
  caller: string;
  callerFlag: string;
  risks: string[];
  informant: { id: string; text: string; tone: "info" | "urgent" | "critical"; at: number }[];
  onCall: boolean;
};

export function IncidentDetailsTile({ layout, area, detail, onClose, onOpenLog }: { layout: TileLayout; area: Area; detail: IncidentDetail | null; onClose: () => void; onOpenLog: () => void }) {
  return (
    <VectorTile id="incident" title="Incident details" layout={layout} area={area} onClose={onClose} minWidth={300} minHeight={200}>
      {!detail ? (
        <div className="vec-tile-empty">Select an incident</div>
      ) : (
        <>
          <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--vec-border)" }}>
            <div style={{ fontFamily: "var(--vec-mono)", fontSize: 12, fontWeight: 700 }}>
              {detail.ref} — {detail.title.toUpperCase()}
            </div>
            <div className="vec-k" style={{ marginTop: 3 }}>
              {detail.state} · ELAPSED {fmtElapsed(detail.elapsedMs)} · LAST UPDATE {fmtElapsed(detail.sinceUpdateMs)}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <div className="vec-field">
              <div className="vec-k">Address · OS AddressBase match</div>
              <div className="vec-v" style={{ fontFamily: "var(--vec-sans)", fontSize: 13 }}>
                {detail.address1}{" "}
                <button type="button" className="vec-btn mini" onClick={() => copyText(`${detail.address1}, ${detail.address2}`)} title="Copy address">⧉</button>
              </div>
              <div className="vec-small">{detail.address2}</div>
              <div className="vec-small" style={{ fontFamily: "var(--vec-mono)" }}>
                {detail.postcode} · {detail.latlng}
              </div>
            </div>
            <div className="vec-field">
              <div className="vec-k">Property</div>
              <div className="vec-small" style={{ color: "var(--vec-text)" }}>{detail.property}</div>
              <div className="vec-small">{detail.access}</div>
            </div>
            <div className="vec-field">
              <div className="vec-k">Caller {detail.onCall ? "· ON THE LINE" : ""}</div>
              <div className="vec-small" style={{ color: "var(--vec-text)" }}>{detail.caller}</div>
              {detail.callerFlag && <div className="vec-small" style={{ color: "var(--vec-stop)", fontWeight: 700 }}>{detail.callerFlag}</div>}
            </div>
            <div className="vec-field">
              <div className="vec-k">Risk · premises history</div>
              {detail.risks.length === 0 ? (
                <div className="vec-small">None recorded</div>
              ) : (
                detail.risks.map((r, i) => (
                  <div key={i} className="vec-small" style={{ color: "var(--vec-text)" }}>{r}</div>
                ))
              )}
            </div>
          </div>
          <div className="vec-sect">
            <span>999 call dialogue</span>
            <button type="button" className="vec-btn mini" onClick={onOpenLog}>Incident log</button>
          </div>
          {detail.informant.length === 0 ? (
            <div className="vec-tile-empty">{detail.onCall ? "Caller connected — nothing further yet" : "Caller off the line"}</div>
          ) : (
            <div className="vec-dialogue">
              {detail.informant.map((m) => (
                <div key={m.id}>
                  <span>{hhmm(m.at)}</span>
                  <span className="who calr">CALR</span>
                  <span className={`txt ${m.tone}`}>{m.text}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </VectorTile>
  );
}

function hhmm(ts: number): string {
  const d = new Date(ts);
  return [d.getHours(), d.getMinutes(), d.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":");
}

/* ----------------------------------------------------------------------
   Scene units
   ---------------------------------------------------------------------- */
export type SceneUnitRow = {
  applianceId: string;
  callsign: string;
  service: ServiceCode;
  status: StatusCode;
  state: string;
  placed: boolean;
  etaSec: number;
  onScene: boolean;
};

export function SceneUnitsTile({ layout, area, rows, onPick, onPlace, onClose, groundAvailable }: { layout: TileLayout; area: Area; rows: SceneUnitRow[]; onPick: (id: string) => void; onPlace: (id: string) => void; onClose: () => void; groundAvailable: boolean }) {
  const waiting = rows.filter((r) => r.onScene && !r.placed).length;
  return (
    <VectorTile id="units" title="Scene units" count={rows.length ? `${rows.length} committed` : undefined} layout={layout} area={area} onClose={onClose} minWidth={280} minHeight={160}>
      <div className="vec-tile-sub">
        <span className={waiting ? "stop" : "go"}>{rows.length === 0 ? "No units committed" : waiting ? `${waiting} awaiting placement` : "All placed"}</span>
      </div>
      {rows.length === 0 ? (
        <div className="vec-tile-empty">Mobilise a unit to see it here</div>
      ) : (
        rows.map((r) => (
          <div key={r.applianceId} className="vec-row static" style={r.onScene && !r.placed ? { background: "var(--vec-stop-tint)" } : undefined}>
            <span className={`vec-svc ${r.service}`} />
            <span className="body" style={{ display: "grid", gridTemplateColumns: "auto auto 1fr auto", alignItems: "center", gap: 10 }}>
              <button type="button" onClick={() => onPick(r.applianceId)} style={{ background: "transparent", border: 0, padding: 0, font: "700 13px var(--vec-mono)", color: "inherit", cursor: "pointer" }}>
                {r.callsign}
              </button>
              <span className={`vec-stc s${r.status}`}>{r.status}</span>
              <span>
                <div style={{ fontSize: 11 }}>{r.state}</div>
                <div style={{ fontSize: 10, color: r.onScene && !r.placed ? "var(--vec-stop)" : "var(--vec-text-muted)", fontWeight: r.onScene && !r.placed ? 700 : 400 }}>
                  {r.onScene ? (r.placed ? "Placed on scene" : "AWAITING PLACEMENT") : `Mobile · ETA ${etaLabel(r.etaSec)}`}
                </div>
              </span>
              <button
                type="button"
                className={`vec-btn mini ${r.onScene && !r.placed ? "solid" : ""}`}
                disabled={!groundAvailable}
                title={groundAvailable ? "Open the ground and set where this unit is standing" : "Placement happens on the ground view"}
                onClick={() => onPlace(r.applianceId)}
              >
                {r.placed ? "MOVE" : "PLACE"}
              </button>
            </span>
          </div>
        ))
      )}
    </VectorTile>
  );
}

/* ----------------------------------------------------------------------
   Attendance (PDA)
   ---------------------------------------------------------------------- */
export type PdaRow = {
  n: number;
  slot: string;
  applianceId: string | null;
  callsign: string | null;
  from: string;
  status: StatusCode | null;
  state: string;
  etaSec: number;
  why: string;
};

export function AttendanceTile({ layout, area, rows, ref, onClose, onFill }: { layout: TileLayout; area: Area; rows: PdaRow[]; ref: string; onClose: () => void; onFill: () => void }) {
  const filled = rows.filter((r) => r.callsign).length;
  const unfilled = rows.length - filled;
  return (
    <VectorTile id="attendance" title="Attendance" count={ref || undefined} layout={layout} area={area} onClose={onClose} minWidth={420} minHeight={160}>
      <div className="vec-tile-sub">
        <strong>Predetermined attendance</strong>
        <span className={unfilled ? "stop" : "go"}>
          {rows.length === 0 ? "No incident selected" : `${filled} of ${rows.length} · ${unfilled ? `${unfilled} unfilled` : "complete"}`}
        </span>
      </div>
      {rows.length === 0 ? (
        <div className="vec-tile-empty">Select an incident to see what it calls for</div>
      ) : (
        <table className="vec-table">
          <thead>
            <tr>
              <th>#</th><th>Slot</th><th>Callsign</th><th>From</th><th>STC</th><th>State</th><th>ETA</th><th>Why unfilled</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.n} className={r.callsign ? "" : "short"}>
                <td className="dim">{r.n}</td>
                <td>{r.slot}</td>
                <td className={`mono ${r.callsign ? "" : "stop"}`}>{r.callsign ?? "NOT SENT"}</td>
                <td>{r.from}</td>
                <td>{r.status ? <span className={`vec-stc s${r.status}`}>{r.status}</span> : <span className="vec-stc none">–</span>}</td>
                <td className={r.callsign ? "" : "stop"}>{r.callsign ? `● ${r.state}` : "✕ Slot unfilled"}</td>
                <td className="dim">{r.status === 1 ? etaLabel(r.etaSec) : "—"}</td>
                <td className="stop" style={{ fontWeight: 400 }}>{r.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {unfilled > 0 && (
        <div className="vec-tile-foot">
          <span>{unfilled} slot{unfilled === 1 ? "" : "s"} still to fill</span>
          <button type="button" className="vec-btn mini solid" onClick={onFill}>Choose resources</button>
        </div>
      )}
    </VectorTile>
  );
}

/* ----------------------------------------------------------------------
   Resources — available units as cards
   ---------------------------------------------------------------------- */
export type ResourceCard = {
  applianceId: string;
  stationId: string;
  callsign: string;
  service: ServiceCode;
  typeCode: string;
  typeName: string;
  station: string;
  crew: string;
  status: StatusCode;
  etaSec: number | null;
  etaEstimated: boolean;
  /** Why this unit cannot be sent; empty when it can. */
  blocked: string;
  /** Advice once it can — "Fills Pump 2", "Nothing outstanding needs it". */
  fit: string;
  cost: { text: string; tone: "off" | "warn" | "stop" };
  deployed: boolean;
};

export function AvailableTile({ layout, area, cards, hasIncident, onMobilise, onPick, onClose, id = "available", title = "Resources" }: { layout: TileLayout; area: Area; cards: ResourceCard[]; hasIncident: boolean; onMobilise: (applianceId: string, stationId: string) => void; onPick: (applianceId: string) => void; onClose: () => void; id?: "available" | "resources"; title?: string }) {
  const [svc, setSvc] = useState<"All" | ServiceCode>("All");
  const [type, setType] = useState("All");
  const scoped = cards.filter((c) => svc === "All" || c.service === svc);
  const types: { code: string; n: number }[] = [];
  for (const c of scoped) {
    const hit = types.find((t) => t.code === c.typeCode);
    if (hit) hit.n += 1;
    else types.push({ code: c.typeCode, n: 1 });
  }
  const shown = scoped.filter((c) => type === "All" || c.typeCode === type);
  const suitable = shown.filter((c) => !c.blocked).length;
  const free = cards.filter((c) => c.status === 7 || c.status === 6).length;
  const n = (s: ServiceCode) => cards.filter((c) => c.service === s).length;
  return (
    <VectorTile id={id} title={title} count={`${free} free`} layout={layout} area={area} onClose={onClose} minWidth={320} minHeight={220}>
      <div className="vec-svctabs">
        {(["All", "Fire", "Ambulance", "Police"] as const).map((k) => (
          <button key={k} type="button" aria-pressed={svc === k} className={k === "Fire" ? "fire" : k === "Ambulance" ? "amb" : k === "Police" ? "pol" : ""} onClick={() => { setSvc(k); setType("All"); }}>
            {k === "All" ? "ALL" : SERVICE_SHORT[k]} {k === "All" ? cards.length : n(k)}
          </button>
        ))}
      </div>
      <div className="vec-chips">
        <span className="k">TYPE</span>
        <button type="button" className="vec-chip" aria-pressed={type === "All"} onClick={() => setType("All")}>ALL<span className="n">{scoped.length}</span></button>
        {types.map((t) => (
          <button key={t.code} type="button" className="vec-chip" aria-pressed={type === t.code} onClick={() => setType(t.code)}>
            {t.code}<span className="n">{t.n}</span>
          </button>
        ))}
      </div>
      <div className="vec-tile-sub">
        <span>{hasIncident ? "Select to allocate · drag onto a live incident" : "Select an incident to assess suitability"}</span>
        <span className={shown.length === 0 ? "stop" : ""}>{shown.length === 0 ? "Nothing on this filter" : `${suitable} suitable · ${shown.length} shown`}</span>
      </div>
      <div className="vec-cards">
        {shown.map((c) => (
          <div
            key={c.applianceId}
            className={`vec-card ${c.blocked ? "blocked" : ""} ${c.deployed ? "deployed" : ""}`}
            draggable={!c.blocked}
            onDragStart={(e) => {
              if (c.blocked) return;
              e.dataTransfer.setData(DRAG_MIME, JSON.stringify({ applianceId: c.applianceId, stationId: c.stationId }));
              e.dataTransfer.effectAllowed = "move";
            }}
          >
            <div className="cs">
              <button type="button" onClick={() => onPick(c.applianceId)} style={{ background: "transparent", border: 0, padding: 0, font: "inherit", color: "inherit", cursor: "pointer" }} title="Open the unit record">
                {c.callsign}
              </button>
              <span className={`st ${c.status === 7 || c.status === 6 ? "go" : c.status === 1 || c.status === 2 ? "warn" : ""}`}>{statusShort(c.status)}</span>
            </div>
            <div className="eta">{c.etaSec === null ? "—" : `ETA ${etaLabel(c.etaSec)}${c.etaEstimated ? " (est)" : ""}`}</div>
            <div className="type">{c.typeName}</div>
            <div className="crew">Crew {c.crew}</div>
            <div className="stn">{c.station}</div>
            <div />
            <div className={`why ${c.blocked ? "" : "ok"}`}>{c.blocked || c.fit}</div>
            <div className="foot">
              <span className={`cost ${c.cost.tone === "off" ? "" : c.cost.tone}`}>{c.cost.text}</span>
              <button type="button" className="go-btn" disabled={!!c.blocked} onClick={() => onMobilise(c.applianceId, c.stationId)}>
                Mobilise
              </button>
            </div>
          </div>
        ))}
      </div>
    </VectorTile>
  );
}

function statusShort(s: StatusCode): string {
  return { 1: "Mobile", 2: "In attendance", 3: "Stop sent", 4: "Returning", 5: "At hospital", 6: "Mobile · available", 7: "Available", 8: "Off the run" }[s];
}

/* ----------------------------------------------------------------------
   County cover, standby, hospitals
   ---------------------------------------------------------------------- */
export type CoverRow = { area: string; detail: string; free: number; of: number };

export function CountyCoverTile({ layout, area, rows, onClose }: { layout: TileLayout; area: Area; rows: CoverRow[]; onClose: () => void }) {
  const none = rows.filter((r) => r.free === 0).length;
  const thin = rows.filter((r) => r.free === 1).length;
  return (
    <VectorTile id="cover" title="County cover" layout={layout} area={area} onClose={onClose} minWidth={260} minHeight={160}>
      <div className="vec-tile-sub">
        <strong>Front-line pumps free</strong>
        <span className={none ? "stop" : thin ? "warn" : "go"}>{none ? `${none} area without cover` : thin ? `${thin} thin` : "All areas covered"}</span>
      </div>
      {rows.map((r) => (
        <div key={r.area} className="vec-row static" style={r.free === 0 ? { background: "var(--vec-stop-tint)" } : r.free === 1 ? { background: "var(--vec-warn-tint)" } : undefined}>
          <span className="bar" style={{ background: r.free === 0 ? "var(--vec-stop)" : r.free === 1 ? "var(--vec-warn)" : "var(--vec-go)" }} />
          <span className="body" style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span>
              <div className="ttl">{r.area}</div>
              <div className="sub">{r.detail}</div>
            </span>
            <span style={{ textAlign: "right" }}>
              <div style={{ font: "700 14px var(--vec-mono)" }}>{r.free}/{r.of}</div>
              <div style={{ font: "700 9px var(--vec-mono)", letterSpacing: ".1em", color: r.free === 0 ? "var(--vec-stop)" : r.free === 1 ? "var(--vec-warn)" : "var(--vec-go)" }}>
                {r.free === 0 ? "NO COVER" : r.free === 1 ? "THIN" : "OK"}
              </div>
            </span>
          </span>
        </div>
      ))}
    </VectorTile>
  );
}

export type StandbyRow = { id: string; callsign: string; from: string; to: string; travel: string; reason: string; sent: boolean };

export function StandbyTile({ layout, area, rows, onSend, onClose }: { layout: TileLayout; area: Area; rows: StandbyRow[]; onSend: (id: string) => void; onClose: () => void }) {
  const sent = rows.filter((r) => r.sent).length;
  return (
    <VectorTile id="standby" title="Standby" layout={layout} area={area} onClose={onClose} minWidth={280} minHeight={160}>
      <div className="vec-tile-sub">
        <strong>Standby moves</strong>
        <span>{rows.length ? `${sent} of ${rows.length} sent` : "Nothing needed"}</span>
      </div>
      {rows.length === 0 ? (
        <div className="vec-tile-empty">No station is empty — no standby moves to make</div>
      ) : (
        rows.map((r) => (
          <div key={r.id} className="vec-row static" style={r.sent ? { background: "var(--vec-go-tint)" } : undefined}>
            <span className="bar" style={{ background: r.sent ? "var(--vec-go)" : "var(--vec-border)" }} />
            <span className="body">
              <span className="line1">
                <span>
                  {r.callsign} <span style={{ fontWeight: 400, color: "var(--vec-text-muted)" }}>{r.from}</span> → {r.to}
                </span>
                <span className="time">{r.travel}</span>
              </span>
              <span className="sub" style={{ whiteSpace: "normal" }}>{r.reason}</span>
              <span style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                <button type="button" className={`vec-btn mini ${r.sent ? "go" : ""}`} disabled={r.sent} onClick={() => onSend(r.id)}>
                  {r.sent ? "MOVING" : "SEND"}
                </button>
              </span>
            </span>
          </div>
        ))
      )}
    </VectorTile>
  );
}

export type HospitalRow = { id: string; name: string; town: string; postcode: string; distKm: number; ed: string; trauma: string; helipad: boolean };

export function HospitalsTile({ layout, area, rows, from, onClose }: { layout: TileLayout; area: Area; rows: HospitalRow[]; from: string; onClose: () => void }) {
  return (
    <VectorTile id="hospitals" title="Hospitals" layout={layout} area={area} onClose={onClose} minWidth={320} minHeight={160}>
      <div className="vec-tile-sub">
        <strong>ED capacity &amp; distance</strong>
        <span>{from ? `From ${from}` : "From the county centre"}</span>
      </div>
      <table className="vec-table">
        <thead>
          <tr><th>Hospital</th><th>Dist</th><th>ED</th><th>Trauma</th></tr>
        </thead>
        <tbody>
          {rows.map((h) => (
            <tr key={h.id}>
              <td>
                <div style={{ fontWeight: 700 }}>{h.name}</div>
                <div className="dim" style={{ fontSize: 10 }}>{h.town} · {h.postcode}{h.helipad ? " · HLS" : ""}</div>
              </td>
              <td className="mono">{h.distKm.toFixed(1)} km</td>
              <td className={h.ed === "24h" ? "go" : "dim"}>{h.ed}</td>
              <td className={h.trauma === "MTC" ? "stop" : ""}>{h.trauma}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="vec-tile-foot">
        <span>Handover times are not live — no NWAS feed is connected.</span>
      </div>
    </VectorTile>
  );
}
