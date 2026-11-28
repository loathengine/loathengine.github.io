# Anaflexi: the Internal Ballistics Engine

This document explains the code of the Anaflexi engine and the physics each part of it
computes. Every function and variable it names in `code` is a name in the engine's code, and the
sections follow the order in which `simulateLoadWithCalibration` calls the functions.

**Units.** Everything inside the engine is SI: metres, kilograms, seconds, pascals, joules.
Every physical quantity carries its unit as a suffix (`Kg`, `M`, `M2`, `M3`, `Pa`, `S`, `Mps`,
`Mps2`, `JPerKg`, `KgPerM3`, `W`); a name without one is a fraction, a ratio or a count. The
inputs arrive in millimetres, grams and grams of water, and `buildSimInput` converts them once.

**Calibration.** Every entry point takes a `calibration` argument. Its `model` member holds all
92 fixed constants of the model (§2, §3.2, §3.5, §9); its other members hold per-component
parameters and `unfitted_cartridge_spread`, each named below where the code reads it. The engine
holds no model values of its own.

---

## 1. The model

### 1.1 The physics

A lumped-parameter (0-D) interior ballistics model with a Lagrange pressure gradient, the
classic Serebryakov / IBHVG2-style energy balance:

- The propellant gas behind the bullet is treated as **Noble-Abel** with one uniform *mean*
  pressure `p`.
- The **Lagrange gradient** relates that mean to the pressure on the bullet base and at the
  breech: `p_base = p / (1 + C/3m)` and `p_breech = p_base · (1 + C/2m)`, with `C` the charge
  mass and `m` the bullet mass. The gas carries kinetic energy `C·v²/6`.
- Mean pressure comes from an **energy balance**:
  `p = [ f_eff·z·C − (γ−1)·(KE_bullet + KE_gas + W_resistance + Q_barrel) ] / V_gas`,
  with `f_eff` the effective propellant impetus (force constant, J/kg) and `z` the burned fraction.
- The charge burns by **Vieille's law** through a dynamic three-segment **form function** with
  a power-law sliver tail and optional high-pressure damping:
  `dz/dt = B' · σ(z) · (p / p_ref)^n · d_p(p)`.
- **Shot start** holds the bullet until base pressure clears a gate. After freebore jump,
  resistance decays exponentially from the engraving pressure to velocity-dependent (Stribeck)
  bore friction.
- **Heat loss** goes through the swept barrel wall and scales with `√p` and a velocity-saturated
  convective term.
- The raw muzzle velocity and breech peak are then multiplied by velocity and pressure
  **correction factors** from the calibration.

### 1.2 The call path

`simulateLoadWithCalibration(calibration, args)` runs five stages and stops at the first that
refuses. A refusal is a value, `{ ok: false, stage, code, message }`, never an exception.

| # | Stage | Code | `stage` | `code` on refusal |
|---|---|---|---|---|
| 1 | Prepare | `buildSimInput(args, model)` (§3) | `"prepare"` | one per missing or unusable field |
| 2 | Regime | the two `fillFraction` tests (§4) | `"regime"` | `"outsideCalibratedRegime"` |
| 3 | Tune | `applyPowderCalibration` (§5) | `"tuning"` | `"uncalibratedPowder"` |
| 4 | Simulate | `runSimulation(input, model, options)` (§6) | `"simulate"` | `"squib"`, `"overpressure"`, `"noExit"` |
| 5 | Correct | `velocityFactor`, `pressureFactor` (§7) | — | — |

Component parameters are looked up via `calibrationId(record) = record.derivedFrom ?? record.id`,
so a user's copy of a library component inherits the original's fitted parameters.
`simulateLoadEnsemble` (§9) runs the same path under perturbed inputs.

### 1.3 Properties of the code

1. **Pure.** Apart from `loadCalibration(expectedEngineFingerprint?)`, which fetches the
   calibration data once (in the web app, from `https://db.empiricalprecision.com/api/v1/calibration`)
   and verifies `assertModelConstants`, `assertUnfittedCartridgeSpread`,
   and (when provided) `engine_fingerprint`, the engine does no I/O. `runSimulation` does no
   unit conversion and applies no defaults; `buildSimInput` is the only place either happens.
2. **Malformed calibration data throws.** `assertModelConstants` throws `CalibrationVersionError`
   on a missing, non-finite, or unknown constant and `Error` on an out-of-domain constant;
   `loadCalibration` throws `CalibrationVersionError` on a missing `unfitted_cartridge_spread`
   or mismatched `engine_fingerprint`; `applyPowderCalibration` throws on a missing burn-surface
   profile or an invalid (`<= 0` or non-finite) `baseBurnRateCoefficientOverride` (`RangeError`).
   Every other failure is a refusal value.
3. **Fixed float association.** `a·(b·c)` and `(a·b)·c` are different IEEE 754 doubles. Every
   expression keeps one grouping, so the same input gives the same bits on every run.
4. **A flat integration loop.** `runSimulation`'s loop holds no closure, no object allocation and
   no call other than `Math` functions, so its values stay in registers.

---

## 2. Constants

All 92 fixed constants arrive in `calibration.model`. Physics, progressivity, ignition,
integration and fit-application constants are listed below; defaults, profile bounds, refusal
thresholds and ensemble constants are listed in the sections that use them (§3.2, §3.5, §9).

### 2.1 Core physics, seating voids, friction, heat loss, damping and impetus

