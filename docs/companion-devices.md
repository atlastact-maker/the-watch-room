# Companion devices

The desk is one browser window running the whole shift. Operators want the
MDT on a tablet in their hands, the ground map on a second screen, and in
time an app on the tablet's home screen. This note is the plan, and what
the first slice shipped.

## Where it stands

**Shipped (0.7.1): the shared-session MDT.**

- The desk owns the shift. It is the only place the simulation runs and
  the only place state changes.
- *Windows → Companion tablet…* on the desk generates an 8-character pairing
  code (no 0/1/I/O) and shows it with a link. The code lives for the browser
  session, so a desk reload keeps the pairing.
- On any signed-in device, `/mdt` (or the link with `?code=`) joins the
  desk's channel and draws the MDT — the same `DraggableIncidentMdt`
  component, in `fixed` mode so it fills the device's screen — fed from the
  desk's props rather than the desk's state.
- Transport: Supabase Realtime broadcast on channel `twr-mdt-<code>`
  (`src/lib/companion/transport.ts`). Where the build has no Supabase keys
  (the dev harness) a `BroadcastChannel` carries the same messages between
  tabs of one browser, so the whole thing runs end to end locally:
  `/dev/mdt?s=12&unit=dca&pair=1` shares as `DEVTESTA`; `/dev/companion`
  joins it.
- Protocol (`src/lib/companion/protocol.ts`): the MDT's props are grouped
  into six slices — `static` (stations, patch, record index), `incident`,
  `units`, `tasks`, `care`, `log` (capped to the last 250 lines). After
  every desk render the host (`useCompanionHost`) compares each slice's
  members by identity and sends only the slices that changed, coalesced
  over 150 ms. Slices are packed with a codec that carries Sets, Maps,
  Dates and RegExps (`codec.ts`) and split into 48 KB chunks. The tablet
  keeps its own clock (`now` is never sent).
- Actions: every function prop on the MDT becomes a sender on the tablet;
  pressing anything sends `{ act, name, args }` and the desk calls the prop
  of that name with those arguments. No per-handler code on either side.
- Presence: tablets `join` and `ping` every 10 s; the desk's dialog shows
  how many are on. `Stop sharing` sends `bye`; the tablet says so and can
  rejoin on a new code.

**Known limits of the first slice.**

- The unit the tablet shows is the desk's selected unit (`unitId` is a
  controlled prop). Changing it on the tablet changes it on the desk.
- The channel is public, named by the code. Anyone with the code and a
  sign-in can join. Codes are 32^8 and session-scoped; fine for the
  Pre-Alpha, not for later.
- A tablet that loses its connection resyncs when it rejoins (the desk
  re-sends every slice on `join`), but there is no resume of in-flight
  actions, and nothing is queued on the tablet while offline.
- Only the MDT is shared. The desk's other windows are not.
- The LEDS / ANPR doors on the MDT's police module open the desk's
  windows, not the tablet's.

## Next steps, in order

1. **Harden the channel.** Private Realtime channels with the project's
   Realtime Authorization (RLS on `realtime.messages`), the code exchanged
   for a short-lived channel grant, and the desk accepting only tablets on
   the same account. Rotate the code on `Stop sharing`.
2. **Device-own selection.** Let the tablet pick its own unit and pages
   (`unitId` local to the tablet, the desk's `onSetUnitId` not forwarded),
   so a second tablet can hold a second unit's MDT at the same time.
3. **Split surfaces.** Generalise the host from "the MDT's props" to named
   surfaces: the ground map (`IncidentView`), the casualty board, the
   county map. Each surface is a props object with a publisher; a device
   joins a surface. The desk becomes a CAD with the surfaces undocked onto
   whatever screens the operator has.
4. **Resilience.** Sequence numbers per slice with a resend request,
   action acknowledgements, an action queue on the tablet while offline,
   and a wake lock so the tablet does not sleep mid-job.
5. **Pairing by QR.** Draw the link as a QR code in the dialog (a small
   inline encoder; no dependency), so a phone or tablet camera joins in one
   step.
6. **The app.** Wrap the same web app with Capacitor for the App Store and
   Google Play: a home-screen icon, full-screen, kept awake, push
   notifications for a new call when the desk is in the background. The
   web `/mdt` route stays the one code path; the shell adds the native
   bits. A multi-operator shift (a second console on the same incident) is
   a separate piece of work: it needs the state to move server-side, which
   nothing above requires.
