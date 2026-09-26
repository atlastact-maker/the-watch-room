// The one email. Every message the site sends — the auth templates in
// supabase/templates and the programme emails beside this file — is
// this shell with different words, so the inbox always sees the same
// sender: the logo beside the wordmark, one heading, an optional stamp,
// the paragraphs, one button, the same footer.
//
// Dark, because the logo's frame and panes are light and on white all
// that survives is the amber pane. bgcolor attributes sit alongside the
// inline styles on purpose: Outlook on Windows ignores CSS backgrounds
// on table cells and would otherwise render light text on white. The
// img carries an empty alt because the wordmark beside it already says
// who sent the mail, and most clients block remote images anyway.

export const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thewtchroom.co.uk";

const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

const TONES = {
  ok: { fg: "#34d399", bg: "#0e2a20" },
  amber: { fg: "#fbbf24", bg: "#2a2210" },
  critical: { fg: "#f87171", bg: "#2a1414" },
  info: { fg: "#60a5fa", bg: "#10203a" },
} as const;

export type EmailTone = keyof typeof TONES;

export type EmailSpec = {
  /** The line under the wordmark: which part of the site is writing. */
  programme: string;
  heading: string;
  /** A short verdict beside the heading: Accepted, Invited, Open. */
  stamp?: { text: string; tone: EmailTone };
  /** Body paragraphs, as HTML (links and emphasis allowed). */
  paragraphs: string[];
  cta?: { label: string; href: string };
  /** Print the button's address under it, for clients that strip links. */
  showLink?: boolean;
  /** One line in the footer, above the standard sign-off. */
  note?: string;
  /** Where the logo is served from. The auth templates pass Supabase's
   *  site placeholder; everything else uses SITE. */
  site?: string;
  /** The domain as printed in the footer, when `site` is a placeholder. */
  siteLabel?: string;
};

export function emailShell(spec: EmailSpec): string {
  const site = spec.site ?? SITE;
  const p = (html: string, mb = 14) =>
    `<p style="margin:0 0 ${mb}px;font-family:${SANS};font-size:15px;line-height:1.6;color:#cdcdd4;">${html}</p>`;
  const stamp = spec.stamp
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;">
              <tr>
                <td bgcolor="${TONES[spec.stamp.tone].bg}" style="background:${TONES[spec.stamp.tone].bg};border:1px solid ${TONES[spec.stamp.tone].fg};border-radius:3px;padding:7px 14px;">
                  <span style="font-family:${MONO};font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:600;color:${TONES[spec.stamp.tone].fg};">${spec.stamp.text}</span>
                </td>
              </tr>
            </table>`
    : "";
  const cta = spec.cta
    ? `<tr>
          <td align="left" style="padding:8px 32px 8px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td bgcolor="#fbbf24" style="background:#fbbf24;border-radius:3px;">
                  <a href="${spec.cta.href}" style="display:inline-block;padding:14px 28px;font-family:${MONO};font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600;color:#000000;text-decoration:none;">${spec.cta.label}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>${
          spec.showLink
            ? `
        <tr>
          <td style="padding:8px 32px 8px;">
            <p style="margin:0 0 4px;font-family:${SANS};font-size:13px;line-height:1.6;color:#a8a8b3;">If the button does not work, paste this into your browser:</p>
            <p style="margin:0;font-family:${MONO};font-size:12px;line-height:1.5;color:#cdcdd4;word-break:break-all;">${spec.cta.href.replace(/&/g, "&amp;")}</p>
          </td>
        </tr>`
            : ""
        }`
    : "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#050507" style="background:#050507;margin:0;padding:32px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#0a0a0c" style="max-width:560px;background:#0a0a0c;border:1px solid #2a2a32;border-radius:4px;">

        <tr>
          <td bgcolor="#111114" style="padding:20px 32px;background:#111114;border-bottom:1px solid #1d1d22;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="middle" style="padding-right:14px;">
                  <img src="${site}/email-logo.png" width="96" height="64" alt="" style="display:block;width:96px;height:64px;border:0;" />
                </td>
                <td valign="middle">
                  <span style="font-family:${MONO};font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#f4f4f6;font-weight:600;">The Watch Room</span>
                  <br />
                  <span style="font-family:${MONO};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a8b3;">${spec.programme}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:30px 32px 6px;">
            <h1 style="margin:0 0 14px;font-family:${SANS};font-size:21px;line-height:1.35;color:#f4f4f6;font-weight:600;">${spec.heading}</h1>
            ${stamp}${spec.paragraphs.map((x, i) => p(x, i === spec.paragraphs.length - 1 ? 10 : 14)).join("\n            ")}
          </td>
        </tr>
        ${cta}
        <tr>
          <td style="padding:6px 32px 18px;"></td>
        </tr>

        <tr>
          <td bgcolor="#111114" style="padding:18px 32px;background:#111114;border-top:1px solid #1d1d22;">
            ${spec.note ? `<p style="margin:0 0 8px;font-family:${SANS};font-size:12px;line-height:1.6;color:#a8a8b3;">${spec.note}</p>` : ""}
            <p style="margin:0 0 4px;font-family:${MONO};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#71717a;">The Watch Room &middot; Closed pre-alpha</p>
            <p style="margin:0;font-family:${SANS};font-size:11px;line-height:1.6;color:#71717a;">You are receiving this because an account at The Watch Room uses this address. <a href="${site}" style="color:#a8a8b3;">${spec.siteLabel ?? site.replace(/^https?:\/\//, "")}</a></p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>`;
}
