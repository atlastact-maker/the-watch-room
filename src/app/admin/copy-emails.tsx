"use client";

// One button: the list of addresses onto the clipboard, ready for a BCC
// field. The mailto link beside it does the same without JavaScript,
// where the mail client allows a long address list.

import { useState } from "react";

export function CopyEmails({ emails, className }: { emails: string[]; className: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(emails.join(", "));
      setState("copied");
    } catch {
      setState("failed");
    }
    window.setTimeout(() => setState("idle"), 2500);
  }
  return (
    <button type="button" onClick={copy} className={className} disabled={emails.length === 0}>
      {state === "copied" ? "Copied" : state === "failed" ? "Select and copy below" : `Copy ${emails.length} email${emails.length === 1 ? "" : "s"}`}
    </button>
  );
}
