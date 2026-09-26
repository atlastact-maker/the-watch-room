// The email an operator gets when their pre-alpha access request has been
// accepted. What it promises depends on the doors: open, the desk is
// theirs now; closed, they are on the list and will hear when it opens.

import { SITE, emailShell } from "./layout";

export function testerAcceptedEmail(opts: { doorsOpen?: boolean } = {}): { subject: string; html: string } {
  const doorsOpen = opts.doorsOpen !== false;
  return {
    subject: "You are on the pre-alpha — The Watch Room",
    html: emailShell({
      programme: "Closed pre-alpha",
      heading: "You are on the pre-alpha",
      stamp: { text: "Accepted", tone: "ok" },
      paragraphs: doorsOpen
        ? [
            "Your account can open the Ops Centre and take a shift now. Start with the briefing: it says what is open, what is not, and how to report what breaks.",
            `Not on the Discord yet? <a href="https://discord.gg/YBN3sbphs3" style="color:#60a5fa;">Join here</a> and we will add you to the tester room.`,
          ]
        : [
            "You are on the tester list. The desk is not open yet: it opens to every tester at once, and you will get an email the moment it does.",
            "Until then the briefing says what is coming, what is not, and how a shift will run.",
            `Not on the Discord yet? <a href="https://discord.gg/YBN3sbphs3" style="color:#60a5fa;">Join here</a> and we will add you to the tester room.`,
          ],
      cta: { label: "Read the briefing", href: `${SITE}/prealpha` },
      note: "Keep it in the room: no public footage or write-ups until the doors are open. Everything else, say on the Discord.",
    }),
  };
}
