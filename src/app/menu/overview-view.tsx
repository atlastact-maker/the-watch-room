"use client";

// The operations overview: where the operator stands, the county they command,
// and the way in. Everything on it is live from this browser's record
// and the station data the desk runs on; nothing is decoration.

import Link from "next/link";
import type { CSSProperties } from "react";
import { LATEST, formatEntryDate } from "@/lib/changelog";
import { commandScore } from "@/lib/sim/stats";
import type { ServiceCode } from "@/lib/sim/types";
import { CountyPlate, SERVICE_TINT, type PlateStation } from "./county-plate";
import { Icon } from "./icons";
import { COMMUNITY, LIFECYCLE, intensityName, serviceName, viewHref, type CountyFacts, type SystemsStatus } from "./menu-types";
import { InductionPanel } from "./induction-panel";
import { SystemsStrip } from "./systems-strip";
import type { usePlayerRecord } from "./use-player-record";
import styles from "./watch-menu.module.css";

type PlayerRecord = ReturnType<typeof usePlayerRecord>;

const GRADE_TONE: Record<string, string> = { A: styles.gradeA, B: styles.gradeB, C: styles.gradeC, D: styles.gradeD, F: styles.gradeF };

const unitsWord = (service: ServiceCode) => (service === "Fire" ? "appliances" : service === "Ambulance" ? "vehicles" : "units");
const shiftStatus = (record: PlayerRecord) => (!record.loaded ? "Reading shift status…" : record.save ? "Shift in progress" : "No shift in progress");

