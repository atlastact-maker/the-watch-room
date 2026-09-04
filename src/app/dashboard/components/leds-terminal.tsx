"use client";

// The LEDS terminal.
//
// Not another search box. The search panel finds things; this one asks the
// police systems a question, and asking has conditions attached. A purpose
// is chosen before the enquiry runs, the enquiry is recorded whether or not
// it found anything, and the audit sits on screen where the operator can
// see what they have been running. That is the whole point of modelling it
// — see leds.ts for what is and is not a claim about the real service.
//
// The return is laid out the way a controller reads one aloud to a crew:
// identity first, then the thing that changes how they approach, then the
// detail. Markers are not a footnote at the bottom.

import { Rnd } from "react-rnd";
import { useMemo, useState } from "react";
import { CAD_VARS } from "./cad-theme";
import type { RecordIndex } from "@/lib/sim/records";
import {
  POLICING_PURPOSES,
  auditLine,
  isHot,
  personCheck,
  vehicleCheck,
  type LedsCheck,
  type LedsReturn,
  type PolicingPurpose,
} from "@/lib/sim/leds";

type Frame = { x: number; y: number; width: number; height: number };
const FRAME_KEY = "twr:leds-frame:v1";
const MIN_W = 340;
const MIN_H = 300;

function loadFrame(): Frame | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FRAME_KEY);
    if (!raw) return null;
    const f = JSON.parse(raw) as Frame;
    if (typeof f.x !== "number" || typeof f.y !== "number") return null;
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
  try {
    window.localStorage.setItem(FRAME_KEY, JSON.stringify(f));
  } catch {
    /* best effort */
  }
}

const HOT = new Set([
  "VIOLENT", "FIREARMS", "WEAPONS", "WANTED", "ESCAPER",
  "STOLEN", "PNC MARKER", "ANPR INTEREST",
]);

function Marker({ code }: { code: string }) {
  const hot = HOT.has(code);
  return (
    <span
      className={
        "px-1 font-mono text-[9px] font-bold uppercase tracking-widest " +
        (hot ? "bg-(--color-critical) text-white" : "bg-(--color-amber)/25 text-(--color-amber)")
      }
    >
      {code}
    </span>
  );
}

/** A yes/no the controller reads out. Absent means the record says nothing,
 *  which is not the same as "in order". */
function Status({ label, ok }: { label: string; ok?: boolean }) {
  if (ok === undefined) return null;
  return (
    <span
      className={
        "font-mono text-[9px] uppercase tracking-widest " +
        (ok ? "text-(--color-ok)" : "text-(--color-critical)")
      }
    >
      {label} {ok ? "OK" : "NO"}
    </span>
  );
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex items-baseline gap-2">
      <span className="w-[74px] shrink-0 font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
        {label}
      </span>
      <span className="min-w-0 flex-1 text-[12px] text-(--color-text)">{value}</span>
    </div>
  );
}

