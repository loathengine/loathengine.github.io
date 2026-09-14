# Ignition — the EPv5 Internal Ballistics Engine: Specification Manual

> **Scope.** This document is a complete, implementation-level specification of
> **Ignition**, the internal ballistics engine that ships in Empirical Precision v5. It is
> the solver that converts a cartridge / powder / bullet / barrel load into a
> **chamber-pressure history** and a **muzzle velocity**, and the calibration layer that
> turns the solver's raw physics into the number the app reports. It is written to be
> sufficient to re-create the engine from scratch: every formula, constant, unit and
> evaluation order below is taken from the shipping source.
>
> | Concern | Module | What it does |
> |---|---|---|
> | Fixed constants | `src/engine/constants.ts` | The model constants, none fitted per powder |
> | Input builder | `src/engine/prepare.ts` | Database records → `SimInput`. The only place units convert |
> | Calibration reader | `src/engine/tuning.ts` | `public/tuning-db.json` → per-powder physics and correction factors |
> | Solver | `src/engine/simulate.ts` | `SimInput` → raw pressure history and muzzle velocity, RK4 at 0.5 µs |
> | Composition | `src/engine/index.ts` | `simulateLoadWithFit()`: the four steps in order. The only import UI code makes |
>
> **All quantities inside the engine are SI.** Metres, kilograms, seconds, pascals,
> joules. Grains, inches, fps and PSI exist only at the UI boundary and in the source
> data; `prepare.ts` converts millimetres, grams and grams of water to SI once, and the
> UI converts the SI result back. Nothing imperial ever enters the solver.
>
> **Provenance.** Ignition was ported to TypeScript in August 2026 from a Rust reference
> implementation (`docs/WORKSTREAMS.md` WS3–WS7). The port reproduced the reference bit
> for bit on 399 loads. The reference has since been removed from the repository and the
> TypeScript has moved past it (breech pressure, WS21; direct impetus, WS20; the 32 MPa
> engraving default, WS84; the muzzle trace sample, WS137; the primer term, WS83). **This
> document describes the TypeScript, which is the engine.** Where a section cites a
> workstream, that entry holds the measurement behind the decision.

---

## 1. Architecture and invariants

### 1.1 What kind of model this is

Ignition is a **lumped-parameter (0-D) interior ballistics model** with a Lagrange
pressure gradient — the classic Serebryakov / IBHVG2-style energy balance:

- The propellant gas behind the bullet is treated as **Noble-Abel** with one uniform
  *mean* pressure `p`.
- The **Lagrange gradient** relates that mean to the pressure on the bullet base and at
  the breech: `p_base = p / (1 + C/3m)` and `p_breech = p_base · (1 + C/2m)`, with `C` the
  charge mass and `m` the bullet mass. The gas carries kinetic energy `C·v²/6`.
- Mean pressure comes from an **energy balance**, not a temperature equation:
  `p = [ f·z·C − (γ−1)·(KE_bullet + KE_gas + W_resistance + Q_wall) ] / V_gas`
  with `f` the propellant impetus (force constant, J/kg) and `z` the burned fraction.
- The charge burns by **Vieille's law** through a three-segment **form function**:
  `dz/dt = B · σ(z) · (p / p_ref)^n`.
- **Shot start** holds the bullet until base pressure clears a gate; resistance then
  decays exponentially from the engraving pressure to bore friction.
- **Heat loss** has two terms: one through the chamber wall driven by pressure alone, and
  one through the barrel wall that grows with swept surface and bullet velocity.

There is no temperature state, no separate gas energy equation, no primer mass, no
two-phase flow, no grain-geometry burn (the form function is a normalised surface
profile, not a geometric one). That smallness is deliberate: the model has few enough
terms that a hierarchical calibration over ~155,000 published loads can correct what it
does not resolve (§6).

### 1.2 The pipeline, in order

`simulateLoadWithFit(fit, args)` in `index.ts` is the only entry point the app calls.
It runs four steps and refuses at the first that fails:

1. **prepare** — `buildSimInput(args)` turns the records into a `SimInput` (§3). Refuses
   with a `PrepErrorCode` naming the missing field.
2. **tuning** — `applyPowderTune(fit, input, powderId)` installs the powder's fitted burn
   coefficient and impetus (§4.3). Refuses with `uncalibratedPowder` when the powder is
   not in the fit: an uncalibrated powder is not simulated, and guessing a burn
   coefficient would be a silent fallback.
3. **simulate** — `runSimulation(input)` integrates the shot (§5). Refuses with `squib`,
   `overpressure` or `noExit`.
4. **correct** — the raw muzzle velocity is multiplied by `velocityFactor(...)` and the raw
   breech peak by `pressureFactor(...)` (§4.4–4.5). The curve points carry the same two
   factors, so a plotted trace agrees with the headline number above it.

