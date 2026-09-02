# Cardiac arrest — UK clinical reference

Compiled 2026-09-02 for the resuscitation mechanic. Authorities are
Resuscitation Council UK **Guidelines 2025** (published 27 Oct 2025,
adopting ERC 2025), JRCALC / UK Ambulance Services Clinical Practice
Guidelines, and NHS England. US AHA guidance is deliberately excluded.

This is a game-design reference, not clinical guidance. Where a fact
could not be verified it is marked UNVERIFIED and must stay that way.

---

## Part 1 — The ALS algorithm

# UK ADULT CARDIAC ARREST — RESUS COUNCIL UK / JRCALC / NICE

**Currency note:** RCUK published **Guidelines 2025 on 27 October 2025** (adopting ERC 2025). These supersede the 2021 guidelines. RCUK states: *"There are no major changes in these 2025 Adult Advanced Life Support (ALS) Guidelines since the previous ALS guidelines in 2021."* All ALS content below is from the 2025 pages unless flagged.

---

## (1) THE ALS LOOP — VERIFIED (RCUK 2025 Adult ALS + Adult ALS algorithm 2025 PDF + Adult BLS 2025)

**Algorithm entry (verbatim from the 2025 Adult ALS algorithm PDF):**
`Unresponsive with absent or abnormal breathing` → `Call resuscitation team/ambulance service` → `CPR 30:2 / Attach defibrillator` → `Assess rhythm` → branches to **SHOCKABLE (VF/Pulseless VT)** / **ROSC** / **NON-SHOCKABLE (PEA/Asystole)**.

| Parameter | Value | Source |
|---|---|---|
| CPR cycle length | **2 minutes**, then rhythm check | RCUK 2025 ALS: *"Use single shocks followed by a 2-minute cycle of chest compressions."* Algorithm: *"Immediately resume CPR for 2 min"* on both branches |
| Rhythm check interval | Every **2 min** | 2025: *"the underlying cardiac arrest rhythm may guide the decision to perform a rhythm and pulse check every two minutes"* |
| Compression rate | **100–120 min⁻¹** | RCUK 2025 **Adult BLS** (ALS page does not restate it) |
| Compression depth | **At least 5 cm, not more than 6 cm** | RCUK 2025 Adult BLS |
| Recoil | *"Allow the chest to recoil completely after each compression; avoid leaning on the chest."* | RCUK 2025 Adult BLS |
| Ratio — no advanced airway | **30:2** | Algorithm box `CPR 30:2` |
| Ratio — with tracheal tube or SGA | **Continuous compressions, ventilate at 10 min⁻¹** — *"Once a tracheal tube or an SGA has been inserted, ventilate the lungs at a rate of 10 min⁻¹ and continue chest compressions without pausing during ventilations."* | RCUK 2025 ALS |
| SGA exception | *"With an SGA, if gas leakage results in inadequate ventilation, pause compressions for ventilation using a compression-ventilation ratio of 30:2."* | RCUK 2025 ALS |
| Inspiratory time | *"Give each inspiratory breath over 1 s to achieve a visible chest rise."* | RCUK 2025 ALS |
| Mechanical ventilator settings during CPR | Volume-controlled; TV **6–8 mL kg⁻¹** predicted IBW; max FiO₂; RR **10 min⁻¹**; Ti **1–2 s**; PEEP **0–5 cmH₂O**; peak-pressure alarm **60–70 cmH₂O**; flow trigger off | RCUK 2025 ALS |

**PAUSE DISCIPLINE (the key modelling lever) — verbatim:**
- *"Deliver shocks with minimal interruption to chest compressions and minimise the pre-shock and post-shock pause. This is achieved by continuing chest compressions during defibrillator charging, delivering defibrillation, **aiming for an interruption in chest compressions of less than 5 s** and then immediately resuming chest compressions."*
- *"Manual defibrillators should only be used by rescuers who can quickly and accurately identify a cardiac arrest rhythm (**within 5 s**) and, if needed, deliver a safe shock with minimal interruption (**aim for less than 5 s**) to chest compressions."*
- *"Charging the defibrillator in anticipation of each rhythm check may minimise hands-off time prior to shock delivery and is an acceptable alternative strategy if delivered without prolonging the peri-shock pause."*
- *"Aim for **less than a 5 s** interruption in chest compression for tracheal intubation."*
- *"A shock with a manual defibrillator can be safely delivered without interrupting mechanical chest compression."*
- *"Do not defibrillate during manual chest compressions (even when wearing clinical gloves), as that practice is not safe to the rescuer."*
- Asystole shortcut (new emphasis): *"When using a defibrillator that displays the ECG with the motion artefact caused by chest compressions removed… If asystole is displayed, there would be no need to pause chest compressions for a rhythm check."*
- Fire safety: remove O₂ mask/nasal cannulae and place **≥1 m** from the chest; self-inflating bag / circuit may stay attached to SGA/ETT.

---

## (2) SHOCKABLE (VF/pVT) PATHWAY — VERIFIED (RCUK 2025)

**Defibrillation energies (biphasic, adult, UK):**
- **First shock: at least 150 J** for *rectilinear biphasic* or *truncated exponential biphasic*.
- **Pulsed biphasic: first shock 130–150 J.**
- Subsequent: *"If the first shock is not successful and the defibrillator is capable of delivering shocks of higher energy, it is reasonable to increase the energy for subsequent shocks."*
- *"If the rescuer is unaware of the recommended energy settings of the defibrillator, for an adult, **use the highest energy setting for all shocks**."*
- *"Use standard energy levels in obese patients."*
- **Rationale (RCUK ALS FAQ):** the 2021 wording allowed **120–360 J** — *"any energy level within this range is acceptable for the initial shock, followed by a fixed or escalating strategy up to maximum output of the defibrillator."* For 2025 they moved to a single 150 J floor because *"there is weak evidence that 120 J may not be as effective as 150 J as a starting energy level"* and *"there is no evidence that higher biphasic energy levels cause myocardial damage."*
- **Stacked shocks:** up to **three stacked shocks** only if VF/pVT occurs during a **witnessed, monitored** arrest with a defibrillator immediately available (cath lab, highly monitored setting). *"For the purposes of adrenaline and amiodarone administration, the initial stacked shocks should be counted as the first shock in the ALS algorithm."*
- **Cath-lab modification (2025):** *"Apply 3 consecutive shocks in case of an initial shockable rhythm."*

**Pads (upgraded emphasis in 2025):**
- Antero-lateral is the initial position of choice; **lateral (apical) pad directly below the armpit in the mid-axillary line**.
- **Refractory VF = continuous VF after three consecutive shocks.** *"After a failed third shock, prepare to place a fresh set of pads in the anterior-posterior position at the time of the following rhythm check."* Anterior pad left of sternum; posterior pad at same height, just medial to left scapula. Shave if needed.
- ICD present: place pad **>8 cm** from the device.
- **Dual (double) sequential defibrillation: RCUK does NOT recommend routine use.**

**Drug timing on the shockable branch:**
| Drug | Trigger | Dose | Repeat |
|---|---|---|---|
| **Adrenaline** | **After the 3rd shock** | **1 mg IV/IO** | **Every 3–5 min** while ALS continues (i.e. **alternate 2-min loops**) |
| **Amiodarone** | **After a total of 3 shocks** | **300 mg IV** | **150 mg IV after a total of 5 shocks** |
| **Lidocaine** (alternative) | Only *"if amiodarone is not available or a local decision has been made to use lidocaine instead"* | **100 mg IV** | **Additional bolus 50 mg after five defibrillation attempts** |

- *"Give the first dose of amiodarone after three shocks, and the second dose after five shocks, **irrespective of whether the shockable rhythms are sequential (refractory VF/pVT) or intermittent (recurrent VF/pVT)**."*
- **Lidocaine ceiling (RCUK ALS Manual Appendix A):** initial 100 mg (**1–1.5 mg kg⁻¹**); additional 50 mg; *"The total dose should not exceed **3 mg kg⁻¹** during the first hour."*
- **JRCALC/UK ambulance presentation:** adrenaline **1 mg = 10 mL of 1:10,000** (or 1 mL of 1:1,000); amiodarone **300 mg in 10 mL pre-filled syringe**.
- **Withholding rule (RCUK ALS FAQ):** if ROSC is likely on a *combination* of signs during the 2 min (waking, purposeful movement, sudden ETCO₂ rise) — **withhold adrenaline**. A change in the ECG alone is not sufficient.
- **UK legal mechanism:** Human Medicines Regulations 2012 lets holders of a current **RCUK ALS provider certificate administer adrenaline and amiodarone without prescription to *adults* in cardiac arrest**. Does **not** extend to children, nor to in-house/ERC/ARC certificates. (JRCALC/paramedics operate under Sch.17 exemptions.)

---

## (3) NON-SHOCKABLE (PEA/ASYSTOLE) PATHWAY — VERIFIED (RCUK 2025)

- **Adrenaline 1 mg IV/IO as soon as possible.** Algorithm box: `Give adrenaline` → `then every 3–5 min`. RCUK 2025 key point: *"it should be given as soon as possible when the cardiac arrest rhythm is non-shockable."*
- JRCALC/ALS Manual phrasing: *"Given as soon as circulatory access is obtained"*, *"Repeated every 3–5 min (alternate loops)"*, *"Give without interrupting chest compressions."*
- **Explicitly NOT given:**
  - **No amiodarone / no antiarrhythmic.** ALS Manual Appendix A, non-shockable column: *"Not indicated for PEA or asystole."*
  - **No routine calcium, sodium bicarbonate or corticosteroids** — RCUK 2025: *"Do not routinely give calcium, sodium bicarbonate or corticosteroids during cardiac arrest."*
  - **No routine fluids** — *"Give fluids during CPR only if cardiac arrest is caused by hypovolaemia."*
  - **No atropine** (removed from the arrest algorithm years ago; it survives only in the bradycardia algorithm at 500 mcg IV up to 3 mg total).
  - IHCA systems target: *"give adrenaline rapidly for non-shockable rhythms."*
- **Reversible causes (2025 algorithm box, reworded from classic 4H/4T):** Hypoxia · Hypovolaemia · **Hyper-/hypokalaemia, -calcaemia, -magnesaemia, hypoglycaemia (metabolic)** · Hypo-/hyperthermia · Thrombosis (coronary/pulmonary) · Tension pneumothorax · Toxins · Tamponade (cardiac).
- **Vascular access order (2025):** *"Attempt intravenous (IV) rather than intraosseous (IO) access first… If IV access cannot be rapidly achieved **within two attempts**, it is reasonable to consider IO access."*

---

## (4) DRUG LIST — UK ADULT DOSES, ROUTES, HARMS

Sources keyed: **[RCUK25]** RCUK 2025 guidelines; **[AppA]** RCUK ALS Manual Appendix A "Drugs Used in the Treatment of Cardiac Arrest"; **[JRCALC]** JRCALC UK Ambulance Service CPG drug protocols; **[BNF]** BNF (NICE).

### ADRENALINE (epinephrine)
- **Dose/route:** 1 mg IV/IO (**10 mL of 1:10,000**, or 1 mL of 1:1,000). Repeat every 3–5 min. [RCUK25/JRCALC]
- **Indication in arrest:** *all* rhythms — shockable after 3rd shock, non-shockable ASAP.
- **Titrated variant (invasive monitoring only):** *"we suggest that adrenaline is initially given in small increments (e.g. **50–100 micrograms IV**) rather than a 1 mg bolus. If a total of 1 mg has been given with no response… consider giving further IV adrenaline doses of 1 mg every 3–5 min."* [RCUK25]
- **Onset/duration:** IV bolus onset seconds; plasma half-life ~2–3 min — this is precisely why the redose interval is 3–5 min. *(Half-life figure not sourced from a UK guideline in this research — flagged.)*
- **Mechanism/harms [AppA, verbatim]:** *"Its alpha-adrenergic effects cause systemic vasoconstriction, which increases coronary and cerebral perfusion pressures. The beta-adrenergic actions… may increase coronary and cerebral blood flow, but concomitant increases in **myocardial oxygen consumption** and **ectopic ventricular arrhythmias (particularly in the presence of acidaemia)**, **transient hypoxaemia because of pulmonary arteriovenous shunting**, **impaired microcirculation**, and **increased post cardiac arrest myocardial dysfunction** may offset these benefits."*
- **BNF adverse effects (IV):** arrhythmias, angina, myocardial infarction, hypertension (*"increased risk of cerebral haemorrhage"*), CNS haemorrhage, hyperglycaemia, **hypokalaemia**, metabolic acidosis, pulmonary oedema (excessive dosage), tissue/soft tissue/intestinal/renal necrosis, injection-site necrosis; common: anxiety, palpitations, tremor.
- **Given wrongly:** in a **hypothermic** arrest — *"Below 30°C, adrenaline will accumulate and may have more detrimental than beneficial effects. Give IV 1 mg adrenaline (1:10,000) once the core temperature reaches 30°C… **Increase administration intervals for adrenaline to 6–10 min if the core temperature is 30–35°C**."* [RCUK25 Special Circumstances]. JRCALC contraindication: *"Do not give repeated doses of adrenaline in hypothermic patients."*
- **Model hook:** giving it when ROSC has already occurred → hypertensive surge, recurrent VF/tachyarrhythmia.

### AMIODARONE
- **Dose/route:** **300 mg IV/IO bolus after 3 shocks; 150 mg after 5 shocks.** Pre-filled syringe 300 mg/10 mL. [RCUK25/JRCALC]
- **BNF confirms the CPR indication verbatim:** *"Initially 300 mg for 1 dose… then 150 mg for 1 dose… consult Resuscitation Council (UK) guidelines."*
- **NOT indicated in PEA/asystole.** [AppA]
- **Mechanism [AppA]:** *"membrane-stabilising anti-arrhythmic… increases the duration of the action potential and refractory period… mild negative inotropic action and causes peripheral vasodilation through non-competitive alpha-blocking effects."*
- **Harms:** *"The hypotension that occurs with intravenous amiodarone is related to the rate of delivery and is caused by the solvent, rather than the drug itself."* [AppA]. JRCALC side-effects list: **bradycardia; vasodilatation causing hypotension, flushing; bronchospasm; arrhythmias — torsade de pointes.** BNF (parenteral): **hypotension (following rapid injection)**; rare — hot flush, hyperhidrosis, interstitial pneumonitis, pulmonary toxicity, agranulocytosis/neutropenia.
- **Practical:** *"Amiodarone should be flushed with 0.9% sodium chloride or 5% dextrose"* [AppA]; BNF: *"Incompatible with Sodium Chloride infusion fluids"* for infusion — for CPR bolus, *"a peripheral venous route can be used if central venous access is not available; the peripheral line should be flushed liberally."* JRCALC: *"Administer into large vein as extravasation can cause burns"*; *"NEVER to be given via endotracheal route."*
- **Contra-indications in cardiac arrest:** BNF explicitly exempts arrest — sino-atrial block and sinus bradycardia are contraindications *"except in cardiac arrest."*

### LIDOCAINE (lignocaine)
- **Dose:** **100 mg IV (1–1.5 mg kg⁻¹)** after 3 shocks; **+50 mg** after five defibrillation attempts; **max 3 mg kg⁻¹ in the first hour**. Only as an amiodarone substitute. [RCUK25/AppA]
- **Harms [BNF, parenteral]:** *"Anxiety; arrhythmias; atrioventricular block; **cardiac arrest**; circulatory collapse; confusion; dizziness; drowsiness; euphoric mood; **hypotension (may lead to cardiac arrest)**; loss of consciousness; **methaemoglobinaemia**; muscle twitching; **myocardial contractility decreased**; nystagmus; psychosis; **seizure**; tinnitus; tremor; vision blurred."*
- **Given wrongly:** overdose → local-anaesthetic systemic toxicity (CNS then CVS collapse). BNF contraindications (IV): *"All grades of atrioventricular block; severe myocardial depression; sino-atrial disorders."*
- **Modelling note:** most UK ambulance trusts carry amiodarone, not IV lidocaine, for arrest — SECAmb's formulary lists lidocaine only as a local anaesthetic (1% SC).

### SODIUM BICARBONATE 8.4%
- **RCUK 2025: NOT routine** — *"Do not routinely give calcium, sodium bicarbonate or corticosteroids during cardiac arrest."*
- **Indicated only for:** **hyperkalaemic cardiac arrest** and **tricyclic antidepressant overdose**. [AppA]
- **Dose:** **50 mmol = 50 mL of 8.4% IV**. [AppA]. Hyperkalaemic arrest 2025: *"administer 10 mL 10% calcium chloride IV **and 50 mmol sodium bicarbonate IV**, through separate lines or with a flush in between."*
- **Harms when given wrongly [AppA, verbatim]:** *"Bicarbonate causes generation of carbon dioxide, which diffuses rapidly into cells. This has the following effects: it **exacerbates intracellular acidosis**; it produces a **negative inotropic effect on ischaemic myocardium**; it presents a **large, osmotically-active sodium load** to an already compromised circulation and brain; it produces a **shift to the left in the oxygen dissociation curve, further inhibiting release of oxygen to the tissues**."* Plus: *"Do not give calcium solutions and sodium bicarbonate simultaneously by the same route."*
- **BNF (IV):** skin exfoliation, soft tissue necrosis, ulcer; systemically metabolic alkalosis, hypokalaemia, sodium/fluid overload, pulmonary oedema. *"Extravasation can cause severe tissue damage."*
- **UK ambulance reality:** sodium bicarbonate does **not** appear in the JRCALC paramedic drug formulary (0 hits in the 2006 JRCALC CPG) nor in SECAmb's trust formulary. Realistically a HEMS/critical-care-paramedic or in-hospital drug in a UK sim.

