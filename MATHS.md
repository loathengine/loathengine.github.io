# Internal Ballistics Engine — Specification Manual

> **Scope.** This document is a complete, implementation-level specification of the
> *internal* ballistics engine: the solver that converts a cartridge/powder/bullet
> load into a **chamber-pressure history** and a **derived muzzle velocity**. It is
> written to be sufficient to re-create the engine from scratch. Every formula,
> variable name, constant, and unit below is quoted directly from the specification:
>
> | Concern | Component |
> |---|---|
> | The engine (pure solver) | Internal Ballistics Solver |
> | The input builder (controller) | Simulation Input Builder |
> | Bullet displacement volume | Bullet Displacement Volume Calculation (`computeBulletDisplacementH2o`) |
> | Post-engine velocity correction | Post-Engine Velocity Correction Solver |
>
> **All quantities inside the engine are SI/metric.** Metres, kilograms, seconds,
> Pascals, Joules, Kelvin. Imperial units (grains, inches, fps, PSI) exist *only*
> at the UI/IO boundary and in the source data; they are converted to metric before
> the engine is called and back to imperial after. Nothing imperial ever enters the
> solver.

---

## 1. Architecture & Invariants

### 1.1 Pressure-primary design

The engine is **pressure-primary**. It never fits or targets muzzle velocity
directly. The state it integrates forward in time is a coupled system of
combustion, thermodynamics, gas dynamics, heat loss, and mechanics. Chamber
pressure is computed every derivative evaluation from an energy balance and an
equation of state; the bullet's acceleration is `P_base · A_groove − F_resist`
divided by effective mass; **muzzle velocity is simply the value of the velocity
state variable `v` at the instant the bullet base reaches the muzzle.** Velocity is
therefore an *emergent output* of the pressure/energy solution, not a tuned
quantity.

The only velocity adjustment in the whole system is a **post-engine multiplicative
correction** (§6) applied *after* the solver returns. It
corrects a known structural velocity deficit (the 0-D engine under-predicts
overbore cartridges) and **never touches pressure**.

### 1.2 The pipeline

```
DB records ──► buildSimulationInputs() ──► runInternalBallisticsSimulation() ──► correctVelocity()
  (Dexie)        (controller, §2)              (pure engine, §3)                 (leaf node, §6)
                 builds SimulationInputs        raw result:                       corrected muzzle
                 + FallbackReport               peakPressurePa,                   velocity only —
                                                muzzleVelocityMps (raw),          pressure untouched
                                                energy breakdown
```

* **`buildSimulationInputs`** is the *single source of truth* for turning database
  records into engine inputs. It performs every unit conversion, every geometry
  reconstruction, every fallback, and emits an auditable `FallbackReport`. It is a
  pure function (no I/O, no async).
* **`runInternalBallisticsSimulation`** is the *pure engine*. It receives a fully
  populated `SimulationInputs` and returns an `InternalBallisticsResult`.
* **`correctVelocity`** applies the fitted overbore/weight/pressure-ramp velocity
  correction.

### 1.3 Purity invariants of the engine

The engine (`runInternalBallisticsSimulation`) obeys strict rules:

1. **No data fetching.** It reads only its `SimulationInputs` argument.
2. **No unit conversion.** Every input is already metric. `bulletDisplacementVolumeM3`,
   for example, must be pre-computed by the controller — the engine throws if it is
   missing.
3. **No default values.** It carries no fallbacks. Every required parameter that is
   missing, non-finite, or out of range causes a **loud throw** (`throw new Error(...)`).
   Silent coercion and fuzzy matching are prohibited.
4. **Fail loud.** Invalid `grainType`, missing `burnAreaCoeff`, missing `quenchPressurePa`,
   invalid twist, over-limit fill fraction, etc. all throw immediately (see §3.2).

Because the engine refuses to guess, all "best effort" logic — geometry
reconstruction, named fallbacks — lives in the controller, where it is visible and
counted.

### 1.4 Physical/metric constants (module-level, not tunable)

These are true physical constants, distinct from the calibration `EngineConfig` (§4).

| Symbol (code) | Value | Meaning |
|---|---|---|
| `COVOLUME_REF` | `0.00095` | Cold-gas Noble-Abel covolume reference (m³/kg) — overridable via `engineConfig.covolumeRefM3Kg` |
| `COVOLUME_T_REF` | `300.0` | Reference temperature for covolume (K) |
| `COVOLUME_T_EXP` | `0.38` | Covolume temperature exponent — overridable via `engineConfig.covolumeTExp` |
| `T_WALL_K` | `293.15` | Barrel wall temperature (K = 20 °C) |
| `SIGMA` | `5.670374e-8` | Stefan-Boltzmann constant (W·m⁻²·K⁻⁴) |
| `SHOULDER_ANGLE_NORM_DEG` | `30.0` | Normalisation shoulder angle for gradient scaling (deg) |
| `GAMMA_FROZEN` | `1.38` | Low-T asymptote of γ(T) (rotation+translation only) |
| `GAMMA_HOT` | `1.21` | High-T asymptote of γ(T) (full vibrational excitation) |
| `GAMMA_T_HALF` | `1800.0` | Sigmoid midpoint temperature for γ(T) (K) |
| `GAMMA_STEEPNESS` | `0.0015` | γ(T) sigmoid transition rate (1/K) |
| `R_SPECIFIC` | `325.0` | Specific gas constant of NC/NG combustion products (J·kg⁻¹·K⁻¹) |

Two module-level variables `cfgCovolRef`, `cfgCovolTExp` are set once per simulation
from `engineConfig` and read by the hot-loop pressure/heat functions (avoids
threading them through every call site).

---

## 2. Inputs

### 2.1 The `SimulationInputs` shape (what the engine consumes)

Every field below is on the `SimulationInputs` interface. Fields marked **required**
cause a throw if missing/invalid.

#### `cartridge: CartridgeParams`

| Field | Unit | Req | Meaning |
|---|---|---|---|
| `name` | — | | Display name |
| `baseCapacityH2oGrams` | g H₂O | ✔ | Empty-case water capacity → `V_case_empty` |
| `bulletDiameterMm` | mm | ✔ | Groove/bullet diameter → `A_groove` |
| `boreDiameterMm` | mm | ✔ | Land-to-land bore diameter → `A_bore` (engraving) |
| `maxSaamiPa` | Pa | | SAAMI/CIP pressure ceiling (used by controller/calibration, not the solver core) |
| `throatFreetravelMm` | mm | ✔ | Freebore (jump-to-lands) distance |
| `flashHoleDiameterMm` | mm | ✔ | Flash-hole diameter → flame-front start position |
| `shoulderAngleDeg` | deg | ✔ | Shoulder half-angle → Lagrange gradient scaling |
| `bodyDiameterMm` | mm | | External body diameter at base — improves `beta` estimate |
| `primerPocketType` | — | | `PKT_SML`/`PKT_LRG` |
| `trimLengthMm` / `maxCaseLengthMm` | mm | ✔ (one of) | Case length → barrel free travel, powder-column length |
| `transducerScaleFactor` | — | ✔ | Multiplier applied to reported breech pressure |
| `gradientBetaScale` | — | | Per-cartridge scale on the (β−1) gradient term; default 1.0 |

#### Scalar load/environment fields