Step 4 is what "calibrated" means. Raw physics is roughly **four times worse** than the
calibrated model on held-out loads (`post_calibrate.ts` prints the current figure), so
nothing outside `src/engine/` calls `runSimulation` directly.

### 1.3 Invariants

1. **Pure.** `simulate.ts` does no I/O, no unit conversion and holds no defaults. It is a
   function of its `SimInput`. `prepare.ts` is the only module that converts units and the
   only one that applies a default, and each default it applies is part of the calibrated
   model (§3.6).
2. **Failure is typed, not thrown.** Every stage returns a discriminated union. A refusal
   `{ ok: false, stage, code, message }` is a working engine reporting bad data or
   unphysical inputs. The UI shows the message; it never substitutes a value.
3. **Two data sources, no overlap.** Component data comes from the database export
   (`master-db.json`), fitted parameters from `tuning-db.json`, and nothing in the app
   hard-codes either. No fitted parameter appears in a second place.
4. **The app does not calibrate.** `tuning-db.json` is produced offline by
   `test_harnes/tools/calibrate.ts` and consumed read-only. No fitting code ships.
5. **Match the fit, not the textbook.** Where the model uses a crude default — half the
   bullet length as bearing surface, half as ogive — the correction factors were fitted
   with that crudeness in place. Improving the input without refitting makes results
   worse (WS9). Changing any constant marked in §2 as a fit dependency invalidates the fit.
6. **Bit-exact regression.** A change to `src/engine/` is verified by snapshotting every
   calibration load before and after with `test_harnes/tools/engine_snapshot.ts` and
   comparing the files (`CLAUDE.md` §8). An inert refactor produces identical bytes.
7. **f64 association is preserved.** JS `number` and the reference's `f64` are both IEEE
   754 doubles, but `a·(b·c)` and `(a·b)·c` are different doubles. The solver keeps the
   grouping the reference used wherever a refactor could have changed it (§5.3).

---

## 2. Constants (`constants.ts`)

Nothing in this table is fitted per powder. Constants marked **fit** are the values
`tuning-db.json` was fitted under; changing one invalidates the fit.

| Symbol | Value | Unit | Meaning | Fit |
|---|---|---|---|---|
| `GAMMA` (γ) | 1.25 | — | Ratio of specific heats of the propellant gas | fit |
| `P_REF` | 100 × 10⁶ | Pa | Reference pressure of the burn-rate law | fit |
| `P_FRICTION` | 3.0 × 10⁶ | Pa | Bore friction pressure after engraving, at the reference bearing length | fit |
| `X_ENGRAVE` | 0.005 | m | Decay length of the engraving resistance | fit |
| `Z_IGNITION` | 0.004 | — | Burned fraction at t = 0 (primer ignition) | fit |
| `H_LOSS` | 25.0 | — | Barrel-wall heat-loss coefficient: `dQ = H_LOSS · S · √p · v · dt` | fit |
| `H_CHAMBER` | 0.20 | — | Chamber-wall heat-loss coefficient: `dQ = H_CHAMBER · S_chamber · p · dt` | fit |
| `COVOLUME` | 1.0 × 10⁻³ | m³/kg | Noble-Abel covolume of the gas | fit |
| `NECK_PA` | 6.0 × 10⁶ | Pa | Neck-tension / pre-engraving resistance while traversing freebore | fit |
| `BEARING_REF` | 0.010 | m | Bearing-surface length at which bore friction equals `P_FRICTION` | fit |
| `IGN_BALL` | 1.0 | — | Ignitability-deficit coefficient, ball powders | fit |
| `IGN_MULTI_PERF` | 0.5 | — | …extruded multi-perforation | fit |
| `IGN_EXTRUDED` | 0.5 | — | …extruded single-perforation and anything else | fit |
| `DT` | 0.5 × 10⁻⁶ | s | RK4 step | fit |
| `MAX_T` | 8.0 × 10⁻³ | s | Time cap; a bullet still in the bore is reported `noExit` | — |
| `BLOWUP_PRESSURE_PA` | 3.0 × 10⁹ | Pa | Peak above which the run is abandoned as `overpressure` | — |
| `PRIMER_E_REF_J` | 12.15 | J | Primer brisance at which a load sits exactly where the fit put it | fit |
| `PRIMER_IGNITION_GAIN` | 1.0 | — | Exponent on the brisance ratio | — |
| `PRIMER_IGN_SCALE_MIN/MAX` | 0.25 / 3.0 | — | Clamp on the primer scale | — |

Two helpers live with the constants:

- `clamp(v, lo, hi) = min(max(v, lo), hi)`.
- `ignitionDeficitFor(grainType)` returns `IGN_BALL` for `'ball'`, `IGN_MULTI_PERF` for
  `'extrudedMultiPerf'`, `IGN_EXTRUDED` otherwise.
