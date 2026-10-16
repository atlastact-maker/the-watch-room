// The email every tester gets when the Pre-Alpha doors open: the desk is
// theirs now, and where to start.

import { COMMUNITY_URL, SITE, emailLink, emailShell } from "./layout";

export function doorsOpenEmail(): { subject: string; html: string } {
  return {
    subject: "The Pre-Alpha desk is open — The Watch Room",
    html: emailShell({
      programme: "Closed Pre-Alpha",
      eyebrow: "Closed Pre-Alpha · Doors open",
      heading: "The Pre-Alpha desk is open",
      stamp: { text: "Open", tone: "ok" },
      preheader: "The operator console is open to every tester from now.",
      paragraphs: [
        "The operator console is open to every tester from now. Sign in, read the briefing once, then start a shift.",
        "Report faults from Help on the desk, stating what happened and what you expected instead. That is the whole of the job.",
        `Builds and fixes are announced in the tester channel on the ${emailLink(COMMUNITY_URL, "Discord")}.`,
      ],
      facts: [
        { label: "Status", value: "Doors open" },
        { label: "Start", value: "Pre-Alpha briefing, then Start shift on the operator console" },
        { label: "Faults", value: "Help, then Report a problem, on the desk" },
      ],
      cta: { label: "Open the operator console", href: `${SITE}/menu` },
      callout: { title: "Programme confidentiality", body: "No public footage or write-ups until the doors are open to everyone. Everything else, raise in the tester channel." },
    }),
  };
}
