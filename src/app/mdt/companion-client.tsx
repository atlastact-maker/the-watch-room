"use client";

// THE TABLET'S END OF THE COMPANION. Joined by the desk's code, it draws
// the MDT the desk would draw — the same component, fed from the desk's
// slices instead of the desk's state — and sends back what is pressed as
// the name of the prop the MDT called. It keeps its own clock; everything
// else is the desk's.

import "../dashboard/vector/vector.css";
import { useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { DraggableIncidentMdt } from "../dashboard/components/incident-mdt";
import { unpack } from "@/lib/companion/codec";
import { formatCode, isCode, normaliseCode, PING_MS, SLICES, type CompanionMsg, type Slice } from "@/lib/companion/protocol";
import { createTransport, type Transport, type TransportStatus } from "@/lib/companion/transport";

type MdtProps = ComponentProps<typeof DraggableIncidentMdt>;

export function CompanionClient({ initialCode, local }: { initialCode?: string; local?: boolean }) {
  const first = normaliseCode(initialCode ?? "");
  const [typed, setTyped] = useState(first);
  const [code, setCode] = useState<string | null>(() => (isCode(first) ? first : null));
  const [status, setStatus] = useState<TransportStatus | "ended">("connecting");
  const [fn, setFn] = useState<string[]>([]);
  const [slices, setSlices] = useState<Partial<Record<Slice, Record<string, unknown>>>>({});
  const [heard, setHeard] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const transport = useRef<Transport | null>(null);
  const [tabletId] = useState(() => `t-${Math.random().toString(36).slice(2, 10)}`);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!code) return;
    const t = createTransport(code, { local });
    transport.current = t;
    const chunks = new Map<string, { n: number; parts: string[]; got: number }>();
    const offStatus = t.onStatus((s) => {
      setStatus(s);
      if (s === "open") t.send({ t: "join", id: tabletId });
    });
    const offMsg = t.onMessage((m: CompanionMsg) => {
      if (m.t === "hello") {
        setFn(m.fn);
        setHeard(true);
      } else if (m.t === "slice") {
        const data = unpack<Record<string, unknown>>(m.data);
        setSlices((prev) => ({ ...prev, [m.key]: data }));
        setHeard(true);
      } else if (m.t === "chunk") {
        const id = `${m.key}:${m.seq}`;
        const c = chunks.get(id) ?? { n: m.n, parts: new Array<string>(m.n).fill(""), got: 0 };
        if (!c.parts[m.i]) { c.parts[m.i] = m.part; c.got++; }
        chunks.set(id, c);
        if (c.got === c.n) {
          chunks.delete(id);
          const data = unpack<Record<string, unknown>>(c.parts.join(""));
          setSlices((prev) => ({ ...prev, [m.key]: data }));
          setHeard(true);
        }
      } else if (m.t === "bye") {
        setStatus("ended");
      }
    });
    const ping = window.setInterval(() => t.send({ t: "ping", id: tabletId }), PING_MS);
    return () => {
      offStatus();
      offMsg();
      window.clearInterval(ping);
      t.close();
      transport.current = null;
    };
  }, [code, local]);

  // The callable props: each one a sender named for the prop the MDT calls.
  const senders = useMemo(() => {
    const out: Record<string, (...args: unknown[]) => void> = {};
    for (const name of fn) out[name] = (...args: unknown[]) => transport.current?.send({ t: "act", id: tabletId, name, args });
    return out;
  }, [fn]);

  if (!code) {
    return (
      <div className="cad-application cmp-root">
        <div className="cmp-screen">
          <form className="cmp-card" onSubmit={(e) => { e.preventDefault(); if (isCode(typed)) { setSlices({}); setHeard(false); setStatus("connecting"); setCode(typed); } }}>
            <span className="cmp-eyebrow">VECTOR · MDT companion</span>
            <h1>Join the desk</h1>
            <p>On the desk, open <b>Windows → Companion tablet…</b> and enter the code it shows. This device then carries the desk&apos;s MDT, live.</p>
            <label htmlFor="cmp-code">Pairing code</label>
            <input id="cmp-code" value={formatCode(typed)} onChange={(e) => setTyped(normaliseCode(e.target.value))} inputMode="text" autoCapitalize="characters" autoComplete="off" spellCheck={false} placeholder="XXXX-XXXX" autoFocus />
            <button type="submit" className="vec-btn solid" disabled={!isCode(typed)}>Connect</button>
            <a className="cmp-back" href="/menu">Back to the console</a>
          </form>
        </div>
      </div>
    );
  }

  const data: Record<string, unknown> = Object.assign({}, ...SLICES.map((k) => slices[k] ?? {}));
  const incident = data.incident as { id?: string } | null | undefined;
  const ready = !!incident && Array.isArray(data.stations) && Array.isArray(data.deployments) && Array.isArray(data.log);
  const mdtProps = { ...data, ...senders, now, fixed: true, onClose: () => undefined } as unknown as MdtProps;
  const words = status === "ended" ? "Sharing ended" : status === "open" ? (heard ? (ready ? "" : "Joined · no incident open on the desk") : "Joined · waiting for the desk") : status === "connecting" ? "Connecting…" : status === "error" ? "Channel error — check the code and the connection" : "Disconnected";
  const leave = () => { setCode(null); setSlices({}); setHeard(false); setFn([]); setStatus("connecting"); };
  return (
    <div className="cad-application cmp-root">
      {ready ? (
        <DraggableIncidentMdt key={String(incident?.id ?? "")} {...mdtProps} />
      ) : (
        <div className="cmp-screen">
          <div className="cmp-card">
            <span className="cmp-eyebrow">VECTOR · MDT companion · {formatCode(code)}</span>
            <h1>{status === "open" ? (heard ? "No incident open" : "Waiting for the desk") : status === "connecting" ? "Connecting" : "Not connected"}</h1>
            <p>{status === "open" ? (heard ? "The desk is sharing, but has no incident open. The MDT appears here the moment one does." : "Joined the channel. The desk sends its MDT as soon as it hears this tablet.") : status === "error" ? "The channel could not be joined. Check the code on the desk, and that both devices are online." : "Opening the channel to the desk…"}</p>
            <button type="button" className="vec-btn" onClick={leave}>Enter another code</button>
          </div>
        </div>
      )}
      {ready && words && <div className="cmp-strip">{words}</div>}
      {status === "ended" && (
        <div className="cmp-screen cmp-over">
          <div className="cmp-card">
            <span className="cmp-eyebrow">VECTOR · MDT companion</span>
            <h1>Sharing ended</h1>
            <p>The desk stopped sharing this MDT. Ask for a new code, or wait here — if the desk shares again on the same code this tablet rejoins on its own.</p>
            <button type="button" className="vec-btn" onClick={leave}>Enter another code</button>
          </div>
        </div>
      )}
    </div>
  );
}
