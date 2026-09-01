#!/usr/bin/env python3
"""Build the TikTok advisor-programme artboards (.dc.html) for the design canvas.

Every slide is a 1080x1920 frame that reuses the site's own vocabulary:
the tokens from src/app/globals.css, the Geist / Geist Mono pairing from
src/app/layout.tsx (embedded here as woff2 so PNG exports keep the real
faces), the chip and status-strip anatomy from the landing page, and the
service insignia from src/app/components/service-insignia.tsx.

Also writes preview/*.html — plain standalone copies of each frame, used
only to eyeball the layout for clipping. The .dc.html files are the ones
that get seeded onto the canvas.
"""

import base64
import pathlib

HERE = pathlib.Path(__file__).parent

# ---------------------------------------------------------------- tokens
BG = "#050507"
SURFACE = "#0a0a0c"
SURFACE_RAISED = "#111114"
BORDER_SUBTLE = "#1d1d22"
BORDER = "#2a2a32"
TEXT = "#f4f4f6"
MUTED = "#cdcdd4"
DIM = "#a8a8b3"
AMBER = "#fbbf24"
AMBER_DIM = "#d49416"
INFO = "#60a5fa"
CRITICAL = "#f87171"
OK = "#34d399"

SANS = "'Geist', system-ui, sans-serif"
MONO = "'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace"

SITE = "the-watch-room.vercel.app"

# ------------------------------------------------------------ typefaces
def face(name, path):
    b64 = base64.b64encode((HERE / path).read_bytes()).decode()
    return (
        "@font-face{font-family:'%s';font-style:normal;font-weight:100 900;"
        "font-display:block;src:url(data:font/woff2;base64,%s) format('woff2');}" % (name, b64)
    )

HELMET = (
    face("Geist", "geist.woff2")
    + face("Geist Mono", "geistmono.woff2")
    + "body{margin:0;background:%s;color:%s;font-family:%s;"
      "-webkit-font-smoothing:antialiased;}" % (BG, TEXT, SANS)
    + "a{color:%s;text-decoration:none;}a:hover{color:%s;}" % (AMBER, AMBER_DIM)
)

# ------------------------------------------------------------- insignia
INSIGNIA = {
    "fire": ("#dc2626", "FIRE &amp; RESCUE",
             '<path d="M14 5 L16 11 L22 9 L18 14 L22 19 L16 17 L14 23 L12 17 L6 19 L10 14 L6 9 L12 11 Z" fill="#fff"></path>'),
    "ambulance": ("#15803d", "AMBULANCE",
                  '<g stroke="#fff" stroke-width="3.2">'
                  '<line x1="14" y1="6" x2="14" y2="22"></line>'
                  '<line x1="7.1" y1="10" x2="20.9" y2="18"></line>'
                  '<line x1="7.1" y1="18" x2="20.9" y2="10"></line></g>'),
    "police": ("#1d4ed8", "POLICE",
               '<g fill="#fff">'
               '<rect x="4" y="9" width="5" height="5"></rect>'
               '<rect x="14" y="9" width="5" height="5"></rect>'
               '<rect x="9" y="14" width="5" height="5"></rect>'
               '<rect x="19" y="14" width="5" height="5"></rect></g>'),
    "control": ("#7c3aed", "CONTROL ROOM &middot; 999",
                '<g><path d="M8 16 v-2 a6 6 0 0 1 12 0 v2" fill="none" stroke="#fff" '
                'stroke-width="2.2" stroke-linecap="round"></path>'
                '<rect x="6.2" y="15" width="3.6" height="6" rx="1.4" fill="#fff"></rect>'
                '<rect x="18.2" y="15" width="3.6" height="6" rx="1.4" fill="#fff"></rect></g>'),
}


def symbol(key, size):
    colour, _, mark = INSIGNIA[key]
    return (
        '<svg width="%d" height="%d" viewBox="0 0 28 28" style="display:block;flex-shrink:0;">'
        '<rect x="1" y="1" width="26" height="26" rx="3" fill="%s" stroke="#fff" stroke-width="1.5"></rect>'
        '%s</svg>' % (size, size, colour, mark)
    )


