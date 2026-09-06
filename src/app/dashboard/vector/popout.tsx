"use client";

// Pop-out windows — a panel lifted into its own browser window so it can
// sit on a second screen. React keeps rendering it (a portal into the
// child document), the child gets the app's stylesheets and the current
// theme, and closing the window docks the panel back on the desk. The
// browser has to allow the popup; when it does not, the panel stays put.
//
// Open windows are kept in a registry keyed by id. A component that
// unmounts and remounts straight away (React's development double
// mount, a parent re-keying) picks its window back up instead of
// closing and reopening it.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useVectorTheme } from "./theme";

type Entry = { win: Window; root: HTMLElement; closeTimer: number | null; closing: boolean };
const registry = new Map<string, Entry>();

function copyStyles(from: Document, to: Document) {
  for (const node of Array.from(from.querySelectorAll('link[rel="stylesheet"], style'))) {
    if (node instanceof HTMLLinkElement) {
      const link = to.createElement("link");
      link.rel = "stylesheet";
      link.href = node.href;
      to.head.appendChild(link);
    } else {
      to.head.appendChild(node.cloneNode(true));
    }
  }
}

function openEntry(id: string, title: string, width: number, height: number): Entry | null {
  const existing = registry.get(id);
  if (existing && !existing.win.closed) {
    if (existing.closeTimer !== null) window.clearTimeout(existing.closeTimer);
    existing.closeTimer = null;
    return existing;
  }
  const win = window.open("", `vector-${id}`, `popup=yes,width=${width},height=${height}`);
  if (!win) return null;
  const doc = win.document;
  doc.open();
  doc.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title} · VECTOR</title></head><body></body></html>`);
  doc.close();
  doc.documentElement.className = document.documentElement.className;
  copyStyles(document, doc);
  const style = doc.createElement("style");
  style.textContent = `html,body{margin:0;height:100%;overflow:hidden}body{display:flex}`;
  doc.head.appendChild(style);
  const root = doc.createElement("div");
  root.className = "cad-application vec-popout";
  doc.body.appendChild(root);
  const entry: Entry = { win, root, closeTimer: null, closing: false };
  registry.set(id, entry);
  return entry;
}

export function PopoutWindow({
  id,
  title,
  width = 720,
  height = 640,
  onClose,
  onBlocked,
  children,
}: {
  id: string;
  title: string;
  width?: number;
  height?: number;
  /** The window was closed by the user — dock the panel back. */
  onClose: () => void;
  onBlocked?: () => void;
  children: ReactNode;
}) {
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const { theme } = useVectorTheme();
  const onCloseRef = useRef(onClose);
  const onBlockedRef = useRef(onBlocked);
  useEffect(() => {
    onCloseRef.current = onClose;
    onBlockedRef.current = onBlocked;
  });

  useEffect(() => {
    const entry = openEntry(id, title, width, height);
    if (!entry) {
      const t = window.setTimeout(() => {
        onBlockedRef.current?.();
        onCloseRef.current();
      }, 0);
      return () => window.clearTimeout(t);
    }
    const { win } = entry;
    // The person closed the window: dock the panel. Our own close (the
    // component going away) is not that.
    const closed = () => {
      if (!entry.closing) onCloseRef.current();
    };
    win.addEventListener("pagehide", closed);
    const closeChild = () => {
      entry.closing = true;
      win.close();
    };
    window.addEventListener("pagehide", closeChild);
    const t = window.setTimeout(() => setRoot(entry.root), 0);
    return () => {
      window.clearTimeout(t);
      win.removeEventListener("pagehide", closed);
      window.removeEventListener("pagehide", closeChild);
      // Close a moment later, unless a remount claims the window first.
      entry.closeTimer = window.setTimeout(() => {
        registry.delete(id);
        entry.closing = true;
        if (!win.closed) win.close();
      }, 200);
    };
    // The window is opened once for this id; size changes never reopen it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const win = registry.get(id)?.win;
    if (!root || !win || win.closed) return;
    win.document.documentElement.setAttribute("data-cad-theme", theme);
    win.document.title = `${title} · VECTOR`;
  }, [id, root, theme, title]);

  if (!root) return null;
  return createPortal(children, root);
}

/** The frame a popped-out panel sits in: a VECTOR handle with a dock
 *  button, then the panel's own body filling the window. */
export function PopoutFrame({ title, onDock, children, className = "" }: { title: string; onDock: () => void; children: ReactNode; className?: string }) {
  return (
    <div className={`vec-popout-frame ${className}`}>
      <div className="vec-tile-handle static">
        <span className="t"><span>{title}</span><span className="cnt">POPPED OUT</span></span>
        <button type="button" className="txt" onClick={onDock} title="Bring this panel back to the desk">
          Dock
        </button>
      </div>
      <div className="vec-tile-body">{children}</div>
    </div>
  );
}

/** Wraps any panel: docked it renders in place, popped it renders in its
 *  own window. Used for the legacy panels that carry their own frames. */
export function Poppable({ id, title, popped, onDock, onBlocked, children }: { id: string; title: string; popped: boolean; onDock: () => void; onBlocked?: () => void; children: ReactNode }) {
  if (!popped) return <>{children}</>;
  return (
    <PopoutWindow id={id} title={title} onClose={onDock} onBlocked={onBlocked}>
      <PopoutFrame title={title} onDock={onDock} className="legacy">
        {children}
      </PopoutFrame>
    </PopoutWindow>
  );
}
