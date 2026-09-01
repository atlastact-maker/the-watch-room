# TikTok slides — Development Advisor Programme

Six 1080×1920 frames for a TikTok photo post, in posting order:

| # | Artboard | Beat |
|---|----------|------|
| 01 | `Main` | Hook — you've done the job, help us get it right |
| 02 | `WhatItIs` | What The Watch Room is |
| 03 | `WhoWeWant` | Who we're looking for |
| 04 | `AdvisingOn` | What you'd be advising on |
| 05 | `WhatItAsks` | Commitment, terms, what you get |
| 06 | `Apply` | Call to action |

Everything is lifted from the live site rather than invented: the tokens in
`src/app/globals.css`, the Geist / Geist Mono pairing from `src/app/layout.tsx`
(embedded here as woff2 so exports keep the real faces), the status strip and
chip anatomy from the landing page, the service marks from
`src/app/components/service-insignia.tsx`, and the copy from the landing page
and `src/lib/auth/schemas.ts`.

The dark band under each footer is deliberate: that is where TikTok paints the
caption, the username and the right-hand action rail.

## Working with them

`build-artboards.py` is the source of truth — edit it and re-run:

```bash
python3 build-artboards.py
```

It writes the `.dc.html` artboards (seeded onto the design canvas alongside
`canvas.json`) and `preview/*.html`, plain standalone copies used to render the
flat PNGs in `preview/`.
