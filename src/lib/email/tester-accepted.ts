// The email an operator gets when their pre-alpha access request has been
// approved. What it promises depends on the doors: open, the desk is
// theirs now; closed, they are on the list and will hear when it opens.

import { COMMUNITY_URL, SITE, emailLink, emailShell } from "./layout";

export function testerAcceptedEmail(opts: { doorsOpen?: boolean } = {}): { subject: string; html: string } {
  const doorsOpen = opts.doorsOpen !== false;
  const discord = `Not on the Discord yet? ${emailLink(COMMUNITY_URL, "Join here")} and you will be added to the tester channel.`;
  return {
    subject: "Pre-alpha access approved — The Watch Room",
    html: emailShell({
      programme: "Closed pre-alpha",
      eyebrow: "Closed pre-alpha · Access request",
      heading: "Pre-alpha access approved",
      stamp: { text: "Accepted", tone: "ok" },
      preheader: doorsOpen
        ? "Your account can open the operator console and take a shift."
        : "Your account is on the tester list. The desk opens to every tester at once.",
      paragraphs: doorsOpen
        ? [
            "Your request for pre-alpha access has been approved. Your account can open the operator console and take a shift from now.",
            "Start with the briefing: it states what is released, what is not, and how to report faults.",
            discord,
          ]
        : [
            "Your request for pre-alpha access has been approved and your account is on the tester list.",
            "The desk is not open yet. It opens to every tester at the same time, and a notice is sent to this address the moment it does. Until then the briefing sets out what is coming, what is not, and how a shift runs.",
            discord,
          ],
      facts: [
        { label: "Standing", value: "Pre-alpha tester" },
        { label: "Desk", value: doorsOpen ? "Open to testers" : "Closed. Opens to every tester at once." },
        { label: "First step", value: "Read the pre-alpha briefing" },
      ],
      cta: { label: "Read the briefing", href: `${SITE}/prealpha` },
      callout: { title: "Programme confidentiality", body: "No public footage or write-ups until the doors are open. Everything else, raise in the tester channel." },
    }),
  };
}
