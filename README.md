# Empirical Precision — User Guide

*A field manual for handloaders and precision shooters.*

---

## 1. What Empirical Precision Is — and Who It's For

Empirical Precision is an **offline-first web app (PWA) for serious handloaders and precision rifle shooters.** It replaces gut feel — the lucky three-shot group, the powder-chart guess, the folklore about "flyers" — with measured data and physics. It does four things, and they reinforce each other:

- **Manage your components and ammunition.** Cartridges, bullets, powders, primers, and brass live in one searchable library, and each handload recipe records everything down to CBTO and case firings.
- **Model internal ballistics.** A thermodynamic combustion solver predicts your **chamber pressure** and **muzzle velocity** from first principles — so you can sanity-check a load against the SAAMI pressure ceiling *before* you pull the trigger.
- **Model external ballistics.** A 3DOF Runge-Kutta trajectory engine predicts **drop, wind deflection, spin drift, and hit probability** at distance, using high-resolution G1/G7 drag tables.
- **Record and analyze live-fire.** Photograph your targets, mark the impacts, pair them with chronograph velocities, and get **composite group statistics** that actually mean something.

**Who benefits:** anyone who wants to know *why* a load shoots the way it does — whether that's finding the tightest node, confirming a bullet is stable out of your twist, building a DOPE card, or ranking two loads by how far they'll reliably hit a target.

### Why everything is local

All of your data is stored in your browser's **IndexedDB** — on your device, not on a server. There is no account, no login, and no tracking. This matters for two concrete reasons:

- **Privacy.** Your firearms, loads, and range records never leave your device.
- **It works at the range.** Once loaded (or installed as a PWA), the app runs with **no cell signal and no Wi-Fi** — exactly where you need it.

The trade-off: **clearing your browser's site data deletes everything permanently.** Back up regularly (see [Backups](#12-backups--keeping-your-data-safe)). Installing the PWA requests persistent storage, which protects your data from routine browser eviction.

> **Navigation bar order:** About Us · Targets · Firearms · Load Library · Marking · Chronos · Sessions · Analysis · Heurisko · Components · DB Management. The **Empirical Precision** logo (top-left) returns you to the Dashboard.

---

## 2. Key Concepts to Understand First

A few ideas run through the whole app. Understanding them up front makes everything else click.

**Metric inside, imperial at the edges.** Every engine and every stored value is **strictly metric (SI)**. Grains, inches, and feet-per-second exist only in the input boxes and the display — they're converted the instant you type them and converted back only when shown. You never have to think about it, but it's why the physics is trustworthy: no unit ambiguity ever reaches the math.

