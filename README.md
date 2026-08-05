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

The trade-off: **clearing your browser's site data deletes everything permanently.** Back up regularly (see [DB Management & Backups](#13-db-management--backups)). Installing the PWA requests persistent storage, which protects your data from routine browser eviction.

> **Navigation bar order:** Targets · Firearms · Load Library · Marking · Chronos · Sessions · Analysis · Heurisko · Components · DB Management. The **Empirical Precision** logo (top-left) returns you to the Dashboard.

---

## 2. The Core Workflow

This is the recommended path from a fresh install to a statistically verified load. Each step exists for a reason, and doing them in this order means every later step already has the data it needs.

**Step 0 — Sync the master database.** On **DB Management**, click **Sync Remote Repo**. This pulls 600+ bullet profiles, 77 powders, and 45 factory cartridges into your local library, so you rarely have to enter a component by hand. Safe to re-run; it merges by ID and never touches your personal records.

**Step 1 — Add a Firearm.** *(Firearms tab)* Enter your rifle: cartridge, barrel length, twist rate, sight height over bore. **Why first:** twist rate drives the stability and spin-drift math, sight height drives the trajectory zero, and the cartridge determines which loads and pressure limits apply. Everything downstream inherits from this record.

**Step 2 — Add a Load.** *(Load Library tab)* Build the handload recipe: bullet, powder + charge, brass, primer, and seating dimensions (COAL/CBTO). **Why:** this is the exact ammunition whose performance you're about to measure and model. Precise seating data feeds the pressure and stability engines.

**Step 3 — Mark your impacts.** *(Marking tab)* Upload a photo of your target, set the scale, mark your point of aim and each bullet hole. **Why:** this converts a photograph into real, measured coordinates — the raw material for every group statistic. Save it as a **Marked Target.**

**Step 4 — Attach chronograph velocities.** *(Chronos tab)* Import your chrono file(s) and pair each velocity reading to a point of impact. **Why:** velocity is what connects *internal* consistency (SD, ES) to *external* behavior (vertical stringing, drop). **Velocity now lives only in Chronos** — you can import many files at once and pair each shot to any impact, in any order, even across different range sessions.

**Step 5 — Build a Session.** *(Sessions tab)* Combine a Marked Target + Firearm + Load + the day's environment (temperature, pressure, altitude). **Why:** a Session is the complete, self-contained record of *what was fired, from what, in what conditions* — the unit that Analysis and the simulators operate on.

**Step 6 — Analyze.** *(Analysis tab)* Select one Session or many, and run the analysis. **Why:** one small group is noise; ten small groups composited around their centers is a real measurement. This is where you get Mean Radius, reliability, velocity SD, and the long-range hit-probability ranking.

---

## 3. Dashboard (Home)

Reached via the logo, the Dashboard is your launch pad. It lays out the six-step Getting Started workflow as clickable cards, and offers one-tap buttons to **Sync the master database**, **open this User Guide**, and **join the Discord**. It's the fastest way to orient a new install or jump back into the pipeline. The bottom of the page also holds links to the **Documentation**, **Source Code**, and **Models** references, plus contact and publisher information. If a label ever seems ambiguous, the [Glossary](#16-glossary) below is the source of truth.

---

## 4. Targets

A **target-design generator** for building printable paper targets *before* the range trip. Choose paper size and orientation, add a grid, pick a bullseye shape (round, square, diamond, star, triangle, hexagon), set ring counts and colors, and add a text label that can auto-pull cartridge and load details from your library. Export to **PDF** for printing or to an **image**.

**Why it matters:** a target with a known grid or ring size gives you a precise, printed reference distance — which makes scale-setting in Marking fast and accurate. (Note: photos of your *shot* targets are uploaded and scaled on the **Marking** page, not here.)

---

## 5. Firearms

Register each physical rifle once, then reuse it everywhere. Fields: **Nickname**, **Caliber → Cartridge**, **Barrel Length**, **Twist Rate** (entered as the `X` in 1:X), **Sight Height** over bore, **Mag COAL**, and measured **Freebore**.

**Why each field matters:**
- **Twist rate** feeds the gyroscopic-stability (Sg) and spin-drift calculations. Get it wrong and every long-range prediction is off.
- **Sight height over bore** sets where the line of sight crosses the trajectory — essential for correct drop and zero.
- **Barrel length** feeds the internal-ballistics velocity prediction.
- **Freebore** (if you've measured it) overrides the generic SAAMI spec, tightening the pressure model to *your* chamber.
- **Mag COAL** records the longest round your magazine will feed, which may be shorter than SAAMI max.

**Per-firearm velocity offset (pressure-safe).** Two rifles in the same chambering can throw the same load at different speeds because of bore, throat, and finish differences — a property of *your barrel*, not the powder. Using the **Ignition** simulator (in Heurisko), you can compare the model's predicted velocity to your measured chronograph mean and store the difference as a correction **on the firearm record.** This correction adjusts only the *displayed* velocity — it never touches the pressure trace or the safety audit. It's the right way to reconcile the model with your rifle without corrupting the physics.

---

## 6. Load Library

Catalog every handload recipe in full. The form walks through six sections: **1) Cartridge Spec** (caliber + case), **2) Bullet Details** (weight, bullet, lot), **3) Powder Charge** (manufacturer, brand, charge in grains, lot), **4) Brass Specs** (manufacturer, pocket size, exact case, lot, number of firings), **5) Primer Details**, and **6) Seating & Precision Dimensions** (COAL, CBTO + comparator tool, base-to-shoulder + comparator). Leave the nickname blank to auto-generate a descriptive name.

**Why the detail is worth it:** the load record is what the engines read. Charge weight and case capacity drive the pressure/velocity model; bullet and COAL drive stability and trajectory; brass firings and lots let you trace an anomaly back to a component. The saved-loads list sorts by nickname, cartridge, bullet weight, powder, charge, or COAL so you can compare a ladder at a glance.

---

## 7. Marking

Marking turns a **photo of your target** into precise, measured impact coordinates. This is the foundation of all group analysis — do it carefully.

**The golden rule: set the scale before you mark anything.** Without a scale, every measurement is in raw pixels, which is meaningless.

**The left column is numbered in the order you work down it.**

**1 · Target Image.** **Import into Gallery** adds photographs to your permanent gallery (stored efficiently as WebP); **Delete from Gallery** removes one. Then **Select from Gallery** and **Add to Canvas** places it in front of you. Zoom lives here too, because it acts on the image.

**2 · Scale.** Enter a known reference distance (e.g. `2` inches — a ring diameter or grid square), click **Set Scale**, then click the two endpoints of that distance on the image. This calibrates pixels-per-inch, and it must come first: without it every measurement is in raw pixels.

**3 · Mark Shots.** **New Group** for each set of shots fired at one point of aim, then **Set POA** and click your aim point, then **Mark POI** and click each bullet hole. The armed tool highlights green. **Undo Last** and **Erase Shot** fix mistakes.

**4 · Target Distance.** Yards or meters. Required — angular metrics (MOA/MIL) and all trajectory math depend on it.

**5 · Marking Job.** **Save Marking Job** is the top button in the card, since it is the action that finishes the work. The name auto-generates from distance and shot count if you leave it blank. Below it, **Load Previous Marking Job** and **Delete Previous Marking Job** work on jobs you saved earlier, and **Clear Fields** at the bottom empties the canvas to start fresh.

**Why it matters:** the impact coordinates you capture here become Mean Radius, group size, MPI offset, stringing diagnostics, and the dispersion seed for the hit-probability simulator. A careful scale and honest impact marks are the difference between a real measurement and garbage-in.

> **Velocity is no longer entered on this page.** The Impact Data table shows coordinates only. Muzzle velocities are attached in **Chronos** (next section) — either imported from a chronograph or typed in by hand there. Any velocity already attached to a shot is preserved when you re-save a marked target.

