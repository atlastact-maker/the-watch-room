// The newsletter: the Friday update and any longer programme message, as
// a complete email document in the same design as the transactional
// shell (layout.ts). Where the shell is one heading and one button, a
// newsletter is sections: headings, paragraphs, a timeline, numbered
// steps, tinted cards, titled rows, then the button, a sign-off and the
// footer with the list's unsubscribe link. Each section is a function
// returning table markup, so a new issue is composed, not written.

import { C, MONO, SANS, TONES, type EmailTone } from "./layout";

const SITE_LABEL = "thewtchroom.co.uk";
const SITE_URL = "https://thewtchroom.co.uk";

export const SERVICE_TINT_EMAIL: Record<"Fire" | "Ambulance" | "Police", string> = { Fire: "#f08a3e", Ambulance: "#4fc16d", Police: "#4f9ff2" };

const px = (n: number) => `${n}px`;
const sans = (size: number, color: string, extra = "") => `font-family:${SANS};font-size:${px(size)};line-height:1.6;color:${color};${extra}`;
const mono = (size: number, color: string, spacing = 1.8) => `font-family:${MONO};font-size:${px(size)};letter-spacing:${spacing}px;text-transform:uppercase;color:${color};`;

/** A section heading. */
export function heading(text: string): string {
  return `<h2 style="margin:28px 0 10px;${sans(17, C.text, "line-height:1.35;font-weight:600;")}">${text}</h2>`;
}

/** A body paragraph (HTML allowed). */
export function para(html: string, opts: { muted?: boolean; mb?: number } = {}): string {
  return `<p style="margin:0 0 ${px(opts.mb ?? 14)};${sans(14.5, opts.muted ? C.dim : C.muted, "line-height:1.65;")}">${html}</p>`;
}

/** A status chip, the shell's stamp. */
export function chip(text: string, tone: EmailTone = "amber"): string {
  const t = TONES[tone];
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;"><tr><td bgcolor="${t.bg}" style="background:${t.bg};border:1px solid ${t.line};border-radius:3px;padding:6px 10px;"><span style="font-family:${MONO};font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:600;color:${t.fg};">${text}</span></td></tr></table>`;
}