| Symbol | `model` key | Unit | Meaning |
|---|---|---|---|
| γ | `specific_heat_ratio` | — | Ratio of specific heats of the propellant gas |
| `p_ref` | `reference_pressure_pa` | Pa | Reference pressure of the burn-rate law |
| `n` | `burn_exponent` | — | Pressure exponent of the burn-rate law, one value for every powder |
| `p_fric` | `bore_friction_pressure_pa` | Pa | Baseline bore friction at the reference bearing length |
| `x_eng` | `engraving_decay_length_m` | m | Decay length of the engraving resistance |
| `z₀` | `initial_burn_fraction` | — | Burned fraction at t = 0, from primer ignition |
| `h_bore` | `barrel_heat_loss_coefficient` | — | Barrel-wall heat-loss coefficient |
| η | `gas_covolume_m3_per_kg` | m³/kg | Noble-Abel covolume of the gas |
| `p_neck` | `neck_tension_pressure_pa` | Pa | Neck-tension resistance while the bullet crosses the freebore |
| `j_min` | `freebore_jump_threshold_m` | m | A jump no longer than this is no freebore |
| `j` | `freebore_jump_m` | m | The freebore jump every load is simulated with |
| `L_ref` | `reference_bearing_length_m` | m | Reference bearing length at `d_ref` |
| `d_ref` | `reference_bearing_caliber_m` | m | Reference bore diameter for scaling `L_ref` across calibers |
| `e_cal` | `reference_bearing_caliber_exponent` | — | Caliber-scaling exponent on `d_b / d_ref` for `L_ref` |
| `L_tip_ins` | `tip_base_insert_mm` | mm | Polymer tip insert deducted when estimating metallic body length |
| `φ_bt` | `boat_tail_frustum_void_fraction` | — | Un-displaced void fraction of the seated boat-tail frustum |
| `φ_og` | `ogive_void_fraction` | — | Un-displaced void fraction of the ogive seated past the bearing surface |
| `k_disp` | `solver_displacement_factor` | — | Fraction of seated-bullet volume deducted from the 0-D solver's initial chamber volume (`V₀`); physical case fill and usable capacity keep full displacement (`1.0`) |
| `k_fric_min`, `k_fric_max` | `bore_friction_multiplier_min`, `bore_friction_multiplier_max` | — | Clamp on the bearing-length bore-friction multiplier |
| `e_b` | `bore_friction_bearing_exponent` | — | Exponent on `bearingLengthM / refBearingM` in the friction multiplier |
| `v_fric_ref` | `bore_friction_ref_velocity_mps` | m/s | Reference velocity for Stribeck bore-friction scaling |
| `v_fric_floor` | `bore_friction_velocity_floor_mps` | m/s | Lower velocity clamp for Stribeck bore-friction scaling |
| `e_v_fric` | `bore_friction_velocity_exponent` | — | Velocity exponent `(v_fric_ref / v)^e_v_fric` in bore friction |
| `k_v_min`, `k_v_max` | `bore_friction_velocity_scale_min`, `bore_friction_velocity_scale_max` | — | Clamp on the Stribeck bore-friction velocity multiplier |
| `v_heat_ref` | `heat_loss_ref_velocity_mps` | m/s | Reference velocity for convective barrel heat-loss saturation |
| `e_heat` | `heat_loss_velocity_exponent` | — | Velocity exponent in effective convective heat-loss velocity |
| `p_damp_floor` | `pressure_damping_floor_pa` | Pa | Lower pressure clamp inside the high-pressure damping log |
| `p_damp_ref` | `pressure_damping_ref_pa` | Pa | Reference pressure where high-pressure damping equals 1 |
| `s_damp` | `pressure_damping_slope` | — | High-pressure Vieille damping slope (0 disables damping) |
| `d_min`, `d_max` | `pressure_damping_min`, `pressure_damping_max` | — | Clamp on the high-pressure burn-rate damping factor |
| `Δf_min` | `impetus_fill_delta_min` | — | Lower floor on `fill − fill_ref` for impetus modulation |
| `s_imp` | `impetus_fill_slope` | — | Loading-density slope on effective impetus (0 disables modulation) |
| `k_imp_min`, `k_imp_max` | `impetus_fill_scale_min`, `impetus_fill_scale_max` | — | Clamp on the loading-density impetus multiplier |

### 2.2 Form-function progressivity, sliver tail and ignition

| Symbol | `model` key | Unit | Meaning |
|---|---|---|---|
| `δ_ext`, `δ_ball`, `δ_multi` | `progressivity_offset_extruded`, `progressivity_offset_ball`, `progressivity_offset_multi_perf` | — | Base progressivity shift by kernel shape |
| `e_tail_ext`, `e_tail_ball`, `e_tail_multi` | `sliver_tail_exponent_extruded`, `sliver_tail_exponent_ball`, `sliver_tail_exponent_multi_perf` | — | Power-law sliver-tail exponent by kernel shape |
| `s_sd` | `progressivity_sd_scale` | — | Scale on log areal-density ratio in `progressivityShift` (0 disables areal-density shift) |
| `SD_ref` | `reference_areal_density_kg_per_m2` | kg/m² | Reference bullet areal density `m / A` for `sdProgShift` |
| `r_sd_min`, `r_sd_max` | `areal_density_ratio_min`, `areal_density_ratio_max` | — | Clamp on `(m / A) / SD_ref` |
| `s_prog_fill` | `progressivity_fill_slope` | — | Loading-density slope in `progressivityShift` |
| `δ_min`, `δ_max` | `progressivity_shift_min`, `progressivity_shift_max` | — | Clamp on total `progressivityShift` |
| `σ₀_min`, `k_σ0` | `initial_surface_min`, `initial_surface_prog_scale` | — | Floor and shift scale on `initialSurface` (`σ(0)`) |
| `σ_p_min`, `k_σp` | `peak_surface_min`, `peak_surface_prog_scale` | — | Floor and shift scale on `profilePeakSurface` |
| `a_ball`, `a_multi`, `a_ext` | `ignition_deficit_ball`, `ignition_deficit_multi_perf`, `ignition_deficit_extruded` | — | Ignitability-deficit coefficient by kernel shape |
| `a_multi_off` | `ignition_deficit_multi_perf_offset` | — | Offset subtracted from `rawDeficitCoeff` for `extrudedMultiPerf` |
| `fill_ign` | `ignition_deficit_fill_threshold` | — | Loading density below which the ignition deficit applies |
| `k_ign_scale` | `ignition_deficit_scale` | — | Scale on `rawDeficitCoeff · fillDeficit²` |
| `k_ign_min` | `ignition_factor_min` | — | Floor on the ignition factor |

