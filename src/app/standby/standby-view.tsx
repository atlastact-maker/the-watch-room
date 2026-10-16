// Where a signed-in account lands when it cannot open the desk: a new
// account, a tester with the doors closed, an advisor. The account's own
// page, so the Pre-Alpha comes first (that is what most accounts are here
// for), and the advisor programme is shown where the account has applied
// to it, and only offered, in a line, where it has not.

import Link from "next/link";
import { Notice } from "@/app/components/notice";
import { ServiceBadge, type ServiceKey } from "@/app/components/service-insignia";
import { Icon } from "@/app/menu/icons";
import { COMMUNITY } from "@/app/menu/menu-types";
import { PREALPHA_RELEASE_LABEL } from "@/lib/prealpha-programme";
import styles from "@/app/menu/watch-menu.module.css";
import type { AdvisorStanding } from "@/lib/auth/advisor-standing";
import type { PreAlphaStanding } from "@/lib/prealpha";
import { RequestPreAlphaButton } from "@/app/prealpha/request-button";

export type StandbyData = {
  callsign: string;
  advisor: AdvisorStanding;
  /** On the tester list (accepted, invited or ticked). */
  listed: boolean;
  doorsOpen: boolean;
  prealpha: { standing: PreAlphaStanding; tableMissing: boolean };
  signups: { open: boolean; closed: boolean; closes: string; opens: string };
  insignia: ServiceKey | null;
  /** The advisor programme is taking applications. */
  programmeOpen: boolean;
  opensOn: string;
};

const ADVISOR_CHIP: Record<AdvisorStanding, { text: string; cls: string } | null> = {
  accepted: { text: "Accepted", cls: styles.chipOk },
  pending: { text: "In review", cls: styles.chipInfo },
  declined: { text: "Not accepted", cls: "" },
  unfiled: { text: "Filing", cls: "" },
  none: null,
};

export function StandbyView({ data }: { data: StandbyData }) {
  const { callsign, advisor, listed, doorsOpen, prealpha, signups, insignia, programmeOpen, opensOn } = data;
  const chip = ADVISOR_CHIP[advisor];
  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.eyebrow}>Account standing · closed Pre-Alpha</p>
          <h1 className={styles.pageTitle}>{callsign ? `Standing by, ${callsign}` : "Standing by"}</h1>
          <p className={styles.lede}>The account is registered. The Watch Room is in closed Pre-Alpha: the desk opens to testers when the doors do.</p>
        </div>
      </header>

      <section className={styles.panel}>
        <p className={styles.eyebrow}>Closed Pre-Alpha</p>
        <h2 className={styles.panelTitle}>Tester access</h2>
        {listed ? (
          <Notice tone="ok" title="This account is on the Pre-Alpha">
            <p>{doorsOpen ? "The desk is open to this account. If the operator console does not open, sign out and back in." : `The doors are not open yet. Access opens to every accepted tester at the same time on ${PREALPHA_RELEASE_LABEL}, and an email is sent the moment it does. The briefing covers what is coming and how a shift runs.`}</p>
          </Notice>
        ) : prealpha.standing === "pending" ? (
          <Notice tone="amber" title="Request received">
            <p>Access is granted by hand. An email is sent when the account is on the list, and another when the doors open.</p>
          </Notice>
        ) : prealpha.standing === "declined" ? (
          <p className={styles.muted}>Reviewed and not accepted for this round. A wider test follows the Pre-Alpha.</p>
        ) : signups.closed ? (
          <p className={styles.muted}>Sign-ups for this round {signups.closes ? `closed on ${signups.closes}` : "are closed"}. A wider test follows the Pre-Alpha, and this account is ready for it.</p>
        ) : !signups.open ? (
          <p className={styles.muted}>Access requests open {signups.opens}.</p>
        ) : prealpha.tableMissing ? (
          <p className={styles.muted}>Pre-Alpha access is being set up. Try again shortly.</p>
        ) : (
          <>
            <p className={styles.muted}>Fire &amp; rescue, ambulance and police incidents, the complete console, and a tester channel on Discord. One request for access.{signups.closes ? ` Sign-ups close on ${signups.closes}.` : ""}</p>
            <RequestPreAlphaButton />
          </>
        )}
        <div className={styles.actions}>
          <Link className={styles.button} href="/prealpha">{listed ? "Pre-Alpha briefing" : prealpha.standing === "pending" ? "Your request" : "About the Pre-Alpha"} <Icon.arrow /></Link>
        </div>
      </section>

      {advisor !== "none" ? (
        <section className={styles.panel}>
          <p className={styles.eyebrow}>Development advisor programme</p>
          <div className={styles.standingRow}>
            <h2 className={styles.panelTitle} style={{ marginBottom: 0 }}>Advisor application</h2>
            {chip && <span className={`${styles.chip} ${chip.cls}`}>{chip.text}</span>}
            {advisor === "accepted" && <span className={styles.legacy}>{insignia ? <ServiceBadge service={insignia} /> : <span className={`${styles.chip} ${styles.chipInfo}`}>Development advisor</span>}</span>}
          </div>
          <div className={styles.section} style={{ marginTop: 14 }}>
            {advisor === "accepted" && (
              <>
                <p className={styles.muted}>On the programme. Your service background is what keeps the simulation authentic. Access to the closed advisor room on Discord follows in due course.</p>
                <p className={styles.formStatus}>If a Discord handle has not been given, add it under <Link className={styles.textLink} href="/settings">Settings → Programme contact</Link>; it is how accounts are matched to the room.</p>
              </>
            )}
            {advisor === "pending" && <p className={styles.muted}>The application has been received. Applications are reviewed individually; the standing changes here and an email is sent when it has been reviewed. A member of the team may make contact to verify the position held.</p>}
            {advisor === "declined" && <p className={styles.muted}>Reviewed and not taken forward onto the programme at this stage. The account is unaffected, and the Pre-Alpha above is open to it like any other.</p>}
            {advisor === "unfiled" && <p className={styles.muted}>The application is being filed now; give it a moment and this will read received. If it does not, the answers are safe on the account: open <Link className={styles.textLink} href="/settings">Settings → Advisor programme</Link> and save them again.</p>}
          </div>
        </section>
      ) : (
        <p className={`${styles.muted} ${styles.section}`}>Served in fire, ambulance, police or a control room? The development advisor programme {programmeOpen ? "is open" : `opens ${opensOn}`}: apply from <Link className={styles.textLink} href="/settings">Settings → Advisor programme</Link>.</p>
      )}

      <div className={styles.actions}>
        <a className={styles.button} href={COMMUNITY} target="_blank" rel="noreferrer">Discord <Icon.external /></a>
        <Link className={styles.button} href="/settings">Account settings</Link>
      </div>
    </>
  );
}