**Calibration is what makes the pressure model safe.** The internal-ballistics engine isn't a generic estimator. Each powder's burn parameters are **fitted against real laboratory pressure-transducer data**. That's why the simulator can compare your predicted peak pressure to the cartridge's SAAMI limit and mean it. The corollary: **never hand-tweak a powder's burn coefficients to make predicted velocity match your chronograph** — doing so corrupts the pressure prediction and voids the safety audit. (For rifle-to-rifle velocity differences there's a dedicated, pressure-safe correction — see [Firearms](#6-firearms).)

**Data provenance and quality are tracked, not hidden.** The app is honest about how good a number is. Velocity SD that comes from real chronograph shots is labeled **measured**; when it's missing, the long-range analysis **imputes** a conservative value and flags the result as low-confidence rather than flattering a load with fake perfection. Likewise, group statistics carry confidence intervals and a reliability rating so you can tell a real result from a small-sample fluke.

**Install it as an app.** From **DB Management → Advanced → Install Offline App**, you can install Empirical Precision as a standalone PWA. It then launches from your home screen and runs fully offline. On iPhone/iPad, use Safari's Share → *Add to Home Screen*.

---

## 3. The Core Workflow

This is the recommended path from a fresh install to a statistically verified load. Each step exists for a reason, and doing them in this order means every later step already has the data it needs.

**Step 0 — Sync the master database.** On **DB Management**, click **Sync Remote Repo**. This pulls 600+ bullet profiles, 77 powders, and 45 factory cartridges into your local library, so you rarely have to enter a component by hand. Safe to re-run; it merges by ID and never touches your personal records.

**Step 1 — Add a Firearm.** *(Firearms tab)* Enter your rifle: cartridge, barrel length, twist rate, sight height over bore. **Why first:** twist rate drives the stability and spin-drift math, sight height drives the trajectory zero, and the cartridge determines which loads and pressure limits apply. Everything downstream inherits from this record.

**Step 2 — Add a Load.** *(Load Library tab)* Build the handload recipe: bullet, powder + charge, brass, primer, and seating dimensions (COAL/CBTO). **Why:** this is the exact ammunition whose performance you're about to measure and model. Precise seating data feeds the pressure and stability engines.

**Step 3 — Mark your impacts.** *(Marking tab)* Upload a photo of your target, set the scale, mark your point of aim and each bullet hole. **Why:** this converts a photograph into real, measured coordinates — the raw material for every group statistic. Save it as a **Marked Target.**

**Step 4 — Attach chronograph velocities.** *(Chronos tab)* Import your chrono file(s) and pair each velocity reading to a point of impact. **Why:** velocity is what connects *internal* consistency (SD, ES) to *external* behavior (vertical stringing, drop). **Velocity now lives only in Chronos** — you can import many files at once and pair each shot to any impact, in any order, even across different range sessions.

**Step 5 — Build a Session.** *(Sessions tab)* Combine a Marked Target + Firearm + Load + the day's environment (temperature, pressure, altitude). **Why:** a Session is the complete, self-contained record of *what was fired, from what, in what conditions* — the unit that Analysis and the simulators operate on.

**Step 6 — Analyze.** *(Analysis tab)* Select one Session or many, and run the analysis. **Why:** one small group is noise; ten small groups composited around their centers is a real measurement. This is where you get Mean Radius, reliability, velocity SD, and the long-range hit-probability ranking.

---

## 4. Dashboard (Home)

Reached via the logo, the Dashboard is your launch pad. It lays out the six-step Getting Started workflow as clickable cards, and offers one-tap buttons to **Sync the master database**, **open this User Guide**, and **join the Discord**. It's the fastest way to orient a new install or jump back into the pipeline.

---

## 5. About Us — *Philosophy & Reference*

The About page ("Philosophy & Reference") explains *why* the app works the way it does: composite statistics over single lucky groups, measured pressure over assumed pressure, a real solver over a rule of thumb. It also holds a feature overview and — importantly — the canonical definitions of every term the app uses. If a label ever seems ambiguous, this page (and the [Glossary](#13-glossary) below) is the source of truth. No data entry happens here.

---

## 6. Targets

A **target-design generator** for building printable paper targets *before* the range trip. Choose paper size and orientation, add a grid, pick a bullseye shape (round, square, diamond, star, triangle, hexagon), set ring counts and colors, and add a text label that can auto-pull cartridge and load details from your library. Export to **PDF** for printing or to an **image**.

**Why it matters:** a target with a known grid or ring size gives you a precise, printed reference distance — which makes scale-setting in Marking fast and accurate. (Note: photos of your *shot* targets are uploaded and scaled on the **Marking** page, not here.)

---

## 7. Firearms

Register each physical rifle once, then reuse it everywhere. Fields: **Nickname**, **Diameter → Cartridge**, **Barrel Length**, **Twist Rate** (entered as the `X` in 1:X), **Sight Height** over bore, **Mag COAL**, and measured **Freebore**.

**Why each field matters:**
- **Twist rate** feeds the gyroscopic-stability (Sg) and spin-drift calculations. Get it wrong and every long-range prediction is off.
- **Sight height over bore** sets where the line of sight crosses the trajectory — essential for correct drop and zero.
- **Barrel length** feeds the internal-ballistics velocity prediction.
- **Freebore** (if you've measured it) overrides the generic SAAMI spec, tightening the pressure model to *your* chamber.
- **Mag COAL** records the longest round your magazine will feed, which may be shorter than SAAMI max.

**Per-firearm velocity offset (pressure-safe).** Two rifles in the same chambering can throw the same load at different speeds because of bore, throat, and finish differences — a property of *your barrel*, not the powder. Using the **Ignition** simulator (in Heurisko), you can compare the model's predicted velocity to your measured chronograph mean and store the difference as a correction **on the firearm record.** This correction adjusts only the *displayed* velocity — it never touches the pressure trace or the safety audit. It's the right way to reconcile the model with your rifle without corrupting the physics.

---

## 8. Load Library

Catalog every handload recipe in full. The form walks through six sections: **1) Cartridge Spec** (diameter + case), **2) Bullet Details** (weight, bullet, lot), **3) Powder Charge** (manufacturer, brand, charge in grains, lot), **4) Brass Specs** (manufacturer, pocket size, exact case, lot, number of firings), **5) Primer Details**, and **6) Seating & Precision Dimensions** (COAL, CBTO + comparator tool, base-to-shoulder + comparator). Leave the nickname blank to auto-generate a descriptive name.

