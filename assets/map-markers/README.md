# The Watch Room — dispatcher map marker pack

Drop-in SVG markers for the CAD map (light theme). Anchor point of every unit chip
is (40, 58) in its 80x66 viewBox — position markers so that point sits on the unit's
map coordinate. Incident triangles anchor at (40, 48).

## Chip anatomy
- Rounded chip, white fill; BORDER colour = service; 2.5px.
- Left roundel = status colour + UK status code text.
- Callsign right of roundel, dark mono.
- Pointer triangle + dot in service colour marks the exact map position.

## Status codes & colours
| Code | Meaning | Colour |
| --- | --- | --- |
| 6 | Available on station | #15803d |
| 1 | Mobile to incident | #a16207 |
| 2 | In attendance | #dc2626 |
| BA | BA crews committed | #7c3aed |
| 3 | Returning, available | #0e7490 |
| 0 | Off the run | #71717a (chip at 55% opacity) |

## Service border colours
Fire pump #dc2626 · Aerial/special #9a3412 · Ambulance DCA #15803d · RRV/officer #65a30d · Police #1d4ed8 · HART/specialist #0d9488

## States & extras
- selected: dashed #f59e0b ring around the chip
- dimmed/deselected: opacity 0.4 + grayscale(0.7)
- mobile: heading arrow (#a16207) rotated to bearing — rotate the arrow path around (40, 58)
- 999 run: pulsing ring (keyframes are inside each SVG; the class is .mk-999)
- cluster: dark badge top-right with ×N

## Incidents
- unassigned: red triangle, blinking, pulsing ring
- assigned: amber triangle, steady
- closed: grey triangle with tick

## Implementation notes
- Callsign/code text is plain SVG <text> — templateable at runtime.
- Animations are CSS inside each file; they run when the SVG is inline or in <object>, not via <img>.
- All coordinates integer-friendly at 1x = 80x66; scale by map zoom.
