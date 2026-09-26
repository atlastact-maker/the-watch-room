"use client";

import { useActionState } from "react";
import { applyForPreAlpha, type PreAlphaFormState } from "@/app/actions/prealpha";
import type { TesterApplication } from "@/lib/prealpha";

// The application, as a form. Renders inside the pre-alpha page for a
// signed-in account that has not applied, or is correcting a pending
// application.

const HOURS = ["An hour a week", "A few hours a week", "Most evenings", "Weekends only", "As and when"] as const;

const inputCls =
  "w-full rounded-sm border border-(--color-border) bg-(--color-surface) px-3 py-2.5 text-sm text-(--color-text) placeholder:text-(--color-text-dim)/60 focus:border-(--color-amber) focus:outline-none";
const labelCls = "text-[11px] uppercase tracking-[0.15em] text-(--color-text-dim)";

export function PreAlphaForm({ existing }: { existing: TesterApplication | null }) {
  const [state, action, pending] = useActionState<PreAlphaFormState, FormData>(applyForPreAlpha, undefined);
  const errors = state && !state.ok ? state.errors : undefined;

  if (state?.ok) {
    return (
      <div className="rounded-sm border border-(--color-ok)/50 bg-(--color-ok)/10 px-4 py-4">
        <p className="font-mono text-[11px] uppercase tracking-widest text-(--color-ok)">✓ Application received</p>
        <p className="mt-2 text-sm leading-relaxed text-(--color-text-muted)">
          Thank you. Applications are reviewed by hand, so there is a wait. This page and your email will tell you when yours has been looked at.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Discord handle" hint="How we add you to the tester room. Optional, but the room is where the builds are announced." errors={errors?.discord}>
        <input name="discord" type="text" defaultValue={existing?.discord ?? ""} placeholder="yourname" className={inputCls} maxLength={64} />
      </Field>
      <Field label="What you will test on" hint="Device, browser and screen — a laptop on Chrome, a desktop with two monitors, and so on." errors={errors?.platform}>
        <input name="platform" type="text" defaultValue={existing?.platform ?? ""} placeholder="Windows laptop · Chrome · 15-inch screen" className={inputCls} maxLength={160} required />
      </Field>
      <Field label="Your background" hint="Served in fire, ambulance, police or a control room? Play dispatch or management sims? Neither is required — say what you bring." errors={errors?.background}>
        <textarea name="background" rows={3} defaultValue={existing?.background ?? ""} className={inputCls} maxLength={600} />
      </Field>
      <Field label="Why the pre-alpha, and what will you go looking for?" errors={errors?.why}>
        <textarea name="why" rows={4} defaultValue={existing?.why ?? ""} className={inputCls} maxLength={1200} required />
      </Field>
      <Field label="Time you can give" errors={errors?.hours}>
        <select name="hours" defaultValue={existing?.hours ?? ""} className={inputCls} required>
          <option value="" disabled>Pick one…</option>
          {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
      </Field>
      <label className="flex cursor-pointer items-start gap-2.5 py-1 select-none">
        <input type="checkbox" name="agreed" defaultChecked={existing?.agreed ?? false} className="mt-px size-5 shrink-0 cursor-pointer rounded-[2px] accent-(--color-amber) sm:size-4" />
        <span className="text-[12px] leading-relaxed text-(--color-text-muted)">
          I will keep the pre-alpha in the room: bugs through the in-game form, talk on the Discord, and no public footage, screenshots or write-ups until the team says the doors are open.
        </span>
      </label>
      {errors?.agreed && <p className="text-xs text-(--color-critical)">{errors.agreed.join(" ")}</p>}
      {state && !state.ok && state.message && <p className="text-sm text-(--color-critical)">{state.message}</p>}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 items-center justify-center rounded-sm bg-(--color-amber) px-6 py-3 font-mono text-sm font-medium uppercase tracking-[0.15em] text-black transition-colors hover:bg-amber-400 disabled:opacity-60"
      >
        {pending ? "Filing…" : existing ? "Update application" : "Apply for the pre-alpha"}
      </button>
    </form>
  );
}

function Field({ label, hint, errors, children }: { label: string; hint?: string; errors?: string[]; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className={labelCls}>{label}</span>
      {children}
      {hint && <span className="text-[11px] leading-relaxed text-(--color-text-dim)">{hint}</span>}
      {errors && errors.length > 0 && <span className="text-xs text-(--color-critical)">{errors.join(" ")}</span>}
    </div>
  );
}