| Field | Unit | Req | Meaning |
|---|---|---|---|
| `bulletWeightGrams` | g | ✔ | Bullet mass |
| `powderChargeGrams` | g | ✔ | Propellant charge mass |
| `barrelLengthMm` | mm | ✔ | Physical barrel length |
| `ambientTempC` | °C | ✔ | Ambient temp → powder temperature sensitivity |
| `seatingDepthMm` | mm | ✔ | Bullet base depth below case mouth |
| `bulletOverallLengthMm` | mm | | OAL — used with seating depth + ogive to compute effective jump |
| `ogiveLengthMm` | mm | | Ogive length — corrects freebore consumption and throat volume |
| `bearingSurfaceMm` | mm | ✔ | Full-diameter shank length → friction contact area |
| `bulletMaterialType` | — | | e.g. `MAT_JACKETED_LEAD`, mono-copper — selects friction/correction variants |
| `primerEnergyJ` | J | ✔ | Primer energy input (8 J small / 14 J large typical) |
| `beta` | — | ✔ | Chamber expansion ratio (body-to-bore area) — pre-computed by controller |
| `engravingPressurePa` | Pa | ✔ | Peak jacket-engraving pressure (material property) |
| `bulletDisplacementVolumeM3` | m³ | ✔ | Seated-bullet displacement volume — pre-computed by controller |
| `twistRateMmPerTurn` | mm/turn | ✔ | Barrel twist → rotational inertia |
| `caseDimensions` | — | | Optional detailed external+wall profile → exact `V0`, `A_chamber`, `beta` |
| `densityRefKgM3` | kg/m³ | | Cell-relative reference loading density for density-coupling (§3.5); absent → self-reference (factor 1.0) |
| `pressureLevelMPa` | MPa | | Cell operating-pressure level for the K(P) coupling law (§3.5); absent → flat `densityCouplingK` |
| `engineConfig` | — | ✔ | Full `EngineConfig` calibration block (§4) |

### 2.2 How `buildSimulationInputs` derives them

The controller maps a normalised `BuildInputsArgs` (cartridge / powder / bullet /
load / environment) into `SimulationInputs`, applying **named fallbacks** and
recording each one in `FallbackReport.fallbacks[]` as `{ name, value, field }`.

#### 2.2.1 Named fallback constants

| Constant | Value | Applied to |
|---|---|---|
| `FALLBACK_SEATING_DEPTH_MM` | `3.0` mm | `seatingDepthMm` |
| `FALLBACK_ENGRAVING_PRESSURE_PA` | `40e6` Pa | `engravingPressurePa` |
| `FALLBACK_FREEBORE_MM` | `3.0` mm | `throatFreetravelMm` |
| `FALLBACK_FLASH_HOLE_MM` | `2.0` mm | `flashHoleDiameterMm` |
| `FALLBACK_SHOULDER_ANGLE_DEG` | `30` deg | `shoulderAngleDeg` |
| `FALLBACK_BODY_DIAMETER_MM` | `11` mm | `bodyDiameterMm` |
| `FALLBACK_TEMP_SENSITIVITY` | `0.00144` /°C | `tempSensitivity` |
| `FALLBACK_HEAT_EXPLOSION` | `3900` kJ/kg | `heatOfExplosionKjKg` |
| `FALLBACK_PROPELLANT_DENSITY` | `1600` kg/m³ | `propellantDensityKgM3` |
| `FALLBACK_BULK_DENSITY` | `950` kg/m³ | `bulkDensityKgM3` |
| `FALLBACK_BURN_EXPONENT` | `0.6` | `burnExponent` |
| `FALLBACK_AMBIENT_TEMP_C` | `21.11` °C (70 °F) | `ambientTempC` |

Two derived defaults are not in the table: `transducerScaleFactor ?? 1.0`,
`gradientBetaScale ?? 1.0`, `grainType || "extrudedSinglePerf"`,
`energyScaleFactor ?? 1.0`.

#### 2.2.2 Bullet length geometry (`resolveBulletGeometry`)

The three bullet segments satisfy the identity **overall = ogive + bearing + boattail**.
Reconstruction priority (first match wins):

1. **Fully measured** (bearing, ogive, boattail, overall all present) → used verbatim;
   `segmentsInterpolated = false`.
2. **Bearing missing, ogive+boattail+overall present** → `bearing = overall − ogive − boattail`
   (exact identity); `segmentsInterpolated = false`.
3. **Only overall present** → reconstruct a *consistent* set:
   `bearing = fallbackBearingSurfaceMm(...)`, `boattail = estimateBoatTailMm(...)`,
   both clamped to leave ≥ half-caliber for the ogive, then `ogive = overall − bearing − boattail`;
   `segmentsInterpolated = true`.
4. **No overall** → only a bearing guess; ogive/boattail stay `null`;
   `segmentsInterpolated = true`.

**`fallbackBearingSurfaceMm`** — 2-term physical model fitted on 689 measured bullets
(5-fold CV MAE ≈ 1.15 mm):

```
A_mm2  = π · (d/2)²                       (bore cross-section, mm²)
L_eff  = weightGrams / ((ρ / 1e6) · A_mm2)   (equal-mass solid-cylinder length, mm)
L_b    = 0.1836 · L_eff + 0.2085 · overallLengthMm
return clamp(L_b, lower = 0.5·d, upper = overallLengthMm)
```

`ρ` (material density, kg/m³) via `bearingMaterialDensityKgM3`: copper/mono/brass
`8940`, cast `11000`, else (jacketed-lead + default) `10400`. If overall length is
absent it degrades to the bore-ratio constant `1.49 · d`.

**`estimateBoatTailMm`** — keyed off the design token in the bullet id
`BUL_<maker>_<cal>_<weight>_<DESIGN>…`:

* Returns `0` for flat-base tokens (`BT_FLAT` = RN, PT, FB, SPT, GS, HC, TNT, FN, SP)
  *unless* a "strong" boat-tail token also appears (`BT_STRONG` = SBT, HPBT, BTHP,
  VLD, ELDX/ELDM/ELD, MK/SMK/TMK, LRHT, …).
* Otherwise returns `bt_fraction · d`, where `bt_fraction` is the max matching entry
  in the `BT_FRACTION` table (e.g. `MB 0.745`, `ELDM 0.664`, `HPBT 0.653`, `TSX 0.285`),
  or the global mean `BT_FRACTION_GLOBAL = 0.415` when unknown.

#### 2.2.3 Seating depth

```
if overall & coalMm & caseLength > 0:
    seatingDepthMm = max(1.0, overallLengthMm − (coalMm − caseLengthMm))
else:
    seatingDepthMm = FALLBACK_SEATING_DEPTH_MM (3.0)
```

#### 2.2.4 Bullet displacement volume (`computeBulletDisplacementH2o`)

Called with imperial diameter/seating (converted from mm) plus the metric segment
lengths; returns **grains of water**, which the controller then converts:

```
bulletDisplacementVolumeM3 = grH2o · 0.06479891 / 1000 / 1000
                             (grains → grams → kg/m³ ; 1 gr = 0.06479891 g, 1 g H₂O = 1 cm³)
```

Inside `computeBulletDisplacementH2o` (metres), when full segment geometry is known
the seated portion is split into three zones and summed:

* Partition of seating depth `SD` from the base up:
  `sd_bt = min(SD, L_bt)`, `sd_bs = min(max(0, SD − L_bt), L_bs)`,
  `sd_og = max(0, SD − L_bt − L_bs)`, with `L_bs = max(0, bearing, overall − ogive − boattail)`.
* **Boat-tail frustum** (base radius `η·R`, `η = 0.85`, growing to `R`):
  `v_bt = (π·sd_bt/3)·(r_base² + r_base·r_sub + r_sub²)`,
  `r_sub = r_base + (R − r_base)·(sd_bt/L_bt)`.
* **Bearing cylinder:** `v_bs = π·R²·sd_bs`.
* **Ogive frustum** (R → 0): `v_og = (π·sd_og/3)·(R² + R·r_tip + r_tip²)`,
  `r_tip = R·max(0, 1 − sd_og/L_og)`.

Fallback when segments are missing: `v_disp = π·(d/2)²·SD·0.90` (cylinder × 0.90).

#### 2.2.5 Other derived inputs

