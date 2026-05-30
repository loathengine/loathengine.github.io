# Empirical Precision — Database Schema Reference

This document is the canonical technical reference for all IndexedDB tables and the `master-db.json` structure.

**Convention:** All field names use **camelCase**. All IDs are strings. Optional fields are marked with `?`.

Tables marked **[master-db]** are seeded from the open-source library. Tables marked **[user-only]** are created locally and never appear in `master-db.json`.

---

## Manufacturers [master-db]

```json
{
  "id": "MAN_<ID>",
  "name": "Hodgdon",
  "displayName": "Hodgdon Powder Co.",
  "type": ["powder"]
}
```

- `type` — array of strings. Valid values: `bullet`, `powder`, `primer`, `brass`, `ammo`
- `displayName` — optional long-form name for UI display

Dexie index: `id`

---

## Diameters [master-db]

```json
{
  "id": "DIA_308_<ID>",
  "imperial": ".308",
  "metric": "7.62mm"
}
```

Dexie index: `id`

---

## Cartridges [master-db]

```json
{
  "id": "CTG_308WIN_<ID>",
  "name": "308 Winchester",
  "diameterId": "DIA_308_<ID>",
  "minCaseLength": 2.005,
  "maxCaseLength": 2.015,
  "trimLength": 2.005,
  "oal": 2.810,
  "maxSaamiPsi": 62000,
  "baseCapacityH2o": 56.0
}
```

- All length fields are in inches
- `maxSaamiPsi` — SAAMI maximum average pressure in PSI
- `baseCapacityH2o` — case water capacity in grains

Dexie index: `id, diameterId`

---

## Bullets [master-db]

```json
{
  "id": "BUL_<MAN>_<DIA>_<WEIGHT>_<NAME>_<ID>",
  "manufacturerId": "MAN_<ID>",
  "diameterId": "DIA_<ID>",
  "name": "175gr HPBT",
  "physis": {
    "weightGrains": 175,
    "overallLength": 1.378,
    "ogiveLength": 0.825,
    "boatTailLength": 0.275,
    "tipLength": 0.245,
    "meplatDiameter": 0.059
  },
  "ballistics": {
    "preferredModel": "G7",
    "g1BC": 0.535,
    "g7BC": 0.274,
    "g1FF": null,
    "g7FF": null
  },
  "stability": {
    "ix": null,
    "iy": null
  }
}
```

- All length fields in `physis` are in inches
- `g1FF` / `g7FF` — form factors relative to G1/G7 standard projectile
- `ix` / `iy` — moments of inertia (kg·m²), used by stability calculator when available
- `tipLength` — for tipped bullets: the plastic tip length only (not included in aerodynamic metal length)
- `preferredModel` — `"G1"` or `"G7"`. G7 is preferred for long-range boat-tail rifle bullets

Dexie index: `id, manufacturerId, diameterId`

---

## Powders [master-db]

```json
{
  "id": "PWD_<MAN>_<NAME>_<ID>",
  "manufacturerId": "MAN_<ID>",
  "name": "Hodgdon H4350",
  "baCoeff": 0.0476,
  "kCoeff": 1.235,
  "heatOfExplosionKjKg": 3750
}
```

- `baCoeff` — ballistic action coefficient (internal ballistics simulator)
- `kCoeff` — burn rate shape coefficient (internal ballistics simulator)
- `heatOfExplosionKjKg` — heat of explosion in kJ/kg

Dexie index: `id, manufacturerId`

---

## Primers [master-db]

```json
{
  "id": "PRI_<MAN>_<NAME>_<ID>",
  "manufacturerId": "MAN_<ID>",
  "name": "CCI BR-2 Large Rifle Benchrest",
  "type": "Large Rifle",
  "primerPocketId": "PKT_LRG"
}
```

Dexie index: `id, manufacturerId`

---

## Primer Pockets [master-db]

```json
{
  "id": "PKT_SML",
  "name": "SMALL"
}
```

Dexie index: `id`

---

## Primer Holes [master-db]

```json
{
  "id": "HL_059",
  "name": "0.059"
}
```

Dexie index: `id`

---

## Brass [master-db]

```json
{
  "id": "BRS_<MAN>_<CTG>_<ID>",
  "manufacturerId": "MAN_<ID>",
  "cartridgeId": "CTG_<ID>",
  "primerPocketId": "PKT_SML",
  "primerHoleId": "HL_059",
  "capacityH2o": 56.5
}
```

- `capacityH2o` — water capacity in grains

Dexie index: `id, cartridgeId, manufacturerId`

---

## Load Types [master-db]

Reference table. Two records: `LT_COMM` (commercial) and `LT_HAND` (handload).

```json
{
  "id": "LT_COMM",
  "name": "commercial"
}
```

Dexie index: `id`

---

## Loads [master-db + user]

Commercial and handload records share the same table. Fields differ by type.

```json
{
  "id": "LOAD_<ID>",
  "loadTypeId": "LT_COMM",
  "name": "Federal Gold Medal Match",
  "cartridgeId": "CTG_<ID>",
  "bulletId": "BUL_<ID>",
  "manufacturerId": "MAN_<ID>",
  "partNumber": "GM308M",
  "lot": "Lot2024A",
  "powderId": "PWD_<ID>",
  "primerId": "PRI_<ID>",
  "brassId": "BRS_<ID>",
  "chargeWeight": 42.5,
  "coal": 2.800,
  "cbto": 2.150,
  "velocity": 2600,
  "isCommercial": false,
  "notes": "Seating depth ladder, node 3"
}
```

