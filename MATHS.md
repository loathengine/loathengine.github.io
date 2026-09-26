# Ignition: the Internal Ballistics Engine

This document explains the code of the Ignition engine and the physics each part of it
computes. Every function and variable it names in `code` is a name in the engine's code, and the
sections follow the order in which `simulateLoadWithCalibration` calls the functions.

**Units.** Everything inside the engine is SI: metres, kilograms, seconds, pascals, joules.
Every physical quantity carries its unit as a suffix (`Kg`, `M`, `M2`, `M3`, `Pa`, `S`, `Mps`,
`Mps2`, `JPerKg`, `KgPerM3`, `W`); a name without one is a fraction, a ratio or a count. The
inputs arrive in millimetres, grams and grams of water, and `buildSimInput` converts them once.

**Calibration.** Every entry point takes a `calibration` argument. Its `model` member holds the
fixed constants of the model (§2); its other members hold per-component parameters, each named
below where the code reads it. The engine holds no model values of its own.

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
  `p = [ f·z·C − (γ−1)·(KE_bullet + KE_gas + W_resistance + Q_barrel) ] / V_gas`,
  with `f` the propellant impetus (force constant, J/kg) and `z` the burned fraction.
- The charge burns by **Vieille's law** through a three-segment **form function**:
  `dz/dt = B · σ(z) · (p / p_ref)^n`.
- **Shot start** holds the bullet until base pressure clears a gate. Resistance then decays
  exponentially from the engraving pressure to bore friction.
- **Heat loss** goes through the barrel wall and grows with swept surface and bullet velocity.
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

`simulateLoadEnsemble` (§9) runs the same path under perturbed inputs.

### 1.3 Properties of the code

1. **Pure.** Apart from `loadCalibration`, which fetches the calibration data once and checks its
   `model` block with `assertModelConstants`, the engine does no I/O. `runSimulation` does no
   unit conversion and applies no defaults; `buildSimInput` is the only place either happens.
2. **Malformed calibration data throws.** `assertModelConstants` throws on a missing, non-finite
   or unknown constant, and `applyPowderCalibration` on a powder entry without its burn-surface
   profile or exponent. Every other failure is a refusal value.
3. **Fixed float association.** `a·(b·c)` and `(a·b)·c` are different IEEE 754 doubles. Every
   expression keeps one grouping, so the same input gives the same bits on every run.
4. **A flat integration loop.** `runSimulation`'s loop holds no closure, no object and no call
   other than `Math` functions, so its values stay in registers whatever the JavaScript engine
   decides to inline.

---

## 2. Constants

The constants the equations use, as keys of `calibration.model`. Constants that set defaults,
bounds, refusal thresholds and the uncertainty band are listed in the sections that use them
(§3.2, §3.4, §3.5, §9).

| Symbol | `model` key | Unit | Meaning |
|---|---|---|---|
| γ | `specific_heat_ratio` | — | Ratio of specific heats of the propellant gas |
| `p_ref` | `reference_pressure_pa` | Pa | Reference pressure of the burn-rate law |
| `p_fric` | `bore_friction_pressure_pa` | Pa | Bore friction after engraving, at the reference bearing length |
| `x_eng` | `engraving_decay_length_m` | m | Decay length of the engraving resistance |
| `z₀` | `initial_burn_fraction` | — | Burned fraction at t = 0, from primer ignition |
| `h_bore` | `barrel_heat_loss_coefficient` | — | Barrel-wall heat loss: `dQ = h_bore · S · √p · v · dt` |
| η | `gas_covolume_m3_per_kg` | m³/kg | Noble-Abel covolume of the gas |
| `p_neck` | `neck_tension_pressure_pa` | Pa | Neck-tension resistance while the bullet crosses the freebore |
| `j_min` | `freebore_jump_threshold_m` | m | A jump no longer than this is no freebore |
| `L_ref` | `reference_bearing_length_m` | m | Bearing length at which bore friction equals `p_fric` |
| `k_fric_min`, `k_fric_max` | `bore_friction_multiplier_min`, `bore_friction_multiplier_max` | — | Clamp on bearing length / `L_ref` |
| `j` | `freebore_jump_m` | m | The freebore jump every load is simulated with |
| `a_ball` | `ignition_deficit_ball` | — | Ignitability-deficit coefficient, ball powders |
| `a_multi` | `ignition_deficit_multi_perf` | — | …extruded multi-perforation |
| `a_ext` | `ignition_deficit_extruded` | — | …extruded single-perforation, flake and anything else |
| `k_ign_min` | `ignition_factor_min` | — | Floor on the ignition factor |
| `Δt` | `time_step_s` | s | RK4 step |
| `t_max` | `max_simulation_time_s` | s | Time cap |
| `p_blow` | `overpressure_limit_pa` | Pa | Peak mean pressure at which a run is abandoned |
| — | `trace_sample_stride` | steps | Steps between time-trace samples |
| `fill_ref` | `reference_loading_density` | — | Loading density every fill slope is measured about |
| `bore_ref` | `reference_bore_diameter_mm` | mm | Bore diameter the bore slope is measured about |
| `r_min`, `r_max` | `burn_rate_adjustment_min`, `burn_rate_adjustment_max` | — | Clamp on the fill-and-bore burn-rate adjustment |
| `fill_min`, `fill_max` | `calibrated_fill_min`, `calibrated_fill_max` | — | The loading-density window the calibration covers |

