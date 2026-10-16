"use client";

// Advisor questionnaire: the shared field set used by the registration
// form and the Settings advisor panel. Renders inputs only (the parent
// owns the <form>); every field name matches AdvisorSchema.

import { ADVISOR_INVOLVEMENT, ADVISOR_SERVICES, ADVISOR_STATUSES, ADVISOR_TOPICS, type AuthFormState } from "@/lib/auth/schemas";
import styles from "@/app/menu/watch-menu.module.css";

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

export function AdvisorQuestions({ defaults = {}, errors }: { defaults?: AdvisorDefaults; errors?: NonNullable<AuthFormState>["errors"] }) {
  return (
    <div className={styles.questions}>
      <p className={styles.eyebrow}>Advisor programme · authenticity review</p>
      <p>For serving and former emergency services personnel. The answers tell the team which parts of the simulation to put in front of you.</p>

      <label>
        <span>Service</span>
        <select name="advisorService" defaultValue={defaults.service ?? ""}>
          <option value="" disabled>Select a service</option>
          {ADVISOR_SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <Errs msgs={errors?.advisorService} />
      </label>

      <label>
        <span>Status</span>
        <select name="advisorStatus" defaultValue={defaults.status ?? ""}>
          <option value="" disabled>Select</option>
          {ADVISOR_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <Errs msgs={errors?.advisorStatus} />
      </label>

      <label>
        <span>Role and background</span>
        <input name="advisorBackground" type="text" defaultValue={defaults.background ?? ""} placeholder="e.g. Crew Manager · 12 years" />
        <Errs msgs={errors?.advisorBackground} />
      </label>

      <label>
        <span>Force, trust or brigade <em>(optional)</em></span>
        <input name="advisorForce" type="text" defaultValue={defaults.force ?? ""} placeholder="e.g. GMFRS or NWAS" />
        <Errs msgs={errors?.advisorForce} />
      </label>

      <div>
        <span className={styles.qLabel}>Areas you can advise on <em>(select all that apply)</em></span>
        <div className={styles.checks}>
          {ADVISOR_TOPICS.map((t) => (
            <label key={t}>
              <input type="checkbox" name="advisorTopics" value={t} defaultChecked={defaults.topics?.includes(t) ?? false} />
              <span>{t}</span>
            </label>
          ))}
        </div>
        <Errs msgs={errors?.advisorTopics} />
      </div>

      <label>
        <span>Level of involvement</span>
        <select name="advisorInvolvement" defaultValue={defaults.involvement ?? ""}>
          <option value="" disabled>Select</option>
          {ADVISOR_INVOLVEMENT.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <Errs msgs={errors?.advisorInvolvement} />
      </label>

      <label>
        <span>Observations on the simulation so far <em>(optional)</em></span>
        <textarea name="advisorNotes" rows={3} defaultValue={defaults.notes ?? ""} placeholder="Procedures, mobilising, equipment, control-room practice: anything worth correcting or checking." />
        <Errs msgs={errors?.advisorNotes} />
      </label>

      <div className={`${styles.checks} ${styles.checksStack}`} style={{ marginTop: 0 }}>
        <label>
          <input type="checkbox" name="advisorContactOk" defaultChecked={defaults.contactOk ?? true} />
          <span>The team may contact this account&apos;s email address about development.</span>
        </label>
      </div>

      <label>
        <span>Discord handle <em>(optional)</em></span>
        {/* Keyed on the value so that saving the handle from the account
            panel re-seeds this uncontrolled input instead of leaving it
            holding the old one, without resetting any other answer. */}
        <input key={defaults.discord ?? ""} name="advisorDiscord" type="text" defaultValue={defaults.discord ?? ""} placeholder="e.g. watchroom" />
        <Errs msgs={errors?.advisorDiscord} />
      </label>
    </div>
  );
}

function Errs({ msgs }: { msgs?: string[] }) {
  return <>{msgs?.map((m) => <p key={m} className={styles.warning}>{m}</p>)}</>;
}
