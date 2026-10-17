// Colleagues: the operators you work alongside. Requests waiting for
// you, the colleagues you have, the requests you have made, and a way
// to find more. Plain rendering with server-action forms, so the same
// component serves the page and the dev harness.

import Link from "next/link";
import { Notice } from "@/app/components/notice";
import { ServiceSymbol } from "@/app/components/service-insignia";
import { Icon } from "@/app/menu/icons";
import { roleLabel, sinceLabel, type ColleagueRow, type OperatorHit, type Relation } from "@/lib/operators";
import styles from "@/app/menu/watch-menu.module.css";
import { removeColleague, requestColleague, respondColleague } from "./actions";

export const COLLEAGUE_NOTICES: Record<string, { tone: "ok" | "amber" | "critical" | "info"; title: string; body: string }> = {
  requested: { tone: "ok", title: "Request sent", body: "They will see it on their Colleagues page and can accept it there." },
  colleague: { tone: "ok", title: "Colleagues", body: "They had asked you already, so the two of you are colleagues now." },
  accepted: { tone: "ok", title: "Request accepted", body: "You are colleagues. Their record is open to you where they keep it to colleagues." },
  declined: { tone: "info", title: "Request declined", body: "They are not told. You can still add them yourself later." },
  removed: { tone: "info", title: "Done", body: "The two of you are no longer listed as colleagues." },
  gone: { tone: "amber", title: "Nothing to answer", body: "That request had already been withdrawn or answered." },
  private: { tone: "amber", title: "Not taking requests", body: "This operator keeps their profile private." },
  limit: { tone: "amber", title: "Too many open requests", body: "Fifty requests are waiting on other operators. Withdraw some first." },
  missing: { tone: "amber", title: "No such operator", body: "That account could not be found." },
  unavailable: { tone: "amber", title: "Colleagues are not switched on yet", body: "The database is missing migration 028. Run supabase/migrations/028_colleagues_and_honours.sql in the Supabase SQL editor." },
  failed: { tone: "critical", title: "That did not work", body: "The account service refused the change. Try again in a moment." },
};

/** One operator on a card: insignia, callsign, standing and record. */
export function OperatorCard({ userId, callsign, insignia, role, tester, score, incidentsResolved, lastActive, children }: {
  userId: string; callsign: string; insignia: ColleagueRow["insignia"]; role: ColleagueRow["role"]; tester?: boolean;
  score: number; incidentsResolved: number; lastActive: string | null; children?: React.ReactNode;
}) {
  const active = sinceLabel(lastActive);
  return (
    <article className={styles.person}>
      <span className={styles.avatar} aria-hidden="true">{callsign.slice(0, 2).toUpperCase()}</span>
      <div>
        <div className={styles.personName}>
          {insignia && <ServiceSymbol service={insignia} size={18} />}
          <Link href={`/operators/${userId}`}>{callsign}</Link>
        </div>
        <p className={styles.cardMeta}>{roleLabel(role)}{tester ? " · Tester" : ""} · {score} points · {incidentsResolved} {incidentsResolved === 1 ? "incident" : "incidents"}{active ? ` · on shift ${active}` : ""}</p>
        {children && <div className={styles.personActions}>{children}</div>}
      </div>
    </article>
  );
}

/** The right buttons for where two operators stand. */
export function RelationActions({ userId, relation, next, compact = false }: { userId: string; relation: Relation; next: string; compact?: boolean }) {
  const cls = `${styles.button} ${styles.small}`;
  const hidden = <><input type="hidden" name="userId" value={userId} /><input type="hidden" name="next" value={next} /></>;
  switch (relation) {
    case "self":
      return <Link href="/stats" className={cls}>Your service record</Link>;
    case "colleague":
      return (
        <>
          <span className={`${styles.chip} ${styles.chipOk}`}>Colleague</span>
          <form action={removeColleague}>{hidden}<button type="submit" className={cls}>Remove</button></form>
        </>
      );
    case "requested":
      return (
        <>
          <span className={`${styles.chip} ${styles.chipInfo}`}>Requested</span>
          <form action={removeColleague}>{hidden}<button type="submit" className={cls}>Withdraw</button></form>
        </>
      );
    case "pending":
      return (
        <>
          <form action={respondColleague}>{hidden}<input type="hidden" name="accept" value="1" /><button type="submit" className={`${styles.primary} ${styles.small}`}>Accept</button></form>
          <form action={respondColleague}>{hidden}<input type="hidden" name="accept" value="0" /><button type="submit" className={cls}>Decline</button></form>
        </>
      );
    default:
      return <form action={requestColleague}>{hidden}<button type="submit" className={compact ? cls : `${styles.primary} ${styles.small}`}>Add colleague</button></form>;
  }
}

