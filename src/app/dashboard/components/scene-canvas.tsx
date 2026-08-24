"use client";

import type { Deployment } from "@/lib/sim/incident_types";
import type { Scene, SceneBuilding, SceneHazard, SceneHydrant, SceneLandmark, SceneRoad } from "@/lib/sim/scene";

// Fixed schematic positions for deployed appliances, arranged along the road.
// MVP: first 8 arrivals get a slot; extras stack on the second row.
const APPLIANCE_SLOTS: { x: number; y: number }[] = [
  { x: -12, y: 16 }, { x: -6, y: 16 }, { x: 0, y: 16 }, { x: 6, y: 16 },
  { x: 12, y: 16 }, { x: -12, y: 25 }, { x: -6, y: 25 }, { x: 0, y: 25 },
];

type Props = {
  scene: Scene;
  deployments: { deployment: Deployment; callsign: string; service: string }[];
};

export function SceneCanvas({ scene, deployments }: Props) {
  return (
    <svg
      viewBox={`${scene.viewBox.x} ${scene.viewBox.y} ${scene.viewBox.width} ${scene.viewBox.height}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full"
    >
      <defs>
        <radialGradient id="fire-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
          <path
            d="M 5 0 L 0 0 0 5"
            fill="none"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="0.1"
          />
        </pattern>
      </defs>

      <rect
        x={scene.viewBox.x}
        y={scene.viewBox.y}
        width={scene.viewBox.width}
        height={scene.viewBox.height}
        fill="#0a0a0c"
      />
      <rect
        x={scene.viewBox.x}
        y={scene.viewBox.y}
        width={scene.viewBox.width}
        height={scene.viewBox.height}
        fill="url(#grid)"
      />

      {/* Roads / pavements / gardens / driveways */}
      {scene.roads.map((r, i) => (
        <RoadShape key={`r${i}`} road={r} />
      ))}

      {/* Buildings */}
      {scene.buildings.map((b, i) => (
        <BuildingShape key={`b${i}`} building={b} />
      ))}

      {/* Landmarks */}
      {scene.landmarks.map((l, i) => (
        <LandmarkGlyph key={`l${i}`} landmark={l} />
      ))}

      {/* Hydrants */}
      {scene.hydrants.map((h, i) => (
        <HydrantGlyph key={`h${i}`} hydrant={h} />
      ))}

      {/* Known hazards (from PRI) */}
      {scene.hazards
        .filter((h) => h.knownFromPri)
        .map((h, i) => (
          <HazardGlyph key={`hz${i}`} hazard={h} />
        ))}

      {/* Fire seat + smoke with live pulse animation */}
      {scene.fireSeat && <FireGlyph fire={scene.fireSeat} />}

      <style>{`
        @keyframes sim-fire-pulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.12); opacity: 1; }
        }
        @keyframes sim-smoke-drift {
          0% { transform: translateY(0) scale(1); opacity: 0.22; }
          100% { transform: translateY(-1.2px) scale(1.08); opacity: 0.1; }
        }
        .sim-fire-core {
          transform-origin: center;
          animation: sim-fire-pulse 1.8s ease-in-out infinite;
        }
        .sim-smoke {
          transform-origin: center;
          animation: sim-smoke-drift 3.5s ease-out infinite alternate;
        }
      `}</style>

      {/* Deployed appliances */}
      {deployments.map((d, i) => {
        const slot = APPLIANCE_SLOTS[i % APPLIANCE_SLOTS.length];
        return (
          <ApplianceMarker
            key={d.deployment.applianceId}
            x={slot.x}
            y={slot.y}
            callsign={d.callsign}
            service={d.service}
          />
        );
      })}

      {/* Compass */}
      <g transform={`translate(${scene.viewBox.x + 4}, ${scene.viewBox.y + 4})`}>
        <circle r="2" fill="rgba(10,10,12,0.8)" stroke="#a1a1aa" strokeWidth="0.15" />
        <text
          x="0"
          y="0.6"
          textAnchor="middle"
          fontFamily="var(--font-geist-mono), monospace"
          fontSize="1.8"
          fill="#a1a1aa"
        >
          N
        </text>
      </g>
    </svg>
  );
}

function BuildingShape({ building }: { building: SceneBuilding }) {
  const { x, y, w, h } = building.shape;
  const fill =
    building.kind === "target"
      ? "#1f1b14"
      : building.kind === "neighbour"
        ? "#17171a"
        : "#101014";
  const stroke =
    building.kind === "target"
      ? "#f59e0b"
      : building.kind === "neighbour"
        ? "#71717a"
        : "#3f3f46";
  const strokeW = building.kind === "target" ? 0.22 : 0.14;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeW}
      />
      {/* Target-house roofline (diagonal) */}
      {building.kind === "target" && (
        <>
          <line
            x1={x}
            y1={y}
            x2={x + w}
            y2={y + h}
            stroke={stroke}
            strokeWidth="0.08"
            strokeDasharray="0.5 0.5"
            opacity="0.5"
          />
          <line
            x1={x + w}
            y1={y}
            x2={x}
            y2={y + h}
            stroke={stroke}
            strokeWidth="0.08"
            strokeDasharray="0.5 0.5"
            opacity="0.5"
          />
        </>
      )}
      {building.label && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 0.5}
          textAnchor="middle"
          fontFamily="var(--font-geist-mono), monospace"
          fontSize="1.2"
          fill={building.kind === "target" ? "#f59e0b" : "#a1a1aa"}
          opacity={building.kind === "target" ? 1 : 0.6}
        >
          {building.label}
        </text>
      )}
    </g>
  );
}

function RoadShape({ road }: { road: SceneRoad }) {
  const { x, y, w, h } = road.shape;
  const fill =
    road.kind === "road"
      ? "#232327"
      : road.kind === "pavement"
        ? "#2e2e33"
        : road.kind === "driveway"
          ? "#252528"
          : road.kind === "garden"
            ? "#0e1a12"
            : road.kind === "water"
              ? "#0b2333"
              : "#1a1a1e";
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={fill} />
      {road.kind === "road" && (
        <line
          x1={x}
          y1={y + h / 2}
          x2={x + w}
          y2={y + h / 2}
          stroke="#5b5b66"
          strokeWidth="0.14"
          strokeDasharray="1 1.5"
          opacity="0.6"
        />
      )}
      {road.label && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 0.4}
          textAnchor="middle"
          fontFamily="var(--font-geist-mono), monospace"
          fontSize="1.1"
          fill="#6b6b77"
          opacity="0.6"
        >
          {road.label}
        </text>
      )}
    </g>
  );
}

function HydrantGlyph({ hydrant }: { hydrant: SceneHydrant }) {
  if (!hydrant.pos) return null;
  return (
    <g transform={`translate(${hydrant.pos.x}, ${hydrant.pos.y})`}>
      <circle r="1" fill="#38bdf8" opacity="0.25" />
      <circle r="0.6" fill="#38bdf8" />
      <text
        y="0.35"
        textAnchor="middle"
        fontFamily="var(--font-geist-mono), monospace"
        fontSize="1"
        fill="#0a0a0c"
        fontWeight="700"
      >
        H
      </text>
      <text
        x="1.3"
        y="0.4"
        fontFamily="var(--font-geist-mono), monospace"
        fontSize="1"
        fill="#38bdf8"
      >
        {hydrant.label}
      </text>
    </g>
  );
}

function LandmarkGlyph({ landmark }: { landmark: SceneLandmark }) {
  const color = "#71717a";
  switch (landmark.kind) {
    case "tree":
      return (
        <g transform={`translate(${landmark.pos.x}, ${landmark.pos.y})`}>
          <circle r="1" fill="#1a2e1a" stroke="#4d6e4d" strokeWidth="0.08" />
        </g>
      );
    case "lamppost":
      return (
        <g transform={`translate(${landmark.pos.x}, ${landmark.pos.y})`}>
          <circle r="0.35" fill={color} />
        </g>
      );
    case "car":
      return (
        <g transform={`translate(${landmark.pos.x - 1}, ${landmark.pos.y - 0.5})`}>
          <rect width="2" height="1" rx="0.1" fill="#2a2a30" stroke={color} strokeWidth="0.08" />
        </g>
      );
    default:
      return (
        <circle cx={landmark.pos.x} cy={landmark.pos.y} r="0.3" fill={color} />
      );
  }
}

function HazardGlyph({ hazard }: { hazard: SceneHazard }) {
  return (
    <g transform={`translate(${hazard.pos.x}, ${hazard.pos.y})`}>
      <polygon
        points="0,-0.9 0.9,0.6 -0.9,0.6"
        fill="#f59e0b"
        stroke="#0a0a0c"
        strokeWidth="0.1"
      />
      <text
        y="0.45"
        textAnchor="middle"
        fontFamily="var(--font-geist-mono), monospace"
        fontSize="0.9"
        fill="#0a0a0c"
        fontWeight="700"
      >
        !
      </text>
      <text
        x="1.4"
        y="0.3"
        fontFamily="var(--font-geist-mono), monospace"
        fontSize="1"
        fill="#f59e0b"
      >
        {hazard.label}
      </text>
    </g>
  );
}

function FireGlyph({ fire }: { fire: { pos: { x: number; y: number }; radiusM: number } }) {
  return (
    <g>
      {/* Smoke plume — rising in SVG "up" direction (negative Y) */}
      <ellipse
        className="sim-smoke"
        cx={fire.pos.x}
        cy={fire.pos.y - fire.radiusM * 2.5}
        rx={fire.radiusM * 3}
        ry={fire.radiusM * 4}
        fill="rgba(100,100,110,0.18)"
      />
      <ellipse
        className="sim-smoke"
        cx={fire.pos.x}
        cy={fire.pos.y - fire.radiusM * 1.5}
        rx={fire.radiusM * 2}
        ry={fire.radiusM * 3}
        fill="rgba(100,100,110,0.25)"
      />
      {/* Fire glow (animated pulse) */}
      <g className="sim-fire-core" style={{ transformOrigin: `${fire.pos.x}px ${fire.pos.y}px` }}>
        <circle
          cx={fire.pos.x}
          cy={fire.pos.y}
          r={fire.radiusM * 1.5}
          fill="url(#fire-glow)"
        />
        <circle
          cx={fire.pos.x}
          cy={fire.pos.y}
          r={fire.radiusM * 0.4}
          fill="#ef4444"
        />
      </g>
    </g>
  );
}

function ApplianceMarker({
  x,
  y,
  callsign,
  service,
}: {
  x: number;
  y: number;
  callsign: string;
  service: string;
}) {
  const colour =
    service === "Fire" ? "#f59e0b" : service === "Ambulance" ? "#10b981" : "#6366f1";
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        x="-2"
        y="-1.2"
        width="4"
        height="2.4"
        rx="0.3"
        fill="rgba(10,10,12,0.95)"
        stroke={colour}
        strokeWidth="0.16"
      />
      <text
        y="0.5"
        textAnchor="middle"
        fontFamily="var(--font-geist-mono), monospace"
        fontSize="1.25"
        fontWeight="700"
        fill={colour}
      >
        {callsign}
      </text>
    </g>
  );
}