### CALCIUM CHLORIDE / CALCIUM GLUCONATE
- **RCUK 2025: NOT routine.**
- **Indications [AppA]:** *"PEA caused specifically by **hyperkalaemia, hypocalcaemia or overdose of calcium channel blocking drugs**."*
- **Dose:** **10 mL of 10% calcium chloride (6.8 mmol Ca²⁺) IV** [AppA/BNF]. RCUK 2025 hyperkalaemia (with ECG changes, not arrested): *"10 mL of 10% calcium chloride IV over 5 min; **if this is not available, give 30 mL of 10% calcium gluconate over 10 min**."* In hyperkalaemic **arrest**: 10 mL 10% CaCl₂ IV (plus bicarb, separate lines). BNF: repeat if no ECG improvement within **5–10 minutes**.
- **Harms [AppA, verbatim]:** *"High plasma concentrations achieved after injection may be **harmful to the ischaemic myocardium** and may **impair cerebral recovery**. Do not give calcium solutions and sodium bicarbonate simultaneously by the same route."*
- **BNF:** hypercalcaemia; calcium chloride specifically — **soft tissue calcification**, vasodilation; *"Care should be taken to avoid extravasation. Incompatible with bicarbonates, phosphates, or sulfates."* MHRA warning exists re under-dosing if gluconate substituted 1:1 for chloride in severe hyperkalaemia.
- **UK ambulance reality:** SECAmb lists calcium chloride 10%/10 mL restricted to **Critical Care Paramedic** level. Not in the standard JRCALC paramedic formulary.

### MAGNESIUM SULFATE
- **Not mentioned in RCUK 2025 Adult ALS.** Dose comes from **[AppA]**: **2 g IV given peripherally; may be repeated after 10–15 min.**
- **Indications [AppA]:** shockable — *"VT, torsade de pointes, or digoxin toxicity associated with hypomagnesaemia"*; non-shockable — *"supraventricular tachycardia or digoxin toxicity associated with hypomagnesaemia."*
- **Mechanism [AppA]:** *"decreases acetylcholine release and reduces the sensitivity of the motor endplate… improves the contractile response of the stunned myocardium, and may limit infarct size."*
- **Harms [BNF overdose profile — this is the modellable one]:** *"Symptoms of hypermagnesaemia may include nausea, vomiting, flushing, thirst, **hypotension**, drowsiness, confusion, **reflexes absent (due to neuromuscular blockade)**, **respiratory depression**, speech slurred, diplopia, **muscle weakness**, **arrhythmias**, **coma**, and **cardiac arrest**."* Avoid/reduce in renal impairment (toxicity risk).
- **UK ambulance reality:** SECAmb carries magnesium sulphate **2 g or 4 g IV/IO under PGD** (asthma/eclampsia indications) — not as a routine arrest drug.

### NALOXONE
- **RCUK 2025 gives no arrest-specific naloxone recommendation.** Toxins section only: *"Administer antidotes, where available, as soon as possible"* and *"Be prepared to continue resuscitation for a prolonged period of time."* **Naloxone is not a cardiac arrest drug** — opioid-related arrest is treated with **standard ALS**; naloxone's role is in respiratory depression/arrest **before** cardiac arrest. (Flagged: I found no RCUK 2025 statement either way.)
- **JRCALC dose (adult):** presentation **400 micrograms/1 mL ampoule**.
  - Respiratory arrest/extreme depression, *"when the URGENCY of the situation outweighs the need for a controlled effect"*: **400 mcg IV (1 mL)** or **800 mcg IM (2 mL)**. *"If there is no response administer further doses of 400 micrograms, every 2–3 minutes until an effect is noted."* **Maximum dose 10 mg** (25 × 400 mcg).
  - Controlled effect (aggressive/dependent patient): dilute up to **800 mcg (2 mL) into 8 mL** water/0.9% NaCl (total 10 mL), slow IV titrated to response — *"Aim to relieve respiratory depression, but maintain patient in 'groggy' state."*
  - *"The effects of naloxone are short lived and patients frequently relapse once the drug has worn off"* — transport all opioid overdoses. Loading dose **800 mcg IM** if the patient refuses transport.
- **Routes in UK ambulance use:** IV / IO / IM / **IN** (intranasal).
- **Harms [JRCALC]:** *"In patients who are physically dependent on narcotic drugs, **violent withdrawal symptoms, including cardiac arrhythmias**, may be precipitated by naloxone."* **[BNF]** common/very common: **arrhythmias**, hypertension, hypotension, dizziness, nausea, vomiting; rare: **cardiac arrest, pulmonary oedema**, seizure; frequency not known: analgesia reversed, death.
- **Contraindication [JRCALC]:** *"Neonates born to opioid addicted mothers — produces serious withdrawal effects."*

### GLUCOSE 10% / DEXTROSE
- **Role in arrest:** hypoglycaemia is a **reversible cause** — 2025 algorithm lists *"hypoglycaemia (metabolic)"* explicitly in the reversible-causes box.
- **JRCALC adult dose:** 500 mL bag of 10% glucose (50 g). Give **100 mL (10 g) at a time IV**; *"The dose may be repeated after 5 minutes if there is no response"*; titrate to a **maximum of 300 mL (30 g)**. Children <40 kg: **5 mL/kg**.
- **Harm when given wrongly [AppA, verbatim]:** *"**Avoid dextrose**, which is redistributed away from the intravascular space rapidly and **causes hyperglycaemia, which may worsen neurological outcome after cardiac arrest**."* Post-ROSC: RCUK 2025 — *"Use standard glucose management protocols."*
- Also: large-bore cannula, confirm position with a 10–20 mL flush; extravasation of hypertonic glucose causes tissue injury.

### FLUIDS (CRYSTALLOID)
- **RCUK 2025 (verbatim):** *"Give fluids during CPR **only if cardiac arrest is caused by hypovolaemia**. Use either **isotonic saline or balanced crystalloids** for fluid infusion during CPR."*
- **[AppA]:** *"Infuse fluids rapidly if hypovolaemia is suspected. During resuscitation, there are no clear advantages in using colloid, so use **0.9% sodium chloride or Hartmann's solution**."*
- **Harm when given wrongly:** dilutional — reduced coronary perfusion pressure, raised right-atrial pressure, worsened oxygen-carrying capacity, hypothermia; plus the dextrose harm above. Post-ROSC: RCUK 2025 recommends **against** *"routine use of prehospital cooling with rapid infusion of large volumes of cold intravenous fluid immediately after ROSC."*

### TRANEXAMIC ACID
- **Not a medical-arrest drug.** Belongs to the **traumatic cardiac arrest** pathway (haemorrhage control limb) — the RCUK 2025 traumatic CA algorithm lists *"Blood products/massive haemorrhage protocol"* but **does not name TXA**.
- **JRCALC:** presentation **500 mg in 5 mL (100 mg/mL)**. Indications: *"Patients with TIME CRITICAL injury where significant internal/external haemorrhage is suspected"*; Step 1/Step 2 trauma triage; **post-partum haemorrhage** alongside uterotonics. Contra-indications: *"Isolated head injury; critical interventions required…; bleeding now stopped."* Side effects: *"Rapid injection might rarely cause **hypotension**."*
- **UK ambulance dose (SECAmb PGD, built on the SPS/NASMeD/JRCALC national template):** **1 g (10 mL) IV or IO over 10 minutes.** Trigger criteria: suspected/active blood loss, blood component transfusion, or any sign of shock (**SBP ≤ 90 mmHg or HR ≥ 110 bpm**).
- **BNF harms:** common — diarrhoea, nausea, vomiting; rare — **colour vision change (discontinue)**, **embolism and thrombosis**; frequency not known — **seizure (more common at high doses)**; IV specifically — **hypotension and malaise on rapid intravenous injection**. Administration: *"maximum rate of 100 mg/minute."*

### OTHER (worth having in a UK sim)
- **Thrombolysis:** *"Consider immediate thrombolytic drug therapy when pulmonary embolism is the suspected or confirmed cause of cardiac arrest."* Then *"consider CPR for **60–90 min** after administration"* [RCUK25]. Doses [AppA]: **tenecteplase 500–600 mcg kg⁻¹ IV bolus** or **alteplase 50 mg IV bolus**. *"Ongoing CPR is not a contraindication to fibrinolysis."*
- **Sedation during CPR-induced consciousness (uncommon but real):** *"small doses of fentanyl, ketamine and/or midazolam"*; **neuromuscular blockers alone must not be given to a conscious patient**.
- **Hyperkalaemia bundle [RCUK25]:** 10 units soluble insulin + 25 g glucose IV; nebulised salbutamol 10–20 mg; calcium; sodium zirconium cyclosilicate 10 g PO; dialysis; consider ECPR.
- **Hypokalaemic arrest [RCUK25]:** **20 mmol KCl IV/IO over 2–3 min, then 10 mmol over 2 min.**
- **Anaphylaxis [RCUK25]:** **IM adrenaline 500 mcg (1 mg/mL)**, repeat at 5 min if no improvement, plus early IV crystalloid bolus.

---

## (5) ROSC — RECOGNITION AND IMMEDIATE POST-ROSC CARE

**Recognition (RCUK 2025, verbatim):**
> *"If there is a combination of clinical and physiological signs of return of spontaneous circulation (ROSC) such as **return of consciousness, purposeful movement, a pulsatile arterial blood pressure waveform or a sharp rise in ETCO₂**, consider stopping chest compressions for rhythm analysis, and if appropriate, a pulse check."*

> *"An increase in ETCO₂ during CPR may indicate that ROSC has occurred. **However, chest compression should not be interrupted based on this sign alone.**"*

- Physiology-guided CPR targets while still in arrest: **diastolic BP ≥ 30 mmHg** (invasive line) and **ETCO₂ ≥ 3.3 kPa (25 mmHg)**.
- *(A specific "ETCO₂ jumps to >5.3 kPa / 40 mmHg = ROSC" threshold is widely taught but I could **not** verify it in RCUK 2025 — flagged as UNCERTAIN.)*
- Reverse signal: *"A sudden decrease in ETCO₂ may indicate a cardiac arrest or a very low cardiac output state."*

**Immediate post-ROSC (2025 ALS algorithm box, verbatim):** `ABCDE assessment` · `Aim SpO₂ 94–98% and normal PaCO₂` · `SBP > 100 mmHg` · `12-lead ECG` · `Identify and treat cause` · `Temperature control`

**Detailed targets (RCUK 2025 Post-resuscitation care):**
| Domain | Target |
|---|---|
| Oxygen, first minutes | **100% (or max available) inspired O₂** until SpO₂ can be measured reliably or PaO₂ obtained |
| Oxygen, then | **SpO₂ 94–98%**, or **PaO₂ 10–13 kPa (75–100 mmHg)**. Avoid hypoxaemia (**PaO₂ < 8 kPa / 60 mmHg**); avoid hyperoxaemia. Caveat: *"pulse oximetry can overestimate the true oxygen saturation in people with darker skin tones"* |
| Ventilation | **Normocapnia: PaCO₂ 4.7–6.0 kPa (35–45 mmHg)**; lung-protective **TV 6–8 mL kg⁻¹ IBW**; use ABG + ETCO₂ |
| Blood pressure | **SBP > 100 mmHg** (algorithm) / **MAP > 60–65 mmHg** (post-resus guideline). Arterial line for all. Maintain with **fluids, noradrenaline and/or dobutamine** |
| Airway | Intubate if comatose or otherwise indicated; confirm with **waveform capnography**. A brief arrest with immediate normal cerebral function and normal breathing may need only supplemental O₂ if **SpO₂ < 94%** |
| ECG | **12-lead ECG** — decides the destination |
| Temperature | **Actively prevent fever, target ≤ 37.5 °C** while comatose; prevent fever for **36–72 h**. Do **not** actively rewarm mild hypothermia 32–36 °C |
| Position | Nurse **30° head-up** |
| Arrhythmia | Follow peri-arrest arrhythmia guideline; **no routine antiarrhythmic prophylaxis** if no arrhythmia |
| Steroids / antibiotics | Not routine |
| Electrolytes | *"Avoid hypokalaemia and hyperkalaemia, which are associated with ventricular arrhythmias"* |

**DESTINATION DECISION (the sim-relevant branch):**
1. **ST-elevation on the 12-lead, or high suspicion of coronary occlusion (haemodynamic and/or electrical instability):** *"Prioritise immediate coronary angiography"* / *"Emergent cardiac catheterisation laboratory evaluation (and **primary percutaneous coronary intervention (PPCI)** if required)"* → **heart attack centre / PPCI centre, bypassing the nearest ED.**
2. **No ST-elevation after OHCA:** *"cardiac catheterisation laboratory evaluation should be **delayed** unless the clinical context suggests a high likelihood of acute coronary occlusion."* (This is the post-ARREST-trial position — routine expedited cath-lab transfer for non-STE OHCA is not recommended.)
3. **Cardiac arrest centre policy:** RCUK 2025 ALS (OHCA): *"Adults with non-traumatic OHCA should be **considered for transport to a cardiac arrest centre according to local protocols**, and take into account which interventions can be provided on scene."* Post-resus: *"Adult patients with non-traumatic OHCA should be cared for at a cardiac arrest centre whenever possible."*
4. **NICE NG185 (Acute coronary syndromes, 2020):** PPCI is the preferred reperfusion strategy if presentation is **within 12 h of symptom onset** and PPCI can be delivered **within 120 minutes of the time fibrinolysis could have been given**. *"Adults who are unconscious after cardiac arrest caused by suspected acute STEMI are not excluded from having coronary angiography (with follow-on primary PCI if indicated)"* — people who remain unconscious *"should not be treated differently from people who are conscious… and should be admitted to centres capable of undertaking primary PCI."*
5. **Refractory VF is a transport indication, not a stop indication** (JRCALC/AACE, via SCAS policy): *"Resuscitation should not therefore be stopped in cases of refractory or persistent VF. Where practical, transport patients with persistent/refractory VF or pulseless VT to a **cardiac arrest centre with ongoing CPR**."* Mechanical CPR is explicitly sanctioned for this: 2025 algorithm — *"Mechanical chest compressions to facilitate transfer/treatment."*
6. **Traumatic cardiac arrest with ROSC:** *"Immediate transport to appropriate hospital"* → **major trauma centre** for damage-control surgery/resuscitation.
7. **Hypothermic arrest / refractory arrest suitable for ECPR:** transfer directly to an **ECPR centre**; hypothermic transfer triggers = HR < 45 min⁻¹, SBP < 90 mmHg, ventricular arrhythmia, core temp < 30 °C.

---

## (6) STOPPING RESUSCITATION — UK CRITERIA AND AUTHORITY

### RCUK 2025 position
- **In-hospital:** *"Termination of resuscitation rules (TOR) should **not** be used as a sole strategy for terminating an in-hospital resuscitation attempt."*
- **Out-of-hospital:** *"Ambulance service systems should consider implementing **validated criteria for the withholding and termination of resuscitation (TOR)**, taking into consideration specific local legal, organisational and cultural context."*
- **RCUK ALS FAQ (verbatim, this is the number to model):** *"The European Resuscitation Council and Resuscitation Council UK guidelines describe that **persistent asystole despite 20 minutes of advanced life support (ALS) in the absence of any reversible cause is associated with poor prognosis**… A key point in our guidelines and those of JRCALC is that **termination based on the duration of resuscitation should only ever be considered where no reversible cause has been identified.** If there is a potentially reversible cause, then resuscitation efforts should be continued."* Also: *"survival, although rare, is possible after more than 20 minutes of advanced life [support]."*
- **Do not stop on a single number:** *"Do not use a low ETCO₂ value alone to decide if a resuscitation attempt should be stopped."* / *"Do not use POCUS for assessing contractility of the myocardium as a sole indicator for terminating CPR."* / *"Right ventricular dilation in isolation… should not be used to diagnose pulmonary embolism."*
- **A live UK evidence review is underway:** RCUK + JRCALC + NIHR (award 17/99/34) are modelling TOR rules for the UK; *"An update to our guidelines is likely to follow."*

### JRCALC "Recognition of Life Extinct (ROLE)" — the pre-hospital instrument
**A. Conditions unequivocally associated with death (do not start CPR; applies to all ages including children):**
1. Decapitation
2. Massive cranial and cerebral destruction
3. Hemicorporectomy (or similar massive injury)
4. Decomposition / putrefaction — *"where tissue damage indicates that the patient has been dead for some hours, days or longer"*
5. Incineration — *"the presence of full thickness burns with charring of greater than **95%** of the body surface"*
6. Hypostasis — *"the pooling of blood in congested vessels in the dependent part of the body"*; *"The presence of hypostasis is diagnostic of death"*
7. Rigor mortis — *"In children this can occur rapidly so resuscitation should be attempted unless there is another condition unequivocally associated with death"* (onset: face → arms → legs, **30 min to 3 h**)
8. Foetal maceration in a newborn
Plus: **submersion for longer than 90 minutes** (the 2013 algorithm phrases it as *"prolonged (>1.5 hours) submersion"*).
> For apparent **rigor mortis, hypostasis and foetal maceration**: *"take an ECG while confirming the absence of a pulse and breathing."*