* **Quench pressure** `computeQuenchPressurePa(heat, grainType)`:
  ```
  t      = clamp((heatKjKg − 3000) / 2000, 0, 1)
  basePa = 15e6 + t · (5e6 − 15e6)          (15 MPa at ≤3000 kJ/kg → 5 MPa at ≥5000)
  return grainType contains "ball"  ?  basePa · 0.45  :  basePa
  ```
* **Primer energy** `getPrimerEnergyJ(primerPocketId, brisanceEnergyJ?)`: explicit
  brisance wins; else small pocket → `8` J, large → `14` J, unknown → throw.
* **Beta** `computeBeta(baseCapacityH2oGrams, caseLengthMm, boreDiameterMm, bodyDiameterMm?)`:
  ```
  A_bore = π·(d_bore/2)²
  if bodyDiameter present:
      V0     = baseCapacityH2oGrams / 1e6           (m³)
      r_int  = min(bodyDiameter/2000, sqrt(V0 / (π·caseLength_m)))
      beta   = max(1, π·r_int² / A_bore)
  else:  beta = max(1, (V_case_empty / caseLength_m) / A_bore)   (cylinder approx)
  ```
* **Twist** `resolveStandardTwist`: uses `twistRateMm` if > 0, else **throws** (no
  heuristic — Core policy #3).
* **Fill-fraction guard** (also re-checked inside the engine): loads exceeding
  `FILL_LIMIT = 1.25` (125 %) throw.

---

## 3. The Solver, in Execution Order

`runInternalBallisticsSimulation(inputs)` executes the following stages. Everything
before the loop is set-up; the loop is an adaptive RKF45 integration.

### 3.1 Covolume config binding

```
cfgCovolRef = cfg.covolumeRefM3Kg   (default 0.00095)
cfgCovolTExp = cfg.covolumeTExp     (default 0.38)
```

### 3.2 Input validation (loud throws)

Before any computation the engine throws on any of: missing `boreDiameterMm`,
`shoulderAngleDeg`, `engineConfig`, invalid `twistRateMmPerTurn (≤0)`,
`throatFreetravelMm`, `flashHoleDiameterMm`, both `trimLengthMm`+`maxCaseLengthMm`
missing, `transducerScaleFactor`, `burnExponent`, `heatOfExplosionKjKg (≤0)`,
`propellantDensityKgM3 (≤0)`, `quenchPressurePa (≤0)`, `engravingPressurePa`,
`primerEnergyJ (≤0)`, `bulletDisplacementVolumeM3 (<0 or non-finite)`,
`baseCapacityH2oGrams (≤0)`, `burnAreaCoeff (missing/non-finite)`.

### 3.3 Geometry and mass set-up

```
d_bullet_m = bulletDiameterMm / 1000       ;  d_bore_m = boreDiameterMm / 1000
A_bore_m2   = π·(d_bore_m/2)²               (land-to-land, engraving)
A_groove_m2 = π·(d_bullet_m/2)²             (groove/bullet, gas volume & drive force)
caseLengthMm = trimLengthMm ?? maxCaseLengthMm
L_barrel = max(0.01, (barrelLengthMm − caseLengthMm + seatingDepthMm) / 1000)   (m, bullet travel to muzzle)
m_bullet_kg = bulletWeightGrams / 1000     ;  m_charge_kg = powderChargeGrams / 1000
```

**Rotational inertia.** The bullet's effective mass carries its spin energy
(`E_rot = ½ I ω²`, `I = ½ m r²`, `ω = 2π v / L_turn`):

```
twist_turn_m     = twistRateMmPerTurn / 1000
rotational_factor = 0.5·π²·(d_bullet_m / twist_turn_m)²
m_bullet_eff_kg   = m_bullet_kg · (1 + rotational_factor)
```

`m_bullet_eff_kg` is used for KE and acceleration; the *physical* `m_bullet_kg` is
used for the Pidduck-Kent charge ratio ω.

### 3.4 Chamber volume, area, and β

* **With `caseDimensions`** (detailed profile): the case is modelled as body +
  shoulder + neck conical frustums. A wall-thickness scale `k_wall` is solved by
  **25-iteration bisection** (with dynamic bracket expansion, throwing if the target
  capacity cannot be bracketed) so the interior volume equals
  `baseCapacityH2oGrams`. From the resulting internal radii the chamber wetted area
  `A_chamber_custom_m2` (body + shoulder frusta lateral areas + neck cylinder + web
  cap) and `beta = max(1, area_body_int_avg / A_bore)` are computed. `V_case_empty_m3`
  is set to the target capacity.
* **Without `caseDimensions`:** `V_case_empty_m3 = baseCapacityH2oGrams / 1e6` (m³);
  `beta` is the value passed in (`inputs.beta`).

**Chamber wall area (heat loss):**
```
if caseDimensions:  A_chamber_m2 = A_chamber_custom_m2
else:               R_case = sqrt(beta)·d_bullet_m/2
                    A_chamber_m2 = π·R_case² + 2·V0_m3 / R_case   (endcap + lateral of equivalent cylinder)
```

### 3.5 Combustion pre-computation (burn-rate coefficient assembly)

The effective burn-area coefficient is assembled from four multiplicative
corrections plus a geometry-β adjustment, then square-rooted:

```
FILL_REF = 0.50 ; REF_BORE_MM = 7.62 ; REF_CAPACITY_G = 3.625

bulkDensKgM3   = bulkDensityKgM3  (else 0.62·propellantDensity)
chargeVolumeMl = powderChargeGrams / (bulkDensKgM3/1000)
fillFraction   = chargeVolumeMl / baseCapacityH2oGrams
   → throw if fillFraction > FILL_LIMIT (1.25)

fill_factor      = 1 + burnAreaFillSlope · (fillFraction − 0.50)
bore_ratio_sq    = (7.62 / boreDiameterMm)²
bore_factor      = 1 + burnAreaBoreSlope · (1 − bore_ratio_sq)
expansion_ratio  = baseCapacityH2oGrams / (π·(boreDiameterMm/20)²)      (cc / cm²)
expansion_factor = computeExpansionFactor(burnAreaExpansionSlope, expansion_ratio)
                 = clamp(1 + slope·(expansion_ratio − 10), 0.5, 1.8)     (EXPANSION_REF_RATIO=10)
temp_factor      = max(0.1, 1 + tempSensitivity·(ambientTempC − 21.11))

burnArea_coeff   = max(1e-6, burnAreaCoeff · fill_factor · bore_factor · expansion_factor · temp_factor)
burnArea_beta_adj = burnArea_coeff · beta^GEOMETRY_BURN_CORR            (GEOMETRY_BURN_CORR = 0.05)
burn_kinetic     = sqrt(burnArea_beta_adj)      ← DB stores a squared-vivacity scale
```

The mass-scaling burn constant (hoisted out of the loop):
```
m_charge_kg_scaled = m_charge_kg^grainSurfaceExponent   (grainSurfaceExponent = 1.0)
burn_mass_scale    = vieilleScaleCoeff · m_charge_kg_scaled   (vieilleScaleCoeff = 270)
```

Specific energy and density:
```
q_explosion_Jkg     = heatOfExplosionKjKg · 1000 · (energyScaleFactor ?? 1.0)   (J/kg)
rho_propellant_kgm3 = propellantDensityKgM3
```

**Density coupling exponent** (K or K(P) law), computed once per sim (cell-constant,
never a function of in-shot pressure):
```
DENS_K = (pressureLevelMPa present)
   ? min(densityCouplingK, max(kpFloorK, kpSlopePerMPa·(pressureLevelMPa − kpCrossoverMPa)))
   : densityCouplingK
```

**Loading density** (for flame spread + density coupling):
```
loadingDensityKgM3 = (powderChargeGrams/1000) / (V_case_empty_m3 + 1e-12)
densityRatio       = max(0.1, loadingDensityKgM3/1000)
flameDensityFactor = densityRatio^flameDensityExponent     (flameDensityExponent = −0.3)
```

**Powder-column length** (flame only traverses the propellant that is present):
```
fillFractionClamped = clamp(fillFraction, 0.05, 1.0)
L_powder_col_m      = max(flashHoleMm/1000, fillFractionClamped · L_case_m)
```

### 3.6 Effective jump, throat volume, and V0

**Effective freebore** (only the full-diameter shank past the case mouth consumes jump;
the tapered ogive does not touch the lands):
```
L_freebore_saami_m = throatFreetravelMm / 1000
if OAL & seatingDepth > 0:
    totalPastMouth = max(0, (OAL − seatingDepth)/1000)
    shankPastMouth = max(0, totalPastMouth − ogiveLength/1000)
    L_freebore_m   = max(0, L_freebore_saami_m − shankPastMouth)
else:
    L_freebore_m   = L_freebore_saami_m
```

**Throat gap volume** (subtract the ogive cone occupying part of the freebore):
```
ogiveLenInFreebore = min(ogiveLength/1000, L_freebore_m)
V_throat_m3 = A_groove·L_freebore_m − (1/3)·A_groove·ogiveLenInFreebore
V0_m3 = max(V_case_empty·0.1, V_case_empty − bulletDisplacementVolumeM3 + V_throat_m3)
```

### 3.7 Friction & gradient pre-computation

**Shoulder-angle gradient term:**
```
shoulder_gradient_term = shoulderGradientCoeff · (1 + tan(shoulderAngleRad)/tan(30°))
```

**Bearing-length aspect friction normalisation** (copper-jacket unit-pressure relaxes
on long bearings — a power law with exponent < 1):
```
REF_BEARING_BORE_RATIO = 1.49        (.308 168-gr ELD-M reference)
bearing_bore_ratio     = L_bearing_m / d_bullet_m
BEARING_ASPECT_CORRECTION = (mono-copper & bearingAspectCorrectionMono set)
                              ? bearingAspectCorrectionMono
                              : (bearingAspectCorrection ?? 0.15)
bearing_friction_scale = (REF_BEARING_BORE_RATIO / max(0.5, bearing_bore_ratio))^BEARING_ASPECT_CORRECTION
F_static_base_N        = landFrictionScale · landFrictionPressure · bearing_friction_scale
A_contact_m2           = π · d_bullet_m · L_bearing_m · bearing_friction_scale
```

**Pidduck-Kent factors** (hoisted — ω is constant per simulation):
```
pk_omega_const = m_charge_kg / m_bullet_kg
{ fKe, alphaMean, betaBreech } = pidduckKentFactors(pk_omega_const)
pk_fKe_scaled       = fKe · fKeScale
beta_gradient_const = (beta − 1) · gradientBetaScale
pk_gradient_static  = pk_omega_const · alphaMean · (1 + shoulder_gradient_term · beta_gradient_const)
pk_breech_mult_const = 1 + pk_omega_const · betaBreech · pkBreechMultScale
effective_decay_rate = max(0, gradientDecayRate − betaDecayScale · max(0, beta − betaDecayRef))
```

`pidduckKentFactors(ω)` (see §3.11) solves `tan θ = θ·(1 + ω/3)` by Newton iteration
and returns the exact gas-flow correction factors; at ω→0 they reduce to the Lagrange
limits `fKe=1/3, alphaMean=1/3, betaBreech=1/2`.

### 3.8 State vector and initial conditions

The integrator advances a **15-component state vector** (`N_STATE = 15`). The first
five are the physical ODE; the remaining ten are energy-accounting integrators
carried along so the final energy budget is exact.

| idx | Symbol | Unit | Meaning |
|---|---|---|---|
| 0 | `x_bullet_m` | m | Bullet base position from case head |
| 1 | `v_bullet_mps` | m/s | Bullet velocity ← **muzzle velocity output** |
| 2 | `m_unburned_kg` | kg | Remaining unburned propellant |
| 3 | `E_wall_J` | J | Cumulative wall heat loss |
| 4 | `x_flame_m` | m | Ignition flame-front position in the charge column |
| 5 | `E_friction_J` | J | Cumulative friction work (static + radial) |
| 6 | `E_engrave_J` | J | Cumulative engraving work |
| 7 | `E_chem_J` | J | Integrated chemical energy released (propellant burned) |
| 8 | `E_primer_gas_J` | J | Integrated primer gas energy |
| 9 | `E_bulletKE_J` | J | Integrated bullet KE |
| 10 | `E_gasKE_J` | J | Integrated gas KE |
| 11 | `E_gasInternal_J` | J | Integrated gas internal energy |
| 12 | `E_primerLeak_J` | J | Integrated primer flame (leak) energy |
| 13 | `E_frictionStatic_J` | J | Integrated static-friction work |
| 14 | `E_frictionRadial_J` | J | Integrated radial-friction work |

Initial values (`PRIMER_IGNITED_FRAC = primerIgnitedFraction`, `PRIMER_FLAME_SPLIT = primerFlameSplit`):
```
E_chem_init         = m_charge_kg · PRIMER_IGNITED_FRAC · q_explosion_Jkg
E_primer_gas_init   = primerEnergyJ · (1 − PRIMER_FLAME_SPLIT)
E_primer_leak_init  = primerEnergyJ · PRIMER_FLAME_SPLIT
x_flame_initial_m   = flashHoleMm / 1000

y[0..4]  = [ 0, 0, m_charge_kg·(1−PRIMER_IGNITED_FRAC), 0, x_flame_initial_m ]
y[5..6]  = [ 0, 0 ]
y[7]     = E_chem_init
y[8]     = E_primer_gas_init
y[9..10] = [ 0, 0 ]
y[11]    = E_chem_init + E_primer_gas_init
y[12]    = E_primer_leak_init
y[13..14] = [ 0, 0 ]
```

### 3.9 Integration scheme — Runge-Kutta-Fehlberg 4(5), adaptive

The engine uses **RKF45** (adaptive embedded 4th/5th-order), *not* fixed-step RK4.
Internal ballistics is stiff: pressure spikes from atmospheric to 400+ MPa in the
first ~1 ms, so the step must shrink to < 1 µs during ignition and grow during the
expansion stroke.

**Butcher coefficients** (`A2..A6`, `B21..B65`) are the classical Fehlberg values.
The 5th-order solution weights are `CT1=16/135, CT3=6656/12825, CT4=28561/56430,
CT5=−9/50, CT6=2/55`. Local truncation error is formed directly from the
5th-minus-4th weight differences `ERR1=1/360, ERR3=−128/4275, ERR4=−2197/75240,
ERR5=1/50, ERR6=2/55` (avoids allocating the 4th-order vector).

**Six stages per step** (`k1..k6`), each a call to `deriv()`:
```
deriv(t, y, k1)
y_tmp = y + h·B21·k1                              ; deriv(t+A2·h, y_tmp, k2)
y_tmp = y + h·(B31·k1+B32·k2)                     ; deriv(t+A3·h, y_tmp, k3)
y_tmp = y + h·(B41·k1+B42·k2+B43·k3)              ; deriv(t+A4·h, y_tmp, k4)
y_tmp = y + h·(B51·k1+B52·k2+B53·k3+B54·k4)       ; deriv(t+A5·h, y_tmp, k5)
y_tmp = y + h·(B61·k1+…+B65·k5)                   ; deriv(t+A6·h, y_tmp, k6)
y_next = y + h·(CT1·k1+CT3·k3+CT4·k4+CT5·k5+CT6·k6)   (5th-order)
```

**Error control** (only the four physical states 0–3 contribute; the flame state 4 is
excluded because its small atol spuriously dominates early on):
```
for i in 0..3:
    diff = h·(ERR1·k1[i]+ERR3·k3[i]+ERR4·k4[i]+ERR5·k5[i]+ERR6·k6[i])
    sc   = atols[i] + rtol · max(|y[i]|, |y_next[i]|)
    err  = max(err, |diff|/sc)

rtol  = 1e-4
atols = [1e-6, 1e-3, 1e-6, 1.0, 1e-5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]   (per index)
```

**Step accept/reject** (standard controller with a stall guard):
```
forceAccept = h ≤ H_MIN_FORCE (1e-9)
if err ≤ 1 or forceAccept:  accept → t += h ; swap y_cur/y_next
    grow: h_step = h · clamp(0.84·err^−0.2, 1, 4)
else:                       reject
    shrink: h_step = h · clamp(0.84·err^−0.2, 0.1, 0.5) ; floor at H_MIN_FORCE
```

Step size is also capped to `max_step = 2e-5` s, to `t_max − t`, and — while the
bullet is moving — to `1.1 × (distance-to-muzzle / v)` (this cap only *tightens*, never
re-expands, to avoid a limit-cycle stall). Loop terminates when `t ≥ t_max (0.025 s)`,
the bullet reaches `L_barrel`, or `steps > maxSteps (10000)` (sets `didTimeout`). A
force-accept floor `H_MIN_FORCE` prevents infinite spinning on stiff loads.

At burnout the remaining mass is snapped to zero when `y[2] < m_charge_kg·1e-3`
(the asymptotic burn tail never mathematically reaches zero). On the step that first
crosses `L_barrel`, velocity and position are linearly interpolated back to exactly
`L_barrel`.

### 3.10 The derivative function `deriv(t, state, out)` — evaluation order

Every stage of every step calls `deriv`. Its internal order is the physical heart of
the engine.

**(a) Unpack + burned mass**
```
x, v, m_unburned, E_wall, x_flame = state[0..4]
if x ≥ L_barrel:  out[*] = 0 ; return       (bullet has exited)
m_unburned_clamped = max(0, m_unburned)
m_burned = m_charge_kg − m_unburned_clamped
```

**(b) Primer energy split** (delivered linearly over `primerBurnTime`):
```
if t < PRIMER_BURN_TIME:
    E_primer_decay  = primerEnergyJ · (1 − t/PRIMER_BURN_TIME)
    E_primer_gas    = E_primer_decay · (1 − PRIMER_FLAME_SPLIT)     → to EOS
    E_primer_flame  = E_primer_decay · PRIMER_FLAME_SPLIT           → drives flame front
```

**(c) Mean chamber pressure** — `computePressure(...)` (§3.11). Returns `P_mean_Pa`
and `T_gas_K`. Friction/engrave work states 5,6 are passed in **only when
`conserveFrictionWork` is true** (debited from gas energy).

**(d) Travel-dependent Lagrange gradient → base pressure**
```
V_total       = V0 + A_groove·max(0,x)
r_expansion   = V0 / max(V0·0.1, V_total)                     (≈1 at breech → ~0.05 at muzzle)
gradient_decay = effective_decay_rate>0 ? r_expansion^effective_decay_rate : 1
frac_burned_pk = m_burned / (m_burned + m_unburned_clamped)
pk_base_denom  = 1 + pk_gradient_static · gradient_decay · frac_burned_pk
P_base_Pa      = P_mean_Pa / pk_base_denom
```

**(e) Flame-front ODE** (ignition propagation through the charge column):
```
x_flame_clamped = clamp(x_flame, 0, L_powder_col)
frac_ignited    = min(1, x_flame_clamped / L_powder_col)
if x_flame_clamped < L_powder_col:
    flame_pressure_factor = (max(1, P_mean)/flamePressureRef)^flamePressureExponent
    flame_primer_boost    = E_primer_flame / primerEnergyJ
    x_flame_dot = flameSpeedRef · flame_pressure_factor · flameDensityFactor · (1 + flame_primer_boost)
else: x_flame_dot = 0
```

**(f) Mass burn rate** (Vieille / Saint-Robert law, gated by quench + flame):
```
flame_still_spreading = frac_ignited < 1
combustion_active     = P_mean ≥ quenchPressurePa  OR  t < PRIMER_BURN_TIME  OR  flame_still_spreading
if m_unburned_clamped > 0 and combustion_active:
    P_burn_MPa = P_mean / 1e6
    n_eff = nPressureSlope≠0
              ? clamp(burnExponent + nPressureSlope·ln(max(1e-3,P_burn_MPa)/nPressureRefMPa), 0.3, 1.2)
              : burnExponent
    densCoupling = DENS_K≠0 ? (loadingDensityKgM3 / (densityRefKgM3 ?? loadingDensityKgM3))^DENS_K : 1
    burn_rate   = burn_kinetic · densCoupling · P_burn_MPa^n_eff          (linear regression rate, m/s)
    frac_burned = 1 − m_unburned_clamped/m_charge_kg
    burn_form_factor = getFormFactor(grainType, frac_burned, ignitionBp, ignitionZ1, ignitionZ2, multiPerfProgressivity)
    burn_taper  = min(1, m_unburned_clamped / (m_charge_kg·burnTaperFraction))
    m_charge_dot = − burn_rate · burn_mass_scale · burn_form_factor · burn_taper · frac_ignited
```

`getFormFactor(grainType, Z, …)` — surface progressivity θ(Z):

| grainType | θ(Z) |
|---|---|
| `ball`, `flake` | `max(0.01, (1−Z)^{2/3})` (degressive) |
| `extrudedSinglePerf` | `1 + 0.3·Z` |
| `extrudedMultiPerf` | `1 + multiPerfProgressivity·Z` (0.8) |
| `extruded` (fallback) | `1 + 0.5·Z` |
| *unknown* | **throw** |

Custom multi-stage profile (when `ignitionBp, ignitionZ1, ignitionZ2` all valid,
`z1>0`, `z2>z1`):
```
Z<z1:        1 + bp·(Z/z1)
z1≤Z<z2:     (1+bp)·(1 − 0.5·(Z−z1)/(z2−z1))
Z≥z2:        max(0.01, 0.5·(1+bp)·(1 − ((Z−z2)/(1−z2))²))
```

**(g) Resistive forces** (only once past freebore, `x ≥ L_freebore`):
```
in_freebore = x < L_freebore_m
if not in_freebore:
    x_engrave    = x − L_freebore_m
    engrave_ramp = min(1, x_engrave / 0.0005)          (0.5 mm smoothing to avoid RKF discontinuity)
    F_engrave = getEngravingForce(engravingPressurePa, x_engrave, A_bore) · engrave_ramp
    F_static  = F_static_base_N · d_bullet · L_bearing · engrave_ramp · staticFrictionScale
    F_radial  = radialFrictionCoeff · P_base · A_contact_m2 · engrave_ramp · radialFrictionScale
F_friction = F_static + F_radial
```

`getEngravingForce(P_peak, x, A_bore)` — a C¹-continuous engraving-pressure profile
(independent of chamber pressure):
```
p_start = 0.40·P_peak ; p_slide = 0.20·P_peak ; x_peak = 0.00075 m ; k_decay = 1500
x < x_peak:  p = p_start + (P_peak − p_start)·0.5·(1 − cos(π·x/x_peak))   (raised cosine)
x ≥ x_peak:  Δx = x − x_peak ;  p = p_slide + (P_peak − p_slide)·(1 + k·Δx)·exp(−k·Δx)  (critically damped)
return p · A_bore
```

**(h) Bullet acceleration** (Newton's 2nd law on the base pressure):
```
F_net = P_base · A_groove − F_engrave − F_friction
a_bullet = F_net / m_bullet_eff_kg
   clamp: if x ≤ 0 and F_net < 0 → a = 0     (bullet cannot move backward out of the case)
          if v ≤ 0 and a < 0     → a = 0     (no negative velocity)
```

**(i) Heat loss** (convective + radiative, with boundary-layer insulation):
```
factor_bl   = 1 / (1 + boreInsulationRate·sqrt(max(0,x)))         (BL grows with travel)
A_bore_wall = π · d_bullet · max(0,x)
A_wall_eff  = A_chamber_m2 + A_bore_wall · factor_bl · boreGasTempFactor   (2/3)

V_free   = max(V0·0.05, V0 + A_groove·x − m_unburned_clamped/rho_propellant)
covolume = cfgCovolRef · (300/T_gas)^cfgCovolTExp
rho_gas  = m_burned / max(V_free·0.05, V_free − m_burned·covolume)

H_conv = H_CONV_BASE · rho_gas^0.8 · (max(0,v) + convectiveFlowVelocity)^0.8 · d_bullet^{−0.2}
Q_conv = H_conv · A_wall_eff · (T_gas − T_WALL_K)
Q_rad  = emissivity · SIGMA · A_wall_eff · (T_gas^4 − T_WALL_K^4)
E_wall_dot = Q_conv + Q_rad
```
where the convection base is geometry-scaled to the .308 reference:
```
bore_heat_ratio = (7.62 / boreDiameterMm)^0.4       (small-bore penalty, softened from 1.0)
cap_heat_ratio  = physicalWallScaling ? 1.0 : (3.625 / baseCapacityH2oGrams)
H_CONV_BASE     = heatTransferCoeff · bore_heat_ratio · cap_heat_ratio
```

**(j) Write derivatives** (`out[]`):
```
out[0] = v                                   (dx/dt)
out[1] = a_bullet                            (dv/dt)
out[2] = m_charge_dot                        (dm_unburned/dt)
out[3] = E_wall_dot                          (dE_wall/dt)
out[4] = x_flame_dot                         (dx_flame/dt)
out[5] = F_friction · v                      (friction power)
out[6] = F_engrave · v                       (engraving power)
out[7] = −m_charge_dot · q_explosion_Jkg     (chemical release rate)
out[8] = t<PRIMER_BURN_TIME ? −primerEnergyJ·(1−split)/PRIMER_BURN_TIME : 0
out[9]  = m_bullet_eff · v · a               (bullet KE rate)
out[10] = 0.5·(−m_charge_dot)·pk_fKe·v² + m_burned·pk_fKe·v·a   (gas KE rate)
out[11] = out[7] + out[8] − out[9] − out[10] − E_wall_dot − (conserveFrictionWork ? out[5]+out[6] : 0)   (gas internal rate)
out[12] = t<PRIMER_BURN_TIME ? +primerEnergyJ·(1−split)/PRIMER_BURN_TIME : 0   (primer leak)
out[13] = F_static · v ; out[14] = F_radial · v
```

Index 11 (`E_gas_internal`) is the running energy balance: chemical + primer-gas in,
minus bullet KE, gas KE, wall loss, and (optionally) friction+engraving work.

### 3.11 `computePressure` — the equation of state (called from deriv & recorder)

This is the pressure kernel. It converts the current energy state into a mean gas
pressure via a **Noble-Abel EOS with temperature-dependent γ(T) and covolume** and a
Pidduck-Kent effective KE mass.

```
E_chem_J    = m_burned·q + E_primer_gas
m_effective = m_bullet_eff + m_burned·fKe_in            (PK KE mass, burned-fraction weighted)
E_kinetic   = 0.5·m_effective·v²
E_gas_J     = max(1, E_chem_J − E_kinetic − E_wall − E_friction − E_engrave)   (friction/engrave only if conserveFrictionWork)

{ gamma, T_gas_K, heldJ } = solveGasThermo(E_gas_J, m_burned)
covolume    = cfgCovolRef · (COVOLUME_T_REF / T_gas_K)^cfgCovolTExp
V_free_m3   = max(V0·0.05, V0 + A_groove·x − m_unburned/rho_propellant)
pressure    = ((gamma − 1)·(E_gas_J − heldJ)) / max(V_free·0.05, V_free − m_burned·covolume)
```

**γ(T) and gas thermodynamics** — `solveGasThermo(E_gas, m_burned)` closes the coupled
`γ(T) ↔ T ↔ C_v` system by fixed-point iteration (bootstrap with midpoint γ, then 3
passes; 6 when the recombination term is active):
```
gammaOfT(T) = GAMMA_FROZEN + (GAMMA_HOT − GAMMA_FROZEN) / (1 + exp(−GAMMA_STEEPNESS·(T − GAMMA_T_HALF)))
C_v          = R_SPECIFIC / (gamma − 1)
heldJ        = φ_eff · χ(T) · m_burned · RECOMB_QREF_JKG          (0 when φ_eff = 0)
χ(T)         = 1 / (1 + exp(−(T − recombTK)/recombWK))            (sigmoid, hot-gated)
T_gas        = clamp((E_gas − heldJ) / (m_burned·C_v), 300, 4000) (K)
```

**Shifting-equilibrium recombination reservoir** (SHIPPED 2026-07-27). The frozen-composition
model deposits full Qex instantly and lets none of it hide chemically. Real propellant gas
holds part of its energy in dissociated species near peak temperature and returns it as
sensible energy while the gas cools down the bore — the classic equilibrium-flow vs
frozen-flow distinction. `heldJ` implements this quasi-statically (reservoir slaved to T, no
extra ODE state): energy is sequestered while hot (χ→1) and re-enters pressure automatically
during expansion (χ→0), fattening the late-bore pressure tail without moving the matched
peak. It converges inside the fixed-point because sequestration lowers T which lowers χ.
The effective fraction is **level-gated** exactly like K(P) (cell-constant, never in-shot):
```
φ_eff = recombPhi · clamp((pressureLevelMPa − recombL0MPa)/(recombL1MPa − recombL0MPa), 0, 1)
        (pressureLevelMPa absent → φ_eff = 0 → prior frozen-composition behavior)
```
**Per-powder thermochem mode** (SHIPPED 2026-07-27, `recombTcRel = 1.0`): the χ center and the
reservoir energy are per-powder —
```
T_ad  = Qex_powder · (GAMMA_HOT − 1) / R_SPECIFIC      (adiabatic flame temperature, K)
Tc    = recombTcRel · T_ad                              (cool powders recombine lower)
Qref  = Qex_powder                                      (powder's own heat of explosion, J/kg)
```
Fleet-average T_ad ≈ 2,350–2,400 K reproduces the absolute-mode center at REL = 1.0 (zero new
fitted DOF); the spread (H50BMG 2,071 K ↔ Superformance 2,778 K) is what centers the flame-temp
outlier powders. `recombTcRel = 0` restores absolute mode (`recombTK`, fixed Qref 3.8e6).

Defaults: `recombPhi 0.4, recombL0MPa 300, recombL1MPa 340, recombTcRel 1.0, recombWK 250 K`
(`recombTK 2400 K` used only in absolute mode). Fleet verdict
at ship: P-MAE 3285→3190, corrV-MAE 51.3→50.9, fleet dV/dc 0.751→0.769, monolithic pressure
gap −37%; the GBS global velocity factor shrank 1.0745→1.0436 and its rising expR≥18 tail
vanished — the empirical correction had been proxying this missing physics. Harness env:
`RECOMB_PHI / RECOMB_L0 / RECOMB_L1` (experiments only; absence inherits engine defaults).

**Pidduck-Kent** — replaces the Lagrange (linear gas-velocity) approximation with the
exact 1922/1938 solution. `solvePidduckKentTheta(ω)` solves
`tan θ = θ·(1 + ω/3)` by ≤12 Newton steps (bounded to just under π/2). Then
`pidduckKentFactors(ω)`:
```
fKe        = (0.5 − sin(2θ)/(4θ)) / sin²θ            (gas KE fraction ; Lagrange limit 1/3)
alphaMean  = (sinθ/θ − cosθ) / (θ·sinθ)              (mean-to-base ; limit 1/3)
betaBreech = (1 − cosθ) / (θ·sinθ)                   (breech-to-base ; limit 1/2)
```

### 3.12 Pressure history, peak, and reporting

The **reported** pressure at each accepted step and at initialisation is the **breech**
pressure scaled by the transducer factor:
```
P_base   = P_mean / (1 + pk_gradient_static·gradient_decay·frac_burned)     (travel-dependent)
P_breech = P_base · pk_breech_mult_const
pPa      = P_breech · transducerScaleFactor
peakPressurePa = max over all steps of pPa
```
The initial breech pressure is computed before the loop from
`m_charge_kg·PRIMER_IGNITED_FRAC` burned mass and seeds `peakPressurePa`.

### 3.13 Bore-exit / muzzle conditions & how velocity falls out

* The loop stops when `y[0] ≥ L_barrel`; on that crossing, `y[1]` (velocity) and
  `y[0]` (position) are linearly interpolated to the exact muzzle. **`muzzleVelocityMps
  = y_cur[1]`** — the raw muzzle velocity is simply the velocity state at exit. No fit,
  no closed-form; it is the integral of `a_bullet` over the whole stroke.
* An early break also fires if the bullet has essentially stopped (`v ≤ 1e-4`) after
  the primer window with pressure below quench (`P_mean < quenchPressurePa`) — a
  squib/no-launch condition.
* `burnedPct = (1 − max(0,y[2])/m_charge_kg)·100`.
* `timeToExitMs = t·1000`.
* `burnoutPositionMm` is recorded (mm from chamber) at the first step where remaining
  mass hits zero, else `−1` (bullet exited while powder was still burning).

---

## 4. Configuration — `EngineConfig` / `DEFAULT_ENGINE_CONFIG`

The engine carries **no defaults of its own**. Every calibration knob is supplied on
`inputs.engineConfig`. The canonical set is `DEFAULT_ENGINE_CONFIG` (exported from the
engine, passed by `buildSimulationInputs` when a caller supplies none). Current shipped
values and physical meaning:

### 4.1 Heat transfer

| Field | Default | Physical role |
|---|---|---|
| `emissivity` | `0.12` | Gas-phase emissivity for radiative loss (NC/NG products, *not* steel) |
| `convectiveFlowVelocity` | `30.0` | m/s flow offset so convection is non-zero while the bullet is stationary |
| `heatTransferCoeff` | `6.5` | Dittus-Boelter convective pre-factor (`H_CONV_BASE`). Lowered from 8.5 to cut expansion-stroke over-cooling |
| `boreInsulationRate` | `1.8` | Boundary-layer growth rate (`factor_bl = 1/(1+k·√x)`) |
| `boreGasTempFactor` | `2/3` | Axial gas-temperature gradient factor on the swept bore area |

### 4.2 Combustion

| Field | Default | Physical role |
|---|---|---|
| `vieilleScaleCoeff` | `270.0` | Burn-rate mass-scaling constant (`burn_mass_scale`) |
| `nPressureSlope` | `0.0` | Pressure-dependent Vieille exponent slope; 0 ⇒ fixed exponent (bit-identical) |
| `nPressureRefMPa` | `300.0` | Reference pressure for the n(P) log term |
| `nPressureOneSided` | `false` | If true, n(P) slope applies only above the reference |
| `densityCouplingK` | `0.6` | Loading-density burn coupling exponent (cell-relative) |
| `densityCouplingRefKgM3` | `600.0` | Retained for config shape; unused by cell-relative form |
| `kpSlopePerMPa` | `0.016237` | K(P) level-law slope |
| `kpCrossoverMPa` | `283.62` | K(P) crossover pressure |
| `kpFloorK` | `−0.6869` | K(P) lower clamp |
| `covolumeRefM3Kg` | `0.00095` | Noble-Abel reference covolume |
| `covolumeTExp` | `0.38` | Covolume temperature exponent |
| `grainSurfaceExponent` | `1.0` | Exponent on charge mass in burn-rate scaling |
| `burnTaperFraction` | `0.01` | Fraction of charge at which burn tapers to zero |
| `primerIgnitedFraction` | `0.01` | Fraction of charge pre-ignited by the primer at t=0 |
| `geometryBurnCorrection` | `0.05` | Exponent of β in the geometry burn-area adjustment |
| `multiPerfProgressivity` | `0.8` | Progressivity slope for multi-perf grains |

### 4.3 Friction & pressure gradient

| Field | Default | Physical role |
|---|---|---|
| `landFrictionPressure` | `2.5e6` | Static friction stress base (N/m²) |
| `landFrictionScale` | `0.01` | Multiplier on static friction |
| `radialFrictionCoeff` | `0.04` | Poisson radial-expansion friction coefficient (× `P_base`) |
| `bearingAspectCorrection` | `0.5` | Exponent for bearing-length/bore aspect friction normalisation (0=none, 0.5=sqrt) |
| `bearingAspectCorrectionMono` | *(unset)* | Aspect exponent variant for solid-copper monolithics; disconfirmed, inert by default |
| `shoulderGradientCoeff` | `0.075` | Scales the shoulder-angle Lagrange gradient term |
| `gradientDecayRate` | `1.0` | Power-law exponent for travel-dependent gradient relaxation |
| `betaDecayScale` | `0.0` | Reduces decay rate for high-β overbore cases (keeps gradient stronger longer) |
| `betaDecayRef` | `1.5` | β below which no decay amplification is applied |

### 4.4 Flame front & energy accounting

| Field | Default | Physical role |
|---|---|---|
| `flameSpeedRef` | `800.0` | Reference flame propagation speed (m/s) |
| `flamePressureRef` | `100e6` | Reference pressure for flame-speed coupling (Pa) |
| `flamePressureExponent` | `0.35` | Pressure exponent for flame velocity |
| `flameDensityExponent` | `−0.3` | Loading-density exponent (denser packing slows flame) |
| `primerFlameSplit` | `0.85` | Fraction of primer energy driving ignition (vs direct gas heating) |
| `primerBurnTime` | `0.0006` | Primer energy delivery window (s) |
| `pkBreechMultScale` | `1.0` | Scale on the breech-reporting pressure multiplier |
| `fKeScale` | `1.0` | Scale on the Pidduck-Kent gas-KE fraction |
| `conserveFrictionWork` | `true` | If true, friction + engraving work is debited from gas energy (energy-conservative regime) |
| `staticFrictionScale` | `1.0` | Extra multiplier on static friction |
| `radialFrictionScale` | `0.86` | Extra multiplier on radial friction |
| `physicalWallScaling` | `true` | If true, drop the capacity term from heat-geometry scaling (`cap_heat_ratio = 1`) |

> **Production-regime note.** `conserveFrictionWork = true` is the shipped/production
> default: friction and engraving work are subtracted from `E_gas` (reducing pressure
> and velocity). Calibration harness runs that fit burn parameters with this OFF and
> then run production ON introduce a known ~44 fps "loads read slow" bias — the fit
> regime must match the run regime.

### 4.5 Expansion-factor clamp constants (exported)

| Constant | Value | Role |
|---|---|---|
| `EXPANSION_REF_RATIO` | `10.0` | Expansion ratio where `burnAreaExpansionSlope` correction is zero |
| `EXPANSION_FACTOR_MIN` | `0.5` | Lower clamp on the expansion factor |
| `EXPANSION_FACTOR_MAX` | `1.8` | Upper clamp on the expansion factor |

---

## 5. Outputs — `InternalBallisticsResult`

| Field | Unit | Meaning |
|---|---|---|
| `muzzleVelocityMps` | m/s | **Raw** muzzle velocity (velocity state at exit) — before `correctVelocity` |
| `peakPressurePa` | Pa | Peak reported (breech × transducer) pressure over the shot |
| `burnedPct` | % | Fraction of charge consumed at exit |
| `timeToExitMs` | ms | Time to muzzle |
| `burnoutPositionMm` | mm | Position of complete combustion (−1 if unburned at muzzle) |
| `travelData[]` | — | Per-inch (25.4 mm) interpolated `{travelMm, timeMs, pressurePa, velocityMps, burnedPct}` |
| `curveData[]` | — | Downsampled (~100 pt) history preserving peak-pressure, burnout, start, end |
| `didTimeout` | bool | True only if `maxSteps` exceeded |
| `stepCount` | — | Accepted+rejected step count |

**Energy breakdown** (final-state, at exit):

| Field | Meaning |
|---|---|
| `finalEHeatJ` | Wall heat loss `y[3]` |
| `finalEFrictionJ` / `finalEFrictionStaticJ` / `finalEFrictionRadialJ` | Friction work `y[5]`, `y[13]`, `y[14]` |
| `finalEEngraveJ` | Engraving work `y[6]` |
| `finalEBulletKEJ` | `0.5·m_bullet_eff·v²` |
| `finalEGasKEJ` | `0.5·m_burned·pk_fKe·v²` |
| `finalEGasInternalJ` | `E_chem − (bulletKE+gasKE) − E_wall − (friction+engrave if conserved)` |
| `finalEUnburnedChemJ` | `y[2]·q` (chemical energy left in unburned powder) |
| `finalEPrimerInJ` | Primer energy input |
| `integratedE*J` | The path-integrated energy states `y[7..12]` (audit trail) |
| `calculatedV0EmptyH2oGrains` | `V_case_empty·1e6·15.43235835` |
| `calculatedAChamberM2` | Chamber wetted area used for heat loss |
| `calculatedBeta` | β actually used |

`getPrimerEnergyJ(primerPocketId, brisanceEnergyJ?)` is also exported: brisance wins;
else small → 8 J, large → 14 J, unknown → throw.

---

## 6. Post-Engine Velocity Correction

### 6.1 Why it exists

The 0-D pressure-primary engine structurally **under-predicts muzzle velocity for
overbore cartridges** and carries a per-cartridge bullet-weight-dependent bias. This
is not a pressure error — peak pressure matches transducer data. So the correction is
applied to **velocity only, after the engine**, and **pressure is never touched**. Call
it immediately after `runInternalBallisticsSimulation()` and before any consumer reads
velocity.

### 6.2 `correctVelocity(...)` resolution order

```
correctVelocity(rawVelocityMps, expansionRatio, cartridgeId, params,
                bulletWeightGrams?, powderId?, bulletMaterialType?, simPressurePsi?)
```

1. **Per-cartridge override** (`params.cartridgeOverrides[cartridgeId]`), if present:
   * Start from cartridge `factor` / `weightSlope` / `refWeightGrams` / bounds.
   * **Powder override** (`powderOverrides[powderId]`) supersedes *wholesale* (factor,
     slope, ref, and — if present — its own p10/p90 bounds). A powder cell that omits a
     slope is deliberately flat (the weight correlation was rejected); it does **not**
     inherit the cartridge slope. Bounds *do* fall back to the cartridge's.
   * **Construction override** (`classifyBulletConstruction(materialType)` → `mono`/`lead`):
     the construction cell from the most specific level (powder first, else cartridge)
     supersedes wholesale.
   * **Weight slope** (if slope, ref, weight all present):
     `rawFactor = baseFactor + slope·(bulletWeightGrams − refWeightGrams)`, clamped to
     the cell's `[weightFactorMin, weightFactorMax]` **before** the global clamp.
   * `factor = clampFactor(rawFactor)` where `clampFactor` bounds to
     `[FACTOR_FLOOR=0.85, FACTOR_CAP=1.15]`.
   * **dV/dc pressure ramp** (symmetric), if `pressureRampSlope` + `simPressurePsi` +
     cell `meanSimPressurePsi`/`stdSimPressurePsi` are all present:
     ```
     z        = (simPressurePsi − meanSimPressurePsi) / stdSimPressurePsi
     rampMult = clamp(exp(pressureRampSlope · z), 0.95, 1.05)     (PRESSURE_RAMP_MULT_MIN/MAX)
     factor   = clampFactor(factor · rampMult)
     ```
     This cools loads whose simulated pressure is below the cell mean (z<0) and warms
     those above it (z>0), pivoting on the mean so the cell level is unchanged. It is
     the charge/pressure slope the 0-D engine cannot produce; fitted on abundant
     velocity data (not pressure). Call sites pass `peakPressurePa · PA_TO_PSI`
     (`PA_TO_PSI = 0.0001450377`).
   * Returns `{ correctedVelocityMps: raw·factor, correctionFactor: factor, correctionTier: "FITTED" }`.

2. **Global fallback** (no cartridge override): a monotone **piecewise-linear function
   of expansion ratio** over `params.globalKnots` (sorted ascending, factors
   non-decreasing). `evaluateGlobalFunction(expR, knots)`:
   * Below the first knot: if `|factor−1| < 0.005` → `NONE` (no correction), else
     `EXTRAPOLATED`.
   * Above the last knot: linear extrapolation from the last two knots, `clampFactor`,
     tier `EXTRAPOLATED`.
   * Between knots: linear interpolation, tier `INTERPOLATED`.
   * Empty knots → `NONE`, factor 1.0.

### 6.3 Model shape

* `CartridgeOverride`: `factor`, `confidence`, `weightSlope`, `refWeightGrams`,
  `weightFactorMin/Max`, `powderOverrides`, `constructionOverrides`, cell pressure
  stats.
* `PowderOverride` / `ConstructionOverride`: same factor/slope/bounds shape, one level
  down.
* `CorrectionParams` (stored in `tuning.velocityCorrection`): `modelVersion`,
  `globalKnots`, `cartridgeOverrides`, `fittedAt`, `validationR2`, `heldOutMaeFps`,
  `pressureRampSlope`.

**Expansion ratio** used as the global key:
`computeExpansionRatio(caseCapacityGramsH2O, boreDiameterMm) = caseCapacityGramsH2O /
(π·(boreDiameterMm/20)²)` — the same `cc / cm²` used by calibration and by the engine's
internal `expansion_ratio`.

---

## Appendix A — Engine Constants Quick Reference

| Constant | Value | Where |
|---|---|---|
| `rtol` | `1e-4` | RKF45 error control |
| `atols[0..4]` | `1e-6, 1e-3, 1e-6, 1.0, 1e-5` | position, velocity, mass, heat, flame |
| `max_step` | `2e-5` s | Step cap |
| `t_max` | `0.025` s | 25 ms hard time limit |
| `maxSteps` | `10000` | Loop iteration cap |
| `H_MIN_FORCE` | `1e-9` s | Force-accept floor |
| `N_STATE` | `15` | State vector length |
| `x_peak` (engraving) | `0.00075` m | Engraving peak position |
| `k_decay` (engraving) | `1500` | Engraving post-peak decay |
| `engrave_ramp` width | `0.0005` m | Force smoothing distance |
| `FILL_LIMIT` | `1.25` | 125 % fill-fraction ceiling (throws above) |
| `FILL_REF` | `0.50` | Reference fill for `burnAreaFillSlope` |
| `REF_BORE_MM` | `7.62` | Bore reference (.308) |
| `REF_CAPACITY_G` | `3.625` | Capacity reference (.308) |
| `REF_BEARING_BORE_RATIO` | `1.49` | Bearing aspect reference |
| `EXPANSION_REF_RATIO` | `10.0` | Expansion-slope zero point |
| `GRAINS_TO_GRAMS` | `0.06479891` | Grains → grams |
| `FACTOR_FLOOR` / `FACTOR_CAP` | `0.85` / `1.15` | Velocity-correction clamp |
| `PRESSURE_RAMP_MULT_MIN/MAX` | `0.95` / `1.05` | dV/dc ramp clamp |
| `PA_TO_PSI` | `0.0001450377` | Pa → PSI |
