// Director mode — dice control for filming and playtesting.
//
// Scenario drama runs on probability rolls (informant beats, the
// persons-reality roll), which is right for play and wrong for a camera:
// a showcase take can't wait for the 35% night. Director mode biases
// every roll one way:
//
//   loud  — every probability beat fires, every rollable casualty is
//           present. The dramatic path, every run.
//   quiet — only likely beats (p >= 0.5) fire. The calm path, every run.
//
// Set from the browser console, or by visiting the dashboard with
// ?director=loud / ?director=quiet / ?director=off:
//
//   localStorage.setItem("twr:director", "loud")
//   localStorage.removeItem("twr:director")
//
// Deliberately invisible in the UI so it can never leak into a
// recording; it announces itself in the console instead.

export type DirectorMode = "loud" | "quiet";

const KEY = "twr:director";

export function directorMode(): DirectorMode | null {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "loud" || v === "quiet" ? v : null;
  } catch {
    return null;
  }
}

/** Read ?director=… off the current URL and persist it. Call once on
 *  dashboard mount. */
export function applyDirectorParam(): void {
  try {
    const v = new URLSearchParams(window.location.search).get("director");
    if (v === "loud" || v === "quiet") {
      window.localStorage.setItem(KEY, v);
    } else if (v === "off") {
      window.localStorage.removeItem(KEY);
    }
    const active = directorMode();
    if (active) {
      console.info(
        `[director] ${active} mode — probability rolls are biased ${
          active === "loud" ? "to fire" : "to the likely path"
        }. Clear with ?director=off`,
      );
    }
  } catch {
    // no storage — plain randomness
  }
}

/** One informant-beat roll: fire or skip. */
export function rollBeat(probability: number): boolean {
  const m = directorMode();
  if (m === "loud") return true;
  if (m === "quiet") return probability >= 0.5;
  return Math.random() < probability;
}

/** One persons-reality roll: present or absent tonight. */
export function rollPresent(presentProbability: number): boolean {
  const m = directorMode();
  if (m === "loud") return presentProbability > 0;
  if (m === "quiet") return presentProbability >= 0.5;
  return Math.random() < presentProbability;
}
