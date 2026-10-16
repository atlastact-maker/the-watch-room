import Link from "next/link";
import { Icon } from "@/app/menu/icons";
import styles from "@/app/menu/watch-menu.module.css";

export type InviteOutcome = "invalid" | "expired" | "wrong_account" | "not_ready" | null;

export function InviteView({ outcome, here }: { outcome: InviteOutcome; here: string }) {
  const content =
    outcome === null
      ? { title: "Invitation to the Pre-Alpha", body: "This link opens the Pre-Alpha to the account it was sent to. Sign in and the invitation is accepted; the briefing is on the other side.", actions: <><Link className={styles.primary} href={`/login?next=${encodeURIComponent(here)}`}>Sign in to accept <Icon.arrow /></Link><Link className={styles.button} href="/prealpha">About the Pre-Alpha</Link></> }
      : outcome === "wrong_account"
        ? { title: "Wrong account", body: "This invitation was sent to a different email address. Sign out, sign in as the account the email went to, and open the link again.", actions: <Link className={styles.button} href="/standby">Back to your account</Link> }
        : outcome === "expired"
          ? { title: "This link has expired", body: "Invitations last thirty days. Ask on the Discord, or request access from your standing page, and a fresh one will be sent.", actions: <Link className={styles.primary} href="/standby">Request access <Icon.arrow /></Link> }
          : outcome === "not_ready"
            ? { title: "Not quite ready", body: "Invitations are being set up on the server. Try the link again shortly.", actions: null }
            : { title: "That link does not work", body: "It may have been copied incompletely. Open it from the email again, or request access from your standing page.", actions: <Link className={styles.primary} href="/standby">Request access <Icon.arrow /></Link> };
  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.eyebrow}>Closed Pre-Alpha · invitation</p>
          <h1 className={styles.pageTitle}>{content.title}</h1>
          <p className={styles.lede}>{content.body}</p>
        </div>
      </header>
      {content.actions && <div className={styles.actions}>{content.actions}</div>}
    </>
  );
}
