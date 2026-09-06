"use client";

// The Mobilising screen — one job, the attendance it calls for, the units
// that could fill it and the message that goes to them. Attendance slots
// down the left, the whole county's resources as cards in the middle,
// the mobilising message, turnout times and standby cover on the right,
// station bays along the bottom. Every action here is a real simulator
// call: Mobilise deploys, Stand down releases.

import { useState } from "react";
import type { Severity } from "@/lib/sim/incident_types";
import type { ServiceCode, StatusCode } from "@/lib/sim/types";
import type { PdaRow, ResourceCard, StandbyRow } from "./dispatch-tiles";
import { SERVICE_SHORT, etaLabel, hhmmss, mmss } from "./model";

export type MobHead = {
  ref: string;
  title: string;
  address: string;
  postcode: string;
  severity: Severity;
  latlng: string;
  risks: string[];
  typeLabel: string;
};

export type TurnoutRow = {
  applianceId: string;
  callsign: string;
  service: ServiceCode;
  station: string;
  mobilisedAt: number;
  arrivesAt: number;
  status: StatusCode;
  state: string;
  turnoutSec: number | null;
};

export type BayRow = {
  stationId: string;
  id: string;
  name: string;
  service: ServiceCode;
  units: { applianceId: string; callsign: string; state: "in" | "out" | "off" }[];
};

