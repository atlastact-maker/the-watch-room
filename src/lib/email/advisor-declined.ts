// The email an applicant gets when their advisor application has been
// reviewed and not taken forward.
//
// The tone matters more here than anywhere else on the site. These are
// people who offered their own service experience for nothing; a "no"
// should read as a decision about the programme's size and shape, not a
// judgement on them, and it should leave the door open.

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thewtchroom.co.uk";

export function advisorDeclinedEmail(): { subject: string; html: string } {
  return {
    subject: "Your advisor application — The Watch Room",
    html: `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#050507" style="background:#050507;margin:0;padding:32px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#0a0a0c" style="max-width:560px;background:#0a0a0c;border:1px solid #2a2a32;border-radius:4px;">

        <tr>
          <td bgcolor="#111114" style="padding:22px 32px;background:#111114;border-bottom:1px solid #1d1d22;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="middle" style="padding-right:14px;">
                  <img src="${SITE}/email-logo.png" width="120" height="80" alt="" style="display:block;width:120px;height:80px;border:0;" />
                </td>
                <td valign="middle">
                  <span style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#f4f4f6;font-weight:600;">The Watch Room</span>
                  <br />
                  <span style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a8b3;">Advisor Programme</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 32px 8px;">
            <h1 style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:21px;line-height:1.35;color:#f4f4f6;font-weight:600;">Your application has been reviewed</h1>
            <p style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#cdcdd4;">
              Thank you for offering to advise on The Watch Room. We are not taking your application forward onto the programme at this stage.
            </p>
            <p style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#cdcdd4;">
              That is a decision about how many advisors the programme can work with properly while it is small, and which areas it needs covered right now &mdash; not a judgement on your experience. We keep applications on file, and the picture changes as development moves on.
            </p>
            <p style="margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#cdcdd4;">
              Your account stays exactly as it is, and Pre-Alpha testing opens to registered operators in October 2026.
            </p>
          </td>
        </tr>

        <tr>
          <td bgcolor="#111114" style="padding:18px 32px;background:#111114;border-top:1px solid #1d1d22;">
            <p style="margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#a8a8b3;">
              Thank you again for the offer &mdash; it is genuinely appreciated.
            </p>
            <p style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#71717a;">
              The Watch Room &middot; Closed development
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>`,
  };
}