- `primerIgnitionScale(E)` returns exactly `1.0` when `E` is absent or non-positive,
  otherwise `clamp((PRIMER_E_REF_J / E)^PRIMER_IGNITION_GAIN, 0.25, 3.0)`. The reference
  energy is **not** the corpus mean primer (14.264 J): because the velocity response to
  ignition quality is asymmetric about the reference, anchoring at the mean drifts the
  load-weighted mean velocity by −1.85 fps. 12.15 J is the value at which that drift
  crosses zero (WS83). The primer sensitivity is a modelled direction, not a measured
  magnitude — the corpus cannot separate a primer effect from a publisher effect (WS81).

---

## 3. Inputs (`prepare.ts`)

### 3.1 `SimInput` — what the solver consumes

| Field | Unit | Meaning |
|---|---|---|
| `boreArea` | m² | Effective bore area: mean of the land and groove circle areas |
| `chamberVol` | m³ | Free chamber volume behind the seated bullet, before powder displacement |
| `travel` | m | Bullet travel from seated position to base exit |
| `boreDia` | m | Bore (land) diameter, for the barrel heat-loss surface |
| `charge` | kg | Powder charge mass `C` |
| `bulletMass` | kg | Bullet mass `m` |
| `solidRho` | kg/m³ | Solid propellant density |
| `impetus` | J/kg | Propellant impetus `f`. Seeded by `prepare`, **replaced by the fitted value** in `applyPowderTune` |
| `burnExp` | — | Burn exponent `n` |
| `form` | — | `{ zPeak, gain, zSliver }`, the form function (§5.2) |
| `pStart` | Pa | Shot-start (engraving) pressure |
| `chamberArea` | m² | Gas-wetted chamber surface: case wall + breech face |
| `frictionScale` | — | Bore-friction multiplier from bearing-surface length |
| `jump` | m | Freebore jump before the full-diameter section reaches the lands |
| `bulkRho` | kg/m³ | Powder bulk (loading) density, for the fill fraction |
| `ignA` | — | Ignitability-deficit coefficient, already scaled by the primer |
| `burnCoeff` | 1/s at `P_REF` | Burn coefficient `B`. Written `0` by `prepare`, **filled by `applyPowderTune`** |

### 3.2 What `buildSimInput` takes

`PrepArgs`: a `cartridge`, a `powder`, a `bullet` (each with its database `id`), the
`chargeGrams`, and optionally `coalMm`, `barrelLengthMm`, `caseCapacityH2oGrams` (the
specific brass), `freeboreMm` (the specific barrel) and `primerBrisanceEnergyJ`.

The cartridge's `bulletDiameterMm` and `boreDiameterMm` are **resolved** values, not
record fields: the bore belongs to the calibre, so they come from the `diameters` table
through `cartridge.diameterId` via `resolveDiameters()`. The rounded copies cartridges
used to carry disagreed with their own diameter record in every one of 126 cases (WS34).

### 3.3 Required data and refusal codes

Checked in this order; the first failure is returned with a message naming the record and
field.

