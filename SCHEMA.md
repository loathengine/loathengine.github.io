# Empirical Precision Data Schema

How Empirical Precision (EP) stores its data, and how another program can produce data EP will
import: a list of firearms, a set of loads, a range session with its chronograph string and its
impacts.

**Part 1 (§1–§7) is the integration guide.** Read it if you are writing data for EP from
outside the app. It says which records you need, which ids are yours to choose and which are
EP's, and what happens when the file is imported.

**Part 2 (§8–§12) is the field reference.** Every table and every field: its type, whether it
is required, its unit and what it means.

---

# Part 1 — Integration guide

## 1. Two kinds of data

EP's database holds two kinds of records side by side, in the same tables.

| | Library data | User data |
|---|---|---|
| What it is | The curated component library: cartridges, bullets, powders, primers, brass, manufacturers, calibres | Everything a shooter creates: firearms, loads, sessions, chronograph strings, marked targets, shots, and their own components |
| Who writes it | EP only. It ships with each release of the app | The shooter, in the app, or an import file — yours |
| Can it be changed on a device? | No. The store refuses any write to a library record | Yes |
| Ids | Prefixed by table: `CTG_…`, `BUL_…`, `PWD_…` (§10) | Any other string. **You choose them** (§3) |
| Where it travels | With the app. Never in an export or import file | In export and import files |

**A record is library data exactly when its id starts with its table's library prefix.** No
other flag tells them apart. The prefixes:

| Table | Library prefix |
|---|---|
| `manufacturers` | `MAN_` |
| `diameters` | `DIA_` |
| `cartridges` | `CTG_` |
| `bullets` | `BUL_` |
| `powders` | `PWD_` |
| `primers` | `PRI_` |
| `primerPockets` | `PKT_` |
| `brass` | `BRS_` |
| `grainTypes` | every row (bare words such as `ball`) |

### 1.1 The shooter's own components, and `(CUST)`

The component tables (`cartridges`, `bullets`, `powders`, `primers`, `brass`, `manufacturers`,
`diameters`) also hold components the shooter made. These are user data and have ids without a
library prefix. They come about in two ways:

- **Made from scratch**, for example a custom brass or a wildcat cartridge. Nothing marks it
  apart from its id.
- **A copy of a library record.** A library record cannot be edited, so editing one in the app
  saves the shooter's own copy. The copy gets a new id, ` (CUST)` added to its name, and
  `derivedFrom` holding the original's library id. `derivedFrom` is how EP's fitted corrections
  still apply to the copy.

` (CUST)` is a label for people. Code should go by the id prefix, and by `derivedFrom` to find
a copy's original.

## 2. What to send, and in what file

EP imports user data from a **session file**: one JSON object whose keys are table names and
whose values are arrays of records. The shooter imports it on the **Sessions** page with
**Import**.

```json
{
  "_instructions": "Exported from Acme Range Log for Empirical Precision. Import on the Sessions page.",
  "firearms": [ … ],
  "loads": [ … ],
  "sessions": [ … ],
  "chronoSessions": [ … ],
  "shots": [ … ]
}
```

- Send only the tables you have. Every table is optional, and a file of firearms alone is a
  valid file. The import message counts sessions, so a firearms-only file reports 0 sessions.
- A key that is not a table name is ignored, so `_instructions` and your own metadata are
  safe. A table key whose value is not an array of objects makes the whole file fail.
- Records are plain JSON with the field names in Part 2. Leave out a field you do not have.
  Do not write `null` for it: an absent field means *unknown*.
- Do not send `updatedAt`. The store stamps every record it writes.
- Do not send library records. A row in a file whose id has a library prefix is skipped: the
  device keeps the library its app shipped.

EP also has a **backup file** (`"format": "epv5-user-data"`), used to move one shooter's
whole database between their own devices. It merges by timestamp and carries deletions. Do not
generate one: it requires an `updatedAt` on every record and a deletion list, and it is not
meant for data from other programs.

## 3. Your ids

Every record needs an `id`. For the user data you create (firearms, loads, sessions,
chronograph strings, marked targets, groups, shots, and components of your own), **use your
own ids**. You do not need to look up or track any id EP makes, and you never need a
` (CUST)` id.

The rules:

1. **Unique across every table, not just within one.** EP keys deletions by id alone, so a
   firearm and a session must not share an id.
2. **No library prefix** (§1): `MAN_`, `DIA_`, `CTG_`, `BUL_`, `PWD_`, `PRI_`, `PKT_`, `BRS_`.
   A record with one is silently skipped.
3. **Avoid EP's own user-side prefixes too**: `l_`, `CHRN_`, `SHOT_`, `MCS_`, `Q_`. They are
   not refused, but EP gives some of them meaning (§12.2).
4. **Stable.** Send the same record with the same id every time. That is how a re-import
   updates what is already there, not a duplicate.

A namespace of your own does all four, for example `acme-fa-0042`, `acme-ses-2026-11-04-01`.

A record with no `id` is given one on import. Nothing else in the file can point at it then,
so always set one.

### 3.1 What a re-import does

| Tables | Record with this id already on the device | Record not on the device |
|---|---|---|
| `firearms`, `loads` and the component tables | **Kept as it is.** Your copy is ignored | Added |
| Everything else: `sessions`, `chronoSessions`, `markedTargets`, `groups`, `shots`, … | **Replaced** by your copy | Added |

A firearm or a load the shooter may have edited in EP is never overwritten by a file. To
correct one you sent before, send it under a new id, or have the shooter edit it in the app.

### 3.2 Loads EP saves under its own ids

EP names a load it creates by a hash of its recipe (`l_` + 20 hex digits, §12.5.2), so the
same recipe typed twice is one record. Your loads keep the ids you gave them. When the shooter
edits one of your loads in the app's Load Library, EP saves the edited recipe as a new load
under its own `l_` id. Your sessions keep pointing at your original, which was what they were
fired with.

## 4. Pointing at components

A firearm needs a cartridge. A load needs a cartridge and a bullet, and for a handload a
powder, and optionally a primer and a case. These fields are foreign keys (`cartridgeId`,
`bulletId`, `powderId`, `primerId`, `brassId`), and each has to name a record that exists on
the shooter's device. There are two ways to fill one.

### 4.1 Name an EP library record (recommended)

Put the library id in the field, for example `"cartridgeId": "CTG_65CREEDMOOR_…"`. The physics
then runs on EP's curated, calibrated data: the bullet's drag curve, the powder's fitted burn
model, and the cartridge's pressure limits and corrections.

