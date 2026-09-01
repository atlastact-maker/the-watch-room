// Transactional email, sent by us rather than by Supabase.
//
// Supabase sends the auth emails (confirmation, password reset) through
// its own SMTP settings. This is for mail the app itself decides to
// send — currently the one telling an applicant their advisor
// application has been reviewed.
//
// Server-only: RESEND_API_KEY must never reach the browser, so nothing
// here may be imported from a client component.

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** Must be an address on a domain verified in Resend. A gmail.com
 *  sender is rejected by Gmail's DMARC policy for a large share of
 *  recipients — see supabase/templates/README.md. */
const DEFAULT_FROM = "The Watch Room <noreply@thewtchroom.co.uk>";

export type SendResult = { sent: boolean; reason?: string };

/** Best-effort, and deliberately so: this never throws and never
 *  rejects. Callers act on the result if they want to, but a mail
 *  problem must not roll back the thing the mail was about — accepting
 *  an advisor has to succeed whether or not the email goes out. */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, reason: "RESEND_API_KEY is not set" };
  if (!opts.to.trim()) return { sent: false, reason: "no recipient" };

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? DEFAULT_FROM,
        to: [opts.to.trim()],
        subject: opts.subject,
        html: opts.html,
      }),
    });
    if (!res.ok) {
      // Resend's body says which of the usual causes it is — unverified
      // domain, bad key, sender not on the domain.
      const body = await res.text().catch(() => "");
      return { sent: false, reason: `resend ${res.status}: ${body.slice(0, 300)}` };
    }
    return { sent: true };
  } catch (err) {
    return {
      sent: false,
      reason: err instanceof Error ? err.message : "unknown error",
    };
  }
}