**Why the detail is worth it:** the load record is what the engines read. Charge weight and case capacity drive the pressure/velocity model; bullet and COAL drive stability and trajectory; brass firings and lots let you trace an anomaly back to a component. The saved-loads list sorts by nickname, cartridge, bullet weight, powder, charge, or COAL so you can compare a ladder at a glance.

---

## 9. Marking

Marking turns a **photo of your target** into precise, measured impact coordinates. This is the foundation of all group analysis — do it carefully.

**The golden rule: set the scale before you mark anything.** Without a scale, every measurement is in raw pixels, which is meaningless.

**Workflow:**
1. **Add a target image.** Under *Targets* in the left sidebar, **Upload Image(s)** (stored efficiently as WebP) or pick one from the gallery, then **Add Target** to place it on the canvas.
2. **Set the scale.** Enter a known reference distance (e.g. `2` inches — a ring diameter or grid square), click **Set Scale**, then click the two endpoints of that distance on the image. This calibrates pixels-per-inch.
3. **New Group.** Each group is a set of shots fired at one point of aim.
4. **Set POA.** Click your point of aim.
5. **Mark POI.** Click each bullet hole; a numbered dot appears. Use **Undo Last** or **Erase Shot** to fix mistakes.
6. **Enter the target distance** (yards or meters) — this is required, because angular metrics (MOA/MIL) and the trajectory math depend on it.
7. **Name it and SAVE MARKED TARGET.**

**Why it matters:** the impact coordinates you capture here become Mean Radius, group size, MPI offset, stringing diagnostics, and the dispersion seed for the hit-probability simulator. A careful scale and honest impact marks are the difference between a real measurement and garbage-in.

> **Velocity is no longer entered on this page.** The Impact Data table shows coordinates only. Muzzle velocities are attached in **Chronos** (next section) — either imported from a chronograph or typed in by hand there. Any velocity already attached to a shot is preserved when you re-save a marked target.

---

## 10. Chronos

Chronos is where **muzzle velocity meets point of impact.** It imports chronograph files, stores them as reusable sessions, exports them for spreadsheets, and — the key job — **pairs each velocity reading with the shot that made it.**

### Import
Drag-and-drop or browse for one or more files. Formats are auto-detected: **Garmin FIT** (binary, including `.fit` exported from a Xero), **LabRadar CSV**, **MagnetoSpeed CSV**, **Garmin Xero CSV**, and a **Generic CSV** fallback for any file with a numeric velocity column. After parsing you get an **Avg / SD V / ES V / Min / Max** summary and a per-shot velocity log; parse problems show inline warnings.

- **One file** loads into the editor — name it and **Save** it as a reusable Chrono Session.
- **Many files at once** are each imported straight into your library, auto-named — ideal for a full day's worth of strings that you'll pair up later.

**Why import in bulk:** chrono data is independent of your targets. You can dump every string from a range trip now and associate them to impacts whenever it's convenient — even matching one string against impacts spread across several marking sessions.

### Load Marking Data
Select **one or more Marked Targets** (checkboxes). Their points of impact are **pooled into a single list**, so a single chrono string can be paired against impacts from multiple sessions. Each impact row has a velocity field you can also **type into by hand** — this is the new home for manual velocity entry.

