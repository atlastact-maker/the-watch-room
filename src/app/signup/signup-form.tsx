"use client";

import { useActionState } from "react";
import { signup } from "@/lib/auth/actions";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);

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
            I accept the terms &amp; conditions
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
      </div>

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
