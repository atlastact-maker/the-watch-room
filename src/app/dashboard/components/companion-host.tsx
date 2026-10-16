"use client";

// THE DESK'S END OF THE COMPANION TABLET. The desk owns the shift. While
// it is sharing, every change to the MDT's props goes out in slices to
// whichever tablets have joined by the code, and whatever they press
// comes back as the name of the prop the MDT would have called — the
// desk calls it, the state changes, the change goes out. The dialog
// shows the code and who has joined.

import { useCallback, useEffect, useRef, useState } from "react";
import { chunk, pack } from "@/lib/companion/codec";
import { formatCode, LOG_CAP, SLICE_KEYS, SLICES, TABLET_STALE_MS, type CompanionMsg, type Slice } from "@/lib/companion/protocol";
import { createTransport, realtimeConfigured, type Transport, type TransportStatus } from "@/lib/companion/transport";

export type CompanionHost = {
  status: TransportStatus | "off";
  kind: "realtime" | "local" | null;
  /** Tablets heard from in the last half minute. */
  tablets: number;
  /** Slices sent so far, for the dialog's reassurance. */
  sent: number;
  lastSentAt: number | null;
  /** Hand the hook the MDT's latest props, from an effect, after each render. */
  publish: (props: Record<string, unknown> | null) => void;
};

/** Pick one slice's members off the props; the log capped to its tail. */
function sliceOf(props: Record<string, unknown>, key: Slice): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of SLICE_KEYS[key]) {
    const v = props[k];
    out[k] = key === "log" && k === "log" && Array.isArray(v) && v.length > LOG_CAP ? v.slice(-LOG_CAP) : v;
  }
  return out;
}

export function useCompanionHost(code: string | null, opts: { local?: boolean } = {}): CompanionHost {
  const transport = useRef<Transport | null>(null);
  const propsRef = useRef<Record<string, unknown> | null>(null);
  const schedule = useRef<(() => void) | null>(null);
  const lastSent = useRef<Partial<Record<Slice, Record<string, unknown>>>>({});
  const seq = useRef(0);
  const dirty = useRef(new Set<Slice>());
  const timer = useRef<number | null>(null);
  const tabletsRef = useRef(new Map<string, number>());
  const [statusState, setStatus] = useState<TransportStatus>("connecting");
  const [tablets, setTablets] = useState(0);
  const [sent, setSent] = useState(0);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const local = !!opts.local;

  // What carries it, known without asking the transport: the same rule
  // createTransport applies.
  const kind: CompanionHost["kind"] = !code ? null : !local && realtimeConfigured() ? "realtime" : "local";
  const status: CompanionHost["status"] = code ? statusState : "off";

  useEffect(() => {
    if (!code) return;
    const t = createTransport(code, { local });
    transport.current = t;
    lastSent.current = {};

    const sendSlice = (key: Slice) => {
      const p = propsRef.current ?? {};
      const body = sliceOf(p, key);
      const raw: Record<string, unknown> = {};
      for (const k of SLICE_KEYS[key]) raw[k] = p[k];
      lastSent.current[key] = raw;
      const n = ++seq.current;
      const parts = chunk(pack(body));
      if (parts.length === 1) t.send({ t: "slice", key, seq: n, data: parts[0] });
      else parts.forEach((part, i) => t.send({ t: "chunk", key, seq: n, i, n: parts.length, part }));
      setSent((c) => c + 1);
      setLastSentAt(Date.now());
    };
    const sendHello = () => {
      const p = propsRef.current ?? {};
      t.send({ t: "hello", seq: seq.current, fn: Object.keys(p).filter((k) => typeof p[k] === "function"), incident: !!propsRef.current });
    };
    const sendAll = () => { for (const key of SLICES) sendSlice(key); };
    const flush = () => {
      timer.current = null;
      const keys = [...dirty.current];
      dirty.current.clear();
      for (const key of keys) sendSlice(key);
    };
    // The diff runs after every render (below); it queues through here.
    schedule.current = () => {
      const p = propsRef.current ?? {};
      for (const key of SLICES) {
        const last = lastSent.current[key];
        if (!last) { dirty.current.add(key); continue; }
        for (const k of SLICE_KEYS[key]) if (!Object.is(p[k], last[k])) { dirty.current.add(key); break; }
      }
      if (dirty.current.size && timer.current === null) timer.current = window.setTimeout(flush, 150);
    };
    const offStatus = t.onStatus((s) => {
      setStatus(s);
      if (s === "open") { sendHello(); sendAll(); }
    });
    const offMsg = t.onMessage((m: CompanionMsg) => {
      if (m.t === "join" || m.t === "ping") {
        tabletsRef.current.set(m.id, Date.now());
        setTablets(tabletsRef.current.size);
        if (m.t === "join") { sendHello(); sendAll(); }
      } else if (m.t === "act") {
        const fn = propsRef.current?.[m.name];
        if (typeof fn === "function") {
          try { (fn as (...a: unknown[]) => void)(...m.args); } catch (e) { console.warn("companion act failed", m.name, e); }
        }
      }
    });
    const prune = window.setInterval(() => {
      const cutoff = Date.now() - TABLET_STALE_MS;
      for (const [id, at] of tabletsRef.current) if (at < cutoff) tabletsRef.current.delete(id);
      setTablets(tabletsRef.current.size);
    }, 10_000);
    return () => {
      offStatus();
      offMsg();
      window.clearInterval(prune);
      if (timer.current !== null) { window.clearTimeout(timer.current); timer.current = null; }
      schedule.current = null;
      t.send({ t: "bye" });
      t.close();
      transport.current = null;
      tabletsRef.current.clear();
      setTablets(0);
    };
  }, [code, local]);

  // The desk calls this after every render: the latest props, and
  // whatever changed is queued.
  const publish = useCallback((props: Record<string, unknown> | null) => {
    propsRef.current = props;
    schedule.current?.();
  }, []);

  return { status, kind, tablets, sent, lastSentAt, publish };
}