export function OverviewView({ record, callsign, discord, facts, stations, systems }: { record: PlayerRecord; callsign: string; discord: string; facts: CountyFacts; stations: PlateStation[]; systems: SystemsStatus | null }) {
  const savedAgo = record.save ? Math.max(0, Math.round((record.now - record.save.savedAt) / 60000)) : 0;
  const career = record.career;
  const played = !!career && (career.callsAnswered > 0 || career.incidentsResolved > 0);
  const score = career ? commandScore(career) : 0;
  const targetPct = career && career.targetsTotal > 0 ? Math.round((career.targetsMet / career.targetsTotal) * 100) : null;
  const totalStations = facts.services.reduce((n, s) => n + s.stations, 0);
  const totalAppliances = facts.services.reduce((n, s) => n + s.appliances, 0);
  const back = !!(record.save || record.last || played);

  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.eyebrow}>Operator console · Greater Manchester</p>
          <h1 className={styles.pageTitle}>Operations overview</h1>
          <p className={styles.lede}>Operator {callsign || "unregistered"} · {shiftStatus(record)}{record.loaded && !record.save ? " · County resources available" : ""}{record.save ? ` · ${record.save.title}` : ""}</p>
        </div>
        <div className={styles.headMeta}>
          <span className={styles.chip}>Build {LATEST.version}</span>
          <span className={`${styles.chip} ${styles.chipAmber}`}>Closed Pre-Alpha</span>
        </div>
      </header>

      {systems && <SystemsStrip systems={systems} />}
      {record.loaded && <InductionPanel callsign={callsign} discord={discord} played={played} started={!!record.save} />}

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.brandLine}><span className={styles.liveDot} aria-hidden="true" />Incident management simulator</p>
          <h2>You&apos;re in<br /><span>command and control.</span></h2>
          <p>Receive the emergency call, mobilise from Greater Manchester&apos;s real station network and assume command of the incident ground. Fire &amp; rescue, ambulance and police operations from a single operator position.</p>
          <div className={styles.actions}>
            {!record.loaded ? (
              <button className={styles.primary} disabled>Reading shift status…</button>
            ) : record.save ? (
              <>
                <Link className={styles.primary} href="/dashboard">Resume shift <Icon.arrow /></Link>
                <Link className={styles.button} href={viewHref("shift")}>Start a new shift</Link>
              </>
            ) : (
              <>
                <Link className={styles.primary} href={viewHref("shift")}>Start shift <Icon.arrow /></Link>
                <Link className={styles.button} href={viewHref("guide")}>Operator guide</Link>
              </>
            )}
          </div>
          <ul className={styles.serviceRow} aria-label="Services under command">
            {(["Fire", "Ambulance", "Police"] as ServiceCode[]).map((s) => <li key={s}><b style={{ background: SERVICE_TINT[s] }} />{serviceName(s)}</li>)}
          </ul>
        </div>
        <CountyPlate stations={stations} caption={`${totalStations} stations · ${totalAppliances} resources · road-routed ETAs`} />
      </section>

      {record.loaded && record.save && (
        <div className={styles.saveLine}>
          <span className={styles.liveDot} aria-hidden="true" />
          <div><strong>Shift in progress</strong><p>{record.save.title} · {intensityName(record.save.intensity)} intensity</p></div>
          <small>Saved {savedAgo < 1 ? "under a minute ago" : `${savedAgo} min ago`}</small>
          <Link href="/dashboard">Resume shift <Icon.arrow /></Link>
        </div>
      )}
      {record.unavailable && <p className={styles.callout}>Browser storage is unavailable. Shifts cannot be saved or resumed on this device.</p>}

      <section className={styles.block}>
        <div className={styles.blockHead}>
          <h2>Resource picture</h2>
          <Link href="/glossary">Reference library <Icon.arrow /></Link>
        </div>
        <div className={styles.facts}>
          {facts.services.map((s) => (
            <div key={s.service} className={styles.fact} style={{ "--tint": SERVICE_TINT[s.service] } as CSSProperties}>
              <span className={styles.factBar} aria-hidden="true" />
              <strong>{s.stations}</strong>
              <span>{serviceName(s.service)} stations</span>
              <small>{s.appliances} {unitsWord(s.service)} established</small>
            </div>
          ))}
          <div className={styles.fact} style={{ "--tint": "var(--amber)" } as CSSProperties}>
            <span className={styles.factBar} aria-hidden="true" />
            <strong>{facts.scenarios}</strong>
            <span>incident types modelled</span>
            <small>variant outcomes on every run</small>
          </div>
        </div>
      </section>

      <div className={styles.twoCol}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Service record</h2>
            <Link href="/stats">Full record and leaderboard <Icon.arrow /></Link>
          </div>
          {!record.loaded ? (
            <p className={styles.muted}>Reading the service record…</p>
          ) : played && career ? (
            <>
              <div className={styles.stats}>
                <div><strong>{score}</strong><span>Command points</span></div>
                <div><strong>{career.incidentsResolved}</strong><span>Incidents resolved</span></div>
                <div><strong>{career.callsAnswered}</strong><span>Calls handled</span></div>
                <div><strong>{targetPct === null ? "—" : `${targetPct}%`}</strong><span>Standards met</span></div>
              </div>
              {record.last ? (
                <div className={styles.lastJob}>
                  <span className={`${styles.gradeBadge} ${GRADE_TONE[record.last.grade] ?? ""}`}>{record.last.grade}</span>
                  <div>
                    <p className={styles.eyebrow}>Last debrief · {new Date(record.last.resolvedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                    <strong>{record.last.incidentTitle}</strong>
                    <small>{record.last.targetsMet} of {record.last.targetsTotal} standards met · {record.last.resourcesUsed} resources mobilised{record.last.casualtiesSaved + record.last.casualtiesLost > 0 ? ` · ${record.last.casualtiesSaved} conveyed${record.last.casualtiesLost ? `, ${record.last.casualtiesLost} deceased` : ""}` : ""}</small>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className={styles.empty}>
              <p className={styles.eyebrow}>No shifts recorded</p>
              <strong>No incidents on record.</strong>
              <p>Each resolved incident is assessed against the performance standards: time to first mobilisation, attendance, and command decisions on the incident ground. The record opens with the first stop message.</p>
              <Link href={`${viewHref("guide")}#the-debrief`}>Performance standards and grading <Icon.arrow /></Link>
            </div>
          )}
        </section>

        <div className={styles.stack}>
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Incident lifecycle</h2>
              <Link href={viewHref("guide")}>Operator guide <Icon.arrow /></Link>
            </div>
            <ol className={styles.steps}>
              {LIFECYCLE.map((s) => (
                <li key={s.n}>
                  <Link href={`${viewHref("guide")}#${s.anchor}`}>
                    <span className={styles.stepNo}>{s.n}</span>
                    <span><strong>{s.title}</strong><small>{s.body}</small></span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <div className={styles.twoUp}>
            <section className={styles.panel}>
              <div className={styles.panelHead}>
                <h2>Release notes</h2>
                <Link href="/changelog">All releases <Icon.arrow /></Link>
              </div>
              <p className={styles.eyebrow}>Build {LATEST.version} · {formatEntryDate(LATEST.date)}</p>
              <strong className={styles.panelTitle}>{LATEST.title}</strong>
              <ul className={`${styles.bullets} ${styles.clamped}`}>{LATEST.items.slice(0, 2).map((item) => <li key={item}>{item}</li>)}</ul>
              {LATEST.items.length > 2 && <Link href="/changelog" className={styles.moreLink}>+{LATEST.items.length - 2} more in this release <Icon.arrow /></Link>}
            </section>
            <section className={styles.panel}>
              <div className={styles.panelHead}>
                <h2>Programme</h2>
              </div>
              <ul className={styles.linkList}>
                <li><a href={COMMUNITY} target="_blank" rel="noreferrer"><Icon.discord /><span><strong>Tester channel on Discord</strong><small>Build announcements and feedback discussion.</small></span><Icon.external /></a></li>
                <li><Link href={viewHref("updates")}><Icon.updates /><span><strong>Submit a report</strong><small>Defects and suggestions, filed with the build version.</small></span><Icon.arrow /></Link></li>
                <li><Link href="/prealpha"><Icon.briefing /><span><strong>Pre-Alpha briefing</strong><small>Scope of the current build and tester requirements.</small></span><Icon.arrow /></Link></li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