# --------------------------------------------------------------- pieces
def eyebrow(text, colour=AMBER_DIM):
    return ('<div style="font-family:%s;font-size:26px;font-weight:500;letter-spacing:0.28em;'
            'text-transform:uppercase;color:%s;">%s</div>' % (MONO, colour, text))


def section_label(text):
    return ('<div style="font-family:%s;font-size:25px;font-weight:500;letter-spacing:0.25em;'
            'text-transform:uppercase;color:%s;">%s</div>' % (MONO, INFO, text))


def headline(lines, size=68, colour=TEXT):
    rows = "".join(
        '<div>%s</div>' % ln for ln in lines
    )
    return ('<div style="display:flex;flex-direction:column;font-size:%dpx;font-weight:600;'
            'line-height:1.08;letter-spacing:-0.025em;color:%s;text-wrap:pretty;">%s</div>'
            % (size, colour, rows))


def body(text, size=34, colour=MUTED):
    return ('<p style="margin:0;font-size:%dpx;line-height:1.5;color:%s;max-width:860px;'
            'text-wrap:pretty;">%s</p>' % (size, colour, text))


def chip(text, size=28):
    return ('<li style="border:1px solid %s;background:rgba(10,10,12,0.6);border-radius:4px;'
            'padding:14px 22px;font-family:%s;font-size:%dpx;color:%s;white-space:nowrap;">%s</li>'
            % (BORDER, MONO, size, MUTED, text))


def chiplist(items, size=28):
    return ('<ul style="display:flex;flex-wrap:wrap;gap:16px;margin:0;padding:0;list-style:none;">%s</ul>'
            % "".join(chip(i, size) for i in items))


def rule():
    return '<div style="height:1px;background:%s;"></div>' % BORDER_SUBTLE


def status_strip():
    return (
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:24px;'
        'padding-bottom:22px;border-bottom:1px solid %s;font-family:%s;font-size:23px;'
        'font-weight:500;letter-spacing:0.16em;text-transform:uppercase;">'
        '<div style="display:flex;align-items:center;gap:16px;">'
        '<span style="width:14px;height:14px;border-radius:50%%;background:%s;'
        'box-shadow:0 0 14px rgba(251,191,36,0.75);flex-shrink:0;"></span>'
        '<span style="color:%s;">The Watch Room</span></div>'
        '<span style="color:%s;">Closed development</span></div>'
        % (BORDER_SUBTLE, MONO, AMBER, TEXT, DIM)
    )


def footer_strip(index, right=None):
    right = right or SITE
    return (
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:24px;'
        'padding-top:26px;border-top:1px solid %s;font-family:%s;font-size:23px;'
        'letter-spacing:0.12em;color:%s;">'
        '<span style="color:%s;">%s</span><span>%s</span></div>'
        % (BORDER_SUBTLE, MONO, DIM, AMBER, right, index)
    )


def frame(content, index, footer_right=None):
    return (
        '<div style="position:relative;width:1080px;height:1920px;overflow:hidden;'
        'background:%s;font-family:%s;color:%s;">'
        # scanline texture, same recipe as globals.css (lifted a touch so it
        # survives TikTok's compression)
        '<div style="position:absolute;inset:0;pointer-events:none;background-image:'
        'linear-gradient(to bottom, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px,'
        ' transparent 1px, transparent 3px);"></div>'
        # console horizon — a faint amber glow off the bottom edge
        '<div style="position:absolute;left:0;right:0;bottom:-320px;height:760px;pointer-events:none;'
        'background:radial-gradient(ellipse at 50%% 100%%, rgba(251,191,36,0.10) 0%%,'
        ' rgba(251,191,36,0.03) 42%%, transparent 72%%);"></div>'
        # vignette, same recipe as the signup terminal
        '<div style="position:absolute;inset:0;pointer-events:none;background:'
        'radial-gradient(ellipse at 50%% 40%%, transparent 38%%, rgba(0,0,0,0.6) 100%%);"></div>'
        '<div style="position:relative;display:flex;flex-direction:column;height:1920px;'
        'padding:150px 88px 500px;box-sizing:border-box;">'
        '%s'
        '<div style="display:flex;flex-direction:column;flex-grow:1;padding-top:70px;padding-bottom:52px;gap:40px;">%s</div>'
        '%s'
        '</div></div>'
        % (BG, SANS, TEXT, status_strip(), content, footer_strip(index, footer_right))
    )


