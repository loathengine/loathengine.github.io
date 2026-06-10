# Empirical Precision — Database Schema Reference

This document is the canonical technical reference for all IndexedDB tables and the `master-db.json` structure.

**Convention:** All field names use **camelCase**. All IDs are strings. Optional fields are marked with `?`.

Tables marked **[master-db]** are seeded from the open-source library. Tables marked **[user-only]** are created locally and never appear in `master-db.json`.

---

## Manufacturers [master-db]

```json
{
  "id": "MAN_REF_MFG_A",
  "name": "Reference Manufacturer A",
  "displayName": "Ref Mfg A",
  "type": ["powder", "bullet"]
}
```

* `displayName`? — optional shorthand display name string
* `type`? — array of strings. Valid values: `bullet`, `powder`, `primer`, `brass`, `ammo`

Dexie index: `id`

---

## Diameters [master-db]

```json
{
  "id": "DIA_REF_308_XBM7",
  "imperial": ".308",
  "metric": "7.62mm"
}
```

Dexie index: `id`

---

## Cartridges [master-db]

```json
{
  "id": "CTG_REF_308_cC82",
  "name": "Reference Cartridge A",
  "diameterId": "DIA_REF_308_XBM7",
  "minCaseLengthMm": 50.80,
  "maxCaseLengthMm": 51.18,
  "trimLengthMm": 50.92,
  "oalMm": 71.12,
  "maxSaamiPa": 427473864.66,
  "baseCapacityH2oGrams": 3.6287,
  "boreDiameterMm": 7.62,
  "bulletDiameterMm": 7.82,
  "burnRateMultiplier": 1.0,
  "gradientScale": 0.15
}
```

* All length and diameter fields are in millimeters
* `minCaseLengthMm`? — minimum case length in millimeters
* `maxCaseLengthMm`? — maximum case length in millimeters
* `trimLengthMm`? — case trim-to length in millimeters
* `oalMm`? — nominal overall length in millimeters
* `maxSaamiPa`? — SAAMI maximum average pressure in Pascals (Pa)
* `baseCapacityH2oGrams`? — case water capacity in grams of H2O
* `boreDiameterMm`? — land-to-land bore diameter in millimeters (NOT groove/bullet diameter). Source: SAAMI spec sheets
* `bulletDiameterMm`? — nominal projectile diameter in millimeters
* `burnRateMultiplier`? — scaling factor for internal ballistics simulator burn rates
* `gradientScale`? — optional scaling coefficient for geometry Lagrange pressure gradient in internal ballistics

Dexie index: `id, diameterId`

---

## Bullets [master-db]

```json
{
  "id": "BUL_REF_BULLET_A",
  "manufacturerId": "MAN_REF_MFG_A",
  "diameterId": "DIA_REF_308_XBM7",
  "name": "Reference Bullet A",
  "advertisedWeightGrains": 175,
  "physis": {
    "weightGrams": 11.34,
    "overallLengthMm": 35.0,
    "ogiveLengthMm": 17.97,
    "boatTailLengthMm": 4.7,
    "tipLengthMm": null,
    "meplatDiameterMm": 1.5,
    "bearingSurfaceMm": 12.33,
    "materialType": "jacketed_lead"
  },
  "ballistics": {
    "preferredModel": "G7",
    "g1BC": 0.505,
    "g7BC": 0.258,
    "g1FF": null,
    "g7FF": null
  },
  "stability": {
    "ix": null,
    "iy": null
  }
}
```

* `advertisedWeightGrains`? — bullet weight in grains as labeled by manufacturer
* All length and diameter fields in `physis` are in millimeters
* `physis.weightGrams` — bullet weight in grams
* `physis.bearingSurfaceMm`? — length of the bullet bearing surface in millimeters
* `physis.tipLengthMm`? — for tipped bullets: the plastic tip length only in millimeters (not included in aerodynamic metal length)
* `physis.materialType`? — bullet jacket/construction material. Valid values: `"jacketed_lead"`, `"monolithic_copper"`, `"cast_lead"`. Used to scale engraving resistance in internal ballistics simulation.
* `ballistics.g1FF`? / `ballistics.g7FF`? — form factors relative to G1/G7 standard projectile
* `stability.ix`? / `stability.iy`? — moments of inertia (kg·m²), used by stability calculator when available
* `ballistics.preferredModel`? — `"G1"` or `"G7"`. G7 is preferred for long-range boat-tail rifle bullets

