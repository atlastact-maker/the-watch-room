"use client";

// One-click copy for the things an operator pastes elsewhere — an address,
// a reference, a VRM, a caller's number. Shows "Copied" for a moment.

import { useEffect, useState } from "react";
import { copyText } from "./model";

export function CopyButton({ text, label, className = "", title }: { text: string; label?: string; className?: string; title?: string }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => setDone(false), 1200);
    return () => clearTimeout(id);
  }, [done]);
  return (
    <button
      type="button"
      className={`vec-copy ${className}`}
      title={title ?? `Copy ${label ?? text}`}
      aria-label={`Copy ${label ?? text}`}
      onClick={(e) => {
        e.stopPropagation();
        copyText(text);
        setDone(true);
      }}
    >
      {label ? <span className="lbl">{label}</span> : null}
      <span className="glyph">{done ? "✓ Copied" : "⧉"}</span>
    </button>
  );
}