DC = """<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <style>%s</style>
</helmet>
%s
</x-dc>
<script data-dc-script data-props='{"$preview":{"width":1080,"height":1920}}'>
class Component extends DCLogic {}
</script>
</body>
</html>
"""

PREVIEW = """<!doctype html>
<html><head><meta charset="utf-8"><style>%s</style></head>
<body>%s</body></html>
"""

# --------------------------------------------------------------- slides
def slide_hook():
    badges = (
        '<div style="display:flex;align-items:center;gap:22px;">%s</div>'
        % "".join(symbol(k, 68) for k in ("fire", "ambulance", "police", "control"))
    )
    content = (
        eyebrow("Development Advisor Programme")
        + headline(["You&rsquo;ve done the job.", "Help us get it right."], size=82)
        + rule()
        + body("The Watch Room is an emergency services incident management "
               "simulator, in closed development. The details that make a control "
               "room feel like a control room come from the people who have sat in one.")
        + '<div style="flex-grow:1;"></div>'
        + ('<div style="display:flex;flex-direction:column;gap:22px;">%s'
           '<div style="font-family:%s;font-size:25px;letter-spacing:0.18em;'
           'text-transform:uppercase;color:%s;">Fire &middot; Ambulance &middot; Police '
           '&middot; Control</div></div>' % (badges, MONO, DIM))
    )
    return frame(content, "01 / 06")


def slide_what():
    def row(callsign, unit, status, colour):
        return (
            '<div style="display:flex;align-items:center;gap:20px;padding:20px 24px;'
            'border-top:1px solid %s;">'
            '<span style="width:10px;height:10px;border-radius:2px;background:%s;flex-shrink:0;"></span>'
            '<span style="font-family:%s;font-size:28px;color:%s;letter-spacing:0.06em;'
            'min-width:150px;">%s</span>'
            '<span style="font-family:%s;font-size:26px;color:%s;flex-grow:1;">%s</span>'
            '<span style="font-family:%s;font-size:24px;letter-spacing:0.12em;color:%s;">%s</span>'
            '</div>' % (BORDER_SUBTLE, colour, MONO, TEXT, callsign, MONO, DIM, unit, MONO, colour, status)
        )

    panel = (
        '<div style="border:1px solid %s;border-radius:4px;background:%s;overflow:hidden;">'
        '<div style="display:flex;align-items:center;justify-content:space-between;'
        'padding:22px 24px;background:%s;border-bottom:1px solid %s;font-family:%s;'
        'font-size:23px;letter-spacing:0.16em;text-transform:uppercase;">'
        '<span style="color:%s;">NWRC-04 &middot; Deployment</span>'
        '<span style="color:%s;">Live</span></div>'
        '%s%s%s</div>'
        % (BORDER, SURFACE, SURFACE_RAISED, BORDER_SUBTLE, MONO, AMBER, DIM,
           row("G50P1", "Pump &middot; Salford", "S2 IN ATTENDANCE", CRITICAL),
           row("A-417", "DCA &middot; Bolton", "S1 MOBILE", OK),
           row("AR-12", "ARV &middot; Force-wide", "S6 AVAILABLE", INFO))
    )
    content = (
        section_label("What it is")
        + headline(["One operator.", "Fire, Ambulance", "and Police."], size=76)
        + body("Command all three from a single seat, across real stations with "
               "real resources &mdash; from the first 999 call through to the debrief.")
        + panel
    )
    return frame(content, "02 / 06")


def slide_who():
    def tile(key):
        colour, label, _ = INSIGNIA[key]
        return (
            '<div style="display:flex;flex-direction:column;gap:22px;padding:32px 30px;'
            'border:1px solid %s;border-radius:4px;background:rgba(10,10,12,0.6);">'
            '%s<span style="font-family:%s;font-size:26px;letter-spacing:0.1em;color:%s;">%s</span>'
            '</div>' % (BORDER, symbol(key, 76), MONO, TEXT, label)
        )

    grid = (
        '<div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:20px;">%s</div>'
        % "".join(tile(k) for k in ("fire", "ambulance", "police", "control"))
    )
    content = (
        section_label("Who we&rsquo;re looking for")
        + headline(["People who have", "done it for real."], size=76)
        + grid
        + chiplist(["Currently serving", "Retired", "Previously served"])
        + body("A background that fits none of these? Tell us on the form &mdash; "
               "military medics, coastguard and mountain rescue all count.", size=30, colour=DIM)
    )
    return frame(content, "03 / 06")