### Associate & Apply Velocities
This is the heart of the tab, and it works in **any order**:
1. Click **any chrono shot** in the import list (it highlights blue).
2. Click **any point of impact** — from any loaded marking session — to pair the two. Order doesn't matter; the chrono and impact lists need not line up.
3. Repeat for each shot. If both lists happen to already be in the same sequence, **Auto-Match (in order)** links them all at once.
4. Review the pairings and click **Apply Velocities** to write each measured velocity onto its shot in the database. **Unlink** any single pair, or **Clear All** to start over.

**Why this design:** real chronograph strings and real target impacts rarely arrive in the same tidy order — you might shoot two groups, chrono one, or lose a reading. Free-form, cross-session pairing lets you reconstruct the truth instead of forcing a false 1:1 assumption. Once applied, those velocities power vertical-stringing analysis, velocity SD, and the firearm velocity offset.

### Export
With a session loaded, download it as **CSV**, **TSV** (paste straight into Excel/Sheets), or **JSON** (includes computed stats and any impact links), or **Copy to Clipboard** as a tab-separated table.

---

## 11. Sessions

A **Session** ties everything together into one analyzable record: a **Marked Target** + the **Firearm** + the **Load** + the **environmental conditions** (temperature, pressure/type, altitude). Selecting a firearm filters the load list to matching cartridges. Give it a name (or accept the auto-generated one) and **Create Session**.

**Why the Session is the unit of analysis:** dispersion and trajectory both depend on conditions and equipment, not just where the holes landed. Bundling the target with the exact rifle, load, and atmosphere makes the record reproducible and lets Analysis and the simulators pull correct inputs automatically. You can edit, delete, and **export individual sessions as JSON**, or **import** sessions others have shared — a clean way to back up or exchange a single load's history.

---

## 12. Analysis

Analysis is where small groups become a real measurement. Select sessions (filter by firearm, cartridge, bullet, or powder to narrow the list), click **Analyze Selected**, and read the results table, the composite overlay plot, and the full text report. **Advanced (Queue) mode** lets you cherry-pick individual shots across many sessions into a custom dataset — useful for combining ladder rungs or excluding a known equipment error.

> **Why composite?** A single 5-shot group is mostly luck. Ten 5-shot groups aligned by their centers give you a 50-shot picture of what the rifle and load actually do. Mean Radius on 50 shots is worth far more than extreme spread on 5.

### Dispersion — how tight is it, really?
- **Mean Radius (MR)** — the average distance of every shot from the group center. The preferred precision metric because it uses *every* shot, not just the two widest. Reported in inches/mm and, when a target distance is set, in **MOA** (and MIL).
- **95% Confidence Interval (CI)** — the range the *true* Mean Radius is likely to sit in, given your sample size. A wide CI is the app telling you "you haven't shot enough to be sure yet." Rankings are sorted by the CI **upper bound**, so a lucky small sample can't jump the queue.
- **ES POI (Group Size)** and **ES POI H/V** — classic extreme spread, and its horizontal/vertical split. Quick to read but outlier-sensitive; best used to *flag* a gross problem (baffle strike, loose screws) rather than to judge precision.
- **SD POI H / V** — standard deviation of impacts horizontally vs. vertically. A diagnostic: if vertical ≫ horizontal you have **vertical stringing** (suspect velocity spread, firing pin, or barrel contact); if horizontal ≫ vertical, suspect **wind, bipod, or trigger push**.
- **MPI Offset** — where the group's center prints relative to aim. Tells you *where* it hits, not *how tightly*.

### Velocity — how consistent is the ammo?
- **SD V (velocity standard deviation)** — the primary measure of internal-ballistic consistency, reported with its own confidence interval. Lower is better; it's what drives vertical drop at distance.
- **ES V (velocity extreme spread)** — a red-flag indicator. A sudden jump (60+ fps) points at something mechanical: a blown primer, erratic ignition, inconsistent neck tension.
- **Vert Dispersion R²** — a regression of velocity against vertical impact position. Above ~40% means velocity spread is *statistically driving* your vertical stringing — so chasing lower SD will tighten the group. Near zero means your vertical isn't a velocity problem, and load tuning for SD won't help the group.

### Reliability Rating
A single **0.5–5.0 star** grade that folds sample size, bootstrap CI convergence, and Shapiro-Wilk normality (of both impact location and velocity) into one at-a-glance score. It answers "how much should I trust this result?" — a five-star tight group is a conclusion; a two-star tight group is a hint that needs more rounds.