| Code | Condition |
|---|---|
| `missingCapacity` | neither `caseCapacityH2oGrams` nor `cartridge.baseCapacityH2oGrams` > 0 |
| `missingBulletDiameter` | resolved groove diameter absent or ≤ 0 |
| `missingBoreDiameter` | resolved land diameter absent or ≤ 0 |
| `missingCaseLength` | neither `trimLengthMm` nor `maxCaseLengthMm` > 0 |
| `missingBulletWeight` | `bullet.weightGrams` absent or ≤ 0 |
| `missingBulletLength` | `bullet.overallLengthMm` absent or ≤ 0 |
| `missingPowderDensity` | `propellantDensityKgM3` absent or ≤ 0 |
| `missingPowderBulkDensity` | `bulkDensityKgM3` absent or ≤ 0 |
| `missingPowderEnergy` | `heatOfExplosionKjKg` absent or ≤ 0 (still required: it seeds the fit's optimiser) |
| `missingBarrelLength` | `barrelLengthMm` absent or ≤ 0 |
| `missingCoal` | no `coalMm` > 5 mm and no `cartridge.oalMm`. A COAL of 5 mm or under is treated as absent data, not a measurement |
| `noChamberVolume` | usable volume ≤ 10⁻⁸ m³ after seating |
| `noTravel` | travel < 0.05 m |
| `noCharge` | charge ≤ 0 |
| `chargeExceedsCase` | `charge / solidRho > chamberVol` — cannot fit even at solid density |

### 3.4 Unit conversions (this module only)

- `MM_TO_M = 10⁻³`; grams → kg is `× 10⁻³`.
- Grams of water → m³: `H2O_G_TO_M3 = 10⁻⁶ / 0.9982` (water at ~20 °C). Exported so the
  Ignition page can display usable capacity in the entered unit without a second copy of
  the density.
- Precedence: `capacityGrams = caseCapacityH2oGrams || cartridge.baseCapacityH2oGrams`;
  `caseLengthMm = trimLengthMm || maxCaseLengthMm`; `coalMm = (coalMm > 5) ? coalMm :
  cartridge.oalMm`; `freeboreMm = args.freeboreMm ?? cartridge.freeboreLengthMm ?? 0`.

### 3.5 Geometry, in evaluation order

With `d_g` the groove diameter and `d_b` the bore diameter in metres, `L_case` the case
length, `L_bul` the bullet overall length and `COAL` in millimetres:

1. **Bore area.** `boreArea = (π/4) · ½ · (d_g² + d_b²)`.
2. **Seating depth** [mm]. `seat = clamp(L_bul − (COAL − L_case), 0, L_bul)` — how far the
   bullet intrudes into the case.
3. **Usable case volume** (`usableCaseVolumeM3`).
   `chamberVol = capacity_g · H2O_G_TO_M3 − seat·10⁻³ · (π/4) · d_g²`
   — the water capacity less a cylinder of the seating depth at groove diameter. This is
   the one formula for it; the Ignition page judges loading density by the same number so
   its warnings key on what the fit keyed on (WS201).
4. **Travel.** `travel = (barrel − COAL + L_bul) · 10⁻³`. The bullet base starts
   `COAL − L_bul` from the bolt face and the barrel is measured bolt face → muzzle.
5. **Charge.** `charge = chargeGrams · 10⁻³`.
6. **Body diameter.** `cartridge.bodyDiameterMm` if > 0, else `1.35 · d_g`
   (`BODY_DIAMETER_RATIO`).
7. **Chamber area** (`chamberArea`). The free volume treated as a cylinder of the body
   diameter `d`, side wall plus breech face:
   `chamberArea = 4·chamberVol / d + (π/4)·d²`, or `0` if either input is ≤ 0. It shrinks
   as the bullet seats deeper — less gas, less wetted wall.
8. **Friction scale** (`frictionScale`).
   `bearing = (bearingSurfaceMm ?? 0.5 · L_bul) · 10⁻³`;
   `frictionScale = clamp(bearing / BEARING_REF, 0.3, 2.5)`.
9. **Jump** (`jumpMetres`). `ogive = ogiveLengthMm ?? 0.5 · L_bul`; the lands sit at
   `L_case + freebore`; the full-diameter section starts at `COAL − ogive`;
   `jump = clamp((lands − (COAL − ogive)) · 10⁻³, 0, 0.012)`. Seated into the lands
   clamps to 0.
10. **Form function.**
    `zPeak = clamp(burnFractionAtSurfacePeak ?? 0.5, 0.05, 0.95)`,
    `gain = max(burnSurfacePeakGain ?? 0.3, 0)`,
    `zSliver = clamp(burnFractionAtSliverStart ?? 0.9, 0.5, 0.999)`.
11. **Burn exponent.** `burnExp = burnExponent ?? 0.55`.
12. **Shot-start pressure.** `pStart = engravingPressurePa` if > 0, else `32 × 10⁶` Pa
    (§3.6).
13. **Impetus seed.** `impetus = (γ − 1) · heatOfExplosionKjKg · 10³`. A seed only:
    `applyPowderTune` overwrites it with the fitted value, and `calibrate.ts` starts its
    optimiser here (WS20).
14. **Ignition deficit.** `ignA = ignitionDeficitFor(grainType) ·
    primerIgnitionScale(primerBrisanceEnergyJ)`. An unknown primer multiplies by exactly 1.
15. **Derived, for callers.**
    `fillFraction = charge / max(chamberVol · bulkRho, 10⁻¹²)` (`loadingDensity`), the
    loading density the correction factors key on;
    `bulletBaseOffsetMm = COAL − L_bul`, the bolt-face → bullet-base distance the UI's
    travel axis is offset by (WS137).

`chargeKgAtLoadingDensity(fill, vol, bulkRho) = fill · vol · bulkRho` is the inverse of
`loadingDensity`, for sweeps that walk fill rather than charge.

### 3.6 Defaults that are part of the model

These mirror the reference's `unwrap_or(…)` fallbacks and the fit was calibrated with
them in place. They are not app conveniences; do not improve one without a refit.

| Absent field | Default | Note |
|---|---|---|
| `burnExponent` | 0.55 | |
| `burnFractionAtSurfacePeak` | 0.5 | |
| `burnSurfacePeakGain` | 0.3 | |
| `burnFractionAtSliverStart` | 0.9 | |
| `engravingPressurePa` | 32 MPa | Two thirds of the library carried a literal 32e6 when the fit was made; the default and the value the fit saw must be the same number (WS84) |
| `bearingSurfaceMm` | ½ bullet length | WS9: a better estimator was rejected on these grounds |
| `ogiveLengthMm` | ½ bullet length | as above |
| `bodyDiameterMm` | 1.35 × groove diameter | |
| `coalMm` | cartridge nominal OAL | |
| `freeboreMm` | cartridge freebore, else 0 | |
| `primerBrisanceEnergyJ` | scale = 1 | the whole calibration corpus runs this way |

---

## 4. Calibration application (`tuning.ts`)

### 4.1 The fit file

`public/tuning-db.json` (~965 KB) is a static asset fetched once per session and cached
as a shared promise; a failed fetch clears the cache so the next call retries. Field names
are snake_case because they are the on-disk form. **Every field is required**: a fit
lacking one predates the field and nothing tolerates it (no-compat policy).

| Key | Shape | Meaning |
|---|---|---|
| `generated_at`, `generated_by` | string | ISO stamp written by `calibrate.ts`. Saved velocity offsets record it and go stale when it changes (WS19) |
| `source_loads`, `source_load_count`, `source_corpus_count` | | Provenance: what the fit trained on |
| `holdout_fraction`, `holdout_by` | | 0 / `'load'` for a deployed fit |
| `gen_weight`, `gen_drop` | | How much the powder stage was scored on the prediction an unseen pairing gets (WS153) |
| `rounds_run` | int | |
| `powders[id]` | `{ burn_coeff, impetus, fill_slope, bore_slope, train_count, train_mape }` | Per-powder physics (§4.2) |
| `cartridges[id]` | `{ v_factor, p_scale }` | Per-cartridge velocity and pressure factors |
| `pairs["CTG|PWD"]` | number | Per-(cartridge, powder) velocity factor |
| `pair_slopes["CTG|PWD"]` | number | Per-pair charge response `d(ln v)/d(fill − FILL_REF)` |
| `bullets_v[id]` | number | Per-bullet velocity factor |
| `cart_bullet["CTG|BUL"]` | number | Per-(cartridge, bullet) velocity factor |
| `press_ramp` | number | Global `d(ln p_peak)/d(fill − FILL_REF)` |
| `powder_press[id]` | number | Per-powder peak-pressure factor |
| `bullets[id]` | number | Per-bullet peak-pressure factor |
| `press_pairs["CTG|PWD"]` | number | Per-pair peak-pressure factor |
| `press_powder_slopes[id]` | number | Per-powder pressure response to fill, the prior a thin pair falls back to |
| `press_pair_slopes["CTG|PWD"]` | number | Per-pair pressure response to fill, on top of `press_ramp` |

Pair keys are `pairKey(a, b) = "A_ID|B_ID"`. Reference points: `FILL_REF = 0.90`
(loading density), `BORE_REF_MM = 7.0`.

### 4.2 Effective burn coefficient

```
effectiveBurnCoeff(pt, fill, boreMm)
  = pt.burn_coeff · clamp(1 + pt.fill_slope·(fill − 0.90) + pt.bore_slope·(boreMm − 7.0), 0.25, 4.0)
```

One definition, used by the app and imported by `calibrate.ts`, so the model that fits
the parameters cannot drift from the one that applies them. The fitted `fill_slope` is a
median of essentially zero across the powders; WS152 records why it stays that way.

### 4.3 `applyPowderTune(fit, input, powderId, baseBurnCoeffOverride?)`

Returns `null` if `fit.powders[powderId]` is absent. Otherwise returns a copy of the
input with:

- `burnCoeff = effectiveBurnCoeff(pt, fillFraction(input), input.boreDia · 10³)`, where
  `fillFraction(input) = charge / max(chamberVol · bulkRho, 10⁻¹²)`;
- `impetus = pt.impetus`.

A UI what-if override replaces `burn_coeff` **before** the slopes apply, so it behaves
like a refitted powder rather than a coefficient injected past the model.

### 4.4 Velocity factor

```
velocityFactor(fit, ids, fill)
  = cartridges[ctg].v_factor
  · pairs[ctg|pwd]
  · exp( pair_slopes[ctg|pwd] · (fill − 0.90) )
  · bullets_v[bul]
  · cart_bullet[ctg|bul]
```

Every missing entry is `1.0` and a missing slope is `0.0` — **flat for a pair the fit never
saw**, deliberately. WS147 tried falling back to the powder's pooled charge response and
measured it: pairs with 4–9 training loads improved, pairs with none went from 4.07% to
6.58% held-out error. The pooled slope is a good shrinkage prior inside `calibrate.ts` and
a bad thing to hand a pair that has no estimate. There is no sectional-density term
either: the light-for-calibre bias is real in the raw physics but the cartridge and pair
factors already remove it, and a global term on top double-corrects (WS149).

### 4.5 Pressure factor

```
pressureFactor(fit, ids, fill)
  = cartridges[ctg].p_scale
  · powder_press[pwd]
  · bullets[bul]
  · press_pairs[ctg|pwd]
  · exp( (press_ramp + slope) · (fill − 0.90) )
where slope = press_pair_slopes[ctg|pwd] ?? press_powder_slopes[pwd] ?? 0
```

Pair, then powder, then nothing. A pair with too few measured-pressure loads used to fall
straight to `press_ramp` alone, and that cliff was the largest single term in pressure
error (WS133). Peak pressure is far more sensitive to burn rate than muzzle velocity is,
which is why a per-powder pressure factor exists at all.

---

## 5. The solver (`simulate.ts`)

### 5.1 State and loop invariants

The state vector is `(z, x, v, E_lost)`: burned fraction, travel [m], velocity [m/s] and
cumulative energy lost to resistance work and heat [J]. Initial conditions:
`z = Z_IGNITION = 0.004`, `x = v = E_lost = 0`, `t = 0`, `moving = false`.

These are computed once per run (they are pure functions of the input; the reference
recomputed them inside the derivative function, and hoisting is bit-identical):

| Name | Expression |
|---|---|
| `lagrangeDivisor` | `1 + C / (3m)` |
| `breechRatio` | `(1 + C/(2m)) / lagrangeDivisor` — `p_breech / p_mean` |
| `chamberLossCoeff` | `H_CHAMBER · chamberArea` |
| `boreFrictionPa` | `P_FRICTION · frictionScale` |
| `wallSurfaceCoeff` | `π · boreDia`, so swept barrel surface is this × `x` |
| `jumpResistancePa` | `max(NECK_PA, boreFrictionPa)` |
| `startGate` | `jumpResistancePa` if `jump > 10⁻⁵` m, else `pStart` |
| `formPeak` | `1 + gain` |
| `formSliverSpan` | `max(1 − zSliver, 10⁻⁶)` |
| `ignFactor` | `1` if `ignA ≤ 0`; else with `fill = C / max(chamberVol · bulkRho, 10⁻¹²)` and `deficit = max(1 − fill, 0)`: `clamp(1 − ignA · deficit², 0.15, 1)` |
| `effectiveBurnCoeff` | `burnCoeff · ignFactor` |

The ignition factor is what a part-empty case costs: burn rate is scaled down by the
square of the empty fraction, more for ball powders, and a hot primer reduces `ignA`
(§2). It vanishes as fill → 1, which is the right physics — a full case has no ignition
deficit to fix.

### 5.2 Form function σ(z)

Normalised so σ(0) = 1. Rises linearly to `1 + gain` at `zPeak`, holds, then falls
linearly to 0 at z = 1 once the grain fractures into slivers at `zSliver`:

```
σ(z) = 1 + gain · z / zPeak                     z < zPeak
     = 1 + gain                                 zPeak ≤ z < zSliver
     = (1 + gain) · (1 − z) / max(1 − zSliver, 1e-6)   z ≥ zSliver
```

It is inlined in the derivative function: that function runs four times per step for up
to 16,000 steps and the call indirection measurably cost multi-thread throughput.

### 5.3 Mean pressure — the equation of state

`pressure(z, x, v, E_lost)`, with `z` first clamped to at most 1:

```
E     = f · z · C − (γ − 1) · ( ½·m·v²  +  C·v²/6  +  E_lost )
V_gas = chamberVol + boreArea·x − (1 − z)·C / solidRho − z·C·COVOLUME
p     = max( E / max(V_gas, 1e-9), 0 )
```

`f` is the fitted impetus. The gas volume subtracts the unburned solid at propellant
density and the burned gas's covolume. Fitting `f` directly rather than as a multiplier on
the heat of explosion is WS20: with γ fixed for every powder the multiplier ended up
reconstructing the impetus from scratch and pinning the highest-energy powders at a
bound.

### 5.4 Derivatives

`derivs(z, x, v, p, moving) → (dz, dx, dv, dLoss)`, evaluated at the state and the mean
pressure the caller already computed there:

```
dz    = effectiveBurnCoeff · σ(z) · (p / P_REF)^n        if z < 1, else 0
qCham = chamberLossCoeff · p                              (runs whether or not the bullet moves)

not moving:  dx = 0,  dv = 0,  dLoss = qCham

moving:
  pRes  = jumpResistancePa                                          x < jump
        = boreFrictionPa + (pStart − boreFrictionPa) · exp(−(x − jump)/X_ENGRAVE)   otherwise
  dx    = v
  dv    = max( boreArea · (p / lagrangeDivisor − pRes) / m , 0 )
  dLoss = boreArea·pRes·v  +  H_LOSS · (wallSurfaceCoeff·x) · √p · v  +  qCham
```

The barrel heat-loss term is grouped exactly as `H_LOSS · (π·d·x) · √p · v` to keep the
float association identical to the reference. `dv` is floored at zero: the bullet never
reverses. The four derivative records are allocated once per run and written in place —
allocating per call made the solver garbage-collection bound and cost 7.5× throughput
across 30 workers (WS17).

### 5.5 Shot start

At the top of each step, if the bullet is not moving:

- if `p / lagrangeDivisor ≥ startGate`, it starts;
- else if `z ≥ 1`, the run fails as **`squib`** — the charge burned out before the bullet
  moved.

With freebore the gate is the jump resistance (neck tension or bore friction, whichever
is larger); seated at the lands it is the full engraving pressure.

### 5.6 The integration step (classic RK4, fixed `DT`)

```
p   = pressure(z, x, v, E)            ; peak = max(peak, p)
k1  = derivs(z, x, v, p, moving)
s2  = state + (DT/2)·k1 ; k2 = derivs(s2, pressure(s2), moving)
s3  = state + (DT/2)·k2 ; k3 = derivs(s3, pressure(s3), moving)
s4  = state +  DT   ·k3 ; k4 = derivs(s4, pressure(s4), moving)
state += (DT/6) · (k1 + 2k2 + 2k3 + k4)     ; z = min(z, 1)
t   += DT
```

`moving` is decided once per step before `k1` and held through the four evaluations.
`pressure` is evaluated once at the step's start and passed into `k1`, so the same state
is not costed twice.

After the update:

- **Burnout.** The first step at which `z ≥ 1` records `burnoutTravel = x`. It is
  reported only if it lies within `travel`.
- **Travel samples.** While `x ≥ nextTravelSample ≤ travel`, a point is linearly
  interpolated between the previous and current step at exactly that travel (`frac =
  (sample − x_prev)/(x − x_prev)`, velocity and time interpolated, pressure re-evaluated at
  the interpolated state) and the grid advances by the spacing. The grid can be shifted by
  an offset so samples land at whole units of *barrel position* rather than of travel
  (WS137): the first sample is `(⌊offset/spacing⌋ + 1)·spacing − offset`.
- **Exit.** When `x ≥ travel`, velocity and time are interpolated to the exact crossing
  the same way; an exit point `{t, x = travel, v, p(z, travel, v, E), z}` is appended to the
  time trace and to the travel samples (overwriting a last sample within 10⁻⁶ m of the
  muzzle rather than appending a duplicate). The run returns success.
- **Overpressure.** If `peak > BLOWUP_PRESSURE_PA` the run fails as **`overpressure`**.

If `t` reaches `MAX_T` first the run fails as **`noExit`**.

### 5.7 Time trace

With `trace: true` one point is recorded every `TRACE_STRIDE = 20` steps (10 µs) at the
top of the step, plus the interpolated exit point. Both traces therefore end *at* the
muzzle; the stride alone would leave the last sample up to 8 mm short at rifle speeds,
which plotted as a curve stopping before the end of the barrel (WS137).

### 5.8 Raw outputs (`SimSuccess`)

| Field | Meaning |
|---|---|
| `muzzleVelocity` | m/s, interpolated at base exit, before correction |
| `peakPressure` | **breech** pressure, `peak_mean · breechRatio`, before correction |
| `zAtExit` | burned fraction at exit |
| `exitTime` | s |
| `burnoutTravel` | m, or `null` if the charge was still burning at exit |
| `trace`, `travelSamples` | `{t, x, v, p, z}` points, empty unless requested |

**Why breech pressure.** A SAAMI conformal or piezo transducer ports into the case wall
near the breech, not at the spatial mean of the gas column. Reporting the mean left a
−4.82% bias that trended from −2.0% to −7.0% across charge/bullet mass ratio — and since
`C/m` varies inside every cartridge and powder group, no per-group factor could absorb
it. Breech pressure is unbiased (+0.75%) and flat across the same range, measured over
19,381 loads with transducer readings (WS21).

---

## 6. Outputs the app sees (`index.ts`)

`SimulateLoadSuccess`:

| Field | Unit | Derivation |
|---|---|---|
| `muzzleVelocityMps` | m/s | `sim.muzzleVelocity · velocityFactor` |
| `peakPressurePa` | Pa | `sim.peakPressure · pressureFactor` — breech, corrected; compare this to a published limit |
| `burnedPct` | % | `sim.zAtExit · 100` |
| `timeToExitMs` | ms | `sim.exitTime · 10³` |
| `burnoutPositionMm` | mm or null | `sim.burnoutTravel · 10³` |
| `curve`, `travelSamples` | | each point: `travelMm = x·10³`, `timeMs = t·10³`, `pressurePa = p · pressureFactor`, `velocityMps = v · velocityFactor`, `burnedPct = z·100` |
| `derived` | | `{ fillFraction, bulletBaseOffsetMm }` from `prepare` |

The result deliberately does **not** carry the raw-physics figures or the factors that
produced the difference. It did, and the Ignition page printed them under a "calibration
correction" heading; they were removed (WS155) because a report of how much a prediction
was adjusted invites the reader to weigh the parts against each other, which is not a
judgement the numbers support.

`SimulateLoadArgs` extends `PrepArgs` with `trace`, `travelSampleSpacingM`,
`travelSamplesByBarrelPosition` (passes `derived.bulletBaseOffsetMm` as the sampling
offset) and `burnCoeffOverride`. `simulateLoad(args)` is the async wrapper that fetches
the fit first; `simulateLoadWithFit(fit, args)` is synchronous for sweeps.

The UI converts at its boundary: Pa → PSI, m/s → fps, mm → in, and derives bullet spin
from muzzle velocity and twist (`rpm = v_fps · 720 / twist_in`) for display only.

---

## 7. Calibration, offline (`test_harnes/tools/calibrate.ts`)

The app never runs this. It is here so the fit file's contents are explicable.

**Data.** `v_calibration_load`: published loads that `verify.py` found sound *and*
simulable (a load rejected for calibration because the engine lacks a property it needs
can still be in the library). Each record carries an observed muzzle velocity and, where
the publisher measured it, an observed peak pressure. A ladder's top charge without a
measurement is used as an **inferred** pressure anchor at `0.969 ×` the SAAMI ceiling
(the empirical median over 9,650 measured maximum loads), weighted `0.25` against a
measurement by inverse variance.

**Method.** Coordinate descent, every stage refitted against the others' residual so the
levels partition the error rather than triple-count it:

1. *seed* — per-powder `(B, impetus)` by coarse log-grid then Nelder–Mead, on a
   320-load subsample chosen by FNV-1a hash of the load id (deterministic, worker-count
   independent).
2. *round × N* — per-powder `(fill_slope, bore_slope)` then `(B, impetus)` again; then the
   velocity hierarchy cartridge → pair → bullet → cartridge-bullet → per-pair charge slope.
3. *pressure* — global fill ramp, then cartridge / powder / pair / bullet factors and a
   per-pair ramp deviation, same cycle.

**Shrinkage.** A group of `n` loads keeps `n/(n+k)` of its fitted offset. Defaults:
`k_vel = 25`, `k_pair = 1`, `k_bullet = 5`, `k_press = 8`, `k_pairSlope = 5`,
`k_cartBullet = 2`. A cartridge with 12 loads keeps a third of its apparent offset; one
with 2,000 keeps ~99%. `--sweep-k` re-checks them against the current corpus. Gates:
`MIN_TRAIN = 8` loads to calibrate a powder at all, `MIN_SLOPE_N = 40` before its slopes
are identifiable.

**Scale.** ~13.7k parameters, ~42M engine runs, ~15 minutes on 16 worker threads.
Throughput falls past physical cores because SMT siblings contend for the same FPUs.

**Evaluation.** `post_calibrate.ts` is the one post-fit evaluation: section A splits
residual error into load-data noise, physical-data error and model error; section B
stratifies held-out error by training-group size, and is the only measurement that can
see a model-structure change. In-sample error cannot judge one — the factors re-absorb
the difference (WS22). A new evaluation goes inside that file as another section.

---

## 8. What the model does not have

Absent by design, and each is why a particular factor exists:

| Not modelled | Consequence |
|---|---|
| Ambient temperature | No term. The app's velocity offset per firearm is where a shooter's own conditions enter |
| Measured primer effect | Direction modelled (§2), magnitude a display choice; the corpus cannot identify it |
| Grain geometry | The form function is a normalised surface profile with three fitted-by-data breakpoints |
| Bullet construction | Bearing surface, ogive and engraving pressure are inputs with defaults; the per-bullet factors absorb the rest |
| Bore condition, wear, fouling | Per-cartridge and per-pair factors carry the population average |
| Quench, flash-hole, two-phase effects | No term; the concept does not exist in this model (WS10) |

---

## Appendix A — Symbols

| Symbol | Source | Meaning |
|---|---|---|
| `C` | `charge` | charge mass, kg |
| `m` | `bulletMass` | bullet mass, kg |
| `f` | `impetus` | propellant impetus, J/kg (fitted) |
| `B` | `burnCoeff` | burn coefficient, 1/s at `P_REF` (fitted, then fill/bore/ignition scaled) |
| `n` | `burnExp` | burn exponent |
| `z` | state | burned mass fraction |
| `x`, `v` | state | travel, velocity |
| `E_lost` | state | resistance work + heat, J |
| `p` | derived | mean chamber pressure, Pa |
| `σ(z)` | form | relative burning surface |
| `V_gas` | derived | free gas volume, m³ |
| `fill` | derived | loading density, charge over usable volume at bulk density |

## Appendix B — One step, in the order the code evaluates it

1. `p = pressure(z, x, v, E)`; update `peak`.
2. If tracing and `step % 20 == 0`, record `{t, x, v, p, z}`.
3. If not moving: start if `p / lagrangeDivisor ≥ startGate`; else if `z ≥ 1` → `squib`.
4. Save `x_prev`, `v_prev`, `t_prev`.
5. `k1..k4` as in §5.6, each `k` from `derivs` at a state whose pressure is evaluated by
   the caller.
6. Advance the state; clamp `z ≤ 1`; `t += DT`.
7. Record burnout on the first `z ≥ 1`.
8. Emit any travel samples crossed this step.
9. If `x ≥ travel`: interpolate the exit, append the exit point, return success with
   `peakPressure = peak · breechRatio`.
10. If `peak > 3 GPa` → `overpressure`.
11. If `t ≥ MAX_T` → `noExit`.
