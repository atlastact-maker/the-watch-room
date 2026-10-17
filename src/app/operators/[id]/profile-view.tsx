// An operator's public profile: who they are on the console, the
// ribbon rack and what each ribbon is for, and the service record where
// it is open to the viewer. Plain rendering with server-action forms so
// the same component serves the page and the dev harness.

import Link from "next/link";
import type { CSSProperties } from "react";
import { Notice } from "@/app/components/notice";
import { HonourList, RibbonRack } from "@/app/components/ribbon-rack";
import { ServiceSymbol } from "@/app/components/service-insignia";
import { COLLEAGUE_NOTICES, RelationActions } from "@/app/colleagues/colleagues-view";
import { SERVICE_TINT } from "@/app/menu/menu-types";
import type { EarnedHonour } from "@/lib/awards";
import { dateLabel, roleLabel, sinceLabel, type OperatorProfile } from "@/lib/operators";
import type { IncidentTypeCode } from "@/lib/sim/incident_types";
import { labelForType } from "@/lib/sim/pda";
import styles from "@/app/menu/watch-menu.module.css";

type Grade = "A" | "B" | "C" | "D" | "F";
const GRADES: Grade[] = ["A", "B", "C", "D", "F"];
const GRADE_FILL: Record<Grade, string> = { A: "#4fc16d", B: "#6fcf8a", C: "#e6b65c", D: "#d8a955", F: "#e5736a" };

function fmtDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m} min ${String(s).padStart(2, "0")} s` : `${s} s`;
}

function typeLabel(code: string): string {
  const label = labelForType(code as IncidentTypeCode);
  return label && label !== code ? label : code.replace(/[_-]+/g, " ");
}

function Tile({ value, label, hint, tint }: { value: string; label: string; hint?: string; tint?: string }) {
  return (
    <div className={styles.fact} style={{ "--tint": tint ?? "var(--line-2)" } as CSSProperties}>
      <span className={styles.factBar} aria-hidden="true" />
      <strong>{value}</strong>
      <span>{label}</span>
      {hint && <small>{hint}</small>}
    </div>
  );
}

const STANDING: Record<OperatorProfile["relation"], string> = {
  self: "Your profile, as other operators see it",
  colleague: "Colleague",
  requested: "Request sent",
  pending: "Has asked to be your colleague",
  declined: "Operator",
  none: "Operator",
};

export function ProfileView({ profile: p, honours, notice }: { profile: OperatorProfile; honours: EarnedHonour[]; notice?: string }) {
  const here = `/operators/${p.userId}`;
  const n = notice ? COLLEAGUE_NOTICES[notice] : undefined;
  const s = p.stats;
  const grades: Record<Grade, number> = { A: 0, B: 0, C: 0, D: 0, F: 0, ...(s?.grades ?? {}) };
  const gradeMax = Math.max(1, ...GRADES.map((g) => grades[g]));
  const graded = GRADES.reduce((t, g) => t + grades[g], 0);
  const avgFirstAlloc = s && s.first_alloc_count > 0 ? s.first_alloc_sum_sec / s.first_alloc_count : 0;
  const targetPct = s && s.targets_total > 0 ? Math.round((s.targets_met / s.targets_total) * 100) : null;
  const busiest = s ? Object.entries(s.by_type ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 6) : [];
  const busiestMax = Math.max(1, ...busiest.map(([, c]) => c));
  const active = sinceLabel(p.lastActive);

  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.eyebrow}>Operator profile · {STANDING[p.relation]}</p>
          <h1 className={`${styles.pageTitle} ${styles.profileHead}`}>{p.insignia && <ServiceSymbol service={p.insignia} size={30} />}{p.callsign.toUpperCase()}</h1>
          <p className={styles.lede}>
            {roleLabel(p.role)}{p.tester ? " · Pre-Alpha tester" : ""}{p.advisor ? " · programme advisor" : ""} · on the books since {dateLabel(p.joinedAt)}
            {active ? ` · last on shift ${active}` : " · no shift yet"} · {p.colleagues} {p.colleagues === 1 ? "colleague" : "colleagues"}
            {p.discord ? ` · Discord @${p.discord}` : ""}
          </p>
          <div className={styles.headMeta} style={{ justifyContent: "flex-start", marginTop: 14 }}>
            <RelationActions userId={p.userId} relation={p.relation} next={here} />
            {p.relation === "self" && <Link href="/settings" className={`${styles.button} ${styles.small}`}>Who sees this</Link>}
          </div>
        </div>
        <div className={styles.headMeta}>
          {p.visible && p.rank && <span className={`${styles.chip} ${styles.chipAmber}`}>#{p.rank} of {p.players} on the leaderboard</span>}
          {!p.visible && <span className={styles.chip}>{p.visibility === "private" ? "Private record" : "Record for colleagues"}</span>}
          <span className={styles.chip}>{honours.length} {honours.length === 1 ? "honour" : "honours"}</span>
        </div>
      </header>

      {n && <Notice tone={n.tone} title={n.title}><p>{n.body}</p></Notice>}

      <section className={`${styles.panel} ${styles.section}`} style={{ marginTop: n ? undefined : 0 }}>
        <div className={styles.panelHead}><h2>Honours</h2><span className={styles.chip}>Worn in order of precedence</span></div>
        {honours.length === 0 ? (
          <p className={styles.muted}>{p.relation === "self" ? "Nothing on the rack yet. The first incident closed with a stop message brings the first ribbon; thirty days on the books, the second." : "Nothing on the rack yet."}</p>
        ) : (
          <div className={styles.rackWrap}>
            <RibbonRack honours={honours} width={76} />
            <HonourList honours={honours} />
          </div>
        )}
      </section>

      {!p.visible ? (
        <section className={`${styles.panel} ${styles.section}`}>
          <div className={styles.panelHead}><h2>Service record</h2></div>
          <p className={styles.muted}>{p.visibility === "private" ? "This operator keeps their record to themselves." : "This operator keeps their record to colleagues."}</p>
        </section>
      ) : !s ? (
        <section className={`${styles.panel} ${styles.section}`}>
          <div className={styles.panelHead}><h2>Service record</h2></div>
          <p className={styles.muted}>No shifts on record yet.</p>
        </section>
      ) : (
        <>
          <section className={styles.block}>
            <div className={styles.blockHead}><h2>Service record</h2><span className={styles.chip}>{s.score} command points</span></div>
            <div className={styles.facts}>
              <Tile value={String(s.calls_answered)} label="Calls handled" hint="999, 111, 101 and community" />
              <Tile value={String(s.incidents_resolved)} label="Incidents resolved" hint="Closed with a stop message" />
              <Tile value={String(s.resources_allocated)} label="Resources mobilised" hint="Across every attendance" />
              <Tile value={fmtDuration(avgFirstAlloc)} label="Mean time to first mobilisation" hint="Call receipt to first resource assigned" />
            </div>
            <div className={styles.facts} style={{ marginTop: 12 }}>
              <Tile value={String(s.casualties_saved)} label="Casualties conveyed" hint="Handed over at hospital" tint={SERVICE_TINT.Ambulance} />
              <Tile value={String(s.casualties_lost)} label="Casualties deceased" hint="Triaged expectant at close" tint="var(--stop)" />
              <Tile value={targetPct === null ? "—" : `${targetPct}%`} label="Standards met" hint={s.targets_total > 0 ? `${s.targets_met} of ${s.targets_total} assessed` : "Assessed at every debrief"} tint="var(--amber)" />
              <Tile value={s.calls_answered > 0 ? (s.resources_allocated / s.calls_answered).toFixed(1) : "—"} label="Resources per call" hint="Mean mobilised per call handled" />
            </div>
          </section>
          <div className={styles.twoCol}>
            <section className={styles.panel}>
              <div className={styles.panelHead}><h2>Grade distribution</h2><span className={styles.chip}>{graded} graded</span></div>
              <ul className={styles.bars}>
                {GRADES.map((g) => (
                  <li key={g}>
                    <span className={`${styles.gradeBadge} ${styles[`grade${g}`]}`}>{g}</span>
                    <span className={styles.track}><span className={styles.fill} style={{ width: `${(grades[g] / gradeMax) * 100}%`, background: GRADE_FILL[g] }} /></span>
                    <em>{grades[g]}</em>
                  </li>
                ))}
              </ul>
            </section>
            <section className={styles.panel}>
              <div className={styles.panelHead}><h2>Incident types</h2><span className={styles.chip}>Most frequent</span></div>
              {busiest.length === 0 ? (
                <p className={styles.muted}>No incidents on record.</p>
              ) : (
                <ul className={styles.bars}>
                  {busiest.map(([code, c]) => (
                    <li key={code} style={{ gridTemplateColumns: "minmax(0, 150px) minmax(0, 1fr) 36px" }}>
                      <span style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={code}>{typeLabel(code)}</span>
                      <span className={styles.track}><span className={styles.fill} style={{ width: `${Math.round((c / busiestMax) * 100)}%`, background: "#6aa6e8" }} /></span>
                      <em>{c}</em>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}

      <p className={styles.formStatus}><Link href="/colleagues" className={styles.textLink}>Colleagues</Link> · <Link href="/stats" className={styles.textLink}>Leaderboard</Link>{p.relation !== "self" && <> · <Link href="/stats" className={styles.textLink}>Your own record</Link></>}</p>
    </>
  );
}

export function ProfileMissing({ missing }: { missing: boolean }) {
  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.eyebrow}>Operator profile</p>
          <h1 className={styles.pageTitle}>{missing ? "Profiles are not switched on yet" : "No such operator"}</h1>
          <p className={styles.lede}>{missing ? "The database is missing migration 028. Run supabase/migrations/028_colleagues_and_honours.sql in the Supabase SQL editor, then reload the schema." : "Nothing is held under that id, or the account is closed."}</p>
        </div>
      </header>
      <div className={styles.actions}><Link href="/colleagues" className={styles.button}>Colleagues</Link><Link href="/stats" className={styles.button}>Leaderboard</Link></div>
    </>
  );
}