/** Dated rows; the current one is marked. */
export function timeline(items: { when: string; body: string; state?: "past" | "current" | "future" | "open" }[]): string {
  const rows = items
    .map((it) => {
      const current = it.state === "current";
      const past = it.state === "past";
      const dot = current ? `<span style="color:${C.amber};">&#9679;</span>&nbsp;` : past ? `<span style="color:${TONES.ok.fg};">&#9679;</span>&nbsp;` : `<span style="color:${C.line2};">&#9679;</span>&nbsp;`;
      return `<tr><td style="padding:11px 0;border-top:1px solid ${C.line};">
        <p style="margin:0 0 3px;${mono(10.5, current ? C.amber : C.dim, 1.5)}line-height:1.6;">${dot}${it.when}</p>
        <p style="margin:0;${sans(14, past ? C.dim : C.muted)}">${it.body}</p>
      </td></tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom:1px solid ${C.line};margin:0 0 4px;">${rows}</table>`;
}

/** Numbered steps with a bold lead-in. */
export function steps(items: { title: string; body: string }[]): string {
  const rows = items
    .map(
      (it, i) => `<tr>
        <td valign="top" width="30" style="width:30px;padding:0 10px 14px 0;"><span style="display:inline-block;min-width:22px;padding:3px 0;border-radius:3px;background:${TONES.amber.bg};text-align:center;font-family:${MONO};font-size:10px;font-weight:600;letter-spacing:1px;color:${C.amber};">${String(i + 1).padStart(2, "0")}</span></td>
        <td valign="top" style="padding:0 0 14px;${sans(14, C.muted)}"><strong style="color:${C.text};font-weight:600;">${it.title}.</strong> ${it.body}</td>
      </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>`;
}

/** A card with a tinted rule down the left: the opening scenarios. */
export function card(c: { tint: string; label: string; title: string; body: string; note?: { lead: string; text: string } }): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 10px;border-collapse:separate;">
    <tr>
      <td width="4" bgcolor="${c.tint}" style="width:4px;background:${c.tint};border-radius:3px 0 0 3px;font-size:0;line-height:0;">&nbsp;</td>
      <td bgcolor="${C.panel2}" style="background:${C.panel2};border:1px solid ${C.line};border-left:0;border-radius:0 3px 3px 0;padding:16px 18px 16px 16px;">
        <p style="margin:0 0 6px;${mono(10, c.tint, 1.5)}">${c.label}</p>
        <p style="margin:0 0 8px;${sans(16, C.text, "line-height:1.4;font-weight:600;")}">${c.title}</p>
        <p style="margin:0${c.note ? " 0 10px" : ""};${sans(14, C.muted)}">${c.body}</p>
        ${c.note ? `<p style="margin:0;${sans(13, C.amber)}"><strong style="font-weight:600;">${c.note.lead}:</strong> ${c.note.text}</p>` : ""}
      </td>
    </tr>
  </table>`;
}

/** Titled rows with hairlines: systems, responsibilities, exclusions. */
export function rows(items: { title: string; body: string }[]): string {
  const r = items
    .map(
      (it) => `<tr><td style="padding:12px 0;border-top:1px solid ${C.line};">
        <p style="margin:0 0 3px;${sans(14, C.text, "line-height:1.5;font-weight:600;")}">${it.title}</p>
        <p style="margin:0;${sans(14, C.muted)}">${it.body}</p>
      </td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom:1px solid ${C.line};margin:0 0 4px;">${r}</table>`;
}

export function link(href: string, label: string): string {
  return `<a href="${href}" style="color:${C.amber};text-decoration:underline;">${label}</a>`;
}

export type NewsletterSpec = {
  /** The <title> and the subject line. */
  title: string;
  preheader: string;
  /** Under the wordmark: which part of the site is writing. */
  programme: string;
  /** The amber line above the heading. */
  eyebrow: string;
  heading: string;
  /** A chip under the heading. */
  stamp?: { text: string; tone: EmailTone };
  /** The body: section markup from the builders above, in order. */
  body: string[];
  cta?: { label: string; href: string };
  signoff?: { closing: string; name: string };
  /** The footer's reason line. The unsubscribe placeholder is the list provider's. */
  reason: string;
  unsubscribeUrl?: string;
};

export function newsletterDocument(spec: NewsletterSpec): string {
  const cta = spec.cta
    ? `<tr><td class="px" align="left" style="padding:18px 28px 6px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="${C.amber}" style="background:${C.amber};border-radius:4px;"><a href="${spec.cta.href}" style="display:inline-block;padding:12px 22px;font-family:${SANS};font-size:13px;font-weight:600;color:${C.ink};text-decoration:none;">${spec.cta.label}</a></td></tr></table>
        </td></tr>`
    : "";
  const signoff = spec.signoff
    ? `<tr><td class="px" style="padding:20px 28px 26px;">
          <p style="margin:0 0 2px;${sans(14.5, C.muted)}">${spec.signoff.closing}</p>
          <p style="margin:0;${sans(14.5, C.text)}">${spec.signoff.name}</p>
        </td></tr>`
    : `<tr><td style="padding:8px 28px 18px;"></td></tr>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${spec.title}</title>
<style>
  @media only screen and (max-width: 600px) {
    .px { padding-left: 18px !important; padding-right: 18px !important; }
    .h1 { font-size: 20px !important; }
  }
</style>
</head>
<body bgcolor="${C.bg}" style="margin:0;padding:0;background:${C.bg};">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${spec.preheader}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${C.bg}" style="background:${C.bg};margin:0;padding:32px 12px;">
  <tr>
    <td align="center">
      <!--[if mso]><table role="presentation" width="560" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${C.panel}" style="max-width:560px;background:${C.panel};border:1px solid ${C.line};border-radius:6px;">

        <tr>
          <td class="px" style="padding:16px 28px;border-bottom:1px solid ${C.line};">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td valign="middle" width="60" style="padding-right:12px;">
                  <img src="${SITE_URL}/email-logo.png?v=2" width="60" height="40" alt="" style="display:block;width:60px;height:40px;border:0;" />
                </td>
                <td valign="middle">
                  <span style="font-family:${MONO};font-size:12px;letter-spacing:2.5px;text-transform:uppercase;color:${C.text};font-weight:600;white-space:nowrap;">The Watch Room</span>
                  <br />
                  <span style="${mono(9.5, C.dim)}">${spec.programme}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td class="px" style="padding:26px 28px 8px;">
            <p style="margin:0 0 10px;font-family:${MONO};font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${C.amber};">${spec.eyebrow}</p>
            <h1 class="h1" style="margin:0 0 12px;${sans(23, C.text, "line-height:1.3;font-weight:600;letter-spacing:-0.01em;")}">${spec.heading}</h1>
            ${spec.stamp ? chip(spec.stamp.text, spec.stamp.tone) : ""}
            ${spec.body.join("\n            ")}
          </td>
        </tr>
        ${cta}
        ${signoff}

        <tr>
          <td class="px" bgcolor="${C.bg}" style="padding:16px 28px 18px;background:${C.bg};border-top:1px solid ${C.line};border-radius:0 0 6px 6px;">
            <p style="margin:0 0 6px;${mono(9.5, C.dim, 2)}">The Watch Room &middot; Closed Pre-Alpha &middot; Greater Manchester</p>
            <p style="margin:0;${sans(11, C.dim)}">${spec.reason}${spec.unsubscribeUrl ? ` <a href="${spec.unsubscribeUrl}" style="color:${C.muted};">Unsubscribe</a> &middot;` : ""} <a href="${SITE_URL}" style="color:${C.muted};">${SITE_LABEL}</a></p>
          </td>
        </tr>

      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td>
  </tr>
</table>
</body>
</html>
`;
}
