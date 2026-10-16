// The Pre-Alpha briefing as the console presents it. What the reader
// sees depends on who they are:
//
//   visitor    — what the programme is, what testers get, how to apply.
//   applicant  — the same, with their request's standing.
//   tester     — the briefing: scenarios released, access, the shift
//                procedure, test focus and requirements.
//
// The page resolves who is reading and passes the result in, so this
// component renders the same from the server page and the dev harness.

import Link from "next/link";
import { Notice } from "@/app/components/notice";
import { Icon } from "@/app/menu/icons";
import { COMMUNITY, SERVICE_TINT, serviceName } from "@/app/menu/menu-types";
import styles from "@/app/menu/watch-menu.module.css";
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
  openJobs: BriefingJob[];
  access: readonly { title: string; body: string }[];
  focus: readonly { title: string; body: string; test: string }[];
  asks: readonly string[];
  notYet: readonly string[];
};

const PROCEDURE = [
  "Operator console → Start shift. Select the services under command and the call volume; the clock starts after the resourcing page.",
  "Receive the call: confirm the location, obtain the key information, assign the opening code and grade, and mobilise. Pre-arrival advice is read while resources are en route.",
  "Complete the attendance from the county board, then open the incident. Position each resource on the incident ground as it arrives.",
  "Command from the MDT: task crews, manage patients, monitor the log. The debrief assesses the incident at the stop message.",
  "Defects: Help → Report a problem, from any screen. The report carries the incident and the last minute of the log.",
];