`runSimulation` reads nine of them into locals once per run: `referencePressurePa`,
`engravingDecayLengthM`, `barrelHeatLossCoefficient`, `gasCovolumeM3PerKg`, `timeStepS`,
`maxSimulationTimeS`, `overpressureLimitPa`, `traceSampleStride`, and γ as
`specificHeatRatioMinusOne = γ − 1`.

### 2.1 Helpers

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
| `args.powder` | `propellantDensityKgM3`, `bulkDensityKgM3`, `heatOfExplosionKjKg`, `grainType`, `burnExponent`, `burnFractionAtSurfacePeak`, `burnSurfacePeakGain`, `burnFractionAtSliverStart` |
| `args.bullet` | `weightGrams`, `overallLengthMm`, `bearingSurfaceMm`, `engravingPressurePa` |
| `args` | `chargeGrams`, `barrelLengthMm` (bolt face to muzzle), `coalMm`, `caseCapacityH2oGrams` |

The groove and land diameters belong to the calibre. `resolveDiameters(cartridge, diameters)`
looks up `cartridge.diameterId` and returns that record's `bulletDiameterMm` and
`boreDiameterMm`, which the caller places on the cartridge.

### 3.2 Refusals

Checked in this order through `prepFailure(code, message)`; the message names the record and
field.

| Refused when | `code` |
|---|---|
| neither `args.caseCapacityH2oGrams` nor `baseCapacityH2oGrams` is > 0 | `missingCapacity` |
| `bulletDiameterMm` is absent or ≤ 0 | `missingBulletDiameter` |
| `boreDiameterMm` is absent or ≤ 0 | `missingBoreDiameter` |
| neither `maxCaseLengthMm` nor `trimLengthMm` is > 0 | `missingCaseLength` |
| `weightGrams` is absent or ≤ 0 | `missingBulletWeight` |
| `overallLengthMm` is absent or ≤ 0 | `missingBulletLength` |
| `propellantDensityKgM3` is absent or ≤ 0 | `missingPowderDensity` |
| `bulkDensityKgM3` is absent or ≤ 0 | `missingPowderBulkDensity` |
| `heatOfExplosionKjKg` is absent or ≤ 0 | `missingPowderEnergy` |
| `barrelLengthMm` is absent or ≤ 0 | `missingBarrelLength` |
| no `coalMm` above `coal_absent_at_or_below_mm` and no `oalMm` | `missingCoal` |
| usable volume after seating ≤ `chamber_volume_min_m3` | `noChamberVolume` |
| bullet travel < `bullet_travel_min_m` | `noTravel` |
| charge ≤ 0 | `noCharge` |
| `C / ρ_s > V₀`: the charge cannot fit even at solid density | `chargeExceedsCase` |

### 3.3 Unit conversions and precedence

