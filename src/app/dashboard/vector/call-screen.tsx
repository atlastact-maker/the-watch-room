"use client";

// The 999 Call screen — the call in hand, laid out the way VECTOR takes
// one: caller and handover strip along the top, location fixes and the
// confirmation on the left and middle, the scripted assessment with the
// running dialogue in the centre, and the incident type / other services
// / ready-to-open checklist on the right. Nothing here touches the
// simulator until CREATE INCIDENT & MOBILISE, which opens the job.

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { Scenario } from "@/lib/sim/incident_types";
import type { ServiceCode } from "@/lib/sim/types";
import { labelForType } from "@/lib/sim/pda";
import { scenarioServices } from "@/lib/sim/coverage";
import type { PendingCall } from "../components/call-stack";
import { SERVICE_SHORT, copyText, gradeMeaning, gradeShort, hhmmss, impliedGrade, mmss, scenarioService, shortAddress } from "./model";

const CallLocationMap = dynamic(() => import("./call-location-map").then((m) => m.CallLocationMap), {
  ssr: false,
  loading: () => <div className="vec-map-empty">LOADING MAP…</div>,
});

type Question = { id: string; group: "NATURE" | "RISK" | "CASUALTIES" | "LOCATION & ACCESS" | "CALLER & UPDATES"; text: string; answer: (s: Scenario) => string };

