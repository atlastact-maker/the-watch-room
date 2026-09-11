"use client";

// SUBJECT VEHICLE — the desk's view of the car a job is chasing. The
// breadcrumb of camera reads and the direction of travel while nobody
// has eyes on it; the live track, who is holding it and the road ahead
// once somebody has. Units are sent to hold a camera site or a junction
// ahead of it, put on an area search, and — once the track is live —
// given the tactics: a stop, follow and contain, a TPAC box, a stinger,
// tactical contact.

import { useState } from "react";
import type { Task } from "@/lib/sim/incident_types";
import { ANPR_SITES } from "@/lib/sim/anpr";
import { haversineMeters } from "@/lib/sim/eta";
import { nextSite, subjectPosition, compass, type SubjectVehicle, type LatLng } from "@/lib/sim/subject";
import { VectorTile, type TileLayout } from "./tile";

export type SubjectUnit = {
  applianceId: string;
  callsign: string;
  typeName: string;
  phase: "mobile" | "at_incident" | "at_hospital" | "returning" | "home";
  tpac: boolean;
  npas: boolean;
  pos: LatLng | null;
  searchTarget?: { lat: number; lng: number; label: string };
  arrivesAt: number;
  freeCrewIds: string[];
};

export type SubjectTileProps = {
  layout: TileLayout;
  area: { w: number; h: number };
  popped?: boolean;
  onPopOut?: () => void;
  onDock?: () => void;
  onClose: () => void;
  subject: SubjectVehicle | null;
  incidentRef: string;
  now: number;
  units: SubjectUnit[];
  tasks: Task[];
  onRedirect: (applianceId: string, target: { lat: number; lng: number; label: string }) => void;
  onStartTask: (args: { applianceId: string; kind: Task["kind"]; assignedCrewIds: string[]; vehicleVrm?: string }) => void;
  onAbortTask: (taskId: string) => void;
  onFocus: (coords: LatLng) => void;
};

