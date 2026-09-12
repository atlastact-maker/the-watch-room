"use client";

// PNC on the MDT — the enquiry form on the left, the terminal's answer on
// the right, in the block capitals a real return comes back in. Runs the
// same LEDS enquiries as the desk (vehicleCheck / personCheck over the
// shift's record index) and writes to the same audit, so a check made in
// the car shows on the control room's list with the unit that made it.

import { useState, type ReactNode } from "react";
import { dobDisplay, type RecordIndex, type PersonRecord } from "@/lib/sim/records";
import { POLICING_PURPOSES, normaliseDob, parsePersonQuery, personCheck, vehicleCheck, type LedsCheck, type LedsReturn, type PolicingPurpose, type VehicleReturn } from "@/lib/sim/leds";

type Kind = "vehicle" | "person" | "property";

type PropertyReturn = { kind: "property"; query: string; trace: boolean; hits: { owner: string; role: string; text: string }[] };
type Result = { r: LedsReturn | PropertyReturn; ref: string; at: number };

const KIND_LABEL: Record<Kind, string> = { vehicle: "Vehicle", person: "Names", property: "Property" };
const KIND_FIELD: Record<Kind, string> = { vehicle: "Registration", person: "Names", property: "Serial / description" };

function stamp(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}
function hm(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
const up = (s: string | undefined) => (s ?? "").toUpperCase();

function propertyCheck(index: RecordIndex, query: string): PropertyReturn {
  const q = query.trim().toLowerCase();
  if (q.length < 3) return { kind: "property", query, trace: false, hits: [] };
  const hits: PropertyReturn["hits"] = [];
  for (const p of index.people) {
    for (const n of p.notes ?? []) if (n.toLowerCase().includes(q) || /property|imei|serial|stolen/i.test(n) && n.toLowerCase().includes(q.split(" ")[0])) hits.push({ owner: p.name, role: p.roles.join(" / "), text: n });
  }
  for (const v of index.vehicles) {
    for (const n of v.notes ?? []) if (n.toLowerCase().includes(q)) hits.push({ owner: v.vrm, role: "vehicle", text: n });
  }
  return { kind: "property", query, trace: hits.length > 0, hits: hits.slice(0, 6) };
}

export type PncPageProps = {
  index?: RecordIndex;
  incidentId: string;
  incidentRef: string;
  unitCallsign: string;
  checks: LedsCheck[];
  now: number;
  /** The plate or name the module was opened with. */
  seed?: { query: string; kind: "vehicle" | "person" } | null;
  context?: { vehicle?: string; person?: string };
  onCheck?: (c: LedsCheck) => void;
  onNote?: (text: string) => void;
};

export function PncPage(props: PncPageProps) {
  const { index, checks, now, unitCallsign } = props;
  const [kind, setKind] = useState<Kind>(props.seed?.kind ?? "vehicle");
  const [query, setQuery] = useState(props.seed?.query ?? "");
  // What the terminal made of a names line — echoed under the input so
  // the operator sees the enquiry before it runs.
  const parsedPerson = kind === "person" && query.trim() ? parsePersonQuery(query) : null;
  const parsedDob = parsedPerson?.dob ? normaliseDob(parsedPerson.dob) : undefined;
  const [purpose, setPurpose] = useState<PolicingPurpose>("incident");
  const [results, setResults] = useState<Result[]>([]);
  const [ix, setIx] = useState(0);
  const [view, setView] = useState<"summary" | "detail">("summary");
  const [error, setError] = useState<string | null>(null);
  const current = results[ix];
  const mine = checks.filter((c) => c.incidentId === props.incidentId || c.reason?.includes(unitCallsign)).slice(-6).reverse();
  const recent = mine.length ? mine : checks.slice(-6).reverse();

  function submit() {
    if (!index) return setError("The record index is not available on this tablet.");
    if (query.trim().length < 2) return setError(kind === "person" ? "Enter a name — SURNAME/FORENAME:DDMMYYYY." : "Enter a registration, a name or a description.");
    if (kind === "person" && parsedPerson?.dob && !parsedDob) return setError(`Date of birth "${parsedPerson.dob}" not understood — DDMMYYYY after the colon.`);
    setError(null);
    const at = Date.now();
    const ref = `SIM-${String(checks.length + 1).padStart(5, "0")}`;
    if (kind === "property") {
      const r = propertyCheck(index, query);
      setResults([{ r, ref, at }]);
      setIx(0);
      setView("summary");
      props.onNote?.(`${unitCallsign} · PNC property enquiry "${query.trim()}" — ${r.trace ? `${r.hits.length} report${r.hits.length === 1 ? "" : "s"}` : "no trace"}`);
      return;
    }
    const list: Result[] = [];
    if (kind === "vehicle") {
      list.push({ r: vehicleCheck(index, query), ref, at });
    } else {
      const r = personCheck(index, query);
      if (r.ambiguous?.length) {
        r.ambiguous.forEach((p: PersonRecord, i: number) => list.push({ r: personCheck(index, p.name, parsedPerson?.dob), ref: `${ref}/${i + 1}`, at }));
      } else {
        list.push({ r, ref, at });
      }
    }
    setResults(list);
    setIx(0);
    setView("summary");
    props.onCheck?.({
      id: `leds-${at}-${ref}`,
      atMs: at,
      kind: kind === "vehicle" ? "vehicle" : "person",
      query: kind === "person" ? query.trim().toUpperCase() : query.trim(),
      purpose,
      incidentId: props.incidentId,
      reason: `${unitCallsign} · MDT`,
      result: list[0].r as LedsReturn,
    });
  }

  function clear() {
    setQuery("");
    setResults([]);
    setIx(0);
    setError(null);
  }

  const line = (k: string, v: ReactNode, tone?: "warn" | "stop" | "go") => (
    <div className="pnc-line"><span>{k}</span><i>:</i><b className={tone}>{v}</b></div>
  );
  const section = (title: string, body: ReactNode) => (
    <section className="pnc-section"><h3>{title}</h3>{body}</section>
  );

  const keeperOf = (r: VehicleReturn) => (r.keeperId ? index?.people.find((p) => p.id === r.keeperId) : undefined);

  const summary = (res: Result): ReactNode => {
    const r = res.r;
    if (!r.trace) {
      return (
        <>
          {section("ENQUIRY", line(r.kind === "vehicle" ? "Registration" : r.kind === "person" ? "Name" : "Property", up(r.kind === "vehicle" ? r.vrm : r.kind === "person" ? r.name : r.kind === "property" ? r.query : r.address)))}
          <p className="pnc-notrace">{r.kind === "person" && r.notes.length ? up(r.notes[0]) : "NO TRACE — NOTHING HELD AGAINST THIS ENQUIRY"}</p>
        </>
      );
    }
    if (r.kind === "vehicle") {
      const keeper = keeperOf(r);
      const reports = r.markers;
      return (
        <>
          {section("VEHICLE DETAILS", <>
            {line("Registration", up(r.vrm))}
            {line("Make", up(r.make) || "NOT HELD")}
            {line("Model", up(r.model) || "NOT HELD")}
            {line("Colour", up(r.colour) || "NOT HELD")}
            {line("Tax", r.taxed === false ? "NOT TAXED" : "TAXED", r.taxed === false ? "warn" : undefined)}
            {line("MOT", r.mot === false ? "NO VALID MOT" : "VALID", r.mot === false ? "warn" : undefined)}
            {line("Insurance", r.insured === false ? "NO POLICY ON MID" : "POLICY HELD", r.insured === false ? "stop" : undefined)}
          </>)}
          {section("REGISTERED KEEPER", <>
            {line("Name", up(keeper?.name ?? r.keeperName?.split(" — ")[0]) || "NOT HELD")}
            {line("Address", up(keeper?.address ?? r.keeperName?.split(" — ")[1]) || "NOT HELD")}
          </>)}
          {section("POLICE REPORTS", reports.length === 0 ? line("Count", "0 — NO REPORTS") : <>
            {line("Count", String(reports.length))}
            {reports.map((m, i) => (
              <div key={m.code + i} className="pnc-report">
                {line("Reference", `${res.ref}-${String(i + 1).padStart(2, "0")}`)}
                {line("Type", up(m.code))}
                {line("Status", "REVIEW REQUIRED", "warn")}
                {line("Text", up(m.detail ?? r.notes[i] ?? "SEE REPORT DETAILS"))}
              </div>
            ))}
          </>)}
        </>
      );
    }
    if (r.kind === "person") {
      return (
        <>
          {section("PERSON DETAILS", <>
            {line("Name", up(r.name))}
            {line("Sex", r.sex ?? "NOT HELD")}
            {line("Date of birth", r.dob ? `${dobDisplay(r.dob)}${r.age ? ` (AGE ${r.age})` : ""}` : r.age ? `AGE ${r.age}` : "NOT HELD")}
            {line("Address", up(r.address) || "NO FIXED ADDRESS")}
          </>)}
          {section("WARNING SIGNALS", r.warnings.length === 0 && !r.wanted && !r.missing ? line("Signals", "NONE") : <>
            {r.wanted && line("WANTED", "YES — SEE REPORTS", "stop")}
            {r.missing && line("MISSING", "YES — SEE REPORTS", "warn")}
            {r.warnings.map((w) => line(up(w.code), up(w.detail) || "MARKER", "stop"))}
          </>)}
          {section("POLICE REPORTS", r.notes.length === 0 ? line("Count", "0 — NO REPORTS") : <>
            {line("Count", String(r.notes.length))}
            {r.notes.map((n, i) => (
              <div key={i} className="pnc-report">
                {line("Reference", `${res.ref}-${String(i + 1).padStart(2, "0")}`)}
                {line("Type", /warrant|wanted/i.test(n) ? "WANTED / WARRANT" : /assault|violen/i.test(n) ? "VIOLENCE" : /theft|burglar|robber/i.test(n) ? "ACQUISITIVE CRIME" : "INTELLIGENCE")}
                {line("Text", up(n.length > 90 ? `${n.slice(0, 90)}…` : n))}
              </div>
            ))}
          </>)}
          {r.vehicleIds.length > 0 && section("VEHICLES", r.vehicleIds.map((id) => { const v = index?.vehicles.find((x) => x.id === id); return v ? line(up(v.vrm), up([v.colour, v.make, v.model].filter(Boolean).join(" "))) : null; }))}
        </>
      );
    }
    if (r.kind === "property") {
      return section("PROPERTY REPORTS", <>
        {line("Count", String(r.hits.length))}
        {r.hits.map((h, i) => (
          <div key={i} className="pnc-report">
            {line("Reference", `${res.ref}-${String(i + 1).padStart(2, "0")}`)}
            {line("Reported by", `${up(h.owner)} (${up(h.role)})`)}
            {line("Text", up(h.text))}
          </div>
        ))}
      </>);
    }
    return section("ADDRESS", line("Address", up(r.address)));
  };

  const detail = (res: Result): ReactNode => {
    const r = res.r;
    const notes = r.kind === "property" ? r.hits.map((h) => h.text) : r.notes;
    return section("REPORT DETAILS", notes.length === 0 ? <p className="pnc-plain">NO REPORT TEXT HELD.</p> : notes.map((n, i) => <p key={i} className="pnc-plain"><b>{String(i + 1).padStart(2, "0")}</b> {n}</p>));
  };

  const heading = current ? `PNC — ${current.r.kind === "vehicle" ? "VEHICLE" : current.r.kind === "person" ? "NAMES" : current.r.kind === "property" ? "PROPERTY" : "ADDRESS"} ENQUIRY` : `PNC — ${KIND_LABEL[kind].toUpperCase()} ENQUIRY`;
  const enquiryLine = current ? `ENQUIRY: ${current.r.kind === "vehicle" ? "REGISTRATION" : current.r.kind === "person" ? "NAME" : "PROPERTY"} ${up(current.r.kind === "vehicle" ? current.r.vrm : current.r.kind === "person" ? current.r.name : current.r.kind === "property" ? current.r.query : current.r.address)}` : null;
  const hot = current && current.r.kind !== "property" && (current.r.kind === "vehicle" ? current.r.markers.some((m) => ["STOLEN", "ANPR INTEREST", "PNC MARKER"].includes(m.code)) : current.r.kind === "person" ? current.r.wanted || current.r.warnings.length > 0 : false);

  return (
    <div className="pnc-page">
      <div className="pc-col">
        <section className="pc-card">
          <header><b>▤</b><span>PNC ENQUIRY</span></header>
          <div className="pc-card-body">
            <div className="pnc-kinds">
              {(["vehicle", "person", "property"] as Kind[]).map((k) => <button key={k} type="button" aria-pressed={kind === k} onClick={() => { setKind(k); setError(null); }}>{KIND_LABEL[k]}</button>)}
            </div>
            <label className="pc-field inline"><span>{KIND_FIELD[kind]}</span><input className={kind === "person" ? "pnc-names" : undefined} value={query} onChange={(e) => setQuery(kind === "person" ? e.target.value.toUpperCase() : e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} placeholder={kind === "vehicle" ? "AB12 CDE" : kind === "person" ? "SURNAME/FORENAME:DDMMYYYY" : "IMEI, serial or description"} spellCheck={false} autoCapitalize={kind === "person" ? "characters" : undefined} /></label>
            {kind === "person" && (
              <p className={`pc-info pnc-parse${parsedPerson?.dob && !parsedDob ? " warn" : ""}`}>
                <span>{!parsedPerson ? "Surname, a slash, forename, a colon, date of birth — DEAKIN/CALLUM:01011995" : parsedPerson.structured ? `${parsedPerson.name || "—"}${parsedPerson.dob ? ` · DOB ${parsedDob ? dobDisplay(parsedDob) : `${parsedPerson.dob} ?`}` : " · no date of birth"}` : `Free text · ${parsedPerson.name} — add /FORENAME:DDMMYYYY to narrow it`}</span>
              </p>
            )}
            <label className="pc-field inline"><span>Reason</span>
              <select value={purpose} onChange={(e) => setPurpose(e.target.value as PolicingPurpose)}>{(Object.keys(POLICING_PURPOSES) as PolicingPurpose[]).map((k) => <option key={k} value={k}>{POLICING_PURPOSES[k]}</option>)}</select>
            </label>
            <label className="pc-field inline"><span>Incident</span><output>{props.incidentRef}</output></label>
            <label className="pc-field inline"><span>Requesting unit</span><output>{unitCallsign}</output></label>
            {error && <p className="pc-info warn"><span>{error}</span></p>}
            <div className="pnc-form-btns">
              <button type="button" className="pc-primary" onClick={submit} disabled={!index}>Submit enquiry</button>
              <button type="button" className="pc-mini" onClick={clear}>Clear</button>
            </div>
          </div>
        </section>
        <section className="pc-card">
          <header><b>≡</b><span>RECENT ENQUIRIES</span></header>
          <div className="pc-card-body">
            <table className="pc-table select">
              <thead><tr><th>Time</th><th>Type</th><th>Reference</th></tr></thead>
              <tbody>
                {recent.length === 0 && <tr><td colSpan={3} className="empty">No enquiries this shift</td></tr>}
                {recent.map((c) => (
                  <tr key={c.id} className={current && c.query === query ? "on" : ""} onClick={() => { setKind(c.kind === "vehicle" ? "vehicle" : "person"); setQuery(c.query); }}>
                    <td>{hm(c.atMs)}</td><td>{c.kind === "vehicle" ? "Vehicle" : c.kind === "person" ? "Names" : "Address"}</td><td>{c.query.toUpperCase()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="pc-card">
          <header><b>i</b><span>CONTEXT</span></header>
          <div className="pc-card-body">
            <dl className="pc-facts">
              <dt>Unit</dt><dd>{unitCallsign}</dd>
              {props.context?.vehicle && (<><dt>Selected vehicle</dt><dd><button type="button" className="pc-link" onClick={() => { setKind("vehicle"); setQuery(props.context!.vehicle!); }}>{props.context.vehicle}</button></dd></>)}
              {props.context?.person && (<><dt>Selected person</dt><dd><button type="button" className="pc-link" onClick={() => { setKind("person"); setQuery(props.context!.person!); }}>{props.context.person}</button></dd></>)}
            </dl>
            <p className="pc-info"><span>SIMULATED PNC • FICTIONAL DATA</span></p>
          </div>
        </section>
      </div>

      <section className={`pnc-term${hot ? " hot" : ""}`} aria-live="polite">
        <header className="pnc-term-head">
          <span>{heading}</span>
          <span>{current ? `RESULT ${ix + 1} OF ${results.length}` : "READY"}</span>
          <span>{stamp(now)}</span>
        </header>
        <div className="pnc-term-body">
          {!current ? (
            <p className="pnc-plain dim">ENTER AN ENQUIRY AND SUBMIT. EVERY ENQUIRY IS AUDITED AGAINST THE UNIT AND THE INCIDENT.</p>
          ) : (
            <>
              <p className="pnc-enq">{enquiryLine}</p>
              {view === "summary" ? summary(current) : detail(current)}
              <p className="pnc-end">END OF {view === "summary" ? "SUMMARY" : "REPORT"}</p>
            </>
          )}
        </div>
        <div className="pnc-term-foot">
          <div className="pnc-seg">
            <button type="button" aria-pressed={view === "summary"} onClick={() => setView("summary")}>Summary</button>
            <button type="button" aria-pressed={view === "detail"} onClick={() => setView("detail")} disabled={!current}>Report details</button>
          </div>
          <div className="pnc-seg">
            <button type="button" disabled={ix === 0} onClick={() => setIx((i) => Math.max(0, i - 1))}>Previous result</button>
            <button type="button" disabled={ix >= results.length - 1} onClick={() => setIx((i) => Math.min(results.length - 1, i + 1))}>Next result</button>
          </div>
          <p className="pc-info"><span>{hot ? "MARKER HELD — approach with the warning signals in mind." : current ? `Confirm the record matches the ${current.r.kind === "person" ? "person" : "vehicle"} being checked.` : "Choose the reason for the check before you run it."}</span></p>
        </div>
        <footer className="pnc-term-status">
          <span>{current ? `Enquiry complete • Operator ${unitCallsign} • Reference ${current.ref}` : `Operator ${unitCallsign} • ${checks.length} enquiries this shift`}</span>
          <span>SIMULATED PNC • FICTIONAL DATA</span>
        </footer>
      </section>
    </div>
  );
}

