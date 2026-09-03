"use client";

// The desk's search: people, vehicles, addresses. A control room does
// not search the map; it searches records and the map shows the answer.
//
// Three tabs. PERSON and VEHICLE search the record index — the people
// and vehicles every scenario names, the fleet and its crews. ADDRESS
// searches the index's places (stations, hospitals, the jobs on the
// stack, every scenario's premises) and, when the local hits run thin,
// asks Ordnance Survey Names for the real streets, postcodes and
// landmarks of Greater Manchester. Picking a result puts the map there,
// selects the unit, or opens the record.
//
// Same frame behaviour as the other desk panels: draggable, resizable,
// remembered between shifts, never restored off-screen.

import { Rnd } from "react-rnd";
import { useEffect, useMemo, useRef, useState } from "react";
import { CAD_VARS } from "./cad-theme";
import {
  searchRecords,
  type PersonRecord,
  type PlaceRecord,
  type RecordIndex,
  type SearchHit,
  type SearchKind,
  type VehicleRecord,
} from "@/lib/sim/records";

type Frame = { x: number; y: number; width: number; height: number };
const FRAME_KEY = "twr:search-frame:v1";
const MIN_W = 320;
const MIN_H = 260;

function loadFrame(): Frame | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FRAME_KEY);
    if (!raw) return null;
    const f = JSON.parse(raw) as Frame;
    if (
      typeof f.x !== "number" ||
      typeof f.y !== "number" ||
      typeof f.width !== "number" ||
      typeof f.height !== "number"
    ) {
      return null;
    }
    return {
      width: Math.max(MIN_W, Math.min(f.width, window.innerWidth)),
      height: Math.max(MIN_H, Math.min(f.height, window.innerHeight)),
      x: Math.max(0, Math.min(f.x, window.innerWidth - 160)),
      y: Math.max(0, Math.min(f.y, window.innerHeight - 100)),
    };
  } catch {
    return null;
  }
}

function saveFrame(f: Frame): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FRAME_KEY, JSON.stringify(f));
  } catch {
    // best-effort
  }
}

type LiveHit = {
  name: string;
  type: string;
  address: string;
  postcode?: string;
  lat: number;
  lng: number;
};

const TABS: { kind: SearchKind; label: string; placeholder: string }[] = [
  { kind: "person", label: "Person", placeholder: "Surname, forename · phone · address" },
  { kind: "vehicle", label: "Vehicle", placeholder: "VRM · make / model · keeper" },
  { kind: "place", label: "Address", placeholder: "Street · postcode · premises · station" },
];

// Markers a control room colours. Anything else prints neutral.
const HOT_MARKERS = new Set([
  "VIOLENT",
  "FIREARMS",
  "WEAPONS",
  "WANTED",
  "ESCAPER",
  "STOLEN",
  "PNC MARKER",
  "ANPR INTEREST",
]);
const WARM_MARKERS = new Set([
  "DRUGS",
  "MENTAL HEALTH",
  "SELF HARM",
  "MEDICAL",
  "MISSING",
  "VULNERABLE",
  "CHILD",
  "CONTAGIOUS",
  "ALLERGY",
  "NO INSURANCE",
  "NO MOT",
  "NO TAX",
  "DISQUALIFIED KEEPER",
  "HAZMAT",
  "ABANDONED",
]);

function MarkerChip({ m }: { m: string }) {
  const tone = HOT_MARKERS.has(m)
    ? "border-(--color-critical)/60 bg-(--color-critical)/10 text-(--color-critical)"
    : WARM_MARKERS.has(m)
      ? "border-(--color-amber)/60 bg-(--color-amber)/10 text-(--color-amber)"
      : "border-(--color-border) text-(--color-text-dim)";
  return (
    <span className={"rounded-sm border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest " + tone}>
      {m}
    </span>
  );
}