### The long-range metric — "most precise" ≠ "best out to distance"
Beyond raw grouping, Analysis computes a **95% Hit-Probability Max Distance** for each load: the farthest range at which the load holds **≥ 95% hit probability on a 2 MOA target in a 10 mph, 90° crosswind.** It's deliberately *conservative* (per-axis dispersion is widened to the Mean-Radius 95% CI upper bound), *anisotropic* (vertical velocity-spread and horizontal wind-spread are modeled separately), and honest about missing data (velocity SD is **imputed and flagged** when you have no chrono readings). Alongside it you get:

- **Vertical/horizontal miss budget** — at the fall-off distance, what fraction of misses are vertical (velocity-driven) vs. horizontal (wind-driven). This tells you *what to fix*.
- **Transonic (stability) limit** — the range where the bullet slows to ~Mach 1.2. If that comes before the dispersion limit, *it* is what's capping your effective range, not your grouping.
- **Wind robustness** — the 95% distance recomputed at 5/10/15 mph, so you can see how quickly a load falls apart when the wind picks up.

**Why this reranking matters:** the app produces two rankings — one by pure dispersion (best *average* group) and one by this hit-probability distance. They often disagree. A load that prints the tiniest 100-yard group can be **beaten at 800 yards** by a slightly larger-grouping load with a higher BC, tighter velocity SD, or more supersonic margin. "Most precise up close" and "hits farthest" are different questions, and this is the tool that separates them.

**Export:** **SAVE IMAGE** downloads a high-resolution composite plot + data HUD; **Copy Report** copies the full structured text report (rankings, per-session metrics, environment, and the exact database parameters used).

---

## 13. Heurisko — the Ballistics & Simulation Suite

"Heurisko" (Greek: *I find*) is the app's scientific bench. Five sub-tabs, each answering a different forward-looking question. All of them **auto-fill from your firearms, loads, and sessions** so you're modeling your real equipment, not made-up numbers.

**Efstathia — Gyroscopic Stability (Sg).** Uses the Refined Miller Twist Rule (corrected for velocity and air density) to compute your stability factor. **Sg ≥ 1.5** = fully stable; **1.0–1.5** = marginal (yaw robs 10–15% of BC and opens groups); **< 1.0** = unstable, will tumble and keyhole. Handles plastic-tipped bullets by modeling the metal core length. *Why:* tells you before you buy whether a bullet will even stabilize out of your twist.

**Kylindros — Ballistic Coefficient Estimation.** Solves for your bullet's actual BC from measured muzzle velocities and downrange impacts, with a shot-by-shot distribution, a 95% CI, and a reliability HUD. Requires ≥ 300 yd/m (below that, rifle dispersion masks drag differences) and is very sensitive to zero error. *Why:* verify a manufacturer's advertised BC against how the bullet really flies from your barrel.

**Monte Carlo — Hit Probability.** Seeds a physics trajectory engine with your session's *measured* dispersion and produces P(Hit)-vs-range curves against a target you define (IPSC, circle, square). Runs off the main thread so the UI stays responsive. *Why:* turns "it groups well" into "it hits a 10-inch plate 9 times out of 10 at 500 yards."

**Ignition — Internal Ballistics (the pressure/velocity engine).** Simulates propellant combustion and bullet acceleration down the bore, producing pressure-time (P-V) curves, burn percentage, and predicted muzzle velocity. Its **safety audits** are the standout feature: peak pressure vs. the SAAMI ceiling (with overpressure warnings), loading-density/case-fill flags (low-fill detonation risk, over-compression), a one-caliber neck-tension check, and COAL-vs-SAAMI-max. This is also where you derive the **per-firearm velocity offset**, and where you can copy/download/email a full diagnostic report. *Why:* it's the closest thing to a pressure test you can run at your bench — and it fails loud rather than guessing.

**DOPE — Drop Card & Point-Blank Zero.** Generates pocket ballistic cards from the RK4 trajectory engine: MIL or MOA turret values, regular or custom range stops, and a **Maximum Point Blank Range (MPBR)** solver that finds the zero keeping impacts inside a vital zone with no elevation dialing. Multiple print themes for a high-res PNG. *Why:* a field-ready come-up card built from your exact load and conditions.

