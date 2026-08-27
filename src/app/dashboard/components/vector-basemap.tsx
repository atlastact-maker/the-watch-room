"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "maplibre-gl/dist/maplibre-gl.css";
import "@maplibre/maplibre-gl-leaflet";

/**
 * A vector base map, rendered by MapLibre GL on a canvas underneath
 * Leaflet's own panes.
 *
 * Leaflet cannot draw vector tiles itself, so this is a second rendering
 * engine sitting below the first. Everything the game draws — markers,
 * hose lines, the fire overlay, site plans — stays in Leaflet and is
 * untouched; only the map beneath them changes.
 *
 * The reason for the extra weight is zoom. Raster tiles are cut at whole
 * zoom levels, so scrolling between them resamples a bitmap and the
 * lettering and kerb lines go soft in between. Vector tiles are drawn at
 * whatever scale the map is actually at, so the detail resolves smoothly
 * the whole way in, which is the behaviour that prompted this.
 *
 * The style is fetched through /api/os-vector, which rewrites the URLs
 * inside it so the sources, sprite and glyphs all come back through the
 * same proxy and the Data Hub key never reaches the browser.
 */
export function VectorBasemap({ styleUrl }: { styleUrl: string }) {
  const map = useMap();

  useEffect(() => {
    const layer = L.maplibreGL({
      style: styleUrl,
      // Attribution is rendered by our own block, outside the map, so OS's
      // required statement and links sit where we control them.
      attributionControl: false,
    });
    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, styleUrl]);

  return null;
}