Dexie index: `id, manufacturerId, diameterId`

---

## Powders [master-db]

```json
{
  "id": "PWD_REF_POWDER_A",
  "manufacturerId": "MAN_REF_MFG_A",
  "name": "Reference Powder A",
  "baCoeff": 0.2285,
  "kCoeff": 1.2311,
  "heatOfExplosionKjKg": 3585,
  "grainId": "GRN_EXTRUDED_SINGLEPERF",
  "propellantDensityKgM3": 1620,
  "bulkDensityKgM3": 920,
  "ignitionBa": 0.4857,
  "ignitionBp": 0.1489,
  "ignitionZ1": 0.5175,
  "ignitionZ2": 0.8298,
  "tempSensFactor": 0.002
}
```

* `baCoeff`? — ballistic action coefficient (internal ballistics simulator)
* `kCoeff`? — burn rate shape coefficient. Single-base (nitrocellulose only): `1.23`. Double-base (NC + nitroglycerin): `1.255`
* `heatOfExplosionKjKg`? — heat of explosion in kJ/kg. Single-base: `3580`. Double-base: `3950`
* `grainId`? — references `grain` collection (powder grain geometry)
* `propellantDensityKgM3`? — optional solid density of the powder material in kg/m³
* `bulkDensityKgM3`? — optional bulk density of the powder grains in kg/m³ (used to compute case fill percentage / loading density)
* `ignitionBa`? / `ignitionBp`? / `ignitionZ1`? / `ignitionZ2`? — optional ignition phase burn rate coefficients
* `tempSensFactor`? — optional temperature sensitivity factor

Dexie index: `id, manufacturerId`

---

## Grain [master-db]

```json
{
  "id": "GRN_EXTRUDED_SINGLEPERF",
  "grainType": "extrudedSinglePerf"
}
```

* `grainType` — allowed values: `"ball"`, `"flake"`, `"extrudedSinglePerf"`, `"extrudedMultiPerf"`, `"extruded"`

Dexie index: `id`

---

## Primers [master-db]

```json
{
  "id": "PRI_REF_PRIMER_A",
  "manufacturerId": "MAN_REF_MFG_A",
  "name": "Reference Primer A",
  "type": "large_rifle",
  "primerPocketId": "PKT_LRG",
  "energyJ": 14.0
}
```

* `type`? — primer size/type description string
* `primerPocketId`? — references `primerPockets` collection
* `energyJ`? — initial ignition spark energy in Joules (J). Used in internal ballistics simulation (typical Small: `8.0`, Large: `14.0`).

Dexie index: `id, manufacturerId`

---

## Primer Pockets [master-db]

```json
{
  "id": "PKT_LRG",
  "name": "LARGE"
}
```

Dexie index: `id`

---

## Primer Holes [master-db]

```json
{
  "id": "HL_080",
  "name": "0.080"
}
```

Dexie index: `id`

---

## Brass [master-db]

```json
{
  "id": "BRS_REF_BRASS_A",
  "manufacturerId": "MAN_REF_MFG_A",
  "cartridgeId": "CTG_REF_308_cC82",
  "primerPocketId": "PKT_LRG",
  "primerHoleId": "HL_080",
  "capacityH2oGrams": 3.6287
}
```

* `capacityH2oGrams`? — water capacity in grams of H2O

Dexie index: `id, cartridgeId, manufacturerId`

---

## Load Types [master-db]

Reference table. Two records: `LT_COMM` (commercial) and `LT_HAND` (handload).

```json
{
  "id": "LT_HAND",
  "name": "handload"
}
```

Dexie index: `id`

---

## Loads [master-db + user]

Commercial and handload records share the same table. Fields differ by type.

### Commercial Load Example
```json
{
  "id": "LOAD_REF_COMMERCIAL_A",
  "loadTypeId": "LT_COMM",
  "name": "Reference Commercial Load A",
  "cartridgeId": "CTG_REF_308_cC82",
  "bulletId": "BUL_REF_BULLET_A",
  "manufacturerId": "MAN_REF_MFG_A",
  "partNumber": "PN_REF_1234",
  "lot": "LOT_REF_5678",
  "coalMm": 71.12,
  "velocityMps": 792.48,
  "isCommercial": true,
  "notes": "Reference notes for commercial load"
}
```

