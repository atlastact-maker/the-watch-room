// The email an operator gets when their Pre-Alpha access request has been
// approved. What it promises depends on the doors: open, the desk is
// theirs now; closed, they are on the list and will hear when it opens.

import { COMMUNITY_URL, SITE, emailLink, emailShell } from "./layout";
import { PREALPHA_RELEASE_LABEL } from "@/lib/prealpha-programme";

export function testerAcceptedEmail(opts: { doorsOpen?: boolean } = {}): { subject: string; html: string } {
  const doorsOpen = opts.doorsOpen !== false;
  const discord = `Not on the Discord yet? ${emailLink(COMMUNITY_URL, "Join here")} and you will be added to the tester channel.`;
  return {
    subject: "Pre-Alpha access approved — The Watch Room",
    html: emailShell({
      programme: "Closed Pre-Alpha",
      eyebrow: "Closed Pre-Alpha · Access request",
      heading: "Pre-Alpha access approved",
      stamp: { text: "Accepted", tone: "ok" },
      preheader: doorsOpen
        ? "Your account can open the operator console and take a shift."
        : `Your account is on the tester list. Access opens to every accepted tester on ${PREALPHA_RELEASE_LABEL}.`,
      paragraphs: doorsOpen
        ? [
            "Your request for Pre-Alpha access has been approved. Your account can open the operator console and take a shift from now.",
            "Start with the briefing: it states what is released, what is not, and how to report faults.",
            discord,
          ]
        : [
            "Your request for Pre-Alpha access has been approved and your account is on the tester list.",
            `The desk is not open yet. Access opens to every accepted tester at the same time on ${PREALPHA_RELEASE_LABEL}, and a notice is sent to this address the moment it does. Until then the briefing sets out what is coming, what is not, and how a shift runs.`,
            discord,
          ],
      facts: [
        { label: "Standing", value: "Pre-Alpha tester" },
        { label: "Desk", value: doorsOpen ? "Open to testers" : `Closed. Opens to every accepted tester on ${PREALPHA_RELEASE_LABEL}.` },
        { label: "First step", value: "Read the Pre-Alpha briefing" },
      ],
      cta: { label: "Read the briefing", href: `${SITE}/prealpha` },
      callout: { title: "Programme confidentiality", body: "No public footage or write-ups until the doors are open. Everything else, raise in the tester channel." },
    }),
  };
}