---

## 8. Chronos

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

## 9. Sessions

A **Session** ties everything together into one analyzable record: a **Marked Target** + the **Firearm** + the **Load** + the **environmental conditions** (temperature, pressure/type, altitude). Selecting a firearm filters the load list to matching cartridges. Give it a name (or accept the auto-generated one) and **Create Session**.

**Why the Session is the unit of analysis:** dispersion and trajectory both depend on conditions and equipment, not just where the holes landed. Bundling the target with the exact rifle, load, and atmosphere makes the record reproducible and lets Analysis and the simulators pull correct inputs automatically. You can edit, delete, and **export individual sessions as JSON**, or **import** sessions others have shared — a clean way to back up or exchange a single load's history.

**Contribute.** The **Contribute…** link at the top of the saved-session list opens a page that packages complete sessions — load, components, conditions and chronograph velocities — for submission back to the project, so the internal-ballistics model can be refit against more real-world data. It checks each session first and tells you exactly what is missing from the ones that aren't eligible. Submission is optional and can be anonymous.

---

## 10. Analysis

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

## 11. Heurisko — the Ballistics & Simulation Suite

"Heurisko" (Greek: *I find*) is the app's scientific bench. **Six sub-tabs**, in this order, each answering a different forward-looking question. All of them **auto-fill from your firearms, loads, and sessions** so you're modeling your real equipment, not made-up numbers.

**Ignition — Internal Ballistics (the pressure/velocity engine).** Simulates propellant combustion and bullet acceleration down the bore, producing pressure-time curves, burn percentage, and predicted muzzle velocity. Its **safety audits** are the standout feature: peak pressure vs. the SAAMI ceiling, case-fill flags (low-fill risk, over-compression), a one-caliber seating-depth check, and COAL vs. SAAMI OAL. This is also where you derive the **per-firearm velocity offset**. *Why:* it's the closest thing to a pressure test you can run at your bench — and it fails loud rather than guessing.

**Monte Carlo — Hit Probability.** Seeds the trajectory engine with your dispersion and *uncertainty* in every input, then fires thousands of virtual shots to produce P(Hit)-vs-range curves and an impact heat map against a target you define. *Why:* turns "it groups well" into "it hits a 10-inch plate 9 times out of 10 at 500 yards."

**Efstathia — Gyroscopic Stability (Sg).** Uses the Refined Miller Twist Rule (corrected for velocity and air density) to compute your stability factor. **Sg ≥ 1.5** = fully stable; **1.0–1.5** = marginal (yaw robs 10–15% of BC and opens groups); **< 1.0** = unstable, will tumble and keyhole. Handles plastic-tipped bullets by modeling the metal core length. *Why:* tells you before you buy whether a bullet will even stabilize out of your twist.

**Kylindros — Ballistic Coefficient Estimation.** Solves for your bullet's actual BC from measured muzzle velocities and downrange impacts, with a shot-by-shot distribution, a 95% CI, and a reliability readout. Requires ≥ 300 yd/m and is very sensitive to zero error. *Why:* verify a manufacturer's advertised BC against how the bullet really flies from your barrel.

**Manteis — Empirical Hit Probability.** The only tool that compares **many saved sessions at once**. It builds a hit-percentage matrix across a distance band and a set of crosswinds, using each session's *measured* group dispersion and velocity consistency, and crowns a winner at every distance. *Why:* answers "which of my loads should I actually take to a 700-yard match?" using data you already shot.

**DOPE — Drop Card & Point-Blank Zero.** Generates pocket ballistic cards from the RK4 trajectory engine: MIL or MOA turret values, regular or custom range stops, and a **Maximum Point Blank Range (MPBR)** solver that finds the zero keeping impacts inside a vital zone with no elevation dialing. Exports as a high-resolution PNG. *Why:* a field-ready come-up card built from your exact load and conditions.

