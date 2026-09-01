// The email an applicant gets when their advisor application has been
// reviewed and accepted.
//
// Same shape as the auth templates in supabase/templates: dark, the
// window logo beside the wordmark, bgcolor attributes alongside the
// inline styles so Outlook on Windows does not render it as light text
// on white.

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thewtchroom.co.uk";

export function advisorAcceptedEmail(): { subject: string; html: string } {
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
              You&rsquo;re on the development advisor programme &mdash; thank you. Your service background is what keeps this simulation honest.
            </p>
            <p style="margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#cdcdd4;">
              Sign in and your standing now shows as an advisor. If something in the simulation reads wrong to someone who has lived it, that is exactly what we want to hear.
            </p>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding:0 32px 28px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td bgcolor="#fbbf24" style="background:#fbbf24;border-radius:3px;">
                  <a href="${SITE}/standby" style="display:inline-block;padding:14px 30px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600;color:#000000;text-decoration:none;">Open the Watch Room</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td bgcolor="#111114" style="padding:18px 32px;background:#111114;border-top:1px solid #1d1d22;">
            <p style="margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#a8a8b3;">
              A member of the team may be in touch about verifying your position.
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