### 2.3 Integration and applying the calibration

| Symbol | `model` key | Unit | Meaning |
|---|---|---|---|
| `Δt` | `time_step_s` | s | RK4 fixed time step |
| `t_max` | `max_simulation_time_s` | s | Time cap before `noExit` refusal |
| `p_blow` | `overpressure_limit_pa` | Pa | Peak mean pressure above which a run fails as `overpressure` |
| — | `trace_sample_stride` | steps | Steps between time-trace samples |
| `fill_ref` | `reference_loading_density` | — | Loading density every fill slope and fill delta is measured about |
| `s_x` | `pair_charge_slope_extra` | — | Added to any fitted pair charge slope where applied (§7) |
| `bore_ref` | `reference_bore_diameter_mm` | mm | Bore diameter the bore slope is measured about |
| `r_min`, `r_max` | `burn_rate_adjustment_min`, `burn_rate_adjustment_max` | — | Clamp on the fill-and-bore burn-rate adjustment |
| `fill_min`, `fill_max` | `calibrated_fill_min`, `calibrated_fill_max` | — | The loading-density window the calibration covers |

### 2.4 Helpers

- `clamp(value, lower, upper) = min(max(value, lower), upper)`.
- `loadingDensity(chargeMassKg, usableVolumeM3, bulkDensityKgPerM3) = C / max(V₀ · ρ_b, 10⁻¹²)`:
  the charge over what the usable volume holds at the powder's bulk density. 1 is a case full
  of settled powder.
- `chargeKgAtLoadingDensity(loadingDensityFraction, usableVolumeM3, bulkDensityKgPerM3) = fill · V₀ · ρ_b`,
  its inverse.
- `ignitionDeficitFor(kernelShape, model)`: `a_ball` for `"ball"`, `a_multi` for
  `"extrudedMultiPerf"`, `a_ext` otherwise.

---

## 3. `buildSimInput(args, model)` — records to solver input

Turns a cartridge, a powder, a bullet and the load's own numbers into the solver's input record.
It is the only place units convert and the only place a default applies.

### 3.1 Arguments

| Argument | Fields read |
|---|---|
| `args.cartridge` | `baseCapacityH2oGrams`, `bulletDiameterMm` (groove), `boreDiameterMm` (land), `maxCaseLengthMm`, `trimLengthMm`, `oalMm` |
| `args.powder` | `propellantDensityKgM3`, `bulkDensityKgM3`, `heatOfExplosionKjKg`, `grainType`, `burnFractionAtSurfacePeak`, `burnSurfacePeakGain`, `burnFractionAtSliverStart` |
| `args.bullet` | `weightGrams`, `overallLengthMm`, `bearingSurfaceMm`, `boatTailLengthMm`, `tipLengthMm`, `engravingPressurePa` |
| `args` | `chargeGrams`, `barrelLengthMm` (bolt face to muzzle), `coalMm`, `caseCapacityH2oGrams` |

The groove and land diameters belong to the calibre. `resolveDiameters(cartridge, diameters)`
looks up `cartridge.diameterId` and returns that record's `bulletDiameterMm` and
`boreDiameterMm`, which the caller places on the cartridge.

### 3.2 Refusals

Checked in this order through `prepFailure(code, message)`; every positive scalar check requires
a finite number (`Number.isFinite(v) && v > 0`).

| Refused when | `code` |
|---|---|
| neither `args.caseCapacityH2oGrams` nor `baseCapacityH2oGrams` is finite and > 0 | `missingCapacity` |
| `bulletDiameterMm` is absent, non-finite or ≤ 0 | `missingBulletDiameter` |
| `boreDiameterMm` is absent, non-finite or ≤ 0 | `missingBoreDiameter` |
| neither `maxCaseLengthMm` nor `trimLengthMm` is finite and > 0 | `missingCaseLength` |
| `weightGrams` is absent, non-finite or ≤ 0 | `missingBulletWeight` |
| `overallLengthMm` is absent, non-finite or ≤ 0 | `missingBulletLength` |
| `propellantDensityKgM3` is absent, non-finite or ≤ 0 | `missingPowderDensity` |
| `bulkDensityKgM3` is absent, non-finite or ≤ 0 | `missingPowderBulkDensity` |
| `heatOfExplosionKjKg` is absent, non-finite or ≤ 0 | `missingPowderEnergy` |
| `barrelLengthMm` is absent, non-finite or ≤ 0 | `missingBarrelLength` |
| no `coalMm` above `coal_absent_at_or_below_mm` and no finite positive `oalMm` | `missingCoal` |
| usable volume after seating is non-finite or ≤ `chamber_volume_min_m3` | `noChamberVolume` |
| bullet travel is non-finite or < `bullet_travel_min_m` | `noTravel` |
| charge is non-finite or ≤ 0 | `noCharge` |
| `C / ρ_s > V₀`: the charge cannot fit even at solid density | `chargeExceedsCase` |

