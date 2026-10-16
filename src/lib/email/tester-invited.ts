// The email an account gets when an admin invites it to the pre-alpha:
// one link, and opening it while signed in as that account puts them
// on the list, or opens the desk to them if the doors are already open.

import { SITE, emailShell } from "./layout";

export function testerInvitedEmail(token: string, opts: { doorsOpen?: boolean } = {}): { subject: string; html: string } {
  const doorsOpen = opts.doorsOpen !== false;
  const link = `${SITE}/prealpha/invite/${encodeURIComponent(token)}`;
  return {
    subject: "Invitation to the closed pre-alpha — The Watch Room",
    html: emailShell({
      programme: "Closed pre-alpha",
      eyebrow: "Closed pre-alpha · Invitation",
      heading: "You are invited to the pre-alpha",
      stamp: { text: "Invited", tone: "amber" },
      preheader: doorsOpen
        ? "Accept while signed in and the operator console opens to your account."
        : "Accept while signed in and your account joins the tester list.",
      paragraphs: [
        "An administrator has invited this account to the closed pre-alpha of The Watch Room, the emergency services incident management simulator.",
        doorsOpen
          ? "Accept while signed in to this account and the operator console opens to you at once: live incidents, the whole desk from the 999 call to the debrief, and the tester channel on Discord."
          : "Accept while signed in to this account and it joins the tester list. The console opens to every tester at the same time, and a notice is sent to this address the moment it does.",
      ],
      facts: [
        { label: "Valid for", value: "30 days from the date of this message" },
        { label: "Issued to", value: "This account only. The link does not work for any other." },
        { label: "Desk", value: doorsOpen ? "Open to testers" : "Closed. Opens to every tester at once." },
      ],
      cta: { label: "Accept the invitation", href: link },
      showLink: true,
      callout: { title: "Programme confidentiality", body: "No public footage or write-ups until the doors are open. Everything else, raise in the tester channel." },
    }),
  };
}
