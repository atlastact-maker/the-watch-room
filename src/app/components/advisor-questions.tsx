"use client";

// Advisor questionnaire — the shared field set used by the signup form
// and the Settings advisor card. Renders inputs only (the parent owns
// the <form>); every field name matches AdvisorSchema.

import {
  ADVISOR_INVOLVEMENT,
  ADVISOR_SERVICES,
  ADVISOR_STATUSES,
  ADVISOR_TOPICS,
  type AuthFormState,
} from "@/lib/auth/schemas";

export type AdvisorDefaults = {
  service?: string;
  status?: string;
  background?: string;
  force?: string;
  topics?: string[];
  involvement?: string;
  notes?: string;
  contactOk?: boolean;
  discord?: string;
};

export function AdvisorQuestions({
  defaults = {},
  errors,
}: {
  defaults?: AdvisorDefaults;
  errors?: NonNullable<AuthFormState>["errors"];
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[10px] uppercase tracking-[0.2em] leading-relaxed text-(--color-info)">
        Advisor programme — help keep The Watch Room authentic
      </p>

      {/* 1 · Service */}
      <Q label="Which service are you with?">
        <select
          name="advisorService"
          defaultValue={defaults.service ?? ""}
          className={selectCls}
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
        <Errs msgs={errors?.advisorService} />
      </Q>

      {/* 2 · Status */}
      <Q label="Your status">
        <select
          name="advisorStatus"
          defaultValue={defaults.status ?? ""}
          className={selectCls}
        >
          <option value="" disabled>
            Select…
          </option>
          {ADVISOR_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Errs msgs={errors?.advisorStatus} />
      </Q>

      {/* 3 · Role & background */}
      <Q label="Role & background">
        <input
          name="advisorBackground"
          type="text"
          defaultValue={defaults.background ?? ""}
          placeholder="e.g. Crew Manager · 12 yrs"
          className={inputCls}
        />
        <Errs msgs={errors?.advisorBackground} />
      </Q>

      {/* 4 · Force / trust */}
      <Q label="Force / trust / brigade" optional>
        <input
          name="advisorForce"
          type="text"
          defaultValue={defaults.force ?? ""}
          placeholder="e.g. GMFRS or NWAS"
          className={inputCls}
        />
        <Errs msgs={errors?.advisorForce} />
      </Q>

      {/* 5 · Topics */}
      <Q label="What can you advise on? (pick all that apply)">
        <div className="grid gap-1.5 sm:grid-cols-2">
          {ADVISOR_TOPICS.map((t) => (
            <label
              key={t}
              className="flex cursor-pointer items-start gap-2.5 rounded-sm border border-(--color-border-subtle) bg-(--color-bg)/50 px-2.5 py-2.5 select-none hover:border-(--color-info)/50 sm:items-center sm:py-1.5"
            >
              <input
                type="checkbox"
                name="advisorTopics"
                value={t}
                defaultChecked={defaults.topics?.includes(t) ?? false}
                className="mt-px size-4.5 shrink-0 cursor-pointer accent-(--color-info) sm:mt-0 sm:size-3.5"
              />
              <span className="text-[11px] leading-snug text-(--color-text-muted)">{t}</span>
            </label>
          ))}
        </div>
        <Errs msgs={errors?.advisorTopics} />
      </Q>

      {/* 6 · Involvement */}
      <Q label="How involved would you like to be?">
        <select
          name="advisorInvolvement"
          defaultValue={defaults.involvement ?? ""}
          className={selectCls}
        >
          <option value="" disabled>
            Select…
          </option>
          {ADVISOR_INVOLVEMENT.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Errs msgs={errors?.advisorInvolvement} />
      </Q>

      {/* 7 · Notes */}
      <Q label="Anything in the sim you've already spotted?" optional>
        <textarea
          name="advisorNotes"
          rows={3}
          defaultValue={defaults.notes ?? ""}
          placeholder="Procedures, mobilising, kit, control-room reality — anything worth fixing or checking."
          className={inputCls + " py-2.5 h-auto"}
        />
        <Errs msgs={errors?.advisorNotes} />
      </Q>

      {/* 8 · Contact */}
      <div className="flex flex-col gap-2.5">
        <label className="flex cursor-pointer items-start gap-2.5 py-1 select-none">
          <input
            type="checkbox"
            name="advisorContactOk"
            defaultChecked={defaults.contactOk ?? true}
            className="mt-px size-5 shrink-0 cursor-pointer rounded-[2px] accent-(--color-info) sm:size-4"
          />
          <span className="text-[11px] uppercase tracking-[0.08em] text-(--color-text-dim) sm:tracking-[0.15em]">
            OK to contact me on my account email about development
          </span>
        </label>
        <Q label="Discord handle" optional>
          {/* Keyed on the value so that saving the handle from the
              account section above re-seeds this uncontrolled input
              instead of leaving it holding the old one — without
              resetting any other answer on the form. */}
          <input
            key={defaults.discord ?? ""}
            name="advisorDiscord"
            type="text"
            defaultValue={defaults.discord ?? ""}
            placeholder="e.g. watchroomfan"
            className={inputCls}
          />
          <Errs msgs={errors?.advisorDiscord} />
        </Q>
      </div>
    </div>
  );
}

const inputCls =
  "h-[46px] w-full rounded-sm border border-(--color-border) bg-(--color-bg) px-3.5 font-mono text-base text-(--color-text) outline-none placeholder:text-(--color-text-dim)/60 focus:border-(--color-info) sm:text-sm";
const selectCls =
  "h-[46px] w-full rounded-sm border border-(--color-border) bg-(--color-bg) px-3 font-mono text-base text-(--color-text) outline-none focus:border-(--color-info) sm:text-sm";

function Q({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-[0.12em] text-(--color-text-dim) sm:tracking-[0.25em]">
        {label}
        {optional && <span className="normal-case tracking-normal"> (optional)</span>}
      </span>
      {children}
    </div>
  );
}

function Errs({ msgs }: { msgs?: string[] }) {
  return (
    <>
      {msgs?.map((m) => (
        <p key={m} className="text-xs text-(--color-critical)">
          {m}
        </p>
      ))}
    </>
  );
}