### 3.3 Unit conversions and precedence

- `MM_TO_M` is `10⁻³`; grams to kilograms is `× 10⁻³`.
- `WATER_GRAMS_TO_M3` is `10⁻⁶ / 0.9982`, water at about 20 °C.
- `QUARTER_PI` is `π/4`, the factor in every circle area.
- Case capacity is `args.caseCapacityH2oGrams`, else `baseCapacityH2oGrams`.
- Case length (`seatingCaseLengthMm`) is `maxCaseLengthMm`, else `trimLengthMm`.
- COAL (`seatedCoalMm`) is `args.coalMm` when finite and above `coal_absent_at_or_below_mm`,
  else `oalMm`.

### 3.4 Geometry, in evaluation order

With `d_g` the groove diameter (`grooveDiameterM`) and `d_b` the land diameter
(`boreDiameterM`) in metres, and `L_case` the case length, `L_bul` the bullet length
(`bulletOverallLengthMm`) and `COAL` (`coalMm`) in millimetres:

1. **Bore area.** `boreAreaM2 = (π/4) · ½ · (d_g² + d_b²)`, the mean of the land and groove
   circles.
2. **Seating depth** [mm]. `bulletSeatingDepthMm = clamp(L_bul − (COAL − L_case), 0, L_bul)`.
3. **Usable case volume & solver chamber volume.** `usableCaseVolumeM3(capacityWaterGrams, seatingDepthMm, grooveDiameterM, model, boatTailLengthMm, bearingSurfaceMm)`
   computes `effectiveSeatedLengthMm` by starting at `seatingDepthMm` and subtracting the
   un-displaced voids of the tapered sections:
   - boat-tail frustum void: `− φ_bt · min(seatingDepthMm, btMm)` where `btMm = boatTailLengthMm > 0 ? boatTailLengthMm : 0`;
   - deep-seated ogive void: when `bearingSurfaceMm > 0` and `seatingDepthMm > btMm + bearingSurfaceMm`,
     `− φ_og · (seatingDepthMm − (btMm + bearingSurfaceMm))`.
   With full case volume `V_case = capacity · WATER_GRAMS_TO_M3`, the physical usable volume behind
   the seated bullet is `V_phys = V_case − effectiveSeatedLengthMm · 10⁻³ · (π/4) · d_g²`, which
   drives `noChamberVolume`, `chargeExceedsCase`, `derived.usableCapacityH2oGrams`, and
   `derived.fillFraction`. The 0-D thermodynamic solver receives an effective initial chamber
   volume scaled by `k_disp`: `chamberVolumeM3 = V_case − k_disp · (V_case − V_phys)`.
4. **Travel.** `bulletTravelM = (barrelLengthMm − COAL + L_bul) · 10⁻³`. The bullet base starts
   `COAL − L_bul` from the bolt face.
5. **Charge.** `chargeMassKg = chargeGrams · 10⁻³`.
6. **Friction scale.** `boreFrictionMultiplier(bearingSurfaceMm, overallLengthMm, boreDiameterM, model, tipLengthMm)`:
   - If `bearingSurfaceMm` is finite and > 0, `resolvedBearingMm = bearingSurfaceMm`.
   - Otherwise, if `tipLengthMm` is finite and > 0, `tipDeductionMm = max(0, tipLengthMm − L_tip_ins)` (else `0`),
     `effectiveLengthMm = max(L_bul − tipDeductionMm, 0.5 · L_bul)`, and
     `resolvedBearingMm = default_bearing_surface_fraction · effectiveLengthMm`.
   - Caliber-scaled reference bearing length:
     `refBearingM = L_ref · (d_b / d_ref)^e_cal`.
   - `bearingRatio = (resolvedBearingMm · 10⁻³) / refBearingM`, then
     `clamp(e_b === 1 ? bearingRatio : bearingRatio^e_b, k_fric_min, k_fric_max)`.
7. **Jump.** `freeboreJumpM = freebore_jump_m`, the same for every load.
8. **Burn-surface profile** → `recordBurnSurfaceProfile(powder, model)`. Each field takes the
   record's finite value or its default (§3.5), then is bounded: `burnFractionAtSurfacePeak`
   clamped to `surface_peak_burn_fraction_min`…`surface_peak_burn_fraction_max`,
   `surfacePeakGain` floored at `surface_peak_gain_min`, and `burnFractionAtSliverStart` clamped
   to `sliver_start_burn_fraction_min`…`sliver_start_burn_fraction_max`.
9. **Shot-start pressure.** `engravingPressurePa` when finite and > 0, else
   `default_engraving_pressure_pa`.
10. **Impetus seed.** `propellantImpetusJPerKg = (γ − 1) · heatOfExplosionKjKg · 10³`.
11. **Kernel shape & ignition deficit.** `kernelShape = powder.grainType`;
    `ignitionDeficitCoefficient = ignitionDeficitFor(powder.grainType, model)`.
12. **Burn coefficient.** `burnRateCoefficient = 0`, filled by `applyPowderCalibration`.

`applyPowderCalibration` (§5) replaces the impetus and the profile's peak and gain before any
simulation, so for those three the values above are placeholders. `heatOfExplosionKjKg` is still
required by the refusal check.

### 3.5 Defaults and profile bounds

