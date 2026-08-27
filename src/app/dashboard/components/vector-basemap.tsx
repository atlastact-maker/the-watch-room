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
export function VectorBasemap({
  styleUrl,
  onFail,
}: {
  styleUrl: string;
  /** Called once if the style itself fails to load — the parent drops to
   *  raster tiles so the operator is never looking at a blank board. Must
   *  be referentially stable (useCallback) or the layer remounts. */
  onFail?: () => void;
}) {
  const map = useMap();

  useEffect(() => {
    let failed = false;
    const layer = L.maplibreGL({
      style: styleUrl,
      // Attribution is rendered by our own block, outside the map, so OS's
      // required statement and links sit where we control them.
      attributionControl: false,
    });
    layer.addTo(map);
    const ml = layer.getMaplibreMap();

    const fail = (why: string) => {
      if (failed) return;
      failed = true;
      console.error(
        `[os-vector] base map failed to load (${why}). ` +
          "Open /api/os-vector/resources/styles?srs=3857 while signed in — " +
          "an 'OS upstream error 401/403' there means the OS Vector Tile " +
          "API product is not added to the Data Hub project the key " +
          "belongs to.",
      );
      onFail?.();
    };

    // An error before the style document has parsed means the style fetch
    // itself failed — fatal, fall back. Errors after that are usually
    // recoverable (one tile 404ing at the coverage edge, a missing glyph
    // range) and are logged but tolerated. Attaching a listener suppresses
    // MapLibre's own console output, so the else branch restores it.
    const onError = (e: { error?: { message?: string } }) => {
      if (!ml.isStyleLoaded()) fail(e?.error?.message ?? "style error");
      else console.warn("[os-vector]", e?.error?.message ?? e);
    };
    ml.on("error", onError);
    // Belt and braces for the no-event failure modes (a hung fetch): if
    // nothing has parsed after 12s on what is a few-KB JSON document,
    // treat it as failed.
    const timer = window.setTimeout(() => {
      if (!ml.isStyleLoaded()) fail("style not loaded after 12s");
    }, 12_000);

    return () => {
      window.clearTimeout(timer);
      ml.off("error", onError);
      map.removeLayer(layer);
    };
  }, [map, styleUrl, onFail]);

  return null;
}
