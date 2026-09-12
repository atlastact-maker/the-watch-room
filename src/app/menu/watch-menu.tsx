"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import { logout } from "@/lib/auth/actions";
import { CHANGELOG, LATEST, formatEntryDate } from "@/lib/changelog";
import { preparedWatchUrl, WATCH_SERVICES } from "@/lib/sim/menu-state";
import type { ServiceCode } from "@/lib/sim/types";
import type { ShiftIntensity } from "@/lib/sim/shift";
import { ActivityMap } from "./activity-map";
import { usePlayerRecord } from "./use-player-record";
import styles from "./watch-menu.module.css";

export type MenuView = "overview" | "shift" | "guide" | "updates";
type Props = { userId: string; callsign: string; email: string; discord: string; isAdmin: boolean; view: MenuView };
const titles: Record<MenuView, string> = { overview: "Watch overview", shift: "New shift", guide: "How to play", updates: "What's new & feedback" };
const serviceName = (service: ServiceCode) => service === "Fire" ? "Fire & rescue" : service;
const intensityName = (intensity: string) => intensity === "normal" ? "Standard" : intensity === "quiet" ? "Quiet" : "Busy";
const community = "https://discord.gg/YBN3sbphs3";
const supportEmail = "thewtchroom@gmail.com";
const viewHref = (view: MenuView) => view === "overview" ? "/menu" : `/menu?view=${view}`;

function LogoutButton() {
  const { pending } = useFormStatus();
  return <button className={styles.logout} disabled={pending} type="submit">{pending ? "Signing out…" : "Log out"}</button>;
}

function Feedback({ userId }: { userId: string }) {
  const key = `twr:feedback-draft:${userId}`;
  const form = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState("Drafts stay on this browser until you choose to share them.");
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "null");
      if (saved && form.current) for (const name of ["category", "summary", "details"]) {
        const field = form.current.elements.namedItem(name) as HTMLInputElement | null;
        if (field && typeof saved[name] === "string") field.value = saved[name];
      }
    } catch { /* An unreadable draft leaves the form empty. */ }
  }, [key]);
  function draft() {
    const values = new FormData(form.current!);
    return { category: String(values.get("category")), summary: String(values.get("summary") || "").trim(), details: String(values.get("details") || "").trim() };
  }
  function saveDraft() {
    try { localStorage.setItem(key, JSON.stringify(draft())); setMessage("Draft saved on this browser. Nothing has been sent."); }
    catch { setMessage("Browser storage is unavailable. Copy your feedback before leaving."); }
  }
  function valid() { const data = draft(); return !!data.summary && !!data.details && form.current!.reportValidity(); }
  function content() { const data = draft(); return `The Watch Room — ${data.category}\n\n${data.summary}\n\n${data.details}\n\nVersion: ${LATEST.version}`; }
  function email(event: FormEvent) {
    event.preventDefault();
    if (!valid()) { setMessage("Add a summary and details first."); return; }
    window.location.href = `mailto:${supportEmail}?subject=${encodeURIComponent(`[Watch Room feedback] ${draft().summary}`)}&body=${encodeURIComponent(content())}`;
    setMessage("Your email app can send the draft. If it did not open, use Copy feedback and share it in Discord.");
  }
  async function copy() {
    if (!valid()) { setMessage("Add a summary and details first."); return; }
    try { await navigator.clipboard.writeText(content()); setMessage("Copied. Paste your feedback into an email or Discord message."); }
    catch { setMessage("Clipboard unavailable. Select and copy your text, or open an email draft."); }
  }
  return <section className={styles.panel}><p className={styles.eyebrow}>Your feedback</p><h2>What did you notice?</h2><p>Send a suggestion or report an issue to the team.</p>
    <form ref={form} className={styles.feedback} onInput={saveDraft} onSubmit={email}>
      <label htmlFor="feedback-category">Feedback type</label><select id="feedback-category" name="category"><option>Suggestion</option><option>Something is broken</option><option>Gameplay & realism</option><option>Accessibility</option></select>
      <label htmlFor="feedback-summary">Short summary</label><input id="feedback-summary" name="summary" required maxLength={100} placeholder="What should we look at?" />
      <label htmlFor="feedback-details">Details</label><textarea id="feedback-details" name="details" required maxLength={1500} placeholder="What happened, what you expected, and how to reproduce it…" />
      <button className={styles.primary} type="submit">Open email draft →</button><button className={styles.button} type="button" onClick={copy}>Copy feedback</button>
      <p role="status">{message}</p><a href={community} target="_blank" rel="noreferrer">Open the Watch Room Discord ↗</a>
    </form>
  </section>;
}

