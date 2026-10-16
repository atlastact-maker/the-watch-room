"use client";

// The operator guide: the complete shift in operational order, written
// for an operator sitting down at the console for the first time. Every
// standard quoted here is the one the debrief assesses against
// (lib/sim/scoring), so the guide and the grade never disagree.

import Link from "next/link";
import { STATUS_LABELS } from "@/lib/sim/types";
import { Icon } from "./icons";
import { COMMUNITY, viewHref } from "./menu-types";
import styles from "./watch-menu.module.css";

const CHAPTERS = [
  { id: "the-shift", n: "01", title: "Shift configuration" },
  { id: "the-call", n: "02", title: "Call handling" },
  { id: "the-desk", n: "03", title: "The operator console" },
  { id: "the-ground", n: "04", title: "Incident command" },
  { id: "stand-down", n: "05", title: "Stand-down and cover" },
  { id: "the-debrief", n: "06", title: "Performance standards and grading" },
  { id: "controls", n: "07", title: "Controls and shortcuts" },
  { id: "know", n: "08", title: "Reference" },
];

const SCREENS = [
  { key: "F2", name: "Dispatch", body: "County board: active incidents, the call queue, the map and the incident log. The primary operating position." },
  { key: "F3", name: "Calls", body: "Call handling: the active caller and the queue behind them. Key questions, coding, grading and mobilisation." },
  { key: "F4", name: "Mobilising", body: "The attendance required, slot by slot, with every county resource priced by ETA and by the cover impact of mobilising it." },
  { key: "F5", name: "Ground", body: "The incident ground to scale, crews deployed, and the mobile data terminal (MDT) for incident command." },
  { key: "F6", name: "Resources", body: "Availability by resource type and bay, stations without cover, and the standby moves that would restore it." },
  { key: "F9", name: "MDT", body: "Opens the MDT on the incident ground; shows or hides it once open." },
];

const STANDARDS = [
  { what: "First resource mobilised", target: "Within 90 seconds of call receipt" },
  { what: "First resource in attendance", target: "Within 10 minutes, or the published response standard for the police grade assigned (60 minutes for Grade 2)" },
  { what: "Attendance", target: "Every slot filled; no resource stood down before arrival" },
  { what: "Incident command", target: "Incident commander appointed on the incident ground" },
  { what: "Assistance messages", target: "Each answered within three minutes" },
  { what: "Call handling", target: "Mobilised within 90 seconds of answer; all key questions asked" },
];

const GRADES: { grade: string; share: string; words: string; cls: string }[] = [
  { grade: "A", share: "95% and above", words: "Exemplary. Standards met throughout.", cls: styles.gradeA },
  { grade: "B", share: "75% and above", words: "Sound. Minor standards missed.", cls: styles.gradeB },
  { grade: "C", share: "50% and above", words: "Significant gaps against the standard.", cls: styles.gradeC },
  { grade: "D", share: "25% and above", words: "Multiple standards missed.", cls: styles.gradeD },
  { grade: "F", share: "Below 25%", words: "Incident not managed to standard.", cls: styles.gradeF },
];

const TERMS: [string, string][] = [
  ["PDA", "Pre-determined attendance. The standard set of resources mobilised to an incident type; presented as the slots on the Mobilising screen."],
  ["Make pumps 4", "Assistance message from the incident ground requesting additional fire appliances. The figure is the total required at the incident, not the number additional."],
  ["BA", "Breathing apparatus. Teams are committed through entry control and must be out before their time of whistle."],
  ["Stop message", "Message from the incident commander confirming the incident is under control. Closes the incident and generates the debrief."],
  ["Standby move", "Relocation of an available resource to another station so that an area is not left without cover."],
  ["Fend-off", "An appliance positioned across the live lanes to protect the working area from approaching traffic."],
  ["Rolling road block", "A roads policing unit holding traffic from the junction behind the scene."],
  ["Delegation", "Transfer of incident ground command to the on-scene commander. Mobilising and resourcing remain with control."],
];

const LIMITS = [
  "A limited set of incident types is released to testers; the remainder are under review and released individually.",
  "Single operator, single county. Multi-operator working is not yet supported.",
  "The console requires a laptop or desktop display. MDT views are designed for a second display and are not supported on a phone.",
  "Timings, standards and grading thresholds are subject to change as advisor feedback is incorporated.",
];

