// Shared view-model helpers for the VECTOR shell — the small formatting
// and grading functions every screen and tile needs, kept out of the
// dashboard client so the tiles can be read on their own.

import type { CallGrade, Incident, Scenario, Severity } from "@/lib/sim/incident_types";
import type { Appliance, ServiceCode, StatusCode } from "@/lib/sim/types";
import { STATUS_LABELS } from "@/lib/sim/types";

export const SERVICE_LETTER: Record<ServiceCode, string> = { Fire: "F", Ambulance: "A", Police: "P" };
export const SERVICE_SHORT: Record<ServiceCode, string> = { Fire: "FIRE", Ambulance: "AMB", Police: "POL" };

/** A CAD-style incident reference from the job's opening time. */
export function incidentRef(inc: Incident): string {
  const d = new Date(inc.receivedAt);
  const yy = String(d.getFullYear()).slice(-2);
  const start = new Date(d.getFullYear(), 0, 0);
  const doy = Math.floor((d.getTime() - start.getTime()) / 86400000);
  const seq = String(parseInt(inc.id.replace(/\D/g, "").slice(-4) || "0", 10) % 10000).padStart(4, "0");
  return `${yy}/${String(doy).padStart(3, "0")}/${seq}`;
}

export function mmss(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function hhmmss(ts: number): string {
  const d = new Date(ts);
  return [d.getHours(), d.getMinutes(), d.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":");
}

export function etaLabel(seconds: number): string {
  if (seconds <= 0) return "At scene";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

/** The call's grade on its own service's ladder, the short way. */
/** A grade read off the call text when none is authored — "Category 2"
 *  in an ambulance nature, "Grade 1" in a police one. */
export function impliedGrade(s: Scenario): CallGrade | undefined {
  if (s.callGrade) return s.callGrade;
  const text = `${s.title} ${s.trigger}`;
  const cat = /\b(?:category|cat)\s*([1-5])\b/i.exec(text);
  if (cat) {
    const grade = Number(cat[1]) as 1 | 2 | 3 | 4 | 5;
    const std = grade === 1 ? 7 : grade === 2 ? 18 : grade === 3 ? 120 : grade === 4 ? 180 : null;
    return { scale: "ambulance_arp", grade, standardMinutes: std, basis: "Read from the nature as given" };
  }
  const pol = /\bgrade\s*([12])\b/i.exec(text);
  if (pol) {
    const grade = Number(pol[1]) as 1 | 2;
    return { scale: "police_thrive", grade, standardMinutes: grade === 1 ? 15 : 60, basis: "Read from the nature as given" };
  }
  return undefined;
}

export function gradeShort(g: CallGrade | undefined): string {
  if (!g) return "UNGRADED";
  if (g.scale === "police_thrive") return `GRADE ${g.grade}`;
  if (g.scale === "ambulance_arp") return `CAT ${g.grade}`;
  return g.grade.toUpperCase();
}

/** Longer grade line — what the grade means and the standard it carries. */
export function gradeMeaning(g: CallGrade | undefined): string {
  if (!g) return "No grade recorded for this call";
  const std = g.standardMinutes ? `${g.standardMinutes}m standard` : "no attendance standard";
  if (g.scale === "police_thrive") {
    const name =
      g.grade === 1 ? "Immediate" : g.grade === 2 ? "Priority" : g.grade === "C" ? "Central resolution" : g.grade === "L" ? "Local resolution" : "Police generated";
    return `${name} · ${std}`;
  }
  if (g.scale === "ambulance_arp") {
    const name = g.grade === 1 ? "life-threatening" : g.grade === 2 ? "emergency" : g.grade === 3 ? "urgent" : g.grade === 4 ? "less urgent" : "non-urgent";
    return `${name} · ${std}`;
  }
  return `${g.grade} · ${std}`;
}

/** Which service the call belongs to — the first slot's service. */
export function scenarioService(s: Scenario): ServiceCode {
  return s.pda[0]?.service ?? (s.type.startsWith("ambulance") ? "Ambulance" : s.type.startsWith("police") ? "Police" : "Fire");
}

export function applianceService(a: Appliance): ServiceCode {
  return a.service;
}

export function statusLabel(s: StatusCode): string {
  return STATUS_LABELS[s];
}

export function severityRank(s: Severity): number {
  return { low: 0, moderate: 1, high: 2, major: 3 }[s];
}

/** How a waiting call reads against its grade's clock. */
export function waitState(waitedSec: number, g: CallGrade | undefined): "ok" | "warn" | "breached" {
  const std = g?.standardMinutes;
  if (std) {
    const f = waitedSec / (std * 60);
    return f >= 1 ? "breached" : f >= 0.5 ? "warn" : "ok";
  }
  return waitedSec >= 120 ? "breached" : waitedSec >= 45 ? "warn" : "ok";
}

export function shortAddress(address: string): { line1: string; line2: string } {
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) return { line1: address, line2: "" };
  return { line1: parts[0], line2: parts.slice(1).join(", ") };
}

export function copyText(text: string): void {
  try {
    void navigator.clipboard?.writeText(text);
  } catch {
    /* clipboard blocked — nothing to do */
  }
}
