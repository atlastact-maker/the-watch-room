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
import { useEffect, useMemo, useState } from "react";
import { CAD_VARS } from "./cad-theme";
import type { RecordIndex } from "@/lib/sim/records";
import {
  POLICING_PURPOSES,
  addressCheck,
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

/** Monospace everywhere in the readout. A police return lines up because
 *  the font is fixed-width, and half of why it reads as real is that the
 *  label column is genuinely a column. */
const MONO = "font-mono text-[11px] leading-[1.45] tracking-tight";

/** One line of the return: a fixed label column, then the value.
 *  The label is padded in CHARACTERS, not pixels, so it aligns the way a
 *  terminal does. */
function Line({
  label,
  value,
  tone,
}: {
  label: string;
  value?: string | number | null;
  tone?: "plain" | "bad" | "good";
}) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className={MONO + " whitespace-pre-wrap"}>
      <span className="text-(--color-text-dim)">{label.toUpperCase().padEnd(12, " ")}</span>
      <span
        className={
          tone === "bad"
            ? "text-(--color-critical)"
            : tone === "good"
              ? "text-(--color-ok)"
              : "text-(--color-text)"
        }
      >
        {String(value).toUpperCase()}
      </span>
    </div>
  );
}

/** A rule the width of the readout, the way a terminal separates blocks. */
function Rule() {
  return <div className={MONO + " select-none text-(--color-border)"}>{"-".repeat(46)}</div>;
}

/** The warning banner. Full width, inverted, unmissable — this is the bit
 *  a controller reads out before anything else. */
function WarningBanner({ codes }: { codes: string[] }) {
  if (codes.length === 0) return null;
  const hot = codes.some((c) => HOT.has(c));
  return (
    <div
      className={
        MONO +
        " my-1 px-1 py-0.5 font-bold " +
        (hot ? "bg-(--color-critical) text-white" : "bg-(--color-amber) text-white")
      }
    >
      {"*** "}
      {hot ? "WARNING SIGNALS" : "MARKERS"}
      {": "}
      {codes.join(" / ")}
      {" ***"}
    </div>
  );
}