function CommandLoop() {
  const nodes = ["Call", "Dispatch", "Mobilise", "Command", "Debrief"];
  return (
    <div className={styles.loopWrap}><svg className={styles.loop} viewBox="0 0 760 120" role="img" aria-label="Incident lifecycle: call, dispatch, mobilise, command, debrief, then cover restored for the next call">
      <defs><marker id="loop-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 8 4 0 8z" fill="#e6b65c" /></marker></defs>
      {nodes.map((n, i) => {
        const x = 60 + i * 160;
        return (
          <g key={n}>
            {i < nodes.length - 1 && <line x1={x + 58} y1="48" x2={x + 100} y2="48" stroke="#e6b65c" strokeWidth="1.5" markerEnd="url(#loop-arrow)" />}
            <rect x={x - 58} y="24" width="116" height="48" rx="4" fill="#171d1f" stroke={i === 3 ? "#e6b65c" : "#3a4648"} strokeWidth="1.2" />
            <text x={x} y="44" textAnchor="middle" className={styles.loopNo}>{String(i + 1).padStart(2, "0")}</text>
            <text x={x} y="62" textAnchor="middle" className={styles.loopLabel}>{n.toUpperCase()}</text>
          </g>
        );
      })}
      <path d="M700 72 v22 H60 v-12" fill="none" stroke="#3a4648" strokeWidth="1.5" strokeDasharray="4 5" markerEnd="url(#loop-arrow)" />
      <text x="380" y="110" textAnchor="middle" className={styles.loopNote}>COVER RESTORED · NEXT CALL</text>
    </svg></div>
  );
}