**Commercial loads** typically have: `loadTypeId`, `name`, `cartridgeId`, `bulletId`, `manufacturerId`, `partNumber`, `lot`

**Handloads** typically have: `loadTypeId`, `cartridgeId`, `bulletId`, `powderId`, `primerId`, `brassId`, `chargeWeight`, `coal`, `cbto`, `velocity`, `isCommercial: false`

Dexie index: `id, cartridgeId, bulletId, powderId`

---

## Firearms [user-only]

```json
{
  "id": "<uuid>",
  "nickname": "6.5 PRC Hunting Rifle",
  "cartridgeId": "CTG_<ID>",
  "barrelLength": 24.0,
  "twistRate": 8.0,
  "sightOverBore": 1.5
}
```

- `twistRate` — inches per turn (e.g., `8` means 1:8")
- `sightOverBore` — scope centerline height above bore centerline, in inches

Dexie index: `id, cartridgeId`

---

## Sessions [user-only]

One record per range visit.

```json
{
  "id": "<uuid>",
  "name": "100yd H4350 Ladder",
  "timestamp": "2026-05-30T12:00:00.000Z",
  "firearmId": "<firearm-uuid>",
  "loadId": "<load-uuid>",
  "targetDistance": 100,
  "distanceUnits": "yards",
  "temp": 68,
  "altitude": 450,
  "pressure": 29.85,
  "pressureType": "station"
}
```

- `pressureType` — `"station"` (raw barometric) or `"altimeter"` (sea-level adjusted)

Dexie index: `id, firearmId, loadId, [firearmId+loadId]`

The compound index `[firearmId+loadId]` enables efficient queries like "all sessions for this exact firearm+load combination."

---

## Session Targets [user-only]

Links a target image to a session and stores the scale calibration.

```json
{
  "id": "<uuid>",
  "sessionId": "<session-uuid>",
  "targetImageId": "<target-image-uuid>",
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

- `p1` / `p2` — pixel coordinates of the two scale reference points on the canvas
- `pixelsPerUnit` — derived from the p1/p2 distance and the known physical distance

Dexie index: `id, sessionId`

---

## Groups [user-only]

One record per group of shots within a session.

```json
{
  "id": "<uuid>",
  "sessionId": "<session-uuid>",
  "targetId": "<session-target-uuid>",
  "groupNum": 1,
  "poa": { "x": 450.5, "y": 312.0 },
  "color": "#ef4444"
}
```

- `poa` — pixel coordinates of the point of aim on the canvas
- `color` — hex color used to render this group on the composite plot

Dexie index: `id, sessionId`

---

## Shots [user-only]

One record per individual bullet impact.

```json
{
  "id": "<uuid>",
  "groupId": "<group-uuid>",
  "sessionId": "<session-uuid>",
  "targetId": "<session-target-uuid>",
  "shotNumber": 1,
  "x": 0.152,
  "y": -0.218,
  "units": "in",
  "velocity": 2705,
  "px": 465.3,
  "py": 294.7
}
```

- `x` / `y` — physical offset from POA in `units` (inches or cm)
- `px` / `py` — pixel coordinates on the canvas
- `velocity` — muzzle velocity in fps, or `null` if not recorded

Dexie index: `id, groupId, sessionId, targetId`

---

## Target Images [user-only]

```json
{
  "id": "<uuid>",
  "name": "100yd Jun-2026",
  "timestamp": "2026-06-01T14:30:00.000Z",
  "imageBlob": "<Blob>",
  "size": "245 KB",
  "firearmId": "<firearm-uuid>",
  "loadId": "<load-uuid>"
}
```

- `imageBlob` — stored as a native binary `Blob` in IndexedDB for memory efficiency
- **JSON export/import:** `imageBlob` is automatically converted to/from a Base64 `dataUrl` string at the export/import boundary. The JSON field name in exports is `dataUrl`.

Dexie index: `id`

---

## Custom Targets [user-only]

Stores target generator configuration for reconstruction.

```json
{
  "id": "<uuid>",
  "name": "100yd IPSC Target",
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
  "labelText": "My Load",
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
| Manufacturers | `MAN_<NAME>_<HASH>` | `MAN_HODGDON_H7X2` |
| Diameters | `DIA_<IMPERIAL>_<HASH>` | `DIA_308_XBM7` |
| Cartridges | `CTG_<NAME>_<HASH>` | `CTG_308WIN_cC82` |
| Bullets | `BUL_<MAN>_<DIA>_<WEIGHT>_<NAME>_<HASH>` | `BUL_SIERRA_308_175_HPBT_A2D1` |
| Powders | `PWD_<MAN>_<NAME>_<HASH>` | `PWD_HODG_H4350_R1A6` |
| Primers | `PRI_<MAN>_<NAME>_<HASH>` | `PRI_CCI_BR2LRG_C84Z` |
| Brass | `BRS_<MAN>_<CTG>_<HASH>` | `BRS_MAN_ADG_CTG_65PRC_XYJG` |
| Loads | `LOAD_<TYPE>_<MAN>_<CTG>_<NAME>_<HASH>` | `LOAD_COMM_FEDERAL_308WIN_GMATCH_09RB` |
| Primer Pockets | `PKT_<SIZE>` | `PKT_SML`, `PKT_LRG` |
| Primer Holes | `HL_<SIZE>` | `HL_059`, `HL_080` |

User-created records (firearms, sessions, groups, shots, etc.) use UUID-style random strings generated by the app.