export function PreAlphaBriefing({ data }: { data: BriefingData }) {
  const { accepted, waiting, operator, invited, standing, signedIn, signups, tableMissing, appliedOn, openJobs } = data;
  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.eyebrow}>{accepted ? "Pre-Alpha briefing · tester" : "Closed Pre-Alpha · programme"}</p>
          <h1 className={styles.pageTitle}>{waiting ? "Accepted. The desk opens shortly." : accepted ? "Pre-Alpha briefing" : "Closed Pre-Alpha programme"}</h1>
          <p className={styles.lede}>
            {accepted
              ? "Scope of the current build, the shift procedure and the reporting route. The operator guide and the reference library cover the console itself."
              : "The Watch Room is an emergency services incident management simulator: a single operator receiving the 999 call, mobilising across Greater Manchester's real station network and taking command of the incident ground. The Pre-Alpha is the first release outside the team: small by design, unfinished by definition, and run with people who have done the job for real."}
          </p>
        </div>
        <div className={styles.headMeta}>
          {accepted && <span className={`${styles.chip} ${styles.chipOk}`}>Tester</span>}
          <span className={`${styles.chip} ${styles.chipAmber}`}>Closed Pre-Alpha</span>
        </div>
      </header>

      {accepted && invited && (
        <Notice tone="ok" title="Invitation accepted"><p>{waiting ? "This account is on the tester list. Read the briefing below; the desk opens when the doors do." : "The desk is open to this account. Read the briefing below, then open the console."}</p></Notice>
      )}
      {waiting && (
        <Notice tone="amber" title="Doors not yet open"><p>This account is on the tester list. The desk opens to every tester at once, and an email is sent when it does. Until then this page is the briefing.</p></Notice>
      )}
      {accepted && (
        <div className={styles.actions}>
          {operator && <Link href="/menu" className={styles.primary}>Operations overview <Icon.arrow /></Link>}
          <a href={COMMUNITY} target="_blank" rel="noreferrer" className={operator ? styles.button : styles.primary}>Tester channel on Discord <Icon.external /></a>
        </div>
      )}

      {accepted && (
        <section className={`${styles.panel} ${styles.section}`}>
          <div className={styles.panelHead}>
            <h2>{waiting ? "Scenarios released to testers" : "Scenarios released"}</h2>
            <span className={styles.chip}>{openJobs.length} open</span>
          </div>
          {openJobs.length === 0 ? (
            <p className={styles.muted}>No scenarios are released to testers yet. Released scenarios appear here and in the Scenarios menu on the desk.</p>
          ) : (
            <ul className={styles.jobs}>
              {openJobs.map((j) => <li key={j.id}><span style={{ color: SERVICE_TINT[j.service] }}>{serviceName(j.service)}</span><span>{j.title}</span></li>)}
            </ul>
          )}
          <p className={styles.formStatus}>Each scenario varies between runs: who is home, where the fire is seated, whether the driver stops. Run each more than once.</p>
        </section>
      )}

      <section className={`${styles.panel} ${styles.section}`}>
        <div className={styles.panelHead}><h2>{accepted ? "Access provided" : "Access provided to testers"}</h2></div>
        <ul className={styles.apps}>
          {data.access.map((a) => <li key={a.title}><strong>{a.title}</strong><span>{a.body}</span></li>)}
        </ul>
      </section>

      {accepted && (
        <section className={`${styles.panel} ${styles.section}`}>
          <div className={styles.panelHead}><h2>Shift procedure</h2></div>
          <ol className={styles.procedure}>
            {PROCEDURE.map((step, i) => <li key={step}><span className={styles.stepNo}>{String(i + 1).padStart(2, "0")}</span><span>{step}</span></li>)}
          </ol>
        </section>
      )}

      <section className={`${styles.panel} ${styles.section}`}>
        <div className={styles.panelHead}><h2>Scope of the build and test focus</h2></div>
        <dl className={styles.terms}>
          {data.focus.map((f) => <div key={f.title}><dt>{f.title}</dt><dd>{f.body}<span className={styles.focusTest}>Test focus: {f.test}</span></dd></div>)}
        </dl>
      </section>

      <div className={styles.twoUp}>
        <section className={styles.panel}>
          <div className={styles.panelHead}><h2>Tester requirements</h2></div>
          <ul className={styles.bullets}>{data.asks.map((a) => <li key={a}>{a}</li>)}</ul>
        </section>
        <section className={styles.panel}>
          <div className={styles.panelHead}><h2>Not in this build</h2></div>
          <ul className={styles.bullets}>{data.notYet.map((a) => <li key={a}>{a}</li>)}</ul>
        </section>
      </div>

      {!accepted && (
        <section className={`${styles.panel} ${styles.section}`}>
          <div className={styles.panelHead}><h2>{standing === "none" ? "Access requests" : "Your request"}</h2></div>
          {signups.closed ? (
            <p className={styles.muted}>Sign-ups for the Pre-Alpha {signups.closes ? <>closed on <strong>{signups.closes}</strong></> : "are closed"}. A wider test follows; an account created now is ready for it.</p>
          ) : !signups.open ? (
            <p className={styles.muted}>Access requests open on <strong>{signups.opens}</strong>. Create an account now and request access the moment they do.</p>
          ) : tableMissing ? (
            <p className={styles.muted}>Pre-Alpha access is being set up. Try again shortly.</p>
          ) : !signedIn ? (
            <>
              <p className={styles.muted}>Create an account and select <strong>Join the Pre-Alpha</strong> at registration. With an existing account, log in and request access. Access is granted by hand; the request&apos;s standing shows here and an email is sent when the desk is open to the account.</p>
              {signups.closes && <p className={styles.formStatus}>Sign-ups close on {signups.closes}.</p>}
              <div className={styles.actions}>
                <Link href="/signup?prealpha=1" className={styles.primary}>Create an account <Icon.arrow /></Link>
                <Link href="/login" className={styles.button}>Log in</Link>
              </div>
            </>
          ) : standing === "declined" ? (
            <p className={styles.muted}>Reviewed and not accepted for this round. The Pre-Alpha is deliberately small; a wider test follows, and this account is ready for it.</p>
          ) : standing === "pending" ? (
            <Notice tone="amber" title="Request received"><p>Submitted {appliedOn ?? "recently"}. Access is granted by hand, so there is a short wait. An email is sent when the account is on the list, and another when the doors open.</p></Notice>
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