### Handload Example
```json
{
  "id": "LOAD_REF_HANDLOAD_A",
  "loadTypeId": "LT_HAND",
  "name": "Reference Handload A",
  "handloadName": "Ref Handload A",
  "cartridgeId": "CTG_REF_308_cC82",
  "bulletId": "BUL_REF_BULLET_A",
  "powderId": "PWD_REF_POWDER_A",
  "primerId": "PRI_REF_PRIMER_A",
  "brassId": "BRS_REF_BRASS_A",
  "chargeWeightGrams": 2.7216,
  "coalMm": 71.12,
  "cbtoMm": 56.40,
  "velocityMps": 792.48,
  "isCommercial": false,
  "notes": "Reference notes for handload"
}
```

* `handloadName`? — specific custom user-facing handload nickname string
* `coalMm`? — Cartridge Overall Length in millimeters
* `cbtoMm`? — Cartridge Base-to-Ogive length in millimeters
* `chargeWeightGrams`? — propellant charge weight in grams
* `velocityMps`? — recorded average muzzle velocity in meters per second

Dexie index: `id, cartridgeId, bulletId, powderId`

---

## Firearms [user-only]

```json
{
  "id": "8f3b6c1d-2d4a-4e8a-8c7a-9b5d8f6c3e2a",
  "nickname": "Reference Rifle A",
  "cartridgeId": "CTG_REF_308_cC82",
  "barrelLengthMm": 609.6,
  "twistRateMm": 254.0,
  "sightOverBoreMm": 48.26
}
```