The library is published with the app, as JSON in the format of Part 2:

```
https://empiricalprecision.com/master-db.json
```

It holds `cartridges`, `bullets`, `powders`, `primers`, `brass`, `manufacturers`, `diameters`,
`primerPockets` and `grainTypes`, each an array of records with its `id`. Match your
components to it once (by maker and name, or by the shooter picking), and store the EP id
beside your own.

**This is the one place you deal with EP ids.** A library id never changes meaning. A release
can drop a record, though, for example a cartridge EP stops shipping. A reference to a dropped
record then shows as missing (§4.3).

### 4.2 Send your own component

Include the component in your file under your own id, in its table (`cartridges`, `bullets`,
`brass`, …), and point at that id. It arrives as the shooter's own component: no library
prefix, no ` (CUST)`, no `derivedFrom`. Only set `derivedFrom` if it really is a modified copy
of a library record and you know that record's id.

The cost is calibration. EP's fitted corrections attach to library records:

| Your own… | What EP can do with it |
|---|---|
| Brass, primer | Used as given |
| Bullet | Flown on the drag curve you give, or without one on the standard G1 or G7 table at your `ballistics` BC. A bullet with neither a curve nor a BC cannot be flown: EP never assumes a BC |
| Cartridge | Runs, without EP's corrections for that chambering |
| Powder | **Cannot be simulated.** A powder's burn model is fitted from published load data, which a record made outside EP does not have |

A component you send must still reference what it depends on: a cartridge needs a
`diameterId` and a `primerPocketId`, and a brass a `cartridgeId`. Those can be library ids
(`DIA_…`, `PKT_LRG`, `PKT_SML`) or records of your own.

### 4.3 When a reference does not resolve

Nothing is matched by name on import. A firearm, load or session pointing at an id that is not
on the device is still imported. Where it is used, EP flags the missing cartridge, bullet,
powder, primer, brass, firearm or load and asks the shooter to pick a replacement. Repairing a
load that way saves it under EP's own `l_` id and moves the sessions that used it along with it.

## 5. Units you write

The library side of the database is metric. The session side keeps what a shooter reads off
the instrument. Part 2 gives every field's unit. The ones you will meet:

| Field | Unit |
|---|---|
| `firearms.barrelLengthMm`, `sightOverBoreMm`, `magCoalMm` | millimetres |
| `firearms.twistRateMm` | millimetres per turn: a 1:8″ twist is `203.2` |
| `loads.chargeWeightGrams` | grams: 41.5 gr is `2.68916` |
| `loads.coalMm`, `cbtoMm` | millimetres |
| `sessions.temp`, `roundTemp` | °F |
| `sessions.pressure` | inHg, and `pressureType` (`sea` or `station`) must say which |
| `sessions.altitude` | feet |
| `sessions.targetDistance`, `markedTargets.targetDistance` | in `distanceUnits`: `yards` or `meters` |
| `shots.velocity` | feet per second |
| `shots.x`, `shots.y` | in `shots.units`: `in` or `mm`. +x is right, +y is up |

## 6. Recipes

Complete files. Each imports as it stands. Ids beginning `acme-` are the third party's own; the
`CTG_`, `BUL_`, `PWD_`, `PRI_` and `BRS_` ids are placeholders for real ids from
`master-db.json`.

### 6.1 A list of firearms

A firearm needs `id` and `cartridgeId`. Everything else is optional but feeds the physics:
barrel length feeds the velocity prediction, twist and its direction the stability and spin
drift, sight height the trajectory.

```json
{
  "_instructions": "Firearms from Acme Range Log.",
  "firearms": [
    {
      "id": "acme-fa-0001",
      "nickname": "Tikka T3x 6.5 CM",
      "cartridgeId": "CTG_…",
      "barrelLengthMm": 609.6,
      "twistRateMm": 203.2,
      "twistDirection": "right",
      "sightOverBoreMm": 44.45
    },
    {
      "id": "acme-fa-0002",
      "nickname": "Custom 308",
      "cartridgeId": "CTG_…",
      "barrelLengthMm": 508
    }
  ]
}
```

### 6.2 A load

A load needs `id`, `cartridgeId` and `bulletId`. A handload also needs `powderId` and
`chargeWeightGrams`.

```json
{
  "loads": [
    {
      "id": "acme-ld-0007",
      "name": "140 ELD-M / H4350 41.5",
      "cartridgeId": "CTG_…",
      "bulletId": "BUL_…",
      "powderId": "PWD_…",
      "primerId": "PRI_…",
      "brassId": "BRS_…",
      "chargeWeightGrams": 2.68916,
      "coalMm": 71.12,
      "cbtoMm": 56.13,
      "cbtoComp": "Hornady 0.264",
      "firings": 2
    }
  ]
}
```

### 6.3 A session with a chronograph string

A session ties a firearm and a load to an occasion. Velocities live on `shots`, one row per
round, linked to the string by `chronoSessionId`. The session points at the string with its own
`chronoSessionId`.

```json
{
  "sessions": [
    {
      "id": "acme-ses-0101",
      "name": "Ladder step 3",
      "firearmId": "acme-fa-0001",
      "loadId": "acme-ld-0007",
      "chronoSessionId": "acme-chr-0101",
      "targetDistance": 100,
      "distanceUnits": "yards",
      "temp": 58,
      "pressure": 29.92,
      "pressureType": "sea",
      "altitude": 850
    }
  ],
  "chronoSessions": [
    {
      "id": "acme-chr-0101",
      "name": "Garmin 2026-11-04 #3",
      "deviceType": "generic",
      "importedAt": 1794960000000,
      "contentHash": "acme-chr-0101"
    }
  ],
  "shots": [
    { "id": "acme-shot-0101-1", "chronoSessionId": "acme-chr-0101", "firingOrder": 1, "velocity": 2712.4 },
    { "id": "acme-shot-0101-2", "chronoSessionId": "acme-chr-0101", "firingOrder": 2, "velocity": 2718.9 },
    { "id": "acme-shot-0101-3", "chronoSessionId": "acme-chr-0101", "firingOrder": 3, "velocity": 2709.1 }
  ]
}
```

`deviceType` is `labradar`, `magnetospeed`, `garmin_xero`, `fit` or `generic`. `contentHash`
lets EP recognise the same string imported again from a device file. Any string unique to the
string will do, and the string's own id is the simplest.

