import Link from "next/link";

// Terms & conditions — public page, linked from the signup consent box.
// Written in plain English for a hobby simulation game; the styling
// matches the operator-intake terminal so it reads as a system document.

export const metadata = {
  title: "Terms & Conditions — The Watch Room",
};

export default function TermsPage() {
  return (
    <div className="relative z-10 flex flex-1 justify-center p-6 font-mono">
      <div className="w-full max-w-[720px]">
        <div className="rounded-sm border border-(--color-border) bg-(--color-surface) shadow-2xl shadow-black/70">
          {/* Header bar */}
          <div className="flex items-center justify-between border-b border-(--color-border-subtle) bg-(--color-surface-raised) px-4 py-3">
            <div className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.2em] text-(--color-amber)">
              <span className="dot-live inline-block size-1.5 rounded-full bg-(--color-amber)" />
              NWRC-04 · Terms &amp; Conditions
            </div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-(--color-text-dim)">
              Document · v1.0
            </div>
          </div>

          <div className="flex flex-col gap-6 px-6 py-8 font-sans text-sm leading-relaxed text-(--color-text-muted) sm:px-10">
            <div className="font-mono">
              <div className="text-[15px] uppercase tracking-[0.12em] text-(--color-amber)">
                &gt; Terms of service
              </div>
              <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-(--color-text-dim)">
                Last updated · 22 Aug 2026
              </p>
            </div>

            <Section n="01" title="What The Watch Room is">
              The Watch Room is a fictional emergency-services incident-manager
              simulation game. It is a hobby project. It is not affiliated
              with, endorsed by, or connected to any real emergency service,
              including Greater Manchester Fire &amp; Rescue Service, North
              West Ambulance Service, Greater Manchester Police, or any UK
              control room. Real station names, locations, appliance types and
              procedures appear only to make the simulation feel authentic.
            </Section>

            <Section n="02" title="Not for real emergencies">
              Nothing in this game is operational guidance, training material,
              or advice for real incidents. In a real emergency, call 999.
            </Section>

            <Section n="03" title="Your account">
              You need an account to save progress. Keep your login details to
              yourself and give us a working email address. You are
              responsible for what happens under your account. We may suspend
              or delete accounts that abuse the service or other players.
            </Section>

            <Section n="04" title="Acceptable use">
              Don&apos;t attempt to break, overload, reverse-engineer, or gain
              unauthorised access to the service or other people&apos;s
              accounts, and don&apos;t use the service for anything unlawful.
            </Section>

            <Section n="05" title="Your data">
              We store the email address, callsign, and newsletter preference
              you give us at signup, plus your game progress, so the service
              can work. We only send you updates and newsletters if you ticked
              the box saying so, and you can opt out at any time. We don&apos;t
              sell your data.
            </Section>

            <Section n="06" title="No warranty">
              The Watch Room is provided as-is, free of charge, while in
              development. It may go offline, change, break, or lose saved
              progress at any time, without notice. To the fullest extent the
              law allows, we accept no liability for any loss arising from
              your use of it.
            </Section>

            <Section n="07" title="Changes to these terms">
              We may update these terms as the game develops. If you keep
              using the service after an update, that counts as accepting the
              new terms. The &quot;last updated&quot; date above always tells
              you the current version.
            </Section>

            <Section n="08" title="Contact">
              Questions about these terms or your data: [contact email — to
              be added].
            </Section>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-(--color-text-dim)">
          <Link href="/" className="hover:text-(--color-text)">
            ← The Watch Room
          </Link>
          <Link href="/signup" className="text-(--color-amber) hover:text-amber-400">
            Back to registration →
          </Link>
        </div>
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
      <h2 className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.25em] text-(--color-amber-dim)">
        {n} · {title}
      </h2>
      <p>{children}</p>
    </section>
  );
}