| Absent field or bound | `model` key |
|---|---|
| `burnFractionAtSurfacePeak` default | `default_burn_fraction_at_surface_peak` (replaced by `form_zpeak`) |
| `burnSurfacePeakGain` default | `default_burn_surface_peak_gain` (replaced by `form_gain`) |
| `burnFractionAtSliverStart` default | `default_burn_fraction_at_sliver_start` |
| `engravingPressurePa` default | `default_engraving_pressure_pa` |
| `bearingSurfaceMm` default fraction | `default_bearing_surface_fraction` × effective bullet length |
| `burnFractionAtSurfacePeak` bounds | `surface_peak_burn_fraction_min`, `surface_peak_burn_fraction_max` |
| `surfacePeakGain` floor | `surface_peak_gain_min` |
| `burnFractionAtSliverStart` bounds | `sliver_start_burn_fraction_min`, `sliver_start_burn_fraction_max` |
| Refusal thresholds (§3.2) | `coal_absent_at_or_below_mm`, `chamber_volume_min_m3`, `bullet_travel_min_m` |

### 3.6 The result

`{ ok: true, input, derived }`. `input` is the solver's record:

| Symbol | `input.…` | Unit | Meaning |
|---|---|---|---|
| `A` | `boreAreaM2` | m² | Effective bore area |
| `V₀` | `chamberVolumeM3` | m³ | Effective solver chamber volume behind the seated bullet (`V_case − k_disp · (V_case − V_phys)`), before powder displacement |
| `L` | `bulletTravelM` | m | Bullet travel from seated position to base exit |
| `d_b` | `boreDiameterM` | m | Land diameter, for the barrel heat-loss surface |
| `C` | `chargeMassKg` | kg | Charge mass |
| `m` | `bulletMassKg` | kg | Bullet mass |
| `ρ_s` | `propellantSolidDensityKgPerM3` | kg/m³ | Solid propellant density |
| `f` | `propellantImpetusJPerKg` | J/kg | Propellant impetus |
| `σ` | `burnSurfaceProfile` | — | `burnFractionAtSurfacePeak` (`z_peak`), `surfacePeakGain` (`gain`), `burnFractionAtSliverStart` (`z_sliver`) |
| `p_start` | `engravingPressurePa` | Pa | Shot-start (engraving) pressure |
| `k_fric` | `boreFrictionMultiplier` | — | Bore-friction multiplier |
| `j` | `freeboreJumpM` | m | Freebore jump before the full-diameter section reaches the lands (`freebore_jump_m`) |
| `ρ_b` | `propellantBulkDensityKgPerM3` | kg/m³ | Bulk (loading) density |
| — | `kernelShape` | — | Optional `KernelShape` (`'ball' \| 'flake' \| 'extrudedSinglePerf' \| 'extrudedMultiPerf' \| 'extruded'`) |
| `a_ign` | `ignitionDeficitCoefficient` | — | Ignitability-deficit coefficient |
| `B` | `burnRateCoefficient` | 1/s | Burn coefficient at `p_ref` |

`derived` carries `fillFraction = loadingDensity(C, V_phys, ρ_b)`, `bulletBaseOffsetMm = COAL − L_bul`,
`caseCapacityH2oGrams`, `caseLengthMm`, `coalMm`, `seatingDepthMm`, `usableCapacityH2oGrams = V_phys / WATER_GRAMS_TO_M3`,
and `bulletTravelMm`.

---

## 4. The regime gate

Inside `simulateLoadWithCalibration`, after `buildSimInput`: the load is refused with
`"outsideCalibratedRegime"` when `derived.fillFraction < fill_min` or `> fill_max`. The
correction factors are defined only inside that window. The message states the limit from the
constants.

---

## 5. `applyPowderCalibration(calibration, input, powderId, baseBurnRateCoefficientOverride)`

Installs the powder's calibrated physics into the input. It reads `calibration.powders[powderId]`
(the entry `pt`) and returns `null` when there is none, which `simulateLoadWithCalibration`
reports as `"uncalibratedPowder"`.

When `baseBurnRateCoefficientOverride` is provided it must be finite and > 0 (otherwise an error
is thrown); it replaces `pt.burn_coeff` before anything else, so the fill and bore slopes still
apply to it. It returns a copy of `input` with:

- `burnRateCoefficient = effectiveBurnRateCoefficient(pt, inputLoadingDensity(input), boreDiameterM · 10³, calibration.model)`;
- `propellantImpetusJPerKg = pt.impetus`;
- `burnSurfaceProfile = fittedBurnSurfaceProfile(input.burnSurfaceProfile, pt)`, which sets
  `surfacePeakGain = pt.form_gain`, `burnFractionAtSurfacePeak = pt.form_zpeak`, and
  `burnFractionAtSliverStart = sliverStartBurnFraction(fitted) = max(z_sliver, z_peak)` so the
  sliver taper never begins ahead of the fitted surface peak.

`burnSurfaceProfileInUse(calibration, powder)` composes `recordBurnSurfaceProfile` and
`fittedBurnSurfaceProfile` so UI readouts match the exact profile the solver runs.

`effectiveBurnRateCoefficient(powder, loadingDensityFraction, boreDiameterMm, model)`:

```
adjustment = 1 + fill_slope · (fill − fill_ref) + bore_slope · (bore_mm − bore_ref)
B          = burn_coeff · clamp(adjustment, r_min, r_max)
```

with `burn_coeff`, `fill_slope` and `bore_slope` from `pt`. In the shipped fit `fill_slope` is
held at 0 for all powders, so loading density does not move `B`, and `bore_slope` is bounded to
`[-0.03, 0.03]`.

---

## 6. `runSimulation(input, model, options)` — the solver

Integrates one shot and returns the raw physics: no correction factor is applied here.

### 6.1 State and per-run values

The state is `burnFraction` (`z`), `travelM` (`x`), `velocityMps` (`v`), `energyLostJ`
(`E_lost`, resistance work plus heat) and `timeS` (`t`). It starts at `z = z₀`,
`x = v = E_lost = t = 0`, with `bulletMoving` false.