function Return({
  r,
  enquiryRef,
}: {
  r: LedsReturn & { ambiguous?: { id: string; name: string }[] };
  enquiryRef: string;
}) {
  const head =
    r.kind === "vehicle"
      ? "VEHICLE ENQUIRY"
      : r.kind === "address"
        ? "ADDRESS ENQUIRY"
        : "PERSON ENQUIRY";
  const asked = r.kind === "vehicle" ? r.vrm : r.kind === "address" ? r.address : r.name;
  return (
    <div className="border border-(--color-border) bg-(--color-surface) px-2 py-1.5">
      <div className={MONO + " flex justify-between text-(--color-text-dim)"}>
        <span>{head}</span>
        <span>REF {enquiryRef}</span>
      </div>
      <Rule />

      {!r.trace ? (
        <>
          <div className={MONO + " py-0.5 font-bold text-(--color-text)"}>
            {r.ambiguous?.length ? "MULTIPLE TRACE - NOT IDENTIFIED" : "NO TRACE"}
          </div>
          <Line label="Enquiry" value={asked} />
          {r.ambiguous?.length ? (
            <>
              <Rule />
              {r.ambiguous.map((x) => (
                <Line key={x.id} label="Candidate" value={x.name} />
              ))}
              <div className={MONO + " pt-1 text-(--color-text-muted)"}>
                A SURNAME IS NOT AN IDENTIFICATION. NARROW THE ENQUIRY.
              </div>
            </>
          ) : (
            <div className={MONO + " pt-1 text-(--color-text-muted)"}>
              NOTHING HELD. ENQUIRY RECORDED.
            </div>
          )}
          <Rule />
          <div className={MONO + " text-(--color-text-dim)"}>END OF RECORD</div>
        </>
      ) : (
        <>
          <WarningBanner
            codes={
              r.kind === "vehicle"
                ? r.markers.map((m) => m.code)
                : r.kind === "person"
                  ? r.warnings.map((m) => m.code)
                  : // An address shows what is held against anyone at it.
                    [
                      ...new Set([
                        ...r.occupants.flatMap((o) => o.markers.map((m) => m.code)),
                        ...r.vehicles.flatMap((v) => v.markers.map((m) => m.code)),
                      ]),
                    ]
            }
          />
          {r.kind === "vehicle" ? (
            <>
              <Line label="VRM" value={r.vrm} />
              <Line label="Make" value={r.make} />
              <Line label="Model" value={r.model} />
              <Line label="Colour" value={r.colour} />
              <Rule />
              <Line label="Keeper" value={r.keeperName ?? "NOT RECORDED"} />
              <Rule />
              <Line label="Tax" value={r.taxed === false ? "NO TRACE OF TAX" : "APPARENT"} tone={r.taxed === false ? "bad" : "good"} />
              <Line label="MOT" value={r.mot === false ? "NO TRACE OF TEST" : "APPARENT"} tone={r.mot === false ? "bad" : "good"} />
              <Line label="Insurance" value={r.insured === false ? "NO TRACE OF POLICY" : "APPARENT"} tone={r.insured === false ? "bad" : "good"} />
            </>
          ) : r.kind === "person" ? (
            <>
              <Line label="Name" value={r.name} />
              <Line label="Sex" value={r.sex} />
              <Line label="Age" value={r.age} />
              <Line label="DOB" value={r.dob} />
              <Rule />
              <Line label="Address" value={r.address} />
              <Line label="Postcode" value={r.postcode} />
              {(r.wanted || r.missing) && (
                <>
                  <Rule />
                  <Line label="Status" value={r.wanted ? "WANTED" : "REPORTED MISSING"} tone="bad" />
                </>
              )}
            </>
          ) : (
            <>
              <Line label="Address" value={r.address} />
              <Line label="Postcode" value={r.postcode} />
              <Rule />
              <div className={MONO + " text-(--color-text-dim)"}>
                OCCUPANTS ({r.occupants.length})
              </div>
              {r.occupants.map((o, i) => (
                <div key={o.name + i} className={MONO + " whitespace-pre-wrap"}>
                  <span className="text-(--color-text-dim)">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-(--color-text)">
                    {o.name.toUpperCase()}
                    {o.age ? `  ${o.age}` : ""}
                  </span>
                  {o.markers.length > 0 && (
                    <span
                      className={
                        "  font-bold " +
                        (o.markers.some((m) => HOT.has(m.code))
                          ? "text-(--color-critical)"
                          : "text-(--color-amber)")
                      }
                    >
                      {"  "}
                      {o.markers.map((m) => m.code).join(" / ")}
                    </span>
                  )}
                </div>
              ))}
              <Rule />
              <div className={MONO + " text-(--color-text-dim)"}>
                VEHICLES AT ADDRESS ({r.vehicles.length})
              </div>
              {r.vehicles.length === 0 && (
                <div className={MONO + " text-(--color-text-muted)"}>NONE HELD</div>
              )}
              {r.vehicles.map((v, i) => (
                <div key={v.vrm + i} className={MONO + " whitespace-pre-wrap"}>
                  <span className="text-(--color-text-dim)">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-(--color-text)">
                    {v.vrm.padEnd(10)}
                    {[v.make, v.model].filter(Boolean).join(" ")}
                  </span>
                  {v.markers.length > 0 && (
                    <span
                      className={
                        "  font-bold " +
                        (v.markers.some((m) => HOT.has(m.code))
                          ? "text-(--color-critical)"
                          : "text-(--color-amber)")
                      }
                    >
                      {"  "}
                      {v.markers.map((m) => m.code).join(" / ")}
                    </span>
                  )}
                </div>
              ))}
            </>
          )}

          {r.notes.length > 0 && (
            <>
              <Rule />
              {r.notes.map((n, i) => (
                <div key={i} className={MONO + " whitespace-pre-wrap text-(--color-text)"}>
                  <span className="text-(--color-text-dim)">{String(i + 1).padStart(2, "0")}  </span>
                  {n.toUpperCase()}
                </div>
              ))}
            </>
          )}

          <Rule />
          <div className={MONO + " text-(--color-text-dim)"}>END OF RECORD</div>
        </>
      )}
    </div>
  );
}