export function ColleaguesView({ rows, found, query, notice, missing }: { rows: ColleagueRow[]; found: OperatorHit[]; query: string; notice?: string; missing?: boolean }) {
  const incoming = rows.filter((r) => r.relation === "pending");
  const outgoing = rows.filter((r) => r.relation === "requested");
  const colleagues = rows.filter((r) => r.relation === "colleague");
  const here = query ? `/colleagues?q=${encodeURIComponent(query)}` : "/colleagues";
  const n = notice ? COLLEAGUE_NOTICES[notice] : undefined;

  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.eyebrow}>Colleagues · this account</p>
          <h1 className={styles.pageTitle}>Colleagues</h1>
          <p className={styles.lede}>The operators you work alongside. Add a colleague to follow their record and honours; they answer the request from this page on their side.</p>
        </div>
        <div className={styles.headMeta}>
          <span className={`${styles.chip} ${styles.chipAmber}`}>{colleagues.length} {colleagues.length === 1 ? "colleague" : "colleagues"}</span>
          {incoming.length > 0 && <span className={`${styles.chip} ${styles.chipInfo}`}>{incoming.length} waiting</span>}
        </div>
      </header>

      {n && <Notice tone={n.tone} title={n.title}><p>{n.body}</p></Notice>}
      {missing && !n && <Notice tone="amber" title={COLLEAGUE_NOTICES.unavailable.title}><p>{COLLEAGUE_NOTICES.unavailable.body}</p></Notice>}

      {incoming.length > 0 && (
        <section className={`${styles.panel} ${styles.section}`}>
          <div className={styles.panelHead}><h2>Requests for you</h2><span className={styles.chip}>{incoming.length}</span></div>
          <div className={styles.people}>
            {incoming.map((r) => (
              <OperatorCard key={r.userId} {...r}>
                <RelationActions userId={r.userId} relation="pending" next={here} />
              </OperatorCard>
            ))}
          </div>
        </section>
      )}

      <section className={`${styles.panel} ${styles.section}`}>
        <div className={styles.panelHead}><h2>Your colleagues</h2><span className={styles.chip}>{colleagues.length}</span></div>
        {colleagues.length === 0 ? (
          <p className={styles.muted}>No colleagues yet. Find an operator below, or on the leaderboard, and add them.</p>
        ) : (
          <div className={styles.people}>
            {colleagues.map((r) => (
              <OperatorCard key={r.userId} {...r}>
                <Link href={`/operators/${r.userId}`} className={`${styles.button} ${styles.small}`}>Profile <Icon.arrow /></Link>
                <form action={removeColleague}><input type="hidden" name="userId" value={r.userId} /><input type="hidden" name="next" value={here} /><button type="submit" className={`${styles.button} ${styles.small}`}>Remove</button></form>
              </OperatorCard>
            ))}
          </div>
        )}
      </section>

      {outgoing.length > 0 && (
        <section className={`${styles.panel} ${styles.section}`}>
          <div className={styles.panelHead}><h2>Requests you have made</h2><span className={styles.chip}>{outgoing.length}</span></div>
          <div className={styles.people}>
            {outgoing.map((r) => (
              <OperatorCard key={r.userId} {...r}>
                <RelationActions userId={r.userId} relation="requested" next={here} />
              </OperatorCard>
            ))}
          </div>
        </section>
      )}

      <section className={`${styles.panel} ${styles.section}`}>
        <div className={styles.panelHead}>
          <h2>Find operators</h2>
          <span className={styles.chip}>{query ? `Matching “${query}”` : "Recently on shift"}</span>
        </div>
        <form method="get" action="/colleagues" className={`${styles.feedback} ${styles.inlineForm}`} style={{ marginTop: 0 }}>
          <input name="q" defaultValue={query} placeholder="Callsign" aria-label="Search operators by callsign" maxLength={40} />
          <button type="submit" className={styles.primary}>Search</button>
          {query && <Link href="/colleagues" className={styles.button}>Clear</Link>}
        </form>
        {found.length === 0 ? (
          <p className={styles.formStatus}>{query ? "No operator by that callsign. Callsigns are set on Settings, so a colleague may be listed under a different one." : "Nobody else has been on shift yet."}</p>
        ) : (
          <div className={styles.people} style={{ marginTop: 14 }}>
            {found.map((r) => (
              <OperatorCard key={r.userId} {...r}>
                <RelationActions userId={r.userId} relation={r.relation} next={here} compact />
              </OperatorCard>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