Computed once per run:

| Symbol | Code | Expression |
|---|---|---|
| `D_L` | `lagrangeDivisor` | `1 + C / (3m)` |
| `R_b` | `breechToMeanPressureRatio` | `(1 + C/(2m)) / D_L`, the breech-to-mean pressure ratio |
| `p_bore` | `boreFrictionPa` | `p_fric · k_fric` |
| `S'` | `boreCircumferenceM` | `π · d_b`, so swept barrel surface is `S' · x` |
| `p_jump` | `freeboreResistancePa` | `max(p_neck, p_fric)` |
| `p_gate` | `shotStartGatePa` | `p_jump` if `j > j_min`, else `p_start` |
| `fill` | `loadingDensityFraction` | `loadingDensity(C, V₀, ρ_b)` |
| `Δfill` | `fillDelta` | `fill − fill_ref` |
| `f_eff` | `effectiveImpetusJPerKg` | `f · clamp(1 + s_imp · max(Δfill, Δf_min), k_imp_min, k_imp_max)` |
| `δ_base`, `e_tail` | `baseProgOffset`, `tailExp` | Selected by `input.kernelShape` (`ball` / `extrudedMultiPerf` / default extruded); falls back to `ignitionDeficitCoefficient` thresholds when `kernelShape` is omitted |
| `a_raw` | `rawDeficitCoeff` | `a_ign − a_multi_off` for `extrudedMultiPerf`, else `a_ign` |
| `δ_sd` | `sdProgShift` | `s_sd · ln(clamp((m / A) / SD_ref, r_sd_min, r_sd_max))` |
| `δ_prog` | `progressivityShift` | `clamp(δ_base + s_prog_fill · Δfill + δ_sd, δ_min, δ_max)` |
| `σ₀` | `initialSurface` | `max(σ₀_min, 1 − k_σ0 · δ_prog)` |
| `σ_peak` | `profilePeakSurface` | `max(σ_p_min, 1 + gain + k_σp · δ_prog)` |
| `z_sliver` | `profileSliverBurnFraction` | `sliverStartBurnFraction(burnSurfaceProfile) = max(burnFractionAtSliverStart, z_peak)` |
| `span` | `profileSliverSpan` | `max(1 − z_sliver, 10⁻⁶)` |
| `k_ign` | `ignitionFactor` | `1` if `a_raw ≤ 0`; else `clamp(1 − k_ign_scale · a_raw · max(fill_ign − fill, 0)², k_ign_min, 1)` |
| `B'` | `ignitionAdjustedBurnRateCoefficient` | `B · k_ign` |
| `Δt/2`, `Δt/6` | `halfStepS`, `sixthStepS` | |

### 6.2 Dynamic form function σ(z)

The three-segment form function starts at `initialSurface` (`σ₀`), rises linearly to
`profilePeakSurface` (`σ_peak`) at `z_peak`, holds across the plateau to `z_sliver`, and tapers
to 0 at `z = 1` along a power law with kernel-shape exponent `tailExp` (`e_tail`):

```
σ(z) = σ₀ + (σ_peak − σ₀) · (z / z_peak)             z < z_peak
     = σ_peak                                         z_peak ≤ z < z_sliver
     = σ_peak · (max((1 − z) / span, 0))^e_tail       z ≥ z_sliver
```

In the code it is evaluated inline inside the RK4 stage loop (§6.4).

### 6.3 The energy balance

With `z` first clamped to at most 1:

```
E     = f_eff · z · C − (γ − 1) · ( ½·m·v²  +  C·v²/6  +  E_lost )
V_gas = V₀ + A·x − (1 − z)·C / ρ_s − z·C·η
p     = max( E / max(V_gas, 10⁻⁹), 0 )
```

The gas volume subtracts the unburned solid at propellant density and the burned gas's covolume.
The expression is evaluated inline at the start of each step and after RK4 stages 1–3, and as
`meanPressurePa(...)` for travel samples and the muzzle exit point.

### 6.4 Derivatives

Evaluated once per RK4 stage, at the stage's state and the mean pressure already computed there:

```
if z < 1 and p > 0:
  d_p = clamp(1 − s_damp · ln(max(p, p_damp_floor) / p_damp_ref), d_min, d_max)   if s_damp ≠ 0
      = clamp(1, d_min, d_max)                                                     if s_damp = 0
  dz  = B' · σ(z) · (p / p_ref)^n · d_p                                            burnFractionRate
else:
  dz  = 0

not moving:  dx = 0,  dv = 0,  dE = 0

moving:
  if x < j:
    p_res = p_jump
  else:
    v_fric = max(v, v_fric_floor)
    p_eff  = p_bore · clamp((v_fric_ref / v_fric)^e_v_fric, k_v_min, k_v_max)      effBoreFrictionPa
    p_res  = p_eff + (p_start − p_bore) · exp(−(x − j) / x_eng)                    resistancePressurePa
             (exponential term omitted for x − j > 37·x_eng, where exp(−37) < 10⁻¹⁶)

  dx     = v                                                                       travelRateMps
  dv     = max( A · (p / D_L − p_res) / m , 0 )                                    accelerationMps2
  v_heat = v_heat_ref · (max(v, 1) / v_heat_ref)^e_heat                            effectiveHeatVelocityMps
  dE     = A·p_res·v  +  h_bore · (S'·x) · √p · v_heat                             energyLossRateW
```

`dv` is floored at zero: the bullet never reverses.

### 6.5 Shot start

At the top of each step, after updating `peakMeanPressurePa` and checking overpressure, while
`bulletMoving` is false:

