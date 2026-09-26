// The email every tester gets when the pre-alpha doors open: the desk is
// theirs now, and where to start.

import { SITE, emailShell } from "./layout";

export function doorsOpenEmail(): { subject: string; html: string } {
  return {
    subject: "The doors are open — The Watch Room",
    html: emailShell({
      programme: "Closed pre-alpha",
      heading: "The doors are open",
      stamp: { text: "Open", tone: "ok" },
      paragraphs: [
        "The pre-alpha desk is open to you from now. Log in, read the briefing once, then open the Ops Centre and take a shift.",
        "Report what breaks from Help on the desk, and say what you expected instead. That is the whole job.",
        `The tester room is on the <a href="https://discord.gg/YBN3sbphs3" style="color:#60a5fa;">Discord</a>; builds and fixes are announced there.`,
      ],
      cta: { label: "Open the Ops Centre", href: `${SITE}/menu` },
      note: "Keep it in the room: no public footage or write-ups until we say the doors are open to everyone.",
    }),
  };
}