---

## 14. Components

The foundation library beneath everything else. The master-database sync fills most of it, so you usually only add what's missing or custom. Each sub-tab has a search box plus diameter / cartridge / manufacturer filters to narrow large lists quickly, and add / edit / delete controls for every record.

| Sub-tab | What it stores |
|---|---|
| **Manufacturers** | Makers of bullets, powder, primers, brass, or ammo |
| **Diameters** | Caliber definitions (e.g. `.308`, `.264`) |
| **Cartridges** | Chamberings tied to a diameter, with SAAMI specs and pressure limits |
| **Bullets** | Full profiles: weight, length, ogive, G1/G7 BC, material/tip |
| **Powders** | Combustion coefficients (burn-area coefficient, burn exponent, heat of explosion, densities, grain geometry, temperature sensitivity), with per-cartridge overrides |
| **Primers** | Primer inventory tied to pocket size |
| **Brass** | Cases with water capacity and primer data |

**Why it matters:** a wrong number here silently corrupts every load and simulation that references it. Optional fields improve simulation accuracy; the app fails loudly on truly missing data rather than guessing.

---

## 15. DB Management

Your control panel for the whole local database.

- **Sync Empirical Precision Database → Sync Remote Repo** — pulls the master component library (600+ bullets, 77 powders, 45 cartridges). Merges by ID; your personal records are untouched. Run it on first setup and whenever you want the latest reference data.
- **Import Saved JSON Data** — restore or merge a previous export (or a friend's shared data). Merged by ID; images are rebuilt automatically.
- **Advanced Database Settings:**
  - **Active Table** — scope the actions below to the whole database or one table.
  - **Export Selected Table** — download a `.json` backup (whole DB or one table). **This is your backup button.**
  - **Install Offline App** — install the PWA for full offline use (see [Key Concepts](#2-key-concepts-to-understand-first)).
  - **Wipe Active Table** — *destructive.* Clears the selected table or the entire database.
  - **Raw DB Records Browser** — inspect or delete individual IndexedDB records when a specific table is selected.

---

## 16. Backups — Keeping Your Data Safe

> ⚠️ **Your data lives only in your browser. Clearing site data deletes it permanently, with no recovery except a backup.**

**Back up:** DB Management → Advanced → set Active Table to *Entire Database* → **Export Selected Table** → save the `.json` somewhere safe (cloud + external drive).

**Restore:** DB Management → **Import Saved JSON Data** → choose your `.json` → import. Records merge by ID; your other data is preserved. Firearm velocity offsets ride along automatically.

**Back up after:** every range session, adding firearms/loads, saving a velocity offset, or running a master-database sync. Installing the PWA also requests persistent storage, which guards against routine browser eviction.

---

## 17. Troubleshooting

**My measurements are huge / nonsensical.** You marked shots before setting the scale, so everything is in pixels. Reload the marked target, **Set Scale**, and re-save.

**My groups disappeared after closing the browser.** The canvas isn't auto-saved. Always **SAVE MARKED TARGET** in Marking and **Create/Update Session** in Sessions before leaving.

**Where did the velocity boxes go in Marking?** Velocity entry moved to **Chronos** — either import a chrono file and pair each reading to an impact, or type velocities by hand in the *Load Marking Data* impact list there.

**The trajectory/stability results look wrong.** Check that the firearm has twist rate and sight height, the bullet has a G7 BC, the muzzle velocity is realistic, and the environment is set.

**The Ignition simulator's velocity doesn't match my chronograph.** Expected — the model is calibrated to lab pressure data, not to your specific barrel. Use the **per-firearm velocity offset** to store the difference. **Do not** edit powder burn coefficients to force a match; that corrupts the pressure prediction and safety audit.

**I cleared my browser and lost everything.** Without a JSON backup there is no recovery. Back up after every session.

---

## 18. Glossary

The canonical definition for every term used here and throughout the app. When standardizing a label anywhere, match the wording below.

### Workflow

| Term | Meaning |
|---|---|
| **Session** | One analyzable record: a marked target plus firearm, load, distance, and environment |
| **Marked Target** | A target photo with its scale, groups, points of aim, and marked impacts |
| **Group** | A set of shots fired at a single point of aim |
| **POA** | Point of Aim — where you were aiming |
| **POI** | Point of Impact — where a bullet struck; the coordinate every group statistic is built from |
| **MPI** | Mean Point of Impact — the average position of all POIs in a group; the group's center |
| **Scale** | The pixels-per-inch calibration you set in Marking |
| **Composite Analysis** | Combining multiple sessions aligned by MPI to build meaningful sample sizes from small groups |
| **Rifle Velocity Offset** | A per-firearm correction reconciling the model's predicted velocity with your chronograph; affects displayed velocity only, never pressure or the safety audit |

### Statistics & Precision

| Term | Meaning |
|---|---|
| **Mean Radius (MR)** | Average distance of every shot from the group center — the preferred precision metric |
| **95% CI** | Confidence interval — the range the true value likely occupies given the sample size |
| **ES POI (Group Size)** | Center-to-center distance between the two widest shots; outlier-sensitive |
| **ES POI H/V** | Horizontal and vertical extreme spread, measured separately |
| **SD POI H/V** | Standard deviation of impacts horizontally/vertically; a stringing diagnostic |
| **MPI Offset** | Average impact position relative to aim — where it prints, not how tightly |
| **Reliability Rating** | 0.5–5.0 star confidence score combining sample size, CI convergence, and normality |
| **SD V** | Velocity standard deviation — primary indicator of internal-ballistic consistency |
| **ES V** | Velocity extreme spread — a red-flag indicator, not a precision metric |
| **Vert Dispersion R²** | Regression of velocity vs. vertical impact; > ~40% means velocity spread is driving vertical stringing |
| **Shapiro-Wilk** | Normality test on impact radii and on velocities; feeds the reliability rating |
| **95% Hit-Prob Max Distance** | Conservative farthest range holding ≥ 95% hits on a 2 MOA target in a 10 mph crosswind |
| **Miss Budget** | The vertical (velocity) vs. horizontal (wind) split of misses at the fall-off distance |
| **Transonic Limit** | Range where the bullet slows to ~Mach 1.2; may cap effective range before dispersion does |

### Cartridge & Seating

| Term | Meaning |
|---|---|
| **COAL** | Cartridge Overall Length — the measured length of your loaded round |
| **SAAMI OAL** | The published maximum overall length — a ceiling, not your measurement |
| **Mag COAL** | The longest round a given magazine will feed |
| **CBTO** | Cartridge Base to Ogive — more repeatable than COAL for setting seating depth |
| **Freebore** | The unrifled throat length ahead of the chamber; measured value overrides the SAAMI spec |

### Angular & Ballistic

| Term | Meaning |
|---|---|
| **MOA** | Minute of Angle (≈ 1.047 in at 100 yd) |
| **MIL** | Milliradian (10 cm at 100 m) |
| **BC** | Ballistic Coefficient — resistance to drag; higher = flatter, less wind drift (G1 and G7 supported) |
| **Sg** | Gyroscopic Stability Factor — ≥ 1.5 fully stable, < 1.0 tumbles |
| **Internal Ballistics** | Combustion, pressure, and muzzle velocity inside the barrel |
| **External Ballistics** | Drag, wind, drop, spin drift, and Coriolis after the muzzle |

### Heurisko Tools

| Term | Meaning |
|---|---|
| **Efstathia** | Gyroscopic stability (Sg) calculator |
| **Kylindros** | Ballistic-coefficient estimator from measured data |
| **Monte Carlo** | Hit-probability trajectory simulator |
| **Ignition** | Internal-ballistics pressure/velocity engine with SAAMI safety audits |
| **DOPE** | Data On Previous Engagement — a drop/drift correction card |
| **MPBR** | Maximum Point Blank Range — the no-dial zero keeping impacts in a vital zone |

### Technical

| Term | Meaning |
|---|---|
| **PWA** | Progressive Web App — an installable, fully offline version of the app |
| **IndexedDB** | The in-browser database where all your data is stored locally |

---

## Community & Support

Join the **Empirical Precision Discord** for load discussion, bug reports, and feature requests: **[discord.gg/adymGUfjst](https://discord.gg/adymGUfjst)** (also linked from the Dashboard).