- if `pressurePa / lagrangeDivisor ≥ shotStartGatePa`, the bullet starts;
- else if `burnFraction ≥ 1`, the run fails as **squib**: the charge burned out before the
  bullet moved.

With a jump longer than `j_min` the gate is `freeboreResistancePa`; with none it is
`engravingPressurePa`.

### 6.6 The integration step (classic RK4, fixed Δt)

```
p   = p(z, x, v, E)              ; peak = max(peak, p)            pressurePa, peakMeanPressurePa
k1  = derivs(state, p)                                            stage 1
s2  = state + (Δt/2)·k1 ; k2 = derivs(s2, p(s2))                  stage 2
s3  = state + (Δt/2)·k2 ; k3 = derivs(s3, p(s3))                  stage 3
s4  = state +  Δt   ·k3 ; k4 = derivs(s4, p(s4))                  stage 4
state += (Δt/6) · (k1 + 2k2 + 2k3 + k4)     ; z = min(z, 1)
t   += Δt
```

The four stages run in one loop (`for (let stage = 1; stage <= 4; stage += 1)`) accumulating
`k1 + 2k2 + 2k3 + k4` in fixed association. Whether the bullet moves is decided once per step,
before stage 1, and holds for all four stages.

### 6.7 Traces, travel samples, overpressure and exit

- **Overpressure.** Checked immediately when `peakMeanPressurePa` is updated at the top of each
  step (before bullet movement, integration, or exit): if `peakMeanPressurePa > p_blow`, the run
  fails as **overpressure**.
- **Time trace.** With `options.trace` true, one point
  `{ timeS, travelM, velocityMps, meanPressurePa, burnFraction }` is recorded at the top of every
  step whose `stepIndex` is a multiple of `trace_sample_stride`.
- **Travel samples.** With `options.travelSampleSpacingM` > 0, each time `x` crosses the next
  grid position `nextTravelSampleM` (≤ `L`), `crossingFraction = (sample − x_prev)/(x − x_prev)`
  linearly interpolates `timeS`, `velocityMps`, `burnFraction` and `energyLostJ` between the
  previous and current step, and evaluates `meanPressurePa` at that interpolated state. With
  `options.travelSampleOffsetM`, the first sample lands at
  `(⌊offset/spacing⌋ + 1)·spacing − offset`.
- **Exit.** When `x ≥ L`, `timeS`, `velocityMps`, `burnFraction` and `energyLostJ` are linearly
  interpolated to the exact crossing the same way. The `exitPoint` is appended to `trace` and to
  `travelSamples` (replacing a last sample within 10⁻⁶ m of the muzzle so it is never
  duplicated).
- **No exit.** If `timeS` reaches `t_max` before `x ≥ L`, the run fails as **no exit**.

`simulationFailure(reason, model)` builds each failure message, stating the limits from the
constants.

### 6.8 The result

| Field | Meaning |
|---|---|
| `muzzleVelocityMps` | m/s, interpolated at base exit |
| `peakPressurePa` | **breech** pressure, `peakMeanPressurePa · breechToMeanPressureRatio` |
| `burnFractionAtExit` | burned fraction interpolated at exit |
| `exitTimeS` | s, interpolated at base exit |
| `trace`, `travelSamples` | `readonly TracePoint[]` (`{ timeS, travelM, velocityMps, meanPressurePa, burnFraction }`) |

The peak is reported at the breech because a pressure transducer ports into the case wall there.

---

## 7. `velocityFactor` and `pressureFactor` — the correction

Both take `(calibration, ids, loadingDensityFraction)`, where `ids` holds the cartridge, powder and
bullet calibration ids (`calibrationId(record)`). Pair keys are two ids joined by `|`
(`pairKey(firstId, secondId)`).

`velocityFactor`:

```
F_v = cartridges[ctg].v_factor
    · pairs[ctg|pwd]
    · exp( s · (fill − fill_ref) )                                 chargeSlope
    · bullets_v[bul]
    · cart_bullet[ctg|bul]
s = pair_slopes[ctg|pwd] + s_x     where the pair has a fitted slope, else 0
```

The current fit fills `cartridges[ctg].v_factor` and `bullets_v[bul]` and leaves `pairs`,
`pair_slopes` and `cart_bullet` empty, so the other three factors are 1 and
`F_v = cartridges[ctg].v_factor · bullets_v[bul]`. Each of the two levels is fitted with every
publisher voting once (mean of per-publisher medians, shrunk toward 1 where few publishers print
the cartridge or bullet); per-publisher cartridge offsets are fitted alongside them and omitted
from the shipped file so test-barrel and lot bias does not leak into predictions.

`pressureFactor`:

```
F_p = cartridges[ctg].p_scale                                     cartridgeScale
    · powder_press[pwd]                                           powderFactor
    · bullets[bul]                                                bulletFactor
    · press_pairs[ctg|pwd]                                        pairFactor
    · press_cart_bullet[ctg|bul]                                  cartridgeBulletFactor
    · exp( (press_ramp + pairSlope) · (fill − fill_ref) )
pairSlope = press_pair_slopes[ctg|pwd] ?? press_powder_slopes[pwd] ?? 0
```

Every name is a member of `calibration`. A missing factor is 1 and a missing slope is 0, so a
component or pair the calibration has no value for is left uncorrected. The pressure slope falls
back from the pair to the powder, then to nothing. In the shipped fit `press_ramp` is 0 and no
pressure slopes are populated, so the pressure correction is its five multiplicative levels.

---

## 8. `simulateLoadWithCalibration(calibration, args)` — the result

After the five stages it returns:

