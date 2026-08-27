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

export type BasemapId = "os_vector" | "os" | "os_outdoor" | "aerial" | "street";

export type Basemap = {
  id: BasemapId;
  label: string;
  url: string;
  /** Shown in the map's own attribution block. */
  attribution: string;
  maxNativeZoom: number;
  /** Photography — markers need extra contrast over it. */
  imagery: boolean;
  /** A MapLibre style document. When set the layer is drawn by MapLibre
   *  rather than as raster tiles, and `url` is unused. */
  styleUrl?: string;
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

const OS_VECTOR: Basemap = {
  id: "os_vector",
  label: "OS Vector",
  // Vector tiles are drawn at whatever scale the map is actually at,
  // rather than being cut at whole zoom levels and resampled in between,
  // so detail resolves smoothly the whole way in instead of going soft
  // between steps. That continuous zoom is why this is the default OS
  // layer rather than the raster ones below.
  url: "",
  styleUrl: "/api/os-vector/resources/styles",
  attribution: OS_COPYRIGHT,
  maxNativeZoom: 20,
  imagery: false,
};

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

const OS_OUTDOOR: Basemap = {
  id: "os_outdoor",
  label: "Outdoor",
  // Outdoor is OS's Explorer/Landranger cartography — contours, field
  // boundaries, footpaths and access land. Far busier than Light, and the
  // style that changes most as you zoom, since it steps through OS's
  // small-, medium- and large-scale products rather than restyling one.
  url: "/api/os-tiles/Outdoor_3857/{z}/{x}/{y}.png",
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
/** What the toggle offers. Kept to two so the control stays a glance
 *  rather than a menu; the raster OS styles stay defined above and are one
 *  line away if the vector cartography ever disappoints. */
export function groundBasemaps(): Basemap[] {
  return osMappingEnabled() ? [OS_VECTOR, AERIAL] : [STREET, AERIAL];
}

export function basemapById(id: BasemapId): Basemap {
  const all = [OS_VECTOR, OS_MAP, OS_OUTDOOR, AERIAL, STREET];
  const hit = all.find((b) => b.id === id);
  const offered = groundBasemaps();
  // A remembered choice that is no longer on offer (OS turned off since
  // the operator last picked it) falls back rather than showing a layer
  // whose tiles will 404.
  if (hit && offered.some((b) => b.id === hit.id)) return hit;
  return offered[0];
}

export const BASEMAP_STORAGE_KEY = "twr:ground-basemap:v1";
