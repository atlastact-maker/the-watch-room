"use client";

import { useActionState, useState } from "react";
import { signup } from "@/lib/auth/actions";
import { ADVISOR_SERVICES } from "@/lib/auth/schemas";

export function SignupForm({ defaultAdvisorOpen = false }: { defaultAdvisorOpen?: boolean }) {
  const [state, action, pending] = useActionState(signup, undefined);
  const [advisorOpen, setAdvisorOpen] = useState(defaultAdvisorOpen);

  // Email confirmation enabled server-side — the account exists but needs
  // the inbox link before login works.
  if (state?.needsConfirmation) {
    return (
      <div className="rounded-sm border border-(--color-ok)/50 bg-(--color-ok)/10 px-4 py-4">
        <p className="font-mono text-[11px] uppercase tracking-widest text-(--color-ok)">
          ✓ Account created — confirm your email
        </p>
        <p className="mt-2 text-sm leading-relaxed text-(--color-text-muted)">
          We&apos;ve sent a confirmation link to your inbox. Click it, then log
          in and take the chair. Nothing arrived after a couple of minutes?
          Check spam.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field
        label="Callsign (username)"
        name="callsign"
        type="text"
        autoComplete="username"
        placeholder="OSCAR-21"
        hint="Shown in the ops room. 2–24 characters."
        errors={state?.errors?.callsign}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        errors={state?.errors?.email}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="Min 8 chars · letter + number"
        errors={state?.errors?.password}
      />

      <div className="mt-0.5 flex flex-col gap-2.5">
        <label className="flex cursor-pointer items-center gap-2.5 select-none">
          <input
            type="checkbox"
            name="acceptTerms"
            className="size-4 shrink-0 cursor-pointer rounded-[2px] accent-(--color-amber)"
          />
          <span className="text-[11px] uppercase tracking-[0.15em] text-(--color-text-muted)">
            I accept the{" "}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-(--color-amber) underline underline-offset-2 hover:text-amber-400"
            >
              terms &amp; conditions
            </a>
          </span>
        </label>
        {state?.errors?.acceptTerms?.map((msg) => (
          <p key={msg} className="text-xs normal-case tracking-normal text-(--color-critical)">
            {msg}
          </p>
        ))}
        <label className="flex cursor-pointer items-center gap-2.5 select-none">
          <input
            type="checkbox"
            name="newsletter"
            className="size-4 shrink-0 cursor-pointer rounded-[2px] accent-(--color-amber)"
          />
          <span className="text-[11px] uppercase tracking-[0.15em] text-(--color-text-dim)">
            Send me updates &amp; newsletters
          </span>
        </label>

        <label className="flex cursor-pointer items-center gap-2.5 select-none">
          <input
            type="checkbox"
            name="advisor"
            checked={advisorOpen}
            onChange={(e) => setAdvisorOpen(e.target.checked)}
            className="size-4 shrink-0 cursor-pointer rounded-[2px] accent-(--color-info)"
          />
          <span className="text-[11px] uppercase tracking-[0.15em] text-(--color-text-dim)">
            Part of the emergency services —{" "}
            <span className="text-(--color-info)">register me as a development advisor</span>
          </span>
        </label>
      </div>

      {advisorOpen && (
        <div className="flex flex-col gap-4 rounded-sm border border-(--color-info)/40 bg-(--color-info)/5 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] leading-relaxed text-(--color-info)">
            Advisor programme — help keep The Watch Room authentic
          </p>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="advisorService"
              className="text-[11px] uppercase tracking-[0.25em] text-(--color-text-dim)"
            >
              Service
            </label>
            <select
              id="advisorService"
              name="advisorService"
              defaultValue=""
              className="h-[46px] w-full rounded-sm border border-(--color-border) bg-(--color-bg) px-3 font-mono text-sm text-(--color-text) outline-none focus:border-(--color-info)"
            >
              <option value="" disabled>
                Select your service…
              </option>
              {ADVISOR_SERVICES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {state?.errors?.advisorService?.map((msg) => (
              <p key={msg} className="text-xs text-(--color-critical)">
                {msg}
              </p>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="advisorBackground"
              className="text-[11px] uppercase tracking-[0.25em] text-(--color-text-dim)"
            >
              Role &amp; background
            </label>
            <input
              id="advisorBackground"
              name="advisorBackground"
              type="text"
              placeholder="e.g. Crew Manager · 12 years · GMFRS"
              className="h-[46px] w-full rounded-sm border border-(--color-border) bg-(--color-bg) px-3.5 font-mono text-sm text-(--color-text) outline-none placeholder:text-(--color-text-dim)/60 focus:border-(--color-info)"
            />
            {state?.errors?.advisorBackground?.map((msg) => (
              <p key={msg} className="text-xs text-(--color-critical)">
                {msg}
              </p>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="advisorNotes"
              className="text-[11px] uppercase tracking-[0.25em] text-(--color-text-dim)"
            >
              How can you help? <span className="normal-case tracking-normal">(optional)</span>
            </label>
            <textarea
              id="advisorNotes"
              name="advisorNotes"
              rows={3}
              placeholder="Procedures, mobilising, kit, control room reality — whatever you can sanity-check."
              className="w-full rounded-sm border border-(--color-border) bg-(--color-bg) px-3.5 py-2.5 font-mono text-sm text-(--color-text) outline-none placeholder:text-(--color-text-dim)/60 focus:border-(--color-info)"
            />
            {state?.errors?.advisorNotes?.map((msg) => (
              <p key={msg} className="text-xs text-(--color-critical)">
                {msg}
              </p>
            ))}
          </div>
        </div>
      )}

      {state?.errors?.form?.map((msg) => (
        <p key={msg} className="text-sm text-(--color-critical)">
          {msg}
        </p>
      ))}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex h-12 w-full items-center justify-center rounded-sm bg-(--color-amber) font-mono text-sm font-medium uppercase tracking-[0.25em] text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Registering…" : "▸ Begin Shift"}
      </button>

      <p className="text-center font-mono text-[9px] uppercase tracking-widest leading-relaxed text-(--color-text-dim)/70">
        Your email is used for login — and updates only if you opted in.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type,
  autoComplete,
  placeholder,
  hint,
  errors,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete: string;
  placeholder?: string;
  hint?: string;
  errors?: string[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="text-[11px] uppercase tracking-[0.25em] text-(--color-text-dim)"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
        className="h-[46px] w-full rounded-sm border border-(--color-border) bg-(--color-bg) px-3.5 font-mono text-sm text-(--color-text) outline-none transition-colors placeholder:text-(--color-text-dim)/60 focus:border-(--color-amber)"
        style={{ caretColor: "var(--color-amber)" }}
      />
      {hint && !errors?.length && (
        <p className="text-[11px] text-(--color-text-dim)">{hint}</p>
      )}
      {errors?.map((msg) => (
        <p key={msg} className="text-xs text-(--color-critical)">
          {msg}
        </p>
      ))}
    </div>
  );
}
