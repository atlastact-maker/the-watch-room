// THE COMPANION TABLET'S WIRE. The desk owns the shift; a tablet that has
// joined it sees the MDT the desk would draw and sends back what is
// pressed on it. The desk broadcasts the MDT's props in slices, each one
// when it changes; the tablet broadcasts actions by the name of the prop
// the MDT would have called. Both ends share one channel named by the
// pairing code the desk shows.

/** The code lives for the browser session: a desk reload keeps the pairing. */
export const COMPANION_CODE_KEY = "twr:companion-code";

/** No 0, 1, I or O — a code read off a screen must survive being typed. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 8;

export function newCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

/** What someone typed, as a code: upper case, the lookalikes forgiven. */
export function normaliseCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/0/g, "Q").replace(/1/g, "L").replace(/I/g, "L").replace(/O/g, "Q").slice(0, CODE_LENGTH);
}

export function isCode(s: string): boolean {
  return s.length === CODE_LENGTH && [...s].every((c) => ALPHABET.includes(c));
}

export function formatCode(code: string): string {
  return code.length > 4 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}

export function channelName(code: string): string {
  return `twr-mdt-${code.toLowerCase()}`;
}

/** The MDT's props, grouped by how often they change. `now` is not sent:
 *  the tablet keeps its own clock. */
export type Slice = "static" | "incident" | "units" | "tasks" | "care" | "log";
export const SLICE_KEYS: Record<Slice, readonly string[]> = {
  static: ["stations", "patch", "recordIndex"],
  incident: ["incident"],
  units: [
    "deployments", "etas", "crewAir", "busyCrewIds", "vehicleGauges", "fatigueByApplianceId", "sceneCommanderApplianceId",
    "commanderApplianceId", "tacticalMode", "unitId", "structural", "waterClock", "hemsFlyable", "ambient", "outcome",
    "informantOnCall", "policePage", "subject", "ledsChecks",
  ],
  tasks: ["tasks", "sim"],
  care: ["treatmentByCasualtyId", "resusByCasualtyId"],
  log: ["log", "informantLog"],
};
export const SLICES = Object.keys(SLICE_KEYS) as Slice[];
/** The tablet does not need the whole shift's log. */
export const LOG_CAP = 250;

export type CompanionMsg =
  /** The desk, to a tablet that has joined: which props are callable. */
  | { t: "hello"; seq: number; fn: string[]; incident: boolean }
  | { t: "slice"; key: Slice; seq: number; data: string }
  | { t: "chunk"; key: Slice; seq: number; i: number; n: number; part: string }
  /** A tablet arriving, and staying. */
  | { t: "join"; id: string }
  | { t: "ping"; id: string }
  /** Something pressed on the tablet: the prop the MDT would have called. */
  | { t: "act"; id: string; name: string; args: unknown[] }
  /** The desk has stopped sharing. */
  | { t: "bye" };

/** A tablet that has not pinged for this long has gone. */
export const TABLET_STALE_MS = 35_000;
export const PING_MS = 10_000;