export function GuideView() {
  return (
    <div className={styles.guide}>
      <nav className={styles.toc} aria-label="Chapters">
        <p>Contents</p>
        <ol>
          {CHAPTERS.map((c) => <li key={c.id}><a href={`#${c.id}`}><span>{c.n}</span>{c.title}</a></li>)}
        </ol>
        <div className={styles.tocFoot}>
          <Link className={styles.primary} href={viewHref("shift")}>Start shift <Icon.arrow /></Link>
          <Link className={styles.button} href="/glossary">Reference library</Link>
        </div>
      </nav>

      <article className={styles.doc}>
        <header className={styles.pageHead}>
          <div>
            <p className={styles.eyebrow}>Operator guide · command briefing</p>
            <h1 className={styles.pageTitle}>Operating the console: call receipt to stop message.</h1>
            <p className={styles.lede}>The Watch Room places a single operator in control of a county: call handling, mobilising and incident command across fire &amp; rescue, ambulance and police. This guide covers the complete shift in operational order. Every standard quoted is the one the debrief assesses against.</p>
          </div>
        </header>
        <CommandLoop />

        <section id="the-shift" className={styles.chapter}>
          <p className={styles.chapterNo}>01</p>
          <h2>Shift configuration</h2>
          <p>A shift runs from twenty minutes to an hour of real time. Before the clock starts, the operator sets the call volume and the services under command. <strong>Quiet</strong>: reduced call volume for familiarisation with the console and the incident ground. <strong>Standard</strong>: a steady flow of calls across the county. <strong>Busy</strong>: concurrent incidents competing for the same resources. Services are selected individually or together (fire &amp; rescue, ambulance, police); the call types, resources and standards follow the selection.</p>
          <p>The <strong>resourcing page</strong> is presented before the clock starts: appliances on the run, appliances off the run, and stations short of establishment. It is the resource picture for the shift. Review it before the first call.</p>
          <p>Leaving the console saves the shift to this browser. <em>Resume shift</em> continues from the saved state. Starting a new shift replaces the saved one.</p>
          <aside className={styles.callout}><Icon.clock /><span>The clock runs in real time, as does the county. Drive times vary with the hour and the weather: an attendance in the evening peak takes longer than the same run at 03:00.</span></aside>
        </section>

        <section id="the-call" className={styles.chapter}>
          <p className={styles.chapterNo}>02</p>
          <h2>Call handling</h2>
          <p>Calls arrive on four channels. <strong>999</strong>: emergency calls. <strong>NHS 111</strong>: lower-acuity ambulance calls, some of which require advice rather than a response. <strong>101</strong>: non-emergency police demand. <strong>Community</strong>: reports received through a third party such as a housing officer or a neighbour. Not every call requires a resource: a 111 or 101 call may be closed with the appropriate disposal, and the debrief assesses a closure as closely as a mobilisation.</p>
          <p>Obtain the key information: location, nature of the incident, casualties, and whether the incident is ongoing. The caller answers the questions asked. Assign the opening code: <strong>NICL</strong> for fire calls, <strong>IRS</strong> or <strong>AMPDS</strong> for ambulance calls, a <strong>grade</strong> for police calls. The code determines the attendance the console proposes.</p>
          <p>Mobilise on location and nature of call. Do not hold for the full picture: the standard is a first resource mobilised within <strong>90 seconds</strong> of call receipt. Pre-arrival advice is delivered while resources are en route.</p>
          <aside className={styles.callout}><Icon.warn /><span>A graded police call is assessed against the published response standard for its grade (60 minutes for Grade 2), not the 10-minute attendance standard applied to other calls. The grade assigned sets the response commitment.</span></aside>
        </section>

        <section id="the-desk" className={styles.chapter}>
          <p className={styles.chapterNo}>03</p>
          <h2>The operator console</h2>
          <p>The console comprises five screens, each on a function key. All mobilising, holding and resource movement is carried out from these screens.</p>
          <dl className={styles.screens}>
            {SCREENS.map((s) => <div key={s.key}><dt><kbd>{s.key}</kbd>{s.name}</dt><dd>{s.body}</dd></div>)}
          </dl>
          <h3>Mobilising</h3>
          <p>An incident opens with its attendance as unfilled slots. Every county resource is presented as a card showing its ETA, calculated on the road network with the blue-light advantage appropriate to its class, and the cover impact of mobilising it (<em>empties Whitefield</em>, <em>last pump in the east</em>). Drag a card into a slot, or select <em>Allocate &amp; send</em>. <em>Fill remaining</em> accepts the console&apos;s recommendations for any open slots. A resource en route can be stood down; the stand-down is recorded.</p>
          <h3>Cover</h3>
          <p>An empty station is a gap in county cover. The Resources screen counts every resource type, shows every bay, and recommends a standby move when a station runs out with a donor within reach. A gap left open for fifteen minutes with a resource available to fill it is recorded on the debrief.</p>
          <h3>Road closures</h3>
          <p>A collision on a dual carriageway closes a section of carriageway, not a single lane. Resources approaching from behind the scene are held in traffic until the police close the road. Once the road is closed, resources on the far side can be authorised to approach against the flow from the junction ahead, and all other traffic is routed around the closure.</p>
          <aside className={styles.callout}><Icon.guide /><span><strong>Delegation.</strong> Once a commander is on the incident ground, command can be delegated to them. Their assistance messages return to the console with three minutes to respond. Resourcing remains control&apos;s responsibility regardless of who holds command.</span></aside>
        </section>

        <section id="the-ground" className={styles.chapter}>
          <p className={styles.chapterNo}>04</p>
          <h2>Incident command</h2>
          <p>The Ground screen renders the incident to scale: the structure, the carriageway, hydrants, crews deployed and resources positioned as placed. Incident command is conducted from the mobile data terminal (MDT) beside it, in four applications.</p>
          <ul className={styles.apps}>
            <li><strong>Incident</strong><span>The incident and its log. The Ground page carries the Casualties, Fire, Police and Log menus for the selected resource.</span></li>
            <li><strong>Casualty care</strong><span>Patients, the monitor and the patient record.</span></li>
            <li><strong>Fire</strong><span>Fireground command.</span></li>
            <li><strong>Police</strong><span>PNC, ANPR and scene management.</span></li>
          </ul>
          <h3>Fire &amp; rescue</h3>
          <p>Sectorisation, the BA board and entry control, water supplies from hydrants and relays, jets, tactical mode, informative and stop messages, casualties located and recovered. Standards assessed at debrief: water on the fire within five minutes of arrival; offensive mode declared before crews are committed; an emergency team nominated at entry control before the first team is committed; every team out before its time of whistle; a water supply established before a tank runs dry; sector commanders appointed on a multi-pump incident.</p>
          <h3>Road traffic collisions</h3>
          <p>The Crash Recovery System (CRS) sheet for each vehicle identifies the battery, airbag, fuel and reinforced pillar locations. Make the vehicle safe before cutting: glass management, space creation, then extrication. Carriageway management is a police function on the Traffic tab: fend-off, lane closures, a rolling road block from the junction, the full closure and National Highways. The carriageway must be protected within twenty minutes of the first arrival. Any vehicle passing through the working area is recorded.</p>
          <h3>Casualty care</h3>
          <p>Primary survey and triage sieve; monitoring leads, probe and vital signs that respond as a patient&apos;s would; airway, breathing and circulation; oxygen and drugs within their administration rules; packaging and the extrication route; pre-alert and conveyance. A volunteer doctor or the air ambulance can be requested where the patient&apos;s needs exceed the crew&apos;s scope of practice.</p>
          <h3>Police</h3>
          <p>Containment and cordons, arrest, stop and search, PNC and LEDS checks on persons and vehicles, ANPR, pursuits and vehicle stops, domestic abuse risk assessment, custody and transport. Carriageway management requires a roads policing unit; a response vehicle cannot perform it.</p>
          <aside className={styles.callout}><Icon.warn /><span>Crew fatigue is modelled. Relief appliances, welfare breaks and the recovery period required after a BA wear are the operator&apos;s responsibility, and omissions are recorded at debrief.</span></aside>
        </section>

        <section id="stand-down" className={styles.chapter}>
          <p className={styles.chapterNo}>05</p>
          <h2>Stand-down and cover</h2>
          <p>The stop message closes the incident on the ground. Resources return to station, or convey to hospital, hand over and become available again; vehicles refuel and crews take welfare. Resource state is shown on the county board as status codes:</p>
          <ul className={styles.statusList}>
            {Object.entries(STATUS_LABELS).map(([code, label]) => <li key={code}><kbd>{code}</kbd>{label}</li>)}
          </ul>
          <p>Restore cover first. The debrief records how long stations stood empty while a resource was available to fill them, and whether every standby move was returned to its home station.</p>
        </section>

        <section id="the-debrief" className={styles.chapter}>
          <p className={styles.chapterNo}>06</p>
          <h2>Performance standards and grading</h2>
          <p>Every closed incident is assessed against the standard, line by line. The following apply to every incident:</p>
          <table className={styles.table}>
            <thead><tr><th>Standard</th><th>Target</th></tr></thead>
            <tbody>{STANDARDS.map((s) => <tr key={s.what}><td>{s.what}</td><td>{s.target}</td></tr>)}</tbody>
          </table>
          <p>Each incident type adds its own standards (fireground, carriageway, patient care) and the debrief shows each target against what occurred. The grade is the proportion of standards met, with a partially met standard counting as half:</p>
          <ul className={styles.gradeList}>
            {GRADES.map((g) => <li key={g.grade}><span className={`${styles.gradeBadge} ${g.cls}`}>{g.grade}</span><strong>{g.share}</strong><span>{g.words}</span></li>)}
          </ul>
          <p>Grades convert to <strong>command points</strong> (A 5, B 4, C 3, D 2, F 1) and the leaderboard ranks operators by points. The service record retains every shift and syncs to the account, so it carries between devices.</p>
        </section>

        <section id="controls" className={styles.chapter}>
          <p className={styles.chapterNo}>07</p>
          <h2>Controls and shortcuts</h2>
          <table className={styles.table}>
            <thead><tr><th>Control</th><th>Function</th></tr></thead>
            <tbody>
              <tr><td><kbd>F2</kbd> <kbd>F3</kbd> <kbd>F4</kbd> <kbd>F5</kbd> <kbd>F6</kbd></td><td>Switch to Dispatch, Calls, Mobilising, Ground and Resources.</td></tr>
              <tr><td><kbd>F9</kbd></td><td>Open the MDT on the incident ground; show or hide it once open.</td></tr>
              <tr><td>Drag a resource card into a slot</td><td>Allocate and mobilise in a single action.</td></tr>
              <tr><td>Select a callsign</td><td>Select that resource wherever it appears: card, bay or map.</td></tr>
              <tr><td>Pop out a tile</td><td>Open the log, the patients or the map in a separate window for a second display.</td></tr>
              <tr><td>Help → Report a problem</td><td>File a defect report from the console with the current screen, the incident and the last minute of the log attached.</td></tr>
            </tbody>
          </table>
          <aside className={styles.callout}><Icon.warn /><span>The console requires a laptop or desktop display. MDT views are designed for a second display and are not supported on a phone.</span></aside>
        </section>

        <section id="know" className={styles.chapter}>
          <p className={styles.chapterNo}>08</p>
          <h2>Reference</h2>
          <dl className={styles.terms}>
            {TERMS.map(([term, body]) => <div key={term}><dt>{term}</dt><dd>{body}</dd></div>)}
          </dl>
          <p>The reference library holds the remainder: every station, every appliance type and its inventory, callsigns and procedures.</p>
          <h3>Current build limitations</h3>
          <ul className={styles.bullets}>{LIMITS.map((l) => <li key={l}>{l}</li>)}</ul>
        </section>

        <footer className={styles.docFoot}>
          <Link className={styles.primary} href={viewHref("shift")}>Start shift <Icon.arrow /></Link>
          <Link className={styles.button} href="/glossary">Reference library</Link>
          <a className={styles.button} href={COMMUNITY} target="_blank" rel="noreferrer">Tester channel <Icon.external /></a>
        </footer>
      </article>
    </div>
  );
}