| Field | Value |
|---|---|
| `muzzleVelocityMps` | `muzzleVelocityMps · F_v` |
| `peakPressurePa` | `peakPressurePa · F_p` (breech) |
| `burnedPct` | `burnFractionAtExit · 100` |
| `timeToExitMs` | `exitTimeS · 10³` |
| `curve`, `travelSamples` | each point through `toCurvePoint(point, velocityCorrection, pressureCorrection)` |
| `derived` | `buildSimInput`'s `derived` |

`toCurvePoint` returns `travelMm = travelM · 10³`, `timeMs = timeS · 10³`,
`pressurePa = meanPressurePa · F_p` (spatial *mean* chamber pressure, used for muzzle-exit blast;
lower than breech pressure by `breechToMeanPressureRatio`),
`velocityMps = velocityMps · F_v`, and `burnedPct = burnFraction · 100`.

`args` also carries `trace`, `travelSampleSpacingM`, `travelSamplesByBarrelPosition` and
`burnRateCoefficientOverride`. With `travelSamplesByBarrelPosition` the travel grid is offset by
`bulletBaseOffsetMm · 10⁻³`, so samples fall at whole units of distance from the bolt face.

---

## 9. `simulateLoadEnsemble(calibration, args, opts)` — the uncertainty band

The same load run many times under perturbed inputs, reported as the 10th, 50th and 90th
percentiles of velocity and pressure.

1. `runs = max(ensemble_runs_min, ⌊opts.runs ?? ensemble_runs⌋)`; the generator is
   `mulberry32(opts.seed ?? ensemble_seed)`.
2. The unperturbed load runs through `simulateLoadWithCalibration` with tracing off and is
   returned as `point`. A refusal there is returned as it is.
3. `powderErrorScale = train_mape / 100`, with `train_mape` the powder's mean absolute percentage
   error in the calibration.
4. If `calibration.cartridges[ids.cartridgeId]` is absent (an unfitted/custom cartridge),
   `missingCorrection = calibration.unfitted_cartridge_spread` (`{ velocity, pressure }`, each a
   log-normal σ); otherwise `null`.
5. Each member draws from `standardNormal(random)` and runs `buildSimInput`, checks the
   calibrated loading-density window (`calibrated_fill_min` … `calibrated_fill_max`), then runs
   `applyPowderCalibration`, `runSimulation`, `velocityFactor` and `pressureFactor` (plus the
   unfitted-cartridge draws when `missingCorrection` is non-null). A member any step refuses is
   counted in `refused` and dropped.

| Perturbed | Code | Width |
|---|---|---|
| case capacity | `capacity · exp(ensemble_case_capacity_sigma · N)`, when `args.caseCapacityH2oGrams \|\| cartridge.baseCapacityH2oGrams` > 0 | log-normal; brass-to-brass capacity spread |
| charge | `max(chargeGrams + ensemble_charge_sigma_g · N, 10⁻⁶)` | normal; a powder measure's throw |
| impetus | `propellantImpetusJPerKg · exp(ensemble_impetus_sigma_scale · powderErrorScale · N)` | log-normal; powder error scaled up (velocity goes as √impetus) |
| burn coefficient | `burnRateCoefficient · exp(powderErrorScale · N)` | log-normal; powder error |
| unfitted cartridge velocity | `exp(unfitted_cartridge_spread.velocity · N)`, only when `cartridges[ctg]` is absent | log-normal; empirical spread across fitted cartridges |
| unfitted cartridge pressure | `exp(unfitted_cartridge_spread.pressure · N)`, only when `cartridges[ctg]` is absent | log-normal; empirical spread across fitted cartridges |

The draws happen in the order of the table, and a draw is skipped when the step before it did
not run, so the sequence depends only on the seed and the load.

`percentileBand(values)` sorts the survivors and takes the value at rank `round(q · (n − 1))`
for `q` = 0.1, 0.5 and 0.9. When fewer than `runs · ensemble_surviving_fraction_min` members
survive, the load is refused with `stage: "simulate"` and `code: "ensembleUnstable"`.

`mulberry32` is a 32-bit hash generator giving uniform values in [0, 1). `standardNormal` is a
Box–Muller transform of two of them, the first floored at 10⁻¹².

The result is `{ ok: true, point, muzzleVelocityMps, peakPressurePa, runs, refused }`, with the
two bands as `{ p10, p50, p90 }` and `runs` the number of survivors.

---

## Appendix — one step of `runSimulation`, in evaluation order

The body of the `while (timeS < maxSimulationTimeS)` loop:

1. `pressurePa` from the energy balance at `(burnFraction, travelM, velocityMps, energyLostJ)`;
   update `peakMeanPressurePa`. If `peakMeanPressurePa > overpressureLimitPa` → **overpressure**.
2. If tracing and `stepIndex % traceSampleStride === 0`, push the point to `trace`.
3. If not `bulletMoving`: start if `pressurePa / lagrangeDivisor ≥ shotStartGatePa`; else if
   `burnFraction ≥ 1` → **squib**.
4. Save `previousTravelM`, `previousVelocityMps`, `previousTimeS`, `previousBurnFraction`,
   `previousEnergyLostJ`.
5. The four-stage RK4 loop (§6.6).
6. Advance the state; clamp `burnFraction ≤ 1`; `timeS += timeStepS`; `stepIndex += 1`.
7. Emit any travel samples crossed this step, linearly interpolating time, velocity, burn
   fraction and energy lost before computing `meanPressurePa`.
8. If `travelM ≥ bulletTravelM`: linearly interpolate exit time, velocity, burn fraction and
   energy lost, append `exitPoint` to requested traces, and return the result.
9. When the loop ends with `timeS ≥ maxSimulationTimeS` → **no exit**.
