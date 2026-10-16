"use client";

// Shift configuration: the services under command, the call volume, the
// pre-shift briefing, and the way into the console.

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { preparedWatchUrl, WATCH_SERVICES } from "@/lib/sim/menu-state";
import type { ServiceCode } from "@/lib/sim/types";
import type { ShiftIntensity } from "@/lib/sim/shift";
import { Icon } from "./icons";
import { intensityName, serviceName } from "./menu-types";
import styles from "./watch-menu.module.css";

const INTENSITY_NOTES: Record<ShiftIntensity, string> = {
  quiet: "Reduced call volume. Familiarisation with the console and the incident ground.",
  normal: "Steady call volume across the county.",
  busy: "Concurrent incidents competing for the same resources. Maintain county cover.",
};

export function ShiftView({ hasSave, ready }: { hasSave: boolean; ready: boolean }) {
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
  function review() {
    if (!services.length || !ready) return;
    if (guidance || hasSave) dialog.current?.showModal();
    else begin();
  }
  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.eyebrow}>Shift configuration · Greater Manchester</p>
          <h1 className={styles.pageTitle}>Configure the shift.</h1>
          <p className={styles.lede}>Set the services under command and the call volume for this shift. The shift opens at area dispatch; incident ground command is assumed as resources arrive on scene.</p>
        </div>
      </header>
      <div className={styles.pageGrid}>
        <div>
          <section className={styles.panel}>
            <p className={styles.eyebrow}>01 / Services under command</p>
            <h2 className={styles.panelTitle}>Service coverage</h2>
            <p className={styles.muted}>Select one or more services. Each service brings its own call types, resources and performance standards.</p>
            <fieldset className={styles.services} aria-describedby="service-help service-error">
              <legend className={styles.srOnly}>Services under command</legend>
              <p id="service-help" className={styles.srOnly}>Select one or more services for this shift.</p>
              <div>
                {WATCH_SERVICES.map((service) => (
                  <label key={service}>
                    <input type="checkbox" checked={services.includes(service)} onChange={(event) => setServices((current) => (event.target.checked ? WATCH_SERVICES.filter((s) => current.includes(s) || s === service) : current.filter((s) => s !== service)))} />
                    {serviceName(service)}
                  </label>
                ))}
              </div>
            </fieldset>
            <p className={styles.warning} id="service-error" role="status">{services.length ? "" : "Select at least one service to continue."}</p>
          </section>
          <section className={styles.panel}>
            <p className={styles.eyebrow}>02 / Call volume</p>
            <h2 className={styles.panelTitle}>Shift intensity</h2>
            <fieldset className={styles.choices}>
              <legend className={styles.srOnly}>Shift intensity</legend>
              {(["quiet", "normal", "busy"] as ShiftIntensity[]).map((value) => (
                <label key={value}>
                  <input type="radio" name="intensity" value={value} checked={intensity === value} onChange={() => setIntensity(value)} />
                  <strong>{intensityName(value)}</strong>
                  <span>{INTENSITY_NOTES[value]}</span>
                  {value === "normal" && <small>Recommended</small>}
                </label>
              ))}
            </fieldset>
          </section>
          <section className={styles.panel}>
            <p className={styles.eyebrow}>03 / Pre-shift</p>
            <label className={styles.switchRow}>
              <span>Show the command briefing<small>A summary of the shift structure before the clock starts.</small></span>
              <input type="checkbox" checked={guidance} onChange={(event) => setGuidance(event.target.checked)} />
            </label>
            <p className={styles.callout}>The resourcing page follows: appliances on the run, appliances off the run, and stations short of establishment. Review it before the first call.</p>
          </section>
        </div>
        <section className={`${styles.panel} ${styles.briefing}`}>
          <p className={styles.eyebrow}>Shift summary</p>
          <h2>Greater Manchester</h2>
          <dl>
            <div><dt>Services</dt><dd>{services.map(serviceName).join(", ") || "None selected"}</dd></div>
            <div><dt>Call volume</dt><dd>{intensityName(intensity)}</dd></div>
            <div><dt>Start time</dt><dd>08:00</dd></div>
            <div><dt>Opening position</dt><dd>Area dispatch</dd></div>
            <div><dt>Incident command</dt><dd>At every incident</dd></div>
          </dl>
          <button className={styles.primary} disabled={!ready || !services.length || starting} onClick={review} aria-describedby="service-error">{starting ? "Starting…" : "Review and begin"} <Icon.arrow /></button>
          {hasSave && <p className={styles.warning}>A saved shift exists. Starting this shift replaces it.</p>}
        </section>
      </div>
      <dialog ref={dialog} className={styles.dialog} aria-labelledby="start-title">
        <button className={styles.close} aria-label="Close briefing" onClick={() => dialog.current?.close()}>×</button>
        <p className={styles.eyebrow}>Command briefing</p>
        <h2 id="start-title">{hasSave ? "Replace the saved shift?" : "Shift ready."}</h2>
        <p>{intensityName(intensity)} call volume · {services.map(serviceName).join(", ")}</p>
        {guidance && (
          <ol>
            <li>Receive the call, assign the code and grade, and mobilise an appropriate attendance.</li>
            <li>Maintain county cover while resources are en route.</li>
            <li>Command the incident ground, stand down, and restore cover.</li>
          </ol>
        )}
        {hasSave && <p className={styles.warning}>The saved shift will be replaced on start. Cancel to retain it.</p>}
        <div className={styles.actions}>
          <button className={styles.primary} disabled={starting || !services.length} onClick={begin}>{starting ? "Starting…" : hasSave ? "Replace and start shift" : "Start shift"} <Icon.arrow /></button>
          <button className={styles.button} onClick={() => dialog.current?.close()}>Cancel</button>
        </div>
      </dialog>
    </>
  );
}