function ago(now: number, at: number): string {
  const s = Math.max(0, Math.floor((now - at) / 1000));
  return s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ${s % 60}s ago`;
}
function hms(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-GB", { hour12: false });
}
function km(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

const TACTICS: { kind: Task["kind"]; label: string; tpac?: boolean; hint: string }[] = [
  { kind: "vehicle_stop", label: "Stop", hint: "Blue lights — compliant or a fail-to-stop" },
  { kind: "follow_contain", label: "Follow", hint: "Stay with it, no lights, hold the track" },
  { kind: "tpac_box", label: "TPAC box", tpac: true, hint: "Two trained cars on the track" },
  { kind: "stinger", label: "Stinger", tpac: true, hint: "Deploy ahead on its road" },
  { kind: "tactical_contact", label: "Contact", tpac: true, hint: "Authorised — ends it" },
];

export function SubjectTile(props: SubjectTileProps) {
  const { layout, area, onClose, subject, now, units, tasks, popped, onPopOut, onDock } = props;
  const [sendTo, setSendTo] = useState<Record<string, string>>({});
  const live = !!subject?.trackLive;
  const pos = subject ? subjectPosition(subject) : null;
  const next = subject ? nextSite(subject) : null;
  const lastPing = subject?.pings[subject.pings.length - 1];
  const stateChip = !subject ? "" : subject.state === "pursuit" ? "PURSUIT" : subject.state === "stopped" ? "STOPPED" : subject.state === "contained" ? "CONTAINED" : subject.state === "gone" ? "GONE" : live ? "TRACK LIVE" : "NOT SIGHTED";
  const tone = !subject ? "" : subject.state === "pursuit" ? "stop" : subject.state === "stopped" || subject.state === "contained" ? "go" : live ? "warn" : "";
  const active = tasks.filter((t) => t.state === "active");
  const taskOf = (u: SubjectUnit, kind: Task["kind"]) => active.find((t) => t.applianceId === u.applianceId && t.kind === kind);
  const ended = !!subject && (subject.state === "stopped" || subject.state === "contained" || subject.state === "gone");
  const targets = [
    ...(lastPing?.siteId ? [{ key: `site:${lastPing.siteId}`, label: `Last read · ${ANPR_SITES.find((s) => s.id === lastPing.siteId)?.name ?? lastPing.siteId}` }] : []),
    ...(next ? [{ key: `site:${next.id}`, label: `Next site · ${next.name} (${km(next.inM)} ahead)` }] : []),
    ...ANPR_SITES.map((s) => ({ key: `site:${s.id}`, label: `${s.road} · ${s.name}` })),
  ].filter((t, i, arr) => arr.findIndex((x) => x.key === t.key) === i);
  const targetCoords = (key: string) => {
    const site = ANPR_SITES.find((s) => `site:${s.id}` === key);
    return site ? { lat: site.coords.lat, lng: site.coords.lng, label: site.name } : null;
  };

  return (
    <VectorTile id="subject" title="Subject vehicle" count={subject ? stateChip : undefined} layout={layout} area={area} onClose={onClose} popped={popped} onPopOut={onPopOut} onDock={onDock} minWidth={360} minHeight={320}>
      {!subject ? (
        <div className="vec-tile-empty">No subject vehicle on this job — an ANPR-raised call or a pursuit carries one</div>
      ) : (
        <div className="vec-subject">
          <div className={`vec-subject-head ${tone}`}>
            <span className="anpr-plate big">{subject.vrm}</span>
            <div className="who">
              <b>{[subject.vehicle.colour, subject.vehicle.make, subject.vehicle.model].filter(Boolean).join(" ") || "Vehicle"}</b>
              <span>{(subject.vehicle.markers ?? []).join(" · ") || "No markers"}</span>
              <em className={tone}>{stateChip}{subject.outcome ? ` · ${subject.outcome}` : ""}</em>
            </div>
          </div>

          <dl className="vec-subject-facts">
            <dt>Last read</dt>
            <dd>{lastPing ? <>{lastPing.label} · {hms(lastPing.at)} <small>({ago(now, lastPing.at)})</small> <button type="button" className="vec-btn" onClick={() => props.onFocus(lastPing.pos)}>Map</button></> : "No camera read yet"}</dd>
            <dt>Direction</dt>
            <dd>{subject.lastSeenHeading !== undefined ? `${compass(subject.lastSeenHeading)} · ${Math.round(subject.lastSeenHeading)}°` : lastPing?.direction ?? "—"}{subject.state === "moving" || subject.state === "pursuit" ? ` · about ${Math.round(subject.speedKph)} km/h` : ""}</dd>
            <dt>Track</dt>
            <dd className={live ? "go" : ""}>{live && pos ? <>Live · held by {subject.trackHeldBy.join(", ") || "camera"} <button type="button" className="vec-btn" onClick={() => props.onFocus(pos.pos)}>Map</button></> : subject.lastSeenAt ? `Not in sight · last seen ${ago(now, subject.lastSeenAt)}` : "Not sighted — cameras only"}</dd>
            <dt>Ahead</dt>
            <dd>{ended ? "—" : next ? <>{next.road} {next.name} in {km(next.inM)} <button type="button" className="vec-btn" onClick={() => props.onFocus(next.coords)}>Map</button></> : subject.routeReady ? "No camera on its road ahead" : "Routing…"}</dd>
          </dl>

          <div className="vec-tile-sub"><strong>UNITS</strong><span>{units.length} committed · send them ahead of it, search the ground, then the tactics once it is in sight</span></div>
          <div className="vec-subject-units">
            {units.length === 0 && <div className="vec-tile-empty">No police units on this job yet — mobilise from Resources</div>}
            {units.map((u) => {
              const searching = taskOf(u, "area_search");
              const attached = TACTICS.map((t) => taskOf(u, t.kind)).find(Boolean);
              const dist = pos && u.pos ? haversineMeters(pos.pos, u.pos) : null;
              const status = u.phase === "mobile"
                ? `En route · ${u.searchTarget ? `to ${u.searchTarget.label}` : "to the last read"} · ${Math.max(0, Math.round((u.arrivesAt - now) / 60000))} min`
                : u.phase === "at_incident"
                  ? u.searchTarget ? `Holding · ${u.searchTarget.label}` : "At the last read"
                  : u.phase.replace(/_/g, " ");
              const pick = sendTo[u.applianceId] ?? targets[0]?.key ?? "";
              return (
                <div key={u.applianceId} className={`vec-subject-unit${attached ? " on" : ""}`}>
                  <div className="row">
                    <b>{u.callsign}</b>
                    <small>{u.typeName}{u.tpac ? " · TPAC" : ""}{u.npas ? " · overhead" : ""}</small>
                    <span className="st">{attached ? `${TACTICS.find((t) => t.kind === attached.kind)?.label} · ${attached.completesAt ? `${Math.max(0, Math.round((attached.completesAt - now) / 1000))}s` : "on the track"}` : searching ? "Area search" : status}{dist !== null && !ended ? ` · ${km(dist)} off` : ""}</span>
                  </div>
                  {!ended && (
                    <div className="row ctl">
                      <select value={pick} onChange={(e) => setSendTo((m) => ({ ...m, [u.applianceId]: e.target.value }))} aria-label={`Send ${u.callsign} to`}>
                        {targets.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                      </select>
                      <button type="button" className="vec-btn" disabled={!pick || !!attached || u.npas} onClick={() => { const c = targetCoords(pick); if (c) props.onRedirect(u.applianceId, c); }}>Send</button>
                      {searching ? (
                        <button type="button" className="vec-btn" onClick={() => props.onAbortTask(searching.id)}>Stop search</button>
                      ) : (
                        <button type="button" className="vec-btn" disabled={!!attached || u.freeCrewIds.length === 0 || u.phase !== "at_incident"} title={u.phase !== "at_incident" ? "Once it has arrived" : "Drive the ground with eyes open"} onClick={() => props.onStartTask({ applianceId: u.applianceId, kind: "area_search", assignedCrewIds: u.freeCrewIds.slice(0, 1), vehicleVrm: subject.vrm })}>Area search</button>
                      )}
                    </div>
                  )}
                  {!ended && live && !u.npas && (
                    <div className="row tactics">
                      {TACTICS.map((t) => {
                        const running = taskOf(u, t.kind);
                        const blocked = !!t.tpac && !u.tpac;
                        return running ? (
                          <button key={t.kind} type="button" className="vec-btn primary" onClick={() => props.onAbortTask(running.id)} title="Abort">{t.label} ✕</button>
                        ) : (
                          <button key={t.kind} type="button" className="vec-btn" disabled={blocked || !!attached || u.freeCrewIds.length === 0 || (dist !== null && dist > 900 && t.kind !== "stinger")} title={blocked ? "Crew not TPAC trained" : dist !== null && dist > 900 ? "Get within sight first" : t.hint} onClick={() => props.onStartTask({ applianceId: u.applianceId, kind: t.kind, assignedCrewIds: u.freeCrewIds.slice(0, 1), vehicleVrm: subject.vrm })}>{t.label}</button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="vec-tile-sub"><strong>TIMELINE</strong><span>{subject.pings.length} reads · {subject.events.length} events</span></div>
          <div className="vec-subject-log">
            {subject.events.length === 0 && <div className="row"><span>{hms(subject.movesAt)}</span><span>Read at the camera · moving off {subject.pings[0]?.direction ?? ""}</span></div>}
            {subject.events.slice(-8).reverse().map((e, i) => (
              <div key={i} className={`row ${e.kind}`}><span>{hms(e.at)}</span><span>{e.text}</span></div>
            ))}
          </div>
        </div>
      )}
    </VectorTile>
  );
}