**B. Futility criteria — resuscitation may be withheld/discontinued if ALL exist together (JRCALC 2013 flowchart + AACE/JRCALC verification-of-death guidance):**
- **More than 15 minutes** has elapsed since onset of cardiac arrest
- **No evidence of bystander CPR in the 15 minutes** before ambulance arrival
- Exclusion factors **absent**: **drowning, hypothermia, poisoning/overdose, pregnancy, child/neonate**
- **Asystole for > 30 seconds** on the ECG monitor. *"CPR should only be paused for a 30-second asystole check if all other criteria are met."*
- Plus valid **DNACPR / ReSPECT / ADRT**, or the final stages of an advanced and irreversible condition.

**C. Termination after ALS has started (AACE/JRCALC):**
> *"If, following **20 minutes of advanced life support interventions**, where **all reversible causes have been identified and corrected**, the patient remains in **asystole**, then resuscitation may be discontinued **except** in cases listed below: pregnancy; hypothermic patients (where hypothermia is the primary cause of the cardiac arrest); suspected drugs overdose/poisoning; infants, children and adolescents (i.e. all those < 18 yrs)."*
> *"These patients should be transported to the nearest facility with on-going resuscitation, unless the circumstances would make transport futile."*
- **ALS duration clock** *"starts at the time of the arrival of an ALS provider."*
- **Agonal rhythm:** *"A persistent agonal rhythm can be treated as asystole and resuscitation can be discontinued if it has persisted continuously for more than 20 mins"* (same reversible-cause proviso). Typically **< 10 bpm**, wide, low amplitude, irregular.
- **PEA:** no time-based rule. *"There is limited evidence to support when one should terminate a PEA cardiac arrest"*; factors to weigh: **time in arrest without life support; absence of reversible causes; co-morbidities; rate/width of the QRS complexes; the trend and absolute value of ETCO₂.** Senior clinician advice is the route.
- **Refractory VF:** do **not** stop — transport with ongoing CPR to a cardiac arrest centre (see §5).
- **Rhythm-confirmation rule:** *"in order to confirm death, the rhythm is unequivocally persistent and continuous asystole. If CPR is stopped when any other rhythm is present (i.e. agonal rhythm or PEA), it is important to wait until all cardiac electrical activity has ceased and the ECG shows asystole. Only at this stage should the patient be declared life extinct… because there have been well-documented cases where **spontaneous ROSC has occurred following termination of resuscitation**."*
- **Pregnancy (2013 ROLE algorithm):** *"Pregnancy is an indication for rapid transfer to hospital and should be initiated within **4 minutes** if there is no response to CPR."*
- **Trapped/inaccessible patients:** *"a multi-Agency decision (Fire, Police, Coast Guard etc.) should be made on whether ongoing rescue should continue or the incident becomes that of body recovery. **The JESIP principles should be followed**"* — directly relevant to a multi-agency sim.

**D. Who can make the call**
- **Registered paramedics** (and, per trust policy, some advanced/associate practitioner grades in defined circumstances) may perform ROLE and terminate resuscitation. *"Only Paramedics may terminate a resuscitation once a decision has been made that the conditions described in the ROLE criteria have been met."*
- **Ambulance clinicians verify the FACT of death only.** SCAS policy (verbatim): *"SCAS personnel can only verify the 'Fact of Death'. They cannot 'Certify' the cause of death. **Certification must be undertaken by a Doctor.**"*
- *"All of the following criteria must be confirmed independently and if possible, **by two clinicians**, before a formal determination that the patient is life extinct."*
- *"In cases that do not meet these criteria, where it is thought that CPR is futile or inappropriate, **do not terminate resuscitation until senior clinical advice has been sought**."*
- **Under-18s:** essentially never terminated on scene — *"ALL children (up to the day of their 18th birthday) must be taken to the nearest emergency department with onsite paediatric support"*, exceptions only for a valid DNR/ACP or an already-declared crime scene.
- Documentation: trust ROLE form (ePR or paper) + patient record; Police/HM Coroner involvement for unexpected or suspicious deaths.

---

## UNCERTAIN / FLAGGED — do not model as fact without confirmation
1. **Specific defibrillator energy escalation used by NWAS / any named UK trust** (e.g. "150 J → 200 J → 200 J" on a Corpuls3 or LIFEPAK 15). RCUK sets a **≥150 J** floor and permits fixed or escalating up to device maximum; the actual per-trust/per-device setting is a local decision I could not verify. Model as configurable.
2. **The "ETCO₂ > 5.3 kPa / 40 mmHg = ROSC" threshold.** Widely taught; **not** stated in RCUK 2025. RCUK only says "a sharp rise in ETCO₂" and gives 3.3 kPa as a CPR-quality floor.
3. **Adrenaline plasma half-life (~2–3 min)** — pharmacology-textbook figure, not taken from a UK guideline in this research.
4. **Current (2025/2026) JRCALC pocket-book doses for naloxone, glucose 10% and adrenaline.** JRCALC is paywalled. The doses above come from the publicly available **JRCALC 2006 CPG** (naloxone, glucose, adrenaline, amiodarone) plus the **2017 pocket-book update** (naloxone presentation, TXA). These have been stable, but the exact current wording is unverified.
5. **ROLE criteria wording** is taken from the **JRCALC/AACE 2013 CPG flowchart** and a **2022 SCAS policy** reproducing AACE/JRCALC guidance. The current JRCALC edition may differ in detail (the NIHR TOR study may have changed it since). The 15-minute / 30-second-asystole / 20-minute-ALS structure is consistent across both sources and the RCUK FAQ.
6. **Second amiodarone dose in UK ambulance practice.** RCUK is clear (150 mg after 5 shocks); whether every UK trust stocks two amiodarone syringes per vehicle is a local logistics question I did not verify.
7. **Sodium bicarbonate, calcium chloride and magnesium availability on a standard UK front-line ambulance.** Evidence found (JRCALC 2006 formulary contains none of them; SECAmb restricts calcium chloride to Critical Care Paramedics; magnesium is PGD-only) points strongly to these being HEMS/critical-care/in-hospital drugs, not paramedic-carried. Confirm against NWAS's own formulary before modelling them as available on a DCA.
8. **RCUK 2025 has no explicit naloxone-in-cardiac-arrest statement.** Do not model naloxone as a cardiac-arrest drug; model it as a pre-arrest respiratory-failure drug that can *prevent* the arrest.


---

## Part 2 — Reversible causes and scope of practice

# UK CARDIAC ARREST MODELLING — REVERSIBLE CAUSES, SCOPE TIERS, MECHANICAL CPR

Legend: **[V]** = verified against a named UK source (quoted/paraphrased from the document itself). **[U]** = uncertain / secondary source / trust-variable — do not hard-code as national fact.

Primary documents actually read (not just search snippets): RCUK 2025 Adult ALS Guidelines; RCUK 2025 Special Circumstances Guidelines (full text); RCUK 2025 Adult Traumatic Cardiac Arrest Algorithm (PDF text); RCUK Adult Quick Reference Handbook v1.1 May 2024 (PDF text); Human Medicines Regulations 2012 Sch.17 Pt.3 and Sch.19 (legislation.gov.uk); SECAmb Resuscitation Policy V3.00 (May 2024); SECAmb Scope of Practice & Clinical Standards Policy V13/V14; SCAS Resuscitation Policy & ROLE (2022); Health Technology Wales EAR001 mechanical CPR appraisal (Feb 2018); Stryker/Jolife LUCAS 3 IFU 101034-01 Rev E (EN).

---

## PART A — THE 4 Hs AND 4 Ts

### Framing rule (national) [V]
RCUK 2025 Special Circumstances, "General recommendation": *"Initiate resuscitation following the standard ALS algorithm... Always address hypoxia, hypovolaemia, electrolyte disorders, hypothermia, cardiac tamponade, tension pneumothorax, thrombosis, and toxins. Where appropriate, prioritise treating reversible causes, even if chest compressions are briefly interrupted."*
RCUK 2025 Adult ALS: *"Identify and treat reversible causes of cardiac arrest without delay."* POCUS: *"Only skilled operators should use intra-arrest point-of-care ultrasound... POCUS must not cause additional or prolonged interruptions in chest compressions"*; it *"may help identify treatable causes... such as cardiac tamponade and tension pneumothorax"*; *"Right ventricular dilation in isolation during cardiac arrest should not be used to diagnose pulmonary embolism."*

The RCUK Quick Reference Handbook has a dedicated page **1-4 "Assessment of reversible causes during cardiac arrest"** (v0-9, Mar 2022) which is the closest thing to a UK checklist for a sim to model against. Its literal check-list is: check hypoxaemia (PaO2 <10 kPa) → hypovolaemia → hypo/hyperkalaemia & electrolytes → hypothermia → thrombosis (pulmonary or coronary) → tamponade → tension pneumothorax → toxins. [V]

Note the QRH is written for in-hospital teams (blood gases, arterial lines). Pre-hospital, the same eight causes are worked with history + ECG + capnography + POCUS, not labs.

---

### 1. HYPOXIA [V unless marked]

**Suspect at an arrest when:** respiratory arrest preceded cardiac arrest; choking/FBAO; asthma/COPD; drowning; hanging/strangulation; smoke inhalation; airway soiling; obvious airway obstruction. Monitoring clues: no/poor chest rise, absent or very low ETCO₂ trace after airway insertion, hard-to-ventilate bag, disconnected/empty O₂. QRH 1-4 prompts: *"Give 100% oxygen using bag-valve-mask and check device correctly connected; Insert supraglottic airway or tracheal tube if trained to do so; Check chest movement and air entry."*

**Reversing treatment:**
- 100% O₂ by BVM. RCUK 2025 ALS: *"Deliver effective bag-mask ventilation breaths by optimising mask seal and airway patency, and if necessary, use a two-person technique."* (2025 explicitly raised the emphasis on effective ventilation.)
- Advanced airway: *"Once a tracheal tube or an SGA has been inserted, ventilate the lungs at a rate of 10 min⁻¹ and continue chest compressions without pausing during ventilations."*
- Intubation gate: *"Tracheal intubation should only be attempted by rescuers with a high success rate and with the use of continuous waveform capnography. The expert consensus is that a high tracheal intubation success rate is over 95% within two attempts."* And: *"A sustained ETCO₂ trace on waveform capnography must be used to exclude oesophageal placement."*
- FBAO: laryngoscopy + Magill forceps; then FONA/cricothyroidotomy if can't intubate/can't oxygenate.
- Asthma-specific (Special Circumstances 2025): *"Treat life-threatening hypoxia with 100% oxygen... Provide endotracheal intubation (due to high inflation pressures)... Consider manual decompression and disconnection from ventilator to manage dynamic hyperinflation."*

