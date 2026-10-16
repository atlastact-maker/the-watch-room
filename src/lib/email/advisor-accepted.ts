// The email an applicant gets when their advisor application has been
// reviewed and approved.

import { COMMUNITY_URL, SITE, emailLink, emailShell } from "./layout";

export function advisorAcceptedEmail(): { subject: string; html: string } {
  return {
    subject: "Advisor application approved — The Watch Room",
    html: emailShell({
      programme: "Development advisor programme",
      eyebrow: "Advisor programme · Application",
      heading: "Your application has been approved",
      stamp: { text: "Accepted", tone: "ok" },
      preheader: "You are on the development advisor programme.",
      paragraphs: [
        "Thank you for offering your service experience. You are on the development advisor programme.",
        "Within a day or so you will be granted the closed advisor channel on the Discord, where questions are put to the programme and features are reviewed as they are built.",
        `Not on the Discord yet? ${emailLink(COMMUNITY_URL, "Join here")} so you can be added. If no Discord handle is held on your account, add one in Settings: it is how you are matched to the channel.`,
      ],
      facts: [
        { label: "Standing", value: "Development advisor" },
        { label: "Next", value: "Access to the closed advisor channel on Discord" },
        { label: "Needed", value: "Your Discord handle, in account settings" },
      ],
      cta: { label: "View your standing", href: `${SITE}/standby` },
      note: "A member of the team may be in touch to verify your position.",
    }),
  };
}