const notGiven = "Not known to the caller.";
const QUESTIONS: Record<ServiceCode, Question[]> = {
  Fire: [
    { id: "n1", group: "NATURE", text: "What exactly can you see?", answer: (s) => s.trigger },
    { id: "n2", group: "NATURE", text: "Is the fire spreading?", answer: (s) => s.methane.E || notGiven },
    { id: "n3", group: "NATURE", text: "What type of building or vehicle is it?", answer: (s) => `${s.property.class}${s.property.size ? ` · ${s.property.size}` : ""}${s.property.materials ? ` · ${s.property.materials}` : ""}` },
    { id: "n4", group: "NATURE", text: "When did it start?", answer: () => "Just now — the caller has only just noticed it." },
    { id: "r1", group: "RISK", text: "Is anyone still inside?", answer: (s) => s.property.occupants || s.methane.N || notGiven },
    { id: "r2", group: "RISK", text: "Are there any gas cylinders, chemicals or fuel?", answer: (s) => s.property.knownHazards.length ? s.property.knownHazards.join("; ") : s.methane.H || "None the caller knows of." },
    { id: "r3", group: "RISK", text: "Any dangers to crews arriving?", answer: (s) => s.methane.H || "Nothing reported." },
    { id: "c1", group: "CASUALTIES", text: "Is anyone hurt?", answer: (s) => s.methane.N || notGiven },
    { id: "c2", group: "CASUALTIES", text: "Is anyone vulnerable — children, elderly, disabled?", answer: (s) => s.property.vulnerabilities.length ? s.property.vulnerabilities.join("; ") : "Not that the caller knows." },
    { id: "l1", group: "LOCATION & ACCESS", text: "What is the exact address, including any flat number?", answer: (s) => `${s.location.address} · ${s.location.postcode}` },
    { id: "l2", group: "LOCATION & ACCESS", text: "How do crews get in — any gates, keys or access problems?", answer: (s) => s.property.access },
    { id: "u1", group: "CALLER & UPDATES", text: "Are you in a safe place?", answer: () => "The caller confirms they are outside and safe." },
    { id: "u2", group: "CALLER & UPDATES", text: "Can you stay on the line?", answer: () => "Yes — the caller will stay on until crews arrive." },
    { id: "u3", group: "CALLER & UPDATES", text: "What is your name and callback number?", answer: () => "Given — recorded on the call." },
  ],
  Ambulance: [
    { id: "n1", group: "NATURE", text: "Is the patient awake?", answer: (s) => s.methane.T || s.trigger },
    { id: "n2", group: "NATURE", text: "Is the patient breathing normally?", answer: (s) => s.methane.T || notGiven },
    { id: "n3", group: "NATURE", text: "What happened immediately before this?", answer: (s) => s.trigger },
    { id: "n4", group: "NATURE", text: "When did this happen?", answer: () => "Within the last few minutes." },
    { id: "r1", group: "RISK", text: "Any bleeding you cannot stop?", answer: (s) => s.methane.H || "No serious bleeding reported." },
    { id: "r2", group: "RISK", text: "Can the crew get in?", answer: (s) => s.property.access },
    { id: "r3", group: "RISK", text: "Are there any dangers where the patient is?", answer: (s) => s.methane.H || "None reported." },
    { id: "c1", group: "CASUALTIES", text: "How many patients are there?", answer: (s) => s.methane.N || "One." },
    { id: "c2", group: "CASUALTIES", text: "Approximately how old is the patient?", answer: (s) => s.property.occupants || notGiven },
    { id: "l1", group: "LOCATION & ACCESS", text: "What is the exact address, including any flat number?", answer: (s) => `${s.location.address} · ${s.location.postcode}` },
    { id: "l2", group: "LOCATION & ACCESS", text: "Are there any entry codes, locked doors or access difficulties?", answer: (s) => s.property.access },
    { id: "u1", group: "CALLER & UPDATES", text: "Are you with the patient now?", answer: () => "Yes." },
    { id: "u2", group: "CALLER & UPDATES", text: "Is anyone else there who can help with access?", answer: (s) => s.property.occupants || notGiven },
    { id: "u3", group: "CALLER & UPDATES", text: "What is your name and callback number?", answer: () => "Given — recorded on the call." },
  ],
  Police: [
    { id: "n1", group: "NATURE", text: "What is happening right now?", answer: (s) => s.trigger },
    { id: "n2", group: "NATURE", text: "Is it still going on?", answer: (s) => s.methane.E || notGiven },
    { id: "n3", group: "NATURE", text: "Who is involved, and how many?", answer: (s) => s.methane.N || notGiven },
    { id: "n4", group: "NATURE", text: "When did it happen?", answer: () => "Just now — the caller is watching it." },
    { id: "r1", group: "RISK", text: "Are there any weapons?", answer: (s) => s.methane.H || "None seen." },
    { id: "r2", group: "RISK", text: "Has anyone been threatened or hurt?", answer: (s) => s.methane.N || "Nobody hurt so far." },
    { id: "r3", group: "RISK", text: "Are drink or drugs involved?", answer: () => notGiven },
    { id: "c1", group: "CASUALTIES", text: "Does anyone need an ambulance?", answer: (s) => s.methane.N || "Not at present." },
    { id: "c2", group: "CASUALTIES", text: "Is anyone vulnerable — a child, elderly or at risk?", answer: (s) => s.property.vulnerabilities.length ? s.property.vulnerabilities.join("; ") : "Not that the caller knows." },
    { id: "l1", group: "LOCATION & ACCESS", text: "Where exactly — address, junction or landmark?", answer: (s) => `${s.location.address} · ${s.location.postcode}` },
    { id: "l2", group: "LOCATION & ACCESS", text: "Which way did they go, and in what?", answer: (s) => s.methane.A || notGiven },
    { id: "u1", group: "CALLER & UPDATES", text: "Are you safe where you are?", answer: () => "The caller is at a safe distance." },
    { id: "u2", group: "CALLER & UPDATES", text: "Can you describe the people involved?", answer: (s) => s.property.occupants || notGiven },
    { id: "u3", group: "CALLER & UPDATES", text: "What is your name and callback number?", answer: () => "Given — recorded on the call." },
  ],
};

type Line = { at: number; who: "BT" | "OP" | "CALR"; text: string; tone?: "urgent" | "critical" };