function Preparation({ hasSave, ready }: { hasSave: boolean; ready: boolean }) {
  const router = useRouter();
  const [services, setServices] = useState<ServiceCode[]>([...WATCH_SERVICES]);
  const [intensity, setIntensity] = useState<ShiftIntensity>("normal");
  const [guidance, setGuidance] = useState(true);
  const [starting, setStarting] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  function begin() {
    if (!services.length || starting || !ready) return;
    setStarting(true);
    router.push(preparedWatchUrl({ intensity, services }));
  }
  function review() { if (!services.length || !ready) return; if (guidance || hasSave) dialog.current?.showModal(); else begin(); }
  return <><header className={styles.intro}><p className={styles.eyebrow}>Watch preparation / Greater Manchester</p><h1>Take the chair.</h1><p>Set the pace of your watch. Begin at area dispatch and take ground command when your crews arrive.</p></header>
    <div className={styles.pageGrid}><div><section className={styles.panel}><p className={styles.eyebrow}>01 / Your operating area</p><h2>Greater Manchester</h2><p>Allocate resources, maintain cover and take command of individual incidents.</p>
      <fieldset className={styles.services} aria-describedby="service-help service-error"><legend>Services under your command</legend><p id="service-help">Choose one or more services for this watch.</p><div>{WATCH_SERVICES.map(service => <label key={service}><input type="checkbox" checked={services.includes(service)} onChange={event => setServices(current => event.target.checked ? WATCH_SERVICES.filter(s => current.includes(s) || s === service) : current.filter(s => s !== service))} />{serviceName(service)}</label>)}</div></fieldset>
      <p className={styles.warning} id="service-error" role="status">{services.length ? "" : "Select at least one service to continue."}</p>
    </section><section className={styles.panel}><p className={styles.eyebrow}>02 / Choose the pace</p><fieldset className={styles.choices}><legend className={styles.srOnly}>Watch intensity</legend>{(["quiet", "normal", "busy"] as ShiftIntensity[]).map(value => <label key={value}><input type="radio" name="intensity" value={value} checked={intensity === value} onChange={() => setIntensity(value)} /><strong>{intensityName(value)}</strong><span>{value === "quiet" ? "Space to learn the desk and follow your crews." : value === "normal" ? "A steady flow of calls across the area." : "Competing incidents. Keep a close eye on cover."}</span>{value === "normal" && <small>RECOMMENDED</small>}</label>)}</fieldset></section>
      <section className={styles.panel}><p className={styles.eyebrow}>03 / Before you begin</p><label className={styles.switchRow}><span>Show the command briefing<small>A reminder of the dispatch and ground command workflow.</small></span><input type="checkbox" checked={guidance} onChange={event => setGuidance(event.target.checked)} /></label><p className={styles.callout}>Returning to area dispatch keeps your crew orders running.</p></section></div>
      <section className={`${styles.panel} ${styles.briefing}`}><p className={styles.eyebrow}>Your watch / Briefing</p><h2>Greater Manchester</h2><dl><div><dt>Services</dt><dd>{services.map(serviceName).join(", ") || "None selected"}</dd></div><div><dt>Intensity</dt><dd>{intensityName(intensity)}</dd></div><div><dt>Start time</dt><dd>08:00</dd></div><div><dt>Starting view</dt><dd>Area dispatch</dd></div><div><dt>Ground command</dt><dd>Available at incidents</dd></div></dl><button className={styles.primary} disabled={!ready || !services.length || starting} onClick={review} aria-describedby="service-error">{starting ? "Starting…" : "Review & begin →"}</button>{hasSave && <p className={styles.warning}>You have a saved watch. Starting this one will replace it.</p>}</section>
    </div>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="start-title"><button className={styles.close} aria-label="Close briefing" onClick={() => dialog.current?.close()}>×</button><p className={styles.eyebrow}>Watch briefing</p><h2 id="start-title">{hasSave ? "Replace your saved watch?" : "Your watch is ready."}</h2><p>{intensityName(intensity)} intensity · {services.map(serviceName).join(", ")}</p>{guidance && <ol><li>Dispatch suitable resources to incoming calls.</li><li>Command crews at the incident.</li><li>Resolve the incident and restore cover.</li></ol>}{hasSave && <p className={styles.warning}>Your current saved watch will be replaced when you start. Cancel to keep it.</p>}<div className={styles.actions}><button className={styles.primary} disabled={starting || !services.length} onClick={begin}>{starting ? "Starting…" : hasSave ? "Replace & start watch" : "Start watch →"}</button><button className={styles.button} onClick={() => dialog.current?.close()}>Cancel</button></div></dialog>
  </>;
}

