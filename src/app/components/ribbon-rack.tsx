// The ribbon rack: an operator's honours as medal ribbons, mounted in
// rows with the highest precedence top left. Each ribbon is its own SVG,
// the stripes in the award's colours, a bar or two or a rosette for the
// tier, a touch of sheen so it reads as cloth rather than a flat bar.
// Works in server and client components alike; no hooks.

import { groupLabel, rackRows, tierLabel, type Award, type EarnedHonour } from "@/lib/awards";
import styles from "@/app/menu/watch-menu.module.css";

const W = 64;
const H = 20;

/** The devices worn on a ribbon for its tier. */
function Device({ tier }: { tier: number }) {
  if (tier <= 0) return null;
  if (tier === 3) {
    return (
      <g>
        <circle cx={W / 2} cy={H / 2} r={4.4} fill="#e6b65c" stroke="#7a5a1e" strokeWidth={0.8} />
        <circle cx={W / 2} cy={H / 2} r={1.7} fill="#7a5a1e" />
      </g>
    );
  }
  const bar = (y: number) => <rect key={y} x={13} y={y} width={W - 26} height={3} rx={0.6} fill="#d6dce2" stroke="#3a4046" strokeWidth={0.6} />;
  return <g>{tier === 1 ? bar(H / 2 - 1.5) : [bar(4.5), bar(H - 7.5)]}</g>;
}

export function Ribbon({ award, tier = 0, width = 64, title }: { award: Award; tier?: number; width?: number; title?: string }) {
  const height = Math.round((width * H) / W);
  // Where each stripe starts: the widths before it, as a share of the bar.
  const starts = award.stripes.map((_, i) => (award.stripes.slice(0, i).reduce((t, s) => t + s.width, 0) / 100) * W);
  return (
    <svg className={styles.ribbon} width={width} height={height} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title ?? award.name}>
      {title && <title>{title}</title>}
      {award.stripes.map((s, i) => <rect key={i} x={starts[i]} y={0} width={(s.width / 100) * W + 0.2} height={H} fill={s.colour} />)}
      {/* Cloth: a lighter top edge, a darker bottom, fine weave lines. */}
      <rect x={0} y={0} width={W} height={6} fill="#fff" opacity={0.1} />
      <rect x={0} y={H - 5} width={W} height={5} fill="#000" opacity={0.18} />
      {Array.from({ length: 9 }, (_, i) => <line key={i} x1={0} x2={W} y1={2 + i * 2} y2={2 + i * 2} stroke="#000" opacity={0.06} strokeWidth={0.5} />)}
      <Device tier={tier} />
      <rect x={0.5} y={0.5} width={W - 1} height={H - 1} fill="none" stroke="#000" opacity={0.6} strokeWidth={1} />
    </svg>
  );
}

/** The mounted rack. Empty when there is nothing to wear yet. */
export function RibbonRack({ honours, width = 64, columns = 4 }: { honours: EarnedHonour[]; width?: number; columns?: number }) {
  if (honours.length === 0) return null;
  return (
    <div className={styles.rack} aria-label="Ribbon rack">
      {rackRows(honours, columns).map((row, i) => (
        <div key={i} className={styles.rackRow}>
          {row.map((h) => <Ribbon key={h.award.key} award={h.award} tier={h.tier} width={width} title={`${tierLabel(h)} — ${h.detail}`} />)}
        </div>
      ))}
    </div>
  );
}

/** What each ribbon on the rack is, in the same order. */
export function HonourList({ honours }: { honours: EarnedHonour[] }) {
  if (honours.length === 0) return null;
  return (
    <ul className={styles.honours}>
      {honours.map((h) => (
        <li key={h.award.key} className={styles.honour}>
          <Ribbon award={h.award} tier={h.tier} width={48} />
          <div>
            <strong>{tierLabel(h)}</strong>
            <span className={styles.cardMeta}>{groupLabel(h.award.group)} · {h.detail}</span>
            <p>{h.award.citation}{h.grants.filter((g) => g.citation).map((g) => <em key={g.id}> &ldquo;{g.citation}&rdquo;</em>)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
