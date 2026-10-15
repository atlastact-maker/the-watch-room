"use client";

// Dev harness for the pre-shift briefing: the patch picker and the
// resourcing page on the county's stations, outside the signed-in desk.
// Only served when the server was started with TWR_DEV_HARNESS=1 (the
// layout). Begin Shift logs what the desk would have been handed.

import { PatchPicker } from "../../dashboard/components/patch-picker";
import { STATIONS, getStationAppliances } from "@/lib/sim/data";
import type { AreaCode } from "@/lib/sim/types";
import type { StationWithAppliances } from "../../dashboard/page";

export default function BriefHarness() {
  const byArea: Record<AreaCode, StationWithAppliances[]> = { Southern: [], Eastern: [], Western: [], ForceWide: [] };
  for (const s of STATIONS) byArea[s.area].push({ ...s, appliances: getStationAppliances(s.id) });
  return (
    <div className="relative z-10 flex flex-1">
      <PatchPicker
        stationsByArea={byArea}
        onSelect={(area, intensity, startHour, services, channels, preShift) => {
          console.log(`shift: ${area} ${intensity} ${startHour}:00 ${services.join("+")} ${channels.join("+")} overrides=${Object.keys(preShift ?? {}).length}`);
        }}
      />
    </div>
  );
}
