// The one email. Every message the site sends — the auth templates in
// supabase/templates and the programme emails beside this file — is
// this shell with different words, so the inbox always sees the same
// sender, and the same sender it meets on the operator console: the
// logo beside the wordmark, an eyebrow, one heading, a status chip, the
// paragraphs, a facts block, one button, a notice, the same footer.
//
// Colours are the console's tokens (src/app/menu/watch-menu.module.css)
// written out as literals, because mail clients ignore custom
// properties. Dark, because the logo's frame is light and on white all
// that survives is the amber pane. bgcolor attributes sit alongside the
// inline styles on purpose: Outlook on Windows ignores CSS backgrounds
// on table cells and would otherwise render light text on white. The
// img carries an empty alt because the wordmark beside it already says
// who sent the mail, and most clients block remote images anyway.

export const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thewtchroom.co.uk";

/** The programme's Discord. */
export const COMMUNITY_URL = "https://discord.gg/YBN3sbphs3";

const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

const C = {
  bg: "#0f1214",
  panel: "#151a1c",
  panel2: "#191f21",
  line: "#262d2f",
  line2: "#323a3c",
  text: "#ecece5",
  muted: "#a3adab",
  dim: "#76817f",
  amber: "#e6b65c",
  ink: "#1b1d17",
} as const;

const TONES = {
  ok: { fg: "#4fc16d", bg: "#152118", line: "#2f6a41" },
  amber: { fg: "#e6b65c", bg: "#2a2519", line: "#5a4a26" },
  critical: { fg: "#e5736a", bg: "#2a1a18", line: "#6b3a36" },
  info: { fg: "#8bbcf0", bg: "#15202a", line: "#35506b" },
  neutral: { fg: "#a3adab", bg: "#191f21", line: "#323a3c" },
} as const;

export type EmailTone = keyof typeof TONES;

export type EmailSpec = {
  /** The line under the wordmark: which part of the site is writing. */
  programme: string;
  /** The amber line above the heading. Defaults to the programme. */
  eyebrow?: string;
  heading: string;
  /** A short verdict beside the heading: Accepted, Invited, Open. */
  stamp?: { text: string; tone: EmailTone };
  /** One sentence under the heading, larger than the body. */
  lede?: string;
  /** Body paragraphs, as HTML (links and emphasis allowed). */
  paragraphs: string[];
  /** Label and value rows in a panel, the way the console states facts. */
  facts?: { label: string; value: string }[];
  cta?: { label: string; href: string };
  /** Print the button's address under it, for clients that strip links. */
  showLink?: boolean;
  /** A notice after the button: a rule down the left, a title, a line. */
  callout?: { title?: string; body: string; tone?: EmailTone };
  /** One line in the footer, above the standard sign-off. */
  note?: string;
  /** Inbox preview text; hidden in the message itself. */
  preheader?: string;
  /** Where the logo is served from. The auth templates pass Supabase's
   *  site placeholder; everything else uses SITE. */
  site?: string;
  /** The domain as printed in the footer, when `site` is a placeholder. */
  siteLabel?: string;
};

/** A link in body copy, in the console's amber. */
export function emailLink(href: string, label: string): string {
  return `<a href="${href}" style="color:${C.amber};text-decoration:underline;">${label}</a>`;
}