function Return({ r }: { r: LedsReturn & { ambiguous?: { id: string; name: string }[] } }) {
  if (!r.trace) {
    return (
      <div className="border border-(--color-border-subtle) bg-(--color-surface-raised)/40 p-3">
        <div className="font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
          No trace
        </div>
        <p className="mt-1 text-[11px] leading-snug text-(--color-text-muted)">
          {r.ambiguous?.length
            ? "More than one record matches. Narrow it — a surname alone is not an identification."
            : "Nothing held against that. The enquiry is still recorded."}
        </p>
        {r.ambiguous?.length ? (
          <ul className="mt-1.5 space-y-0.5">
            {r.ambiguous.map((p) => (
              <li key={p.id} className="font-mono text-[11px] text-(--color-text)">
                {p.name}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  const hot = isHot(r);
  return (
    <div
      className={
        "border p-3 " +
        (hot
          ? "border-(--color-critical) bg-(--color-critical)/10"
          : "border-(--color-border-subtle) bg-(--color-surface-raised)/40")
      }
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[13px] font-bold text-(--color-text)">
          {r.kind === "vehicle" ? r.vrm : r.name}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-widest text-(--color-ok)">
          Trace
        </span>
      </div>

      {/* What changes how a unit approaches goes second, not last. */}
      {(r.kind === "vehicle" ? r.markers : r.warnings).length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {(r.kind === "vehicle" ? r.markers : r.warnings).map((m) => (
            <Marker key={m.code} code={m.code} />
          ))}
        </div>
      )}
      {r.kind === "person" && (r.wanted || r.missing) && (
        <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-(--color-critical)">
          {r.wanted ? "Wanted" : ""} {r.missing ? "Reported missing" : ""}
        </div>
      )}

      <div className="mt-2 space-y-0.5">
        {r.kind === "vehicle" ? (
          <>
            <Field label="Vehicle" value={[r.make, r.model].filter(Boolean).join(" ")} />
            <Field label="Colour" value={r.colour} />
            <Field label="Keeper" value={r.keeperName} />
            <div className="flex items-baseline gap-2 pt-0.5">
              <span className="w-[74px] shrink-0 font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
                DVLA
              </span>
              <span className="flex flex-wrap gap-2">
                <Status label="Tax" ok={r.taxed} />
                <Status label="MOT" ok={r.mot} />
                <Status label="Ins" ok={r.insured} />
              </span>
            </div>
          </>
        ) : (
          <>
            <Field label="Sex" value={r.sex} />
            <Field label="Age" value={r.age} />
            <Field label="DOB" value={r.dob} />
            <Field label="Address" value={[r.address, r.postcode].filter(Boolean).join(", ")} />
          </>
        )}
      </div>

      {r.notes.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-(--color-border-subtle)/60 pt-2">
          {r.notes.map((n, i) => (
            <li key={i} className="text-[11px] leading-snug text-(--color-text-muted)">
              {n}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function LedsTerminal({
  index,
  activeIncidentId,
  checks,
  onCheck,
  onClose,
}: {
  index: RecordIndex;
  activeIncidentId: string | null;
  checks: LedsCheck[];
  onCheck: (c: LedsCheck) => void;
  onClose?: () => void;
}) {
  const [frame] = useState<Frame>(() => {
    const saved = loadFrame();
    if (saved) return saved;
    const w = typeof window !== "undefined" ? window.innerWidth : 1400;
    const h = typeof window !== "undefined" ? window.innerHeight : 900;
    return { width: 380, height: 520, x: Math.max(12, w - 800), y: Math.max(60, h - 620) };
  });
  const [kind, setKind] = useState<"vehicle" | "person">("vehicle");
  const [query, setQuery] = useState("");
  // A live job is a purpose in itself, so that is the sensible default.
  const [purpose, setPurpose] = useState<PolicingPurpose>("incident");
  const [reason, setReason] = useState("");
  const [result, setResult] = useState<(LedsReturn & { ambiguous?: never[] }) | null>(null);

  // Running with no job on the desk and nothing typed is the thing an
  // audit picks out. Say so before it is run, not after.
  const willBeFlagged = !activeIncidentId && !reason.trim();

  const run = () => {
    if (query.trim().length < 2) return;
    const r =
      kind === "vehicle"
        ? vehicleCheck(index, query)
        : (personCheck(index, query) as LedsReturn & { ambiguous?: never[] });
    setResult(r);
    onCheck({
      id: `leds-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
      atMs: Date.now(),
      kind,
      query,
      purpose,
      incidentId: activeIncidentId,
      reason: reason.trim() || undefined,
      result: r,
    });
  };

  const recent = useMemo(() => [...checks].reverse().slice(0, 12), [checks]);

  return (
    <Rnd
      default={frame}
      minWidth={MIN_W}
      minHeight={MIN_H}
      bounds="parent"
      dragHandleClassName="leds-drag"
      onDragStop={(_e, d) => saveFrame({ ...frame, x: d.x, y: d.y })}
      onResizeStop={(_e, _dir, ref, _delta, pos) =>
        saveFrame({ x: pos.x, y: pos.y, width: ref.offsetWidth, height: ref.offsetHeight })
      }
      style={{ ...CAD_VARS, zIndex: 1200 }}
      className="pointer-events-auto"
    >
      <div className="flex h-full w-full flex-col border border-(--color-border) bg-(--color-bg) text-(--color-text) shadow-2xl">
        <div className="leds-drag flex cursor-move items-center justify-between gap-2 border-b border-(--color-border) px-2 py-1">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-(--color-text-dim)">
            LEDS · police enquiry
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim) hover:text-(--color-text)"
            >
              Close
            </button>
          )}
        </div>

        <div className="flex border-b border-(--color-border-subtle)">
          {(["vehicle", "person"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setKind(k);
                setResult(null);
              }}
              className={
                "flex-1 px-2 py-1 font-mono text-[10px] uppercase tracking-widest " +
                (kind === k
                  ? "bg-(--color-amber)/15 text-(--color-amber)"
                  : "text-(--color-text-dim) hover:bg-(--color-surface-raised)")
              }
            >
              {k}
            </button>
          ))}
        </div>

        <div className="space-y-1.5 border-b border-(--color-border-subtle) p-2">
          <label className="block">
            <span className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
              Policing purpose
            </span>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as PolicingPurpose)}
              className="mt-0.5 w-full border border-(--color-border-subtle) bg-(--color-bg) px-1.5 py-1 text-[12px] text-(--color-text)"
            >
              {Object.entries(POLICING_PURPOSES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={activeIncidentId ? "Note (optional)" : "Reason — no job on the desk"}
            className={
              "w-full border bg-(--color-bg) px-1.5 py-1 text-[12px] text-(--color-text) placeholder:text-(--color-text-dim) " +
              (willBeFlagged ? "border-(--color-amber)/60" : "border-(--color-border-subtle)")
            }
          />

          <div className="flex gap-1.5">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") run();
              }}
              placeholder={kind === "vehicle" ? "Registration" : "SURNAME, Forename"}
              className="min-w-0 flex-1 border border-(--color-border-subtle) bg-(--color-bg) px-1.5 py-1 font-mono text-[13px] uppercase tracking-wider text-(--color-text) placeholder:normal-case placeholder:tracking-normal placeholder:text-(--color-text-dim)"
            />
            <button
              type="button"
              onClick={run}
              disabled={query.trim().length < 2}
              className="shrink-0 border border-(--color-amber)/60 bg-(--color-amber)/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-(--color-amber) hover:bg-(--color-amber)/20 disabled:opacity-40"
            >
              Check
            </button>
          </div>

          {willBeFlagged && (
            <p className="text-[10px] leading-snug text-(--color-amber)">
              No job on the desk and no reason given — this check will show on the audit.
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {result ? (
            <Return r={result} />
          ) : (
            <p className="px-1 py-4 text-center font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
              No enquiry run
            </p>
          )}

          {recent.length > 0 && (
            <>
              <div className="mt-3 border-t border-(--color-border-subtle) px-1 pt-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-(--color-text-dim)">
                Audit · this shift
              </div>
              <ul className="mt-0.5">
                {recent.map((c) => {
                  const flagged = !c.incidentId && !c.reason?.trim();
                  return (
                    <li
                      key={c.id}
                      className="flex items-baseline gap-1.5 px-1 py-[3px] text-[10px] leading-snug"
                    >
                      <span
                        aria-hidden
                        className={
                          "mt-[3px] h-1.5 w-1.5 shrink-0 " +
                          (flagged ? "bg-(--color-amber)" : "bg-(--color-border)")
                        }
                      />
                      <span className="min-w-0 flex-1 text-(--color-text-muted)">
                        {auditLine(c)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>
    </Rnd>
  );
}
