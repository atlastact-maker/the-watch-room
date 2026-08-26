// Base map layers for the ground view.
//
// OS cartography is what a UK control room actually looks at — its CAD
// and mobilising screens run Ordnance Survey, not a satellite photo. So
// OS is the default and aerial is the toggle, which is the way round
// crews work: map to read the ground, imagery to see what is on it.
//
// The OS layer is served through /api/os-tiles so the Data Hub key stays
// on the server. When no key is configured that route 404s and we fall
// back to OpenStreetMap, so the game runs unchanged without one.

export type BasemapId = "os" | "aerial" | "street";

export type Basemap = {
  id: BasemapId;
  label: string;
  url: string;
  /** Shown in the map's own attribution block. */
  attribution: string;
  maxNativeZoom: number;
  /** Photography — markers need extra contrast over it. */
  imagery: boolean;
};

/** Whether OS mapping is wired up. Set NEXT_PUBLIC_OS_MAPS=1 alongside
 *  the server-side OS_DATA_HUB_KEY to switch it on. */
export function osMappingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_OS_MAPS === "1";
}

/** OS require the copyright line, their logo, and links to the errors
 *  tool and terms — all inside the map. The logo and links are rendered
 *  by the attribution block; this is the statement itself. */
export const OS_COPYRIGHT = `Contains OS data © Crown copyright and database rights ${new Date().getFullYear()}`;
export const OS_ERRORS_URL = "https://www.ordnancesurvey.co.uk/contact-us/error";
export const OS_TERMS_URL =
  "https://www.ordnancesurvey.co.uk/legal/data-hub-api-terms";

const OS_MAP: Basemap = {
  id: "os",
  label: "OS Map",
  // Light is OS's own "backdrop" style — deliberately desaturated so
  // operational symbology sits on top of it. At zoom 17-20 it draws
  // MasterMap Topography: surveyed building footprints and kerb lines.
  url: "/api/os-tiles/Light_3857/{z}/{x}/{y}.png",
  attribution: OS_COPYRIGHT,
  maxNativeZoom: 20,
  imagery: false,
};

const AERIAL: Basemap = {
  id: "aerial",
  label: "Aerial",
  // OS sell aerial photography but do not serve it through the Maps API,
  // so imagery comes from Esri — the same source the MDT's Prop View tab
  // already uses, which keeps one look across the app.
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
  maxNativeZoom: 19,
  imagery: true,
};

const STREET: Basemap = {
  id: "street",
  label: "Street",
  url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: "© OpenStreetMap contributors",
  maxNativeZoom: 19,
  imagery: false,
};

/** Ground-view options, best first. Without an OS key the street map
 *  takes its place so the toggle still has two sides. */
export function groundBasemaps(): Basemap[] {
  return osMappingEnabled() ? [OS_MAP, AERIAL] : [STREET, AERIAL];
}

export function basemapById(id: BasemapId): Basemap {
  const all = [OS_MAP, AERIAL, STREET];
  return all.find((b) => b.id === id) ?? groundBasemaps()[0];
}

export const BASEMAP_STORAGE_KEY = "twr:ground-basemap:v1";