### 6.4 A component of your own

A case of a brand the library does not carry, for a library cartridge:

```json
{
  "manufacturers": [
    { "id": "acme-man-0001", "name": "Acme Brass Co.", "type": ["brass"] }
  ],
  "brass": [
    { "id": "acme-brs-0001", "manufacturerId": "acme-man-0001", "cartridgeId": "CTG_…",
      "primerPocketId": "PKT_SML", "capacityH2oGrams": 3.4 }
  ]
}
```

A load can then name `"brassId": "acme-brs-0001"`. The brass's `cartridgeId` must be the
load's cartridge (or its parent case), or the load's brass reads as missing.

## 7. Checklist

- [ ] One JSON object, table names as keys, arrays of records as values.
- [ ] Every record has an `id`: yours, namespaced, unique across all tables, stable between
      exports, and without an EP prefix (§3).
- [ ] Component references name either an EP library id from `master-db.json` or a component
      in your file (§4). A powder must be a library powder to be simulated.
- [ ] Units as in §5. Pressure always with `pressureType`. Distances always with
      `distanceUnits`.
- [ ] No `updatedAt`, no `null` for unknown values, no library records.
- [ ] Shots: one per round. Velocity in fps on the shot. A marked shot's `sessionId` is the
      marked target's id (§12.4); its `targetId` is the `sessionTargets` row its photo is.

---

# Part 2 — Field reference

Sections 8–11 are the component library EP ships. Section 12 is the user data: the tables an
import file writes, and the shooter's own components.

## 8. Library tables

| Table | Holds |
|---|---|
| `manufacturers` | Makers of bullets, powder, primers and brass |
| `diameters` | Calibre definitions — bore and bullet diameter |
| `grainTypes` | Propellant kernel geometries |
| `primerPockets` | Pocket sizes |
| `primers` | Primers, keyed to a pocket size and classed rifle or pistol |
| `cartridges` | Bottleneck rifle chamberings: case dimensions and pressure ceilings. A cartridge whose CIP or SAAMI drawing has no shoulder is not shipped |
| `bullets` | Projectiles: geometry, ballistic coefficients and drag curve |
| `powders` | Propellants: densities, burn parameters and kernel type |
| `brass` | Cases, one record per manufacturer and cartridge |

The user's own tables sit in the same Dexie store and are described in §12.

## 9. Library units

Every stored value is SI/metric. Imperial units exist only at the display boundary. The
suffix on a field name is its unit and is load-bearing:

| Suffix | Unit | Suffix | Unit |
|---|---|---|---|
| `…Mm` | millimetres | `…Pa` | pascals |
| `…Grams` | grams | `…KgM3` | kilograms per cubic metre |
| `…J` | joules | `…KjKg` | kilojoules per kilogram |

`capacityH2oGrams` and `baseCapacityH2oGrams` are **grams of water**, not grains.

## 10. Library identifiers

Every record has a string `id`. Each table has its own prefix, so an id is self-describing
and unique across the whole library.

| Prefix | Table |
|---|---|
| `MAN_` | manufacturers |
| `DIA_` | diameters |
| `CTG_` | cartridges |
| `BUL_` | bullets |
| `PWD_` | powders |
| `PRI_` | primers |
| `PKT_` | primerPockets |
| `BRS_` | brass |
| *(none)* | grainTypes |

`grainTypes` is the exception: its ids are bare words (`ball`, `flake`,
`extrudedSinglePerf`, `extrudedMultiPerf`, `extruded`) because `powders.grainType` stores the
string itself rather than a prefixed key.

**An id is permanent.** Records are matched by id, so changing one does not rename a record —
it destroys the old one and creates a new one, orphaning every reference to it.

Any field ending `…Id` is a foreign key to the `id` of the table its name identifies.

---

## 11. Library field reference

**Required** means every record carries a non-null value. **Optional** means some records do
not; absence always means *unknown*, never zero.

### 11.1 `manufacturers`

| Field | Type | | Meaning |
|---|---|---|---|
| `id` | string | required | |
| `name` | string | required | |
| `type` | string[] | optional | Which component classes this maker produces |

### 11.2 `diameters`

| Field | Type | | Meaning |
|---|---|---|---|
| `id` | string | required | |
| `metricName` | string | required | Millimetre designation |
| `imperialName` | string | required | Inch designation |
| `bulletDiameterMm` | number | required | Groove diameter — what the projectile measures |
| `boreDiameterMm` | number | required | Land-to-land diameter, always the smaller of the two |

Both are needed and are not interchangeable: bore diameter sets the area pressure acts on,
bullet diameter sets what the rifling engraves.

### 11.3 `grainTypes`

| Field | Type | | Meaning |
|---|---|---|---|
| `id` | string | required | The value stored in `powders.grainType` |
| `name` | string | required | Display name |

### 11.4 `primerPockets`

| Field | Type | | Meaning |
|---|---|---|---|
| `id` | string | required | `PKT_SML` or `PKT_LRG` |
| `name` | string | required | |

The table exists to be the target of `primerPocketId` on cartridges, brass and primers. It
holds no dimensions.

### 11.5 `primers`

| Field | Type | | Meaning |
|---|---|---|---|
| `id` | string | required | |
| `manufacturerId` | string | required | → `manufacturers` |
| `name` | string | required | |
| `primerPocketId` | string | required | → `primerPockets`. Determines which cases the primer fits. |
| `brisanceEnergyJ` | number | optional | Ignition energy. Absent means no measured figure. |
| `primerClass` | string | required | `rifle` or `pistol`: what the maker sells the primer for, as its product name says. Magnum, benchrest, match and military rifle primers are `rifle`. |

A pistol primer shares its pocket with a rifle one, so the pocket cannot tell them apart and the class does (WS503).
Three library primers are `pistol`: CCI 500 Small Pistol, CCI 350 Large Pistol Magnum and Winchester Large Pistol (WLP).
A pistol primer in a rifle case is not always wrong: the published loads put CCI 500 in 22 Hornet and Winchester's large
pistol primer in 458 SOCOM. So the class is a fact on the record. The database refuses a primer written without a class. The engine does
not read it.

### 11.6 `cartridges`

Only bottleneck cases ship (WS388). The database records each cartridge's case shape and the drawing it was read from; the 159 with a shoulder are exported and the eight straight-wall cases are kept out.

