// The email an applicant gets when their advisor application has been
// reviewed and not taken forward.
//
// The tone matters more here than anywhere else on the site. These are
// people who offered their own service experience for nothing; a "no"
// should read as a decision about the programme's size and shape, not a
// judgement on them, and it should leave the door open.

import { SITE, emailShell } from "./layout";

export function advisorDeclinedEmail(): { subject: string; html: string } {
  return {
    subject: "Your advisor application — The Watch Room",
    html: emailShell({
      programme: "Development advisor programme",
      heading: "Your application has been reviewed",
      paragraphs: [
        "Thank you for offering to advise on The Watch Room. We are not taking your application forward onto the programme at this stage.",
        "That is a decision about how many advisors the programme can work with properly while it is small, and which areas it needs covered right now. It is not a judgement on your experience. We keep applications on file, and the picture changes as development moves on.",
        "Your account stays exactly as it is, and the pre-alpha is open to you like anyone else.",
      ],
      cta: { label: "Read the pre-alpha briefing", href: `${SITE}/prealpha` },
      note: "Thank you again for the offer. It is appreciated.",
    }),
  };
}