export function CallScreen({
  call,
  answeredAt,
  now,
  onCreate,
  onEndCall,
  onNote,
  covered,
}: {
  call: PendingCall;
  /** When the operator picked the call up — the call timer runs from here. */
  answeredAt: number;
  now: number;
  /** Open the incident from this call and go to Mobilising. */
  onCreate: (call: PendingCall, note: string) => void;
  /** Put the phone down with nobody sent. */
  onEndCall: (call: PendingCall, closedAtDesk: boolean) => void;
  /** A line for the shift log. */
  onNote: (text: string) => void;
  covered: ServiceCode[];
}) {
  const s = call.scenario;
  const service = scenarioService(s);
  const [asked, setAsked] = useState<Record<string, string>>({});
  const [lines, setLines] = useState<Line[]>(() => [
    { at: answeredAt, who: "BT", text: `999 operator — connecting for ${service.toLowerCase()}.` },
    { at: answeredAt, who: "OP", text: `${service.toUpperCase()}, what is the address of the emergency?` },
    { at: answeredAt, who: "CALR", text: `${s.trigger}` },
  ]);
  const [confirmed, setConfirmed] = useState(false);
  const [access, setAccess] = useState("");
  const [type, setType] = useState<string | null>(null);
  const [escalation, setEscalation] = useState<{ open: boolean; reason: string; grade: string } | null>(null);
  const [added, setAdded] = useState<Record<string, "add" | "pass">>({});
  const [ended, setEnded] = useState(false);

  // A different call is a different <CallScreen key> — state resets with it.

  const questions = QUESTIONS[service];
  const groups = Array.from(new Set(questions.map((q) => q.group)));
  const askedCount = Object.keys(asked).length;
  const addr = shortAddress(s.location.address);
  const services = scenarioServices(s);
  const others = (["Fire", "Ambulance", "Police"] as ServiceCode[]).filter((x) => x !== service);
  const typeLabel = labelForType(s.type);
  const typeOptions = useMemo(() => {
    const base = [typeLabel];
    if (service === "Fire") base.push("Automatic fire alarm", "Special service call", "Vehicle fire");
    if (service === "Ambulance") base.push("Cardiac arrest", "Breathing difficulty", "Chest pain", "Fall, no injury");
    if (service === "Police") base.push("Assault in progress", "Domestic incident", "Road traffic collision", "Concern for welfare");
    return Array.from(new Set(base));
  }, [typeLabel, service]);
  const readiness = [
    { ok: !ended, text: ended ? "Caller has cleared" : "Active caller connected" },
    { ok: confirmed, text: confirmed ? "Address confirmed with the caller" : "Address not confirmed with the caller" },
    { ok: true, text: "Location fix in use — EISEC" },
    { ok: !!type, text: type ? `Incident type · ${type}` : "No incident type chosen" },
    { ok: true, text: "No conflicting location" },
  ];
  const outstanding = readiness.filter((r) => !r.ok).length;
  const notCovered = services.filter((x) => !covered.includes(x));

  function ask(q: Question) {
    if (asked[q.id]) return;
    const a = q.answer(s);
    setAsked((p) => ({ ...p, [q.id]: a }));
    setLines((p) => [
      ...p,
      { at: Date.now(), who: "OP", text: q.text },
      { at: Date.now(), who: "CALR", text: a, tone: /trapped|inside|not breathing|weapon|unconscious|arrest/i.test(a) ? "urgent" : undefined },
    ]);
  }

  return (
    <div className="vec-screen" data-screen="call">
      <div className="vec-screen-head">
        <h1>
          <span className="dot" />
          999 CALL IN PROGRESS — {service.toUpperCase()}
        </h1>
        <span className="mono">ACTIVE CALL · {call.id.slice(-6).toUpperCase()}</span>
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
              {s.methane.emergencyServices ? "Member of the public" : "Caller details not yet recorded"}{" "}
              <button type="button" className="vec-btn mini" onClick={() => copyText("Caller — member of the public")}>⧉</button>
            </div>
            <div className="vec-small">Number withheld in this simulation · Landline · BT · EISEC record returned</div>
          </div>
          <div>
            <div className="vec-k">Nature as given</div>
            <div className="vec-v">{s.title}</div>
            <div className="vec-small">{s.trigger}</div>
          </div>
          <div>
            <div className="vec-k">Call timer</div>
            <div className="vec-v big">{mmss(now - answeredAt)}</div>
            <div className="vec-small">Answered {hhmmss(answeredAt)} · waited {mmss(answeredAt - call.receivedAt)} · recorded</div>
          </div>
          <div>
            <div className="vec-k" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Suggested grade</span>
              <span>FROM TRIAGE</span>
            </div>
            <div className="vec-v grade">{escalation && !escalation.open ? escalation.grade : gradeShort(impliedGrade(s))}</div>
            <div className="vec-small">{gradeMeaning(impliedGrade(s))}</div>
            {s.disposal && (
              <div className="vec-small" style={{ color: "var(--vec-go)", fontWeight: 700 }}>
                Right Care Right Person — {s.disposal.basis}
              </div>
            )}
            <div style={{ marginTop: 6 }}>
              {escalation?.open ? (
                <div style={{ display: "grid", gap: 4 }}>
                  <select className="vec-btn" value={escalation.grade} onChange={(e) => setEscalation({ ...escalation, grade: e.target.value })}>
                    {(service === "Ambulance" ? ["CAT 1", "CAT 2", "CAT 3", "CAT 4"] : service === "Police" ? ["GRADE 1", "GRADE 2", "GRADE C", "GRADE L"] : ["EMERGENCY", "URGENT", "ROUTINE"]).map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                  <input className="vec-btn" placeholder="Reason for escalation" value={escalation.reason} onChange={(e) => setEscalation({ ...escalation, reason: e.target.value })} />
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      type="button"
                      className="vec-btn solid"
                      disabled={!escalation.reason.trim()}
                      onClick={() => {
                        setEscalation({ ...escalation, open: false });
                        setLines((p) => [...p, { at: Date.now(), who: "OP", text: `Call regraded ${escalation.grade} — ${escalation.reason}` }]);
                        onNote(`${s.title} — call regraded ${escalation.grade} at the desk: ${escalation.reason}`);
                      }}
                    >
                      Record escalation
                    </button>
                    <button type="button" className="vec-btn" onClick={() => setEscalation(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button type="button" className="vec-btn" style={{ borderColor: "var(--vec-warn)", color: "var(--vec-warn)" }} onClick={() => setEscalation({ open: true, reason: "", grade: gradeShort(impliedGrade(s)) })}>
                  Escalate call
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
              <span className="mono go">Sources agree</span>
            </header>
            <div className="body">
              <div className="vec-field in-use">
                <div className="vec-k"><span>EISEC · landline lookup</span><span style={{ color: "var(--vec-go)" }}>BEST</span></div>
                <div className="vec-v">{addr.line1}</div>
                <div className="vec-small">{addr.line2} · Exact address from the calling number</div>
              </div>
              <div className="vec-field">
                <div className="vec-k"><span>AML · handset GPS</span><span>N/A</span></div>
                <div className="vec-v">Not available</div>
                <div className="vec-small">Fixed line — no handset fix</div>
              </div>
              <div className="vec-field">
                <div className="vec-k"><span>W3W · caller read three words</span><span>N/A</span></div>
                <div className="vec-v">Not offered</div>
                <div className="vec-small">Address already confirmed by EISEC</div>
              </div>
              <div className="vec-field">
                <div className="vec-k"><span>SMS · location request</span><span>N/A</span></div>
                <div className="vec-v">Not applicable</div>
                <div className="vec-small">Cannot text a landline</div>
              </div>
              <div className="vec-field" style={{ background: "var(--vec-surface-raised)" }}>
                <div className="vec-k">Fix in use</div>
                <div className="vec-v">EISEC · landline lookup</div>
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

        {/* Centre — confirm location + assessment */}
        <div style={{ display: "grid", gridTemplateRows: "auto minmax(0, 1fr)", gap: 6, minHeight: 0 }}>
          <div className="vec-box">
            <header>
              <span>Confirm location</span>
              <span className={`mono ${confirmed ? "go" : "stop"}`}>{confirmed ? "Confirmed" : "Not confirmed"}</span>
            </header>
            <div style={{ padding: "6px 10px 8px" }}>
              <div className="vec-k">Location source · EISEC · Exact address from the calling number</div>
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <div className="vec-btn" style={{ flex: 1, textAlign: "left", fontSize: 12 }}>
                  {s.location.address} · {s.location.postcode}
                </div>
                <button
                  type="button"
                  className={`vec-btn ${confirmed ? "go" : "solid"}`}
                  onClick={() => {
                    if (confirmed) return;
                    setConfirmed(true);
                    setLines((p) => [
                      ...p,
                      { at: Date.now(), who: "OP", text: `Can I confirm the address — ${s.location.address}?` },
                      { at: Date.now(), who: "CALR", text: "Yes, that's right." },
                    ]);
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
              <span>Call assessment &amp; dialogue</span>
              <span className="mono">
                {askedCount} of {questions.length} asked{" "}
                <button type="button" className="vec-btn mini" onClick={() => setAsked({})}>Reset</button>
              </span>
            </header>
            <div className="body" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)", minHeight: 0 }}>
              <div style={{ overflow: "auto", borderRight: "1px solid var(--vec-border)" }}>
                {groups.map((g) => {
                  const qs = questions.filter((q) => q.group === g);
                  const done = qs.filter((q) => asked[q.id]).length;
                  return (
                    <div key={g}>
                      <div className="vec-sect">
                        <span>{g}</span>
                        <span>{done}/{qs.length}</span>
                      </div>
                      {qs.map((q) => (
                        <div key={q.id} className={`vec-qrow ${asked[q.id] ? "asked" : ""}`}>
                          <div>
                            <div>{q.text}</div>
                            {asked[q.id] && <div className="ans">“{asked[q.id]}”</div>}
                          </div>
                          <button type="button" disabled={!!asked[q.id] || ended} onClick={() => ask(q)}>
                            {asked[q.id] ? "ASKED" : "ASK"}
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
              <div style={{ overflow: "auto", display: "flex", flexDirection: "column" }}>
                <div className="vec-sect">
                  <span>Call dialogue</span>
                  <span>{lines.length} lines</span>
                </div>
                <div className="vec-dialogue">
                  {lines.map((l, i) => (
                    <div key={i}>
                      <span>{hhmmss(l.at)}</span>
                      <span className={`who ${l.who === "CALR" ? "calr" : ""}`}>{l.who}</span>
                      <span className={`txt ${l.tone ?? ""}`}>{l.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column — incident type, other services, ready to open */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: 0, overflow: "auto" }}>
          <div className="vec-box" style={{ flex: "0 0 auto" }}>
            <header>
              <span>Incident type</span>
              <span className={`mono ${type ? "go" : ""}`}>{type ? "Set" : "Not set"}</span>
            </header>
            <div className="vec-typechips">
              {typeOptions.map((t) => (
                <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(t)}>
                  {t}
                </button>
              ))}
            </div>
            <div className="vec-sect"><span>This type sends</span></div>
            <div style={{ padding: "6px 10px", fontSize: 11 }}>
              {type ? (
                <>
                  {s.pda.map((p) => (
                    <div key={p.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "2px 0" }}>
                      <span>{p.label}</span>
                      <span className={`vec-svc-pill ${p.service}`}>{SERVICE_SHORT[p.service]}</span>
                    </div>
                  ))}
                  {type !== typeLabel && (
                    <div className="vec-small" style={{ color: "var(--vec-warn)" }}>
                      Typed as “{type}” — the attendance still follows the nature given: {typeLabel}.
                    </div>
                  )}
                </>
              ) : (
                <span className="vec-small">Choose a type to see the attendance it sends.</span>
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
                      setLines((p) => [...p, { at: Date.now(), who: "OP", text: `${o} added to the attendance.` }]);
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
                      setLines((p) => [...p, { at: Date.now(), who: "OP", text: `Call passed to ${o} control (simulated).` }]);
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
              <span>Ready to open</span>
              <span className={`mono ${outstanding ? "stop" : "go"}`}>{outstanding ? `${outstanding} outstanding` : "Ready"}</span>
            </header>
            <div className="vec-checks">
              {readiness.map((r) => (
                <div key={r.text}>
                  <i className={r.ok ? "" : "stop"} />
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
            <button
              type="button"
              className="vec-create"
              disabled={outstanding > 0 || notCovered.length > 0}
              onClick={() => {
                const note = [type ?? typeLabel, access.trim() ? `access: ${access.trim()}` : null, escalation && !escalation.open ? `regraded ${escalation.grade}` : null].filter(Boolean).join(" · ");
                onCreate(call, note);
              }}
            >
              Create incident &amp; mobilise
            </button>
            <div className="vec-small" style={{ padding: "0 10px 8px" }}>
              {askedCount} of {questions.length} questions asked · remaining questions do not prevent mobilisation
            </div>
            <div style={{ display: "flex", gap: 6, padding: "0 10px 10px" }}>
              <button
                type="button"
                className="vec-btn"
                onClick={() => {
                  setEnded(true);
                  onEndCall(call, !!s.disposal);
                }}
                title={s.disposal ? "Close at the desk — advice given, nobody sent" : "Put the phone down with nobody sent"}
              >
                {s.disposal ? "Close at desk · advice given" : "End call · no deployment"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