> **Every tool starts the same way:** pick a **Session** (fills everything), or work down **Firearm → Caliber → Cartridge → Bullet Manufacturer → Bullet Name**. Caliber narrows the cartridge list; cartridge narrows nothing else — **choosing a cartridge never picks a bullet for you.** Field-by-field detail for all six tools is in [The Advanced Tool Guide](#14-the-advanced-tool-guide--heurisko-field-by-field).

---

## 12. Components

The foundation library beneath everything else. The master-database sync fills most of it, so you usually only add what's missing or custom. Each sub-tab has a search box plus caliber / cartridge / manufacturer filters to narrow large lists quickly, and add / edit / delete controls for every record.

| Sub-tab | What it stores |
|---|---|
| **Manufacturers** | Makers of bullets, powder, primers, brass, or ammo |
| **Diameters** | Caliber definitions (e.g. `.308`, `.264`) — selected as **Caliber** everywhere in the app |
| **Cartridges** | Chamberings tied to a diameter, with SAAMI specs and pressure limits |
| **Bullets** | Full profiles: weight, length, ogive, G1/G7 BC, material/tip |
| **Powders** | Combustion coefficients (burn-area coefficient, burn exponent, heat of explosion, densities, grain geometry, temperature sensitivity), with per-cartridge overrides |
| **Primers** | Primer inventory tied to pocket size |
| **Brass** | Cases with water capacity and primer data |

**Why it matters:** a wrong number here silently corrupts every load and simulation that references it. Optional fields improve simulation accuracy; the app fails loudly on truly missing data rather than guessing.

---

## 13. DB Management & Backups

Your control panel for the whole local database.

- **Sync Empirical Precision Database → Sync Remote Repo** — pulls the master component library (600+ bullets, 77 powders, 45 cartridges). Merges by ID; your personal records are untouched. Run it on first setup and whenever you want the latest reference data.
- **Import Saved JSON Data** — restore or merge a previous export (or a friend's shared data). Merged by ID; images are rebuilt automatically.
- **Advanced Database Settings:**
  - **Active Table** — scope the actions below to the whole database or one table.
  - **Export Selected Table** — download a `.json` backup (whole DB or one table). **This is your backup button.**
  - **Install Offline App** — installs the PWA so the app launches from your home screen and runs fully offline. On iPhone/iPad use Safari's Share → *Add to Home Screen*.
  - **Wipe Active Table** — *destructive.* Clears the selected table or the entire database.
  - **Raw DB Records Browser** — inspect or delete individual IndexedDB records when a specific table is selected.

### Backups — keeping your data safe

> ⚠️ **Your data lives only in your browser. Clearing site data deletes it permanently, with no recovery except a backup.**

**Back up:** Advanced → set Active Table to *Entire Database* → **Export Selected Table** → save the `.json` somewhere safe (cloud + external drive).

**Restore:** **Import Saved JSON Data** → choose your `.json` → import. Records merge by ID; your other data is preserved. Firearm velocity offsets ride along automatically.

**Back up after:** every range session, adding firearms/loads, saving a velocity offset, or running a master-database sync. Installing the PWA also requests persistent storage, which guards against routine browser eviction.

---

## 14. The Advanced Tool Guide — Heurisko field by field

This section exists so you never have to guess what a box does. **Every input in every Heurisko tool is listed**, with what it is in shooter's terms, where the app gets it, what happens to your answer, when you should override it, and — just as important — **when overriding it will make your results worse.**

### How to read this section

Each field is written as:

> **Field name** — what it is. **Auto-fills from:** where the number comes from. **Raise it / lower it:** which way the result moves. **Change it when:** the legitimate reason. **Don't touch it when:** the trap.

Three rules apply everywhere and are not repeated for each field:

1. **Anything auto-filled is already your data.** If a Session, Firearm, or Load filled a box, the number came from your library. Overriding it is a "what-if", not a correction — unless you know the library record itself is wrong, in which case fix the *record*, not the simulator box.
2. **Nothing you type in Heurisko is saved back** to your firearms or loads. The one exception is the Ignition velocity offset, which you save deliberately with its own button.
3. **Garbage in, confident-looking garbage out.** These tools do not refuse a silly number; they model it faithfully. A 4000 fps muzzle velocity on a 175 gr bullet will produce a beautiful, wrong DOPE card.

### The selection chain — the same in all six tools

Every tool opens with a **Selections** card. It exists to fill the physics for you.

**Session** — one of your saved range sessions. Selecting one fills the firearm, the load's components, the bullet's dimensions, the environment of that day, and (where the tool uses it) the *measured* muzzle velocity and group dispersion. **This is the highest-fidelity way to start**: everything downstream is then describing ammunition you actually fired. Clearing it back to "-- Choose Saved Session --" leaves the values in place for you to edit freely.

**Firearm** — one of your saved rifles. Fills twist rate, sight height over bore, barrel length, and the cartridge. Choosing a firearm clears the bullet selection, because a different rifle may be a different caliber.

**Caliber** — the bore diameter (`.308`, `.264`, …). It exists to narrow the Cartridge list, which is otherwise every cartridge in the library. Nothing is calculated from it directly.

**Cartridge** — the chambering. Fills case capacity, case length, the SAAMI pressure ceiling, nominal COAL, and the primer pocket size. **It does not choose a bullet for you** — a cartridge is fired with hundreds of different bullets and the app will not guess which is yours.

**Bullet Manufacturer → Bullet Name** — the projectile. Filling this is what populates weight, length, bearing surface, BC, and tip length. **This is the single most consequential selection in every tool**, because bullet geometry drives stability, drag, seating depth, and case fill all at once.

---
### 14.1 Ignition — internal ballistics

**What it answers:** what pressure will this charge make, and how fast will the bullet leave? Everything here happens between the primer strike and the muzzle.

**The one safety rule:** the engine's powder parameters are fitted against laboratory pressure-transducer data. That is what makes the SAAMI comparison meaningful. **Never edit the propellant numbers to make predicted velocity match your chronograph.** If you do, you have not corrected the model — you have moved the pressure curve and quietly invalidated the audit that is supposed to keep you safe. The correct fix is the velocity offset at the bottom of this tool.

#### Selections specific to Ignition

Ignition needs the whole cartridge, not just the bullet, so it adds four selectors to the standard chain.

**Load from Library** *(optional)* — pick a saved handload and every parameter below fills at once: components, charge weight, COAL, brass. **This is the fastest and most accurate way to start**, because it models the exact recipe you wrote down rather than one you re-typed.

**Powder Manufacturer → Powder Name** — the propellant. **This is the most consequential selection in the tool.** It loads the fitted burn coefficient, heat of explosion, densities and grain geometry — the entire thermodynamic description. Two powders at the same charge weight can differ by 20,000 PSI. There is no generic "similar burn rate" substitute: pick the powder you will actually throw.

**Brass Manufacturer → Brass** — the case. Fills **case capacity** (the volume the powder burns in) and the **primer pocket size**. Cases of the same cartridge vary by a couple of grains of water between makers, and that is a real pressure difference at the top of a load. **Change it when:** you switch headstamps — and treat a headstamp change on a max load as a reason to back off and re-work up, exactly as the tool will show you.

**Primer Manufacturer → Primer Name** — the primer. Supplies the **brisance energy** that starts combustion. The list is filtered to primers matching the pocket size your brass or cartridge specifies, so you can't pick a large rifle primer for a small primer case. If the chosen primer has no measured energy in the library the tool falls back to a pocket-size default and says so on screen rather than hiding it. **Effect:** modest compared with powder and charge, but real at the ignition end of the curve — a hotter primer raises early pressure slightly and can tighten velocity SD in cold weather.

#### Firearm (Rifle) Parameters

**Twist Rate (1:X)** — inches of barrel per full bullet rotation. Enter the `X`: a 1:8" barrel is `8`. **Auto-fills from:** the firearm. **Lower it** (7 → faster twist) and spin goes up. **Effect here:** small — it only feeds the seating/stability sanity checks, not pressure. **Change it when:** modelling a barrel you don't own yet. **Don't touch it when:** you're chasing a velocity mismatch; twist is not the cause.

**Throat Freebore (in)** — the unrifled jump ahead of the case mouth before the rifling starts. **Auto-fills from:** the cartridge's SAAMI spec, or your firearm's measured value if you entered one. **Raise it** and the bullet accelerates further before engraving, so **peak pressure falls slightly and velocity with it**. **Change it when:** you have actually measured your chamber — a custom throat can differ from SAAMI by 0.050" and that is worth modelling. **Don't touch it when:** you are guessing. A fabricated freebore moves pressure in a way that looks authoritative and isn't.

**Barrel Length (inches)** — slider and box, 5–40". Muzzle-to-bolt-face. **Auto-fills from:** the firearm. **Raise it** and velocity rises with diminishing returns (roughly 15–30 fps per inch in the middle of a typical rifle case, less as you get long). It does **not** change peak pressure — peak happens in the first few inches. **Change it when:** deciding how much velocity a barrel chop will cost you. After the first run the slider re-runs the simulation live, which makes it an excellent "what does 2 inches cost me?" tool.

#### Cartridge Parameters

**Bullet Diameter (in)** — bore/bullet diameter, e.g. `0.308`. **Auto-fills from:** the caliber record. **Why it matters:** this sets the bore area, and pressure acts on that area to accelerate the bullet. Area goes as diameter squared, so **a typo here is one of the few single-digit mistakes that can change velocity by hundreds of fps.** **Don't touch it** unless you are modelling a genuinely odd bore.

**Case Capacity (gr H2O)** — how much water the fired case holds, in grains. **Auto-fills from:** your selected brass, or the average of matching brass, or the cartridge's nominal figure. **Lower it** (thicker brass, e.g. military or Lapua vs. commercial) and the same charge is squeezed into less room: **pressure and velocity both rise.** This is one of the biggest levers in the whole tool — a 2 gr H2O difference between brass makes a real pressure difference. **Change it when:** you have weighed water in *your* fired brass. **Do that** if you're near max — it is the highest-value measurement a handloader can make for pressure modelling.

**Case Length (in)** — trim-to length. **Auto-fills from:** the cartridge. Feeds the internal volume and the seating-depth geometry. **Change it when:** you trim to something other than the standard.

**Max SAAMI (PSI)** — the published pressure ceiling for the chambering. **Auto-fills from:** the cartridge record. **This is the line the safety audit measures you against.** **Raise it** and you are not making anything safe, you are only moving the goalposts. **Change it when:** the cartridge is a wildcat with no SAAMI number and you know the correct ceiling. **Don't touch it** to make a red audit turn green. That is the one edit in this app that can actually hurt you.

#### Bullet & Loading Parameters

**Bullet Weight (gr)** — projectile mass. **Auto-fills from:** the bullet. **Raise it** and pressure rises (more mass to accelerate, slower to get moving, more time for the powder to burn against resistance) while velocity falls. Heavier bullets are a *pressure* decision as much as a ballistic one.

**Bullet Length (in)** — overall projectile length, tip to base. **Auto-fills from:** the bullet, or is estimated from weight and diameter if the record has no length. **Feeds:** how much of the bullet sits inside the case (which steals powder space) and the stability check. **Change it when:** you have measured the bullet; catalogue lengths are often nominal.

**Bearing Surface (in)** — the length of full-diameter shank actually gripping the rifling. **Auto-fills from:** the bullet record, or defaults to **half the bullet length** when unknown. **Raise it** and friction/engraving resistance rises, nudging pressure up. **Important and counterintuitive:** the engine's correction factors were fitted *with* that half-length default in place. If your bullet record has no measured bearing surface, **typing in a "better" value can make the prediction worse, not better** — the model has already been calibrated around the crude assumption. Only override it when the value is measured *and* you are prepared to sanity-check the result against a chronograph.

**COAL (in)** — cartridge overall length, loaded. **Auto-fills from:** the load, or the cartridge's nominal. **Lower it** (seat deeper) and you reduce usable case volume: **pressure and velocity rise**. This is the classic hidden pressure increase — seating 0.030" deeper on a near-max load is a real and frequently underestimated pressure step. **Change it when:** modelling a seating-depth ladder. Watch the fill percentage and the audit as you go.

**Seating Depth (in)** *(computed, read-only)* — how far the bullet sits inside the case, derived from case length + bullet length − COAL. The audit wants at least **one caliber** of bearing for reliable neck tension.

**Usable Capacity (gr H2O)** *(computed, read-only)* — case capacity minus the volume the seated bullet occupies. **This, not raw case capacity, is the space the powder actually has.**

**Fill %** *(computed, read-only)* — charge volume ÷ usable capacity. The number to watch:
- **Below ~85%** — the charge is loose in the case. Flagged, because inconsistent ignition and (with some slow powders in large cases) genuinely dangerous pressure excursions live down here.
- **~85–100%** — the normal, well-behaved range.
- **Above 100%** — compressed. Workable and common in some cartridges, but it changes as the powder settles, and it can push bullets back out over time.

#### Propellant & Thermodynamics

> These four fields describe **the powder itself**, not your load. They are fitted constants. Read the safety rule at the top of this tool again before changing any of them.

**Grain Geometry** — the powder kernel's shape (ball, flake, extruded/stick, and their perforated variants). **Auto-fills from:** the powder record. It determines how burning surface area evolves as the kernel is consumed — progressive shapes hold pressure longer; degressive ones spike early. **Change it when:** you are entering a powder the library doesn't have and you know the geometry. **Don't touch it** on a library powder.

**Burn Coefficient B (1/s)** — the fitted burn-rate constant for this powder, the single most influential propellant number. **Auto-fills from:** the calibration file, keyed to the powder. **Raise it** and the powder burns faster: pressure peaks earlier and higher. **Change it when:** essentially never. It is shown so you can *see* it and so you can experiment with an unlisted powder, not so you can tune it.

**Heat of Explosion (kJ/kg)** — the energy released per kilogram of propellant. **Raise it** and both pressure and velocity rise roughly together. Manufacturer figures for common single- and double-base powders run ~3,000–4,500 kJ/kg. **Change it when:** entering an unlisted powder from a published figure.

**Solid Density (kg/m³)** — the density of the propellant material itself, ~1,550–1,650 for nitrocellulose powders. Used to convert charge mass into the volume the solid actually occupies.

**Bulk Density (kg/m³)** — the density of the powder *as poured*, including air between kernels. **This is what determines whether your charge fits.** Ball powders pour dense (~950–1,000); extruded sticks are much less dense (~800–900). **Change it when:** entering an unlisted powder — and get it right, because a wrong bulk density gives a wrong fill percentage and therefore a wrong compression warning.

#### The charge and the environment

**Powder Charge (grains)** — slider and box. Your actual charge weight. **This is the field you came here to change.** After the first run the slider re-simulates on release, which makes it a live pressure ladder: drag it up and watch peak pressure approach the SAAMI line and the fill percentage climb. **The right way to work up a load in this tool** is to fix everything else from your real components and move only this.

**Powder Temperature (°F)** — the temperature of the propellant at the moment of firing, not the air temperature an hour earlier. **Auto-fills from:** the session. **Raise it** and pressure rises: powders are temperature-sensitive, and the same charge that is comfortable at 40 °F can be over-pressure at 100 °F. **Always model your hottest realistic condition before calling a max load safe.**

#### Reading the results

- **Peak pressure vs. SAAMI** — the headline audit. Over the line is over the line.
- **Muzzle velocity** — predicted, corrected. Expect it to differ from your chronograph by some consistent amount; that's what the offset is for.
- **Burn fraction at exit** — how much powder was consumed before the bullet left. Well under 100% means you are burning powder in the air: a slower powder or a longer barrel would use it better.
- **Barrel time** and the **pressure/velocity trace** — for seeing *where* in the bore the work happens.
- **Safety audit** — pressure, case fill, seating depth, and COAL vs. SAAMI OAL, each with a status.

#### The per-firearm velocity offset

When your chronograph consistently reads, say, 40 fps below prediction, that is your barrel, not the physics. Store the difference on the **firearm** with the offset control here. It shifts **displayed velocity only** — the pressure trace and the entire safety audit are untouched. This is the sanctioned way to reconcile the model with your rifle, and it is why you never need to touch a burn coefficient.

---
### 14.2 Monte Carlo — hit probability

**What it answers:** out of a thousand shots at this target, at this range, in these conditions, how many hit? It fires thousands of virtual shots, each with slightly different velocity, BC, wind, and aim, and counts the holes.

**The idea that makes it work:** a single predicted trajectory tells you where a *perfect* shot goes. Real shots vary. The **Parameter Uncertainties** card is where you tell the simulator how much each input varies — and it is the difference between a toy and a tool. Everything above it describes the average shot; the uncertainties describe the spread around it.

#### Ballistic Profile

**Twist Rate (1:X)** — as above. **Feeds:** spin drift (a right-twist barrel walks the bullet right, several inches at 1000 yd) and the stability factor used for the transonic check.

**Sight Height (in)** — centerline of scope above centerline of bore. **Auto-fills from:** the firearm. Typically 1.5–2.0" on a bolt gun, more on an AR. **Raise it** and near-range trajectory changes noticeably (the bullet starts further below the sight line); at distance the effect washes out. **Change it when:** you switch rings or mounts. **Getting it wrong is the most common cause of a DOPE card that's fine at 600 and wrong at 100.**

**Zero Distance (yd)** — the range where your scope is zeroed. **Raise it** and the whole curve shifts. **Change it when:** it doesn't match your rifle. Everything the tool reports is relative to this, so an incorrect zero distance is a uniform, invisible error.

**Bullet Diameter (in)**, **Bullet Weight (gr)** — as in Ignition. Weight and diameter set the sectional density that, with BC, governs how the bullet holds velocity.

**Ballistic Coefficient (BC)** — the bullet's drag number. **Auto-fills from:** the bullet record (G7 preferred, G1 as fallback). **Raise it** and the bullet drops less, drifts less, and stays supersonic longer. **Change it when:** you have measured your own with Kylindros — advertised BCs are frequently optimistic and are quoted at velocities you may not be shooting. **Make sure it matches the Drag Model below**; a G1 number entered against a G7 model is the single most common way to get a badly wrong answer here, because G1 values are roughly double G7 for the same bullet.

**Muzzle Velocity (fps)** — the average speed at the muzzle. **Auto-fills from:** the session's chronograph mean if there is one, else the Ignition estimate. **Use your measured mean if you have it.**

**Zero Offset X / Y (in)** — a deliberate, constant aim error: your group's center relative to your point of aim at the zero distance. **Auto-fills from:** the session's measured MPI offset. **Leave at 0** for a perfectly zeroed rifle. **Set it when:** you want to know what a rifle that prints 0.5" high and 0.3" left actually costs you at distance — the answer is usually "more than you think", because a constant offset scales with range while your group does not.

**Rifle Cant (°)** — how far the rifle is rolled from vertical. **Leave at 0** unless you have a reason. **Raise it** and the bullet moves laterally with drop, so the error grows with range: a couple of degrees is invisible at 100 yd and inches at 800.

#### Environment & Atmosphere

**Temperature (°F)**, **Pressure (inHg)**, **Altitude (ft)**, **Humidity (%)** — the air the bullet flies through. **Auto-fills from:** the session. Together these set air density, and **air density is drag**. Thin air (hot, high, low pressure) means less drop and less drift; dense air means more of both. **Change them when:** modelling a match at a different elevation — the difference between sea level and 6,000 ft is a real, dial-able amount of elevation. Humidity is the weakest of the four; don't agonize over it.

**Wind Speed (mph)** and **Wind Angle (°)** — the average wind. **0° is a headwind, 90° is a full-value crosswind from the right, 180° is a tailwind, 270° is full-value from the left.** Only the crosswind component pushes the bullet sideways, so a 10 mph wind at 90° drifts about ten times as much as the same wind at 5°. **Change them when:** planning for known conditions.

**Latitude (°)** and **Azimuth (°)** — your position on Earth and the compass direction you're firing. These drive the **Coriolis** correction. **Leave them alone unless you shoot past ~800 yards**, where the effect becomes measurable (a few inches). Azimuth matters because firing east or west adds a small vertical component while north/south is purely horizontal.

**Drag Model (BC Type)** — G1 or G7. **G7 for modern boat-tail long-range bullets, G1 for flat-base and round-nose.** The reference projectile shape has to resemble your bullet, otherwise the drag curve is wrong at the ends of the flight even if it's right in the middle. **Must match whatever your BC number is quoted as.**

#### Parameter Uncertainties — the part that makes it honest

> **Optional — leave at 0 for a first run.** With all zeros, every virtual shot is identical and P(Hit) is 100% until the trajectory simply misses. That is a trajectory calculator, not a probability model. Fill these in and the tool starts telling you the truth.

##### What a standard deviation actually means here

Every box in this card is a **1σ (one standard deviation)** figure, and the simulator draws a bell curve around your average using it. The translation you need is:

| You enter 1σ = | About this share of shots land within | Practically |
|---|---|---|
| ±1σ | **68%** | the normal spread |
| ±2σ | **95%** | what you should plan for |
| ±3σ | **99.7%** | the worst you'll realistically see |

So **a 15 mph wind with a Wind Speed SD of 2** means: two-thirds of your shots see 13–17 mph, 95% see 11–19 mph, and the rare gust hits 21. That is a *steady* wind. **A 15 mph wind with an SD of 6** means 95% of shots see 3–27 mph — a completely different day requiring a completely different plan, even though the average is identical.

##### What 1σ is worth in inches

The numbers below come from this app's own trajectory engine at sea level, 59 °F, 100 yd zero. They convert an uncertainty into the thing you care about — inches on the target — so you can see which boxes deserve your attention.

**Drift, in inches, per 1 mph of full-value (90°) crosswind:**

| Load | 300 yd | 500 yd | 700 yd | 1000 yd |
|---|---|---|---|---|
| 6.5 CM 140 gr, G7 .315 @ 2700 | 0.36" | 1.25" | 2.80" | 6.65" |
| .308 Win 175 gr, G7 .243 @ 2600 | 0.50" | 1.82" | 4.17" | 10.42" |
| .223 Rem 55 gr, G1 .243 @ 3240 | 0.83" | 3.25" | 7.98" | 19.09" |

**Vertical, in inches, per 10 fps of muzzle velocity:**

| Load | 300 yd | 500 yd | 700 yd | 1000 yd |
|---|---|---|---|---|
| 6.5 CM 140 gr | 0.13" | 0.47" | 1.10" | 2.83" |
| .308 Win 175 gr | 0.15" | 0.58" | 1.43" | 4.07" |
| .223 Rem 55 gr | 0.10" | 0.43" | 1.23" | 3.56" |

**For scale, 1 MOA is** 3.1" at 300 yd, 5.2" at 500, 7.3" at 700, 10.5" at 1000.

**Use these as multipliers.** A 6.5 CM shooter with **Wind Speed SD = 3 mph** at 700 yd carries 3 × 2.80 = **8.4" of 1σ horizontal spread from gusts alone** — larger than a 1 MOA group at that distance. That is the whole point of this card: past about 500 yards, the shooter's uncertainties usually dwarf the rifle's grouping.

##### Wind Speed SD — with real conditions

"Gusty" means nothing on its own. Here is the same idea expressed as numbers you can type, with the conditions each one describes:

| Situation | Wind Speed | Wind Speed SD | What that means in the field |
|---|---|---|---|
| **Pronghorn, open plains, mid-morning** | 15 mph | **1–2** | A steady prairie blow. 95% of shots see 11–19 mph. The wind is strong but *honest* — you can hold for it. |
| **Prairie dogs, flat pasture, afternoon** | 3 mph | **3** | Light and switchy. Half the shots are near calm, some see 9 mph. The average is nearly useless; the variability *is* the condition. |
| **Ridge-to-ridge, mountain goat, 400 yd across a canyon** | 10 mph | **5** | Terrain-channeled and unpredictable — the wind at your muzzle, mid-canyon, and at the animal are three different winds. 95% of shots see 0–20 mph. This is the hardest case in the table. |
| **Whitetail, dense southern timber, 80 yd** | 2 mph | **2** | Barely moving air under canopy. At 80 yd the entire effect is a small fraction of an inch — set it and watch the tool confirm it doesn't matter. |
| **F-Class relay, flat range, flags out** | 8 mph | **2–3** | Readable, cyclical wind with visible indicators. You can time your shots, which is why competitors do. |
| **Coastal or frontal passage** | 12 mph | **6–8** | Genuinely unstable air. If your model says you can make the shot, your model is being optimistic about *your patience*, not your rifle. |

**One honest caveat about big SDs:** the simulator clamps a sampled wind speed at zero — a negative draw becomes dead calm, not a reversal. So if you set the SD equal to or larger than the mean (say 3 mph with SD 3), a meaningful share of shots get exactly 0 mph, piling up at calm. **If your wind genuinely switches direction, model that with Wind Direction SD, not with a huge speed SD.**

##### Wind Direction SD — and why it matters less than you think at 90°

This is in **degrees**, and its effect depends enormously on the wind angle you are already at, because only the crosswind component pushes the bullet.

Same 6.5 CM, 10 mph, and a 10° direction error:

| Where the wind is coming from | Cost of being 10° wrong at 700 yd | At 1000 yd |
|---|---|---|
| Near **full value** (90° → 80°) | **0.4"** | **1.0"** |
| Near a **shallow angle** (30° → 20°) | **4.5"** | **10.6"** |

**The lesson:** at full value, direction error is nearly free — that's why "hold for a full-value 10" works. At shallow angles, the crosswind component changes fastest, and the same 10° mistake costs ten times as much. **Set Wind Direction SD by how confidently you can call the angle:** 5° with flags or mirage on a known range, 10–15° reading grass and trees, 20°+ in swirling terrain.

##### Wind Estimate Error — usually the biggest number on the page

The difference matters and is worth stating plainly: **Wind Speed SD is the wind changing. Wind Estimate Error is you being wrong about it.** The wind can be rock steady at 12 mph and you can still call it 8.

| Who | Typical estimate error | Cost at 700 yd, 6.5 CM |
|---|---|---|
| Wind flags every 100 yd, competition range | **1 mph** | 2.8" |
| Experienced shooter, mirage and vegetation, open terrain | **2–3 mph** | 5.6–8.4" |
| Competent hunter, unfamiliar ground, no indicators | **4–5 mph** | 11.2–14.0" |
| Broken terrain, thermals, no reference at the target | **6+ mph** | 16.8"+ |

Run your model twice — once with your honest estimate error, once with 0. **The difference between those two hit percentages is your wind-reading skill, expressed in the only unit that matters.** For most shooters at distance it is a bigger number than anything they could gain by reloading.

##### Muzzle Velocity SD

Your chronograph's SD, in fps. **Auto-fills from:** the session's measured velocities. **The dominant cause of vertical spread at distance.**

| Load quality | SD | 1σ vertical at 700 yd (6.5 CM) | at 1000 yd |
|---|---|---|---|
| Exceptional handload, weighed charges, sorted brass | **5 fps** | 0.6" | 1.4" |
| Good handload | **10 fps** | 1.1" | 2.8" |
| Acceptable handload / premium factory match | **15 fps** | 1.7" | 4.2" |
| Ordinary factory ammunition | **25 fps** | 2.8" | 7.1" |
| Something is wrong — ignition, neck tension, charge weight | **40 fps+** | 4.4"+ | 11.3"+ |

**Read that table against a 10.5" 1 MOA circle at 1000 yd** and the picture is clear: at 5 fps SD, velocity is a non-issue; at 40 fps it is most of your vertical. Note also how little it matters at 300 yd — chasing single-digit SD for a 300-yard rifle is effort spent in the wrong place.

##### BC SD

Shot-to-shot variation in drag, entered as a **fraction** (`0.01` = 1%). It comes from meplat and base inconsistency.

| Bullets | BC SD | Effect at 1000 yd (6.5 CM: 1.85" per 1%) |
|---|---|---|
| Meplat-trimmed and pointed match bullets | **0.005** (0.5%) | ~0.9" |
| Quality factory match bullets | **0.01–0.02** (1–2%) | 1.9–3.7" |
| Bulk or hunting bullets | **0.03** (3%) | ~5.6" |

Below 600 yd it is nearly invisible; past 800 it stacks on top of velocity SD in the vertical.

##### Range Error SD

Uncertainty in your range estimate, in yards. The trajectory steepens with distance, so the same ranging error costs more the further out you go — **for the 6.5 CM, 25 yards of error is 3.4" of vertical at 300 yd but 22.5" at 1000 yd.**

| How you ranged it | Range Error SD |
|---|---|
| Quality LRF on a reflective target | **1–3 yd** |
| LRF on an animal in brush, or at its limit | **10–15 yd** |
| Ranged a nearby landmark instead of the target | **15–25 yd** |
| Estimated by eye / mil-reticle on an unknown-size target | **25–50 yd** |

At 1000 yd with a 50 yd estimate error, the 6.5 CM sees 46" of 1σ vertical — **more than four times a 1 MOA group.** This is why nobody ranges by eye at distance.

##### System Precision (MOA)

Your rifle-and-ammo dispersion as a 1σ angular figure. **Auto-fills from:** the session's measured group statistics — use the measured value if you have it, since guessing here is guessing about the one thing you can actually observe.

As a rough guide: **0.25 MOA** a genuinely excellent rifle and load; **0.5 MOA** a good precision rifle; **1.0 MOA** a typical hunting rifle with decent ammunition; **1.5–2 MOA** a factory sporter with hunting ammunition.

**Keep it in perspective:** at 700 yd, going from 1.0 to 0.5 MOA saves you about 3.6" of spread. Cutting a 4 mph wind-call error to 2 mph saves 5.6". The rifle is often not the limiting factor.

##### Cant SD

Shot-to-shot variation in how level you hold the rifle, in degrees. **1–2°** for a shooter without a level on a bipod; **under 0.5°** with a bubble level you actually check. The error grows with drop, so it is invisible inside 300 yd and worth a few inches past 800 — the cheapest of all these to fix, since a level costs less than a box of match bullets.

#### Target, range & run count

**Target Shape** — Circle, Rectangle, or **IPSC Silhouette**.
- **Circle** uses Target Width as the diameter — the right choice for a steel plate.
- **Rectangle** uses width and height.
- **IPSC Silhouette** is the **official IPSC target** (IPSC Handgun Rules, Appendix B2): a 450 × 570 mm octagon with A, C and D scoring zones and a 5 mm non-scoring border. Selecting it **locks Target Width and Height**, because the target is a fixed real-world size. You then get an **A / C / D hit distribution** alongside P(Hit) — the practical-shooting question isn't just "did I hit it", it's "did I hit the A zone".

**Target Width (in) / Target Height (in)** — the target's real size. **Lower them** and P(Hit) falls at every range. **Change them when:** modelling the plate you'll actually shoot. Disabled for IPSC.

**Range Max (yd)** and **Range Step (yd)** — the distance band and its resolution. A step of 25–50 yd over a 1000 yd band is plenty; a 5 yd step multiplies runtime for a smoother line that tells you nothing new.

**Monte Carlo Runs** — virtual shots per range step. **1,000 is fast, 5,000 is thorough.** More runs don't change the answer, they sharpen it: at 1,000 runs a reported 90% is roughly ±1%, which is fine for decisions. Go to 5,000+ when you're comparing two loads that are genuinely close.

**Load Profile / Save Profile As** — store and recall a complete parameter set. Useful for keeping a "match conditions" and a "practice conditions" profile side by side.

#### Worked example — getting to a real answer

*Goal: will my 6.5 CM load hold 90% hits on a 12" plate at 700 yards?*

1. Pick the **Session** you shot that load in — profile, environment, measured velocity and dispersion all fill.
2. Confirm **BC** and **Drag Model** agree (G7 number, G7 model).
3. In **Parameter Uncertainties**, check that **Muzzle Velocity SD** and **System Precision** came from your data. Add a realistic **Wind Estimate Error** — start at 3 mph.
4. **Target Shape** = Circle, **Target Width** = 12.
5. **Range Max** 900, **Range Step** 25, **Runs** 5,000.
6. Run it, then read the P(Hit) curve where it crosses 90%.
7. Now set **Wind Estimate Error** to 0 and re-run. The gap between the two answers is *your wind-reading skill expressed in yards* — and for most shooters it is a bigger number than anything they could gain by reloading.

---
### 14.3 Efstathia — gyroscopic stability

**What it answers:** will this bullet fly point-first out of my barrel, or wobble? One number, **Sg**, from the Refined Miller Twist Rule corrected for velocity and air density.

**Read the answer like this:** **Sg ≥ 1.5** fully stable. **1.4–1.5** adequate, watch it in cold/dense air. **1.0–1.4** marginal — the bullet flies but yaws, which costs 10–15% of your BC and opens groups. **< 1.0** unstable: keyholes, and no amount of load tuning fixes it.

**Bullet Weight (gr)** — heavier is generally *longer*, and length is what actually destabilizes. **Auto-fills from:** the bullet.

**Bullet Diameter (in)** — bore diameter. Appears squared-ish in the stability math; a typo swings Sg hard.

**Bullet Length (in)** — **the field that decides the answer.** Stability falls off roughly with the square of length. **Auto-fills from:** the bullet, or is estimated from weight and diameter when the record has no measured length. **Change it when:** you have measured the bullet with calipers. **Do measure it** if the answer lands between 1.3 and 1.6 — that's the band where an estimated length can flip the verdict.

**Tip Length (in)** and the tipped/untipped toggle — for polymer-tipped bullets. A plastic tip is long but nearly weightless, so it lengthens the bullet without adding the stabilizing mass a lead or copper nose would. The tool models the **metal core length** instead of the overall length. **Set this when:** your bullet has a plastic tip. **Leaving it off makes a tipped bullet look less stable than it is** — the classic false "unstable" verdict.

**Twist Rate (1:X)** — inches per rotation. **Lower it (faster twist) and Sg rises**, roughly with the square. This is the lever you have when a bullet won't stabilize, and it's a barrel purchase, not a load change.

**Muzzle Velocity (fps)** — faster means more spin from the same twist. **Effect is real but weak**: the velocity correction goes as roughly the cube root, so 200 fps buys very little. **Don't** expect to solve a stability problem with a hotter load.

**Temperature (°F)**, **Altitude (ft)**, **Pressure (inHg)**, **Pressure Type** — the air. **Cold, dense, sea-level air is the hard case**, because dense air resists overturning less effectively than the bullet's spin can correct. **Model your coldest, lowest, densest expected day**: a bullet that shows Sg 1.5 on an 80 °F summer afternoon at 5,000 ft may be under 1.4 in January at sea level. **Pressure Type** tells the tool whether you're entering station pressure (absolute, as a weather station on site reads) or sea-level-corrected pressure (what an aviation/METAR report gives) — pick the one matching your source, or the altitude correction will be applied twice.

**Typical use:** before buying bullets. Enter your twist, the bullet's real length, and your worst-case weather. If Sg lands under 1.4, choose a shorter bullet or a faster barrel.

---

### 14.4 Kylindros — ballistic coefficient from your own data

**What it answers:** what is my bullet's *actual* BC, measured from how far it dropped, rather than what the box claims?

**How it works:** you give it a session with chronograph velocities and impacts at a known, long distance. It runs the trajectory engine, and searches for the BC that reproduces the drop you actually measured.

**The two hard requirements:**
1. **Target distance ≥ 300 yd/m.** Closer than that, drag differences are smaller than your group, and the solver is fitting noise.
2. **Chronograph velocities on the session.** Without measured muzzle velocity, an error in velocity is indistinguishable from an error in BC.

**Session** — must be a real session with velocities and a long target distance. **This tool is the one place a session isn't optional.**

**Twist Rate (1:X)** — feeds spin drift so that lateral offset isn't misread as something else.

**Sight Height (in)** — as above, and **it matters more here than anywhere else**: sight height sets the launch geometry, and a wrong value gets absorbed into the fitted BC as a systematic error.

**Zero Distance (yd)** — **the biggest single source of error in this tool.** The solver measures drop relative to your zero. If your rifle was actually zeroed at 105 yd and you tell it 100, that discrepancy is silently converted into a wrong BC. **Verify your zero before trusting the result.**

**Bullet Diameter / Weight / Length** — the projectile's physical description; sets sectional density and the stability used for the drag correction.

**Muzzle Velocity (fps)** — **use the session's measured mean.** An assumed velocity produces an assumed BC.

**Temperature / Altitude / Pressure / Pressure Type** — the air on the day *the session was fired*, not today. Air density and drag are inseparable, so getting the atmosphere wrong shifts the fitted BC directly. **Auto-fills from:** the session, which is why the session is the right starting point.

**Drag Model (BC Type)** — which reference curve to fit. **Fit G7 for boat-tail bullets**; it produces a BC that stays valid across velocity, whereas a G1 fit will drift as the bullet slows.

**Reading the result:** you get a mean BC, a per-shot distribution, and a 95% confidence interval. **The interval is the point.** A tight interval means your data constrains the answer. A wide one means it doesn't — usually too few shots, too short a distance, or velocity scatter. If the boundary-hit warning appears, the solver ran into the edge of its search range, which almost always means an input is wrong rather than that your bullet is extraordinary.

**When to use it:** verifying an advertised BC before building a DOPE card on it. **When not to:** as a substitute for a chronograph, or at 200 yards.

---

### 14.5 Manteis — comparing loads across sessions

**What it answers:** of everything I've actually shot, which load hits best at 600 yards in a 10 mph wind? This is the only Heurisko tool that works on **many sessions at once**, and every number in it comes from measured data rather than a hypothetical.

**Select Saved Sessions** — tick as many as you want to compare; **Select All** / **Clear** are there for convenience. Each session contributes its own measured group dispersion, velocity consistency, and load data. **Sessions without chronograph data are handled honestly**: the velocity SD is imputed conservatively and the result flagged, rather than pretending the load is perfect.

**Min Distance (yd) / Max Distance (yd) / Step Distance (yd)** — the distance band of the comparison matrix and the spacing of its columns. **Set the max to something past where you expect the loads to fall apart** — the interesting information is where the curves cross, and if the band stops too early you never see it.

**Crosswind Speeds (mph, comma-separated)** — enter several, e.g. `5, 10, 15`. The matrix is computed at each. **This is the tool's best feature**: a load that wins in still air often loses at 15 mph to a higher-BC load, and typing three numbers here shows you exactly where the ranking flips. The first value in the list is the "primary" wind used to crown the winner at each distance.

**Target Size (MOA Diameter)** — the target as an *angular* size, so it scales with distance: 2 MOA is roughly a 2" target at 100 yd and 20" at 1000 yd. **Lower it** for a hard target and the whole matrix drops. **Change it when:** you want realism for your discipline — 1 MOA for small steel, 2 MOA as a general standard, 4+ MOA for large silhouettes.

**Reading the matrix:** each row is a session, each column a distance, each cell a hit percentage, colour-coded. The **golden ★ TOP** ring marks the best session at each distance under the primary wind. **Watch for the crossover** — the row that wins at 300 is often not the row that wins at 800, and that is precisely the decision this tool exists to inform.

---
### 14.6 DOPE — the drop card

**What it answers:** what do I dial, at every distance, with this rifle and load, today? The output is a printable card.

**A card is only as good as the atmosphere you built it in.** Elevation and temperature change air density, and air density changes drop. A card built at sea level in winter will be wrong in a summer match at 5,000 ft — build a new one, or accept that you'll be re-truing in the field.

#### Ballistic Profile

**Twist Rate (1:X)** — feeds **spin drift**, which the card includes. At 1000 yd it's several inches, and it's always the same direction, so leaving twist wrong bakes a constant lateral error into the card.

**Sight Height (in)** — as above. Wrong here means a card that's fine far out and wrong up close.

**Zero Distance (yd)** — the range where the card reads 0.0. **This is the anchor for every row.**

**Zero Offset X / Y (in)** — a known constant aim error at the zero distance, from your measured MPI offset. **Leave at 0** for a true zero; set it if your rifle prints consistently off and you want the card to correct for it rather than pretending.

**Bullet Diameter (in) / Bullet Weight (gr) / Bullet Length (in)** — the projectile. Length feeds stability and therefore the aerodynamic-jump and transonic notes.

**Ballistic Coefficient (BC)** — **the field that shapes the whole card.** **Raise it** and every drop number shrinks. **Change it when:** you've measured it in Kylindros. An optimistic advertised BC produces a card that's close at 300 and increasingly wrong past 700 — the classic "my dope stops matching past 600" complaint.

**Muzzle Velocity (fps)** — the measured mean, ideally at the temperature you'll be shooting. **Raise it** and everything flattens.

#### Environment

**Temperature (°F) / Pressure (inHg) / Altitude (ft) / Humidity (0–1)** — the air. Note humidity here is a **fraction**: `0.5` is 50%, not `50`.

**Wind Speed (mph) / Wind Angle (°)** — the wind the windage column is computed for. **0° head, 90° full-value right, 180° tail, 270° full-value left.** Many shooters build the card at a **10 mph full-value (90°) crosswind** and then scale in their head — half the wind is half the hold. That's a good default.

**Firing Azimuth** — compass direction of fire, for Coriolis. Only meaningful past ~800 yd.

#### Card Configuration

**Range Units** — yards or meters for the whole card.

**Holds Unit** — **MIL or MOA**. Match your scope's turrets. Getting this wrong is the fastest way to a dangerous miss, because MIL and MOA numbers are similar in magnitude and easy to confuse under stress.

**Turret Click Value** — your scope's click increment (0.1 MIL, 1/4 MOA, …). The card rounds its solutions to whole clicks, so this must match your actual turret or the printed values won't be dialable.

**Interval / Stops Mode** — how rows are chosen:
- **Interval** — regular steps. Use **Max Range** and **Step Increments** (e.g. every 50 yd to 1000).
- **Stops** — your own list in **Comma Separated Range Stops**. Better for a card built around the known distances of a specific range or match stage: `100, 285, 400, 630, 875`.

**Vital Zone Diameter (in)** — the target the **MPBR** solver must stay inside. **This is the only input to point-blank zero that matters.** MPBR finds the zero distance that keeps the bullet within ± half this diameter for the longest possible span, so you can hold dead-on without dialing. **Set it to your quarry or your target**: 6" is a conventional deer vital zone, 10" for elk, 2–4" for varmints. **Lower it** and the point-blank span shrinks sharply — this is the trade-off, and seeing it quantified is the point of the tool.

**Reading the output:** each row gives elevation hold, windage hold, and remaining velocity. The card flags where the bullet goes **transonic** (~Mach 1.2) — past that, trajectories become less predictable, and it is usually the honest end of your card regardless of what the numbers say below it. The MPBR block gives the near zero, far zero, and the maximum point-blank range for your chosen vital zone.

---

### 14.7 Which tool answers which question

| Your question | Tool | The field that matters most |
|---|---|---|
| Is this charge safe? | **Ignition** | Powder Charge, Case Capacity, Max SAAMI |
| How much velocity will a shorter barrel cost me? | **Ignition** | Barrel Length slider |
| Why is my velocity 40 fps off the model? | **Ignition** | the velocity offset — *not* the burn coefficient |
| Will this bullet stabilize in my twist? | **Efstathia** | Bullet Length, Twist Rate, Tip Length |
| Is the advertised BC real? | **Kylindros** | Zero Distance, and a ≥ 300 yd session |
| Will I hit that plate at 700? | **Monte Carlo** | the Parameter Uncertainties card |
| How much is my wind-reading costing me? | **Monte Carlo** | Wind Estimate Error |
| Which of my loads is best at distance? | **Manteis** | Crosswind Speeds, Target Size (MOA) |
| What do I dial? | **DOPE** | Ballistic Coefficient, Holds Unit, Turret Click Value |
| Where can I hold dead-on? | **DOPE** | Vital Zone Diameter |

### 14.8 The five mistakes that produce confident, wrong answers

1. **A G1 BC entered against a G7 drag model** (or the reverse). G1 values are roughly double G7 for the same bullet, so the mismatch is enormous and the tool cannot detect it. Check them together, every time.
2. **All Parameter Uncertainties left at zero in Monte Carlo.** You get a trajectory calculator reporting 100% hits, which is not a probability and will get you beaten on the clock.
3. **Editing a powder's burn coefficients to match a chronograph.** It moves the pressure curve and voids the safety audit. Use the per-firearm velocity offset.
4. **An unverified zero distance in Kylindros.** Your zero error becomes the bullet's BC, and then that wrong BC propagates into every DOPE card you build.
5. **Modelling stability or a max load in pleasant weather.** Check Sg in the coldest, densest air you'll shoot in, and check pressure at the hottest temperature your ammunition will reach in a truck.

---

## 15. Troubleshooting

**My measurements are huge / nonsensical.** You marked shots before setting the scale, so everything is in pixels. Reload the marked target, **Set Scale**, and re-save.

**My groups disappeared after closing the browser.** The canvas isn't auto-saved. Always **Save Marking Job** in Marking and **Create/Update Session** in Sessions before leaving.

**Where did the velocity boxes go in Marking?** Velocity entry moved to **Chronos** — either import a chrono file and pair each reading to an impact, or type velocities by hand in the *Load Marking Data* impact list there.

**The trajectory/stability results look wrong.** Check that the firearm has twist rate and sight height, the bullet has a G7 BC, the muzzle velocity is realistic, and the environment is set.

**The Ignition simulator's velocity doesn't match my chronograph.** Expected — the model is calibrated to lab pressure data, not to your specific barrel. Use the **per-firearm velocity offset** to store the difference. **Do not** edit powder burn coefficients to force a match; that corrupts the pressure prediction and safety audit.

**Monte Carlo says 100% hits at every range.** Every **Parameter Uncertainty** is still 0, so all thousand virtual shots are identical. Fill in at least Muzzle Velocity SD, System Precision, and a realistic Wind Estimate Error — see [The Advanced Tool Guide](#14-the-advanced-tool-guide--heurisko-field-by-field).

**My drop card is right at 300 and wrong at 800.** Almost always an optimistic BC, or a BC quoted for the wrong drag model. Confirm the number and the G1/G7 setting agree, then measure your own BC in Kylindros.

**A bullet the app calls unstable shoots fine.** If it's polymer-tipped, set the tip length in Efstathia — the tool then models the metal core instead of the full length, which is the honest calculation for a tipped bullet.

**Which box do I change to get X?** Every field in every Heurisko tool is documented in [The Advanced Tool Guide](#14-the-advanced-tool-guide--heurisko-field-by-field), including when changing it will make your answer worse.

**I cleared my browser and lost everything.** Without a JSON backup there is no recovery. Back up after every session.

---

## 16. Glossary

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
| **Parameter Uncertainty** | The shot-to-shot variation you give Monte Carlo (velocity SD, wind SD, wind-call error, …) — what turns a trajectory into a probability |
| **Wind Estimate Error** | How far your wind *call* is from the true wind; distinct from wind variability and usually the larger term |
| **Transonic Limit** | Range where the bullet slows to ~Mach 1.2; may cap effective range before dispersion does |

### Cartridge & Seating

| Term | Meaning |
|---|---|
| **COAL** | Cartridge Overall Length — the measured length of your loaded round |
| **SAAMI OAL** | The published maximum overall length — a ceiling, not your measurement |
| **Mag COAL** | The longest round a given magazine will feed |
| **CBTO** | Cartridge Base to Ogive — more repeatable than COAL for setting seating depth |
| **Freebore** | The unrifled throat length ahead of the chamber; measured value overrides the SAAMI spec |
| **Case Capacity** | Water the fired case holds, in grains — the volume the charge is burned in |
| **Usable Capacity** | Case capacity minus the volume the seated bullet occupies; what the powder actually gets |
| **Fill %** | Charge volume as a share of usable capacity; below ~85% is flagged, above 100% is compressed |
| **Bearing Surface** | The full-diameter shank gripping the rifling; defaults to half the bullet length when unmeasured |

### Angular & Ballistic

| Term | Meaning |
|---|---|
| **MOA** | Minute of Angle (≈ 1.047 in at 100 yd) |
| **MIL** | Milliradian (10 cm at 100 m) |
| **BC** | Ballistic Coefficient — resistance to drag; higher = flatter, less wind drift (G1 and G7 supported) |
| **Sg** | Gyroscopic Stability Factor — ≥ 1.5 fully stable, < 1.0 tumbles |
| **Spin Drift** | Lateral drift caused by the bullet's rotation; always the same direction as the twist |
| **Coriolis** | Deflection from the Earth's rotation; measurable past ~800 yd, set by latitude and firing azimuth |
| **Drag Model** | Which reference projectile the BC is quoted against — G7 for boat-tails, G1 for flat-base |
| **IPSC Target** | The official 450 × 570 mm octagon with A / C / D scoring zones (IPSC Handgun Rules, Appendix B2) |
| **Internal Ballistics** | Combustion, pressure, and muzzle velocity inside the barrel |
| **External Ballistics** | Drag, wind, drop, spin drift, and Coriolis after the muzzle |

### Heurisko Tools

| Term | Meaning |
|---|---|
| **Efstathia** | Gyroscopic stability (Sg) calculator |
| **Kylindros** | Ballistic-coefficient estimator from measured data |
| **Monte Carlo** | Hit-probability trajectory simulator |
| **Manteis** | Empirical hit-probability comparison across many saved sessions |
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