export function CompanionDialog({ code, host, onNewCode, onStop, onClose }: {
  code: string | null;
  host: CompanionHost;
  onNewCode: () => void;
  onStop: () => void;
  onClose: () => void;
}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = code ? `${origin}/mdt?code=${code}` : `${origin}/mdt`;
  const bare = origin.replace(/^https?:\/\//, "");
  const status = !code ? "Not sharing" : host.status === "open" ? (host.tablets ? `${host.tablets} tablet${host.tablets === 1 ? "" : "s"} joined` : "Sharing · waiting for a tablet") : host.status === "connecting" ? "Connecting…" : host.status === "error" ? "Channel error — try a new code" : "Not connected";
  return (
    <div className="vec-scrim" role="dialog" aria-modal="true" aria-labelledby="companion-title" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="vec-dialog">
        <div className="vec-dialog-bar">
          <span id="companion-title">Companion tablet</span>
          <span className="spacer" />
          <span className="meta">{status}</span>
          <button type="button" className="vec-dialog-x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="vec-dialog-body vec-companion">
          <p>Open this desk&apos;s MDT on a tablet or another screen. On that device, sign in, go to <b>{bare}/mdt</b> and enter the code.</p>
          <div className="vec-companion-code" aria-label="Pairing code">{code ? formatCode(code) : "— — — —"}</div>
          <dl className="vec-companion-facts">
            <dt>Link</dt><dd><a href={url} target="_blank" rel="noreferrer">{url}</a></dd>
            <dt>Carried by</dt><dd>{host.kind === "realtime" ? "Supabase Realtime — any network" : host.kind === "local" ? (realtimeConfigured() ? "This browser only" : "This browser only — Realtime is not configured on this build") : "—"}</dd>
            <dt>Sent</dt><dd>{host.sent ? `${host.sent} updates · last ${new Date(host.lastSentAt ?? 0).toLocaleTimeString("en-GB")}` : "nothing yet"}</dd>
          </dl>
          <p className="vec-companion-note">The desk stays in charge: the tablet shows what this MDT shows, and anything pressed on it happens here. Closing this window leaves the sharing running; Stop sharing ends it and the tablet is told.</p>
          <div className="vec-companion-actions">
            <button type="button" className="vec-btn" onClick={onNewCode} title="A fresh code; a tablet on the old one is dropped">New code</button>
            <button type="button" className="vec-btn" onClick={onStop} disabled={!code}>Stop sharing</button>
            <button type="button" className="vec-btn solid" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    </div>
  );
}