**Who can deliver:** BVM/OPA/NPA — all grades incl. technician/AAP. SGA (i-gel) — technician/AAP upward in most trusts [U: trust-variable; SECAmb's matrix lists "Supraglottic Airway Devices" as a row across grades but the authority cells are images, so the exact grade cut-off could not be read from the PDF]. Drug-free tracheal intubation — registered paramedic *where the trust still holds it*: **LAS ceased routine paramedic ETI training from 1 June 2010; Yorkshire Ambulance followed; EEAST removed ETI from paramedic scope on 17 Sep 2020** [V via Journal of Paramedic Practice / Simulaids reporting — secondary but consistent and specific]. Critical care paramedic — drug-free ETI at high success (SECAmb SPCC service evaluation 2019, n=605: **first-pass 81.5%, within two attempts 96.7%, overall 98.35%**) plus surgical FONA. RSI/pre-hospital emergency anaesthesia — PHEM doctor (see Part B).

---

### 2. HYPOVOLAEMIA [V unless marked]

**Suspect at an arrest when:** trauma mechanism (RTC, fall, penetrating); catastrophic external haemorrhage; pelvic/femoral fracture; penetrating torso wound; GI bleed (haematemesis/melaena); ruptured AAA (back/abdo pain, known aneurysm); ectopic pregnancy; post-partum haemorrhage; burns; sepsis. Monitoring: PEA with narrow complexes at a fast rate; low ETCO₂; POCUS free fluid; empty/collapsible chambers. QRH 1-4: *"Check for haemorrhage, occult bleeding, or fluid loss."*

**Reversing treatment** — RCUK 2025 Adult Traumatic Cardiac Arrest algorithm gives the literal running order (interventions performed *by clinical priority, not sequentially*): control external catastrophic haemorrhage → secure airway and maximise oxygenation → bilateral chest decompression (thoracostomies) → relieve tamponade (penetrating chest injury) → proximal vascular control (manual aortic compression) → pelvic splint → **blood products / massive haemorrhage protocol**. Header banner: *"Minimise time on scene"*; *"Prioritise treatment of reversible causes over chest compressions."* QRH 1-4 "During RESUSCITATION": *"Give IV/IO fluids or blood as required."* QRH major haemorrhage page: **tranexamic acid 1 g IV over 10 min then** (infusion), plus **10 mL 10% calcium chloride or 30 mL 10% calcium gluconate**; *"Early use of blood products is essential"*; *"Use small volume boluses to maintain central circulation until blood products arrive."*

**Who can deliver:** Haemorrhage control (direct pressure, tourniquet, haemostatic dressing, wound packing, pelvic binder) — all responder grades. IV/IO crystalloid — paramedic (sodium chloride 0.9% is inside the Sch.17 paramedic exemption). **TXA** — paramedic; introduced across UK ambulance services in 2012 after JRCALC approval, and IM route now permitted [V-ish: JRCALC approval date and IM route from secondary UK sources, not the JRCALC text itself]. **Blood products** — critical care tier: *pre-hospital blood is a CCP/HEMS capability, not a DCA capability.* Geographically relevant: **North West Air Ambulance became, in 2024, the first UK air ambulance charity whose critical care paramedics can transfuse blood without a doctor present, and now carries blood on all three EC135s and all four critical care cars (expanded Oct 2024, supported by Greater Manchester Blood Bikes and Salford Royal)** [V]. Non-medical authorisation of blood by CCPs has been formally trialled and trained in the UK [V, secondary].

---

### 3. HYPO/HYPERKALAEMIA & METABOLIC [V unless marked]

**Suspect HYPERkalaemia when:** dialysis patient (missed session, fistula/tunnelled line, "renal patient" flag on the CAD), AKI, crush injury/rhabdomyolysis, Addisonian crisis, DKA, extensive burns. QRH 3-5 "Common causative agents": ACE inhibitors / ARBs, potassium-sparing diuretics, NSAIDs, beta-blockers, trimethoprim, potassium supplements and IV infusions. ECG (QRH 3-5): *"flattened/absent P-waves, tall T-waves, broad QRS complexes, ST-segment changes"*; K⁺ >6.5 mmol/L defines severe. Arrest rhythm typically PEA/asystole or a broad slow "sine-wave" PEA.

**Reversing treatment (RCUK 2025 Special Circumstances, verbatim):**
- Cardiac arrest: *"administer 10 mL 10% calcium chloride IV and 50 mmol sodium bicarbonate IV, through separate lines or with a flush in between"* (QRH: sodium bicarbonate 50 mmol = 50 mL of 8.4%). QRH adds "give calcium chloride *or* calcium gluconate by rapid bolus; give insulin/dextrose by rapid bolus; give sodium bicarbonate by rapid bolus."
- Severe hyperK with ECG changes (peri-arrest): *"10 mL of 10% calcium chloride IV over 5 min; if this is not available, give 30 mL of 10% calcium gluconate over 10 min"* (QRH says CaCl₂ over 2–5 min, repeatable every 10–15 min if ECG changes persist).
- Shift: *"10 units soluble insulin and 25 g glucose IV"*, then 10% glucose 50 mL/h for 5 h if pre-treatment BM <7. Plus *"nebulised salbutamol (10–20 mg)"*.
- Remove: sodium zirconium cyclosilicate 10 g orally; dialysis for refractory cases; **consider ECPR**.

**Suspect HYPOkalaemia when:** diuretics, vomiting/diarrhoea, alcoholism, refeeding; ECG U waves/long QT, torsades. Treatment: *"Give 20 mmol potassium chloride IV/IO over 2-3 min, followed by 10 mmol over 2 min in hypokalaemic cardiac arrest"* (RCUK 2025). QRH 1-4 also: give magnesium sulfate 50% 2 g IV over 1–2 min if serum Mg <0.65 mmol/L.

**Who can deliver — THIS IS THE KEY UK SCOPE GAP FOR A SIM:**
- Calcium salts, potassium chloride and sodium bicarbonate are **NOT** in Schedule 17 Part 3 of the Human Medicines Regulations 2012 (the registered-paramedic parenteral POM exemption list — see Part B for the full list) [V, legislation.gov.uk].
- SECAmb's medicines table lists **Calcium Chloride 10% IV/IM at the Critical Care Paramedic column only** [V]. Note: SECAmb's table labels its mechanism "Sch 19", but **calcium chloride does not appear anywhere in Schedule 19 as published** [V, legislation.gov.uk] — treat SECAmb's label as a trust-document anomaly, not a legal basis. **[U] flag.**
- Practical modelling rule: **a standard DCA paramedic crew can recognise hyperkalaemic arrest (dialysis history + ECG morphology) but cannot chemically reverse it.** Their moves are: early critical care/HEMS request, IV/IO access, and a decision about transport to a renal/ICU-capable ED. CCP/HEMS bring calcium ± bicarbonate and (some services) a point-of-care blood gas.
- Nebulised salbutamol is carried on every UK ambulance but there is reportedly **no JRCALC protocol enabling paramedics to give it for hyperkalaemia** [U — from a Journal of Paramedic Practice feature, not from JRCALC directly]. If you want an "almost-but-not-quite" beat in the sim, this is a real one.

---

### 4. HYPOTHERMIA [V unless marked]

**Suspect at an arrest when:** cold/wet environment, immersion or drowning, avalanche/mountain, elderly collapse in an unheated home, alcohol/drug intoxication outdoors, prolonged entrapment, long lie. RCUK 2025: *"Check vital signs for up to 1 min in an unconscious hypothermic patient"*; *"Measure core temperature with a low-reading thermometer."* If unmeasurable, use the **Swiss Staging System**: I mild 35–32 °C conscious/shivering; II moderate 32–28 °C impaired consciousness, shivering reduced/absent; III severe 28–24 °C unconscious with vital signs; IV deep <24 °C vital signs absent. [SCAS note: tympanic thermometers used on UK ambulances read only down to ~20 °C with ±0.5 °C accuracy in the 20–35 range — i.e. a normal ambulance thermometer is adequate to *flag* hypothermia. V]

**Reversing treatment — modified algorithm (RCUK 2025 verbatim):**
- *"Delay CPR or use intermittent CPR in hypothermic cardiac arrest patients with a core temperature below 28 °C when immediate or continuous CPR is not feasible."*
- *"Delay further defibrillation attempts if VF persists after three shocks, until core temperature is > 30 °C."*
- *"Below 30 °C, adrenaline will accumulate and may have more detrimental than beneficial effects. Give IV 1 mg adrenaline (1:10,000) once the core temperature reaches 30 °C unless planning imminent initiation of ECPR."*
- *"Increase administration intervals for adrenaline to 6-10 min if the core temperature is 30-35 °C."*
- *"Give a loading dose of 300 mg amiodarone if a shockable rhythm is present, but delay further doses until the core temperature exceeds 30 °C."*
- *"Consider using a mechanical CPR device if transport is prolonged or if there are difficulties with the terrain."*
- Destination: *"Transfer hypothermic patients with risk factors for imminent cardiac arrest and those in cardiac arrest directly to an ECPR centre for rewarming"* — triggers: **HR <45, SBP <90 mmHg, ventricular arrhythmia, core temp <30 °C**. *"Rewarm hypothermic arrested patients with veno-arterial ECMO (VA-ECMO)."* *"Initiate non-extracorporeal life support rewarming if an ECPR centre cannot be reached within a reasonable time (e.g. 6 h)."* Prognostication in hospital uses the **HOPE score**.
- SCAS trust-level wording worth stealing for flavour: *"patients are not dead until they are 'warm and dead'"*; low threshold to resuscitate small children/young adults after cold-water immersion, *"reports of complete neurological recovery in patients completely immersed up to 90 minutes in icy water"*; max 3 DC shocks below 30 °C; consider direct transport to an ED with on-site cardiopulmonary bypass; request PHEM/air ambulance early. [V]

**Who can deliver:** the modified algorithm is a *paramedic-level* competency (it is a change to the ALS algorithm, not an extra drug or procedure). What the higher tiers add is the **ECPR pathway decision, mechanical CPR for a long extrication/transport, and pre-alerting an ECMO centre.** Hypothermia is also one of the standing **exclusions from terminating resuscitation** (see Part B).

---

### 5. THROMBOSIS — CORONARY and PULMONARY [V unless marked]

#### Coronary
**Suspect:** preceding chest pain, known IHD, VF/pVT as the presenting rhythm, refractory VF, ST elevation on the post-ROSC 12-lead.
**Treatment:** high-quality CPR + defibrillation + amiodarone; then reperfusion. RCUK 2025: *"Perform immediate coronary angiography (and PCI if required) within 120 min of diagnosis"* in sustained ROSC with ST-elevation; *"Consider fibrinolysis in pre-hospital and non-PCI-capable settings if a greater delay is expected"*; and critically for a sim — *"Unless ongoing resuscitation is considered futile, transfer patients without sustained ROSC with ongoing CPR to a PCI centre for consideration for angiography or ECPR."*
SCAS on refractory VF: *"Resuscitation should not therefore be stopped in cases of refractory or persistent VF... transport patients with persistent/refractory VF or pulseless VT to a cardiac arrest centre with ongoing CPR."* [V]
**Who:** paramedic — recognition, 12-lead, pre-alert, PPCI pathway activation, and transport-with-CPR decision. Pre-hospital thrombolysis for STEMI is *legally* within the paramedic exemption (**reteplase, streptokinase, tenecteplase are named in Sch.17 Pt.3**) [V] but is effectively obsolete in England where PPCI networks exist — model it as available only in a remote/rural variant. **[U on current real-world use.]**

#### Pulmonary embolism
**Suspect:** *"sudden onset of progressive dyspnoea and absence of known heart or pulmonary disease"*; recent surgery/immobility/malignancy/pregnancy; DVT signs; syncope. Monitoring clue that a sim can key off: *"Low ETCO₂ values (< 1.7 kPa/13 mmHg) in the presence of confirmed tracheal intubation, appropriate minute volume and high-quality chest compressions may support a diagnosis of pulmonary embolism, although it is a non-specific sign."* Plus RV distension/failure on echo — but RV dilation alone must not be used to diagnose PE.
**Treatment:** *"Use fibrinolytic drugs for cardiac arrest when pulmonary embolism is the suspected cause"*; if known cause, fibrinolysis **or** surgical embolectomy **or** percutaneous mechanical thrombectomy. Crucial timing rule: *"In select patients with suspected pulmonary embolism, consider CPR for 60-90 min after administration of thrombolytic drugs."* Peri-arrest anticoagulation *"heparin 80 units kg⁻¹ IV"*. Consider ECPR.
QRH 1-4 drug doses for arrest: **Tenecteplase 500–600 micrograms/kg IV bolus, or Alteplase 50 mg IV bolus then a further 50 mg IV bolus after 30 minutes if still in cardiac arrest.** [V]
**Who:** SECAmb lists **alteplase at the Critical Care Paramedic column under PGD** [V]. Alteplase is *not* in the Sch.17 paramedic exemption. So: thrombolysing a PE arrest pre-hospital = critical care / PHEM decision, and it commits the crew to 60–90 minutes of CPR on scene or in transit — a natural mechanical-CPR trigger.

---

### 6. TENSION PNEUMOTHORAX [V unless marked]

**Suspect:** blunt or penetrating chest trauma; rib fractures; asthma/COPD with gas trapping; **sudden loss of output shortly after starting positive-pressure ventilation** (a very good sim trigger — arrest after i-gel/ETT insertion); central line/thoracic procedure. Clues: unilateral absent air entry, high inflation pressures / "hard to bag", surgical emphysema, distended neck veins, tracheal deviation (late sign). QRH 1-4: *"Check bilateral air entry, chest movement, and airway pressure; Check for tracheal deviation; Consider focused chest ultrasound."*

**Reversing treatment:**
- **RCUK 2025 Adult Traumatic Cardiac Arrest algorithm names the intervention as "Bilateral chest decompression (thoracostomies)"** — i.e. at TCA the UK national algorithm asks for thoracostomy, bilaterally, not a needle. [V — read directly from the RCUK 2025 algorithm PDF]
- Needle thoracocentesis remains the paramedic-level intervention. Site options in UK practice: 2nd ICS mid-clavicular line, or **4th/5th ICS mid/anterior-axillary line**, the lateral approach increasingly preferred because chest-wall thickness defeats standard-length cannulae. SECAmb's skills matrix lists **"Needle thoracentesis (anterior approach)" and "Needle thoracentesis (lateral approach)" as two separate authorised skills, and "Open Thoracostomy" as a third** — i.e. UK trusts formally distinguish all three. [V for the three-row structure; **[U]** for the exact grade cut-off per row, because the authority cells in the SECAmb PDF are colour-block images and could not be read as text.]
- If resuscitation continues, a needle decompression must be followed by thoracostomy/intercostal drain. **[U — this is standard consensus and appears in ANZCOR/ERC-derived summaries; I did not read it in a UK primary text.]**

**Who can deliver:** **Needle thoracocentesis = registered paramedic** (SECAmb lists it at paramedic/APP level with the annotation *"A – Requires evidence of training"*). **Open/finger thoracostomy = critical care tier**: North West Air Ambulance lists *"open thoracostomy"* explicitly as a **Critical Care Paramedic** skill [V]; Great Western Air Ambulance's Specialist Paramedic in Critical Care performs *"finger thoracostomies"* [V]. Chest drain insertion / definitive management = doctor or CCP by service SOP [U].

---

### 7. TAMPONADE — CARDIAC [V unless marked]

**Suspect:** penetrating wound to chest or epigastrium (stab is the classic UK case); blunt chest trauma; recent cardiac surgery; post-MI free-wall rupture; uraemia/malignancy/pericarditis for medical tamponade. Clues: PEA with narrow complexes and preserved rate, distended neck veins, no other cause found. QRH 1-4: *"Consider focused cardiac ultrasound."*

**Reversing treatment:** RCUK 2025 TCA algorithm — *"Relieve tamponade (penetrating chest injury)"*, and the algorithm's decision box for **Resuscitative thoracotomy** gates on four questions: **Expertise? Equipment? Environment? Elapsed time?** with the elapsed-time threshold printed as **< 15 min**. [V — read directly from the algorithm PDF]
London's Air Ambulance has performed pre-hospital thoracotomy as core practice for penetrating traumatic cardiac arrest since 1993; the 1993–2008 series used an SOP of **within 10 minutes of documented cardiac arrest**, with **18% survival to hospital discharge** after stab wounds to chest/epigastrium; survival factors were stab wound, single cardiac wound, cardiac tamponade, and loss of pulse in the presence of an experienced pre-hospital doctor. [V, secondary reporting of the published series]
Needle pericardiocentesis is listed as an alternative in some guidance but is low-yield for clotted blood. **[U — not read in a UK primary source; RCUK 2025 does not give a pericardiocentesis recommendation for TCA.]**

**Who can deliver:** **Resuscitative (clamshell) thoracotomy = PHEM/HEMS doctor.** NWAA's own role descriptions put *"thoracotomies"* and *"rapid sequence induction"* under **HEMS Doctor**, and *"open thoracostomy"* and *"surgical airway"* under **Critical Care Paramedic** — the split is explicit and geographically correct for a Greater Manchester sim. [V] Model the standard paramedic as: recognise the pattern, minimise scene time, request HEMS immediately — and be unable to fix it. This is the single strongest "call the right asset early" beat in the whole set.

---

### 8. TOXINS [V unless marked]

**Suspect:** scene evidence (paraphernalia, blister packs, empty bottles, note); bystander history; occupational/industrial or CBRN context; unexplained arrest in a young person; pinpoint pupils; toxidrome. QRH 1-4: *"Check drug chart and clinical notes."*

**General treatment (RCUK 2025 verbatim):** *"Ensure your personal safety, as direct skin contact (e.g. mouth-to-mouth ventilation) might transmit toxic agents. Assess all patients in cardiac arrest for potential poisoning. Reduce absorption, consider using specific treatment measures as antidotes, decontamination and enhanced elimination. Administer antidotes, where available, as soon as possible. **Be prepared to continue resuscitation for a prolonged period of time, as the toxin concentration may fall as it is metabolised or excreted during extended resuscitation measures.** Consult regional or national poison centres (e.g. Toxbase)."* — the "prolonged resuscitation" instruction is the key sim mechanic; toxin arrest is also an exclusion from the 20-minute termination rule.

**Specific antidotes relevant to UK pre-hospital:**
- **Opioids → naloxone.** UK presentation 400 micrograms/1 mL. IV initial 400–2000 micrograms, repeatable at 2–3 min intervals; IM if no IV access. [V, SmPC/UK sources] Target is reversal of respiratory depression, not full arousal. RCUK/ILCOR framing: standard resuscitation alone in a pulseless patient, naloxone where there is doubt about whether a pulse is present, and never delay/interrupt CPR or defibrillation for it. **[U — that specific phrasing came from a non-UK-specific guideline summary, not RCUK text.]**
- **Local anaesthetic systemic toxicity (RCUK 2025 verbatim, full protocol):** stop the LA; hyperventilate to raise plasma pH if acidotic; **give a lower adrenaline dose (1 mcg/kg instead of 1 mg IV bolus)**; 20% lipid emulsion **1.5 mL/kg IV bolus then infusion 15 mL/kg/h**; boluses repeatable twice at 5-min intervals, infusion up to 30 mL/kg/h; continue until stable or a max of **12 mL/kg**; if no ROSC at 5 min double the infusion rate and give up to two further boluses; benzodiazepines for seizures; consider prolonged resuscitation (>1 h) and ECPR.
- **Organophosphate / nerve agent → atropine (± pralidoxime).** Atropine sulphate, atropine+pralidoxime chloride, atropine+obidoxime, atropine+pralidoxime mesilate+avizafone, and pralidoxime in three forms are **all named in Schedule 19 HMR 2012**, meaning any person may administer them parenterally in an emergency to save life [V]. HART is the NHS capability for CBRN/HazMat hot-zone care [V].
- **Cyanide.** **Dicobalt edetate, sodium nitrite and sodium thiosulphate are named in Schedule 19** [V]. Hydroxocobalamin (Cyanokit) is the modern preferred antidote and is carried by some UK services/HART **[U — per-trust carriage not verified]**.
- **Beta-blocker/CCB → glucagon** (Schedule 19, so technician-administrable) [V]; high-dose insulin/euglycaemia is in-hospital.
- **TCA overdose → sodium bicarbonate** — not carried on a standard DCA (not in Sch.17) [V by absence].

**Who can deliver:** naloxone, atropine, glucagon (and the cyanide agents) are Schedule 19 — **technician/AAP and above may give them IM/IV in a life-threatening emergency**. Important UK detail for realism: **SECAmb states the Schedule 19 exemption *"applies only to parenteral medicines (injected) and therefore cannot be given by non-parenteral routes such as intranasal. Staff authorised to give naloxone can only do so via IM injection."*** [V] — i.e. an intranasal-naloxone-carrying technician is *wrong* for a UK sim. Lipid emulsion, sodium bicarbonate and specialist antidotes sit at CCP/HEMS/hospital level.

---

## PART B — UK PARAMEDIC SCOPE OF PRACTICE AT A CARDIAC ARREST, TIERED

### B0. The legal spine (get this right and the tiers fall out) [V, legislation.gov.uk]

**Human Medicines Regulations 2012, Schedule 17 Part 3 — registered paramedic exemption (parenteral POMs a registered paramedic may administer without a prescription, for "immediate, necessary treatment of sick or injured persons"):** adrenaline acid tartrate; adrenaline hydrochloride; amiodarone; anhydrous glucose; benzylpenicillin; compound sodium lactate (Hartmann's); ergometrine maleate; furosemide; glucose; heparin sodium (cannula flush only); lidocaine hydrochloride; metoclopramide; morphine sulphate; nalbuphine hydrochloride; naloxone hydrochloride; ondansetron; paracetamol; reteplase; sodium chloride; streptokinase; tenecteplase; plus diazepam 5 mg/mL emulsion injection; succinylated modified fluid gelatin 4%; ergometrine 500 mcg/mL with oxytocin 5 iu/mL.
**What is conspicuously absent** (therefore needs a PGD, PSD, prescriber, or a higher-tier practitioner): calcium salts, potassium chloride, sodium bicarbonate, magnesium sulfate, alteplase, ketamine, midazolam, fentanyl, rocuronium, blood products.

**Schedule 19 (reg. 238) — parenteral medicines anyone may administer to save life in an emergency:** adrenaline 1:1000 up to 1 mg IM for anaphylaxis; atropine sulphate (and its combinations with obidoxime / pralidoxime chloride / pralidoxime mesilate+avizafone); chlorphenamine; dicobalt edetate; glucagon; glucose; hydrocortisone; naloxone products; pralidoxime chloride; pralidoxime mesilate; promethazine; snake venom antiserum; sodium nitrite; sodium thiosulphate; sterile pralidoxime. This is the legal basis for the technician tier.

**Grade ladder as an English trust actually writes it** (SECAmb Scope of Practice V13/V14 column headings) [V]: CFR/ER → IECR → Emergency Care Support Worker → **Technician / Associate Ambulance Practitioner (AAP)** → Newly Qualified Paramedic → **Paramedic** → **Advanced Paramedic Practitioner (UEC)** → **Critical Care Paramedic** → Consultant Paramedic → Doctor. Note the ladder forks: "Advanced Paramedic Practitioner (Urgent & Emergency Care)" is a *different branch* from "Critical Care Paramedic" — APP(UEC) is not automatically a cardiac-arrest escalation. Useful nuance if the sim shows job titles.

---

### B1. TECHNICIAN / EMT / ASSOCIATE AMBULANCE PRACTITIONER

**Can do:** high-quality CPR; AED **and manual defibrillation** (SECAmb lists manual defibrillation, adult and paediatric, within the Technician/AAP scope) [V, from the SECAmb matrix]; OPA/NPA; BVM two-person; suction; supraglottic airway (i-gel) [U — trust-variable; listed as a skill row in SECAmb's matrix but the grade cell could not be read]; oxygen; mechanical CPR device operation once trained [U — trust-variable but ubiquitous in practice]; blood glucose; **IM adrenaline 1:1000 for anaphylaxis only, IM naloxone, glucagon, atropine** under Schedule 19 [V]; recognise conditions unequivocally associated with death and recognise a valid DNACPR/ReSPECT [V, SECAmb Resus Policy 9.2/9.3]; SCAS additionally trains technicians/AAPs to *"diagnose and verify the fact of death… under certain conditions"* [V].
**Cannot do (vs paramedic):** IV or IO cannulation; any IV/IO drug; **cannot terminate an ongoing resuscitation**; no intubation.
**Sim rule:** a tech-only crew that arrives at an arrest is a BLS+defib+i-gel crew. They can shock and they can bag, but they cannot give adrenaline or amiodarone and they cannot stop. If no paramedic is on scene, SECAmb requires *"urgent remote advice… from a registered Health Care Professional in EOC, e.g. the Critical Care Desk"* [V].

### B2. REGISTERED PARAMEDIC (standard DCA crew)

**Adds over technician:**
- **Vascular access:** peripheral IV, external jugular, **humeral / tibial / femoral intraosseous** (all four are listed as separate authorised skills, each annotated *"A – Requires evidence of training"*) [V]. RCUK 2025 sequencing: *"Attempt intravenous (IV) rather than intraosseous (IO) access first... If IV access cannot be rapidly achieved within two attempts, it is reasonable to consider IO access as an alternative route."* [V] UK evidence behind that: **PARAMEDIC-3, 11 UK ambulance services, 6,082 patients — IO-first did not improve 30-day survival (4.5% vs 5.1%) and sustained ROSC was lower with IO (OR 0.89, 0.80–0.99)** [V, NEJM 2024].
- **Arrest drugs:** adrenaline 1 mg IV/IO (immediately in non-shockable; after the 3rd shock in shockable; repeat every 3–5 min); amiodarone 300 mg after 3 shocks and a further 150 mg after 5 shocks; lidocaine 100 mg then 50 mg as the alternative if amiodarone unavailable [V, RCUK 2025 ALS + Sch.17]. RCUK 2025: *"Do not routinely give calcium, sodium bicarbonate or corticosteroids during cardiac arrest."*
- **Needle thoracocentesis** (anterior and/or lateral approach) [V, SECAmb matrix].
- **Drug-free tracheal intubation** — *only where the trust still holds the skill.* LAS stopped routine paramedic ETI training from 1 Jun 2010; YAS followed; **EEAST removed ETI from paramedic scope on 17 Sep 2020** [V, secondary]. JRCALC's own position (quoted in the UK literature): *"The weight of evidence suggests that prehospital intubation without the use of drugs can worsen patient outcome. Supraglottic airway devices... Ambulance trusts should be encouraged to adopt and use these devices as an alternative to tracheal intubation."* [V, secondary]. UK trial evidence: **AIRWAYS-2 (4 English ambulance services, 1,523 paramedics randomised) found no difference in modified Rankin at hospital discharge between i-gel and tracheal intubation** [V].
- **TXA, fluids, 12-lead/PPCI activation, pre-alert.**
- **Terminating resuscitation** — see B5.
**Cannot do (vs CCP):** RSI/any paralytic or induction agent; surgical airway; open/finger thoracostomy; blood products; calcium/bicarbonate; ketamine/midazolam/fentanyl.

### B3. ADVANCED / CRITICAL CARE PARAMEDIC (CCP / SPCC / APP-CC)

Titles differ by service — Critical Care Paramedic (SECAmb, NWAA), Specialist Paramedic in Critical Care (GWAAC), Advanced Paramedic Practitioner in Critical Care (LAS, launched 2014, based Westminster/Croydon/Brent/Ilford, 24 h cover, ~3–5 on shift, cardiac arrests are the majority of the workload) [V].

**Adds over standard paramedic** (composite of NWAA, GWAAC and SECAmb published descriptions) [V]:
- **Open / finger thoracostomy** (NWAA lists "open thoracostomy" as a CCP skill; GWAAC SPCCs perform "finger thoracostomies").
- **Surgical airway / front-of-neck access** (both services list it; there is UK qualitative research specifically on *"critical care paramedics' experiences of performing an emergency scalpel cricothyroidotomy"*).
- **Tracheal intubation to a high standard, drug-free** (SECAmb SPCC 2019: 81.5% first pass, 98.35% overall, n=605).
- **Sedation and paralysis to facilitate ventilation** (GWAAC wording: *"administer sedation and paralytic drugs to ventilate patients"*), ketamine and midazolam under PGD [V].
- **Blood products** — increasingly CCP-delivered: **NWAA CCPs transfuse without a doctor present since 2024** [V]; all 21 UK HEMS responding to a 2022 survey carried pre-hospital blood, 20/21 with a calcium-replacement SOP [V, secondary].
- **Calcium chloride** (SECAmb lists it at the CCP column) [V]; **alteplase under PGD** at CCP level [V].
- **Synchronised cardioversion and pacing** [V, GWAAC].
- **POCUS** (thoracic, FAST, cardiac, surgical-airway landmarking are the common UK HEMS indications) [V, secondary].
- **Post-ROSC critical care and transport ventilation** — LAS APP-CC cars now carry ZOLL Z Vent portable ventilators [V].
- **Extended termination-of-resuscitation authority** — see B5.
**Cannot do (vs HEMS doctor), in most UK services:** RSI/pre-hospital emergency anaesthesia as the drug-giving decision-maker, and resuscitative thoracotomy. **In the great majority of UK services RSI is delivered by a doctor-paramedic team** — e.g. the Great Western model where *"RSI is only carried out in the presence of a qualified physician and critical care paramedic"* [V, secondary]. Some services use an "Inter-Changeable Operator Model" where the CCP may be the laryngoscopist within a doctor-led PHEA team [V, published UK study]. **[U] Whether any UK service permits a CCP to independently induce and paralyse without a doctor present — I found no verified example. Model RSI as doctor-gated.**

### B4. HEMS / PHEM DOCTOR

PHEM was recognised by the GMC as a sub-specialty of Anaesthesia and Emergency Medicine in 2011 [V, secondary]. In the UK, pre-hospital RSI is performed by doctors attached to HEMS or BASICS [V, secondary].
**Adds over CCP** [V, NWAA role descriptions — directly relevant to a Greater Manchester sim]:
- **Rapid sequence induction / pre-hospital emergency anaesthesia** (typical UK regime fentanyl + ketamine + rocuronium).
- **Resuscitative thoracotomy** (NWAA lists "thoracotomies" under HEMS Doctor, "open thoracostomy" under CCP — a clean two-tier split).
- **Blood transfusion** (listed under HEMS Doctor; and now also CCP at NWAA).
- **Advanced analgesia and full critical-care drug formulary; consultant-level decision-making, including futility/termination decisions outside protocol.**
- Some UK teams add **pre-hospital ECPR**: the London **Sub30** feasibility study cannulated 5 refractory-OHCA patients pre-hospital, mean collapse-to-ECMO-flow 47 min — the fastest published pre-hospital ECPR average, though it missed its <30 min target [V].
NWAA structure for the sim: pilot + **HEMS Doctor** (consultant-level, also works in regional MTCs) + **Critical Care Paramedic** (on permanent secondment from NWAS); covers Cheshire, Cumbria, Lancashire, Greater Manchester, Merseyside; 3× EC135 + 4 critical care cars, all blood-carrying since Oct 2024 [V].

### B5. WHO MAY TERMINATE RESUSCITATION [V — this is the crispest tiering in the whole topic]

- **All patient-facing grades** may recognise conditions unequivocally associated with death, and may recognise a valid DNACPR/ReSPECT/ADRT [V, SECAmb Resus Policy 9.2–9.3].
- **EOC staff using CDSS** may withhold resuscitation per CDSS recommendation (obviously deceased, valid DNACPR); *"Where doubt exists resuscitation should be commenced and continued until a clinician arrives at scene."*
- **"Only Paramedics may terminate an ongoing active resuscitation."** [V, SECAmb Resuscitation Policy V3.00, May 2024, §10]
- **"In addition, a CCP may terminate a resuscitation in accordance with their Clinical Practice Guideline."** A CCP may also *"support the termination of resuscitation remotely where there is not a paramedic or doctor available at scene"* and there will be a delay. A **consultant paramedic with CMO authority** may support termination at scene or remotely and *"may also consider the experience and grade of the practitioner and other factors relating to outcome, safety and best interests"* — i.e. may go outside the standard rule. [V]
- **If no paramedic is at scene**, urgent remote advice must be sought from a registered HCP in EOC (e.g. the Critical Care Desk); the only exception is a valid DNACPR/ReSPECT being produced. [V]

**ROLE / termination criteria as an English trust writes them (SCAS, per JRCALC)** [V]:
- *Conditions unequivocally associated with death:* decapitation; massive cranial and cerebral destruction; hemicorporectomy; decomposition/putrefaction; incineration (full-thickness burns with charring of >95% of body surface); hypostasis; rigor mortis; foetal maceration in a newborn.
- *Withhold resuscitation* if **all four**: >15 min since collapse; no bystander CPR in the preceding 15 min; no exclusion factors; asystole >30 s on the monitor.
- *Terminate* after **20 minutes of ALS, where all reversible causes have been identified and corrected, and the patient remains in asystole** — ALS time *"starts at the time of the arrival of an ALS provider."*
- **Exclusions from both rules:** pregnancy; hypothermia (where hypothermia is the primary cause); suspected overdose/poisoning; **all patients under 18**; (drowning also listed in the withhold criteria). These patients *"should be transported to the nearest facility with on-going resuscitation, unless the circumstances would make transport futile."*
- **Agonal rhythm** (wide, low-amplitude, irregular, typically <10 bpm) *"can be treated as asystole and resuscitation can be discontinued if it has persisted continuously for more than 20 mins."*
- **PEA:** no firm rule. Factors to weigh: time in arrest without life support; absence of reversible causes; co-morbidities; rate/width of QRS; trend and absolute value of ETCO₂. Senior clinician advice is the escalation route.
- **Refractory VF: do NOT terminate — transport with ongoing CPR to a cardiac arrest centre.**
- RCUK 2025 ALS caution worth modelling: *"Do not use a low ETCO₂ value alone to decide if a resuscitation attempt should be stopped."* And: *"Ambulance service systems should consider implementing validated criteria for the withholding and termination of resuscitation."*

---

## PART C — MECHANICAL CPR DEVICES (LUCAS 3 AND AUTOPULSE), UK SPECIFICS

### C1. What the UK guidelines actually say [V]
- **RCUK 2025 Adult ALS:** *"Consider mechanical chest compressions **only if** high-quality manual chest compression is not practical or compromises provider safety. When a mechanical chest compression device is used, **minimise interruptions to chest compression during device application**."*
- **RCUK 2025 Special Circumstances (hypothermia):** *"Consider using a mechanical CPR device if transport is prolonged or if there are difficulties with the terrain."* (Cath lab section: *"Mechanical CPR, if manual compression is not feasible or safe for the provider."*)
- **RCUK Quick Reference Handbook 1-4:** *"For prolonged resuscitation consider mechanical chest compression device if available."*
- **Trust-level (SCAS):** *"In some situations such as predicted prolonged resuscitation, long transfer times to hospital and rescuer fatigue the use of a LUCAS 2 device may be of benefit. Once a tracheal tube or a supraglottic airway has been inserted, ventilate the lungs at a rate of 8-10 min⁻¹ and continue chest compressions using the LUCAS 2 device without pausing during ventilations. With a supraglottic airway, if there is inadequate ventilation due to gas leakage, pause compressions for ventilation using a compression-ventilation ratio of 30:2."*
- So the UK framing is **permissive, not routine**. A sim should gate the device on: prolonged resuscitation, transport with ongoing CPR, rescuer safety/fatigue, difficult terrain/extrication, bridge to PPCI/ECPR — not "arrest → fit LUCAS".

### C2. LUCAS 3 — mechanism, numbers, deployment [V, Stryker/Jolife IFU 101034-01 Rev E + Health Technology Wales EAR001]
- Piston with suction cup delivering compression **and active decompression**; three parts — back plate, upper part (battery + compression mechanism + disposable suction cup), stabilisation strap, in a carrying case. ~10 kg with case; Bluetooth data download.
- **Rate:** 102 ±2 /min default; configurable to 102, 111 or 120. **Depth:** 53 ±2 mm for sternum height ≥185 mm; 40–53 mm for smaller patients; configurable 45–53 mm. **Duty cycle 50 ±5%.** **Modes:** ACTIVE continuous (with a ventilation LED alert 10×/min) or ACTIVE 30:2. **Battery ~45 min** (nominal patient); external mains supply available; battery must stay installed even on mains.
- **Patient fit:** sternum height **170–303 mm**; maximum chest width **449 mm**; *"The use of the LUCAS device is not restricted by patient weight."* (HTW paraphrases as up to ~45 cm width / 30 cm height.)
- **Deployment sequence (IFU §5):** confirm arrest → **start manual CPR immediately** → open case, power on (1 s) and let it self-test (green LED by ADJUST) → *"Minimise interruption to manual CPR by planning for and coordinating the placement of the back plate"*: **support the head and pause manual CPR briefly** while sliding the back plate under, immediately below the armpits, either by lifting the shoulders slightly or rolling side to side → attach the upper part → position so the **lower edge of the suction cup sits immediately above the end of the sternum** → in ADJUST push the pad down until it touches the chest without compressing → **PAUSE to lock the start position** → **ACTIVE (continuous) or ACTIVE (30:2)** → apply the stabilisation strap (but *"Delay the application of the LUCAS Stabilisation Strap if this prevents or delays any medical treatment"*).
- **Headline instruction:** *"Keep interruptions to CPR to a minimum when applying the LUCAS device to the patient."* **The IFU sets no numeric pause limit.**

### C3. AutoPulse — mechanism and numbers [V, HTW EAR001; NXT figures [U]]
- **Load-distributing band (LDB):** platform/back board + LifeBand that encircles the chest and tightens to compress the **whole** chest, at **80 compressions/min**, to a depth producing a **20% reduction in anterior-posterior chest depth** (i.e. proportional, not a fixed mm).
- **Modes:** continuous; 30 compressions with 2 ventilation pauses of 1.5 s; 15 compressions with 2 ventilation pauses.
- **Patient fit:** chest circumference **76–130 cm** (band auto-adjusts). Weight: the Quick Case carry-sheet allows patients **up to 200 kg** to be moved without a scoop. Weight ~10.6 kg + 2.3 kg Quick Case.
- **UK-specific:** *"The AutoPulse Plus… is the only version of the device available in the UK"* (as of the 2018 HTW appraisal) — it has **Shock Sync**, which integrates with a ZOLL X Series and times the shock to the start of the relaxation phase when transthoracic impedance is lowest. Li-ion battery only (NiMH discontinued 2015).
- **[U] AutoPulse NXT** (newer): chest circumference 76–142 cm, minimum chest width 25 cm, max weight 181 kg — from a search summary of ZOLL material, not read in a primary document.

### C4. How long the pause to fit one should be [MIXED — read this carefully]
- **[V] There is no UK national guideline stating a maximum number of seconds for fitting a mechanical device.** The governing rules are RCUK's *"minimise interruptions to chest compression during device application"* and the general ILCOR/RCUK rule that compression interruptions should be as short as possible.
- **[U] Practical numbers commonly cited:** aim for **<10 s** (the general interruption ceiling, and the threshold used as a "critical criterion" in device skills assessments); real-world transitions from manual to mechanical of a **median ~7 s** in experienced hands, versus a **median ~36 s** deployment pause in trial conditions. These came from secondary sources (JEMS/US skill-performance records), not a UK primary document. **If the sim needs a number, model 10 s as the "good" target, ~20–40 s as the realistic untrained/awkward-position outcome, and make the penalty a drop in compression fraction rather than a hard fail.**
- **[V] Movement rule (Jolife/HTW):** *"When lifting the patient to the stretcher, the LUCAS must be paused. When moving the patient, the LUCAS can be active as long as the LUCAS device and the patient are safely positioned on the transportation device and LUCAS stays in the correct position."* AutoPulse conversely *"allows patients to be lifted, transferred, moved and transported without the need to stop chest compressions."* That is a genuine, modellable difference between the two devices.

### C5. Advantages [V]
- **Consistent depth and rate for prolonged periods** — *"intended to provide consistently high-quality chest compressions of the required depth and frequency, for prolonged periods of time"*; devices *"are not prone to fatigue."*
- **Frees a rescuer** and removes the fatigue/quality decay of manual CPR.
- **Enables CPR during transport** — *"CPR in a moving ambulance is both difficult to do effectively, and represents a danger to the vehicle occupants."* Mechanical CPR can maintain quality CPR during transfer by land ambulance or helicopter.
- **Bridge to advanced therapy** — refractory VF/pVT direct to PPCI with CPR ongoing; hypothermia to an ECPR centre; PE thrombolysis requiring 60–90 min of CPR; **ECPR**. Wales' EMRTS uses LUCAS *"in very select cases when there is a patient in refractory ventricular fibrillation and there is agreement from the receiving PPCI unit that it is appropriate for them to go direct for intervention whilst still in cardiac arrest."*
- **Defibrillation without interrupting compressions**; AutoPulse Plus's Shock Sync additionally times the shock to lowest impedance.
- Provider safety in the back of a moving vehicle, on stairs, in confined space, on difficult terrain.

### C6. Limitations, contraindications and cautions [V]
**LUCAS 3 contraindications (IFU §2.3/§3.3, verbatim):** do NOT use —
1. *"If it is not possible to position the LUCAS device safely or correctly on the patient's chest."*
2. **Too small patient:** *"if the LUCAS device alerts with 3 fast signals when lowering the Suction Cup and you cannot enter the PAUSE mode or ACTIVE mode"* → *"Immediately start manual compressions again."*
3. **Too large patient:** *"If you cannot lock the Upper Part of the LUCAS device to the Back Plate without compressing the patient's chest."*

**LUCAS 3 warnings/cautions that matter operationally:**
- Incorrect pad position over the chest → *"increased risk of damage to the rib cage and the internal organs. In addition, the patient's blood circulation may be compromised."*
- **ECG interference:** *"Chest compressions interfere with ECG analysis. Push PAUSE before you start the ECG analysis. Make the interruption as short as possible."*
- **Defibrillation electrodes must not sit under the suction cup** — if they do, new pads must be applied. **Ultrasound gel on the chest must be removed** before applying the cup or the cup will migrate during operation.
- **Malfunction:** *"If there are interruptions, or the compressions are not sufficient, or something unusual occurs during operation: Push ON/OFF for 1 second… and remove the device. Immediately start manual chest compressions."*
- Never leave the patient/device unattended while running; keep hands away from the cup and claw locks; do not lift by the patient straps; do not block the vent holes; hood and battery can exceed **48 °C** (skin burn risk on prolonged contact); check IV access is not obstructed.

**AutoPulse limitations:** chest circumference floor/ceiling; *"patients of size that the compression band will NOT buckle correctly"*; and its **radio-opaque back board makes PCI during CPR more difficult** [U — secondary].

**Both devices:**
- **Not for children** — adult devices are not suitable for paediatric patients [U — secondary but universally stated; also implicit in LUCAS's sternum-height floor].
- **Injury profile:** rib fractures pooled prevalence ~55% after CPR generally; mechanically assisted CPR carried a **risk ratio ~1.36 for CPR-related injury vs manual**; rarer visceral injury to heart, great vessels, lung, liver, spleen, stomach, including fatal liver rupture. ILCOR's own framing, reproduced in the LUCAS IFU: *"Rib fractures and other injuries are common but acceptable consequences of CPR given the alternative of death from cardiac arrest."* [V for the IFU quote; [U] for the meta-analysis figures — secondary.]
- **Training decay and misuse is the dominant real-world limitation.** In the UK **PARAMEDIC** trial only **60% of patients randomised to LUCAS-2 actually received it**, "for reasons including lack of training and crew error"; the authors concluded mechanical CPR *"requires initial and refresher training and ongoing quality assurance."* PARAMEDIC training was 1–2 h face-to-face plus online, annually refreshed, with a competency checklist before authorisation. [V]

### C7. UK evidence and cost — for a sim that wants to be honest about benefit [V]
- **PARAMEDIC (UK, LUCAS-2, 4,471 randomised of 11,171 screened)**: no survival benefit. Survival to hospital admission 377/1652 (22.8%) LUCAS vs 658/2818 (23.3%) manual. Health Technology Wales' pooled reading: *"All analyses show that there is no difference between either device and manual chest compression. Various sub-group analyses did not identify any special populations who might benefit."* In PARAMEDIC the OR for the good-neurological-outcome endpoint was **0.72 (95% CI 0.52–1.00)**, i.e. a borderline signal *against* the device. ASPIRE (AutoPulse) reported worse outcomes; LINC favoured mechanical; CIRC neutral.
- **HTW conclusion:** the device is not cost-effective as a routine replacement, but *"there could be a sound argument in support of the device in situations where manual chest compression is impossible or would compromise safety."*
- **UK costs (2018 list prices):** AutoPulse ~**£9,850** per deployed unit including accessories/batteries/maintenance, plus **£450** staff training per paramedic (2-yearly refresh) → ~£2,140/device/year undiscounted. LUCAS 3 ~**£12,060** list plus **£743** training per person → ~£2,547/device/year. LUCAS-2 costed at **£232 per application** (Marti 2017). ~17.5% NHS discount available.
- **Deployment pattern in a UK service:** Wales' EMRTS equips **every air ambulance and every rapid response car** with a LUCAS and uses it routinely on targeted OHCA; 126 deployments Sep 2016–Jan 2018. Frontline DCAs are *not* universally equipped — mechanical CPR in the UK tends to arrive with the critical care/RRV/HEMS asset or with a designated cardiac-arrest resource. A modelling budget scenario in the HTW report equips 22 RRVs and trains 136 clinical team leaders, i.e. team-leader-level rather than every-crew capability. **[U] NWAS-specific carriage not verified.**

---

## THINGS I COULD NOT VERIFY — DO NOT PRESENT AS FACT
1. **Exact grade cut-offs in the SECAmb skills matrix.** The authority cells are colour-block images inside the PDF; I could read the skill rows and the column headings but not which cell is green. Rows confirmed to exist: nasopharyngeal airway; supraglottic airway devices; endotracheal intubation (adult); endotracheal intubation (paeds); laryngoscopy + Magill forceps for FBAO; needle cricothyroidotomy; surgical airway (FONA); orogastric tube; nasogastric tube; needle thoracentesis (anterior approach); needle thoracentesis (lateral approach); open thoracostomy; peripheral IV; external jugular; humeral IO; tibial IO; femoral IO.
2. **Whether technicians/AAPs may insert an i-gel** — trust-variable, not settled nationally in anything I read.
3. **Any numeric UK pause target for fitting a mechanical CPR device** — none found in a UK primary source.
4. **SECAmb listing calcium chloride under "Sch 19"** — Schedule 19 as published on legislation.gov.uk does not contain calcium chloride. Likely a trust-document labelling error.
5. **Whether any UK service permits CCP-led RSI with no doctor present.** Everything I found describes doctor-paramedic PHEA teams.
6. **JRCALC's own text.** JRCALC/AACE Clinical Practice Guidelines are a paid product; everything attributed to JRCALC here is via trust policies (SECAmb, SCAS) or peer-reviewed papers quoting it. Specifically unverified against JRCALC itself: the needle thoracocentesis site, the naloxone dose table, the TXA indication set, and the exact ROLE wording.
7. **Osborn/J waves in hypothermia**, **pericardiocentesis for tamponade**, **finger thoracostomy at the 4th ICS MAL as the named preferred site**, **paediatric unsuitability of mechanical devices**, **AutoPulse NXT specs**, and **mechanical-CPR injury meta-analysis figures** — all from secondary or non-UK sources.
8. **NWAS-specific** carriage of mechanical CPR devices, technician skill set, and CCP scope — I used SECAmb/SCAS/NWAA/GWAAC/LAS as the readable exemplars. If the sim is NWAS-branded, these should be flagged in-game as "typical English trust practice" rather than NWAS-verified.

---

## Part 3 — Equipment

# UK AMBULANCE CARDIAC ARREST EQUIPMENT — RESEARCH FINDINGS

Method note: primary sources are trust FOI disclosures (WhatDoTheyKnow), Resuscitation Council UK 2025 guidelines, NHS Learning Hub, and manufacturer pages. The single most valuable finds are the **LAS Vehicle Equipment Loading List v2.1 (Dec 2025, 28pp)**, the **EEAST Make-Ready module SOPs (2026)**, the **LAS APP-CC critical care kit list v14**, and the **NWAS response-bag FOI**. No files were modified.

---

## HEADLINE FINDING FOR YOUR SIM: NWAS IS NOT A CORPULS OR LIFEPAK SERVICE

**VERIFIED — NWAS uses the Schiller DEFIGARD Touch 7.** This is unusual and almost certainly wrong in any generic model you'd otherwise build.

- NWAS's own Senior Communications Manager, in an FOI reply: *"Schiller defibrillators have been in use since 2022"* — on "NWAS ambulances and RVs" (both DCA and RRV). [whatdotheyknow.com/request/communication_regarding_schiller; whatdotheyknow.com/request/schiller_failure_to_shock]
- Model confirmed via NHS Learning Hub, NWAS e-learning: *"Schiller DefiGuard Touch 7 defibrillator"*, referred to internally as **"the T7"**. Training module covers software upgrades + a Schiller safety update + "frequently recorded areas of anomaly which affect the unit's operation". [learninghub.nhs.uk/resource/59775]
- NWAS's CPD site hosts the DEFIGARD Touch 7 user manual directly (`devcpd.nwas.nhs.uk/wp-content/uploads/Schiller-UM-Dec-2024-0-48-0227_k_NU_DEFIGARD_Touch7_EN_...pdf`) and an "Ambulance Equipment" module.
- There is a live FOI thread (2025–26) about Schiller "failure to shock" episodes and internal comms about failures — if you want in-world texture, T7 reliability is a real crew grumble in the North West.

**DEFIGARD Touch 7 capability set** [schiller.ch/en/products/defigard-touch-7-p46] — all VERIFIED from the manufacturer page:
- AED **and** manual defibrillation, **sync and async** (i.e. synchronised cardioversion supported)
- **Transcutaneous pacing**
- **ECG 6 to 12 leads** with ETM interpretation algorithm
- **NIBP and IBP**
- **SpO2 Masimo Rainbow** (SpCO, SpMet, PI) with plethysmogram
- **EtCO2 — mainstream or sidestream**
- Temperature
- **CPR feedback on depth, rate and recoil** via ARGUS LifePoint 2 puck; metronome
- **Cellular + Wi-Fi transmission**; "SentioWeb" livestreaming (remote real-time access); screen-mirroring to tablet; ePCR link; Bluetooth printer
- 7" colour touchscreen

Energy levels not stated on the manufacturer page — UNVERIFIED for the T7 specifically. Use the RCUK generic figures below.

---

## (1) THE DEFIBRILLATOR / MONITOR — WHO ACTUALLY USES WHAT

VERIFIED per-trust, from FOI:

| Trust | Manual monitor/defib | AED | Source |
|---|---|---|---|
| **NWAS** | **Schiller DEFIGARD Touch 7 ("T7"), since 2022**, on DCAs and RRVs | — | FOI + NHS Learning Hub (above) |
| **LAS** | **LIFEPAK 15** (Physio-Control/Stryker) | **LIFEPAK 1000** — carried as a *second, separate* unit on both DCA and FRU | LAS Loading List v2.1, §7, §8 |
| **EEAST** | **corpuls3 and corpuls3T**, supplied by Ortus, **~1100 units** (not all in service, age-replacement running) | **ZOLL AED 3 and AED Plus** | whatdotheyknow.com/search/corpuls/all (EEAST Defibrillation Equipment Information, Nov 2023); EEAST MR 52 module |
| **Welsh (WAST)** | **corpuls C3, 676 devices**, in use since a 2015 purchase decision; new units bought at vehicle commissioning | corpuls AED | WAST Defibrillation Equipment Information, 15 Nov 2023 |
| **YAS** | **corpuls3** (primary) — device register also lists **LIFEPAK 15**, LIFEPAK 1000, Powerheart G5 | | YAS Policy information request, 10 Mar 2022 |
| **NIAS** | **corpuls** | | NIAS FOIs |
| **SWASFT** | **LIFEPAK 15** (100% in-service KPI) and **LIFEPAK 1000** (79%) | | SWASFT Medical Device Types, 6 Apr 2023 |
| **SECAmb** | **LIFEPAK** — their PPCI flowchart literally says "stay alert for **Lifepak printouts** indicating ST changes" | | secamb.nhs.uk PPCI Flowchart v11 (2024) |
| **WMAS** | *Ambiguous.* Their FOI answer to "supplier for Manual/AEDs" was **"ZOLL / AED Pro and AED 3 / 650", purchased 2009, no tender planned, maintained in-house.** | | FOI/4738, 9 Nov 2023 |

**FLAG — UNVERIFIED / CORRECTIONS TO COMMON ASSUMPTIONS:**
- **Zoll X Series: I found no UK ambulance trust using it as the standard road monitor.** ZOLL's UK ambulance footprint in these FOIs is *AEDs* (AED 3, AED Plus, AED Pro), not the X Series. Don't model an X Series on a UK DCA without better evidence.
- WMAS's manual monitor is not clearly established by that FOI — the answer names only ZOLL AEDs. Treat WMAS manual defib as unverified.
- So the real UK split is roughly: **corpuls3 (EEAST, WAST, YAS, NIAS) vs LIFEPAK 15 (LAS, SWASFT, SECAmb) vs Schiller T7 (NWAS)**.

**Modelling detail worth having:** the corpuls3 is **modular** — it separates into monitor unit / patient box / defibrillator unit, so the crew can carry just the patient box to the patient. The LIFEPAK 15 and Schiller T7 are single-block units. If your sim shows kit being carried in, that's a visible per-service difference.

**What a UK DCA monitor does, all standard on all three:** manual + AED modes, 3/4-lead monitoring, **12-lead ECG with interpretation**, SpO2, NIBP, **waveform capnography**, **transcutaneous pacing**, **synchronised cardioversion**, printer, and data transmission. So: yes, every one of the functions in your question is standard on a UK DCA-carried monitor. There is no "basic" DCA defib tier.

**Vehicle tiering for the defib:**
- **DCA**: primary monitor (T7/LP15/corpuls3) + on LAS a second LIFEPAK 1000 AED.
- **RRV/FRU**: **the same monitor**. LAS FRU carries LIFEPAK 15 *and* LIFEPAK 1000. An RRV is not clinically down-specced for arrest — it's down-specced for *conveyance*. LAS state the FRU's spares are deliberately thin "based on the principles that FRUs will be backed up by a DCA".
- **Critical care car (LAS APP-CC)**: **Tempus Pro + Tempus LS** (RDT/Philips) as the primary, with LP15-compatible cuffs/probes carried too.

---

## (2) WAVEFORM CAPNOGRAPHY — THE NUMBERS

**Critical authenticity point: UK monitors display ETCO2 in kPa, not mmHg.** A UK paramedic says "his end-tidal's two point one", not "sixteen". Conversion: 1 kPa ≈ 7.5 mmHg.

VERIFIED numbers:

**Normal / reference**
- PaCO2 normal **4.6–6.0 kPa**. EtCO2 sits slightly below PaCO2 — by **0–0.3 kPa** in an awake patient, by **~0.8 kPa** in the intubated or sick patient. [Journal of Paramedic Practice, Griffiths 2017]
- Post-ROSC normocapnia target: **4.7–6.0 kPa (35–45 mmHg)**. [RCUK Post-resuscitation Care Guidelines 2025]

**Confirming airway placement — this is the mandatory one**
- RCUK 2025: *"A sustained ETCO2 trace on waveform capnography **must** be used to exclude oesophageal placement of the tracheal tube."*
- Capnography is described as **mandatory** to confirm and monitor ET tube placement (escalated from "strongly advised" in earlier AACE/JRCALC editions). [AACE/JRCALC 2016 via JPP]
- In-sim behaviour: no waveform = tube is in the oesophagus until proven otherwise. A flat trace after an i-gel insertion is the same alarm.

**CPR quality**
- RCUK 2025 physiology-guided CPR target: **ETCO2 ≥ 3.3 kPa (25 mmHg)**, alongside diastolic BP ≥30 mmHg where invasive arterial monitoring exists. *Caveat: this target is framed around invasive physiology-guided CPR, mostly in-hospital — don't present it as a prehospital pass/fail threshold.*
- Falling ETCO2 with a constant ventilation rate = failing compressions. Practical trigger: **swap the compressor**, or increase depth. A **fall of ≥25% from baseline** is a recognised bad-trend marker.

**Detecting ROSC**
- A **sudden, sharp rise** is the classic sign — often the first indication of ROSC, before a palpable carotid pulse.
- Magnitude: a jump toward normal values (**~4.0–5.3 kPa / 30–40 mmHg**) or a rise of ~1.3 kPa (10 mmHg) is highly **specific** but **not sensitive**.
- RCUK 2025 caution to model: *"An increase in ETCO2 during CPR may indicate that ROSC has occurred. **However, chest compression should not be interrupted based on this sign alone.**"* Use combined clinical + physiological indicators before pausing.

**Prognostication**
- **ETCO2 < 1.33 kPa (10 mmHg)** is the value most strongly correlated with **failure** to achieve ROSC, as is a ≥25% fall from baseline. [JPP systematic review]
- Observed means: patients achieving ROSC ran roughly **4.3–4.6 kPa**; those who did not, **2.9–3.1 kPa** (Murphy 2016 n=230; Sheak 2015 n=356).
- **RCUK 2025, and you must model this:** *"**Do not use a low ETCO2 value alone to decide if a resuscitation attempt should be stopped.**"* If your sim lets an operator terminate on ETCO2 alone, that is a guideline breach and would be worth flagging in-game.
- Asphyxial arrests break the rule — initial ETCO2 is anomalously *high* (~7 kPa) and doesn't discriminate until after minute 5. Nice edge case for a hanging/drowning/overdose scenario.

**Physical consumables (so your kit model is right):** capnography is a *consumable line*, and UK lists distinguish three SKUs — **ETCO2 (intubated adult)**, **ETCO2 (non-intubated adult)** [nasal/CapnoLine], and **ETCO2 (non-intubated child)**. LAS carries all three on the LIFEPAK 15 and stocks 4/1/2 respectively in the airway cupboard. EEAST's corpuls module carries "End-tidal (airway) ×1, End-tidal (nasal) ×1".

---

## (3) MECHANICAL CPR — LUCAS vs AUTOPULSE vs CORPULS CPR

**HEADLINE, VERIFIED BY ABSENCE IN TWO INDEPENDENT 2025–26 LOADING LISTS: mechanical CPR is NOT standard on a UK DCA.**

- **LAS Vehicle Loading List v2.1 (Dec 2025)** — full 28-page list covering Mercedes DCA, Ford DCA and FRU. **No LUCAS, no AutoPulse, no mCPR of any kind anywhere on it**, including the restock checklist.
- **EEAST MR 99 DSA Load Listing (2026)** — grepped the full document: **no LUCAS, no AutoPulse, no Corpuls CPR**. It does list Laerdal Suction Unit, Corpuls Cardiac Monitor, Stryker stretcher, scoop, carry chair, KED, Mangar ELK.

**Where mCPR actually lives — VERIFIED:**
- **LAS APP-CC (Advanced Paramedic Practitioner – Critical Care) car, Volvo XC60**: **LUCAS 2**, in the boot primary tray, offside section. Full packing spec: LUCAS 2 ×1, installed fully-charged battery, installed compression cup, installed patient (wrist) straps ×2, **stabilisation (neck) strap with compatible buckles and protector**, **radiotranslucent back board**, plus a spares pouch with 240V mains charging lead (2-part), 3 spare neck-strap protectors, transpore tape, **1 spare fully-charged battery**, **1 spare compression cup**. [LAS APP-CC Equipment Checklist v14, Dec 2024]
- **YAS**: device register lists **AutoPulse** *and* **Corpuls CPR** (alongside corpuls3, LIFEPAK 15, EZ-IO G3).
- **NIAS**: **10 Corpuls CPR devices** (FOI, 1 Jul 2026) — note NIAS answered a question that explicitly offered "e.g. Corpuls, Lucas" and answered Corpuls.
- **SCAS**: first UK service to roll out **LUCAS 3** — **28 devices** across Oxfordshire, Berkshire, Buckinghamshire and Hampshire, **funded by South Central Ambulance Charity**. 28 devices over four counties is emphatically not one-per-DCA.
- **EMAS**: deployed **LUCAS 2**.

So the real UK picture: **LUCAS (2 and 3) and AutoPulse and Corpuls CPR all exist in UK services, but as a limited pool held on officer / critical care / specialist vehicles, or a charity-funded subset of DCAs — never a guaranteed item on the DCA that turns up.** For a Chorlton cardiac arrest, the honest model is: the DCA has no mCPR; if you want one, you request the resource and wait.

**FLAG — UNVERIFIED: whether NWAS carries mechanical CPR at all.** I found no FOI, procurement notice or news item either way. Do not assert it.

**LUCAS 3 deployment procedure (Stryker, VERIFIED):**
1. Pause compressions; slide the **low-profile back plate** under the patient at nipple line.
2. Attach the support legs/claw hooks to the back plate until they click.
3. Position the **suction cup** over the lower half of the sternum (AutoFit / QuickFit / manual positioning).
4. Press ACTIVE (continuous) or 30:2. Secure **patient wrist straps** and the neck/stabilisation strap for transport.
- **Rate 102 ± 2 compressions/min. Depth 5.3 cm (2.1") default.**
- Modes: continuous **and** 30:2 (Stryker markets continuous; chest compression fraction up to 93%).
- **Battery ~45 min** continuous on one battery; extendable with spares or external power.
- **Weight 17.7 lb (~8 kg)** with battery.
- **Median interruption to swap from manual to mechanical: 7 seconds** — this is the number SCAS and Stryker both quote, and is the right value for a sim timer.
- Fit limits: chest height 6.7–11.9", max chest width 17.7", no patient weight limit.

**RCUK 2025 indication — model this as the gate:** mechanical chest compression devices should be considered **only** *"if high-quality manual chest compression is not practical or compromises provider safety"*, with trained teams minimising interruptions during application. That means: extrication down stairs, a moving ambulance, prolonged transport to a cardiac arrest centre / ECPR — **not** routine use on a living-room floor.

---

## (4) AIRWAY KIT

**i-gel is the primary advanced airway on a UK DCA.** Adult sizes carried are **3, 4 and 5** — universally, on every list I checked.

**i-gel sizing (Intersurgical, VERIFIED for adults):**
- **Size 3 — small adult, 30–60 kg** (max 12FG gastric tube)
- **Size 4 — medium adult, 50–90 kg** (max 12FG)
- **Size 5 — large adult, 90 kg+** (max 14FG)
- Paediatric sizes as labelled on the LAS PALS kit: **1.0 neonate, 1.5 infant, 2.0 small paediatric, 2.5 large paediatric**. *(Paediatric weight bands not separately verified this session — FLAG.)*
- Selection is **by weight and anatomical assessment**, and size 4 is the default adult grab.

**Per-service carriage — VERIFIED:**
- **NWAS Combined ALS/PALS bag**: i-gel **sizes 1, 2, 3, 4, 5** (one of each), plus securing tape. Paediatric 1&2 on one side of the bag, adult 3/4/5 on the other.
- **LAS Airway Pouch** (in the *Primary Response Bag*, i.e. the first bag through the door): iGel 3, 4, 5 ×1 each + 4 lubrication gel sachets.
- **EEAST MR 106 Adult I-Gel Module**: orange long module, i-gel #3/#4/#5 ×1 each, 2 pre-cut tube ties, 2 lubricating gel. Separate **MR 108 Paediatric I-Gel Module**.

**BVM**
- **Adult 1L and paediatric 500ml** (NWAS Openhouse Immediate Response Bag).
- LAS BVM Pouch: **Adult BVM with 3 face masks; Paediatric BVM with 4 face masks**; plus a "Suction Easy" hand suction in the same pouch.
- EEAST Adult Resuscitation Module: Adult BVM + anaesthetic masks **#2, #3, #4, #5** + adult breathing filter.

**Basic adjuncts**
- **OPAs sizes 000, 00, 0, 1, 2, 3, 4** (and 5 on LAS). LAS colour-codes them and it's in the loading list: **00 blue, 0 black, 1 white, 2 green, 3 orange, 4 pink, 5 yellow.** Excellent free authenticity detail.
- **NPAs 6mm and 7mm** (NWAS also carries 8mm) + lubricant.

**Suction**
- **Vehicle unit: Laerdal LSU** (LAS and EEAST both). LAS carries catheters FR/CH8, FR/CH12, FR/CH18 + **wide-bore Yankauer** + vacuum tubing + liner, with a duplicate spares set in the LSU cupboard.
- **In the response bag: a small hand/portable unit** — NWAS "**Fenton Easi Suction**", LAS "**Suction Easy**".
- **Critical care car: WEINMANN ACCUVAC Pro** (LAS APP-CC), with adult Yankauer + soft 8Ch/12Ch/18Ch catheters.

**ETT — and who actually uses it**
- **Yes, UK DCAs carry ETTs, and this surprises people.** LAS Airway Pouch carries a **cuffed 6.5** even in the primary response bag; the LAS **Intubation Pouch** (in the ALS bag) carries **cuffed 6.5 ×2, 7.0 ×2, 8.0 ×2**, Mac 3 + Mac 4 laryngoscopes, Thomas tube holder, catheter mount with integrated HME filter, tube tie/ribbon gauze, **15Fr Easy Carry bougie**, 10ml syringe, 2× ETCO2 (intubated adult).
- **NWAS ALS/PALS bag** carries the full paediatric-to-adult range: **ET 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 7.0, 8.0**, plus combination blade+handle laryngoscopes **Mil 1, Mac 2, Mac 3, Mac 4**, adult + paediatric Magills, adult + paediatric Thomas tube holders, CO2 detector adult + paediatric, catheter mount, 20ml syringe, bougie.
- **EEAST** splits it: MR 105 Adult Resuscitation Module has a single sealed **ETT #6** + Mac #4 + Magills; a separate **MR 111 Adult Intubation Module** holds the rest.
- **RCUK 2025 gate on who intubates:** *"Tracheal intubation should only be attempted by rescuers with a high success rate"* — defined as **>95% success within two attempts** — and requires **continuous waveform capnography**. **Videolaryngoscopy is preferred where immediately available.**
- Practical model: standard paramedic → i-gel. ETT is realistically a critical-care/HEMS intervention, though trusts vary and the tubes are physically on the DCA. **FLAG: the *authorisation* to intubate is trust- and grade-specific and I did not verify NWAS's current position.**
- **Video laryngoscopy is a critical-care-tier item, not DCA.** LAS APP-CC carries **King Vision** (display + adult and paediatric aBlade adapters + channelled aBlade size 3) **and** a **C-MAC** (blade 4, D-blade, USB unit) in the Tempus bag. Nothing like this on a DCA.
- **Surgical airway is critical-care only**: LAS APP-CC has a sealed "SURGICAL AIRWAY KIT" — scalpel 22 blade, scalpel 10 blade (bagged, labelled paediatric), tracheal dilator, tracheal hook, ChitoGauze, gauze, lubricant.

**VENTILATION STRATEGY ONCE AN ADVANCED AIRWAY IS IN — VERIFIED, RCUK 2025:**
- *"Ventilate the lungs at a rate of **10 min⁻¹** and continue chest compressions **without pausing**."*
- **Exception:** if the **supraglottic airway leaks**, revert to **30:2**. This is the realistic i-gel failure mode and a good sim branch — a leaking i-gel forces you back to interrupted compressions and tanks your compression fraction.

---

## (5) ACCESS — IV vs IO

**THE MOST IMPORTANT UPDATE, AND ONE MOST SIMS GET WRONG.**

**RCUK 2025 changed the order: *"Attempt intravenous (IV) rather than intraosseous (IO) access first."*** IO becomes reasonable only **if IV access cannot be achieved within two attempts.** Older guidance ("go IO if IV looks difficult") is superseded. If your sim rewards straight-to-drill at an arrest, it's now out of date.

**IV kit — LAS ALS Bag, Cannulation Pouch (VERIFIED):**
- Cannulae **14G ×2, 16G ×2, 18G ×3, 20G ×3, 22G ×2**
- Single-use venous tourniquets ×4, IV packs ×2, IV dressings ×2
- **10ml sodium chloride ×5**, syringes 1ml ×2 / 3ml ×3 / 10ml ×4, syringe bungs ×4, blunt drawing-up needles ×4, **Chloraprep wipes ×4**, micropore tape, 5cm conforming bandage, gauze
- NWAS Grey Pouch (Cannulation/IV) in the response bag mirrors this: **24G, 22G, 20G, 18G, 16G, 14G Venflons ×2 each**, syringes 1/2/5/10/20ml, 5 drawing-up needles, 4× 10ml saline flush, 4 cannula dressings, 2 tourniquets, 3-way tap, plus 21g and 23g hypodermic needles for IM.

**IO — the drill is the Arrow EZ-IO (Teleflex), universally:**
- **LAS EZ-IO Pouch** (a discrete pouch inside the ALS bag): **EZ-IO Driver ×1**, needles **45mm (yellow) ×1, 25mm (blue) ×1, 15mm (pink) ×1**, 50ml syringe, 10ml syringe, **10ml sodium chloride ×2**, three-way tap, gauze, 2× Chloraprep, blunt drawing-up needle.
- **EEAST MR 53 EZ-IO Module**: yellow "EZ-IO" case — Intraosseous Gun ×1 (tested per EZ-IO SOP), Needle and Stabilizer **#15, #25, #45** ×1 each, 10ml prefilled sodium chloride syringe, 5 sterile gauze swabs, 3-way tap, 2 Clinell skin wipes, sealed with a tag through the zippers.
- **YAS** device register lists **EZ-IO G3**.
- **NWAS ALS/PALS bag lists a "Cook I/O Needle"** — a manual IO needle, **not** an EZ-IO drill. **FLAG: this document is dated 2014 v1.3 (released under FOI in 2022) and is very likely superseded. Do not model NWAS as manual-IO-only without checking. Treat NWAS IO device as UNVERIFIED.**

**Needle selection by site (VERIFIED):**
- **15mm (pink)** — small/paediatric
- **25mm (blue)** — standard adult **proximal tibia**
- **45mm (yellow)** — **proximal humerus** (surgical neck, slight superior angle, insert to the hub), obese patients, distal femur
- *Note an internal inconsistency in LAS's own document: the adult EZ-IO pouch lists 45mm yellow / 25mm blue / 15mm pink, but the paediatric PALS pouch lists "15mm (blue)" and "25mm (pink)" — the colours appear transposed in the PALS entry. The adult pouch matches Teleflex's actual colour coding; use that.*

**Sites:**
- **Proximal tibia** — the default; fastest to find, easiest with a patient supine on a floor mid-CPR.
- **Proximal humerus** — better flow (mean ~213 mL/min vs ~103 mL/min proximal tibia) but the arm has to be adducted and internally rotated, which fights with active CPR and with a LUCAS wrist strap.
- **Distal tibia / distal femur** — paediatric alternatives.
- Paramedics reliably identify both proximal humerus and proximal tibia (90% in one study), so both are realistic.

**When IO is chosen at an arrest, realistically:** after two failed IV attempts (per RCUK 2025); in a shut-down peripherally-vasoconstricted arrest patient; where the arms are inaccessible (entrapment, LUCAS straps on, patient in a stairwell); or in paediatrics. **All IO/IV lines are flushed with 10ml sodium chloride** — that's why every IO pouch carries 2× 10ml NaCl and a 3-way tap.

---

## (6) THE REST OF THE ARREST KIT

### NWAS "Openhouse Immediate Response Bag" — VERIFIED, colour-coded pouches
This is your NWAS-specific detail and it's excellent for a sim UI, because the pouches are colour-named:

- **Bag body**: MGS Oxygen cylinder 3L + carrying sleeve, **Adult BVM 1L**, **Paediatric BVM 500ml**, sharps bin, clinical waste bag, **Fenton Easi Suction** + catheters (Yankauer 18ch, Yankauer Mini, Black 10fg, Orange 16fg)
- **Clear PPE Pouch**: 2× FFP3 mask, 2× safety glasses
- **Orange Pouch — Nebulisation**: adult + paed nebuliser masks, adult + paed peak flow meters, peak flow tubes, salbutamol 2.5mg + 5mg, ipratropium nebules
- **Clear Medicines Pouch**: aspirin, paracetamol, GTN
- **Yellow Pouch — Airway Management**: 100% O2 masks adult + paed, medium-concentration mask, nasal cannula, **OPAs 000–4**, tongue depressor, **NPAs 6/7/8mm**, lubricant
- **Grey Pouch — Cannulation/IV** (contents above)
- **Red Pouch — Diagnostics**: sphygmomanometer, stethoscope, blood glucose monitor, thermometer, pen torch, **mobile saturations monitor**
- **Blue Pouch — Wound Management**: ambulance dressings S/M/L/XL, K bandages, Melolin, triangular bandages, **Russell chest seal**, **CAT tourniquets ×2**, Celox, tough-cut shears, plasters

### LAS bag architecture (a clean two-bag model for a sim)
- **Primary Response Bag** = BVM Pouch + Oxygen Masks Pouch + **Diagnostics Pouch** + **Airway Pouch** + Dressings Pouch + a small ZD oxygen cylinder. This is the bag that goes in first.
- **ALS Bag** = **Cannulation Pouch + Intubation Pouch + EZ-IO Pouch**. This is the second bag, and at an arrest it always comes in.
- Separate items: LIFEPAK 15, LIFEPAK 1000, Laerdal Suction Unit, PALS kit, Entonox bag.

### DRUGS — VERIFIED, NEAS frontline drug list, May 2026
NEAS's list has an explicit **"CARDIAC ARREST"** heading:
- **Adrenaline prefilled syringe 1:10,000 — 10 carried, minimum 7**
- **Amiodarone prefilled syringe 300mg/10ml — 2 carried, minimum 2**
- Naloxone ampoules 400mcg — 10, min 2
- Plus, carried on the vehicle: **Sodium Chloride 0.9% 1L**, Glucose 10% 500ml
- Elsewhere on the vehicle and relevant to peri-arrest: Adrenaline **1:1,000** ampoules (anaphylaxis), atropine, furosemide, hydrocortisone, tranexamic acid 500mg/5ml, chlorphenamine, aspirin 300mg dispersible, GTN spray.

RCUK dosing to drive the sim clock:
- **Non-shockable: adrenaline 1mg as soon as possible.**
- **Shockable: adrenaline 1mg after the third shock.**
- **Repeat adrenaline 1mg every 3–5 minutes** thereafter.
- **Amiodarone 300mg IV after three shocks; further 150mg IV after five shocks.**
- RCUK equipment standard confirms the UK presentation: **adrenaline 1mg as 10 mL of 1:10,000 in a prefilled syringe**, amiodarone 300mg prefilled. (i.e. Minijet-style — not an ampoule you draw up.)

### EXTRICATION / MOVING A PATIENT IN ARREST — VERIFIED
On the DCA:
- **Scoop stretcher** + **disposable scoop straps (2 sets of 3)** — the primary tool for lifting an arrest patient off a floor
- **Carry chair** — Ferno/Stryker **Compact 2**, wall- or door-mounted, with **Compact 2 Carry Chair Tracks** for stairs, and a spare battery for the powered version
- **Stryker power trolley bed** (mounted centrally), with a spare battery and extension straps
- **Manual Handling Bag**: carry sheet, **one-way glide tube**, 2 flat sheets with handles, universal handling belt, **heavy-duty turn plate**, **curved glide board**
- **Mangar ELK** inflatable lifting cushion + compressor + tubing (for lifting from the floor)
- **Lateral transfer board** and **Kendrick Extrication Device** (EEAST)
- Pedi-Mate (paediatric trolley restraint), spinal board, headblocks, collars

**The honest sim mechanic for moving an arrest patient:** without mechanical CPR, you cannot maintain effective compressions while carrying someone down a stairwell. UK practice is therefore to **work the arrest where the patient lies** — floor of the living room, the playing field, wherever — and move only on ROSC, or on a decision to convey with a mechanical device, or on termination. This is why the **scoop + LUCAS + radiotranslucent back board** combination matters so much on the critical care car: the back board is what lets you scoop-and-carry with compressions continuing. Model "move the patient" as a genuine trade-off against compression fraction, not a free action.

---

## (7) 12-LEAD ECG POST-ROSC AND PPCI PRE-ALERT

**VERIFIED — SECAmb PPCI Flowchart v11 (2024)**, the clearest UK operational document I found:

1. **"Do 12 lead ECG as soon as possible and within 10 minutes of arrival."**
2. Decision: **ST elevation in 2 or more leads of the same group, or possible posterior MI?**
3. If **YES**: **"Transmit to closest pPCI centre with follow-up phone call"** (closest centre found via Service Finder). **"Call CCD [Clinical Coordination Desk] for decision if transmission fails or if you need advice."**
4. Outcome branches **Accepted** / **Not accepted**.
   - **Accepted** → convey to the PPCI destination.
   - **Not accepted** → local ED; **keep 12-lead electrodes on**, stay alert for LIFEPAK printouts indicating ST changes, **print ECG regularly**, and **re-transmit to PPCI if ST elevation develops at any time until handover**.
5. If initially **NO**: local ED (contact CCD via Talkgroup 16 if unsure), aspirin + GTN per JRCALC, electrodes stay on, monitor, re-transmit if it evolves.
6. **STEMI care bundle en route**: aspirin, GTN, 2 pain scores, appropriate analgesia. **Paramedic administers ticagrelor**; non-paramedic uses Entonox for pain relief.
7. **"DO NOT wait for back-up unless unable to extricate patient. Minimise patient exertion (use chair or trolley where possible)."**
8. **During transit: "Do not routinely apply defib pads. Take defib and response bag to cath lab and MONITOR VIA 12 LEAD THROUGHOUT JOURNEY UNTIL HANDOVER."**

**Transmission mechanics — VERIFIED and important, because it is NOT uniform:**
- **HSSIB** (national investigation, 12-lead ECGs in ambulance services) found **significant variation in two-way communication**. Best-practice example cited: a PPCI centre running *"a 24/7 phone number for ambulance crews to speak to someone about patients with a suspected STEMI... staffed by a cardiology nurse during the day and by either a registrar or a consultant at night. The conversation on the phone was backed up by the ambulance crews transmitting the ECG trace to the PPCI centre for review."*
- HSSIB's key negative finding: **"PPCI centres had limited capacity to provide ECG interpretation advice to ambulance crews as they were not commissioned to provide this service."** That's a systemic gap, and a genuinely realistic source of friction/delay for a sim scenario.
- HSSIB also notes *"a range of manufacturers provide monitor/defibrillators to the NHS, each with different physical designs, software, functionality and usability"* — variation in the device itself is a named patient-safety factor.
- Some pathways **do not** telemeter at all: one documented UK direct-admission model has a **maximum 24 miles (38.3 km)** pick-up-to-PPCI-centre distance, where **ECGs are not transmitted and the case is not discussed with a physician** — the paramedic diagnoses autonomously (chest pain <12h, ST-elevation ≥1mm in two contiguous leads, or new LBBB) and **ambulance control alerts the PPCI centre with an ETA**.

**Device transmission capability:** the NWAS **Schiller T7 supports cellular and Wi-Fi transmission plus SentioWeb livestreaming**, so a North West crew can both transmit the 12-lead and have the receiving centre watch live. *(FLAG: Physio-Control's LIFENET and corpuls.web are the equivalent vendor platforms for LIFEPAK and corpuls fleets — I did not verify UK trust configuration of those this session.)*

**RCUK Post-resuscitation Care 2025 — post-ROSC targets to drive the sim:**
- **"Prioritise immediate coronary angiography for patients with clear ST-elevation."**
- **"Adult patients with non-traumatic OHCA should be considered for transport to a cardiac arrest centre according to local protocols."** (Note: **cardiac arrest centre**, which is not always the same as the nearest PPCI centre.)
- **SpO2 target 94–98%** — titrate down once the reading is reliable; avoid hyperoxaemia as well as hypoxaemia.
- **Normocapnia: PaCO2 4.7–6.0 kPa (35–45 mmHg)** — so post-ROSC you stop bagging at 10/min and ventilate to an ETCO2 in that band.
- **MAP > 60–65 mmHg.**

---

## VEHICLE TIER SUMMARY — WHAT'S ON WHAT

**DCA (double-crewed ambulance)** — VERIFIED
Monitor/defib with 12-lead, SpO2, NIBP, ETCO2, pacing, sync cardioversion (Schiller T7 at NWAS) · Primary Response Bag · ALS bag (cannulation + intubation + EZ-IO) · i-gel 3/4/5 (+ paed) · adult & paed BVM · OPA/NPA range · Laerdal LSU + hand suction · O2 (2× ZD small, 2× HX large) · Entonox · adrenaline 1:10,000 ×10, amiodarone 300mg ×2 · NaCl 0.9% 1L · scoop + straps · carry chair + tracks · power trolley · Mangar ELK · manual handling kit · PALS kit · trauma, maternity, dressings, IPC packs.
**NOT on it: mechanical CPR, video laryngoscope, ultrasound, ventilator, RSI drugs.**

**RRV / FRU (rapid response vehicle)** — VERIFIED (LAS FRU list)
**Clinically identical for arrest**: Primary Response Bag, LIFEPAK 15, LIFEPAK 1000, suction unit, ALS bag, PALS kit, Entonox, trauma/dressings/maternity/IPC, triage pack, nerve agent antidote kit. Deliberately thin spares "based on the principles that FRUs will be backed up by a DCA". **No trolley, no chair, no scoop** — an RRV cannot convey. Note LAS **removed the collars bag from the FRU** at v2.0 (Dec 2025).
Sim consequence: a solo RRV paramedic at an arrest can do everything clinically and nothing logistically. They need the DCA.

**Critical care car (LAS APP-CC, Volvo XC60)** — VERIFIED
**LUCAS 2** (+ back board, spare battery, spare cup) · **Tempus Pro + Tempus LS** monitors · **ZOLL Z-Vent ventilator** · **King Vision + C-MAC video laryngoscopes** · **Philips Lumify ultrasound** (S4-1 sector, S4-1 curved, L12-4 linear transducers) · **surgical airway kit** · chest decompression (Russell PneumoFix ×2, Spencer Wells, scalpels) · **2× MPmlh+ syringe drivers** · **controlled drugs in padlocked Peli cases: ketamine 10mg/ml and 50mg/ml, morphine 10mg/ml, midazolam 1mg/ml and 5mg/ml** · WEINMANN ACCUVAC Pro suction · PAX warming blanket · roll-up stretcher · SORT DuoDote / Diphoterine · Ten Second Triage tags.

**HEMS** — PARTIALLY VERIFIED
Doctor–paramedic team; prehospital emergency anaesthesia, thoracostomy, ultrasound, blood products at some services. **FLAG: I did not verify North West Air Ambulance's specific kit list this session.** The LAS APP-CC list above is the closest verified proxy for UK enhanced-care loadout. Your existing memory note (HEMS lands on the operator's LZ and the crew walks in) is consistent with how the capability arrives — kit is carried in by hand from the aircraft.

**HART** — VERIFIED (NIAS HART IRU equipment list, Apr 2026)
Clinically **the same as a DCA**: Defib, Response bag, Suction, Oxygen, Entonox, glucometer, collars, consumables, carry sheet, multi-patient oxygen.
What HART adds is **access and manpower**, not drugs: **Titan titanium split basket stretcher** (with lifting harness), **MULE**, **Slix 50 / Slix 100 / Slix spinal insert**, folding spinal board, scoop + straps, vacuum mattress and splints, Blizzard blankets · Lyon Synergy pick-off rescue pack, working-at-height bags ×2 · BA sets, BAECO board, gas-tight suits, PRPS, escape sets (Dräger), gas monitor · CBRN recce bag, disrobe/re-robe packs, IOR packs, DuoDote, RAM GENE, EPD, gas-tight body bags · thermal imaging camera, image intensifier, range finder, binoculars · water PPE, life jackets, throw bags · **MTFA clinical bags — 10 treatment packs, 2 "team 8" packs, triage bands, dressings, OP & NP airways** · way-safe lighting, loudhailer, E-flares, torch tripod · satellite phone, iPad, commander pack.
Sim consequence: HART at a cardiac arrest is the answer to *"the patient is in a place we cannot get a stretcher to"* — confined space, height, water, contaminated zone — not *"we need better drugs"*.

---

## FLAGGED — UNVERIFIED / TREAT WITH CAUTION

1. **Whether NWAS carries any mechanical CPR device.** No evidence found either way. Do not assert.
2. **The NWAS current (2026) loading list.** The best NWAS kit documents I could obtain are the **Openhouse Immediate Response Bag Contents List v4** and the **Combined ALS/PALS Bag 2014 v1.3** (both released under FOI in Sept 2022). The ALS/PALS document is authored 2014 with a June 2015 review date — **it is very probably superseded**, and its "Cook I/O Needle" in particular is likely now an EZ-IO.
3. **NWAS's current IO device.** See above.
4. **Schiller DEFIGARD Touch 7 defibrillation energy levels** — not stated on the manufacturer page.
5. **WMAS's manual monitor/defibrillator.** Their FOI names only ZOLL AEDs.
6. **Zoll X Series in UK ambulance service.** I found no evidence of it as a standard UK road monitor — the premise in the brief may be imported from US practice.
7. **i-gel paediatric weight bands** (1.0/1.5/2.0/2.5) — size labels verified from LAS; the kg ranges were not separately confirmed this session.
8. **LIFENET / corpuls.web** UK trust configuration for 12-lead transmission — not verified.
9. **North West Air Ambulance kit list** — not verified.
10. **Whether NWAS paramedics intubate** (as opposed to carrying ETTs) — trust-specific scope-of-practice, not verified.
11. **Minor source defect worth knowing:** the LAS Loading List v2.1 transposes the EZ-IO needle colours in its paediatric PALS section relative to its own adult EZ-IO section. The adult section matches Teleflex. Don't propagate the PALS colours.
12. The **WhatDoTheyKnow full-text search snippets** for corpuls quantities (EEAST 1100, WAST 676) come from the search index rather than a document I opened page-by-page; the underlying FOI requests are named and dated and can be re-checked.

## TECHNIQUE NOTE FOR FUTURE RESEARCH ON THIS PROJECT
WhatDoTheyKnow blocks WebFetch and curl (HTTP 403/418) but is reachable through the browser tool. FOI attachments are PDFs served in an iframe, so `get_page_text` returns nothing — the working method is to inject pdf.js from cdnjs into the page and extract text via `javascript_tool`, which is what produced most of the loading lists above. Worth reusing for the fire/police equivalents.

---

## Sources

- https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/adult-advanced-life-support-guidelines
- https://www.resus.org.uk/sites/default/files/2025-10/Adult%20ALS%20algorithm%202025.pdf
- https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/adult-basic-life-support-guidelines
- https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/post-resuscitation-care-guidelines
- https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/special-circumstances-guidelines
- https://www.resus.org.uk/sites/default/files/2025-10/Traumatic%20cardiac%20arrest%20algorithm%202025.pdf
- https://www.resus.org.uk/professional-library/faqs/faqs-advanced-life-support
- https://lms.resus.org.uk/modules/m65-non-technical-skills/resources/appendix_a.PDF
- https://aace.org.uk/wp-content/uploads/2017/03/cpg-2013-text-press-39-Left-side-of-flowchart-box.pdf
- https://www.scas.nhs.uk/wp-content/uploads/2022/02/Resuscitation-Policy.pdf
- https://jrcalc.org.uk/wp-content/uploads/2017/12/JRCALC_clinical_guidelines_2006.pdf
- https://aace.org.uk/wp-content/uploads/2017/09/CL_JRCALC_Pocket_Book_A6_026_17_SIngle-1.pdf
- https://www.secamb.nhs.uk/wp-content/uploads/2021/02/200923-List-of-Drugs.pdf
- https://www.secamb.nhs.uk/wp-content/uploads/2023/11/PGD006-Tranexamic-Acid-v5.00-2022.11.02-3.pdf
- https://bnf.nice.org.uk/treatment-summaries/cardiopulmonary-resuscitation/
- https://bnf.nice.org.uk/drugs/adrenaline/
- https://bnf.nice.org.uk/drugs/amiodarone-hydrochloride/
- https://bnf.nice.org.uk/drugs/lidocaine-hydrochloride/
- https://bnf.nice.org.uk/drugs/naloxone-hydrochloride/
- https://bnf.nice.org.uk/drugs/sodium-bicarbonate/
- https://bnf.nice.org.uk/drugs/calcium-chloride/
- https://bnf.nice.org.uk/drugs/magnesium-sulfate/
- https://bnf.nice.org.uk/drugs/tranexamic-acid/
- https://www.nice.org.uk/guidance/ng185/chapter/Recommendations
- https://www.resus.org.uk/about-us/news-and-events/rcuk-publishes-guidelines-2025
- https://www.resus.org.uk/print/pdf/node/36442
- https://www.resus.org.uk/sites/default/files/2024-05/RCUK%20Adult%20QRH%202024-05%20v1.1.pdf
- https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/executive-summary-main-changes-2021-guidelines
- https://www.legislation.gov.uk/uksi/2012/1916/schedule/17/made
- https://www.legislation.gov.uk/uksi/2012/1916/schedule/19
- https://www.secamb.nhs.uk/wp-content/uploads/2024/09/Resuscitation-Policy.pdf
- https://www.secamb.nhs.uk/wp-content/uploads/2024/08/Scope-of-Practice-Clinical-Standards-Policy-V13.pdf
- https://www.secamb.nhs.uk/wp-content/uploads/2026/03/FOI-260101b-Q3-Scope-of-Practice-and-Clinical-Standards-Policy.pdf
- https://www.scas.nhs.uk/wp-content/uploads/2022/09/Resuscitation-Policy.pdf
- https://www.readkong.com/page/resuscitation-policy-and-recognition-of-life-extinct-1770336
- https://healthtechnology.wales/wp-content/uploads/2018/11/EAR001-mCPR-v0.8.pdf
- https://www.lucas-cpr.com/files/7762374_101034-01%20Rev%20E%20LUCAS%203%20IFU%20EN_lowres.pdf
- https://www.nwairambulance.org.uk/our-people/our-crew/
- https://www.helihub.com/2024/10/15/north-west-air-ambulance-increases-blood-coverage/
- https://greatwesternairambulance.com/becoming-an-spcc/
- https://www.londonambulance.nhs.uk/calling-us/who-will-treat-you/advanced-paramedic-practitioners/
- https://www.nejm.org/doi/abs/10.1056/NEJMoa2407780
- https://www.ncbi.nlm.nih.gov/books/NBK579856/
- https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8605587/
- https://www.stemlynsblog.org/laa-resuscitative-thoracotomy/
- https://www.stemlynsblog.org/sub30study/
- https://www.paramedicpractice.com/content/features/paramedic-management-of-out-of-hospital-cardiac-arrest-secondary-to-hyperkalaemia
- https://aace.org.uk/clinical-practice-guidelines/
- https://simulaids.co.uk/insight/should-paramedics-still-be-intubating/
- https://pmc.ncbi.nlm.nih.gov/articles/PMC9364118/
- https://www.medicines.org.uk/emc/product/6344/smpc
- https://lms.resus.org.uk/modules/m10-v2-cardiac-arrest/10346/resources/chapter_14.pdf
- https://www.whatdotheyknow.com/request/communication_regarding_schiller
- https://www.whatdotheyknow.com/request/schiller_failure_to_shock
- https://learninghub.nhs.uk/resource/59775
- https://www.schiller.ch/en/products/defigard-touch-7-p46
- https://www.whatdotheyknow.com/request/clinical_vehicle_equipment_loadi
- https://www.whatdotheyknow.com/request/dca_and_frv_response_bags_2
- https://www.whatdotheyknow.com/request/ambulance_loading_list_9
- https://www.whatdotheyknow.com/request/london_air_ambulance_app_cc_kit
- https://www.whatdotheyknow.com/request/hart_vehicle_roles_and_equipment
- https://www.whatdotheyknow.com/request/medications_list
- https://www.whatdotheyknow.com/request/defibrillation_equipment_informa_4
- https://www.whatdotheyknow.com/request/defibrillation_equipment_informa_3
- https://www.whatdotheyknow.com/search/corpuls/all
- https://www.resus.org.uk/library/2025-resuscitation-guidelines/adult-advanced-life-support-guidelines
- https://www.resus.org.uk/library/2025-resuscitation-guidelines/post-resuscitation-care-guidelines
- https://www.resus.org.uk/library/quality-standards-cpr/acute-care-equipment-and-drug-lists
- https://www.secamb.nhs.uk/wp-content/uploads/2025/10/FOI-250216a-PPCI-Flowchart-v11.pdf
- https://www.hssib.org.uk/patient-safety-investigations/12-lead-electrocardiograms-in-ambulance-services/second-investigation-report/
- https://www.scas.nhs.uk/scas-becomes-first-ambulance-service-in-country-to-rollout-new-cpr-device/
- https://www.stryker.com/us/en/emergency-care/products/lucas-3.html
- https://www.paramedicpractice.com/content/features/sar-helicopter-paramedic-practice-etco2-measuring-to-assist-with-cpr-attempts
- https://www.intersurgical.com/info/igel
- https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9897230/
