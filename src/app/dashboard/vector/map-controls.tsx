"use client";

// The map bar's right-hand controls: the basemap switch as VECTOR
// segments, sharing its choice with the map through useBasemapChoice.

import { useBasemapChoice } from "../components/basemap-controls";

export function BasemapSegments() {
  const { options, id, choose } = useBasemapChoice();
  if (options.length < 2) return null;
  return (
    <div className="vec-segments" role="group" aria-label="Base map">
      {options.map((o) => (
        <button key={o.id} type="button" aria-pressed={o.id === id} onClick={() => choose(o.id)}>
          {o.id === "os" ? "OS map" : o.label}
        </button>
      ))}
    </div>
  );
}
