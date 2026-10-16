// The Pre-Alpha briefing as the console presents it: the programme as
// announced to testers, with the reader's own standing on top. What the
// reader sees depends on who they are:
//
//   visitor    — the programme, the dates, how access works, what opens.
//   applicant  — the same, with their request's standing.
//   tester     — the briefing: dates, scenarios released, access, the
//                shift procedure, the systems in the build, what is asked.
//
// The page resolves who is reading and passes the result in, so this
// component renders the same from the server page and the dev harness.

import Link from "next/link";
import type { CSSProperties } from "react";
import { Notice } from "@/app/components/notice";
import { Icon } from "@/app/menu/icons";
import { MarkInduction } from "@/app/menu/mark-induction";
import { COMMUNITY, SERVICE_TINT, serviceName } from "@/app/menu/menu-types";
import styles from "@/app/menu/watch-menu.module.css";
import type { KeyDate, OpeningScenario } from "@/lib/prealpha-programme";
import type { ServiceCode } from "@/lib/sim/types";
import { RequestPreAlphaButton } from "./request-button";

export type BriefingJob = { id: string; title: string; service: ServiceCode };

export type BriefingData = {
  /** On the tester list, or an operator or administrator. */
  accepted: boolean;
  /** Accepted, but the doors are not open yet. */
  waiting: boolean;
  /** Has the console: the briefing links into it. */
  operator: boolean;
  /** Arrived from an invitation link. */
  invited: boolean;
  standing: "none" | "pending" | "accepted" | "declined";
  signedIn: boolean;
  signups: { open: boolean; closed: boolean; closes: string; opens: string };
  tableMissing: boolean;
  /** When a pending request was filed, formatted for display. */
  appliedOn: string | null;
  /** Scenarios released to testers right now. */
  openJobs: BriefingJob[];
  /** The programme as announced. */
  keyDates: readonly KeyDate[];
  accessSteps: readonly { title: string; body: string }[];
  opening: readonly OpeningScenario[];
  releaseLabel: string;
  releaseAt: number;
  /** The moment the page was rendered, for the dates' states. */
  now: number;
  focus: readonly { title: string; body: string; test: string }[];
  asks: readonly { title: string; body: string }[];
  notYet: readonly { title: string; body: string }[];
};

const PROCEDURE = [
  "Operations overview, then Start shift. Select the services under command and the call volume; the clock starts once the resourcing page is complete.",
  "Receive the call: confirm the location, obtain the key information, assign the opening code and grade, and mobilise. Pre-arrival advice is read while resources are en route.",
  "Complete the attendance from the county board, then open the incident. Position each resource on the incident ground as it arrives.",
  "Command from the mobile data terminal: task crews, manage patients, monitor the log. The debrief assesses the incident at the stop message.",
  "Defects: Help, then Report a problem, from any screen. The report carries the incident reference and the last minute of the log.",
];

