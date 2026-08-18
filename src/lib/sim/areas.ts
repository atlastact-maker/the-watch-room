import type { AreaCode } from "./types";

export const AREAS: { code: Exclude<AreaCode, "ForceWide">; label: string; blurb: string }[] = [
  {
    code: "Southern",
    label: "Southern",
    blurb: "Manchester, Trafford, Stockport — central conurbation, motorways, Wythenshawe, airport fringe.",
  },
  {
    code: "Eastern",
    label: "Eastern",
    blurb: "Rochdale, Oldham, Bury, Ashton, Tameside — moorland fringe, wildfire risk.",
  },
  {
    code: "Western",
    label: "Western",
    blurb: "Bolton, Wigan, Salford, Eccles, Irlam — industry, M61/M62/M60 corridor.",
  },
];
