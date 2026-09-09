"use client";

// The officer's notebook on the tablet — a pad that floats over the
// module, drags around, minimises to a tab, lifts into its own window
// and remembers what was written per job. A line can be sent to the
// shift log as it stands, timestamped, so control sees it too.

import { useEffect, useState } from "react";
import { Rnd } from "react-rnd";
import { PopoutWindow, PopoutFrame } from "./popout";

const KEY = (incidentId: string) => `twr:mdt-notes:${incidentId}`;

function load(incidentId: string): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(KEY(incidentId)) ?? "";
  } catch {
    return "";
  }
}

function hms(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-GB", { hour12: false });
}

export type MdtNotepadProps = {
  incidentId: string;
  incidentRef: string;
  unitCallsign: string;
  open: boolean;
  onClose: () => void;
  onNote?: (text: string) => void;
};

export function MdtNotepad({ incidentId, incidentRef, unitCallsign, open, onClose, onNote }: MdtNotepadProps) {
  const [text, setText] = useState(() => load(incidentId));
  const [minimised, setMinimised] = useState(false);
  const [popped, setPopped] = useState(false);
  const [sentAt, setSentAt] = useState<number | null>(null);

  // Autosave: the pad survives the tablet closing and the page reloading.
  useEffect(() => {
    try {
      window.localStorage.setItem(KEY(incidentId), text);
    } catch {
      /* storage unavailable — the pad still works for the session */
    }
  }, [text, incidentId]);

  if (!open) return null;

  const stamp = () => setText((t) => `${t}${t && !t.endsWith("\n") ? "\n" : ""}${hms(Date.now())} — `);
  const sendLast = () => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const last = lines[lines.length - 1];
    if (!last || !onNote) return;
    onNote(`${unitCallsign} · notebook: ${last}`);
    setSentAt(Date.now());
  };
  const sendAll = () => {
    const body = text.trim();
    if (!body || !onNote) return;
    onNote(`${unitCallsign} · notebook (${incidentRef}): ${body.replace(/\s*\n+\s*/g, " / ")}`);
    setSentAt(Date.now());
  };

  const pad = (
    <div className="vec-notepad-body">
      <div className="vec-notepad-tools">
        <button type="button" className="pc-mini" onClick={stamp} title="Start a line with the time">⏱ Time</button>
        <button type="button" className="pc-mini" disabled={!onNote || !text.trim()} onClick={sendLast} title="Send the last line to the shift log">Log last line</button>
        <button type="button" className="pc-mini" disabled={!onNote || !text.trim()} onClick={sendAll} title="Send the whole pad to the shift log">Log all</button>
        <button type="button" className="pc-mini" disabled={!text} onClick={() => { if (window.confirm("Clear the notebook for this job?")) setText(""); }}>Clear</button>
        <span className="vec-notepad-status">{sentAt ? `Logged ${hms(sentAt)}` : `${text.length ? `${text.split("\n").filter((l) => l.trim()).length} lines` : "Empty"} · ${incidentRef}`}</span>
      </div>
      <textarea
        className="vec-notepad-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Notebook · ${unitCallsign} · ${incidentRef}\nTimes, names, descriptions, what was said. Saved as you type.`}
        spellCheck={false}
      />
    </div>
  );

  if (popped) {
    return (
      <PopoutWindow id="mdt-notes" title={`Notebook · ${unitCallsign}`} width={520} height={480} onClose={() => setPopped(false)}>
        <PopoutFrame title={`Notebook · ${unitCallsign} · ${incidentRef}`} onDock={() => setPopped(false)} className="vec-notepad-frame">
          {pad}
        </PopoutFrame>
      </PopoutWindow>
    );
  }

  if (minimised) {
    return (
      <button type="button" className="vec-notepad-tab" onClick={() => setMinimised(false)} title="Open the notebook">
        ✎ Notebook{text.trim() ? ` · ${text.split("\n").filter((l) => l.trim()).length}` : ""}
      </button>
    );
  }

  return (
    <Rnd
      default={{ x: 24, y: 120, width: 380, height: 300 }}
      minWidth={260}
      minHeight={180}
      bounds="parent"
      dragHandleClassName="vec-notepad-handle"
      className="vec-notepad"
    >
      <header className="vec-notepad-handle">
        <span>✎ NOTEBOOK · {unitCallsign}</span>
        <div className="vec-mdt-handle-btns">
          <button type="button" title="Minimise" aria-label="Minimise" onClick={() => setMinimised(true)}>−</button>
          <button type="button" title="Pop out into its own window" aria-label="Pop out" onClick={() => setPopped(true)}>↗</button>
          <button type="button" title="Close" aria-label="Close" onClick={onClose}>×</button>
        </div>
      </header>
      {pad}
    </Rnd>
  );
}
