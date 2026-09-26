// The email an applicant gets when their advisor application has been
// reviewed and accepted.

import { SITE, emailShell } from "./layout";

export function advisorAcceptedEmail(): { subject: string; html: string } {
  return {
    subject: "Your advisor application — The Watch Room",
    html: emailShell({
      programme: "Development advisor programme",
      heading: "Your application has been reviewed",
      stamp: { text: "Accepted", tone: "ok" },
      paragraphs: [
        "Thank you for offering your experience. You are on the programme.",
        "Within a day or so you will be given the closed Advisor room on our Discord, where the questions get asked and features are reviewed as they are built.",
        `Not on the Discord yet? <a href="https://discord.gg/YBN3sbphs3" style="color:#60a5fa;">Join here</a> so we can add you. If you have not given us your Discord handle, add it in your account settings; it is how we match you to the room.`,
      ],
      cta: { label: "See your standing", href: `${SITE}/standby` },
      note: "A member of the team may be in touch to verify your position.",
    }),
  };
}
