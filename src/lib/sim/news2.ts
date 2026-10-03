// NEWS2 — the National Early Warning Score as the Royal College of
// Physicians scores it (2017), scale 1 for the saturation. Each parameter
// scores 0 to 3; the total and whether any single parameter scored 3
// decide the band. The tablet shows it the way a crew reads it: the
// number, the band, and which parameters are driving it.

export type News2Input = {
  rr: number;
  spo2: number;
  bpSys: number;
  hr: number;
  temp: number;
  /** Alert, or new confusion / voice / pain / unresponsive. */
  alert: boolean;
  /** Supplemental oxygen in use. */
  onOxygen: boolean;
};

export type News2Part = { key: string; label: string; short: string; value: string; score: number };

export type News2 = {
  total: number;
  /** low 0–4 · low-medium: a single 3 · medium 5–6 · high 7+ */
  band: "low" | "low_medium" | "medium" | "high";
  parts: News2Part[];
  /** What the band asks for, in the words of the chart. */
  response: string;
};

const band = (score: number, lo: number, hi: number) => (score >= lo && score <= hi ? 0 : -1);

export function news2(v: News2Input): News2 {
  const rr = v.rr <= 8 ? 3 : v.rr <= 11 ? 1 : v.rr <= 20 ? 0 : v.rr <= 24 ? 2 : 3;
  const spo2 = v.spo2 <= 91 ? 3 : v.spo2 <= 93 ? 2 : v.spo2 <= 95 ? 1 : 0;
  const o2 = v.onOxygen ? 2 : 0;
  const sys = v.bpSys <= 90 ? 3 : v.bpSys <= 100 ? 2 : v.bpSys <= 110 ? 1 : v.bpSys <= 219 ? 0 : 3;
  const hr = v.hr <= 40 ? 3 : v.hr <= 50 ? 1 : v.hr <= 90 ? 0 : v.hr <= 110 ? 1 : v.hr <= 130 ? 2 : 3;
  const acvpu = v.alert ? 0 : 3;
  const temp = v.temp <= 35 ? 3 : v.temp <= 36 ? 1 : v.temp <= 38 ? 0 : v.temp <= 39 ? 1 : 2;
  void band;
  const parts: News2Part[] = [
    { key: "rr", label: "Resp rate", short: "RR", value: `${Math.round(v.rr)}`, score: rr },
    { key: "spo2", label: "SpO₂", short: "SpO₂", value: `${Math.round(v.spo2)}%`, score: spo2 },
    { key: "o2", label: "Air or O₂", short: "O₂", value: v.onOxygen ? "O₂" : "Air", score: o2 },
    { key: "sys", label: "Systolic", short: "SBP", value: `${Math.round(v.bpSys)}`, score: sys },
    { key: "hr", label: "Pulse", short: "HR", value: `${Math.round(v.hr)}`, score: hr },
    { key: "acvpu", label: "ACVPU", short: "ACVPU", value: v.alert ? "A" : "CVPU", score: acvpu },
    { key: "temp", label: "Temp", short: "Temp", value: `${v.temp.toFixed(1)}`, score: temp },
  ];
  const total = parts.reduce((n, p) => n + p.score, 0);
  const any3 = parts.some((p) => p.score === 3);
  const b: News2["band"] = total >= 7 ? "high" : total >= 5 ? "medium" : any3 ? "low_medium" : "low";
  const response =
    b === "high" ? "Emergency response — time critical, pre-alert"
    : b === "medium" ? "Urgent response — senior clinician, convey"
    : b === "low_medium" ? "One parameter at 3 — review, do not sit on it"
    : "Routine monitoring";
  return { total, band: b, parts, response };
}