export function emailShell(spec: EmailSpec): string {
  const site = spec.site ?? SITE;
  const domain = spec.siteLabel ?? site.replace(/^https?:\/\//, "");
  const p = (html: string, mb = 14) =>
    `<p style="margin:0 0 ${mb}px;font-family:${SANS};font-size:14.5px;line-height:1.65;color:${C.muted};">${html}</p>`;

  const preheader = spec.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${C.bg};">${spec.preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>\n`
    : "";

  const stamp = spec.stamp
    ? (() => {
        const t = TONES[spec.stamp.tone];
        return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">
              <tr>
                <td bgcolor="${t.bg}" style="background:${t.bg};border:1px solid ${t.line};border-radius:3px;padding:6px 10px;">
                  <span style="font-family:${MONO};font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:600;color:${t.fg};">${spec.stamp.text}</span>
                </td>
              </tr>
            </table>`;
      })()
    : "";

  const lede = spec.lede
    ? `<p style="margin:0 0 16px;font-family:${SANS};font-size:16px;line-height:1.55;color:${C.text};">${spec.lede}</p>`
    : "";

  const facts = spec.facts?.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${C.panel2}" style="background:${C.panel2};border:1px solid ${C.line};border-radius:4px;margin:4px 0 18px;">
              ${spec.facts
                .map(
                  (f, i) => `<tr>
                <td width="128" valign="top" style="padding:${i === 0 ? 12 : 8}px 0 ${i === spec.facts!.length - 1 ? 12 : 8}px 16px;font-family:${MONO};font-size:10px;line-height:1.9;letter-spacing:1.8px;text-transform:uppercase;color:${C.dim};">${f.label}</td>
                <td valign="top" style="padding:${i === 0 ? 12 : 8}px 16px ${i === spec.facts!.length - 1 ? 12 : 8}px 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${C.text};">${f.value}</td>
              </tr>`,
                )
                .join("\n              ")}
            </table>`
    : "";

  const cta = spec.cta
    ? `<tr>
          <td align="left" style="padding:4px 28px 6px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td bgcolor="${C.amber}" style="background:${C.amber};border-radius:4px;">
                  <a href="${spec.cta.href}" style="display:inline-block;padding:12px 22px;font-family:${SANS};font-size:13px;font-weight:600;color:${C.ink};text-decoration:none;">${spec.cta.label}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>${
          spec.showLink
            ? `
        <tr>
          <td style="padding:8px 28px 4px;">
            <p style="margin:0 0 4px;font-family:${SANS};font-size:12px;line-height:1.6;color:${C.dim};">If the button does not open, paste this address into your browser:</p>
            <p style="margin:0;font-family:${MONO};font-size:11.5px;line-height:1.5;color:${C.muted};word-break:break-all;">${spec.cta.href.replace(/&/g, "&amp;")}</p>
          </td>
        </tr>`
            : ""
        }`
    : "";

  const callout = spec.callout
    ? (() => {
        const t = TONES[spec.callout.tone ?? "amber"];
        return `<tr>
          <td style="padding:14px 28px 6px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${C.panel2}" style="background:${C.panel2};border-left:2px solid ${t.fg};border-radius:0 4px 4px 0;">
              <tr>
                <td style="padding:11px 14px;">
                  ${spec.callout.title ? `<p style="margin:0 0 3px;font-family:${SANS};font-size:12.5px;font-weight:600;color:${C.text};">${spec.callout.title}</p>` : ""}
                  <p style="margin:0;font-family:${SANS};font-size:12.5px;line-height:1.65;color:${C.muted};">${spec.callout.body}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
      })()
    : "";

  return `${preheader}<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${C.bg}" style="background:${C.bg};margin:0;padding:32px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${C.panel}" style="max-width:560px;background:${C.panel};border:1px solid ${C.line};border-radius:6px;">

        <tr>
          <td style="padding:16px 28px;border-bottom:1px solid ${C.line};">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td valign="middle" width="60" style="padding-right:12px;">
                  <img src="${site}/email-logo.png?v=2" width="60" height="40" alt="" style="display:block;width:60px;height:40px;border:0;" />
                </td>
                <td valign="middle">
                  <span style="font-family:${MONO};font-size:12px;letter-spacing:2.5px;text-transform:uppercase;color:${C.text};font-weight:600;white-space:nowrap;">The Watch Room</span>
                  <br />
                  <span style="font-family:${MONO};font-size:9.5px;letter-spacing:1.8px;text-transform:uppercase;color:${C.dim};">${spec.programme}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:26px 28px 4px;">
            <p style="margin:0 0 10px;font-family:${MONO};font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${C.amber};">${spec.eyebrow ?? spec.programme}</p>
            <h1 style="margin:0 0 12px;font-family:${SANS};font-size:23px;line-height:1.3;color:${C.text};font-weight:600;letter-spacing:-0.01em;">${spec.heading}</h1>
            ${stamp}${lede}${spec.paragraphs.map((x, i) => p(x, i === spec.paragraphs.length - 1 ? 16 : 14)).join("\n            ")}
            ${facts}
          </td>
        </tr>
        ${cta}
        ${callout}
        <tr>
          <td style="padding:8px 28px 16px;"></td>
        </tr>

        <tr>
          <td bgcolor="${C.bg}" style="padding:16px 28px 18px;background:${C.bg};border-top:1px solid ${C.line};border-radius:0 0 6px 6px;">
            ${spec.note ? `<p style="margin:0 0 10px;font-family:${SANS};font-size:12px;line-height:1.6;color:${C.muted};">${spec.note}</p>` : ""}
            <p style="margin:0 0 6px;font-family:${MONO};font-size:9.5px;letter-spacing:2px;text-transform:uppercase;color:${C.dim};">The Watch Room &middot; Closed Pre-Alpha &middot; Greater Manchester</p>
            <p style="margin:0;font-family:${SANS};font-size:11px;line-height:1.6;color:${C.dim};">Sent to this address because an account at The Watch Room uses it. <a href="${site}" style="color:${C.muted};">${domain}</a></p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>`;
}