export function SearchPanel({
  index,
  onFocusPlace,
  onSelectAppliance,
  onOpenStationBays,
  onSelectIncident,
  onClose,
}: {
  index: RecordIndex;
  onFocusPlace: (lat: number, lng: number, zoom?: number) => void;
  onSelectAppliance: (applianceId: string) => void;
  onOpenStationBays: (stationId: string) => void;
  onSelectIncident: (incidentId: string) => void;
  onClose: () => void;
}) {
  const [frame] = useState<Frame>(() => {
    const saved = loadFrame();
    if (saved) return saved;
    const w = typeof window !== "undefined" ? window.innerWidth : 1400;
    return { x: Math.max(16, Math.round(w / 2 - 190)), y: 96, width: 380, height: 480 };
  });
  const current = useRef<Frame>(frame);
  const [kind, setKind] = useState<SearchKind>("person");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<SearchHit | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [kind]);

  const hits = useMemo(() => searchRecords(index, kind, query), [index, kind, query]);

  // Live address lookup — only on the Address tab, only once the typed
  // text is worth a request, and only after the operator has paused.
  const [live, setLive] = useState<LiveHit[]>([]);
  const [liveState, setLiveState] = useState<"idle" | "loading" | "unavailable">("idle");
  useEffect(() => {
    if (kind !== "place" || query.trim().length < 3) {
      setLive([]);
      setLiveState("idle");
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setLiveState("loading");
      fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`, { signal: ctrl.signal })
        .then(async (r) => {
          if (!r.ok) throw new Error(String(r.status));
          const body = (await r.json()) as { results?: LiveHit[] };
          setLive(body.results ?? []);
          setLiveState("idle");
        })
        .catch((e) => {
          if ((e as Error).name === "AbortError") return;
          setLive([]);
          setLiveState("unavailable");
        });
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [kind, query]);

  function pick(h: SearchHit) {
    setOpen(h);
    if (h.kind === "place") {
      const p = h.record;
      onFocusPlace(p.coords.lat, p.coords.lng, p.kind === "station" || p.kind === "hospital" ? 15 : 16);
      if (p.incidentId) onSelectIncident(p.incidentId);
    } else if (h.kind === "vehicle" && h.record.applianceId) {
      onSelectAppliance(h.record.applianceId);
    } else if (h.kind === "person" && h.record.applianceId) {
      onSelectAppliance(h.record.applianceId);
    }
  }

  const tab = TABS.find((t) => t.kind === kind)!;

  return (
    <Rnd
      default={frame}
      minWidth={MIN_W}
      minHeight={MIN_H}
      dragHandleClassName="search-drag"
      onDragStop={(_e, d) => {
        current.current = { ...current.current, x: d.x, y: d.y };
        saveFrame(current.current);
      }}
      onResizeStop={(_e, _dir, ref, _delta, pos) => {
        current.current = { x: pos.x, y: pos.y, width: ref.offsetWidth, height: ref.offsetHeight };
        saveFrame(current.current);
      }}
      style={{ zIndex: 1188 }}
      className="pointer-events-auto"
    >
      <div
        style={CAD_VARS}
        className="flex h-full w-full flex-col overflow-hidden rounded-sm border-2 border-zinc-500 bg-(--color-bg) text-(--color-text) shadow-2xl shadow-black/60"
      >
        {/* Title bar */}
        <div className="search-drag flex cursor-move items-stretch justify-between bg-[#4338ca] font-mono text-[11px] font-bold text-white">
          <div className="flex min-w-0 items-center gap-1.5 px-3 py-1 tracking-[0.15em]">
            <span aria-hidden>⌕</span>
            <span className="truncate uppercase">Search</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Hide search"
            className="flex items-center bg-[#3730a3] px-3 transition-colors hover:bg-[#dc2626]"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-(--color-border-subtle)">
          {TABS.map((t) => (
            <button
              key={t.kind}
              type="button"
              onClick={() => {
                setKind(t.kind);
                setOpen(null);
              }}
              className={
                "flex-1 px-2 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors " +
                (t.kind === kind
                  ? "bg-[#b45309] text-white"
                  : "text-(--color-text-dim) hover:bg-(--color-surface-raised) hover:text-(--color-text)")
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Query */}
        <div className="border-b border-(--color-border-subtle) p-2">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(null);
            }}
            placeholder={tab.placeholder}
            spellCheck={false}
            autoComplete="off"
            className="h-9 w-full rounded-sm border border-(--color-border) bg-(--color-surface) px-2.5 font-mono text-[12px] text-(--color-text) outline-none placeholder:text-(--color-text-dim) focus:border-(--color-amber)"
          />
        </div>

        {/* Results / record */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {open ? (
            <RecordCard hit={open} index={index} onBack={() => setOpen(null)} onFocusPlace={onFocusPlace} onOpenStationBays={onOpenStationBays} onSelectAppliance={onSelectAppliance} />
          ) : query.trim().length < 2 ? (
            <p className="px-3 py-4 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
              Type to search {tab.label.toLowerCase()} records
            </p>
          ) : (
            <ul>
              {hits.map((h) => (
                <li key={h.kind + ":" + h.record.id}>
                  <button
                    type="button"
                    onClick={() => pick(h)}
                    className="flex w-full items-start gap-2 border-b border-(--color-border-subtle)/60 px-3 py-2 text-left hover:bg-(--color-surface-raised)"
                  >
                    <HitRow hit={h} />
                  </button>
                </li>
              ))}
              {kind === "place" && (
                <>
                  {live.map((p, i) => (
                    <li key={"live:" + i}>
                      <button
                        type="button"
                        onClick={() => onFocusPlace(p.lat, p.lng, 16)}
                        className="flex w-full items-start gap-2 border-b border-(--color-border-subtle)/60 px-3 py-2 text-left hover:bg-(--color-surface-raised)"
                      >
                        <span className="mt-0.5 shrink-0 rounded-sm border border-(--color-info)/50 px-1 font-mono text-[9px] uppercase tracking-widest text-(--color-info)">
                          OS
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[12px] font-semibold">{p.name}</span>
                          <span className="block truncate font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
                            {p.type}
                            {p.address ? ` · ${p.address}` : ""}
                            {p.postcode ? ` · ${p.postcode}` : ""}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                  {liveState === "loading" && (
                    <li className="px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
                      Asking OS Names…
                    </li>
                  )}
                  {liveState === "unavailable" && (
                    <li className="px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
                      Live address lookup unavailable — records only
                    </li>
                  )}
                </>
              )}
              {hits.length === 0 && live.length === 0 && liveState !== "loading" && (
                <li className="px-3 py-4 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
                  No trace
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </Rnd>
  );
}

function HitRow({ hit }: { hit: SearchHit }) {
  if (hit.kind === "person") {
    const p = hit.record;
    return (
      <>
        <span className="mt-0.5 shrink-0 rounded-sm border border-(--color-border) px-1 font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
          {p.roles[0] ?? "person"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12px] font-semibold">{p.name}</span>
          <span className="block truncate font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
            {[p.sex, p.age !== undefined ? `${p.age}` : p.dob, p.address].filter(Boolean).join(" · ")}
          </span>
        </span>
        {p.markers && p.markers.length > 0 && (
          <span className="flex shrink-0 flex-wrap justify-end gap-1">
            {p.markers.slice(0, 2).map((m) => (
              <MarkerChip key={m} m={m} />
            ))}
          </span>
        )}
      </>
    );
  }
  if (hit.kind === "vehicle") {
    const v = hit.record;
    return (
      <>
        <span className="mt-0.5 shrink-0 rounded-sm border border-(--color-text)/60 bg-[#facc15] px-1.5 font-mono text-[11px] font-bold tracking-widest text-black">
          {v.vrm}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12px] font-semibold">
            {[v.colour, v.make, v.model].filter(Boolean).join(" ")}
          </span>
          <span className="block truncate font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
            {v.keeperName ?? (v.notes?.[0] ?? "")}
          </span>
        </span>
        {v.markers && v.markers.length > 0 && (
          <span className="flex shrink-0 flex-wrap justify-end gap-1">
            {v.markers.slice(0, 2).map((m) => (
              <MarkerChip key={m} m={m} />
            ))}
          </span>
        )}
      </>
    );
  }
  const p = hit.record;
  return (
    <>
      <span className="mt-0.5 shrink-0 rounded-sm border border-(--color-border) px-1 font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
        {p.kind}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] font-semibold">{p.name}</span>
        <span className="block truncate font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
          {[p.address, p.postcode].filter(Boolean).join(" · ")}
        </span>
      </span>
    </>
  );
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex gap-2 text-[12px]">
      <dt className="w-20 shrink-0 font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">{label}</dt>
      <dd className="min-w-0 flex-1 break-words">{value}</dd>
    </div>
  );
}

function RecordCard({
  hit,
  index,
  onBack,
  onFocusPlace,
  onOpenStationBays,
  onSelectAppliance,
}: {
  hit: SearchHit;
  index: RecordIndex;
  onBack: () => void;
  onFocusPlace: (lat: number, lng: number, zoom?: number) => void;
  onOpenStationBays: (stationId: string) => void;
  onSelectAppliance: (applianceId: string) => void;
}) {
  const header = (title: string, sub?: string) => (
    <div className="flex items-start gap-2 border-b border-(--color-border-subtle) px-3 py-2">
      <button
        type="button"
        onClick={onBack}
        className="shrink-0 rounded-sm border border-(--color-border) px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim) hover:border-(--color-amber) hover:text-(--color-amber)"
      >
        ‹ Back
      </button>
      <div className="min-w-0">
        <div className="truncate text-[13px] font-semibold">{title}</div>
        {sub && (
          <div className="truncate font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">{sub}</div>
        )}
      </div>
    </div>
  );

  if (hit.kind === "person") {
    const p: PersonRecord = hit.record;
    const vehicles = (p.vehicleIds ?? [])
      .map((id) => index.vehicles.find((v) => v.id === id))
      .filter((v): v is VehicleRecord => !!v);
    return (
      <div>
        {header(p.name, p.roles.join(" · "))}
        {p.markers && p.markers.length > 0 && (
          <div className="flex flex-wrap gap-1 border-b border-(--color-border-subtle) px-3 py-2">
            {p.markers.map((m) => (
              <MarkerChip key={m} m={m} />
            ))}
          </div>
        )}
        <dl className="space-y-1 px-3 py-2">
          <Field label="Sex" value={p.sex} />
          <Field label="Age" value={p.age} />
          <Field label="DOB" value={p.dob} />
          <Field label="Address" value={[p.address, p.postcode].filter(Boolean).join(", ")} />
          <Field label="Phone" value={p.phone} />
        </dl>
        {vehicles.length > 0 && (
          <div className="border-t border-(--color-border-subtle) px-3 py-2">
            <div className="mb-1 font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">Vehicles</div>
            <ul className="space-y-1">
              {vehicles.map((v) => (
                <li key={v.id} className="flex items-center gap-2 text-[12px]">
                  <span className="rounded-sm border border-(--color-text)/60 bg-[#facc15] px-1.5 font-mono text-[10px] font-bold tracking-widest text-black">{v.vrm}</span>
                  <span className="truncate">{[v.colour, v.make, v.model].filter(Boolean).join(" ")}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {p.notes && p.notes.length > 0 && (
          <div className="border-t border-(--color-border-subtle) px-3 py-2">
            <div className="mb-1 font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">Record</div>
            <ul className="space-y-1 text-[12px] leading-snug">
              {p.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        )}
        {p.applianceId && (
          <div className="px-3 py-2">
            <button
              type="button"
              onClick={() => onSelectAppliance(p.applianceId!)}
              className="rounded-sm border border-(--color-amber)/60 bg-(--color-amber)/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-(--color-amber) hover:bg-(--color-amber)/20"
            >
              Show their unit
            </button>
          </div>
        )}
      </div>
    );
  }

  if (hit.kind === "vehicle") {
    const v: VehicleRecord = hit.record;
    const keeper = v.keeperId ? index.people.find((p) => p.id === v.keeperId) : undefined;
    return (
      <div>
        {header(v.vrm, [v.colour, v.make, v.model].filter(Boolean).join(" "))}
        {v.markers && v.markers.length > 0 && (
          <div className="flex flex-wrap gap-1 border-b border-(--color-border-subtle) px-3 py-2">
            {v.markers.map((m) => (
              <MarkerChip key={m} m={m} />
            ))}
          </div>
        )}
        <dl className="space-y-1 px-3 py-2">
          <Field label="Keeper" value={keeper?.name ?? v.keeperName} />
          <Field label="Keeper addr" value={keeper ? [keeper.address, keeper.postcode].filter(Boolean).join(", ") : undefined} />
        </dl>
        {v.notes && v.notes.length > 0 && (
          <div className="border-t border-(--color-border-subtle) px-3 py-2">
            <div className="mb-1 font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">Record</div>
            <ul className="space-y-1 text-[12px] leading-snug">
              {v.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        )}
        {v.applianceId && (
          <div className="px-3 py-2">
            <button
              type="button"
              onClick={() => onSelectAppliance(v.applianceId!)}
              className="rounded-sm border border-(--color-amber)/60 bg-(--color-amber)/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-(--color-amber) hover:bg-(--color-amber)/20"
            >
              Show on the board
            </button>
          </div>
        )}
      </div>
    );
  }

  const p: PlaceRecord = hit.record;
  return (
    <div>
      {header(p.name, p.kind)}
      <dl className="space-y-1 px-3 py-2">
        <Field label="Address" value={[p.address, p.postcode].filter(Boolean).join(", ")} />
      </dl>
      {p.notes && p.notes.length > 0 && (
        <div className="border-t border-(--color-border-subtle) px-3 py-2">
          <div className="mb-1 font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">Premises</div>
          <ul className="space-y-1 text-[12px] leading-snug">
            {p.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => onFocusPlace(p.coords.lat, p.coords.lng, 16)}
          className="rounded-sm border border-(--color-amber)/60 bg-(--color-amber)/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-(--color-amber) hover:bg-(--color-amber)/20"
        >
          Show on map
        </button>
        {p.stationId && (
          <button
            type="button"
            onClick={() => onOpenStationBays(p.stationId!)}
            className="rounded-sm border border-(--color-border) px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim) hover:border-(--color-amber) hover:text-(--color-amber)"
          >
            Open bays
          </button>
        )}
      </div>
    </div>
  );
}
