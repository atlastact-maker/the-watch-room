import type { ApplianceTypeCode } from "./types";

// Realistic UK make/model per appliance type. Synthetic but in the spirit of
// what the services actually operate (post-2020 fleet renewals).
export const MAKE_MODEL: Record<ApplianceTypeCode, { make: string; model: string }> = {
  WrL:         { make: "Volvo",          model: "FL 280 Pump Ladder" },
  WrT:         { make: "Volvo",          model: "FM Water Tower" },
  L6P:         { make: "Mercedes-Benz",  model: "Unimog U5023 Light Pump" },
  TL:          { make: "Volvo",          model: "FM / Bronto F32HDT" },
  HLP:         { make: "Volvo",          model: "FM / CTE B-Lift" },
  WIU:         { make: "Ford",           model: "Transit / Water Incident" },
  ICU:         { make: "Mercedes-Benz",  model: "Atego Command" },
  CSU:         { make: "Ford",           model: "Transit Command Support" },
  OSU:         { make: "Ford",           model: "Transit Ops Support" },
  FIU:         { make: "Ford",           model: "Ranger Investigation" },
  BASU:        { make: "DAF",            model: "CF BA Support" },
  BFU:         { make: "Volvo",          model: "FL Foam Unit" },
  SACU:        { make: "Ford",           model: "Transit (Salvation Army catering)" },
  WU:          { make: "Ford",           model: "Transit Welfare" },
  WFU:         { make: "Mercedes-Benz",  model: "Sprinter Wildfire Van" },
  ATV:         { make: "DAF",            model: "LF Beavertail + Hagglund BV206" },
  HLL:         { make: "DAF",            model: "CF Hose Layer" },
  PM:          { make: "DAF",            model: "CF Prime Mover" },
  TRU_pump:    { make: "Volvo",          model: "FL Technical Rescue" },
  TRU_van:     { make: "Ford",           model: "Transit Technical Rescue" },
  USAR:        { make: "DAF",            model: "CF USAR" },
  SDU:         { make: "Škoda",          model: "Octavia Scout (Search Dog)" },
  DIM:         { make: "Mercedes-Benz",  model: "Sprinter DIM" },

  // NWAS
  DCA:           { make: "Fiat",           model: "Ducato Emergency Ambulance" },
  RRV:           { make: "Škoda",          model: "Superb Estate RRV" },
  // HART, from the NWAS register (FOI24474, Manchester Central, Apr 2025).
  HART_vehicle:  { make: "MAN",            model: "TGE 5.160 Incident Response Unit" },
  NWAS_IRU:      { make: "MAN",            model: "TGE 5.160 Incident Support Unit" },
  HART_PCV:      { make: "MAN",            model: "TGE 5.160 Personnel Carrier" },
  HART_ORIRU:    { make: "Toyota",         model: "Hilux Active D-4D 4WD" },
  HART_ATV:      { make: "Polaris",        model: "Ranger 6x6 UTV" },
  HART_carrier:  { make: "DAF",            model: "LF 45.170 ATV Carrier" },
  HART_RRV:      { make: "Škoda",          model: "Kodiaq SE L 4x4" },
  HEMS:          { make: "Airbus",         model: "H145 HEMS" },
  BASICS:        { make: "Volunteer",      model: "Responder vehicle" },
  QR:            { make: "Škoda",          model: "Kodiaq Advanced Paramedic" },
  OD:            { make: "BMW",            model: "3-Series Touring Duty Officer" },
  CCC:           { make: "BMW",            model: "X5 Critical Care Car" },
  UCA:           { make: "Fiat",          model: "Ducato Urgent Care Ambulance" },
  CYC:           { make: "Cannondale",    model: "F-Si Response Bike" },
  DUTY_OFF:      { make: "Škoda",         model: "Kodiaq Duty Officer" },
  CHAP:          { make: "Škoda",         model: "Superb Estate Advanced Practitioner" },
  MIV:           { make: "MAN",           model: "TGE 5.160 Major Incident Vehicle" },
  MERIT:         { make: "Volvo",         model: "XC90 MERIT" },
  TAC_CMD:       { make: "BMW",           model: "X3 Tactical Commander" },
  STRAT_CMD:     { make: "BMW",           model: "5-Series Strategic Commander" },
  TAC_ADV:       { make: "Škoda",         model: "Kodiaq Tactical Advisor" },
  CFR:           { make: "Volunteer",     model: "Responder vehicle" },
  STAFF_RESP:    { make: "Staff",         model: "Own vehicle" },

  // GMP
  Police_Response:  { make: "BMW",           model: "3-Series Touring Response" },
  Police_ARV:       { make: "BMW",           model: "X5 Armed Response" },
  Police_NPAS:      { make: "Airbus",        model: "H145 / H135 NPAS" },
  Police_Dog:       { make: "Škoda",         model: "Kodiaq Dog Van" },
  Police_TraffMot:  { make: "BMW",           model: "R 1250 RT-P Roads Policing" },
  Police_RPU:       { make: "Volvo",         model: "V90 D5 Roads Policing" },
  Police_Search:    { make: "Ford",          model: "Transit POLSA" },
  Police_SIO:       { make: "Škoda",         model: "Superb SIO" },
};

// UK current-style plate: two letters + 2-digit year + 3 letters.
// Fire / ambulance services use standard plates (though often with a service
// fleet number sticker — we model the VRM only).
const LETTER_POOL = "ABCDEFGHJKLMNOPRSTUVWXYZ"; // DVLA omits I, Q, Z in certain positions; keep a safe pool.

function randLetters(n: number, rnd: () => number): string {
  let s = "";
  for (let i = 0; i < n; i++) {
    s += LETTER_POOL[Math.floor(rnd() * LETTER_POOL.length)];
  }
  return s;
}

export function generateVrm(rnd: () => number = Math.random): string {
  // 2-letter area + 2-digit year (25 or 26) + 3-letter suffix.
  const area = randLetters(2, rnd);
  const year = rnd() < 0.4 ? "25" : "26";
  const suffix = randLetters(3, rnd);
  return `${area}${year} ${suffix}`;
}