export function LedsTerminal({
  index,
  activeIncidentId,
  checks,
  onCheck,
  prefill,
  onPrefillUsed,
  onClose,
}: {
  index: RecordIndex;
  activeIncidentId: string | null;
  checks: LedsCheck[];
  onCheck: (c: LedsCheck) => void;
  /** A plate handed over from an ANPR hit. Fills the box and switches to
   *  the vehicle tab, but does NOT run the enquiry — the purpose is the
   *  operator's to choose, and choosing it for them would defeat the
   *  point of asking. */
  prefill?: string | null;
  onPrefillUsed?: () => void;
  onClose?: () => void;
}) {
  const [frame] = useState<Frame>(() => {
    const saved = loadFrame();
    if (saved) return saved;
    const w = typeof window !== "undefined" ? window.innerWidth : 1400;
    const h = typeof window !== "undefined" ? window.innerHeight : 900;
    return { width: 380, height: 520, x: Math.max(12, w - 800), y: Math.max(60, h - 620) };
  });
  const [kind, setKind] = useState<"vehicle" | "person" | "address">("vehicle");
  const [query, setQuery] = useState("");
  // A live job is a purpose in itself, so that is the sensible default.
  const [purpose, setPurpose] = useState<PolicingPurpose>("incident");
  const [reason, setReason] = useState("");
  const [result, setResult] = useState<
    { r: LedsReturn & { ambiguous?: never[] }; ref: string } | null
  >(null);

  useEffect(() => {
    if (!prefill) return;
    setKind("vehicle");
    setQuery(prefill);
    setResult(null);
    onPrefillUsed?.();
  }, [prefill, onPrefillUsed]);

  // Running with no job on the desk and nothing typed is the thing an
  // audit picks out. Say so before it is run, not after.
  const willBeFlagged = !activeIncidentId && !reason.trim();

  const run = () => {
    if (query.trim().length < 2) return;
    const r = (
      kind === "vehicle"
        ? vehicleCheck(index, query)
        : kind === "address"
          ? addressCheck(index, query)
          : personCheck(index, query)
    ) as LedsReturn & { ambiguous?: never[] };
    const at = Date.now();
    const d = new Date(at);
    // Time of the enquiry and its number this shift — the shape of
    // reference a controller would quote back over the air.
    const enquiryRef =
      `${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}` +
      `/${String(checks.length + 1).padStart(4, "0")}`;
    setResult({ r, ref: enquiryRef });
    onCheck({
      id: `leds-${at}-${enquiryRef}`,
      atMs: at,
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
            LEDS · CONTROL ROOM TERMINAL 01
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
          {(["vehicle", "person", "address"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setKind(k);
                setResult(null);
              }}
              className={
                "flex-1 border-r border-(--color-border-subtle) px-2 py-1 font-mono text-[10px] uppercase tracking-widest last:border-r-0 " +
                (kind === k
                  ? "bg-(--color-text) text-(--color-bg)"
                  : "text-(--color-text-dim) hover:bg-(--color-surface-raised)")
              }
            >
              {k === "vehicle" ? "F1 VEH" : k === "person" ? "F2 PER" : "F3 ADR"}
            </button>
          ))}
        </div>

        <div className="space-y-1.5 border-b border-(--color-border-subtle) p-2">
          <label className="block">
            <span className="font-mono text-[9px] uppercase tracking-widest text-(--color-text-dim)">
              Purpose
            </span>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as PolicingPurpose)}
              className="mt-0.5 w-full rounded-none border border-(--color-border) bg-(--color-surface) px-1.5 py-1 font-mono text-[11px] uppercase text-(--color-text)"
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
            placeholder={activeIncidentId ? "NOTE (OPTIONAL)" : "REASON — NO JOB ON THE DESK"}
            className={
              "w-full rounded-none border bg-(--color-surface) px-1.5 py-1 font-mono text-[11px] uppercase text-(--color-text) placeholder:text-(--color-text-dim) " +
              (willBeFlagged ? "border-(--color-amber)" : "border-(--color-border)")
            }
          />

          <div className="flex gap-1.5">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") run();
              }}
              placeholder={
                kind === "vehicle"
                  ? "VRM"
                  : kind === "address"
                    ? "STREET / POSTCODE"
                    : "SURNAME, FORENAME"
              }
              className="min-w-0 flex-1 rounded-none border border-(--color-border) bg-(--color-surface) px-1.5 py-1 font-mono text-[13px] uppercase tracking-wider text-(--color-text) placeholder:tracking-normal placeholder:text-(--color-text-dim)"
            />
            <button
              type="button"
              onClick={run}
              disabled={query.trim().length < 2}
              className="shrink-0 rounded-none border border-(--color-text) bg-(--color-text) px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-(--color-bg) hover:bg-(--color-text-dim) disabled:opacity-30"
            >
              Enquire
            </button>
          </div>

          {willBeFlagged && (
            <p className="font-mono text-[10px] leading-snug text-(--color-amber)">
              NO JOB, NO REASON — THIS ENQUIRY WILL SHOW ON THE AUDIT
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {result ? (
            <Return r={result.r} enquiryRef={result.ref} />
          ) : (
            <p className="px-1 py-3 font-mono text-[11px] text-(--color-text-dim)">
              READY.
            </p>
          )}

          {recent.length > 0 && (
            <>
              <div className="mt-3 border-t border-(--color-border) px-1 pt-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-(--color-text-dim)">
                Audit — this shift ({checks.length})
              </div>
              <ul className="mt-0.5">
                {recent.map((c) => {
                  const flagged = !c.incidentId && !c.reason?.trim();
                  return (
                    <li
                      key={c.id}
                      className="flex items-baseline gap-1 px-1 py-[2px] font-mono text-[10px] leading-snug"
                    >
                      <span
                        className={
                          "shrink-0 " +
                          (flagged ? "font-bold text-(--color-amber)" : "text-(--color-border)")
                        }
                      >
                        {flagged ? "!" : " "}
                      </span>
                      <span className="min-w-0 flex-1 text-(--color-text-muted)">
                        {auditLine(c).replace("LEDS check — ", "").toUpperCase()}
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