export function WatchMenu({ userId, callsign, email, discord, isAdmin, view }: Props) {
  const record = usePlayerRecord();
  const nav = (target: MenuView, icon: string) => <Link className={view === target ? styles.active : undefined} href={viewHref(target)} aria-current={view === target ? "page" : undefined} title={titles[target]}><span aria-hidden="true">{icon}</span><span>{target === "shift" ? "Start a shift" : titles[target]}</span></Link>;
  const savedAgo = record.save ? Math.max(0, Math.round((record.now - record.save.savedAt) / 60000)) : 0;
  return <div className={styles.shell}>
    <aside className={styles.sidebar}><Link href="/menu" className={styles.brand} aria-label="The Watch Room home"><Image src="/email-logo.png" width={42} height={32} alt="The Watch Room logo" /><span>THE<br />WATCH ROOM</span></Link>
      <nav className={styles.nav} aria-label="Main navigation"><p>Operations</p>{nav("overview", "⌂")}{nav("shift", "◇")}<Link href="/stats"><span aria-hidden="true">▤</span><span>Service record</span></Link>{nav("guide", "?")}<Link href="/glossary"><span aria-hidden="true">▥</span><span>Reference library</span></Link><p>Community</p><a href={community} target="_blank" rel="noreferrer"><span aria-hidden="true">◎</span><span>Discord community</span></a>{nav("updates", "+")}<p>Account</p>{isAdmin && <Link href="/admin"><span aria-hidden="true">♜</span><span>Administration</span></Link>}<Link href="/settings"><span aria-hidden="true">⚙</span><span>Settings</span></Link></nav>
      <div className={styles.account}><Link href="/settings" title={email}><strong>{callsign || "Your account"}</strong><small>{isAdmin ? "Administrator" : "Operator"}</small></Link><form action={logout}><LogoutButton /></form><p>GREATER MANCHESTER<br />CLOSED DEVELOPMENT</p></div>
    </aside>
    <main className={styles.main}><div className={styles.topbar}><span>Operations / <strong>{titles[view]}</strong></span><span>Greater Manchester</span></div><div className={styles.content}>
      {view === "overview" && <><p className={styles.greeting}>Welcome{record.save || record.last ? " back" : ""}{callsign ? `, ${callsign}` : ""}. Your next watch is waiting.</p>
        <section className={styles.hero}><div className={styles.heroCopy}><p className={styles.brandLine}><Image src="/email-logo.png" width={38} height={28} alt="" />THE WATCH ROOM</p><h1>One county.<br /><span>Your command.</span></h1><p>Run the response across Greater Manchester.<br />Dispatch your resources. Take command on the ground. Bring every incident to a close.</p><div className={styles.actions}>{!record.loaded ? <button className={styles.primary} disabled>Checking your watch…</button> : record.save ? <><Link className={styles.primary} href="/dashboard">Resume your watch →</Link><Link className={styles.button} href={viewHref("shift")}>New shift</Link></> : <><Link className={styles.primary} href={viewHref("shift")}>{record.last ? "Start a new watch →" : "Start your first watch →"}</Link><Link className={styles.button} href={viewHref("guide")}>How to play</Link></>}</div><small>FIRE & RESCUE / AMBULANCE / POLICE</small></div><ActivityMap /></section>
        {record.loaded && record.save && <div className={styles.saveLine}><div><strong>A watch is in progress</strong><p>{record.save.title} · {intensityName(record.save.intensity)}</p></div><small>Saved {savedAgo < 1 ? "moments ago" : `${savedAgo} min ago`}</small><Link href="/dashboard">Resume →</Link></div>}
        {record.unavailable && <p className={styles.callout}>Browser storage is unavailable. Enable site storage to save and resume a watch on this device.</p>}
        <div className={styles.tools}><Link href={viewHref("guide")}><strong>How to play</strong><span>From area dispatch to ground command.</span></Link><Link href="/settings"><strong>Settings</strong><span>Your account, Discord details and sound.</span></Link><Link href={viewHref("updates")}><strong>What&apos;s new & feedback</strong><span>Development notes and your ideas.</span></Link></div>
        <h2 className={styles.sectionTitle}>Before you take the chair</h2><div className={styles.lowerGrid}><section className={styles.panel}>
          {!record.loaded ? <p>Loading your record…</p> : record.last ? <><div className={styles.cardTop}><p className={styles.eyebrow}>Last completed incident</p><span className={styles.grade}>GRADE {record.last.grade}</span></div><h2>{record.last.incidentTitle}</h2><p>{new Date(record.last.resolvedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p><div className={styles.stats}><div><strong>{record.last.resourcesUsed}</strong><span>Resources mobilised</span></div><div><strong>{record.last.targetsMet}/{record.last.targetsTotal}</strong><span>Targets met</span></div><div><strong>{record.last.casualtiesSaved}</strong><span>Patients saved</span></div></div><Link href="/stats">View your service record →</Link></> : <><p className={styles.eyebrow}>Your service record</p><h2>Your first debrief is ahead.</h2><p>Complete an incident to see its outcome here. Your service record tracks the watches you build from there.</p><div className={styles.actions}><Link className={styles.button} href="/stats">Open service record →</Link></div></>}
        </section><div className={styles.quickLinks}><Link href="/glossary"><strong>Know your resources</strong><span>Callsigns, capabilities and incident procedures.</span></Link><a href={community} target="_blank" rel="noreferrer"><strong>Join the watch</strong><span>Share feedback with the Watch Room community.</span></a><Link href="/changelog"><strong>{LATEST.title}</strong><span>v{LATEST.version} · {formatEntryDate(LATEST.date)}</span></Link></div></div>
      </>}
      {view === "shift" && <Preparation hasSave={!!record.save} ready={record.loaded && !record.unavailable} />}
      {view === "guide" && <><header className={styles.intro}><p className={styles.eyebrow}>Your first watch / Command briefing</p><h1>The county needs a response.</h1><p>Manage the bigger picture, then take ground command when an incident needs your direction.</p></header><div className={styles.guideGrid}>{[["01", "Dispatch the response.", "Assess incoming calls, choose suitable resources and maintain cover across Greater Manchester."], ["02", "Take ground command.", "Enter the incident, select crews and issue tasks to control hazards, rescue people and treat patients."], ["03", "Bring it under control.", "Monitor progress and crew safety, complete the incident objectives and release resources when the incident is resolved."]].map(([number, title, body]) => <section className={styles.panel} key={number}><p className={styles.eyebrow}>{number}</p><h2>{title}</h2><p>{body}</p></section>)}</div><section className={styles.panel}><h2>Keep the wider watch moving.</h2><p>Returning to area dispatch keeps crew orders running. Check back on incidents while managing new calls. You can delegate an incident when you want the on-scene commander to handle it.</p><p className={styles.callout}>In ground command, use the available actions and monitor water, breathing apparatus, hazards and patients. Reassess what remains before closing an incident.</p></section><div className={styles.actions}><Link className={styles.primary} href={viewHref("shift")}>Prepare a watch →</Link><Link className={styles.button} href="/glossary">Open reference library</Link></div></>}
      {view === "updates" && <><header className={styles.intro}><p className={styles.eyebrow}>The watch noticeboard</p><h1>Help shape the next watch.</h1><p>Catch up with development and share your feedback with the team.</p></header><div className={styles.pageGrid}><section className={styles.panel}><h2>Development notes</h2>{CHANGELOG.slice(0, 3).map(entry => <article className={styles.update} key={`${entry.version}-${entry.date}`}><p className={styles.eyebrow}>v{entry.version} · {formatEntryDate(entry.date)}</p><h3>{entry.title}</h3><ul>{entry.items.slice(0, 3).map(item => <li key={item}>{item}</li>)}</ul></article>)}<Link href="/changelog">All development notes →</Link></section><Feedback userId={userId} /></div></>}
      <footer className={styles.footer}><span>THE WATCH ROOM · AN INDEPENDENT SIMULATION</span><Link href="/settings" title={`${email}${discord ? ` · Discord: ${discord}` : ""}`}>Account settings</Link></footer>
    </div></main>
  </div>;
}