def slide_topics():
    content = (
        section_label("What you&rsquo;d be advising on")
        + headline(["The detail we", "can&rsquo;t get from", "a rulebook."], size=76)
        + chiplist([
            "Control room &amp; mobilising",
            "Incident command &amp; JESIP",
            "BA &amp; firefighting operations",
            "RTCs &amp; technical rescue",
            "Clinical &amp; casualty care",
            "Police operations &amp; scene management",
            "Aviation (HEMS / NPAS)",
            "Appliances, kit &amp; equipment",
            "Wildfire &amp; specialist operations",
        ], size=27)
        + body("Pick the areas you know. Skip the rest.", size=30, colour=DIM)
    )
    return frame(content, "04 / 06")


def slide_asks():
    def row(num, label, text):
        return (
            '<div style="display:flex;gap:28px;padding:28px 0;border-top:1px solid %s;">'
            '<span style="font-family:%s;font-size:26px;color:%s;flex-shrink:0;width:56px;">%s</span>'
            '<div style="display:flex;flex-direction:column;gap:12px;">'
            '<span style="font-family:%s;font-size:24px;letter-spacing:0.2em;'
            'text-transform:uppercase;color:%s;">%s</span>'
            '<span style="font-size:31px;line-height:1.45;color:%s;">%s</span>'
            '</div></div>' % (BORDER_SUBTLE, MONO, AMBER, num, MONO, INFO, label, MUTED, text)
        )

    content = (
        section_label("What it asks of you")
        + headline(["As much or as", "little as you want."], size=76)
        + ('<div style="display:flex;flex-direction:column;">%s%s%s</div>' % (
            row("01", "The commitment",
                "The occasional question, or reviewing features as they are built. "
                "You choose on the form, and can change it later."),
            row("02", "The terms",
                "Unpaid and informal. Give what you can, when you can."),
            row("03", "What you get",
                "A say in how your job is portrayed, and the advisor mark against "
                "your callsign."),
        ))
        + body("Applications are reviewed case by case, so there is a wait. "
               "Your standing updates on the site once yours has been read.",
               size=28, colour=DIM)
    )
    return frame(content, "05 / 06")


def slide_apply():
    button = (
        '<div style="display:inline-flex;align-items:center;justify-content:center;'
        'background:%s;color:#000;border-radius:4px;padding:30px 48px;font-family:%s;'
        'font-size:32px;font-weight:500;letter-spacing:0.15em;text-transform:uppercase;'
        'align-self:flex-start;">Apply to the programme</div>' % (AMBER, MONO)
    )
    content = (
        eyebrow("Applications are open")
        + headline(["Take the seat", "next to ours."], size=96)
        + body("Registration takes a couple of minutes &mdash; a callsign, an email, "
               "and the advisor questions.")
        + button
        + '<div style="flex-grow:1;"></div>'
        + rule()
        + ('<div style="display:flex;flex-direction:column;gap:16px;">'
           '<span style="font-family:%s;font-size:40px;letter-spacing:0.02em;color:%s;">%s</span>'
           '<span style="font-family:%s;font-size:26px;color:%s;">Development happens in the '
           'open &mdash; discord.gg/YBN3sbphs3</span></div>'
           % (MONO, TEXT, SITE, MONO, DIM))
    )
    return frame(content, "06 / 06", footer_right="The Watch Room &middot; Pre-alpha")


SLIDES = {
    "Main": slide_hook,
    "WhatItIs": slide_what,
    "WhoWeWant": slide_who,
    "AdvisingOn": slide_topics,
    "WhatItAsks": slide_asks,
    "Apply": slide_apply,
}

if __name__ == "__main__":
    (HERE / "preview").mkdir(exist_ok=True)
    for name, fn in SLIDES.items():
        markup = fn()
        (HERE / ("%s.dc.html" % name)).write_text(DC % (HELMET, markup))
        (HERE / "preview" / ("%s.html" % name)).write_text(PREVIEW % (HELMET, markup))
        print("wrote %s.dc.html" % name)
