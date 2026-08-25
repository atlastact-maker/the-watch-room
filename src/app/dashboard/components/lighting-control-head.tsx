"use client";

// Vehicle lighting control head — modelled on the rugged cab-mounted
// touchscreen units (Standby/RSG class): a dark bezel, a black screen
// with a tab strip and big coloured touch tiles, and a row of physical
// quick-access keys along the bottom. Every tile and key drives the
// sim's real LightState; the active mode carries a lit ring and an LED.
//
// This is a physical device, so it keeps its own hardware colours and
// ignores the surrounding theme (dark ops room or light CAD tablet).

import type { LightState } from "@/lib/sim/incident_types";

const TILE_BASE =
  "relative rounded-md px-2 py-2.5 text-center font-bold uppercase leading-tight tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_2px_3px_rgba(0,0,0,0.55)] transition-all active:translate-y-px";

function Tile({
  label,
  colour,
  active,
  onClick,
  className = "",
  pulse = false,
}: {
  label: string;
  colour: string; // tailwind bg class
  active: boolean;
  onClick: () => void;
  className?: string;
  pulse?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        `${TILE_BASE} ${colour} ${className} text-[11px] ` +
        (active
          ? "ring-2 ring-white brightness-110" + (pulse ? " animate-pulse" : "")
          : "opacity-85 hover:opacity-100")
      }
    >
      {label}
      {active && (
        <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-lime-300 shadow-[0_0_4px_#bef264]" />
      )}
    </button>
  );
}

function HardKey({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-md border border-zinc-500 bg-gradient-to-b from-zinc-100 to-zinc-300 px-2 py-2 text-center text-[10px] font-bold leading-tight text-zinc-800 shadow-[0_2px_0_#52525b,0_3px_4px_rgba(0,0,0,0.5)] transition-all active:translate-y-[2px] active:shadow-none " +
        (active ? "ring-2 ring-lime-400" : "")
      }
    >
      {label}
    </button>
  );
}

export function LightingControlHead({
  current,
  onSet,
}: {
  current: LightState;
  onSet: (state: LightState) => void;
}) {
  const is = (s: LightState) => current === s;
  return (
    <div>
      {/* Rugged case */}
      <div className="rounded-xl border-2 border-zinc-800 bg-gradient-to-b from-zinc-600 to-zinc-700 p-2 shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
        {/* Screen */}
        <div className="rounded-md border-2 border-zinc-900 bg-black p-2 shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)]">
          {/* Tab strip — LIGHTS is the live page; the rest are fitted on
              the real unit but not simulated, so they sit inert. */}
          <div className="mb-2 flex gap-1">
            {(["LIGHTS", "SIREN", "TEMP", "MATRIX", "BATT"] as const).map(
              (tab, i) => (
                <span
                  key={tab}
                  title={i === 0 ? undefined : "Not simulated"}
                  className={
                    "rounded-sm px-1.5 py-0.5 font-mono text-[8px] font-bold tracking-wider " +
                    (i === 0
                      ? "bg-white text-black"
                      : "bg-zinc-700 text-zinc-400")
                  }
                >
                  {tab}
                </span>
              ),
            )}
          </div>

          {/* Touch tiles */}
          <div className="grid grid-cols-3 gap-1.5">
            <Tile
              label="Arrive Mode"
              colour="bg-green-600"
              active={is("at_scene")}
              onClick={() => onSet("at_scene")}
            />
            <Tile
              label="Rear Blues"
              colour="bg-sky-600"
              active={is("rear_blues")}
              onClick={() => onSet("rear_blues")}
            />
            <Tile
              label="Rear Reds"
              colour="bg-red-600"
              active={is("rear_reds")}
              onClick={() => onSet("rear_reds")}
            />
            <Tile
              label="Clear All"
              colour="bg-orange-500"
              active={is("off")}
              onClick={() => onSet("off")}
              className="col-span-2"
            />
            <Tile
              label="Aux Equip"
              colour="bg-purple-500"
              active={false}
              onClick={() => {}}
              className="cursor-default opacity-50"
            />
            <Tile
              label="999 Mode"
              colour="bg-sky-600"
              active={is("999")}
              pulse
              onClick={() => onSet("999")}
              className="col-span-3 py-4 text-[13px]"
            />
          </div>
        </div>

        {/* Physical quick keys — same four as the real head */}
        <div className="mt-2 grid grid-cols-4 gap-1.5 px-1 pb-0.5">
          <HardKey label="999" active={is("999")} onClick={() => onSet("999")} />
          <HardKey
            label="Arrive"
            active={is("at_scene")}
            onClick={() => onSet("at_scene")}
          />
          <HardKey
            label="Clear All"
            active={is("off")}
            onClick={() => onSet("off")}
          />
          <HardKey
            label="Blues"
            active={is("rear_blues")}
            onClick={() => onSet("rear_blues")}
          />
        </div>
      </div>
    </div>
  );
}
