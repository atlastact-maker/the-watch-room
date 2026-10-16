"use client";

// HOW THE TWO DEVICES TALK. Supabase Realtime broadcast on the project
// the site already signs in against, so a tablet anywhere can join a desk
// anywhere. Without the project's keys — the dev harness, a local build —
// a BroadcastChannel carries the same messages between tabs of one
// browser, which is enough to drive the whole thing end to end.

import type { CompanionMsg } from "./protocol";
import { channelName } from "./protocol";
import { createClient } from "@/lib/supabase/client";

export type TransportStatus = "connecting" | "open" | "closed" | "error";

export type Transport = {
  kind: "realtime" | "local";
  send(msg: CompanionMsg): void;
  onMessage(cb: (msg: CompanionMsg) => void): () => void;
  onStatus(cb: (s: TransportStatus) => void): () => void;
  close(): void;
};

export function realtimeConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export function createTransport(code: string, opts: { local?: boolean } = {}): Transport {
  if (!opts.local && realtimeConfigured()) {
    try {
      return realtimeTransport(code);
    } catch {
      // Fall through to the local channel: better a tablet in the next
      // tab than none.
    }
  }
  return localTransport(code);
}

function emitter<T>() {
  const cbs = new Set<(v: T) => void>();
  return {
    on(cb: (v: T) => void) { cbs.add(cb); return () => { cbs.delete(cb); }; },
    emit(v: T) { for (const cb of cbs) cb(v); },
  };
}

function realtimeTransport(code: string): Transport {
  const supabase = createClient();
  const messages = emitter<CompanionMsg>();
  const statuses = emitter<TransportStatus>();
  let status: TransportStatus = "connecting";
  const queue: CompanionMsg[] = [];
  const ch = supabase.channel(channelName(code), { config: { broadcast: { self: false, ack: false } } });
  ch.on("broadcast", { event: "m" }, ({ payload }) => {
    if (payload && typeof payload === "object" && "t" in payload) messages.emit(payload as CompanionMsg);
  });
  const push = (msg: CompanionMsg) => { void ch.send({ type: "broadcast", event: "m", payload: msg }); };
  ch.subscribe((s) => {
    const next: TransportStatus = s === "SUBSCRIBED" ? "open" : s === "CLOSED" ? "closed" : s === "CHANNEL_ERROR" || s === "TIMED_OUT" ? "error" : "connecting";
    if (next !== status) { status = next; statuses.emit(next); }
    if (next === "open") { for (const m of queue.splice(0)) push(m); }
  });
  return {
    kind: "realtime",
    send(msg) { if (status === "open") push(msg); else queue.push(msg); },
    onMessage: (cb) => messages.on(cb),
    onStatus: (cb) => { cb(status); return statuses.on(cb); },
    close() { status = "closed"; statuses.emit("closed"); void supabase.removeChannel(ch); },
  };
}

function localTransport(code: string): Transport {
  const messages = emitter<CompanionMsg>();
  const statuses = emitter<TransportStatus>();
  let status: TransportStatus = "connecting";
  const bc = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(channelName(code)) : null;
  if (bc) {
    bc.onmessage = (e) => { if (e.data && typeof e.data === "object" && "t" in e.data) messages.emit(e.data as CompanionMsg); };
    setTimeout(() => { status = "open"; statuses.emit("open"); }, 0);
  } else {
    setTimeout(() => { status = "error"; statuses.emit("error"); }, 0);
  }
  return {
    kind: "local",
    send(msg) { bc?.postMessage(msg); },
    onMessage: (cb) => messages.on(cb),
    onStatus: (cb) => { cb(status); return statuses.on(cb); },
    close() { status = "closed"; statuses.emit("closed"); bc?.close(); },
  };
}
