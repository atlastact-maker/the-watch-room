// The email an account gets when an admin invites it to the pre-alpha:
// one link, and clicking it while logged in as that account puts them
// on the list, or opens the desk to them if the doors are already open.

import { SITE, emailShell } from "./layout";

export function testerInvitedEmail(token: string, opts: { doorsOpen?: boolean } = {}): { subject: string; html: string } {
  const doorsOpen = opts.doorsOpen !== false;
  const link = `${SITE}/prealpha/invite/${encodeURIComponent(token)}`;
  return {
    subject: "You are invited to the pre-alpha — The Watch Room",
    html: emailShell({
      programme: "Closed pre-alpha",
      heading: "You are invited to the pre-alpha",
      stamp: { text: "Invited", tone: "amber" },
      paragraphs: [
        doorsOpen
          ? "Press the button while logged in to your Watch Room account and the desk opens to you: the live jobs, the whole desk from the 999 call to the debrief, and the tester room on the Discord."
          : "Press the button while logged in to your Watch Room account and you are on the tester list. The desk opens to every tester at once, and you will get an email the moment it does.",
        "The link works for thirty days and only for the account this email was sent to.",
      ],
      cta: { label: "Accept the invitation", href: link },
      note: "Keep it in the room: no public footage or write-ups until the doors are open. Everything else, say on the Discord.",
    }),
  };
}
