// The Pre-Alpha update of 16 October 2026: dates, access, the opening
// scenarios, the systems in the build, what is asked of testers. Composed
// from the programme's constants, so it says what the briefing says.
// Written to newsletters/ by `npm run newsletter`; paste the HTML into
// the Resend broadcast. The unsubscribe link is Resend's variable.

import fs from "node:fs";
import path from "node:path";
import { COMMUNITY_URL } from "@/lib/email/layout";
import { SERVICE_TINT_EMAIL, card, heading, link, newsletterDocument, para, rows, steps, timeline } from "@/lib/email/newsletter";
import { PREALPHA_ACCESS_STEPS, PREALPHA_ASKS, PREALPHA_FOCUS, PREALPHA_KEY_DATES, PREALPHA_NOT_YET, PREALPHA_OPENING_SCENARIOS, PREALPHA_RELEASE_LABEL } from "@/lib/prealpha-programme";

const ISSUED_AT = Date.parse("2026-10-16T12:00:00+01:00");
const SERVICE_LABEL = { Fire: "Fire and Rescue Service", Ambulance: "Ambulance Service", Police: "Police" } as const;

const reached = PREALPHA_KEY_DATES.filter((d) => d.at !== null && d.at <= ISSUED_AT).map((d) => d.at as number);
const currentAt = reached.length ? Math.max(...reached) : null;

const html = newsletterDocument({
  title: "Closed Pre-Alpha Update: Key Dates, Access and Opening Scenarios",
  preheader: `Application review begins today, and the closed Pre-Alpha opens to accepted testers on ${PREALPHA_RELEASE_LABEL}.`,
  programme: "Pre-Alpha update",
  eyebrow: "Closed Pre-Alpha · Update · 16 October 2026",
  heading: "Closed Pre-Alpha: what happens next",
  stamp: { text: `Opens ${PREALPHA_RELEASE_LABEL}`, tone: "amber" },
  body: [
    para("Thank you to everyone who applied to join the closed Pre-Alpha of The Watch Room. Tester applications closed at the end of Thursday 15 October, and the review of applications begins today."),
    para("This update sets out the key dates, how accepted testers will access the simulator, the scenarios available at release and the systems included in this build.", { mb: 6 }),

    heading("Key dates"),
    timeline(PREALPHA_KEY_DATES.map((d) => ({ when: d.when, body: d.body, state: d.at === null ? "open" : d.at === currentAt ? "current" : currentAt !== null && d.at < currentAt ? "past" : "future" }))),

    heading("Accessing the Pre-Alpha"),
    steps([...PREALPHA_ACCESS_STEPS]),
    para(`If you have not yet joined our Discord server, please ${link(COMMUNITY_URL, "join here")} so that you can be added to the private tester channel.`, { muted: true, mb: 6 }),

    heading("Opening scenarios"),
    para("The Pre-Alpha will open with one scenario for each service, with further scenarios released over the following weeks. Each scenario varies between runs, including who is present at the address, where a fire is seated and how a patient responds, so we recommend completing each one more than once.", { mb: 16 }),
    ...PREALPHA_OPENING_SCENARIOS.map((o) => card({ tint: SERVICE_TINT_EMAIL[o.service], label: SERVICE_LABEL[o.service], title: o.title, body: o.brief, note: { lead: "Feedback requested", text: o.feedback } })),

    heading("Systems in this build"),
    rows(PREALPHA_FOCUS.map((f) => ({ title: f.title, body: f.body }))),

    heading("Tester responsibilities"),
    rows([...PREALPHA_ASKS]),

    heading("Not included in this build"),
    rows([...PREALPHA_NOT_YET]),

    heading("Not part of this round?"),
    para(`The Pre-Alpha has deliberately been kept small, and a wider test will follow. Your account remains registered and ready for the next phase. In the meantime, progress updates continue every Friday, and our ${link(COMMUNITY_URL, "Discord server")} remains the best place to follow development.`, { mb: 6 }),
  ],
  cta: { label: "Read the Pre-Alpha briefing", href: "https://thewtchroom.co.uk/prealpha" },
  signoff: { closing: "Kind regards,", name: "The Watch Room" },
  reason: "You are receiving this email because you opted in to updates and newsletters when you created your account.",
  unsubscribeUrl: "{{{RESEND_UNSUBSCRIBE_URL}}}",
});

const out = path.resolve(process.cwd(), "newsletters/2026-10-16-pre-alpha-update.html");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`wrote ${path.relative(process.cwd(), out)} (${html.length} bytes)`);
