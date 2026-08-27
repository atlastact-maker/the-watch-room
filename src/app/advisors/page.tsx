import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  ADVISOR_INVOLVEMENT,
  ADVISOR_SERVICES,
  ADVISOR_STATUSES,
  ADVISOR_TOPICS,
} from "@/lib/auth/schemas";
import type { AdvisorDefaults } from "@/app/components/advisor-questions";
import { AdvisorApplication } from "./advisor-application";

// Advisor programme — the public recruitment + application page for
// serving and former emergency-services staff. Public (see PUBLIC_PATHS in
// lib/supabase/proxy): logged-out visitors get the pitch and a route into
// signup, signed-in operators get the questionnaire itself.

export const metadata = {
  title: "Advisor Programme — The Watch Room",
  description:
    "Fire, Ambulance, Police and Control-room staff — serving, retired or previously served — help keep The Watch Room's procedures, mobilising and kit honest.",
};

// One line of plain English per commitment level, so nobody has to guess
// what they're signing up to. Keyed off the schema so a new level here is
// a type error rather than a silently missing description.
const INVOLVEMENT_NOTES: Record<(typeof ADVISOR_INVOLVEMENT)[number], string> = {
  "Occasional questions":
    "We email you when something specific comes up. Answer when you can, ignore when you can't.",
  "Review new features":
    "You see a feature before release and tell us where it's wrong.",
  "Regular playtesting & feedback":
    "You play shifts as they're built and report back on what doesn't ring true.",
  "Whatever helps": "You'd rather we just ask, and you'll take it as it comes.",
};

type AdvisorState = {
  signedIn: boolean;
  registered: boolean;
  defaults: AdvisorDefaults;
};

// Advisor answers live in user_metadata (they're written there at signup,
// before the advisors row exists) so that's what prefills the form.
async function loadAdvisorState(): Promise<AdvisorState> {
  const empty: AdvisorState = {
    signedIn: false,
    registered: false,
    defaults: { contactOk: true },
  };
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return empty;

    const meta = user.user_metadata as {
      advisor?: boolean;
      advisor_service?: string;
      advisor_status?: string;
      advisor_background?: string;
      advisor_force?: string;
      advisor_topics?: string[];
      advisor_involvement?: string;
      advisor_notes?: string;
      advisor_contact_ok?: boolean;
      advisor_discord?: string;
    } | null;

    return {
      signedIn: true,
      registered: !!meta?.advisor,
      defaults: {
        service: meta?.advisor_service ?? "",
        status: meta?.advisor_status ?? "",
        background: meta?.advisor_background ?? "",
        force: meta?.advisor_force ?? "",
        topics: meta?.advisor_topics ?? [],
        involvement: meta?.advisor_involvement ?? "",
        notes: meta?.advisor_notes ?? "",
        contactOk: meta?.advisor_contact_ok ?? true,
        discord: meta?.advisor_discord ?? "",
      },
    };
  } catch {
    // No Supabase env configured yet — still show the programme.
    return empty;
  }
}