- `MM_TO_M` is `10⁻³`; grams to kilograms is `× 10⁻³`.
- `WATER_GRAMS_TO_M3` is `10⁻⁶ / 0.9982`, water at about 20 °C.
- `QUARTER_PI` is `π/4`, the factor in every circle area.
- Case capacity is `args.caseCapacityH2oGrams`, else `baseCapacityH2oGrams`. Case length is
  `maxCaseLengthMm`, else `trimLengthMm`. COAL is `args.coalMm` when it is above
  `coal_absent_at_or_below_mm`, else `oalMm`.

### 3.4 Geometry, in evaluation order

With `d_g` the groove diameter (`grooveDiameterM`) and `d_b` the land diameter
(`boreDiameterM`) in metres, and `L_case` the case length, `L_bul` the bullet length
(`bulletOverallLengthMm`) and `COAL` (`coalMm`) in millimetres:

1. **Bore area.** `boreAreaM2 = (π/4) · ½ · (d_g² + d_b²)`, the mean of the land and groove
   circles.
2. **Seating depth** [mm]. `clamp(L_bul − (COAL − L_case), 0, L_bul)`: how far the bullet
   intrudes into the case. It is written inline as the second argument of `usableCaseVolumeM3`.
3. **Usable case volume.** `usableCaseVolumeM3(capacityWaterGrams, seatingDepthMm, grooveDiameterM)`
   `= capacity · WATER_GRAMS_TO_M3 − seatedBulletVolumeM3`, with the seated bullet a cylinder of
   the seating depth at groove diameter → `chamberVolumeM3`.
4. **Travel.** `bulletTravelM = (barrelLengthMm − COAL + L_bul) · 10⁻³`. The bullet base starts
   `COAL − L_bul` from the bolt face.
5. **Charge.** `chargeMassKg = chargeGrams · 10⁻³`.
6. **Friction scale.** `boreFrictionMultiplier(bearingSurfaceMm, overallLengthMm, model)`:
   `bearingLengthM = (bearingSurfaceMm ?? default_bearing_surface_fraction · L_bul) · 10⁻³`, then
   `clamp(bearingLengthM / L_ref, k_fric_min, k_fric_max)`.
7. **Jump.** `freeboreJumpM = freebore_jump_m`, the same for every load. The load's own
   geometry does not enter it.
8. **Burn-surface profile** → `burnSurfaceProfile`. Each field is the record's value or its
    default (§3.5), then bounded: `burnFractionAtSurfacePeak` clamped to
    `surface_peak_burn_fraction_min`…`surface_peak_burn_fraction_max`, `surfacePeakGain`
    floored at `surface_peak_gain_min`, `burnFractionAtSliverStart` clamped to
    `sliver_start_burn_fraction_min`…`sliver_start_burn_fraction_max`.
9. **Burn exponent.** `burnRateExponent = burnExponent ?? default_burn_exponent`.
10. **Shot-start pressure.** `engravingPressurePa` when present and > 0, else
    `default_engraving_pressure_pa`.
11. **Impetus.** `propellantImpetusJPerKg = (γ − 1) · heatOfExplosionKjKg · 10³`.
12. **Ignition deficit.**
    `ignitionDeficitCoefficient = ignitionDeficitFor(grainType, model)`.
13. **Burn coefficient.** `burnRateCoefficient = 0`, filled by `applyPowderCalibration`.

`applyPowderCalibration` (§5) replaces the impetus, the exponent and the profile's peak and
gain before any simulation, so for those four the values above are placeholders.
`heatOfExplosionKjKg` is still required by the refusal check.

### 3.5 Defaults

| Absent field | `model` key |
|---|---|
| `burnExponent` | `default_burn_exponent` (replaced by the calibrated `burn_exp`) |
| `burnFractionAtSurfacePeak` | `default_burn_fraction_at_surface_peak` (replaced by `form_zpeak`) |
| `burnSurfacePeakGain` | `default_burn_surface_peak_gain` (replaced by `form_gain`) |
| `burnFractionAtSliverStart` | `default_burn_fraction_at_sliver_start` |
| `engravingPressurePa` | `default_engraving_pressure_pa` |
| `bearingSurfaceMm` | `default_bearing_surface_fraction` × bullet length |

### 3.6 The result

`{ ok: true, input, derived }`. `input` is the solver's record:

