// The email an account gets when an admin invites it to the pre-alpha:
// one link, and clicking it while logged in as that account opens the
// desk to them.
//
// Same shape as the auth templates in supabase/templates: dark, the
// window logo beside the wordmark, bgcolor attributes alongside the
// inline styles so Outlook on Windows does not render it as light text
// on white.

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thewtchroom.co.uk";

export function testerInvitedEmail(token: string, opts: { doorsOpen?: boolean } = {}): { subject: string; html: string } {
  const doorsOpen = opts.doorsOpen !== false;
  const link = `${SITE}/prealpha/invite/${encodeURIComponent(token)}`;
  return {
    subject: "You are invited to the pre-alpha — The Watch Room",
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
                  <span style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a8b3;">Pre-alpha</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 32px 4px;">
            <h1 style="margin:0 0 14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:21px;line-height:1.35;color:#f4f4f6;font-weight:600;">You are invited to the pre-alpha</h1>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td bgcolor="#2a2210" style="background:#2a2210;border:1px solid #fbbf24;border-radius:3px;padding:8px 16px;">
                  <span style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13px;letter-spacing:3px;text-transform:uppercase;font-weight:600;color:#fbbf24;">Invited</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 32px 8px;">
            <p style="margin:0 0 10px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#a8a8b3;">What happens next</p>
            <p style="margin:0 0 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#cdcdd4;">
              ${doorsOpen
                ? "Press the button below while logged in to your Watch Room account and the desk opens to you: the live jobs, the whole desk from the 999 call to the debrief, and the tester room on the Discord. The link works for thirty days."
                : "Press the button below while logged in to your Watch Room account and you are on the tester list. The desk opens to every tester at once, and you will get an email the moment it does. The link works for thirty days."}
            </p>
            <p style="margin:0 0 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#cdcdd4;">
              Not in the Discord yet? <a href="https://discord.gg/YBN3sbphs3" style="color:#60a5fa;text-decoration:underline;">Join here</a> and we will add you to the tester room.
            </p>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding:0 32px 28px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td bgcolor="#fbbf24" style="background:#fbbf24;border-radius:3px;">
                  <a href="${link}" style="display:inline-block;padding:14px 30px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600;color:#000000;text-decoration:none;">Accept the invitation</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td bgcolor="#111114" style="padding:18px 32px;background:#111114;border-top:1px solid #1d1d22;">
            <p style="margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#a8a8b3;">
              Keep it in the room: no public footage or write-ups until the doors are open. Everything else, say on the Discord.
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
