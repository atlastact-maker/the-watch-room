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
Authentication → Emails → SMTP Settings. Any transactional provider
works — Resend, Postmark, SendGrid, Mailgun, Amazon SES. You give
Supabase the host, port, username and password, plus the sender address
and name.

Two things worth knowing before you pick one:

- **The sender domain needs DNS records** (SPF and DKIM, ideally DMARC).
  Without them, mail to Gmail and Outlook lands in spam or is rejected
  outright. Every provider above walks you through the records; they go
  in the same DNS as the site.
- **A `@gmail.com` address cannot be used as the sender.** Gmail's DMARC
  policy rejects mail claiming to be from `gmail.com` that Google did not
  send. Sending confirmation emails "from" a Gmail address will fail for
  a large share of recipients. Use a domain you control — for example
  `noreply@thewtchroom.co.uk`, with the DNS records above. A `@gmail.com`
  address is fine as the *reply-to* or contact address.