export default async function AdvisorsPage() {
  const { signedIn, registered, defaults } = await loadAdvisorState();

  return (
    <div className="relative z-10 flex flex-1 justify-center p-6 font-mono">
      <div className="w-full max-w-[820px]">
        <div className="rounded-sm border border-(--color-border) bg-(--color-surface) shadow-2xl shadow-black/70">
          {/* Header bar */}
          <div className="flex items-center justify-between border-b border-(--color-border-subtle) bg-(--color-surface-raised) px-4 py-3">
            <div className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.2em] text-(--color-info)">
              <span className="dot-live inline-block size-1.5 rounded-full bg-(--color-info)" />
              NWRC-04 · Advisor Programme
            </div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-(--color-text-dim)">
              Intake · Open
            </div>
          </div>

          <div className="flex flex-col gap-8 px-6 py-8 sm:px-10">
            {/* Lead */}
            <header className="flex flex-col gap-4">
              <h1 className="text-[15px] uppercase tracking-[0.12em] text-(--color-amber)">
                &gt; Specialist advisor intake
              </h1>
              <p className="font-sans text-sm leading-relaxed text-(--color-text-muted)">
                The Watch Room puts one operator in command of Fire, Ambulance
                and Police from a single seat. Everything in it — the
                mobilising order, how an appliance is crewed, what gets said on
                the radio, what a control operator is actually doing at
                three in the morning — is our best guess until somebody who has
                done the job tells us otherwise.
              </p>
              <p className="font-sans text-sm leading-relaxed text-(--color-text-muted)">
                That&apos;s the whole programme. You tell us where it&apos;s
                wrong. We fix it.
              </p>

              <div className="grid gap-2 sm:grid-cols-3">
                <Stat label="Applications" value="Open" tone="ok" />
                <Stat label="Commitment" value="Your call" />
                <Stat label="Cost" value="None" />
              </div>
            </header>

            <Rule />

            <Section n="01" title="Who this is for">
              <p>
                Anyone who works, or has worked, on the operational side of a UK
                emergency service — {ADVISOR_STATUSES.join(", ").toLowerCase()}.
                Control-room and 999 staff especially: that seat is the hardest
                one to get right from the outside, and it&apos;s the seat the
                whole game is played from.
              </p>
              <ChipRow items={[...ADVISOR_SERVICES]} />
              <p className="mt-3">
                You don&apos;t need to be a gamer, and you don&apos;t need to
                have played it yet. Being able to say &ldquo;no, that&apos;s not
                how a make-pumps goes&rdquo; is the entire qualification.
              </p>
            </Section>

            <Section n="02" title="What you'd actually be doing">
              <p>
                You pick the level when you apply, and you can change it — or
                stop — whenever you like.
              </p>
              <dl className="mt-3 flex flex-col gap-2">
                {ADVISOR_INVOLVEMENT.map((level) => (
                  <div
                    key={level}
                    className="rounded-sm border border-(--color-border-subtle) bg-(--color-bg)/50 px-3.5 py-3"
                  >
                    <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-(--color-info)">
                      {level}
                    </dt>
                    <dd className="mt-1 text-[13px] leading-relaxed text-(--color-text-muted)">
                      {INVOLVEMENT_NOTES[level]}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3">
                It&apos;s unpaid and entirely voluntary — this is a hobby
                project, not a business.
              </p>
            </Section>

            <Section n="03" title="The areas we're short on">
              <p>
                Pick as many as apply when you apply. Gaps here are where the
                simulation is currently weakest.
              </p>
              <ChipRow items={[...ADVISOR_TOPICS]} />
            </Section>

            {/* The trust section — the reason a serving officer can say yes. */}
            <section className="rounded-sm border border-(--color-amber)/30 bg-(--color-amber)/[0.04] px-5 py-5">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-(--color-amber)">
                04 · What we will never ask you for
              </h2>
              <ul className="mt-3 flex flex-col gap-2 font-sans text-[13px] leading-relaxed text-(--color-text-muted)">
                {[
                  "Operational documents, SOPs, PDAs, mobilising data, or anything else belonging to your service.",
                  "Anything protectively marked, restricted, or covered by a confidentiality or social-media policy.",
                  "Details of real incidents, real casualties, or real colleagues.",
                  "Your real name. Advisors are recorded under a callsign — a name is never required, at signup or after.",
                ].map((line) => (
                  <li key={line} className="flex gap-2.5">
                    <span aria-hidden className="mt-[2px] shrink-0 font-mono text-(--color-critical)">
                      ✕
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 font-sans text-[13px] leading-relaxed text-(--color-text-muted)">
                What we want is the shape of the job as you know it — the order
                things happen in, the words used, what a decision actually feels
                like on the day. Nothing you couldn&apos;t say in a pub. If a
                question ever strays past that, say so and we&apos;ll drop it.
              </p>
            </section>

            <Section n="05" title="What you get back">
              <ul className="mt-1 flex flex-col gap-2">
                {[
                  "A direct line to the person building it, and features you asked for turning up in the game.",
                  "Early sight of new features before they ship.",
                  "A credit in the game under your callsign — or none at all, if you'd rather stay quiet about it.",
                ].map((line) => (
                  <li key={line} className="flex gap-2.5">
                    <span aria-hidden className="mt-[2px] shrink-0 font-mono text-(--color-ok)">
                      ✓
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section n="06" title="What we store, and how to withdraw">
              <p>
                Your answers below, tied to your account: service, status, role,
                force or trust if you give one, the areas you can advise on,
                your preferred level of involvement, any notes, and a Discord
                handle if you want to be reachable there. They&apos;re visible
                to you and to the developer, and to nobody else — we don&apos;t
                sell or share them. You can edit or clear the lot from{" "}
                <Link
                  href="/settings"
                  className="text-(--color-amber) underline underline-offset-2 hover:text-amber-400"
                >
                  Settings
                </Link>{" "}
                at any time, or email{" "}
                <a
                  href="mailto:atlastact@gmail.com"
                  className="text-(--color-amber) underline underline-offset-2 hover:text-amber-400"
                >
                  atlastact@gmail.com
                </a>{" "}
                and we&apos;ll delete them. See the{" "}
                <Link
                  href="/terms"
                  className="text-(--color-amber) underline underline-offset-2 hover:text-amber-400"
                >
                  terms
                </Link>{" "}
                for the rest.
              </p>
            </Section>

            <Rule />

            {/* Application */}
            <section id="apply" className="scroll-mt-6">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-[15px] uppercase tracking-[0.12em] text-(--color-amber)">
                  &gt; Application
                </h2>
                {registered && (
                  <span className="rounded-sm border border-(--color-info)/50 bg-(--color-info)/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-(--color-info)">
                    Registered
                  </span>
                )}
              </div>
              <p className="mt-2 font-sans text-sm leading-relaxed text-(--color-text-muted)">
                {registered
                  ? "You're already on the programme — thank you. Your answers are below if anything has changed."
                  : "Eight questions, about two minutes. Your force, notes and Discord handle are optional; the rest we need."}
              </p>

              <div className="mt-5">
                {signedIn ? (
                  <AdvisorApplication defaults={defaults} registered={registered} />
                ) : (
                  <SignedOutApply />
                )}
              </div>
            </section>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-(--color-text-dim)">
          <Link href="/" className="hover:text-(--color-text)">
            ← The Watch Room
          </Link>
          <Link href="/terms" className="hover:text-(--color-text)">
            Terms →
          </Link>
        </div>
      </div>
    </div>
  );
}

// Logged-out state — the questionnaire is tied to an account so it can be
// edited or withdrawn later, so route into the signup form (which carries
// the same questions inline via ?advisor=1) rather than duplicating it.
function SignedOutApply() {
  return (
    <div className="rounded-sm border border-(--color-info)/40 bg-(--color-info)/[0.04] px-5 py-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-(--color-info)">
        Operator account required
      </p>
      <p className="mt-2.5 font-sans text-[13px] leading-relaxed text-(--color-text-muted)">
        Applications are attached to an account so you can update or withdraw
        yours later, and so we can reach you without holding a separate list.
        It&apos;s free, and the advisor questions are built into the signup
        form.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/signup?advisor=1"
          className="inline-flex h-12 items-center justify-center rounded-sm bg-(--color-amber) px-6 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-black transition-colors hover:bg-amber-400"
        >
          Create account &amp; apply
        </Link>
        <Link
          href="/login"
          className="inline-flex h-12 items-center justify-center rounded-sm border border-(--color-border) px-6 font-mono text-[11px] uppercase tracking-[0.2em] text-(--color-text) transition-colors hover:border-(--color-amber-dim) hover:text-(--color-amber)"
        >
          I already have one
        </Link>
      </div>

      <div className="mt-6 border-t border-(--color-border-subtle) pt-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-(--color-text-dim)">
          What we&apos;ll ask
        </p>
        <ol className="mt-3 grid gap-1.5 font-sans text-[13px] leading-relaxed text-(--color-text-muted) sm:grid-cols-2">
          {[
            "Which service you're with",
            "Serving, retired, or previously served",
            "Your role and how long you've done it",
            "Force / trust / brigade (optional)",
            "What you can advise on",
            "How involved you'd like to be",
            "Anything you've already spotted (optional)",
            "Whether we can email you, and Discord (optional)",
          ].map((q, i) => (
            <li key={q} className="flex gap-2.5">
              <span aria-hidden className="shrink-0 font-mono text-[11px] text-(--color-text-dim)">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{q}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[0.25em] text-(--color-amber-dim)">
        {n} · {title}
      </h2>
      <div className="font-sans text-sm leading-relaxed text-(--color-text-muted)">
        {children}
      </div>
    </section>
  );
}

function ChipRow({ items }: { items: string[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-sm border border-(--color-border) bg-(--color-bg)/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-(--color-text-dim)"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok";
}) {
  return (
    <div className="rounded-sm border border-(--color-border-subtle) bg-(--color-bg)/50 px-3.5 py-2.5">
      <div className="text-[9px] uppercase tracking-[0.25em] text-(--color-text-dim)">
        {label}
      </div>
      <div
        className={
          "mt-1 text-[13px] uppercase tracking-[0.12em] " +
          (tone === "ok" ? "text-(--color-ok)" : "text-(--color-text)")
        }
      >
        {value}
      </div>
    </div>
  );
}

function Rule() {
  return <div className="h-px bg-(--color-border-subtle)" />;
}
