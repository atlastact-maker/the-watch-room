"use client";

// The 999 Call screen — the call in hand, laid out the way VECTOR takes
// one: the caller and the handover along the top, the location fixes and
// the confirmation on the left, the triage with the running dialogue in
// the centre, the incident type, other services and the send controls on
// the right.
//
// The caller is the scenario's `call` script when it has one: their own
// words, answers in their voice, follow-ups that open as they answer,
// things they blurt out as the timer runs, and a state — calm, anxious,
// panicking, hostile, confused — that decides whether they can answer at
// all until the operator brings them down. A job without a script still
// takes a call from its own fields.
//
// Nothing touches the simulator until the operator sends. SEND AND STAY
// ON THE LINE opens the job and keeps the caller talking; CREATE INCIDENT
// opens it and goes to Mobilising.

import { variantAllows } from "@/lib/sim/scene";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ServiceCode } from "@/lib/sim/types";
import { labelForType } from "@/lib/sim/pda";
import { OPENING_CODES, OPENING_SCHEME, openingCodeFits, openingCodeLabel, quickPickOpeningCodes } from "@/lib/sim/opening_codes";
import { scenarioServices } from "@/lib/sim/coverage";
import { CALL_QUESTIONS, GRADE_LABELS, deflectionFor, keyQuestionsFor, reassuranceFor, type CallAnswer, type CallEffect, type CallerState } from "@/lib/sim/call_script";
import type { PendingCall } from "../components/call-stack";
import { SERVICE_SHORT, gradeMeaning, gradeShort, hhmmss, impliedGrade, mmss, scenarioService, shortAddress } from "./model";
import { CopyButton } from "./copy-button";

const CallLocationMap = dynamic(() => import("./call-location-map").then((m) => m.CallLocationMap), {
  ssr: false,
  loading: () => <div className="vec-map-empty">LOADING MAP…</div>,
});

type Line = { at: number; who: "BT" | "OP" | "CALR" | "SYS"; text: string; tone?: "urgent" | "critical" };
type Askable = { id: string; group: string; text: string; key: boolean; follow: boolean; answer: CallAnswer };

/** What the desk keeps from the call once it is over. */
export type CallSummary = {
  asked: string[];
  askedTotal: number;
  missedKey: { id: string; text: string }[];
  preAlerted: boolean;
  durationSec: number;
  callerState: CallerState;
  dropped: boolean;
  grade: string;
  /** The opening code keyed (NICL / IRS / AMPDS), or null if none was. */
  openingCode: string | null;
  /** Whether that code fits the nature the scenario was built on. */
  openingCodeFits: boolean;
};

const STATE_LABEL: Record<CallerState, string> = { calm: "Calm", anxious: "Anxious", panicking: "Panicking", hostile: "Hostile", confused: "Confused" };
const STATE_TONE: Record<CallerState, string> = { calm: "go", anxious: "warn", panicking: "stop", hostile: "stop", confused: "warn" };

