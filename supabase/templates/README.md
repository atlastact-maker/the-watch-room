# Auth email templates

The two emails an applicant ever receives. Kept here so they are version
controlled and reviewable; Supabase does not read this directory — the
markup has to be pasted into the dashboard.

## Installing a template

Supabase dashboard → **Authentication → Email Templates**, pick the
template, paste the file's contents into *Message body*, save.

| File | Template | Subject to set |
| --- | --- | --- |
| `confirm-signup.html` | Confirm signup | Confirm your email — The Watch Room |
| `reset-password.html` | Reset password | Set a new password — The Watch Room |

Both use the `token_hash` link style, which calls `/auth/confirm` on the
site directly instead of bouncing through Supabase's verify endpoint
first. One hop, and it does not depend on the Redirect URLs allowlist.
`/auth/confirm` also still accepts the `?code=` style, so switching back
to a default template will not break anything.

## Dark, and the logo

Both emails are dark, using the site's own tokens from `globals.css`, so
the logo reads as designed — its frame and panes are light, and on a
white background all that survives is the single amber pane.

`bgcolor` attributes sit alongside the inline `style` backgrounds on
purpose. Outlook on Windows ignores CSS backgrounds on table cells, and
without the attribute the email renders as light text on white — the
worst of both.

The mark is `public/email-logo.png`, served from
`https://thewtchroom.co.uk/email-logo.png`; email clients cannot use
relative paths. It is shown beside the wordmark rather than instead of
it, because most clients block remote images by default and the header
still has to say who sent the mail. The `img` carries an empty `alt` for
the same reason — the text beside it already does.

> The PNG was rebuilt from a screenshot of the logo rather than exported
> from the original artwork. Geometry and colours match what was
> supplied, but if the source file exists, replacing `public/email-logo.png`
> with a 360×240 export of it is the better answer.

The asset stays reachable despite the site being closed to
non-administrators because `proxy.ts`'s matcher excludes image
extensions, and static files in `public/` have no page gate. Narrow that
matcher and the logo becomes a broken image in every email already sent.

## Settings these templates depend on

**Authentication → URL Configuration**

- **Site URL** — `https://thewtchroom.co.uk`. The templates build their
  links from `{{ .SiteURL }}`, so if this is wrong (a `localhost:3000`
  left over from development, say) every link in every email points at a
  machine that is not the website.
- **Redirect URLs** — include `https://thewtchroom.co.uk/**`.

## Sending from your own address

By default Supabase sends from `noreply@mail.app.supabase.io`, which
cannot be changed — it is their shared sending infrastructure, and it is
rate limited to a handful of emails per hour.

To send from an address of your own, set up **custom SMTP**:
Authentication → Emails → SMTP Settings. Supabase does the sending; the
provider only carries the mail, so no application code is involved and
no key belongs in this repository or in Vercel.

Two things worth knowing whichever provider you use:

- **The sender domain needs DNS records** (SPF and DKIM, ideally DMARC).
  Without them, mail to Gmail and Outlook lands in spam or is rejected
  outright. The records go in the same DNS as the site.
- **A `@gmail.com` address cannot be used as the sender.** Gmail's DMARC
  policy rejects mail claiming to be from `gmail.com` that Google did not
  send, so a large share of recipients would never receive it. Use a
  domain you control — `noreply@thewtchroom.co.uk`. A `@gmail.com`
  address is fine as the *reply-to* or contact address.

### Resend

1. **Verify the domain.** Resend → Domains → Add Domain →
   `thewtchroom.co.uk`. Resend lists the DNS records to add (a DKIM
   `TXT`, an SPF `TXT`, and for tracking a `CNAME`); add them wherever
   the domain's DNS lives and wait for Resend to show *Verified*. Until
   it does, Resend will only deliver to your own address, which looks
   exactly like a broken signup flow when someone else tries to register.

2. **Point Supabase at Resend's SMTP.** Authentication → Emails → SMTP
   Settings, enable custom SMTP:

   | Field | Value |
   | --- | --- |
   | Host | `smtp.resend.com` |
   | Port | `465` |
   | Username | `resend` (the literal word) |
   | Password | your Resend API key, `re_…` |
   | Sender email | `noreply@thewtchroom.co.uk` |
   | Sender name | The Watch Room |

   The API key is the SMTP password. It lives only in this Supabase
   field — not in `.env`, not in Vercel, not in this repository. Treat it
   like any other credential: if it is ever pasted somewhere it should
   not be, roll it in Resend rather than hoping.

3. **Raise the email rate limit.** Authentication → Rate Limits. The
   default is built around Supabase's shared sender and is far lower than
   Resend allows; leaving it means signups silently failing to send once
   a handful of people register in the same hour.

4. **Send one real test.** Register a throwaway account and confirm the
   mail arrives from your own address, that the link points at
   `thewtchroom.co.uk` rather than localhost, and that it lands in the
   inbox rather than spam.
