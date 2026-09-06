"use client";

// The VECTOR desk — the on-shift screen. Composes the shell chrome, the
// four screens (Dispatch, 999 Call, Mobilising, Ground) and the Dispatch
// workspace's tiles around the simulator's map and its existing panels.
// State lives in the dashboard client; this is the layout.

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ServiceCode } from "@/lib/sim/types";
import type { PendingCall } from "../components/call-stack";
import {
  AlertsStrip,
  BrandStrip,
  CallBanner,
  FocusStrip,
  MenuBar,
  ScreenTabs,
  StatusBar,
  WorkspaceBar,
  useShiftClock,
  type Menu,
  type VectorScreen,
} from "./chrome";
import {
  AttendanceTile,
  AvailableTile,
  CallsTile,
  CountyCoverTile,
  HospitalsTile,
  IncidentDetailsTile,
  LiveIncidentsTile,
  SceneUnitsTile,
  StandbyTile,
} from "./dispatch-tiles";
import { CallScreen } from "./call-screen";
import { MobScreen } from "./mob-screen";
import type { DeskModel } from "./desk-model";
import type { TileId, TileLayout } from "./tile";
import { SERVICE_SHORT, etaLabel } from "./model";
import type { VectorTheme } from "./theme";
import { BasemapSegments } from "./map-controls";

export type TilesState = Partial<Record<TileId, boolean>>;
export type PopProps = { popped: boolean; onPopOut: () => void; onDock: () => void };

export const DEFAULT_TILES: TilesState = { calls: true, live: true, units: true };

const TILE_BUTTONS: { id: TileId; label: string; needsIncident?: boolean }[] = [
  { id: "live", label: "Live incidents" },
  { id: "calls", label: "Calls" },
  { id: "incident", label: "Incident details", needsIncident: true },
  { id: "units", label: "Scene units", needsIncident: true },
  { id: "log", label: "Incident log" },
  { id: "attendance", label: "Attendance", needsIncident: true },
  { id: "available", label: "Resources" },
  { id: "cover", label: "County cover" },
  { id: "standby", label: "Standby" },
  { id: "hospitals", label: "Hospitals" },
];