| Symbol | `input.…` | Unit | Meaning |
|---|---|---|---|
| `A` | `boreAreaM2` | m² | Effective bore area |
| `V₀` | `chamberVolumeM3` | m³ | Free chamber volume behind the seated bullet, before powder displacement |
| `L` | `bulletTravelM` | m | Bullet travel from seated position to base exit |
| `d_b` | `boreDiameterM` | m | Land diameter, for the barrel heat-loss surface |
| `C` | `chargeMassKg` | kg | Charge mass |
| `m` | `bulletMassKg` | kg | Bullet mass |
| `ρ_s` | `propellantSolidDensityKgPerM3` | kg/m³ | Solid propellant density |
| `f` | `propellantImpetusJPerKg` | J/kg | Propellant impetus |
| `n` | `burnRateExponent` | — | Burn-rate exponent |
| `σ` | `burnSurfaceProfile` | — | `burnFractionAtSurfacePeak` (`z_peak`), `surfacePeakGain` (`gain`), `burnFractionAtSliverStart` (`z_sliver`) |
| `p_start` | `engravingPressurePa` | Pa | Shot-start (engraving) pressure |
| `k_fric` | `boreFrictionMultiplier` | — | Bore-friction multiplier |
| `j` | `freeboreJumpM` | m | Freebore jump before the full-diameter section reaches the lands (`freebore_jump_m`) |
| `ρ_b` | `propellantBulkDensityKgPerM3` | kg/m³ | Bulk (loading) density |
| `a_ign` | `ignitionDeficitCoefficient` | — | Ignitability-deficit coefficient |
| `B` | `burnRateCoefficient` | 1/s | Burn coefficient at `p_ref` |

`derived.fillFraction = loadingDensity(C, V₀, ρ_b)` is the loading density the regime gate and
the correction factors use. `derived.bulletBaseOffsetMm = COAL − L_bul` is the bolt-face to
bullet-base distance.

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

When `baseBurnRateCoefficientOverride` is given and > 0 it replaces `pt.burn_coeff` before
anything else, so the fill and bore slopes still apply to it. It returns a copy of `input` with:

- `burnRateCoefficient = effectiveBurnRateCoefficient(pt, inputLoadingDensity(input), boreDiameterM · 10³, calibration.model)`;
- `propellantImpetusJPerKg = pt.impetus`;
- `burnRateExponent = pt.burn_exp`;
- `burnSurfaceProfile.surfacePeakGain = pt.form_gain`,
  `burnSurfaceProfile.burnFractionAtSurfacePeak = pt.form_zpeak`; the sliver point is unchanged.

`inputLoadingDensity(input)` is `loadingDensity` over the input's own charge, volume and bulk
density.

`effectiveBurnRateCoefficient(powder, loadingDensityFraction, boreDiameterMm, model)`:

```
adjustment = 1 + fill_slope · (fill − fill_ref) + bore_slope · (bore_mm − bore_ref)
B          = burn_coeff · clamp(adjustment, r_min, r_max)
```

with `burn_coeff`, `fill_slope` and `bore_slope` from `pt`.

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
| `p_jump` | `freeboreResistancePa` | `max(p_neck, p_bore)` |
| `p_gate` | `shotStartGatePa` | `p_jump` if `j > j_min`, else `p_start` |
| `z_peak`, `gain`, `z_sliver` | `profilePeakBurnFraction`, `profileGain`, `profileSliverBurnFraction` | from `burnSurfaceProfile` |
| `σ_peak` | `profilePeakSurface` | `1 + gain` |
| `span` | `profileSliverSpan` | `max(1 − z_sliver, 10⁻⁶)` |
| `k_ign` | `ignitionFactor` | `1` if `a_ign ≤ 0`; else `clamp(1 − a_ign · deficit², k_ign_min, 1)` with `deficit = max(1 − fill, 0)` (`fillDeficit`) |
| `B'` | `ignitionAdjustedBurnRateCoefficient` | `B · k_ign` |
| `Δt/2`, `Δt/6` | `halfStepS`, `sixthStepS` | |

The ignition factor is what a part-empty case costs: the burn rate falls with the square of
the empty fraction, more for ball powders, and it vanishes as the case fills.

### 6.2 Form function σ(z)