export function CallScreen({
  call,
  answeredAt,
  now,
  opened,
  onCreate,
  onPreAlert,
  onFinish,
  onEndCall,
  onNote,
  covered,
}: {
  call: PendingCall;
  /** When the operator picked the call up — the call timer runs from here. */
  answeredAt: number;
  now: number;
  /** The job has already been sent from this call; the caller is still on. */
  opened?: boolean;
  /** Open the incident from this call and go to Mobilising. */
  onCreate: (call: PendingCall, note: string, summary: CallSummary) => void;
  /** Open the incident and keep the caller on the line. */
  onPreAlert: (call: PendingCall, note: string) => void;
  /** Put the phone down on a job already sent, and go to Mobilising. */
  onFinish: (call: PendingCall, summary: CallSummary) => void;
  /** Put the phone down with nobody sent. */
  onEndCall: (call: PendingCall, closedAtDesk: boolean) => void;
  /** A line for the shift log. */
  onNote: (text: string) => void;
  covered: ServiceCode[];
}) {
  const s = call.scenario;
  const service = scenarioService(s);
  const script = s.call;
  const bank = CALL_QUESTIONS[service];
  const [asked, setAsked] = useState<Record<string, string>>({});
  const [lines, setLines] = useState<Line[]>(() => [
    { at: answeredAt, who: "BT", text: `999 operator — connecting you to ${service.toLowerCase()}.` },
    { at: answeredAt, who: "OP", text: `${service === "Fire" ? "Fire service" : service === "Ambulance" ? "Ambulance service" : "Police"}, what is the address of the emergency?` },
    { at: answeredAt, who: "CALR", text: script?.openingByVariant?.[call.variantId ?? "base"] ?? script?.opening ?? s.trigger, tone: script?.caller.state === "panicking" ? "urgent" : undefined },
  ]);
  const [confirmed, setConfirmed] = useState(false);
  const [access, setAccess] = useState("");
  const [type, setType] = useState<string | null>(null);
  const [escalation, setEscalation] = useState<{ open: boolean; reason: string; grade: string } | null>(null);
  const [added, setAdded] = useState<Record<string, "add" | "pass">>({});
  const [ended, setEnded] = useState(false);
  const [callerState, setCallerState] = useState<CallerState>(script?.caller.state ?? "anxious");
  const [suggested, setSuggested] = useState<{ grade: string; basis: string } | null>(null);
  const firedRef = useRef<Set<number>>(new Set());
  const droppedRef = useRef(false);

  // A different call is a different <CallScreen key> — state resets with it.

  const elapsedSec = Math.max(0, Math.floor((now - answeredAt) / 1000));
  const addr = shortAddress(s.location.address);
  const services = scenarioServices(s);
  const others = (["Fire", "Ambulance", "Police"] as ServiceCode[]).filter((x) => x !== service);
  const typeLabel = labelForType(s.type);
  // Opening codes: the service's own list (NICL for police, IRS incident
  // type for fire, the AMPDS card for ambulance). The quick picks are the
  // right code and a few neighbours; the select holds the lot.
  const scheme = OPENING_SCHEME[service];
  const codeList = OPENING_CODES[service];
  const quickPicks = useMemo(() => quickPickOpeningCodes(service, s.type, `${s.id}:${call.id}`), [service, s.type, s.id, call.id]);
  const codeGroups = useMemo(() => {
    const groups: { name: string; codes: typeof codeList }[] = [];
    for (const c of codeList) {
      const g = groups.find((x) => x.name === c.group);
      if (g) g.codes.push(c);
      else groups.push({ name: c.group, codes: [c] });
    }
    return groups;
  }, [codeList]);
  const typeText = type ? openingCodeLabel(service, type) : null;

  // ---- The questions: the bank, plus whatever the answers so far have opened.
  const askables = useMemo<Askable[]>(() => {
    const out: Askable[] = [];
    const walk = (parentId: string, group: string, a: CallAnswer) => {
      for (const f of a.followUps ?? []) {
        if (!asked[parentId]) continue;
        out.push({ id: f.id, group, text: f.text, key: false, follow: true, answer: forRun(f.answer) });
        walk(f.id, group, f.answer);
      }
    };
    const forRun = (a: CallAnswer): CallAnswer => {
      const t = a.byVariant?.[call.variantId ?? "base"];
      return t ? { ...a, text: t } : a;
    };
    for (const q of bank) {
      const a: CallAnswer = forRun(script?.answers[q.id] ?? { text: q.fallback(s) });
      out.push({ id: q.id, group: q.group, text: q.text, key: !!q.key, follow: false, answer: a });
      walk(q.id, q.group, a);
    }
    return out;
  }, [bank, script, s, asked, call.variantId]);
  const groups = Array.from(new Set(bank.map((q) => q.group)));
  const keyIds = script?.keyQuestions ?? keyQuestionsFor(service);
  const askedCount = Object.keys(asked).length;
  const keyAsked = keyIds.filter((id) => asked[id]).length;
  const detailsAsked = !!asked[`${service === "Fire" ? "f" : service === "Ambulance" ? "a" : "p"}_details`];
  const callerName = script ? (detailsAsked ? script.caller.name : null) : null;
  const canReassure = callerState !== "calm" && !ended;
  const blockedByState = callerState === "panicking" || callerState === "hostile";

  // Lines are stamped with the desk's clock, which ticks once a second —
  // the dialogue reads to the second, like the recording does.
  const pushLines = (...ls: Omit<Line, "at">[]) => {
    const at = now;
    setLines((p) => [...p, ...ls.map((l) => ({ ...l, at }))]);
  };

  function applyEffect(e?: CallEffect) {
    if (!e) return;
    if (e.regrade) {
      setSuggested({ grade: e.regrade, basis: e.basis ?? "From what the caller said" });
      pushLines({ who: "SYS", text: `Suggested grade moved to ${e.regrade}${e.basis ? ` — ${e.basis}` : ""}` });
    }
    if (e.addService && e.addService !== service) {
      setAdded((p) => (p[e.addService!] === "add" ? p : { ...p, [e.addService!]: "add" }));
      pushLines({ who: "SYS", text: `${e.addService} added to the attendance.` });
    }
    if (e.state) setCallerState(e.state);
  }

  function ask(q: Askable) {
    if (asked[q.id] || ended) return;
    if (q.answer.needsCalm && blockedByState) {
      pushLines({ who: "OP", text: q.text }, { who: "CALR", text: deflectionFor(callerState, script), tone: "urgent" });
      return;
    }
    setAsked((p) => ({ ...p, [q.id]: q.answer.text }));
    pushLines({ who: "OP", text: q.text }, { who: "CALR", text: q.answer.text, tone: q.answer.tone ?? (/trapped|inside|not breathing|weapon|unconscious|knife|gun|can't get out/i.test(q.answer.text) ? "urgent" : undefined) });
    applyEffect(q.answer.effect);
  }

  function reassure() {
    if (!canReassure) return;
    const r = reassuranceFor(callerState, callerName ?? script?.caller.name ?? null, script);
    pushLines({ who: "OP", text: r.text }, { who: "CALR", text: r.reply });
    setCallerState((st) => (st === "panicking" || st === "hostile" ? "anxious" : "calm"));
  }

  // ---- The caller talks on their own, and sometimes goes.
  useEffect(() => {
    if (!script || ended) return;
    const due = (script.interjections ?? []).filter((i, idx) => !firedRef.current.has(idx) && variantAllows(i, call.variantId) && i.atSec <= elapsedSec && (!i.requiresAsked || i.requiresAsked.every((q) => asked[q])) && (!i.unlessAsked || !i.unlessAsked.some((q) => asked[q])) && (i.requiresOpened === undefined || i.requiresOpened === !!opened)).map((i) => ({ i, idx: (script.interjections ?? []).indexOf(i) }));
    const drop = script.drops && !droppedRef.current && script.drops.atSec <= elapsedSec ? script.drops : null;
    if (due.length === 0 && !drop) return;
    for (const { idx } of due) firedRef.current.add(idx);
    if (drop) droppedRef.current = true;
    const t = setTimeout(() => {
      for (const { i } of due) {
        pushLines({ who: "CALR", text: i.text, tone: i.tone });
        applyEffect(i.effect);
      }
      if (drop) {
        pushLines({ who: "CALR", text: drop.text, tone: "urgent" }, { who: "SYS", text: "Line lost — caller no longer connected." });
        setEnded(true);
        onNote(`${s.title} — the caller went: ${drop.text}`);
      }
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsedSec, script, ended, asked, opened]);

  // ---- Grade and readiness
  const impliedLabel = gradeShort(impliedGrade(s));
  const shownGrade = escalation && !escalation.open ? escalation.grade : suggested?.grade ?? impliedLabel;
  const shownBasis = escalation && !escalation.open ? `Regraded at the desk — ${escalation.reason}` : suggested ? suggested.basis : gradeMeaning(impliedGrade(s));
  const readiness = [
    { ok: !ended, text: ended ? "Caller has gone — send on what you have" : "Active caller connected", soft: true },
    { ok: confirmed, text: confirmed ? "Address confirmed with the caller" : "Address not confirmed with the caller" },
    { ok: true, text: script?.caller.line === "mobile" ? "Location fix in use — AML handset" : "Location fix in use — EISEC" },
    { ok: !!type, text: type ? `Opening code · ${typeText}` : `No opening code keyed (${scheme.short})` },
    { ok: keyAsked === keyIds.length, text: `Key questions asked · ${keyAsked} of ${keyIds.length}`, soft: true },
  ];
  const outstanding = readiness.filter((r) => !r.ok && !r.soft).length;
  const notCovered = services.filter((x) => !covered.includes(x));
  const note = () => [type ? `opened ${typeText}` : typeLabel, access.trim() ? `access: ${access.trim()}` : null, escalation && !escalation.open ? `regraded ${escalation.grade}` : suggested ? `graded ${suggested.grade}` : null].filter(Boolean).join(" · ");
  const summary = (): CallSummary => ({
    asked: Object.keys(asked),
    askedTotal: bank.length,
    missedKey: keyIds.filter((id) => !asked[id]).map((id) => ({ id, text: bank.find((q) => q.id === id)?.text ?? id })),
    preAlerted: !!opened,
    durationSec: elapsedSec,
    callerState,
    dropped: ended,
    grade: shownGrade,
    openingCode: type,
    openingCodeFits: openingCodeFits(s.type, type),
  });

  function send() {
    onPreAlert(call, note());
    pushLines({ who: "SYS", text: `Sent — ${s.pda.length} on the attendance, mobilising now.` }, { who: "OP", text: "Help is on its way to you. Stay on the line with me." });
    if (script?.onDispatch) pushLines({ who: "CALR", text: script.onDispatch });
  }

  const askRow = (q: Askable) => (
    <div key={q.id} className={`vec-qrow${asked[q.id] ? " asked" : ""}${q.follow ? " follow" : ""}${q.key && !asked[q.id] ? " key" : ""}`}>
      <div>
        <div>{q.follow ? "↳ " : ""}{q.text}{q.key && <span className="vec-key-tag">KEY</span>}</div>
        {asked[q.id] && <div className="ans">“{asked[q.id]}”</div>}
      </div>
      <button type="button" disabled={!!asked[q.id] || ended} onClick={() => ask(q)}>
        {asked[q.id] ? "ASKED" : "ASK"}
      </button>
    </div>
  );

  const mobile = script?.caller.line === "mobile";

  return (
    <div className="vec-screen" data-screen="call">
      <div className="vec-screen-head">
        <h1>
          <span className="dot" />
          999 CALL IN PROGRESS — {service.toUpperCase()}
        </h1>
        <span className="mono">ACTIVE CALL · {call.id.slice(-6).toUpperCase()}</span>
        {opened && <span className="mono go">SENT · CALLER ON THE LINE</span>}
        {ended && <span className="mono stop">LINE LOST</span>}
        <span className="spacer" />
        <div className="vec-svctabs" style={{ border: "1px solid var(--vec-border)" }}>
          {(["Fire", "Ambulance", "Police"] as ServiceCode[]).map((k) => (
            <button key={k} type="button" aria-pressed={service === k} className={k === "Fire" ? "fire" : k === "Ambulance" ? "amb" : "pol"} style={{ padding: "3px 10px" }} disabled>
              {SERVICE_SHORT[k]}
            </button>
          ))}
        </div>
      </div>

      <div className="vec-grid call">
        <div className="vec-call-summary">
          <div>
            <div className="vec-k">Caller · BT 999 handover</div>
            <div className="vec-v">
              {callerName ?? (script ? "Name not yet taken" : "Member of the public")}
              {script && <span className={`vec-caller-state ${STATE_TONE[callerState]}`}>{STATE_LABEL[callerState]}</span>}
              {" "}
              <CopyButton text={script?.openingByVariant?.[call.variantId ?? "base"] ?? script?.opening ?? s.trigger} label="caller's words" />
            </div>
            <div className="vec-small">
              {script ? `${script.caller.relation} · ${script.caller.where}` : "Caller details not yet recorded"}
              {" · "}
              {script ? `CLI ${script.caller.phone} · ${mobile ? "Mobile" : "Landline"}` : "Number withheld in this simulation · Landline"}
            </div>
          </div>
          <div>
            <div className="vec-k">Nature as given</div>
            <div className="vec-v">{s.title}</div>
            <div className="vec-small">{script?.openingByVariant?.[call.variantId ?? "base"] ?? script?.opening ?? s.trigger}</div>
          </div>
          <div>
            <div className="vec-k">Call timer</div>
            <div className="vec-v big">{mmss(now - answeredAt)}</div>
            <div className="vec-small">Answered {hhmmss(answeredAt)} · waited {mmss(answeredAt - call.receivedAt)} · recorded</div>
          </div>
          <div>
            <div className="vec-k" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Suggested grade</span>
              <span>{suggested ? "FROM THE CALL" : "FROM TRIAGE"}</span>
            </div>
            <div className="vec-v grade">{shownGrade}</div>
            <div className="vec-small">{shownBasis}</div>
            {s.disposal && (
              <div className="vec-small" style={{ color: "var(--vec-go)", fontWeight: 700 }}>
                Right Care Right Person — {s.disposal.basis}
              </div>
            )}
            <div style={{ marginTop: 6 }}>
              {escalation?.open ? (
                <div style={{ display: "grid", gap: 4 }}>
                  <select className="vec-btn" value={escalation.grade} onChange={(e) => setEscalation({ ...escalation, grade: e.target.value })}>
                    {GRADE_LABELS[service].map((g) => <option key={g}>{g}</option>)}
                  </select>
                  <input className="vec-btn" placeholder="Reason for regrading" value={escalation.reason} onChange={(e) => setEscalation({ ...escalation, reason: e.target.value })} />
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      type="button"
                      className="vec-btn solid"
                      disabled={!escalation.reason.trim()}
                      onClick={() => {
                        setEscalation({ ...escalation, open: false });
                        pushLines({ who: "SYS", text: `Call regraded ${escalation.grade} at the desk — ${escalation.reason}` });
                        onNote(`${s.title} — call regraded ${escalation.grade} at the desk: ${escalation.reason}`);
                      }}
                    >
                      Record regrade
                    </button>
                    <button type="button" className="vec-btn" onClick={() => setEscalation(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button type="button" className="vec-btn" style={{ borderColor: "var(--vec-warn)", color: "var(--vec-warn)" }} onClick={() => setEscalation({ open: true, reason: "", grade: shownGrade })}>
                  Regrade call
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Left column — caller location */}
        <div style={{ display: "grid", gridTemplateRows: "minmax(0, 1fr) 260px", gap: 6, minHeight: 0 }}>
          <div className="vec-box">
            <header>
              <span>Caller location</span>
              <span className="mono go">{mobile ? "Handset fix" : "Sources agree"}</span>
            </header>
            <div className="body">
              <div className={`vec-field${mobile ? "" : " in-use"}`}>
                <div className="vec-k"><span>EISEC · landline lookup</span><span style={{ color: mobile ? undefined : "var(--vec-go)" }}>{mobile ? "N/A" : "BEST"}</span></div>
                <div className="vec-v">{mobile ? "Mobile caller" : addr.line1}</div>
                <div className="vec-small">{mobile ? "No installation address for a mobile" : `${addr.line2} · Exact address from the calling number`}</div>
              </div>
              <div className={`vec-field${mobile ? " in-use" : ""}`}>
                <div className="vec-k"><span>AML · handset GPS</span><span style={{ color: mobile ? "var(--vec-go)" : undefined }}>{mobile ? "BEST" : "N/A"}</span></div>
                <div className="vec-v">{mobile ? `${s.location.coords.lat.toFixed(5)} N, ${Math.abs(s.location.coords.lng).toFixed(5)} W` : "Not available"}</div>
                <div className="vec-small">{mobile ? "Advanced Mobile Location · ±14 m · pushed by the handset on dialling" : "Fixed line — no handset fix"}</div>
              </div>
              <div className="vec-field">
                <div className="vec-k"><span>W3W · caller reads three words</span><span>{mobile ? "OFFERED" : "N/A"}</span></div>
                <div className="vec-v">{mobile ? "Not needed — AML agrees with the address given" : "Not offered"}</div>
                <div className="vec-small">{mobile ? "Ask for it if the fix and the words disagree" : "Address already confirmed by EISEC"}</div>
              </div>
              <div className="vec-field">
                <div className="vec-k"><span>SMS · location request</span><span>{mobile ? "READY" : "N/A"}</span></div>
                <div className="vec-v">{mobile ? "Can be sent" : "Not applicable"}</div>
                <div className="vec-small">{mobile ? "A link the caller taps to share their position" : "Cannot text a landline"}</div>
              </div>
              <div className="vec-field" style={{ background: "var(--vec-surface-raised)" }}>
                <div className="vec-k">Fix in use</div>
                <div className="vec-v">{mobile ? "AML · handset GPS" : "EISEC · landline lookup"}</div>
                <div className="vec-small" style={{ fontFamily: "var(--vec-mono)" }}>
                  {s.location.coords.lat.toFixed(5)} N, {Math.abs(s.location.coords.lng).toFixed(5)} W · {s.location.postcode}
                </div>
              </div>
            </div>
          </div>
          <div className="vec-box">
            <header>
              <span>Location map</span>
              <span className="mono">Street · z16</span>
            </header>
            <div className="body" style={{ position: "relative" }}>
              <CallLocationMap lat={s.location.coords.lat} lng={s.location.coords.lng} />
            </div>
          </div>
        </div>

        {/* Centre — confirm location + triage */}
        <div style={{ display: "grid", gridTemplateRows: "auto minmax(0, 1fr)", gap: 6, minHeight: 0 }}>
          <div className="vec-box">
            <header>
              <span>Confirm location</span>
              <span className={`mono ${confirmed ? "go" : "stop"}`}>{confirmed ? "Confirmed" : "Not confirmed"}</span>
            </header>
            <div style={{ padding: "6px 10px 8px" }}>
              <div className="vec-k">Location source · {mobile ? "AML · handset fix, address as given by the caller" : "EISEC · Exact address from the calling number"}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <div className="vec-btn" style={{ flex: 1, textAlign: "left", fontSize: 12, display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span>{s.location.address} · {s.location.postcode}</span>
                  <CopyButton text={`${s.location.address}, ${s.location.postcode}`} label="address" />
                </div>
                <button
                  type="button"
                  className={`vec-btn ${confirmed ? "go" : "solid"}`}
                  disabled={ended && !confirmed}
                  onClick={() => {
                    if (confirmed) return;
                    setConfirmed(true);
                    pushLines({ who: "OP", text: `Can I confirm the address — ${s.location.address}?` }, { who: "CALR", text: callerState === "panicking" ? "Yes! Yes, that's it, please hurry." : "Yes, that's right." });
                  }}
                >
                  {confirmed ? "Address confirmed ✓" : "Confirm address"}
                </button>
              </div>
              <input
                className="vec-btn"
                style={{ width: "100%", marginTop: 6, textAlign: "left", fontWeight: 400 }}
                placeholder="Flat, entrance or access details (optional)"
                value={access}
                onChange={(e) => setAccess(e.target.value)}
              />
              <div className="vec-small" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Check the address with the caller before confirming.</span>
                <span style={{ color: "var(--vec-work)" }}>{s.property.access}</span>
              </div>
            </div>
          </div>
          <div className="vec-box">
            <header>
              <span>Triage &amp; dialogue</span>
              <span className="mono">
                {askedCount} of {bank.length} asked · key {keyAsked}/{keyIds.length}
              </span>
            </header>
            <div className="body" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)", minHeight: 0 }}>
              <div style={{ overflow: "auto", borderRight: "1px solid var(--vec-border)" }}>
                {groups.map((g) => {
                  const qs = askables.filter((q) => q.group === g);
                  const done = qs.filter((q) => asked[q.id]).length;
                  return (
                    <div key={g}>
                      <div className="vec-sect">
                        <span>{g}</span>
                        <span>{done}/{qs.length}</span>
                      </div>
                      {qs.map(askRow)}
                    </div>
                  );
                })}
              </div>
              <div style={{ overflow: "auto", display: "flex", flexDirection: "column" }}>
                <div className="vec-sect">
                  <span>Call dialogue</span>
                  <span>
                    {canReassure && script && (
                      <button type="button" className="vec-btn mini reassure" onClick={reassure} title={blockedByState ? "They cannot answer until you bring them down" : "Settle the caller"}>
                        {callerState === "hostile" ? "Work with me" : "Reassure caller"}
                      </button>
                    )}
                    {lines.length} lines
                  </span>
                </div>
                <div className="vec-dialogue">
                  {lines.map((l, i) => (
                    <div key={i}>
                      <span>{hhmmss(l.at)}</span>
                      <span className={`who ${l.who === "CALR" ? "calr" : l.who === "SYS" ? "sys" : ""}`}>{l.who}</span>
                      <span className={`txt ${l.tone ?? ""}${l.who === "SYS" ? " sys" : ""}`}>{l.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column — incident type, other services, send */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: 0, overflow: "auto" }}>
          <div className="vec-box" style={{ flex: "0 0 auto" }}>
            <header>
              <span>Opening code · {scheme.short}</span>
              <span className={`mono ${type ? "go" : ""}`}>{type ?? "Not set"}</span>
            </header>
            <div className="vec-typechips" title={scheme.name}>
              {quickPicks.map((c) => (
                <button key={c.code} type="button" aria-pressed={type === c.code} disabled={!!opened} onClick={() => setType(c.code)} title={c.group}>
                  <span className="mono">{c.code}</span> {c.label}
                </button>
              ))}
            </div>
            <div style={{ padding: "0 10px 8px" }}>
              <select
                className="vec-btn"
                style={{ width: "100%" }}
                value={type ?? ""}
                disabled={!!opened}
                aria-label={`Opening code (${scheme.name})`}
                onChange={(e) => setType(e.target.value || null)}
              >
                <option value="">All {scheme.short} codes…</option>
                {codeGroups.map((g) => (
                  <optgroup key={g.name} label={g.name}>
                    {g.codes.map((c) => (
                      <option key={c.code} value={c.code}>{c.code} · {c.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="vec-sect"><span>This code sends</span></div>
            <div style={{ padding: "6px 10px", fontSize: 11 }}>
              {type ? (
                <>
                  {s.pda.map((p) => (
                    <div key={p.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "2px 0" }}>
                      <span>{p.label}</span>
                      <span className={`vec-svc-pill ${p.service}`}>{SERVICE_SHORT[p.service]}</span>
                    </div>
                  ))}
                  {!openingCodeFits(s.type, type) && (
                    <div className="vec-small" style={{ color: "var(--vec-warn)" }}>
                      Opened as {typeText} — the attendance still follows the nature given: {typeLabel}.
                    </div>
                  )}
                </>
              ) : (
                <span className="vec-small">Key an opening code to see the attendance it sends.</span>
              )}
            </div>
          </div>
          <div className="vec-box" style={{ flex: "0 0 auto" }}>
            <header><span>Other services</span></header>
            {others.map((o) => {
              const inPda = services.includes(o);
              const st = added[o];
              return (
                <div key={o} className="vec-other">
                  <span className={`vec-svc-pill ${o}`}>{SERVICE_SHORT[o]}</span>
                  <span className={`state ${inPda || st === "add" ? "on" : ""}`}>
                    {inPda ? "In the attendance" : st === "add" ? "Added to attendance" : st === "pass" ? "Passed over — simulated" : "Not involved"}
                  </span>
                  <button
                    type="button"
                    className="vec-btn mini"
                    disabled={inPda || st === "add"}
                    onClick={() => {
                      setAdded((p) => ({ ...p, [o]: "add" }));
                      pushLines({ who: "SYS", text: `${o} added to the attendance.` });
                    }}
                  >
                    ADD
                  </button>
                  <button
                    type="button"
                    className="vec-btn mini"
                    disabled={st === "pass"}
                    onClick={() => {
                      setAdded((p) => ({ ...p, [o]: "pass" }));
                      pushLines({ who: "OP", text: `I'm passing you to ${o.toLowerCase()} control now — stay on the line.` }, { who: "SYS", text: `Call passed to ${o} control (simulated).` });
                    }}
                  >
                    PASS OVER
                  </button>
                </div>
              );
            })}
          </div>
          <div className="vec-box" style={{ flex: "0 0 auto" }}>
            <header>
              <span>{opened ? "Sent" : "Ready to send"}</span>
              <span className={`mono ${outstanding ? "stop" : "go"}`}>{opened ? "Job open" : outstanding ? `${outstanding} outstanding` : "Ready"}</span>
            </header>
            <div className="vec-checks">
              {readiness.map((r) => (
                <div key={r.text}>
                  <i className={r.ok ? "" : r.soft ? "warn" : "stop"} />
                  <span>{r.text}</span>
                </div>
              ))}
              {notCovered.length > 0 && (
                <div>
                  <i className="stop" />
                  <span>Needs {notCovered.join(" and ")} — not covered from this position</span>
                </div>
              )}
            </div>
            {opened ? (
              <>
                <button type="button" className="vec-create" onClick={() => onFinish(call, summary())}>
                  Finish call → Mobilising
                </button>
                <div className="vec-small" style={{ padding: "0 10px 8px" }}>
                  The attendance is mobilising. Keep the caller talking while you can, then put the phone down.
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="vec-create"
                  disabled={outstanding > 0 || notCovered.length > 0 || !!s.disposal}
                  onClick={send}
                  title={s.disposal ? "This call closes at the desk" : "Open the job now and keep the caller on the line"}
                >
                  Send and stay on the line
                </button>
                <div style={{ display: "flex", gap: 6, padding: "0 10px 6px" }}>
                  <button
                    type="button"
                    className="vec-btn"
                    style={{ flex: 1 }}
                    disabled={outstanding > 0 || notCovered.length > 0}
                    onClick={() => onCreate(call, note(), summary())}
                  >
                    Create incident &amp; mobilise
                  </button>
                  <button
                    type="button"
                    className="vec-btn"
                    onClick={() => {
                      setEnded(true);
                      onEndCall(call, !!s.disposal);
                    }}
                    title={s.disposal ? "Close at the desk — advice given, nobody sent" : "Put the phone down with nobody sent"}
                  >
                    {s.disposal ? "Close at desk · advice given" : "End call · nobody sent"}
                  </button>
                </div>
                <div className="vec-small" style={{ padding: "0 10px 8px" }}>
                  {keyAsked < keyIds.length ? `${keyIds.length - keyAsked} key question${keyIds.length - keyAsked === 1 ? "" : "s"} not yet asked — the debrief counts them.` : "Every key question asked."}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
