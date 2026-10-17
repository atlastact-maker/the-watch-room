"use client";

// Operator settings: callsign, Discord handle, console audio, the
// advisor programme, and the service-record reset. Callsign and Discord
// write to Supabase user metadata (the same fields signup collects);
// audio and the record are device-local.

import Link from "next/link";
import { useActionState, useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";
import { isMuted, setMuted, unlockAudio } from "@/lib/audio/sim-audio";
import { useDeskPrefs } from "@/lib/desk-prefs";
import { clearCareerRecord } from "@/lib/sim/stats";
import { saveAdvisorProfile } from "@/lib/auth/actions";
import { AdvisorQuestions, type AdvisorDefaults } from "@/app/components/advisor-questions";
import { advisorStanding, type AdvisorStanding } from "@/lib/auth/advisor-standing";
import { Icon } from "@/app/menu/icons";
import styles from "@/app/menu/watch-menu.module.css";
import { connectDiscord, disconnectDiscord } from "@/lib/auth/actions";
import { Notice } from "@/app/components/notice";

/** The Discord account connected to this one, as the identity carries it. */
type DiscordIdentity = { username: string; display: string; avatar: string; only: boolean };

/** Who may open the service record on the public profile (migration 028). */
type ProfileVisibility = "open" | "colleagues" | "private";
const VISIBILITY: [ProfileVisibility, string, string][] = [
  ["open", "Open", "Any signed-in operator can see your service record."],
  ["colleagues", "Colleagues only", "Your record is for colleagues. Others see your callsign, standing and honours, and can send you a request."],
  ["private", "Private", "Your record is yours alone, and nobody can send you a colleague request."],
];

/** Why a connection came back without connecting, in the person's words. */
const FAIL_REASON: Record<string, string> = {
  manual_linking_disabled: "Connecting an existing account to Discord is not switched on for this site yet. The handle can be typed in meanwhile, and the team have been told.",
  identity_already_exists: "That Discord account is already connected to another Watch Room account. Sign in with Discord to use that one, or disconnect it there first.",
  identity_not_found: "No Discord account is connected to this one.",
  single_identity_not_deletable: "Discord is the only way into this account. Set a password first — Forgotten password on the sign-in page sends a link — then disconnect.",
  access_denied: "Discord reported that the connection was cancelled before it finished.",
  email_exists: "Discord returned an email address that already belongs to another account.",
  provider_email_needs_verification: "Discord returned an email address that is not verified on Discord. Verify it there and try again.",
};
function failReason(code?: string): string {
  return (code && FAIL_REASON[code]) || "Discord did not complete the connection. Try again; if it keeps happening, the handle can be typed in instead.";
}

const configured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
const SAVE_FAILED = "Could not save. Try again.";

// The audio module keeps the mute flag; the store never notifies, so a
// toggle bumps a counter to re-read it. The server render says "on".
const noSubscribe = () => () => {};

export function SettingsView({ discordEnabled = false, discordNotice, discordReason }: { discordEnabled?: boolean; discordNotice?: "linked" | "failed" | "unlinked"; discordReason?: string } = {}) {
  const [callsign, setCallsign] = useState("");
  const [identity, setIdentity] = useState<DiscordIdentity | null | undefined>(undefined);
  const [initialCallsign, setInitialCallsign] = useState<string | null>(null);
  const [discord, setDiscord] = useState("");
  const [initialDiscord, setInitialDiscord] = useState<string | null>(null);
  const [savingDiscord, setSavingDiscord] = useState(false);
  const [discordMsg, setDiscordMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [visibility, setVisibility] = useState<ProfileVisibility>("open");
  const [visMsg, setVisMsg] = useState("");
  const [, bump] = useState(0);
  const muted = useSyncExternalStore(noSubscribe, isMuted, () => false);
  const [deskPrefs, setDeskPrefs] = useDeskPrefs();
  const [resetDone, setResetDone] = useState(false);
  const [advisorMeta, setAdvisorMeta] = useState<(AdvisorDefaults & { advisor: boolean }) | null>(null);
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [standing, setStanding] = useState<AdvisorStanding | null>(null);
  const [advState, advAction, advPending] = useActionState(saveAdvisorProfile, undefined);

  // Standing with the programme, resolved the same way /standby does it
  // so the two pages never disagree. Re-read after a save so registering
  // here moves the badge to "Pending review" without a reload.
  const refreshStanding = useCallback(async () => {
    if (!configured) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const email = user.email?.trim();
    const { data: roleRow } = email ? await supabase.from("user_roles").select("role").ilike("email", email).maybeSingle() : { data: null };
    const role = typeof roleRow?.role === "string" ? roleRow.role : null;
    setStanding(await advisorStanding(supabase, user, role));
  }, []);

  useEffect(() => {
    if (!configured) return;
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata as {
        callsign?: string; advisor?: boolean; advisor_service?: string; advisor_status?: string; advisor_background?: string;
        advisor_force?: string; advisor_topics?: string[]; advisor_involvement?: string; advisor_notes?: string; advisor_contact_ok?: boolean; advisor_discord?: string;
        profile_visibility?: string;
      } | null;
      const cs = meta?.callsign ?? "";
      setCallsign(cs);
      setInitialCallsign(cs);
      setVisibility(meta?.profile_visibility === "colleagues" || meta?.profile_visibility === "private" ? meta.profile_visibility : "open");
      const dc = meta?.advisor_discord ?? "";
      setDiscord(dc);
      setInitialDiscord(dc);
      const isAdvisor = !!meta?.advisor;
      setAdvisorMeta({
        advisor: isAdvisor,
        service: meta?.advisor_service ?? "",
        status: meta?.advisor_status ?? "",
        background: meta?.advisor_background ?? "",
        force: meta?.advisor_force ?? "",
        topics: meta?.advisor_topics ?? [],
        involvement: meta?.advisor_involvement ?? "",
        notes: meta?.advisor_notes ?? "",
        contactOk: meta?.advisor_contact_ok ?? true,
        discord: meta?.advisor_discord ?? "",
      });
      setAdvisorOpen(isAdvisor);
      // Standing is read once the account is known, in the same callback.
      return refreshStanding();
    });
    // The Discord account connected to this one, from the identity itself.
    void supabase.auth.getUserIdentities().then(({ data: ids }) => {
      const list = ids?.identities ?? [];
      const d = list.find((i) => i.provider === "discord");
      const info = (d?.identity_data ?? {}) as Record<string, unknown>;
      const claims = (typeof info.custom_claims === "object" && info.custom_claims ? info.custom_claims : {}) as Record<string, unknown>;
      const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : "");
      const username = (str(info.preferred_username) || str(info.name) || str(info.full_name)).replace(/#0$/, "");
      setIdentity(d ? { username, display: str(claims.global_name) || str(info.full_name) || username, avatar: str(info.avatar_url) || str(info.picture), only: list.length < 2 } : null);
    });
  }, [refreshStanding]);

  // The questionnaire carries a Discord field of its own, so a save there
  // can move the handle. Re-read it, or the field above would still hold
  // the value from page load and overwrite the newer one on its next save.
  useEffect(() => {
    if (!advState?.ok || !configured) return;
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata as { advisor_discord?: string } | null;
      const dc = meta?.advisor_discord ?? "";
      setDiscord(dc);
      setInitialDiscord(dc);
    });
  }, [advState?.ok]);

  // saveAdvisorProfile only reports ok once the advisors row is upserted,
  // so a successful save is itself proof of at least "pending".
  const shownStanding: AdvisorStanding | null = advState?.ok && standing !== "accepted" ? "pending" : standing;

  async function saveCallsign() {
    const trimmed = callsign.trim();
    if (!trimmed || trimmed === initialCallsign) return;
    setSaving(true);
    setSaveMsg("");
    const { error } = await createClient().auth.updateUser({ data: { callsign: trimmed } });
    setSaving(false);
    if (error) { setSaveMsg(SAVE_FAILED); return; }
    setInitialCallsign(trimmed);
    setSaveMsg("Callsign updated.");
  }

  // The handle lives under advisor_discord because that is where the
  // questionnaire has always written it and where the admin lists read
  // it from. The advisors row goes first: the admin lists read it first
  // and only fall back to metadata, so a failure there must not report a
  // save. Having no row is the normal case and matches nothing.
  async function saveDiscord() {
    const trimmed = discord.trim();
    if (trimmed === (initialDiscord ?? "")) return;
    setSavingDiscord(true);
    setDiscordMsg("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    let rowError = null;
    if (user) {
      const { error: e } = await supabase.from("advisors").update({ discord: trimmed, updated_at: new Date().toISOString() }).eq("user_id", user.id);
      rowError = e;
    }
    const { error } = rowError ? { error: rowError } : await supabase.auth.updateUser({ data: { advisor_discord: trimmed } });
    setSavingDiscord(false);
    if (error) { setDiscordMsg(SAVE_FAILED); return; }
    setInitialDiscord(trimmed);
    setAdvisorMeta((m) => (m ? { ...m, discord: trimmed } : m));
    setDiscordMsg(trimmed ? "Discord handle updated." : "Discord handle removed.");
  }

  async function saveVisibility(v: ProfileVisibility) {
    setVisibility(v);
    if (!configured) return;
    const { error } = await createClient().auth.updateUser({ data: { profile_visibility: v } });
    setVisMsg(error ? "The change could not be saved. Try again in a moment."
      : v === "open" ? "Saved. Any signed-in operator can see your record."
        : v === "colleagues" ? "Saved. Your record is for colleagues; others see your callsign, standing and honours."
          : "Saved. Your record is yours alone, and nobody can send you a colleague request.");
  }

  function toggleSound() {
    unlockAudio();
    setMuted(!muted);
    bump((n) => n + 1);
  }

  function resetRecord() {
    if (!window.confirm("Clear the service record on this device? Calls handled, grades and casualty history reset to zero. This cannot be undone.")) return;
    clearCareerRecord();
    setResetDone(true);
  }

  const standingChip =
    shownStanding === "accepted" ? <span className={`${styles.chip} ${styles.chipOk}`}>Accepted</span>
      : shownStanding === "pending" ? <span className={`${styles.chip} ${styles.chipInfo}`}>Pending review</span>
        : shownStanding === "unfiled" ? <span className={`${styles.chip} ${styles.chipAmber}`}>Not filed</span>
          : null;

  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <p className={styles.eyebrow}>Settings · this account</p>
          <h1 className={styles.pageTitle}>Settings</h1>
          <p className={styles.lede}>Operator identity, console audio, the advisor programme, and the service record held on this device.</p>
        </div>
      </header>

      <div className={styles.pageGrid}>
        <div>
          <section className={styles.panel}>
            <p className={styles.eyebrow}>01 / Identity</p>
            <h2 className={styles.panelTitle}>Callsign</h2>
            <p className={styles.muted}>Shown on the console, the leaderboard and the service record.</p>
            <div className={`${styles.feedback} ${styles.inlineForm}`}>
              <input value={callsign} onChange={(e) => setCallsign(e.target.value.slice(0, 20))} placeholder="e.g. M2 CONTROL" aria-label="Callsign" disabled={!configured} />
              <button type="button" className={styles.primary} onClick={saveCallsign} disabled={!configured || saving || !callsign.trim() || callsign.trim() === initialCallsign}>{saving ? "Saving…" : "Save"}</button>
            </div>
            <p className={styles.formStatus} role="status">{saveMsg}</p>
          </section>

          <section className={styles.panel}>
            <p className={styles.eyebrow}>02 / Programme contact</p>
            <h2 className={styles.panelTitle}>Discord</h2>
            {identity ? (
              <>
                <p className={styles.muted}>This account is connected to a Discord account. The handle is read from Discord, and the account can sign in with Discord.</p>
                <div className={styles.identityRow}>
                  {identity.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className={styles.identityAvatar} src={identity.avatar} alt="" width={40} height={40} />
                  ) : (
                    <span className={styles.avatar} aria-hidden="true">DC</span>
                  )}
                  <span className={styles.identityName}><strong>@{identity.username || "discord"}</strong>{identity.display && identity.display !== identity.username ? <small>{identity.display}</small> : null}</span>
                  <span className={`${styles.chip} ${styles.chipOk}`}>Connected</span>
                </div>
                <form action={disconnectDiscord} className={styles.actions}>
                  <button type="submit" className={`${styles.button} ${styles.small}`} disabled={identity.only} title={identity.only ? "Discord is the only way into this account — set a password first" : "Remove the Discord account from this one"}>Disconnect Discord</button>
                </form>
                {identity.only && <p className={styles.hint}>Discord is the only way into this account. To disconnect it, set a password first: Forgotten password on the sign-in page sends a link to this address.</p>}
              </>
            ) : (
              <>
                <p className={styles.muted}>Your handle on the tester channel, so reports and feedback can be matched to this account. Optional; clear it to remove it.</p>
                <div className={`${styles.feedback} ${styles.inlineForm}`}>
                  <input value={discord} onChange={(e) => setDiscord(e.target.value.slice(0, 40))} placeholder="e.g. watchroom" aria-label="Discord handle" disabled={!configured} />
                  <button type="button" className={styles.primary} onClick={saveDiscord} disabled={!configured || savingDiscord || discord.trim() === (initialDiscord ?? "")}>{savingDiscord ? "Saving…" : "Save"}</button>
                </div>
                <p className={styles.formStatus} role="status">{discordMsg}</p>
                {discordEnabled && (
                  <>
                    <p className={styles.hint}>Or connect the Discord account itself: the handle is read from Discord, this account can then sign in with Discord, and the tester channel can be opened to it without anyone matching names.</p>
                    <form action={connectDiscord} className={styles.actions}>
                      <button type="submit" className={`${styles.button} ${styles.small}`} disabled={!configured}><Icon.discord /> Connect Discord</button>
                    </form>
                  </>
                )}
              </>
            )}
            {discordNotice === "linked" && <Notice tone="ok" title="Discord connected"><p>The Discord account is linked: its handle is on record and this account can sign in with Discord.</p></Notice>}
            {discordNotice === "unlinked" && <Notice tone="ok" title="Discord disconnected"><p>The Discord account has been removed from this one.</p></Notice>}
            {discordNotice === "failed" && <Notice tone="critical" title="Discord could not be connected"><p>{failReason(discordReason)}</p></Notice>}
          </section>

          <section className={styles.panel}>
            <p className={styles.eyebrow}>03 / Alerts and assistance</p>
            <h2 className={styles.panelTitle}>How the desk gets your attention</h2>
            <p className={styles.muted}>Every event on the desk (a new call, a unit on scene, a patient change) can be sounded, shown as a card and read to a screen reader. Switch on whichever you need; each works alone.</p>
            <div className={styles.switchRow} style={{ marginTop: 18 }}>
              <span><strong>Console audio</strong><small>Dispatch tones, incoming-call ring and warning tones.</small></span>
              <button type="button" className={styles.button} onClick={toggleSound} aria-pressed={!muted}>{muted ? <Icon.play /> : <Icon.pause />}{muted ? "Muted" : "Audio on"}</button>
            </div>
            <label className={styles.switchRow} style={{ marginTop: 14 }}>
              <span><strong>Visual alerts</strong><small>Event cards in the top right of the desk, each with the time.</small></span>
              <input type="checkbox" checked={deskPrefs.visualCues} onChange={(e) => setDeskPrefs({ visualCues: e.target.checked })} />
            </label>
            <label className={styles.switchRow} style={{ marginTop: 14 }}>
              <span><strong>Screen reader announcements</strong><small>The same events read into a live region. Urgent events, such as a 999 call, interrupt.</small></span>
              <input type="checkbox" checked={deskPrefs.announce} onChange={(e) => setDeskPrefs({ announce: e.target.checked })} />
            </label>
            <label className={styles.switchRow} style={{ marginTop: 14 }}>
              <span><strong>Inline help</strong><small>Show every option&apos;s explanation on the treatment and tasking screens, not only on hover or focus.</small></span>
              <input type="checkbox" checked={deskPrefs.inlineHelp} onChange={(e) => setDeskPrefs({ inlineHelp: e.target.checked })} />
            </label>
          </section>

          <section className={styles.panel}>
            <p className={styles.eyebrow}>04 / Advisor programme</p>
            <div className={styles.switchRow}>
              <span>
                <strong>Advisor programme {standingChip}</strong>
                <small>For serving and former emergency services personnel: procedures, mobilising, equipment and control-room practice reviewed for authenticity.</small>
              </span>
              {!advisorOpen && <button type="button" className={styles.button} onClick={() => setAdvisorOpen(true)} disabled={!configured}>Register</button>}
            </div>
            {advisorOpen && advisorMeta && (
              <form action={advAction} className={`${styles.legacy} ${styles.section}`}>
                <AdvisorQuestions defaults={advisorMeta} errors={advState?.errors} />
                {advState?.errors?.form?.map((msg) => <p key={msg} className={styles.warning}>{msg}</p>)}
                {advState?.ok && advState.message && <p className={styles.formStatus}>{advState.message}</p>}
                <div className={styles.actions}>
                  <button type="submit" className={styles.primary} disabled={advPending}>{advPending ? "Saving…" : advisorMeta.advisor ? "Update advisor profile" : "Register as advisor"} <Icon.arrow /></button>
                </div>
              </form>
            )}
          </section>
        </div>

        <div>
          <section className={styles.panel}>
            <p className={styles.eyebrow}>Profile</p>
            <h2 className={styles.panelTitle}>Who sees your record</h2>
            <p className={styles.muted}>Every operator has a profile the others can open from the leaderboard and the Colleagues page: callsign, standing and honours always; the service record as you choose here.</p>
            <div className={styles.visibilityList} role="radiogroup" aria-label="Who sees your service record">
              {VISIBILITY.map(([v, label, body]) => (
                <label key={v}>
                  <input type="radio" name="visibility" value={v} checked={visibility === v} onChange={() => saveVisibility(v)} disabled={!configured} />
                  <div><strong>{label}</strong><span>{body}</span></div>
                </label>
              ))}
            </div>
            <p className={styles.formStatus} role="status">{visMsg}</p>
            <p className={styles.formStatus}><Link href="/colleagues" className={styles.textLink}>Colleagues</Link></p>
          </section>

          <section className={styles.panel}>
            <p className={styles.eyebrow}>Device record</p>
            <h2 className={styles.panelTitle}>Reset service record</h2>
            <p className={styles.muted}>Clears the career statistics and last-debrief result stored on this device. The account and any saved shift are unaffected.</p>
            <div className={styles.actions}>
              <button type="button" className={`${styles.button} ${styles.danger}`} onClick={resetRecord} disabled={resetDone}>{resetDone ? "Record cleared" : "Reset record"}</button>
            </div>
          </section>
          {!configured && <p className={styles.callout}>The account service is not configured on this build. Callsign and Discord cannot be changed here.</p>}
        </div>
      </div>
    </>
  );
}