Normalised so σ(0) = 1. It rises linearly to `1 + gain` at `z_peak`, holds, then falls linearly
to 0 at z = 1 once the grain fractures into slivers at `z_sliver`:

```
σ(z) = 1 + gain · (z / z_peak)                      z < z_peak
     = 1 + gain                                     z_peak ≤ z < z_sliver
     = (1 + gain) · (1 − z) / span                  z ≥ z_sliver
```

In the code it is the nested conditional in the middle of the `burnFractionRate` assignment
(§6.4).

### 6.3 The energy balance

With `z` first clamped to at most 1:

```
E     = f · z · C − (γ − 1) · ( ½·m·v²  +  C·v²/6  +  E_lost )
V_gas = V₀ + A·x − (1 − z)·C / ρ_s − z·C·η
p     = max( E / max(V_gas, 10⁻⁹), 0 )
```

The gas volume subtracts the unburned solid at propellant density and the burned gas's covolume.

The expression appears three times, always in this grouping:

- inline at the step's start: `gasBurnFraction`, `gasEnergyJ`, `gasVolumeM3` → `pressurePa`;
- inline at each later RK4 stage: `stageGasBurnFraction`, `stageGasEnergyJ`, `stageGasVolumeM3`
  → `stagePressurePa`;
- as the function `meanPressurePa(input, model, burnFractionRaw, travelM, velocityMps, energyLostJ)`,
  which the travel samples and the exit point call.

### 6.4 Derivatives

Evaluated once per RK4 stage, at the stage's state and the mean pressure already computed
there:

```
dz    = B' · σ(z) · (p / p_ref)^n        if z < 1, else 0        burnFractionRate
not moving:  dx = 0,  dv = 0,  dE = 0
moving:
  p_res = p_jump                                                   x < j
        = p_bore + (p_start − p_bore) · exp(−(x − j)/x_eng)        otherwise    resistancePressurePa
  dx    = v                                                                     travelRateMps
  dv    = max( A · (p / D_L − p_res) / m , 0 )                                  accelerationMps2
  dE    = A·p_res·v  +  h_bore · (S'·x) · √p · v                                energyLossRateW
```

The barrel heat-loss term is grouped as
`barrelHeatLossCoefficient * (boreCircumferenceM * stageTravelM) * Math.sqrt(stagePressurePa) * stageVelocityMps`.
`dv` is floored at zero: the bullet never reverses.

### 6.5 Shot start

At the top of each step, while `bulletMoving` is false:

- if `pressurePa / lagrangeDivisor ≥ shotStartGatePa`, the bullet starts;
- else if `burnFraction ≥ 1`, the run fails as **squib**: the charge burned out before the
  bullet moved.

With a jump longer than `j_min` the gate is the jump resistance; with none it is the engraving
pressure. In the sliver phase `dz/dt` is proportional to `1 − z`, so `z` reaches 1 only when a
step overshoots it; a charge that cannot start the bullet usually ends as **no exit** instead.

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

The four stages are one loop, `for (let stage = 1; stage <= 4; stage += 1)`, over
`stageBurnFraction`, `stageTravelM`, `stageVelocityMps` and `stagePressurePa`. Stage 1 starts from
the step's own state and `pressurePa`. Each stage:

1. evaluates the derivatives (§6.4);
2. adds them to `burnFractionRateSum`, `travelRateSumMps`, `accelerationSumMps2` and
   `energyLossRateSumW` with weights 1, 2, 2, 1. Stage 1 assigns the sums, and the later stages
   add in the order `k1 + 2k2 + 2k3 + k4` associates;
3. before stages 2, 3 and 4, forms the next state from the step's state plus `stageStepS` times
   this stage's derivatives, with `stageStepS` equal to `halfStepS` before stages 2 and 3 and
   `timeStepS` before stage 4, and evaluates its pressure (§6.3).

Whether the bullet moves is decided once per step, before stage 1, and holds for all four.

### 6.7 Traces, travel samples and exit

- **Time trace.** With `options.trace` true, one point
  `{ timeS, travelM, velocityMps, meanPressurePa, burnFraction }` is recorded at the top of every
  step whose `stepIndex` is a multiple of `trace_sample_stride`.
