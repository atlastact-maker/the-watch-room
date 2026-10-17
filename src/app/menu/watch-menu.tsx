"use client";

// The menu: the operations overview, shift configuration, the operator
// guide, and release notes with the reporting form, each inside the
// console frame.

import { ConsoleShell, type ConsoleUser } from "./console-shell";
import type { PlateStation } from "./county-plate";
import { GuideView } from "./guide-view";
import { TITLES, type CountyFacts, type MenuView, type SystemsStatus } from "./menu-types";
import { OverviewView } from "./overview-view";
import { ShiftView } from "./shift-view";
import { UpdatesView } from "./updates-view";
import { usePlayerRecord } from "./use-player-record";

export type { MenuView } from "./menu-types";

type Props = ConsoleUser & {
  userId: string;
  view: MenuView;
  facts: CountyFacts;
  stations: PlateStation[];
  systems?: SystemsStatus | null;
};

export function WatchMenu({ userId, view, facts, stations, systems = null, ...user }: Props) {
  const record = usePlayerRecord();
  return (
    <ConsoleShell {...user} userId={userId} active={view} title={TITLES[view]}>
      {view === "overview" && <OverviewView record={record} callsign={user.callsign} discord={user.discord} facts={facts} stations={stations} systems={systems} pending={user.pending ?? 0} />}
      {view === "shift" && <ShiftView hasSave={!!record.save} ready={record.loaded && !record.unavailable} />}
      {view === "guide" && <GuideView />}
      {view === "updates" && <UpdatesView userId={userId} />}
    </ConsoleShell>
  );
}