* `barrelLengthMm`? — barrel length in millimeters
* `twistRateMm`? — rifling twist rate in millimeters per turn (e.g., `254.0` means 1 turn in 254mm, which is a 1:10" twist)
* `sightOverBoreMm`? — scope centerline height above bore centerline in millimeters

Dexie index: `id, cartridgeId`

---

## Sessions [user-only]

One record per range visit.

```json
{
  "id": "c8b3d6f1-4e8a-4d7a-8b9c-2d3e4f5a6b7c",
  "name": "Reference Session A",
  "timestamp": "2026-05-30T12:00:00.000Z",
  "firearmId": "8f3b6c1d-2d4a-4e8a-8c7a-9b5d8f6c3e2a",
  "loadId": "LOAD_REF_HANDLOAD_A",
  "targetDistance": 100,
  "distanceUnits": "yards",
  "temp": 59.0,
  "altitude": 1000.0,
  "pressure": 29.92,
  "pressureType": "station"
}
```

* `temp`? — environmental temperature during session in Fahrenheit
* `altitude`? — local altitude in feet
* `pressure`? — station or barometric pressure in inches of mercury (inHg)
* `pressureType`? — description of pressure mapping (e.g. `"station"` or `"sea_level"`)

Dexie index: `id, firearmId, loadId, [firearmId+loadId]`

The compound index `[firearmId+loadId]` enables efficient queries like "all sessions for this exact firearm+load combination."

---

## Session Targets [user-only]

Links a target image to a session and stores the scale calibration.

```json
{
  "id": "e3a5f7d2-1c9b-4a8d-8e7f-3a2b1c0d9e8f",
  "sessionId": "c8b3d6f1-4e8a-4d7a-8b9c-2d3e4f5a6b7c",
  "targetImageId": "f2b4c6d8-0e2a-4b6c-8d0e-2a4b6c8d0e2a",
  "scale": {
    "p1": { "x": 100, "y": 200 },
    "p2": { "x": 300, "y": 200 },
    "distance": 2.0,
    "units": "in",
    "pixelsPerUnit": 100.0
  },
  "transform": { "scale": 1.0 }
}
```

* `scale.p1` / `scale.p2` — pixel coordinates of the two scale reference points on the canvas (or null)
* `scale.distance` — physical distance value between points (or null)
* `scale.pixelsPerUnit` — derived from the p1/p2 distance and the known physical distance (or null)

Dexie index: `id, sessionId`

---

## Groups [user-only]

One record per group of shots within a session.

```json
{
  "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "sessionId": "c8b3d6f1-4e8a-4d7a-8b9c-2d3e4f5a6b7c",
  "targetId": "e3a5f7d2-1c9b-4a8d-8e7f-3a2b1c0d9e8f",
  "groupNum": 1,
  "poa": { "x": 450.5, "y": 312.0 },
  "color": "#ef4444"
}
```

* `groupNum`? — order index of group
* `poa` — pixel coordinates of the point of aim on the target image (or null)
* `color` — hex color used to render this group on the composite plot

Dexie index: `id, sessionId`

---

## Shots [user-only]

One record per individual bullet impact.

```json
{
  "id": "d5c4b3a2-9e8d-7c6b-5a4b-3c2d1e0f9a8b",
  "groupId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "sessionId": "c8b3d6f1-4e8a-4d7a-8b9c-2d3e4f5a6b7c",
  "targetId": "e3a5f7d2-1c9b-4a8d-8e7f-3a2b1c0d9e8f",
  "shotNumber": 1,
  "x": 0.152,
  "y": -0.218,
  "units": "in",
  "velocity": 2705,
  "px": 465.7,
  "py": 333.8
}
```

* `x` / `y` — physical offset from POA in `units` (inches or cm)
* `px` / `py` — pixel coordinates on the canvas
* `velocity` — muzzle velocity in fps, or `null` if not recorded

Dexie index: `id, groupId, sessionId, targetId`

---

## Target Images [user-only]

```json
{
  "id": "f2b4c6d8-0e2a-4b6c-8d0e-2a4b6c8d0e2a",
  "name": "Reference Target Image A",
  "timestamp": "2026-06-01T14:30:00.000Z",
  "imageBlob": "<Blob>",
  "size": "245 KB",
  "firearmId": "8f3b6c1d-2d4a-4e8a-8c7a-9b5d8f6c3e2a",
  "loadId": "LOAD_REF_HANDLOAD_A",
  "customTargetConfig": {
    "id": "b7c9e1d3-4f0a-4b6c-8d2e-4a6b8c0d2e4f",
    "name": "Reference Custom Target Configuration"
  }
}
```

* `imageBlob` — stored as a native binary `Blob` in IndexedDB for memory efficiency
* `customTargetConfig`? — references target generator parameters configured for this target page if created using custom SVG builder
* **JSON export/import:** `imageBlob` is automatically converted to/from a Base64 `dataUrl` string at the export/import boundary. The JSON field name in exports/imports is `dataUrl`.

Dexie index: `id`

---

## Custom Targets [user-only]

Stores target generator configuration for reconstruction.

```json
{
  "id": "b7c9e1d3-4f0a-4b6c-8d2e-4a6b8c0d2e4f",
  "name": "Reference Target A",
  "paperSize": "letter",
  "orientation": "portrait",
  "gridEnabled": true,
  "gridSize": 1,
  "gridColor": "#cccccc",
  "rows": 1,
  "cols": 1,
  "marginX": 0.5,
  "marginY": 0.5,
  "shape": "circle",
  "diameter": 3.0,
  "numRings": 5,
  "bullseyeColor": "#000000",
  "ringColorA": "#000000",
  "ringColorB": "#ffffff",
  "labelText": "Reference label text",
  "labelPosition": "bottom",
  "labelSize": 12,
  "labelMargin": 0.25
}
```

Dexie index: `id`

---

## ID Naming Conventions

IDs in `master-db.json` follow a human-readable compound key pattern:

| Table | Pattern | Example |
|-------|---------|---------|
| Manufacturers | `MAN_<NAME>_<HASH>` | `MAN_REF_MFG_A` |
| Diameters | `DIA_<IMPERIAL>_<HASH>` | `DIA_REF_308_XBM7` |
| Cartridges | `CTG_<NAME>_<HASH>` | `CTG_REF_308_cC82` |
| Bullets | `BUL_<MAN>_<DIA>_<WEIGHT>_<NAME>_<HASH>` | `BUL_REF_BULLET_A` |
| Powders | `PWD_<MAN>_<NAME>_<HASH>` | `PWD_REF_POWDER_A` |
| Primers | `PRI_<MAN>_<NAME>_<HASH>` | `PRI_REF_PRIMER_A` |
| Brass | `BRS_MAN_<MAN_HASH>_CTG_<CTG_HASH>_<HASH>` | `BRS_REF_BRASS_A` |
| Loads | `LOAD_<TYPE>_<MAN>_<CTG>_<NAME>_<HASH>` | `LOAD_REF_HANDLOAD_A` |
| Primer Pockets | `PKT_<SIZE>` | `PKT_LRG` |
| Primer Holes | `HL_<SIZE>` | `HL_080` |

User-created records (firearms, sessions, groups, shots, etc.) use UUID-style random strings generated by the app.