export function MobScreen({
  head,
  pda,
  cards,
  turnouts,
  bays,
  standby,
  now,
  freeCount,
  onMobilise,
  onStandDown,
  onPick,
  onFillRemaining,
  onSendStandby,
  onOpenBays,
  onTrack,
}: {
  head: MobHead | null;
  pda: PdaRow[];
  cards: ResourceCard[];
  turnouts: TurnoutRow[];
  bays: BayRow[];
  standby: StandbyRow[];
  now: number;
  freeCount: number;
  onMobilise: (applianceId: string, stationId: string) => void;
  onStandDown: (applianceId: string) => void;
  onPick: (applianceId: string) => void;
  onFillRemaining: () => void;
  onSendStandby: (id: string) => void;
  onOpenBays: (stationId: string) => void;
  onTrack: () => void;
}) {
  const [svc, setSvc] = useState<"All" | ServiceCode>("All");
  const [type, setType] = useState("All");
  const [bayFilter, setBayFilter] = useState<"All" | ServiceCode>("Fire");

  if (!head) {
    return (
      <div className="vec-screen">
        <div className="vec-screen-head">
          <h1>Mobilisation acknowledgements</h1>
        </div>
        <div className="vec-tile-empty" style={{ padding: 40 }}>Select a live incident on Dispatch, or open one from a call, to mobilise to it</div>
      </div>
    );
  }

  const filled = pda.filter((r) => r.callsign).length;
  const unfilled = pda.length - filled;
  const still = pda.filter((r) => !r.callsign).map((r) => r.slot);
  const mobilised = turnouts.length;
  const scoped = cards.filter((c) => svc === "All" || c.service === svc);
  const types: { code: string; n: number }[] = [];
  for (const c of scoped) {
    const hit = types.find((t) => t.code === c.typeCode);
    if (hit) hit.n += 1;
    else types.push({ code: c.typeCode, n: 1 });
  }
  const shown = scoped.filter((c) => type === "All" || c.typeCode === type);
  const suitable = shown.filter((c) => !c.blocked).length;
  const n = (s: ServiceCode) => cards.filter((c) => c.service === s).length;
  const lastSent = turnouts.reduce<number>((m, t) => Math.max(m, t.mobilisedAt), 0);
  const shownBays = bays.filter((b) => bayFilter === "All" || b.service === bayFilter);

  return (
    <div className="vec-screen" data-screen="mob">
      <div className="vec-screen-head" style={{ display: "block" }}>
        <h1>Mobilisation acknowledgements</h1>
        <p>Allocate a unit and it mobilises on its own message. Stand down releases it back to its station.</p>
      </div>
      <div className="vec-grid mob">
        <div className="vec-mob-head">
          <div>
            <div className="ttl">
              <span className="ref">{head.ref}</span>
              <span className="sev">{head.severity.toUpperCase()}</span>
              <span>{head.title}</span>
            </div>
            <div className="vec-small">{head.address} · {head.postcode}</div>
          </div>
          <div>
            <div className="vec-k">Running order</div>
            <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {turnouts.length === 0 ? (
                <span className="vec-small">Nobody sent yet</span>
              ) : (
                turnouts.map((t, i) => (
                  <span key={t.applianceId} className="vec-chip" aria-pressed="true" style={{ cursor: "default" }}>
                    {i + 1} {t.callsign}
                  </span>
                ))
              )}
              {unfilled > 0 && <span className="vec-chip" style={{ color: "var(--vec-stop)", borderColor: "var(--vec-stop)", cursor: "default" }}>{filled + 1} —</span>}
            </div>
          </div>
          <div>
            <div className="vec-k">Filled</div>
            <div className={`val ${unfilled ? "stop" : "go"}`}>{filled}/{pda.length}</div>
            <div className="vec-small">{unfilled ? `${unfilled} outstanding` : "complete"}</div>
          </div>
          <div>
            <div className="vec-k">Mobilised</div>
            <div className="val">{mobilised}</div>
            <div className="vec-small">mobile or on scene</div>
          </div>
          <div>
            <div className="vec-k">Available</div>
            <div className="val go">{freeCount}</div>
            <div className="vec-small">county-wide</div>
          </div>
          <div>
            <div className="vec-k">First unit standard</div>
            <div className="val" style={{ fontSize: 16 }}>{turnouts.length ? etaLabel(Math.max(0, Math.round((Math.min(...turnouts.map((t) => t.arrivesAt)) - now) / 1000))) : "—"}</div>
            <div className="vec-small">live blue-light estimate</div>
          </div>
        </div>

        {/* Attendance slots */}
        <div className="vec-box">
          <header>
            <span>Attendance slots</span>
            <span className={`mono ${unfilled ? "stop" : "go"}`}>{filled} of {pda.length} · {unfilled ? `${unfilled} short` : "complete"}</span>
          </header>
          <div className="body">
            {pda.map((r) => (
              <div key={r.n} className={`vec-slot ${r.callsign ? "" : "unfilled"}`}>
                <span className="bar" />
                <div className="body">
                  <div className="lbl"><span className="n">{r.n}</span>{r.slot}</div>
                  <div className="cs">{r.callsign ?? "NOT SENT"}</div>
                  {!r.callsign && <div className="why">{r.why}</div>}
                </div>
                <div className="side">
                  <span className={`state ${r.callsign ? (r.status === 2 ? "" : "warn") : "stop"}`}>
                    {r.callsign ? r.state.toUpperCase() : "UNFILLED"}
                  </span>
                  <span>{r.callsign ? r.from : "—"}</span>
                  {r.callsign ? (
                    <button type="button" className="vec-btn mini stop" onClick={() => onStandDown(r.applianceId ?? "")} disabled={!r.applianceId}>
                      STAND DOWN
                    </button>
                  ) : (
                    <span className="vec-chip" style={{ cursor: "default" }}>EMPTY</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="vec-tile-foot">
            <span>Drag a unit from Available onto a live incident, or Mobilise it here</span>
            <button type="button" className="vec-btn mini solid" disabled={unfilled === 0} onClick={onFillRemaining}>
              Fill remaining
            </button>
          </div>
        </div>

        {/* Available — whole county */}
        <div style={{ display: "grid", gridTemplateRows: "minmax(0, 1fr) auto", gap: 6, minHeight: 0 }}>
          <div className="vec-box">
            <header>
              <span>Available — whole county</span>
              <span className="mono">{freeCount} free · select to allocate</span>
            </header>
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
                <button key={t.code} type="button" className="vec-chip" aria-pressed={type === t.code} onClick={() => setType(t.code)}>{t.code}<span className="n">{t.n}</span></button>
              ))}
              <span className="spacer" style={{ flex: 1 }} />
              <span className="k">{suitable} SUITABLE · {shown.length} SHOWN</span>
            </div>
            {still.length > 0 && (
              <div style={{ padding: "8px 12px", background: "var(--vec-warn-tint)", borderBottom: "1px solid var(--vec-border)", fontSize: 12 }}>
                Still required: {still.join(" · ")}
              </div>
            )}
            <div className="vec-cards">
              {shown.map((c) => (
                <div key={c.applianceId} className={`vec-card ${c.blocked ? "blocked" : ""} ${c.deployed ? "deployed" : ""}`}>
                  <div className="cs">
                    <button type="button" onClick={() => onPick(c.applianceId)} style={{ background: "transparent", border: 0, padding: 0, font: "inherit", color: "inherit", cursor: "pointer" }}>{c.callsign}</button>
                    <span className={`st ${c.status === 7 || c.status === 6 ? "go" : c.status === 1 || c.status === 2 ? "warn" : ""}`}>{c.deployed ? "On this job" : c.status === 7 ? "Available" : c.status === 6 ? "Mobile · available" : c.status === 1 ? "Mobile" : c.status === 2 ? "In attendance" : c.status === 8 ? "Off the run" : "Busy"}</span>
                  </div>
                  <div className="eta">{c.etaSec === null ? "—" : `ETA ${etaLabel(c.etaSec)}`}</div>
                  <div className="type">{c.typeName}</div>
                  <div className="crew">Crew {c.crew}</div>
                  <div className="stn">{c.station}</div>
                  <div />
                  <div className={`why ${c.blocked ? "" : "ok"}`}>{c.blocked || c.fit}</div>
                  <div className="foot">
                    <span className={`cost ${c.cost.tone === "off" ? "" : c.cost.tone}`}>{c.cost.text}</span>
                    {c.deployed ? (
                      <button type="button" className="vec-btn stop" onClick={() => onStandDown(c.applianceId)}>Stand down</button>
                    ) : (
                      <button type="button" className="go-btn" disabled={!!c.blocked} onClick={() => onMobilise(c.applianceId, c.stationId)}>Allocate &amp; send</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="vec-box" style={{ maxHeight: 230 }}>
            <header>
              <span>Station bays</span>
              <span className="mono" style={{ display: "flex", gap: 4 }}>
                {(["Fire", "Ambulance", "Police", "All"] as const).map((k) => (
                  <button key={k} type="button" className="vec-chip" aria-pressed={bayFilter === k} onClick={() => setBayFilter(k)}>{k === "All" ? "ALL" : SERVICE_SHORT[k]}</button>
                ))}
                <span style={{ marginLeft: 6 }}>{shownBays.length} stations</span>
              </span>
            </header>
            <div className="body">
              <div className="vec-bays">
                {shownBays.map((b) => {
                  const inBay = b.units.filter((u) => u.state === "in").length;
                  const empty = inBay === 0 && b.units.some((u) => u.state !== "off");
                  return (
                    <div key={b.stationId} className={`vec-bay ${empty ? "empty" : ""}`} onDoubleClick={() => onOpenBays(b.stationId)} title="Double-click to look inside the station">
                      <div className="hd"><b>{b.id}</b><span>{b.name}</span></div>
                      <div className="units">
                        {b.units.map((u) => (
                          <button key={u.applianceId} type="button" className={`unit ${u.state === "out" ? "out" : u.state === "off" ? "off" : ""}`} onClick={() => onPick(u.applianceId)}>{u.callsign}</button>
                        ))}
                      </div>
                      <div className="note">{empty ? "STATION EMPTY" : `${inBay} of ${b.units.length} in the bay`}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "grid", gridTemplateRows: "auto minmax(0, 1fr) auto", gap: 6, minHeight: 0 }}>
          <div className="vec-box dark-strip">
            <header style={{ background: "transparent", color: "#dbe6ef", borderColor: "#2b4358" }}>
              <span>Mobilising message</span>
              <span className="mono" style={{ color: unfilled ? "#ff8a80" : "#7fd1a3" }}>{unfilled ? `${unfilled} slot${unfilled === 1 ? "" : "s"} outstanding` : "complete"}</span>
            </header>
            <div className="vec-msg">
              <span className="k">TO</span><span>{turnouts.length ? Array.from(new Set(turnouts.map((t) => t.station))).join(", ") : "—"}</span>
              <span className="k">INCIDENT</span><span>{head.ref}</span>
              <span className="k">TYPE</span><span className="stop">{head.title.toUpperCase()}</span>
              <span className="k">ADDRESS</span><span>{head.address}<br />{head.postcode}</span>
              <span className="k">GRID</span><span>{head.latlng}</span>
              <span className="k">ATTEND</span><span className="warn">{turnouts.length ? turnouts.map((t) => t.callsign).join(", ") : "nobody yet"}</span>
              <span className="k">RISK</span><span className="warn">{head.risks.length ? head.risks.join(" · ") : "none recorded"}</span>
              <span className="k">SENT</span><span>{lastSent ? hhmmss(lastSent) : "not sent"}</span>
            </div>
            <div className="vec-tile-foot" style={{ borderColor: "#2b4358", color: "#8ea3b5" }}>
              <span>Messages go on allocation — each unit acknowledges on its own MDT.</span>
              <button type="button" className="vec-btn mini" onClick={onTrack}>Track response</button>
            </div>
          </div>
          <div className="vec-box">
            <header>
              <span>Turnout times</span>
              <span className="mono">{turnouts.length} sent · elapsed to mobile</span>
            </header>
            <div className="body">
              {turnouts.length === 0 ? (
                <div className="vec-tile-empty">Nothing sent yet</div>
              ) : (
                <table className="vec-table">
                  <thead><tr><th>Unit</th><th>Sent</th><th>Turnout</th><th>STC</th><th>ETA</th></tr></thead>
                  <tbody>
                    {turnouts.map((t) => (
                      <tr key={t.applianceId}>
                        <td className="mono"><span className={`vec-svc-pill ${t.service}`} style={{ marginRight: 6 }}>{SERVICE_SHORT[t.service][0]}</span>{t.callsign}</td>
                        <td className="dim">{hhmmss(t.mobilisedAt)}</td>
                        <td>{t.turnoutSec === null ? "—" : etaLabel(t.turnoutSec)}</td>
                        <td><span className={`vec-stc s${t.status}`}>{t.status}</span></td>
                        <td className={t.status === 2 ? "go" : ""}>{t.status === 2 ? "At scene" : mmss(Math.max(0, t.arrivesAt - now))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div className="vec-box" style={{ maxHeight: 260 }}>
            <header>
              <span>Standby cover</span>
              <span className="mono">{standby.filter((s) => s.sent).length} of {standby.length} sent</span>
            </header>
            <div className="body">
              {standby.length === 0 ? (
                <div className="vec-tile-empty">No station left empty</div>
              ) : (
                standby.map((r) => (
                  <div key={r.id} className="vec-row static">
                    <span className="body">
                      <span className="line1">
                        <span>{r.callsign} <span style={{ fontWeight: 400, color: "var(--vec-text-muted)" }}>{r.from}</span> → {r.to}</span>
                        <span className="time">{r.travel}</span>
                      </span>
                      <span className="sub" style={{ whiteSpace: "normal" }}>{r.reason}</span>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", padding: "0 9px" }}>
                      <button type="button" className={`vec-btn mini ${r.sent ? "go" : ""}`} disabled={r.sent} onClick={() => onSendStandby(r.id)}>{r.sent ? "MOVING" : "SEND"}</button>
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