- **Travel samples.** With `options.travelSampleSpacingM` > 0, each time `x` crosses the next
  grid position `nextTravelSampleM` (≤ `L`) a point is interpolated between the previous and
  current step: `crossingFraction = (sample − x_prev)/(x − x_prev)`, velocity and time
  interpolated, pressure from `meanPressurePa` at the interpolated state. The grid can be
  shifted by `options.travelSampleOffsetM`; the first sample is then
  `(⌊offset/spacing⌋ + 1)·spacing − offset`.
- **Exit.** When `x ≥ L`, velocity and time are interpolated to the exact crossing the same way.
  The `exitPoint` is appended to the time trace and to the travel samples, where it replaces a
  last sample within 10⁻⁶ m of the muzzle instead of duplicating it. Both traces therefore end
  at the muzzle.
- **Overpressure.** After each step, if `peakMeanPressurePa > p_blow` the run fails as
  **overpressure**.
- **No exit.** If `timeS` reaches `t_max` first the run fails as **no exit**.

`simulationFailure(reason, model)` builds each failure message, stating the limits from the
constants.

### 6.8 The result

| Field | Meaning |
|---|---|
| `muzzleVelocityMps` | m/s, interpolated at base exit |
| `peakPressurePa` | **breech** pressure, `peakMeanPressurePa · breechToMeanPressureRatio` |
| `burnFractionAtExit` | burned fraction at exit |
| `exitTimeS` | s |
| `trace`, `travelSamples` | `{ timeS, travelM, velocityMps, meanPressurePa, burnFraction }` points |

The peak is reported at the breech because a pressure transducer ports into the case wall there.

---

## 7. `velocityFactor` and `pressureFactor` — the correction

Both take `(calibration, ids, loadingDensityFraction)`, where `ids` holds the cartridge, powder and
bullet ids. Pair keys are two ids joined by `|` (`pairKey(firstId, secondId)`).

`velocityFactor`:

```
F_v = cartridges[ctg].v_factor
    · pairs[ctg|pwd]
    · exp( pair_slopes[ctg|pwd] · (fill − fill_ref) )             chargeSlope
    · bullets_v[bul]
    · cart_bullet[ctg|bul]
```

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
back from the pair to the powder, then to nothing.

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
`pressurePa = meanPressurePa · F_p`, `velocityMps = velocityMps · F_v` and
`burnedPct = burnFraction · 100`. The curve carries the same two factors as the scalars, so it
agrees with them.

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
4. Each member draws from `standardNormal(random)` and runs `buildSimInput`,
   `applyPowderCalibration` and `runSimulation`, then the same `velocityFactor` and
   `pressureFactor`. It does not pass through the regime gate. A member any step refuses is
   counted in `refused` and dropped.

| Perturbed | Code | Width |
|---|---|---|
| case capacity | `capacity · exp(ensemble_case_capacity_sigma · N)`, only when a capacity exists | log-normal; brass-to-brass capacity spread |
| charge | `max(chargeGrams + ensemble_charge_sigma_g · N, 10⁻⁶)` | normal; a powder measure's throw |
| impetus | `propellantImpetusJPerKg · exp(ensemble_impetus_sigma_scale · powderErrorScale · N)` | log-normal; the powder's error scaled up, because velocity goes as √impetus |
| burn coefficient | `burnRateCoefficient · exp(powderErrorScale · N)` | log-normal; the powder's error |

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
   update `peakMeanPressurePa`.
2. If tracing and `stepIndex % traceSampleStride === 0`, push the point to `trace`.
3. If not `bulletMoving`: start if `pressurePa / lagrangeDivisor ≥ shotStartGatePa`; else if
   `burnFraction ≥ 1` → **squib**.
4. Save `previousTravelM`, `previousVelocityMps`, `previousTimeS`.
5. The stage loop (§6.6).
6. Advance the state; clamp `burnFraction ≤ 1`; `timeS += timeStepS`; `stepIndex += 1`.
7. Emit any travel samples crossed this step.
8. If `travelM ≥ bulletTravelM`: interpolate the exit, append `exitPoint`, return the result.
9. If `peakMeanPressurePa > overpressureLimitPa` → **overpressure**.
10. When the loop ends with `timeS ≥ maxSimulationTimeS` → **no exit**.
