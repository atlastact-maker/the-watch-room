"use client";

// Operator settings — callsign, Discord handle, sound, and service-record
// reset, in the ops-centre styling. Callsign and Discord write to Supabase
// user metadata (the same fields signup collects); everything else is
// device-local.

import { useActionState, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isMuted, setMuted, unlockAudio } from "@/lib/audio/sim-audio";
import { clearCareerRecord } from "@/lib/sim/stats";
import { saveAdvisorProfile } from "@/lib/auth/actions";
import { AdvisorQuestions, type AdvisorDefaults } from "@/app/components/advisor-questions";
import { advisorStanding, type AdvisorStanding } from "@/lib/auth/advisor-standing";

export default function SettingsPage() {
  const [callsign, setCallsign] = useState("");
  const [initialCallsign, setInitialCallsign] = useState<string | null>(null);
  const [discord, setDiscord] = useState("");
  const [initialDiscord, setInitialDiscord] = useState<string | null>(null);
  const [savingDiscord, setSavingDiscord] = useState(false);
  const [discordMsg, setDiscordMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [muted, setMutedState] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [advisorMeta, setAdvisorMeta] = useState<
    (AdvisorDefaults & { advisor: boolean }) | null
  >(null);
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [standing, setStanding] = useState<AdvisorStanding | null>(null);
  const [advState, advAction, advPending] = useActionState(saveAdvisorProfile, undefined);

  // Standing with the programme, resolved the same way /standby does it
  // so the two pages never disagree. Re-read after a save so registering
  // here flips the badge to "Pending review" without a reload.
  const refreshStanding = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const email = user.email?.trim();
    const { data: roleRow } = email
      ? await supabase
          .from("user_roles")
          .select("role")
          .ilike("email", email)
          .maybeSingle()
      : { data: null };
    const role = typeof roleRow?.role === "string" ? roleRow.role : null;
    setStanding(await advisorStanding(supabase, user, role));
  }, []);

  useEffect(() => {
    setMutedState(isMuted());
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata as {
        callsign?: string;
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
      const cs = meta?.callsign ?? "";
      setCallsign(cs);
      setInitialCallsign(cs);
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
    });
    void refreshStanding();
  }, [refreshStanding]);

  // The questionnaire carries a Discord field of its own, so a save
  // there can move the handle. Re-read it, or the box above would still
  // be holding the value from page load and would overwrite the newer
  // one the next time it was used.
  useEffect(() => {
    if (!advState?.ok) return;
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata as { advisor_discord?: string } | null;
      const dc = meta?.advisor_discord ?? "";
      setDiscord(dc);
      setInitialDiscord(dc);
    });
  }, [advState?.ok]);

  // saveAdvisorProfile only reports ok once the advisors row is upserted,
  // so a successful save is itself proof of at least "pending" — no need
  // to re-read the table to move the badge off "Not filed".
  const shownStanding: AdvisorStanding | null =
    advState?.ok && standing !== "accepted" ? "pending" : standing;

  async function saveCallsign() {
    const trimmed = callsign.trim();
    if (!trimmed || trimmed === initialCallsign) return;
    setSaving(true);
    setSaveMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { callsign: trimmed },
    });
    setSaving(false);
    if (error) {
      setSaveMsg("Could not save — try again");
    } else {
      setInitialCallsign(trimmed);
      setSaveMsg("Callsign updated");
    }
  }

  // The handle lives under advisor_discord because that is where the
  // questionnaire has always written it, and where the admin lists read
  // it from. Keeping the one key means the field here and the one on the
  // application can never drift apart into two answers.
  async function saveDiscord() {
    const trimmed = discord.trim();
    if (trimmed === (initialDiscord ?? "")) return;
    setSavingDiscord(true);
    setDiscordMsg(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // The advisors row goes first, because it is what the admin lists
    // read first — they only fall back to metadata. Writing metadata
    // first and failing here would tell the operator it saved while the
    // console still showed their old handle. Having no row is the normal
    // case: it matches nothing, which is not an error.
    let rowError = null;
    if (user) {
      const { error: e } = await supabase
        .from("advisors")
        .update({ discord: trimmed, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      rowError = e;
    }
    const { error } = rowError
      ? { error: rowError }
      : await supabase.auth.updateUser({ data: { advisor_discord: trimmed } });

    setSavingDiscord(false);
    if (error) {
      setDiscordMsg("Could not save — try again");
      return;
    }
    setInitialDiscord(trimmed);
    setAdvisorMeta((m) => (m ? { ...m, discord: trimmed } : m));
    setDiscordMsg(trimmed ? "Discord handle updated" : "Discord handle removed");
  }

  function toggleSound() {
    unlockAudio();
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  }

  function resetRecord() {
    if (
      !window.confirm(
        "Wipe your service record on this device? Calls answered, grades, casualty history — all reset to zero. This cannot be undone.",
      )
    ) {
      return;
    }
    clearCareerRecord();
    setResetDone(true);
  }

  return (
    <div className="relative z-10 flex min-h-[100dvh] flex-1 flex-col">
      <header className="border-b border-(--color-border-subtle) bg-(--color-surface)/60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-(--color-text-dim)">
          <div className="flex items-center gap-3">
            <span className="dot-live size-1.5 rounded-full bg-(--color-amber)" />
            <span className="text-(--color-text)">The Watch Room</span>
            <span className="text-(--color-border)">/</span>
            <span>Settings</span>
          </div>
          <Link
            href="/menu"
            className="rounded-sm border border-(--color-border) px-2.5 py-1 uppercase tracking-widest text-(--color-text-dim) transition-colors hover:border-(--color-amber) hover:text-(--color-amber)"
          >
            ← Back
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-(--color-amber-dim)">
          Operator profile · this account
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Settings.</h1>

        {/* Callsign */}
        <section className="mt-8 rounded-sm border border-(--color-border-subtle) p-5">
          <h2 className="font-mono text-[11px] uppercase tracking-widest text-(--color-amber)">
            Callsign
          </h2>
          <p className="mt-1.5 text-[12px] leading-relaxed text-(--color-text-muted)">
            Shown across the ops centre and on your service record.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              value={callsign}
              onChange={(e) => setCallsign(e.target.value.slice(0, 20))}
              placeholder="e.g. NW-104"
              className="h-10 flex-1 rounded-sm border border-(--color-border) bg-(--color-bg) px-3 font-mono text-sm uppercase tracking-widest text-(--color-text) outline-none placeholder:normal-case placeholder:tracking-normal focus:border-(--color-amber)"
            />
            <button
              type="button"
              onClick={saveCallsign}
              disabled={saving || !callsign.trim() || callsign.trim() === initialCallsign}
              className="rounded-sm border border-(--color-amber)/60 bg-(--color-amber)/10 px-4 font-mono text-[11px] uppercase tracking-widest text-(--color-amber) hover:bg-(--color-amber)/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
          {saveMsg && (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
              {saveMsg}
            </p>
          )}
        </section>

        {/* Discord */}
        <section className="mt-4 rounded-sm border border-(--color-border-subtle) p-5">
          <h2 className="font-mono text-[11px] uppercase tracking-widest text-(--color-amber)">
            Discord
          </h2>
          <p className="mt-1.5 text-[12px] leading-relaxed text-(--color-text-muted)">
            Your handle on the community server, so we can match you to your
            account. Optional — clear it to remove it.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              value={discord}
              onChange={(e) => setDiscord(e.target.value.slice(0, 40))}
              placeholder="e.g. watchroomfan"
              className="h-10 flex-1 rounded-sm border border-(--color-border) bg-(--color-bg) px-3 font-mono text-sm text-(--color-text) outline-none placeholder:text-(--color-text-dim) focus:border-(--color-amber)"
            />
            <button
              type="button"
              onClick={saveDiscord}
              disabled={savingDiscord || discord.trim() === (initialDiscord ?? "")}
              className="rounded-sm border border-(--color-amber)/60 bg-(--color-amber)/10 px-4 font-mono text-[11px] uppercase tracking-widest text-(--color-amber) hover:bg-(--color-amber)/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {savingDiscord ? "Saving…" : "Save"}
            </button>
          </div>
          {discordMsg && (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-(--color-text-dim)">
              {discordMsg}
            </p>
          )}
        </section>

        {/* Sound */}
        <section className="mt-4 rounded-sm border border-(--color-border-subtle) p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-mono text-[11px] uppercase tracking-widest text-(--color-amber)">
                Console audio
              </h2>
              <p className="mt-1.5 text-[12px] leading-relaxed text-(--color-text-muted)">
                Dispatch chirps, incoming-call tones and alert sounds during a
                shift.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleSound}
              className={
                "shrink-0 rounded-sm border px-4 py-2 font-mono text-[11px] uppercase tracking-widest " +
                (muted
                  ? "border-(--color-border) text-(--color-text-dim) hover:border-(--color-amber) hover:text-(--color-amber)"
                  : "border-(--color-ok)/60 bg-(--color-ok)/10 text-(--color-ok)")
              }
            >
              {muted ? "Muted" : "On"}
            </button>
          </div>
        </section>

        {/* Advisor programme */}
        <section className="mt-4 rounded-sm border border-(--color-info)/40 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-mono text-[11px] uppercase tracking-widest text-(--color-info)">
                Advisor programme
                {shownStanding === "accepted" && (
                  <span className="ml-2 rounded-sm border border-(--color-ok)/50 bg-(--color-ok)/10 px-1.5 py-0.5 text-[9px] text-(--color-ok)">
                    Accepted
                  </span>
                )}
                {shownStanding === "pending" && (
                  <span className="ml-2 rounded-sm border border-(--color-info)/50 bg-(--color-info)/10 px-1.5 py-0.5 text-[9px]">
                    Pending review
                  </span>
                )}
                {shownStanding === "unfiled" && (
                  <span className="ml-2 rounded-sm border border-(--color-amber)/50 bg-(--color-amber)/10 px-1.5 py-0.5 text-[9px] text-(--color-amber)">
                    Not filed
                  </span>
                )}
              </h2>
              <p className="mt-1.5 text-[12px] leading-relaxed text-(--color-text-muted)">
                Part of the emergency services? Help keep The Watch Room
                authentic — procedures, mobilising, kit, control-room reality.
              </p>
            </div>
            {!advisorOpen && (
              <button
                type="button"
                onClick={() => setAdvisorOpen(true)}
                className="shrink-0 rounded-sm border border-(--color-info)/60 bg-(--color-info)/10 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-(--color-info) hover:bg-(--color-info)/20"
              >
                Register
              </button>
            )}
          </div>

          {advisorOpen && advisorMeta && (
            <form action={advAction} className="mt-4 flex flex-col gap-3">
              <AdvisorQuestions defaults={advisorMeta} errors={advState?.errors} />
              {advState?.errors?.form?.map((msg) => (
                <p key={msg} className="text-sm text-(--color-critical)">{msg}</p>
              ))}
              {advState?.ok && advState.message && (
                <p className="font-mono text-[10px] uppercase tracking-widest text-(--color-ok)">
                  ✓ {advState.message}
                </p>
              )}
              <button
                type="submit"
                disabled={advPending}
                className="rounded-sm border border-(--color-info)/60 bg-(--color-info)/10 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-(--color-info) hover:bg-(--color-info)/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {advPending ? "Saving…" : advisorMeta.advisor ? "Update advisor profile" : "Register as advisor"}
              </button>
            </form>
          )}
        </section>

        {/* Reset */}
        <section className="mt-4 rounded-sm border border-(--color-critical)/30 p-5">
          <h2 className="font-mono text-[11px] uppercase tracking-widest text-(--color-critical)">
            Reset service record
          </h2>
          <p className="mt-1.5 text-[12px] leading-relaxed text-(--color-text-muted)">
            Wipes the career statistics and last-shift result stored on this
            device. Your account and saved shift are untouched.
          </p>
          <button
            type="button"
            onClick={resetRecord}
            disabled={resetDone}
            className="mt-3 rounded-sm border border-(--color-critical)/60 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-(--color-critical) hover:bg-(--color-critical)/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {resetDone ? "Record wiped" : "Reset record"}
          </button>
        </section>
      </main>
    </div>
  );
}