| Field | Type | | Meaning |
|---|---|---|---|
| `id` | string | required | |
| `name` | string | required | |
| `diameterId` | string | required | → `diameters`. The only route to bore and bullet diameter. |
| `primerPocketId` | string | required | → `primerPockets`. The standard pocket for the chambering; a specific case may differ. |
| `baseCapacityH2oGrams` | number | required | Nominal case capacity, used when no specific case is known. Eleven records carry a figure derived from publishers' printed loading densities rather than a published capacity (WS390, WS406); the database records the basis |
| `maxCaseLengthMm` | number | required | Maximum case length |
| `trimLengthMm` | number | required | Trim-to length |
| `baseToShoulderMm` | number | required | Base-to-shoulder body junction length ($L_1$ on C.I.P. sheets; basic body-shoulder intersection on SAAMI maximum-cartridge drawings) |
| `oalMm` | number | required | Maximum cartridge overall length |
| `bodyDiameterMm` | number | required | External body diameter at the case base |
| `shoulderDiameterMm` | number | required | External shoulder diameter at the body-shoulder junction ($P_2$) |
| `neckDiameterMm` | number | required | External neck diameter ($H_2$) |
| `shoulderAngleDeg` | number | required | Basic shoulder half-angle from the cartridge longitudinal axis, in degrees ($\alpha / 2$ on C.I.P. sheets; basic shoulder angle on SAAMI drawings; inflection tangent cone on double-radius Weatherby cases) |
| `rimDiameterMm` | number | required | Rim (bolt-face) diameter |
| `twistRateMm` | number | required | Reference twist, millimetres per turn |
| `maxSaamiPa` | number | optional | SAAMI's maximum average pressure, the transducer figure from SAAMI's own table. Absent where SAAMI publishes none, and where SAAMI sets only a crusher (CUP) limit (25-35 Winchester, 30-40 Krag, 250-3000 Savage): a CUP figure is never stored as psi |
| `maxCipPa` | number | optional | C.I.P.'s maximum pressure (Pmax), from C.I.P.'s own sheet. Absent where C.I.P. publishes none |

The app's pressure audit, the burn chart and the Powder Optimizer use SAAMI's ceiling where there is one and C.I.P.'s
otherwise. The two are different standards and differ for the same cartridge: SAAMI holds 8x57 IS to 35,000 psi and
6.5x55 Swedish to 51,000 psi for older rifles, where C.I.P. allows 3,900 and 3,800 bar.

### 11.7 `bullets`

A bullet record holds measurements. Where a figure came from is recorded only in the fields
that say so: `tipLengthBasis`, `ballistics.method` and `basis`, and `drag.source` and `shape`.
There is no quality grade — nothing to rank or filter on.

| Field | Type | | Meaning |
|---|---|---|---|
| `id` | string | required | |
| `manufacturerId` | string | required | → `manufacturers` |
| `diameterId` | string | required | → `diameters` |
| `name` | string | required | |
| `physis` | object | required | Physical geometry — §11.7.1 |
| `ballistics` | object | required | Ballistic coefficients — §11.7.2 |
| `drag` | object \| null | required | The bullet's own drag curve — §11.7.3. `null` where its geometry was not enough to build one. |

#### 11.7.1 `physis`

| Field | Type | | Meaning |
|---|---|---|---|
| `weightGrams` | number | required | |
| `engravingPressurePa` | number | optional | Pressure required to engrave the rifling. Absent on most records, where the engine applies its own default. |
| `overallLengthMm` | number | required | Tip to base. A bullet with no length on record is not shipped. |
| `ogiveLengthMm` | number \| null | optional | |
| `boatTailLengthMm` | number \| null | optional | `0` means a flat base, which is not the same as `null` for unknown |
| `bearingSurfaceMm` | number \| null | optional | Full-diameter shank length |
| `tipLengthMm` | number \| null | required | The plastic tip; `null` for a bullet without one, never `0` |
| `tipLengthBasis` | string \| null | required | Where the tip's length came from: `measured`, `estimated` (from measured tips of the same design and calibre) or `authored`. `null` exactly when there is no tip. |

`ogiveLengthMm`, `boatTailLengthMm`, `bearingSurfaceMm`, `tipLengthMm` and `tipLengthBasis` carry
the key on every record even when the value is unknown or there is no tip, so testing for the
key's presence does not tell you whether there is a measurement. Test the value.

#### 11.7.2 `ballistics`