export function PreAlphaBriefing({ data }: { data: BriefingData }) {
  const { accepted, waiting, operator, invited, standing, signedIn, signups, tableMissing, appliedOn, openJobs, keyDates, accessSteps, opening, releaseLabel, releaseAt, now } = data;
  const beforeRelease = now < releaseAt;
  const releasedTitles = new Set(openJobs.map((j) => j.title));
  // The dated entry most recently reached is the programme's current step.
  const reached = keyDates.filter((d) => d.at !== null && d.at <= now).map((d) => d.at as number);
  const currentAt = reached.length ? Math.max(...reached) : null;
  const dateState = (d: KeyDate) => (d.at === null ? "" : d.at === currentAt ? styles.current : currentAt !== null && d.at < currentAt ? styles.past : "");

  return (
    <>
      <MarkInduction step="briefing" />
      <header className={styles.pageHead}>
        <div>
          <p className={styles.eyebrow}>{accepted ? "Pre-Alpha briefing · tester" : "Closed Pre-Alpha · programme"}</p>
          <h1 className={styles.pageTitle}>{waiting ? "Access approved. The desk opens shortly." : accepted ? "Pre-Alpha briefing" : "Closed Pre-Alpha programme"}</h1>
          <p className={styles.lede}>
            {accepted
              ? "The key dates, the scenarios released, the shift procedure and the reporting route. The operator guide and the reference library cover the console itself."
              : "The Watch Room is an emergency services incident management simulator: a single operator receiving the 999 call, mobilising across Greater Manchester's real station network and taking command of the incident ground. The Pre-Alpha is the first release outside the team: small by design, unfinished by definition, and run with people who have done the job for real."}
          </p>
        </div>
        <div className={styles.headMeta}>
          {accepted && <span className={`${styles.chip} ${styles.chipOk}`}>Tester</span>}
          {!operator && beforeRelease && <span className={`${styles.chip} ${styles.chipAmber}`}>Opens {releaseLabel}</span>}
          <span className={`${styles.chip} ${operator || !beforeRelease ? styles.chipAmber : ""}`}>Closed Pre-Alpha</span>
        </div>
      </header>

      {accepted && invited && (
        <Notice tone="ok" title="Invitation accepted"><p>{waiting ? `This account is on the tester list. Read the briefing below; access opens on ${releaseLabel}.` : "The desk is open to this account. Read the briefing below, then open the console."}</p></Notice>
      )}
      {waiting && (
        <Notice tone="amber" title={beforeRelease ? `Access opens ${releaseLabel}` : "Doors not yet open"}>
          <p>
            {beforeRelease
              ? `This account is on the tester list. Access opens to every accepted tester at the same time on ${releaseLabel}, and an email is sent when it does. Until then this page is the briefing.`
              : "This account is on the tester list. The doors have not opened yet; an email is sent the moment they do."}
          </p>
        </Notice>
      )}
      {accepted && (
        <div className={styles.actions}>
          {operator && <Link href="/menu" className={styles.primary}>Operations overview <Icon.arrow /></Link>}
          <a href={COMMUNITY} target="_blank" rel="noreferrer" className={operator ? styles.button : styles.primary}>Tester channel on Discord <Icon.external /></a>
        </div>
      )}

      <section className={`${styles.panel} ${styles.section}`}>
        <div className={styles.panelHead}>
          <h2>Key dates</h2>
          <span className={`${styles.chip} ${beforeRelease ? styles.chipAmber : styles.chipOk}`}>{beforeRelease ? `Release ${releaseLabel}` : "Released"}</span>
        </div>
        <ol className={styles.timeline}>
          {keyDates.map((d) => (
            <li key={d.when} className={dateState(d)}>
              <span className={styles.when}><i aria-hidden="true" />{d.when}</span>
              <span>{d.body}</span>
            </li>
          ))}
        </ol>
      </section>

      {!operator && (
        <section className={`${styles.panel} ${styles.section}`}>
          <div className={styles.panelHead}><h2>Accessing the Pre-Alpha</h2></div>
          <ol className={styles.procedure}>
            {accessSteps.map((step, i) => (
              <li key={step.title}>
                <span className={styles.stepNo}>{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <strong>{step.title}.</strong> {step.body}
                  {i === 0 && accepted && <> <span className={`${styles.chip} ${styles.chipOk}`}>Done</span></>}
                </span>
              </li>
            ))}
          </ol>
          <p className={styles.formStatus}>Not yet on the Discord server? <a href={COMMUNITY} target="_blank" rel="noreferrer" className={styles.textLink}>Join here</a> so you can be added to the private tester channel.</p>
        </section>
      )}

      <section className={`${styles.panel} ${styles.section}`}>
        <div className={styles.panelHead}>
          <h2>Opening scenarios</h2>
          <span className={styles.chip}>One per service at release</span>
        </div>
        <p className={styles.panelText}>The Pre-Alpha opens with one scenario for each service, with further scenarios released over the following weeks. Each varies between runs, including who is present at the address, where a fire is seated and how a patient responds, so run each more than once.</p>
        <div className={styles.openingGrid}>
          {opening.map((o) => (
            <article key={o.title} className={styles.opening} style={{ "--tint": SERVICE_TINT[o.service] } as CSSProperties}>
              <p className={styles.openingService}>{serviceName(o.service)}</p>
              <h3>{o.title}</h3>
              <p>{o.brief}</p>
              <span className={styles.focusTest}>Feedback requested: {o.feedback}</span>
              {releasedTitles.has(o.scenarioTitle) && <span className={`${styles.chip} ${styles.chipOk}`}>Released</span>}
            </article>
          ))}
        </div>
      </section>

      {accepted && (
        <section className={`${styles.panel} ${styles.section}`}>
          <div className={styles.panelHead}>
            <h2>Scenarios released</h2>
            <span className={`${styles.chip} ${openJobs.length > 0 ? styles.chipOk : ""}`}>{openJobs.length} open</span>
          </div>
          {openJobs.length === 0 ? (
            <p className={styles.muted}>{beforeRelease ? `No scenarios are released yet. The opening scenarios above are released on ${releaseLabel}; released scenarios appear here and in the Scenarios menu on the desk.` : "No scenarios are released to testers yet. Released scenarios appear here and in the Scenarios menu on the desk."}</p>
          ) : (
            <ul className={styles.jobs}>
              {openJobs.map((j) => <li key={j.id}><span style={{ color: SERVICE_TINT[j.service] }}>{serviceName(j.service)}</span><span>{j.title}</span></li>)}
            </ul>
          )}
        </section>
      )}

      {operator && (
        <section className={`${styles.panel} ${styles.section}`}>
          <div className={styles.panelHead}><h2>Shift procedure</h2></div>
          <ol className={styles.procedure}>
            {PROCEDURE.map((step, i) => <li key={step}><span className={styles.stepNo}>{String(i + 1).padStart(2, "0")}</span><span>{step}</span></li>)}
          </ol>
        </section>
      )}

      <section className={`${styles.panel} ${styles.section}`}>
        <div className={styles.panelHead}><h2>Systems in this build</h2></div>
        <dl className={styles.terms}>
          {data.focus.map((f) => <div key={f.title}><dt>{f.title}</dt><dd>{f.body}<span className={styles.focusTest}>Test focus: {f.test}</span></dd></div>)}
        </dl>
      </section>

      <div className={styles.twoUp}>
        <section className={styles.panel}>
          <div className={styles.panelHead}><h2>Tester responsibilities</h2></div>
          <ul className={styles.titled}>{data.asks.map((a) => <li key={a.title}><strong>{a.title}</strong><span>{a.body}</span></li>)}</ul>
        </section>
        <section className={styles.panel}>
          <div className={styles.panelHead}><h2>Not included in this build</h2></div>
          <ul className={styles.titled}>{data.notYet.map((a) => <li key={a.title}><strong>{a.title}</strong><span>{a.body}</span></li>)}</ul>
        </section>
      </div>

      {!accepted && (
        <section className={`${styles.panel} ${styles.section}`}>
          <div className={styles.panelHead}><h2>{standing === "pending" ? "Your request" : standing === "declined" || signups.closed ? "Not part of this round?" : "Access requests"}</h2></div>
          {standing === "pending" ? (
            <Notice tone="amber" title="Request received"><p>Submitted {appliedOn ?? "recently"}. Applications are reviewed individually; an email confirms the outcome, and a second follows when access opens on {releaseLabel}.</p></Notice>
          ) : standing === "declined" || signups.closed ? (
            <>
              <p className={styles.panelText}>The Pre-Alpha has deliberately been kept small, and a wider test will follow. {signedIn ? "This account remains registered and ready for the next phase." : "An account created now remains registered and ready for the next phase."} Progress updates continue every Friday, and the <a href={COMMUNITY} target="_blank" rel="noreferrer" className={styles.textLink}>Discord server</a> is the best place to follow development.</p>
              {!signedIn && (
                <div className={styles.actions}>
                  <Link href="/signup" className={styles.button}>Create an account <Icon.arrow /></Link>
                  <Link href="/login" className={styles.button}>Sign in</Link>
                </div>
              )}
            </>
          ) : !signups.open ? (
            <p className={styles.muted}>Access requests open on <strong>{signups.opens}</strong>. Create an account now and request access the moment they do.</p>
          ) : tableMissing ? (
            <p className={styles.muted}>Pre-Alpha access is being set up. Try again shortly.</p>
          ) : !signedIn ? (
            <>
              <p className={styles.muted}>Create an account and select <strong>Join the Pre-Alpha</strong> at registration. With an existing account, sign in and request access. Access is granted by hand; the request&apos;s standing shows here and an email is sent when the desk is open to the account.</p>
              {signups.closes && <p className={styles.formStatus}>Sign-ups close on {signups.closes}.</p>}
              <div className={styles.actions}>
                <Link href="/signup?prealpha=1" className={styles.primary}>Create an account <Icon.arrow /></Link>
                <Link href="/login" className={styles.button}>Sign in</Link>
              </div>
            </>
          ) : (
            <>
              {signups.closes && <p className={styles.muted}>Sign-ups close on <strong>{signups.closes}</strong>.</p>}
              <RequestPreAlphaButton />
            </>
          )}
        </section>
      )}
    </>
  );
}
