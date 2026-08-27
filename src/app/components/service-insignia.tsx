// Advisor service insignia — issued marks, not decoration. Drawn in the
// CAD-marker anatomy the maps use (service-coloured square, white border,
// callsign-style plate) so a profile wears the same system as the board.
// Inline SVG rather than emoji: crisp at any size, identical on every
// platform, and each mark is the real one — the eight-pointed star fire
// services wear, the Star of Life, Battenberg check, a headset for
// control rooms.

export type ServiceKey =
  | "fire"
  | "ambulance"
  | "police"
  | "control"
  | "specialist";

/** Application service string → insignia key. Legacy label kept so rows
 *  written before the rename still resolve. */
export function serviceKeyFor(service: string | undefined | null): ServiceKey | null {
  switch (service) {
    case "Fire & Rescue":
      return "fire";
    case "Ambulance":
      return "ambulance";
    case "Police":
      return "police";
    case "Control Room / 999":
    case "Fire Control / 999":
      return "control";
    case "Other":
      return "specialist";
    default:
      return null;
  }
}

const INSIGNIA: Record<ServiceKey, { colour: string; label: string; mark: React.ReactNode }> = {
  fire: {
    colour: "#dc2626",
    label: "FIRE & RESCUE",
    // Eight-pointed star — the fire service's own mark, simplified.
    mark: (
      <path d="M14 5 L16 11 L22 9 L18 14 L22 19 L16 17 L14 23 L12 17 L6 19 L10 14 L6 9 L12 11 Z" fill="#fff" />
    ),
  },
  ambulance: {
    colour: "#15803d",
    label: "AMBULANCE",
    // Star of Life — six spokes.
    mark: (
      <g stroke="#fff" strokeWidth={3.2}>
        <line x1={14} y1={6} x2={14} y2={22} />
        <line x1={7.1} y1={10} x2={20.9} y2={18} />
        <line x1={7.1} y1={18} x2={20.9} y2={10} />
      </g>
    ),
  },
  police: {
    colour: "#1d4ed8",
    label: "POLICE",
    // Battenberg check.
    mark: (
      <g fill="#fff">
        <rect x={4} y={9} width={5} height={5} />
        <rect x={14} y={9} width={5} height={5} />
        <rect x={9} y={14} width={5} height={5} />
        <rect x={19} y={14} width={5} height={5} />
      </g>
    ),
  },
  control: {
    // Amber, deliberately not fire red: control room experience spans all
    // three services — NWFC, NWAS EOC, GMP FCC — so the badge belongs to
    // the discipline, not to one service's colour.
    colour: "#b45309",
    label: "CONTROL ROOM OPS",
    mark: (
      <g>
        <path
          d="M8 16 v-2 a6 6 0 0 1 12 0 v2"
          fill="none"
          stroke="#fff"
          strokeWidth={2.2}
          strokeLinecap="round"
        />
        <rect x={6.2} y={15} width={3.6} height={6} rx={1.4} fill="#fff" />
        <rect x={18.2} y={15} width={3.6} height={6} rx={1.4} fill="#fff" />
      </g>
    ),
  },
  specialist: {
    colour: "#52525b",
    label: "SPECIALIST",
    // Four-pointed star for backgrounds that fit no single service —
    // military medics, coastguard, mountain rescue.
    mark: (
      <path d="M14 5 L16.2 11.8 L23 14 L16.2 16.2 L14 23 L11.8 16.2 L5 14 L11.8 11.8 Z" fill="#fff" />
    ),
  },
};

/** The square symbol alone — beside a callsign in the menu strip. */
export function ServiceSymbol({
  service,
  size = 20,
}: {
  service: ServiceKey;
  size?: number;
}) {
  const s = INSIGNIA[service];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      role="img"
      aria-label={`${s.label} insignia`}
      className="inline-block align-middle"
    >
      <rect x={1} y={1} width={26} height={26} rx={3} fill={s.colour} stroke="#fff" strokeWidth={1.5} />
      {s.mark}
    </svg>
  );
}

/** Symbol plus the callsign-style plate — the full badge for a profile. */
export function ServiceBadge({
  service,
  role = "ADVISOR",
}: {
  service: ServiceKey;
  role?: string;
}) {
  const s = INSIGNIA[service];
  return (
    <span className="inline-flex items-center">
      <ServiceSymbol service={service} size={28} />
      <span
        className="inline-flex h-[28px] items-center px-2.5 font-mono text-[11px] tracking-[0.08em] text-[#18181b]"
        style={{
          background: "#fff",
          border: `1.5px solid ${s.colour}`,
          borderLeft: "none",
          borderRadius: "0 3px 3px 0",
        }}
      >
        {role} · {s.label}
      </span>
    </span>
  );
}