| Field | Type | | Meaning |
|---|---|---|---|
| `g1BC` | number | required | Ballistic coefficient against the G1 reference |
| `g7BC` | number | required | Ballistic coefficient against the G7 reference |
| `method` | string | required | How the number is reproduced: `model` where the project's own drag model lands within 2% of it, `measured` where a drag curve the project integrated set it, `published` where it rests on a publisher's figure |
| `basis` | string | required | What the number was read off: `measured` (a radar or Doppler drag curve), `published` (at least one publisher's G7), `converted` (publishers' G1s only, each converted to G7), `authored` (a value on the record with no written source) or `model` (no claim at all; the drag model over the bullet's profile) |

The coefficients are resolved, not copied: every source that holds a claim for the bullet is
combined by inverse-variance weighting, so the value often equals a published one but need not.
Read `basis`, not `method`, to tell a modelled number from a measured one. In the shipped library
every bullet carries all four keys.

Only the drag coefficients are stored. Sectional density and form factor are derived from
weight, diameter and the coefficient, so storing them would be storing a value that is then
recomputed anyway.

#### 11.7.3 `drag`

The bullet's own drag curve, Cd against Mach, stored as a level and a shape that are sourced
separately. It is what a trajectory integrates; no coefficient can express it.

| Field | Type | | Meaning |
|---|---|---|---|
| `g7BC` | number | required | The G7 the curve is anchored on, equal to `ballistics.g7BC` |
| `g1BC` | number | required | The G1 the same level implies |
| `source` | string | required | What the level rests on: the same word as `ballistics.basis` |
| `shape` | string | required | Where the shape came from: `mcdrag` (the drag model over the bullet's profile), `measured` (a measured drag curve: Hornady's 4DOF calculator, Lapua's radar or Warner's Doppler) or `bands` (Litz's five-band G7, for a bullet with no profile) |
| `g1ToG7` | number | required | The constant that converts the project's own G1 back to the G7 the curve is anchored on |
| `f7` | number[] | required | Form factor against G7 at each Mach on the shared grid |

The Mach grid is shared by every curve, so it travels once, as the top-level
`bulletDragGrid.mach` (25 points, Mach 0.5 to 3.0), and the app puts it back on each record.

### 11.8 `powders`

| Field | Type | | Meaning |
|---|---|---|---|
| `id` | string | required | |
| `manufacturerId` | string | required | → `manufacturers` |
| `name` | string | required | |
| `grainType` | string | optional | → `grainTypes`, stored as the bare id. Absent on one record, Norma URP: Norma names no grain shape |
| `propellantDensityKgM3` | number | required | Density of the solid propellant |
| `bulkDensityKgM3` | number | required | Poured density including the air between kernels; this is what decides whether a charge fits |
| `heatOfExplosionKjKg` | number | required | Energy released per kilogram |
| `burnSurfacePeakGain` | number | optional | How far the burning surface grows before it begins to shrink |
| `burnFractionAtSurfacePeak` | number | optional | Burn fraction at that peak |
| `burnFractionAtSliverStart` | number | optional | Burn fraction at which the kernel breaks into slivers |

The last three describe the same curve and are populated together: a record has all three or
none of them.

**No burn-rate coefficient is stored here.** It is a fitted parameter and belongs with the
rest of the fitted parameters, keyed by powder id.

**Every powder in the library has a fitted entry.** A powder without one cannot be simulated,
so it does not belong here. Adding a powder means adding load data for it and refitting, not
adding a record and hoping.

### 11.9 `brass`

One record per manufacturer and shipped cartridge. Brass is never shipped for a cartridge the file does not carry.

| Field | Type | | Meaning |
|---|---|---|---|
| `id` | string | required | Encodes the manufacturer and cartridge it belongs to |
| `manufacturerId` | string | required | → `manufacturers` |
| `cartridgeId` | string | required | → `cartridges` |
| `primerPocketId` | string | optional | → `primerPockets`. **May differ from the cartridge's standard pocket** — this is how small-pocket variants of large-pocket chamberings are represented. Absent on six European cases (Norma, RWS, Sellier & Bellot) whose pocket is not on record. |
| `capacityH2oGrams` | number | optional | Measured water capacity. Frequently absent, and one of the most consequential values in the library: absence means unknown, and a consumer must fall back to the cartridge's nominal capacity rather than read it as an empty case. |

---

## 12. User data

Everything the user creates: rifles, recipes, the paper they marked, the string they
chronographed, the session that ties those together, and the scenarios they saved. It shares
the database with the library and points into it by id, but it is not library data — the
master payload carries none of these records and the library install never writes one. They
move between devices only in the user's own backup file, which carries nothing the library
supplies.

### 12.1 Tables

| Table | Holds |
|---|---|
| `firearms` | The user's rifles |
| `loads` | Recipes — a cartridge, a bullet, and for a handload the charge and seating |
| `targetImages` | Photographs or scans of shot paper, plus their binary |
| `customTargets` | Saved printable targets (My Targets) — a form design or a Target Script, no shot data |
| `markedTargets` | One marking sitting: the paper as it was scored |
| `sessionTargets` | One image placed in a sitting, with the scale that turns pixels into inches |
| `groups` | One group marked on one of those images |
| `shots` | One round fired — marked, chronographed, or both |
| `sessions` | A range session: rifle + load + marked target + environment |
| `chronoSessions` | An imported chronograph string, header only |
| `monteCarloSaves` | Saved hit-probability scenarios |
| `analysisQueues` | An Analysis queue: its name and colour |
| `analysisQueueShots` | One shot picked into a queue: the queue, the session it is read at, the shot |
| `tombstones` | One row per deleted user record, so the deletion can travel to another device |

The component tables of §11 also hold the user's own components, beside the library's rows:
see §12.5.12.

`analysisQueues` holds the Analysis page's queues, and `analysisQueueShots` one row per shot
picked into one, keyed `queueId:shotId` (WS421). One row per shot rather than a list on the
queue is what lets a merge keep the shots each device added.

### 12.2 Identifiers

Library ids carry the prefixes in §10, and that prefix is the only thing separating a library
row from a user row in the same table. `applyLibrary`, which installs the library this build
ships, writes only rows carrying their table's prefix and prunes only prefixed ids the
snapshot no longer holds. The store refuses any other write to a prefixed row, and the user's
backup leaves every prefixed row out.

A record the user creates gets a `generateUniqueId()`: a base-36 timestamp and a random
suffix, roughly time-sortable. Some tables put a prefix of their own in front of it:

| Id | Table |
|---|---|
| `l_` + 20 hex digits | loads. Content-addressed: a hash of the recipe, so the same recipe is the same id on every device (WS199) |
| `CHRN_…` | chronoSessions |
| `SHOT_…` | shots imported with a chronograph string. A shot marked on paper has a bare id |
| `MCS_…` | monteCarloSaves |
| `Q_…` | analysisQueues |
| `queueId:shotId` | analysisQueueShots, so one shot added to one queue on two devices is one row |
| bare | every other user table, and the user's own components |

A prefix on a user record must never be one of the library's. `MCS_` is not in the library's
list, which is exactly why the library install leaves the scenarios alone — listing it would
delete the records it was meant to protect.

### 12.3 Units — the session side is not metric

§9 governs the library. It does not govern here. Session records store the number the user
typed, in the unit the field was labelled with, and convert on the way out:

| Field | Stored as |
|---|---|
| `shots.velocity` | feet per second |
| `firearms.velocityOffsetFps`, `velocityOffsetSd` | feet per second |
| `sessions.temp` | degrees Fahrenheit |
| `sessions.pressure` | inches of mercury |
| `sessions.altitude` | feet |
| `sessions.targetDistance`, `markedTargets.targetDistance` | whatever `distanceUnits` says |
| `shots.x`, `shots.y` | whatever the owning `sessionTargets.scale.units` says |
| `monteCarloSaves.params.*` | the simulator's own units — fps, inches, yards, MOA, mph, °F, inHg, ft |
| `customTargets` dimensions | inches |

`firearms` and `loads` are the exception and follow §9: they are `…Mm` and `…Grams` in
storage and convert at the form. The split is between records that describe a component or a
rifle, which are metric, and records of an occasion, which keep the observed figure.

Converting happens at the consumer. `chronoSubmission` is the clearest case — it turns fps
into mm/s, °F into millicelsius, inHg into pascals and feet into metres as it builds the
payload, and nothing upstream of it has done any of that.

### 12.4 How the records connect

Three tables carry a field named `sessionId` that does **not** hold a `sessions.id`:

> `sessionTargets.sessionId`, `groups.sessionId` and `shots.sessionId` all hold a
> **`markedTargets.id`**. Marking data is keyed by the sitting that produced it, and a
> sitting exists whether or not a session was ever recorded against it. The link runs the
> other way: `sessions.markedTargetId` points at the sitting.

The rest:

```
markedTargets ──< sessionTargets ──> targetImages
      ^               ^
      │               │ (targetId)
      │           groups ──< shots
      │
sessions ──> firearms, loads
   └──> chronoSessions ──< shots   (shots.chronoSessionId)
```

A `shot` has two independent memberships and needs at least one. Marked-only (an impact you
did not chronograph) and chronographed-only (a fouler at the head of a string) are both
normal, so `groupId`/`targetId` and `chronoSessionId` are each optional. There is one
velocity, on the shot, and it is not copied onto the string.

### 12.5 Field reference

Every user record also carries `updatedAt`, the time the store last wrote it in milliseconds since
the epoch. The store writes it on every create and update; the app never sets it. It is what lets
two devices' backups merge: the newer copy of a record wins, and a `tombstones` row (§12.5.14)
carries a deletion.

#### 12.5.1 `firearms`

| Field | Type | | Meaning |
|---|---|---|---|
| `id` | string | required | |
| `nickname` | string | optional | A label. A rifle without one is described from its cartridge, barrel and twist. |
| `cartridgeId` | string | required | → `cartridges` |
| `barrelLengthMm` | number | optional | Entered in inches |
| `twistRateMm` | number | optional | Millimetres per turn. Overrides the cartridge's reference twist. |
| `twistDirection` | string | required | `right` or `left` (WS449). Spin drift and aerodynamic jump turn with it. |
| `sightOverBoreMm` | number | optional | Scope centre above bore axis |
| `magCoalMm` | number | optional | Longest round the magazine accepts |
| `elevationTrackingFactor` | number | optional | The elevation turret's moved ÷ dialed, 0.8–1.2 (WS433); absent when not measured |

Plus the trued velocity offset, written by the Ignition page when chronographed sessions are
used to correct that rifle's prediction. The fields are written together, from one session or
pooled from several (`velocityOffsetSessionCount`, absent for a single session). Editing the
rifle keeps them, unless its barrel length or cartridge changes, which clears them:

| Field | Type | | Meaning |
|---|---|---|---|
| `velocityScaleFactor` | number | optional | measured ÷ predicted |
| `velocityOffsetFps` | number | optional | measured − predicted, fps |
| `velocityOffsetShotCount` | number | optional | Shots the offset was derived from |
| `velocityOffsetSd` | number | optional | SD of those shots, fps |
| `velocityOffsetDate` | string | optional | ISO date the offset was saved |
| `velocityOffsetSessionCount` | number | optional | Sessions pooled into the offset. Absent for a single-session offset. |
| `velocityOffsetTuningStamp` | string | optional | `tuning-db.json`'s `generated_at` at true-ing time. Compared against the loaded fit's; a mismatch means the offset was measured against a different model and is stale. |
| `velocityOffsetFlag` | string | optional | Free text, e.g. "large offset - verify inputs" |
| `lands` | array | optional | The lands log (WS439): one entry per sitting, `{ id, bulletId → bullets, comparator, method: gauge \| dummy \| other, readingsMm: number[], date: YYYY-MM-DD, roundCount? }`. CBTO at the lands in mm. A record: the engine keeps its fixed jump. |

The offset belongs to the rifle rather than to the fit, so it is stored, never fitted. It is
deliberately excluded from a contribution payload.

#### 12.5.2 `loads`

One recipe.

The id is a hash of the facts that change what leaves the muzzle: cartridge, bullet, powder,
charge, primer, brass, COAL, CBTO and firings (§12.2). Changing
one of them makes a new recipe; the old one survives while a session still points at it. A
comparator reading or a note is bookkeeping, not part of the id.

| Field | Type | | Meaning |
|---|---|---|---|
| `id` | string | required | `l_`-prefixed, content-addressed |
| `name` | string | optional | The user's own label, never generated. A screen without one describes the load from its facts. |
| `cartridgeId` | string | required | → `cartridges` |
| `bulletId` | string | required | → `bullets` |
| `powderId` | string | optional | → `powders`. Required for a handload. |
| `primerId` | string | optional | → `primers` |
| `brassId` | string | optional | → `brass` |
| `chargeWeightGrams` | number | optional | Grams. Entered in grains. |
| `coalMm` | number | optional | Cartridge overall length |
| `cbtoMm` | number | optional | Base to ogive |
| `velocityMps` | number | optional | Ignition's predicted muzzle velocity in m/s, with any applied velocity offset, written by Save to Loads Library when the result is current. Used when a tool has a load but no firearm selected. Not part of the id. |
| `cbtoComp` | string | optional | Which comparator the CBTO was measured with — the number means nothing without it |
| `shoulderMm` | number | optional | Shoulder bump |
| `shoulderComp` | string | optional | Comparator used for that measurement |
| `firings` | number | optional | Times this brass has been fired |
| `notes` | string | optional | |

Lot numbers are not on the load. They are a fact about the ammunition fired on one occasion,
and live on the session (§12.5.9).

#### 12.5.3 `targetImages`

| Field | Type | | Meaning |
|---|---|---|---|
| `id` | string | required | |
| `name` | string | required | Filename with the extension stripped, de-duplicated with a `(n)` suffix |
| `imageBlob` | Blob | required | The image itself |
| `contentHash` | string | required | SHA-256 of the file, so the same photograph uploaded twice is recognised |
| `size` | string | required | Human-readable size, e.g. `"482 KB"`. Display text, not a number. |

`imageBlob` is the one field JSON cannot carry. Export writes it as a Base64 `dataUrl` and
import converts it back; a record on disk has `dataUrl` and no `imageBlob`, and a record in
the database has the reverse.

#### 12.5.4 `customTargets`

A saved printable target, listed under My Targets. No shots, no session. Dimensions are inches. A row is one of two kinds (WS559): a target made with the Customize form carries `designJson` and no `templateJson`; a hand-written Target Script carries `templateJson` and no `designJson`.

| Field | Type | | Meaning |
|---|---|---|---|
| `id` | string | required | |
| `name` | string | required | |
| `paperSize` | string | optional | `letter`, `legal`, `a4`, `a3`, `12x12`, or the label sheets `3x2`, `4x4` and `4x6` |
| `orientation` | string | optional | `portrait` or `landscape`: how the target is laid out and edited. Print and Save Image always give the sheet's portrait side, a landscape layout turned onto it with its top edge to the left (WS520). |
| `printMode` | string | optional | `bw`, `gray` or `color`: the printer the sheet is made for (thermal label, laser, inkjet). The preview and both exports are converted to it. Absent means the sheet's own, black and white on a label sheet and color on paper (WS520). |
| `gridEnabled` | boolean | optional | |
| `gridSize` | number | optional | |
| `gridColor` | string | optional | CSS colour |
| `rows`, `cols` | number | optional | Bullseyes down and across the sheet |
| `marginX`, `marginY` | number | optional | |
| `shape` | string | optional | The bullseye's outline: `octagon`, `circle`, `square`, `diamond`, `star`, `triangle`, `triangle-down` or `hexagon` |
| `diameter` | number | optional | Bullseye diameter |
| `numRings` | number | optional | |
| `bullseyeColor`, `ringColorA`, `ringColorB` | string | optional | |
| `labelText`, `labelPosition`, `labelSize`, `labelMargin` | | optional | Printed caption. `labelPosition` is the sheet corner: `top-left`, `top-right`, `bottom-left` or `bottom-right`. `labelSize` is in points. |
| `designJson` | string | optional | The Customize form's whole state as JSON, for a target made with the form. The target is drawn from it and reopens in the form; the fields above are a copy of its plain values. |
| `templateJson` | string | optional | A hand-written Target Script: the JSON the target is drawn from, beside its `name`, `paperSize`, `orientation` and `printMode`. It reopens in the Script tab. |

#### 12.5.5 `markedTargets`

The sitting itself, and almost nothing else. Its substance is in `sessionTargets`, `groups`
and `shots`, all of which point back at its id.

| Field | Type | | Meaning |
|---|---|---|---|
| `id` | string | required | The value the three child tables store in their `sessionId` |
| `name` | string | optional | |
| `targetDistance` | number | optional | Required by the UI before a sitting can be saved — MOA, MIL and every trajectory figure depend on it |
| `distanceUnits` | string | optional | `yards` or `meters` |
| `createdAt` | number | required | Epoch milliseconds. Written once, when the sitting is first saved. |

#### 12.5.6 `sessionTargets`

One image placed in one sitting, and the scale for it. Re-saving a sitting deletes and
rewrites every row that belongs to it.

| Field | Type | | Meaning |
|---|---|---|---|
| `id` | string | required | |
| `sessionId` | string | required | → `markedTargets` (see §12.4) |
| `targetImageId` | string | required | → `targetImages` |
| `scale.p1`, `scale.p2` | `{x, y}` \| null | required | The two pixel points the user clicked on a known distance |
| `scale.distance` | number \| null | required | Real distance between them |
| `scale.units` | string | required | `in` or `mm`. Becomes `shots.units`. |
| `scale.pixelsPerUnit` | number \| null | required | Derived from the three above. Null means unscaled, and a sitting will not save while any target is. |

#### 12.5.7 `groups`

| Field | Type | | Meaning |
|---|---|---|---|
| `id` | string | required | |
| `sessionId` | string | required | → `markedTargets` (see §12.4) |
| `targetId` | string | required | → `sessionTargets` |
| `groupNum` | number | optional | Numbered across the whole sitting, not per image |
| `poa` | `{x, y}` \| null | required | Point of aim, **in pixels**. Every impact is measured from it, so a group without one is dropped at save. |
| `color` | string | required | Cycled from a fixed palette so groups stay distinguishable |

#### 12.5.8 `shots`

One round fired. Marked, chronographed, or both — see §12.4.

| Field | Type | | Meaning |
|---|---|---|---|
| `id` | string | required | |
| `velocity` | number \| null | required | Feet per second, or null. The only copy; the chronograph string does not hold one. |

Marked-target membership, absent when the shot was not marked:

| Field | Type | | Meaning |
|---|---|---|---|
| `groupId` | string | optional | → `groups` |
| `sessionId` | string | optional | → `markedTargets` (see §12.4) |
| `targetId` | string | optional | → `sessionTargets` |
| `shotNumber` | number | optional | Order the impacts were marked in |
| `x`, `y` | number | optional | Offset from the group's POA in `units`. **Y is inverted at save** so positive is up. |
| `px`, `py` | number | optional | Raw pixel position on the image. Kept so the mark can be redrawn without the scale. |
| `units` | string | optional | Copied from the target's `scale.units` |

Chronograph membership, absent when the shot was not chronographed:

| Field | Type | | Meaning |
|---|---|---|---|
| `chronoSessionId` | string | optional | → `chronoSessions` |
| `firingOrder` | number | optional | Position in the string as the device recorded it |
| `velocitySetAside` | `true` | optional | Set aside by the user as a chronograph misread: kept, and counted in no velocity statistic (WS431) |
| `timestamp` | string | optional | As reported by the device |

`firingOrder` and `shotNumber` are two different orderings and nothing may assume they line
up: one is the order rounds left the barrel, the other the order impacts were clicked.

Two type guards narrow the union — `isMarkedShot` (has a group and coordinates) and
`isChronographedShot` (has a string and a numeric velocity). Query by group or by string and
every row satisfies the matching guard by construction, but the type cannot know that, so
filter once at the boundary rather than null-checking downstream.

#### 12.5.9 `sessions`

What was fired, out of what, at what, in what weather.

| Field | Type | | Meaning |
|---|---|---|---|
| `id` | string | required | |
| `name` | string | optional | |
| `markedTargetId` | string | optional | → `markedTargets`. The paper this session produced. |
| `firearmId` | string | optional | → `firearms` |
| `loadId` | string | optional | → `loads` |
| `targetDistance` | number | optional | Copied from the marked target at save |
| `distanceUnits` | string | optional | `yards` or `meters` |
| `temp` | number | optional | °F |
| `roundTemp` | number | optional | °F, the ammunition's own when fired, from a logger with the rounds (WS434) |
| `altitude` | number | optional | Feet |
| `pressure` | number | optional | inHg |
| `pressureType` | string | optional | `station` (absolute) or `sea` (corrected to sea level). The number is unusable without it. |
| `chronoSessionId` | string | optional | → `chronoSessions`. One string measuring this session's load. |
| `roundCount` | number | optional | Approximate rounds through the barrel when this was fired |
| `powderLot` | string | optional | Lot number as printed on the box (WS438). Text; nothing computes with it |
| `primerLot` | string | optional | As `powderLot` |
| `bulletLot` | string | optional | As `powderLot` |
| `brassLot` | string | optional | As `powderLot` |

`chronoSessionId` is the direct association: without it, velocity could reach a session only
through marked paper, leaving a chronographed load with nothing marked unable to carry its
own numbers. One string per session matches how the devices work — a Garmin, LabRadar or
MagnetoSpeed file is normally one charge weight. A ladder fired as a single uninterrupted
string is the case it does not cover.

`roundCount` sits on the session and not on the firearm on purpose. "This string was fired at
~640 rounds" is a fact about an occasion and never changes; "this rifle has 640 rounds" is a
moving number that would re-hash every measurement that rifle ever produced each time it
ticked.

#### 12.5.10 `chronoSessions`

A header, and nothing else.

| Field | Type | | Meaning |
|---|---|---|---|
| `id` | string | required | `CHRN_`-prefixed |
| `name` | string | optional | The user's own label. Without one the string is described by its device and shot count. |
| `deviceType` | string | required | `labradar`, `magnetospeed`, `garmin_xero`, `fit` or `generic` |
| `importedAt` | number | required | Epoch milliseconds |
| `contentHash` | string | required | SHA-256 of the device and the readings in firing order, so a re-imported file lands on the string it already is instead of beside it |

Two identical strings are still two events, so the id is not the hash; the hash only
recognises a re-import of the same file.

Its shots are rows in `shots` carrying this id, not an array inside it, so a velocity has one
copy, on the shot.

#### 12.5.11 `monteCarloSaves`

A saved hit-probability scenario: the whole input form, verbatim, in the simulator's own
units.

| Field | Type | | Meaning |
|---|---|---|---|
| `id` | string | required | `MCS_`-prefixed |
| `name` | string | required | Matched case-insensitively on save, so re-saving under an existing name overwrites it |
| `createdAt` | number | required | Epoch milliseconds |
| `params` | object | required | 36 fields, `number \| null` unless noted below |

`params` groups into projectile (`mv`, `bulletWeight`, `bulletDiam`, `bc`, `bcType` as
`'G1' | 'G7'`, `twist`, `twistDirection` as `'right' | 'left'`), sight and zero (`sightHeight`,
`zeroDist`, `zeroOffsetX/Y`, `cantDegrees`), atmosphere (`temp`, `pressure`, `pressureType` as
`'sea' | 'station'`, `humidity` as 0–100, `altitude`, `windSpeed`,
`windDir`), the dispersion terms the simulation samples (`mvSd`, `bcSd`, `windSpeedSd`,
`windDirSd`, `windEstimateSd`, `rangeErrorSd`, `precisionMoa`, `cantSd`), Coriolis
(`latitude`, `azimuth`), the target (`targetShape` as `'circle' | 'rectangle' | 'ipsc'`,
`targetWidth`, `targetHeight`, and `targetWidthUnit` as `'in' | 'moa' | 'mil'`, an angle read at `rangeMax`) and the
run (`numRuns`, `rangeMax`, `rangeStep`).

Null means the field was left blank, which is not zero. `mv` and `rangeMax` are refused as
blank at run time rather than defaulted. `twistDirection`, `bcType`, `pressureType`,
`targetShape` and `targetWidthUnit` are never null, and nor are the eight dispersion terms:
each is a slider, so it is always a number.

#### 12.5.12 The user's own components

The component tables of §11 hold the user's components beside the library's. They have bare
ids (§12.2), a `updatedAt` like every user record, and travel in the user's backup; the library
install never touches them. A library record is never edited: an edit is saved as the user's
own copy, with a new id, ` (CUST)` on its name, and `derivedFrom` naming the original.

| Field | Type | | Meaning |
|---|---|---|---|
| `derivedFrom` | string | optional | The library record this is a copy of. The fitted corrections are keyed on the original's id through it; nothing is re-pointed at the copy. Absent on a component made from scratch. |
| `userMaxPressurePa` | number | optional | Cartridges only. The user's own pressure ceiling: a wildcat's, which has no standard, or a lower one for their rifle. Checked before either standard's. Never on a library record. |
| `parentCartridgeId` | string | optional | Cartridges only. The cartridge whose brass this one is formed from: a wildcat's parent case, the form's *Parent Case (Wildcat / Brass)*. Brass for the parent is offered for this cartridge, as brass for the original is for a copy through `derivedFrom`. Nothing else goes through it: no fitted correction and no published load. The form sets it, and so does saving a library cartridge with another caliber, which makes a new cartridge of the user's with the library one as parent. Never on a library record. |

§11's *required* describes the library's rows. A user's component may leave blank what the
form lets it. A bullet's `ballistics` may be `null`, and its `method` and `basis` are absent
once the user creates the bullet or edits its coefficient: there is no resolution behind it. A
drag curve the user edited carries `shape: 'edited'` and `source: null`. A primer made from
scratch has no `primerClass`.

A powder made from scratch has no fitted burn rate and is refused by the engine. A cartridge
made from scratch runs without corrections. A copy runs on its original's fit.

#### 12.5.13 `analysisQueues` and `analysisQueueShots`

| Field | Type | | Meaning |
|---|---|---|---|
| `analysisQueues.id` | string | required | `Q_`-prefixed |
| `analysisQueues.name` | string | required | |
| `analysisQueues.color` | string | required | |
| `analysisQueueShots.id` | string | required | `queueId:shotId` |
| `analysisQueueShots.queueId` | string | required | → `analysisQueues` |
| `analysisQueueShots.sessionId` | string | required | → `sessions`. A real session id, unlike the three in §12.4: the session the shot is read at, for its distance. |
| `analysisQueueShots.shotId` | string | required | → `shots` |

Removing a shot from a queue, or deleting the queue, leaves the shot itself in its session.

#### 12.5.14 `tombstones`

| Field | Type | | Meaning |
|---|---|---|---|
| `id` | string | required | The deleted record's id. Ids are unique across tables. |
| `table` | string | required | The table it was deleted from |
| `deletedAt` | number | required | Epoch milliseconds |

The store writes one whenever a user record is deleted, so the deletion reaches another device
through a backup merge rather than the record coming back. Tombstones carry no `updatedAt`.
