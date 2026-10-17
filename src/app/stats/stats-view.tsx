"use client";

// The service record: career statistics synced to the account (the local
// cache and the Supabase row, max-merged) and the operator leaderboard by
// command points. The local record is read through useSyncExternalStore
// so the server and client renders agree; the sync re-reads it once the
// account copy has been merged in.

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore, type CSSProperties } from "react";
import { commandScore, loadCareerStats, type CareerStats, type Grade } from "@/lib/sim/stats";
import { fetchLeaderboard, syncCareerStats, type LeaderboardRow } from "@/lib/sim/stats-sync";
import { Icon } from "@/app/menu/icons";
import { CAREER_KEY } from "@/app/menu/use-player-record";
import { SERVICE_TINT, viewHref } from "@/app/menu/menu-types";
import { EMPTY_FACTS, evaluateHonours, type HonourFacts } from "@/lib/awards";
import { HonourList, RibbonRack } from "@/app/components/ribbon-rack";
import type { OperatorProfile } from "@/lib/operators";
import styles from "@/app/menu/watch-menu.module.css";

const GRADES: Grade[] = ["A", "B", "C", "D", "F"];
const GRADE_FILL: Record<Grade, string> = { A: "#4fc16d", B: "#6fcf8a", C: "#e6b65c", D: "#d8a955", F: "#e5736a" };
const configured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
const SYNCED = "twr:career-stats:synced";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(SYNCED, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(SYNCED, callback); };
}
function getSnapshot() {
  try { return localStorage.getItem(CAREER_KEY) ?? ""; } catch { return ""; }
}
const serverSnapshot = () => null;

function fmtDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m} min ${String(s).padStart(2, "0")} s` : `${s} s`;
}
const typeLabel = (code: string) => code.replace(/[_-]+/g, " ").toUpperCase();

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

/** The honours' figures as the device's record has them. */
function factsFromStats(s: CareerStats): HonourFacts {
  return {
    ...EMPTY_FACTS,
    incidentsResolved: s.incidentsResolved,
    casualtiesSaved: s.casualtiesSaved,
    gradeA: s.grades.A ?? 0,
    graded: GRADES.reduce((t, g) => t + (s.grades[g] ?? 0), 0),
    meanFirstAllocSec: s.firstAllocCount > 0 ? s.firstAllocSumSec / s.firstAllocCount : null,
    targetsMet: s.targetsMet,
    targetsTotal: s.targetsTotal,
    distinctTypes: Object.keys(s.byType).length,
  };
}

/** The account's standing from the server; the counters from whichever
 *  side is further on, so a shift not yet synced still counts. */
function mergeFacts(account: HonourFacts, local: HonourFacts): HonourFacts {
  const ahead = local.incidentsResolved > account.incidentsResolved;
  return {
    ...account,
    incidentsResolved: Math.max(account.incidentsResolved, local.incidentsResolved),
    casualtiesSaved: Math.max(account.casualtiesSaved, local.casualtiesSaved),
    gradeA: Math.max(account.gradeA, local.gradeA),
    graded: Math.max(account.graded, local.graded),
    meanFirstAllocSec: ahead ? local.meanFirstAllocSec : account.meanFirstAllocSec ?? local.meanFirstAllocSec,
    targetsMet: local.targetsTotal > account.targetsTotal ? local.targetsMet : account.targetsMet,
    targetsTotal: Math.max(account.targetsTotal, local.targetsTotal),
    distinctTypes: Math.max(account.distinctTypes, local.distinctTypes),
  };
}

export function StatsView({ profile = null, userId }: { profile?: OperatorProfile | null; userId?: string } = {}) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, serverSnapshot);
  // raw is only a change signal; the parsed, defaulted record comes from the library.
  const stats = useMemo<CareerStats | null>(() => (raw === null ? null : loadCareerStats()), [raw]);
  const [board, setBoard] = useState<LeaderboardRow[] | null | "loading">(configured ? "loading" : null);

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    void syncCareerStats().then(() => {
      if (cancelled) return;
      window.dispatchEvent(new Event(SYNCED));
      return fetchLeaderboard().then((rows) => { if (!cancelled) setBoard(rows); });
    });
    return () => { cancelled = true; };
  }, []);

  const played = !!stats && stats.callsAnswered > 0;
  const avgFirstAlloc = stats && stats.firstAllocCount > 0 ? stats.firstAllocSumSec / stats.firstAllocCount : 0;
  const targetPct = stats && stats.targetsTotal > 0 ? Math.round((stats.targetsMet / stats.targetsTotal) * 100) : null;
  const gradeMax = stats ? Math.max(1, ...GRADES.map((g) => stats.grades[g] ?? 0)) : 1;
  const busiest = stats ? Object.entries(stats.byType).sort((a, b) => b[1] - a[1]).slice(0, 6) : [];
  const score = stats ? commandScore(stats) : 0;
  const n = (v: number | undefined) => (stats ? String(v ?? 0) : "—");
  // The rack: the account's standing from the server, the counters
  // brought up to the device's record where a shift has not synced yet.
  const honours = useMemo(() => {
    const local = stats ? factsFromStats(stats) : null;
    if (!profile && !local) return [];
    const base = profile ? profile.facts : EMPTY_FACTS;
    return evaluateHonours(local ? mergeFacts(base, local) : base, profile?.awards ?? []);
  }, [profile, stats]);

  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.eyebrow}>Service record · synced to this account</p>
          <h1 className={styles.pageTitle}>Service record</h1>
          <p className={styles.lede}>Career statistics across every shift on this account, and the operator leaderboard ranked by command points.</p>
        </div>
        <div className={styles.headMeta}>
          <span className={`${styles.chip} ${styles.chipAmber}`}>{stats ? score : "—"} command points</span>
          <span className={styles.chip}>{configured ? "Account sync" : "Local record"}</span>
        </div>
      </header>

      <section className={styles.panel} style={{ marginBottom: 24 }}>
        <div className={styles.panelHead}>
          <h2>Honours</h2>
          <span className={styles.headMeta} style={{ paddingTop: 0 }}>
            {userId && <Link href={`/operators/${userId}`} className={`${styles.button} ${styles.small}`}>Public profile <Icon.arrow /></Link>}
            <Link href="/colleagues" className={`${styles.button} ${styles.small}`}>Colleagues</Link>
          </span>
        </div>
        {honours.length === 0 ? (
          <p className={styles.muted}>Nothing on the rack yet. The first incident closed with a stop message brings the first ribbon; thirty days on the books, the second.</p>
        ) : (
          <div className={styles.rackWrap}>
            <RibbonRack honours={honours} width={76} />
            <HonourList honours={honours} />
          </div>
        )}
      </section>

      {stats && !played ? (
        <section className={`${styles.panel} ${styles.empty}`}>
          <p className={styles.eyebrow}>No shifts recorded</p>
          <strong>No incidents on record.</strong>
          <p>Statistics accrue as calls are handled, resources mobilised and incidents closed. The record opens with the first stop message.</p>
          <Link href={viewHref("shift")}>Start shift <Icon.arrow /></Link>
        </section>
      ) : (
        <>
          <section className={styles.block} style={{ marginTop: 0 }}>
            <div className={styles.blockHead}><h2>Headline figures</h2></div>
            <div className={styles.facts}>
              <Tile value={n(stats?.callsAnswered)} label="Calls handled" hint="999, 111, 101 and community" />
              <Tile value={n(stats?.incidentsResolved)} label="Incidents resolved" hint="Closed with a stop message" />
              <Tile value={n(stats?.resourcesAllocated)} label="Resources mobilised" hint="Across every attendance" />
              <Tile value={stats ? fmtDuration(avgFirstAlloc) : "—"} label="Mean time to first mobilisation" hint="Call receipt to first resource assigned" />
            </div>
            <div className={styles.facts} style={{ marginTop: 12 }}>
              <Tile value={n(stats?.casualtiesSaved)} label="Casualties conveyed" hint="Handed over at hospital" tint={SERVICE_TINT.Ambulance} />
              <Tile value={n(stats?.casualtiesLost)} label="Casualties deceased" hint="Triaged expectant at close" tint="var(--stop)" />
              <Tile value={targetPct === null ? "—" : `${targetPct}%`} label="Standards met" hint={stats && stats.targetsTotal > 0 ? `${stats.targetsMet} of ${stats.targetsTotal} assessed` : "Assessed at every debrief"} tint="var(--amber)" />
              <Tile value={stats && stats.callsAnswered > 0 ? (stats.resourcesAllocated / stats.callsAnswered).toFixed(1) : "—"} label="Resources per call" hint="Mean mobilised per call handled" />
            </div>
          </section>

          <div className={styles.twoCol}>
            <section className={styles.panel}>
              <div className={styles.panelHead}><h2>Grade distribution</h2><span className={styles.chip}>{stats ? GRADES.reduce((t, g) => t + (stats.grades[g] ?? 0), 0) : 0} graded</span></div>
              <ul className={styles.bars}>
                {GRADES.map((g) => {
                  const count = stats?.grades[g] ?? 0;
                  return (
                    <li key={g}>
                      <span className={`${styles.gradeBadge} ${styles[`grade${g}`]}`}>{g}</span>
                      <span className={styles.track}><span className={styles.fill} style={{ width: `${(count / gradeMax) * 100}%`, background: GRADE_FILL[g] }} /></span>
                      <em>{count}</em>
                    </li>
                  );
                })}
              </ul>
              {stats && stats.incidentsResolved === 0 && <p className={styles.formStatus}>The first resolved incident receives the first grade.</p>}
            </section>
            <section className={styles.panel}>
              <div className={styles.panelHead}><h2>Incident types</h2><span className={styles.chip}>Most frequent</span></div>
              {busiest.length === 0 ? (
                <p className={styles.muted}>No incidents on record.</p>
              ) : (
                <ul className={styles.kv}>
                  {busiest.map(([type, count]) => <li key={type}><span>{typeLabel(type)}</span><span>×{count}</span></li>)}
                </ul>
              )}
            </section>
          </div>
        </>
      )}

      <section className={`${styles.panel} ${styles.section}`}>
        <div className={styles.panelHead}>
          <h2>Operator leaderboard · all time</h2>
          <span className={styles.chip}>A 5 · B 4 · C 3 · D 2 · F 1 points</span>
        </div>
        {board === "loading" ? (
          <p className={styles.muted}>Retrieving the leaderboard…</p>
        ) : board === null ? (
          <p className={styles.muted}>The leaderboard is unavailable: the account service could not be reached from this device.</p>
        ) : board.length === 0 ? (
          <p className={styles.muted}>No scores posted. The first resolved incident opens the board.</p>
        ) : (
          <table className={styles.table}>
            <thead><tr><th>Rank</th><th>Operator</th><th className={styles.num}>Incidents resolved</th><th className={styles.num}>Conveyed</th><th className={styles.num}>Points</th></tr></thead>
            <tbody>
              {board.map((r) => (
                <tr key={r.rank} className={r.isYou ? styles.you : undefined}>
                  <td>{String(r.rank).padStart(2, "0")}</td>
                  <td><Link href={`/operators/${r.userId}`} className={styles.textLink}>{r.callsign}</Link>{r.isYou ? " · this account" : ""}</td>
                  <td className={styles.num}>{r.incidentsResolved}</td>
                  <td className={styles.num}>{r.casualtiesSaved}</td>
                  <td className={styles.num}>{r.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