export function VectorDesk(props: {
  userEmail: string;
  shiftStartedAt: number;
  shiftStartHour: number;
  hasLiveIncident: boolean;
  shiftSaved: boolean;
  theme: VectorTheme;
  onToggleTheme: () => void;
  screen: VectorScreen;
  onScreen: (s: VectorScreen) => void;
  groundAvailable: boolean;
  menus: Menu[];
  lights: { label: string; tone: "go" | "warn" | "off" | "stop" | "none"; title?: string }[];
  model: DeskModel;
  now: number;
  pendingCalls: PendingCall[];
  activeCall: (PendingCall & { answeredAt: number }) | null;
  callsReady: boolean;
  onToggleReady: () => void;
  onAnswerCall: (id: string) => void;
  onDeclineCall: (id: string) => void;
  onCreateFromCall: (call: PendingCall, note: string) => void;
  onEndCall: (call: PendingCall, closedAtDesk: boolean) => void;
  onNote: (text: string) => void;
  onCallNote: (text: string) => void;
  onTestCall: () => void;
  coveredServices: ServiceCode[];
  onSelectIncident: (id: string | null) => void;
  onHandCommandTo: (incidentId: string, applianceId: string) => void;
  onDropAppliance: (incidentId: string, applianceId: string, stationId: string) => void;
  onMobilise: (applianceId: string, stationId: string) => void;
  onStandDown: (applianceId: string) => void;
  onPickAppliance: (applianceId: string) => void;
  onPlaceUnit: (applianceId: string) => void;
  onFillRemaining: () => void;
  onSendStandby: (id: string) => void;
  onOpenBays: (stationId: string) => void;
  tiles: TilesState;
  setTiles: (next: TilesState | ((t: TilesState) => TilesState)) => void;
  layout: TileLayout;
  /** Tiles lifted into their own windows, by id. */
  popped: Record<string, boolean>;
  setPopped: (next: Record<string, boolean> | ((p: Record<string, boolean>) => Record<string, boolean>)) => void;
  logTile: (area: { w: number; h: number }, pop: PopProps) => ReactNode;
  map: ReactNode;
  mapTitle: string;
  mapExtras?: ReactNode;
  legacyPanels?: ReactNode;
  ground?: ReactNode;
  overlays?: ReactNode;
  statusItems: { text: string; tone?: "stop" | "go" | "warn" }[];
  statusMsg: string;
}) {
  const { model, screen, tiles, setTiles, layout } = props;
  const { time, hour } = useShiftClock(props.shiftStartedAt, props.shiftStartHour);

  // Measure the map workspace so tiles can be placed by preset.
  const areaRef = useRef<HTMLDivElement>(null);
  const [area, setArea] = useState({ w: 1400, h: 700 });
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setArea({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setArea({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, [screen]);

  const toggleTile = (id: string) => setTiles((t) => ({ ...t, [id]: !t[id as TileId] }));
  const pop = (id: string): PopProps => ({
    popped: !!props.popped[id],
    onPopOut: () => props.setPopped((p) => ({ ...p, [id]: true })),
    onDock: () => props.setPopped((p) => ({ ...p, [id]: false })),
  });
  const show = (id: TileId) => setTiles((t) => ({ ...t, [id]: true }));
  const hasIncident = !!model.selected;
  const waiting = props.pendingCalls.length;
  const breached = model.calls.filter((c) => c.state === "breached").length;
  const live = model.incidentRows.filter((r) => !r.resolved).length;
  const committed = model.incidentRows.reduce((n, r) => n + r.allocated, 0);
  const deskSummary = `${live} LIVE · ${waiting} WAITING · ${committed} COMMITTED`;
  const banner = props.pendingCalls[0] ?? null;
  const unfilled = model.pda.filter((r) => !r.callsign).length;

  const tabs = [
    { id: "dispatch" as const, label: "Dispatch" },
    { id: "call" as const, label: "999 Call", badge: waiting ? String(waiting) : undefined },
    { id: "mob" as const, label: "Mobilising", disabled: !hasIncident, title: hasIncident ? undefined : "Select or open an incident first" },
    {
      id: "ground" as const,
      label: "Ground",
      disabled: !props.groundAvailable,
      title: props.groundAvailable ? "Open the ground view for the selected incident" : "The ground opens once a live job is selected on the desk",
    },
  ];

  return (
    <div className="cad-application" data-screen={screen}>
      <BrandStrip userEmail={props.userEmail} clock={time} hour={hour} hasLiveIncident={props.hasLiveIncident} shiftSaved={props.shiftSaved} />
      <MenuBar menus={props.menus} lights={props.lights} />
      <ScreenTabs screen={screen} onPick={props.onScreen} tabs={tabs} deskSummary={deskSummary} theme={props.theme} onToggleTheme={props.onToggleTheme} />

      {screen === "dispatch" && (
        <>
          <WorkspaceBar
            tiles={TILE_BUTTONS.map((b) => ({
              id: b.id,
              label: b.label,
              on: !!tiles[b.id] && (!b.needsIncident || hasIncident),
              disabled: b.needsIncident && !hasIncident,
              title: b.needsIncident && !hasIncident ? "Select an incident first" : undefined,
              count: b.id === "calls" && waiting ? String(waiting) : b.id === "live" && live ? String(live) : undefined,
            }))}
            onToggleTile={toggleTile}
            onPreset={(name) => {
              layout.applyPreset(name);
              setTiles(name === "resources" ? { live: true, available: true } : { ...DEFAULT_TILES });
            }}
            onSaveLayout={() => props.onNote(layout.save(tiles as Record<string, boolean>) ? "Workspace layout saved on this device" : "This browser could not save the layout")}
            onRestoreLayout={() => {
              const t = layout.restore();
              if (t) setTiles(t as TilesState);
              props.onNote(t ? "Saved workspace restored" : "No saved workspace yet");
            }}
            snap={layout.snap}
            onToggleSnap={layout.toggleSnap}
            onMapOnly={() => setTiles({})}
            onReset={() => {
              layout.reset();
              setTiles({ ...DEFAULT_TILES });
            }}
          />
          <AlertsStrip
            waiting={waiting}
            pastStandard={breached}
            unfilled={model.unfilledTotal}
            onViewCalls={() => show("calls")}
            onViewIncidents={() => show("live")}
            onTestCall={props.onTestCall}
          />
          {banner && (
            <CallBanner
              title={banner.scenario.title}
              address={banner.scenario.location.address}
              grade={`${SERVICE_SHORT[model.calls[0]?.service ?? "Fire"]} · ${model.calls[0]?.grade ?? ""}`}
              waited={etaLabel(Math.max(0, (props.now - banner.receivedAt) / 1000)).replace("At scene", "0s")}
              onAnswer={() => props.onAnswerCall(banner.id)}
              onOpenStack={() => show("calls")}
            />
          )}
          <FocusStrip
            empty={!model.selected}
            reference={model.selected ? model.refOf(model.selected) : ""}
            severity={model.selected?.scenario.severity ?? "low"}
            title={model.selected?.scenario.title ?? ""}
            address={model.selected ? `${model.selected.scenario.location.address} · ${model.selected.scenario.location.postcode}` : ""}
            units={model.focusUnits}
            onPickUnit={props.onPickAppliance}
            onClear={() => props.onSelectIncident(null)}
            shortage={unfilled ? `${unfilled} attendance slot${unfilled === 1 ? "" : "s"} unfilled` : "Attendance allocated"}
            shortageOk={unfilled === 0}
            note={unfilled ? `Still required: ${model.pda.filter((r) => !r.callsign).map((r) => r.slot).join(" · ")}` : "Review allocation and acknowledgement progress."}
            nextLabel={unfilled ? "Choose resources" : "Track response"}
            onNext={() => props.onScreen("mob")}
          />
          <div className="vec-workspace">
            <div className="vec-mapbar">
              <span className="title">{props.mapTitle}</span>
              <div className="right">
                <BasemapSegments />
                {props.mapExtras}
              </div>
            </div>
            <div className="vec-map-area" ref={areaRef}>
              <div className="map-fill">{props.map}</div>
              {tiles.calls && (
                <CallsTile {...pop("calls")} layout={layout} area={area} calls={model.calls} ready={props.callsReady} onToggleReady={props.onToggleReady} onAnswer={props.onAnswerCall} onDecline={props.onDeclineCall} onClose={() => toggleTile("calls")} />
              )}
              {tiles.live && (
                <LiveIncidentsTile
                  {...pop("live")}
                  layout={layout}
                  area={area}
                  rows={model.incidentRows}
                  now={props.now}
                  onSelect={(id) => props.onSelectIncident(id)}
                  onOpen={(id) => {
                    props.onSelectIncident(id);
                    show("incident");
                  }}
                  onHandCommandTo={props.onHandCommandTo}
                  onDropAppliance={props.onDropAppliance}
                  onClose={() => toggleTile("live")}
                />
              )}
              {tiles.incident && hasIncident && (
                <IncidentDetailsTile {...pop("incident")} layout={layout} area={area} detail={model.detail} onClose={() => toggleTile("incident")} onOpenLog={() => show("log")} />
              )}
              {tiles.units && hasIncident && (
                <SceneUnitsTile {...pop("units")} layout={layout} area={area} rows={model.sceneUnits} onPick={props.onPickAppliance} onPlace={props.onPlaceUnit} onClose={() => toggleTile("units")} groundAvailable={props.groundAvailable} />
              )}
              {tiles.log && props.logTile(area, pop("log"))}
              {tiles.attendance && hasIncident && (
                <AttendanceTile {...pop("attendance")} layout={layout} area={area} rows={model.pda} ref={model.selected ? model.refOf(model.selected) : ""} onClose={() => toggleTile("attendance")} onFill={() => props.onScreen("mob")} />
              )}
              {tiles.available && (
                <AvailableTile {...pop("available")} layout={layout} area={area} cards={model.cards} hasIncident={hasIncident} onMobilise={props.onMobilise} onPick={props.onPickAppliance} onClose={() => toggleTile("available")} />
              )}
              {tiles.cover && <CountyCoverTile {...pop("cover")} layout={layout} area={area} rows={model.cover} onClose={() => toggleTile("cover")} />}
              {tiles.standby && <StandbyTile {...pop("standby")} layout={layout} area={area} rows={model.standby} onSend={props.onSendStandby} onClose={() => toggleTile("standby")} />}
              {tiles.hospitals && (
                <HospitalsTile {...pop("hospitals")} layout={layout} area={area} rows={model.hospitals} from={model.selected ? model.selected.scenario.location.address.split(",")[0] : ""} onClose={() => toggleTile("hospitals")} />
              )}
              {props.legacyPanels}
            </div>
          </div>
        </>
      )}

      {screen === "call" &&
        (props.activeCall ? (
          <CallScreen key={props.activeCall.id} call={props.activeCall} answeredAt={props.activeCall.answeredAt} now={props.now} onCreate={props.onCreateFromCall} onEndCall={props.onEndCall} onNote={props.onCallNote} covered={props.coveredServices} />
        ) : (
          <div className="vec-screen">
            <div className="vec-screen-head">
              <h1>999 Call</h1>
              <span className="mono">{waiting ? `${waiting} waiting` : "No calls waiting"}</span>
            </div>
            <div style={{ padding: 12, maxWidth: 640 }}>
              {model.calls.length === 0 ? (
                <div className="vec-tile-empty">No call on the line. New calls land on the stack and can be answered from here or from Dispatch.</div>
              ) : (
                model.calls.map((c) => (
                  <div key={c.id} className="vec-box" style={{ marginBottom: 8 }}>
                    <div className="vec-row static">
                      <span className={`vec-svc ${c.service}`} />
                      <span className="body">
                        <span className="line1">
                          <span className={`grade ${c.state === "breached" ? "stop" : ""}`}>{SERVICE_SHORT[c.service]} · {c.grade}</span>
                          <span className={`time ${c.state === "breached" ? "stop" : c.state === "warn" ? "warn" : ""}`}>waiting {etaLabel(c.waitedSec).replace("At scene", "0s")}</span>
                        </span>
                        <span className="ttl">{c.title}</span>
                        <span className="sub">{c.address}</span>
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 10px" }}>
                        <button type="button" className="vec-btn" onClick={() => props.onDeclineCall(c.id)}>Close</button>
                        <button type="button" className="vec-btn solid" onClick={() => props.onAnswerCall(c.id)}>Answer call</button>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}

      {screen === "mob" && (
        <MobScreen
          head={model.mobHead}
          pda={model.pda}
          cards={model.cards}
          turnouts={model.turnouts}
          bays={model.bays}
          standby={model.standby}
          now={props.now}
          freeCount={model.freeCount}
          onMobilise={props.onMobilise}
          onStandDown={props.onStandDown}
          onPick={props.onPickAppliance}
          onFillRemaining={props.onFillRemaining}
          onSendStandby={props.onSendStandby}
          onOpenBays={props.onOpenBays}
          onTrack={() => props.onScreen("dispatch")}
        />
      )}

      {screen === "ground" && (
        <div className="vec-workspace">
          {props.ground ?? (
            <div className="vec-tile-empty" style={{ padding: 40 }}>The ground opens once a live job is selected on the desk</div>
          )}
        </div>
      )}

      {props.overlays}

      <StatusBar
        items={[{ text: props.statusMsg || "Ready" }, ...props.statusItems]}
        right={<span className="mono">GAZ OS AddressBase · z17</span>}
      />
    </div>
  );
}
