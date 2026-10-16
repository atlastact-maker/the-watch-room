// What the operator console's views share: the views themselves, the county's
// headline numbers, and the few words used in more than one place.

import type { ServiceCode } from "@/lib/sim/types";

export type MenuView = "overview" | "shift" | "guide" | "updates";

export const TITLES: Record<MenuView, string> = { overview: "Operations overview", shift: "Shift configuration", guide: "Operator guide", updates: "Release notes & feedback" };

export const viewHref = (view: MenuView) => (view === "overview" ? "/menu" : `/menu?view=${view}`);

export const COMMUNITY = "https://discord.gg/YBN3sbphs3";

export const serviceName = (service: ServiceCode) => (service === "Fire" ? "Fire & rescue" : service);
export const intensityName = (intensity: string) => (intensity === "normal" ? "Standard" : intensity === "quiet" ? "Quiet" : "Busy");

/** The county's headline numbers, counted once on the server from the
 *  same station data the desk runs on. */
export type CountyFacts = {
  services: { service: ServiceCode; stations: number; appliances: number }[];
  scenarios: number;
};

/** The one tint per service, used wherever a service is meant: the
 *  plate's station dots, the fact tiles, the directory headings. */
export const SERVICE_TINT: Record<ServiceCode, string> = { Fire: "#f08a3e", Ambulance: "#4fc16d", Police: "#4f9ff2" };

/** What a service calls its vehicles. */
export const unitsWord = (service: ServiceCode) => (service === "Fire" ? "appliances" : service === "Ambulance" ? "vehicles" : "units");
