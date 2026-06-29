# Empirical Precision — User Guide

## What Is This App?

Empirical Precision is a browser-based shooting journal and analysis tool. It lets you:

- **Catalog** your firearms, reloading components, and ammunition
- **Photograph** your range targets and mark each bullet impact
- **Analyze** your groups statistically — across one session or many
- **Simulate** hit probability at range using a physics-based ballistic engine

Everything runs in your browser. No account, no server, no internet connection required after the first page load. Your data never leaves your device.

---

## Table of Contents

1. [Key Concepts & Terms](#key-concepts--terms)
2. [Privacy & Data Storage](#privacy--data-storage)
3. [Recommended Workflow](#recommended-workflow)
4. [Tab-by-Tab Guide](#tab-by-tab-guide)
5. [Troubleshooting](#troubleshooting)
6. [Data Backup](#data-backup)

---

## Key Concepts & Terms

| Term | Meaning |
|------|---------|
| **Session** | One range visit: a target, one or more groups, and metadata (firearm, load, distance) |
| **Group** | A set of shots fired at a single point of aim within a session |
| **Mean Radius (MR)** | Average distance of all shots from their collective center (MPI). The primary performance metric — not distorted by a single flyer, unlike ES POI |
| **95% CI** | The range within which the true long-term Mean Radius is expected to fall with 95% probability, calculated from 1,000 bootstrap resamples of the actual shot data. Used internally to drive the Reliability Rating |
| **ES POI (Group Size)** | Extreme spread of the points of impact — center-to-center distance between the two furthest shots. Quick to read in the field but highly sensitive to one outlier. A poor statistical metric; use it to flag a severe system issue (baffle strike, loose action screws, etc.) |
| **ES POI HV** | Horizontal (H) and vertical (V) spread of the group measured independently. Use to narrow down significant issues seen in the ES POI. Examples include barrel contact or scope cant |
| **MPI Offset** | Mean Point of Impact — the average X and Y position of all shots relative to the session origin. Indicates where the load prints on target, not how tightly it groups |
| **SD POI HV** | Standard Deviation of the Horizontal or Vertical Points of Impact. A diagnostics tool, not a performance metric. If SD H ≈ SD V, scatter is uniform. If SD V >> SD H, you have vertical stringing — look at velocity variance, dragging firing pin, or barrel-stock contact. If SD H >> SD V, you have horizontal stringing — look at wind, loose bipod, or lateral trigger push |
| **Reliability Rating (0.5 – 5.0 Stars)** | A composite score that rates data quality. It starts from sample size, then adjusts based on bootstrap CI convergence, Shapiro-Wilk normality for shot location, and Shapiro-Wilk normality for velocity. A high-shot-count session can still be penalized if the data is non-normal or has extreme outliers |
| **SD V** | Sample standard deviation of muzzle velocities (n-1 formula). Evaluates the entire distribution of the propellant burn — how the internal ballistics are functioning as a cohesive system |
| **ES V** | Extreme Spread of muzzle velocities (max minus min). Good for flagging a severe system problem in the field, but a poor statistical tool. A sudden spike to 60+ fps is a red flag (blown primer, severe neck tension, erratic ignition) |
| **Vert Dispersion R²** | R-squared from a linear regression of muzzle velocity vs. vertical shot position. Values above 40% indicate velocity variance is a statistically significant driver of vertical stringing. The smoking gun connecting SD V to vertical dispersion. No correlation means chasing SD V may not improve vertical grouping |
| **Shapiro-Wilk Test (Location / Velocity)** | A normality test run on shot radial distances from MPI and, separately, on muzzle velocities. W ranges from 0 to 1 — closer to 1 means more normal. p ≥ 0.10 = Normal (+0.5 ★ to rating); p 0.05–0.10 = Marginal (neutral); p < 0.05 = Non-Normal (penalty). Non-normal shot patterns suggest outliers or flyers. Non-normal velocity suggests primer or charge variation |
| **POA** | Point of Aim — where you were aiming when firing |
| **Composite Analysis** | Combining multiple sessions aligned by MPI to build meaningful sample sizes from small groups |
| **Scale** | A calibration you set in the Marking tool so the app knows how many pixels equal one inch |

---

## Privacy & Data Storage

- **Offline first.** The app requires internet only for the initial page load.
- **100% local.** All data is stored in your browser's IndexedDB. Nothing is transmitted to any server.
- **Vulnerable to browser resets.** Clearing your browser's site data deletes all local data permanently. Back up regularly.

---

## Recommended Workflow

### First-Time Setup

**1. Sync the master database**

Go to **DB Management** and click **Sync Remote Repo** under the *Sync Empirical Precision Database* section. This imports bullet profiles, powders, cartridges, primers, and brass from the built-in open-source library — no manual entry needed. Safe to run multiple times; it only adds or updates records without deleting your personal data.

**2. Add your firearm**

Go to **Firearms** and enter your rifle's nickname, cartridge, barrel length, twist rate, and scope height over bore.

**3. Add your load**

Go to **Load Library** and create a handload recipe with bullet, powder, charge weight, brass, and seating specs.

### Range Day

**4. Design custom targets (Optional)**

Go to **Targets** to design and print custom paper targets with exact rings, grid overlays, and labels before heading to the range.

**5. Upload your target image**

Go to **Marking**. Under the **Targets** panel in the left sidebar, click **Upload Image(s)** to upload a photo of your shot group. Add the target to the session.

**6. Set the scale calibration**

In the **Marking** tab, enter a known reference distance (e.g., `2` inches) under *Scale Setup*, click **Set Scale**, then click two points on your target image exactly that distance apart.

**7. Mark your Point of Aim (POA) & impacts (POI)**

Click **New Group**, select **Set POA** and click your target's aiming point on the canvas. Then select **Mark POI** and click each bullet hole to mark impact positions. You can optionally log chronographed muzzle velocities in the *Impact Data* table. Name your marked target and click **SAVE MARKED TARGET**.

**8. Combine into a Session**

Go to **Sessions** and create a new session by selecting your saved **Marked Target**, **Firearm**, and **Load**. Set the environmental conditions (temperature, pressure, altitude) and click **+ Create Session**.

**9. Analyze**

Go to **Analysis**, select your sessions with checkboxes, and click **ANALYZE SELECTED** to review statistical results, dispersion trends, normality tests, and the composite overlay plot.

**10. Back up your data**

Go to **DB Management**, expand **Advanced Database Settings**, select `-- Entire Database --` under *Target Active Scope*, and click **Export Selected Scope** to download a `.json` backup file.

---

## Tab-by-Tab Guide

### About Us

The landing page. Provides an overview of the app's purpose, design philosophy, and privacy architecture. No data entry here.

---

### Targets

The target design generator suite. Design and print custom targets before your range trip:
- Set paper size (Letter, Legal, A4, 12x12), orientation, and grid options.
- Choose bullseye shape (Round, Square, Diamond, Star, Triangle, Hexagon), ring count, and colors.
- Add a text label that can pull cartridge and load data automatically from your library.
- Click **EXPORT TO PDF (PRINT)** or **EXPORT IMAGE** to download the design.

> **Note:** Target images from range sessions are uploaded and calibrated directly on the **Marking** page, not here.

---

### Firearms

**Adding a firearm:**
1. Enter a **Nickname** (e.g., `6.5 PRC Hunting Rifle`).
2. Select the **Cartridge** it is chambered in.
3. Enter **Barrel Length**, **Twist Rate** (e.g., `8` for 1-in-8"), and **Sight Over Bore** (scope centerline height above bore, in inches).
4. Click **Save Firearm**.

**Editing:** Click **Edit** next to any entry, make changes, then click **Save Firearm** again.

> **Why twist rate matters:** The ballistic simulator uses twist rate to calculate gyroscopic stability ($S_g$) and spin drift, which directly affect long-range predictions.

---

### Load Library

**Creating a Load:**
- Enter a **Nickname** (or leave it blank to auto-generate from specs).
- **1. Cartridge Spec** — Select Diameter and Cartridge Case.
- **2. Bullet Details** — Select Weight, Bullet Name, and Lot #.
- **3. Powder Charge Specs** — Select Powder Mfg, Powder Brand, Charge Weight (grains), and Lot #.
- **4. Brass Specs** — Select Brass Manufacturer, Pocket Size, Exact Case, Brass Lot #, and Firings count.
- **5. Primer Details** — Select Primer Manufacturer, Actual Primer, and Lot #.
- **6. Seating & Precision Dimensions** — Enter COAL (Cartridge Overall Length, in), CBTO (Cartridge Base to Ogive, in), CBTO Comparator tool, Shoulder bump (in), and Shoulder Comparator tool.
- Click **Save Load** (or **Update Load** when editing).

**Managing Loads:** View the list of saved loads with quick details on bullet specs, powder specs, and COAL. You can sort by Nickname, Cartridge, Bullet Weight, Powder, Charge, and COAL, and easily edit or delete loads.

---

### Marking

> **The golden rule:** Always set the scale before marking any shots. Without it, all measurements will be in raw pixels — scientifically meaningless.

#### Step-by-Step

**1. Upload or Select Target Image:**
Under the *Targets* section in the left sidebar, click **Upload Image(s)** to upload a new target photo. Once uploaded, select it from the *Select from Gallery* dropdown and click **Add Target** to place it on the canvas. To load an existing marked target, select it under the *Load Saved* dropdown and click **Load**.

**2. Set the Scale:**
The scale tells the app how many pixels equal one inch or millimeter on your image.
- Enter a **known distance** (e.g., `2`).
- Select **units** (Inches or mm).
- Click **Set Scale**.
- Click two points on the canvas exactly that distance apart.

**3. Create a Group:**
Click **New Group**. Each group represents a set of shots fired at a single point of aim.

**4. Set POA (Point of Aim):**
Click **Set POA**, then click the exact spot on the target you were aiming at.

**5. Mark Impacts (POI):**
Click **Mark POI**, then click each bullet hole on the target. A numbered dot appears for each shot. Use **Undo Last** or **Erase Shot** if you make a mistake.

**6. Enter Shot Velocities (Optional):**
If you used a chronograph, enter each shot's velocity (in fps) in the **Impact Data** table below the canvas. This enables velocity-dispersion correlation analysis.

**7. Save Target:**
Enter a name for the marked target, enter the target distance (yards/meters), and click **SAVE MARKED TARGET**.

---

### Sessions

The bridge that connects your range targets to your rifles and ammunition. A session combines a marked target, firearm, load, and environmental conditions.

**Creating a Session:**
1. Select a saved **Marked Target**.
2. Select the **Firearm** used.
3. Select the **Load** fired (automatically filtered to matching cartridges if a firearm is selected).
4. Enter a custom **Session Name** (or let it auto-generate).
5. Enter **Environmental Conditions** (temperature, pressure, altitude).
6. Click **+ Create Session**.

**Managing Sessions:** View, edit, delete, export individual sessions as JSON, or import sessions from files.

---

### Analysis

> **Why composite?** A 5-shot group gives a rough picture. Ten 5-shot groups composited around their centers give a 50-shot dataset that reveals the true capability of your rifle and load. Mean Radius on 50 shots is far more meaningful than Extreme Spread on 5.

#### Metric Reference

| Metric | What It Tells You |
|--------|-------------------|
| **Mean Radius (MR)** | Typical shot-to-shot consistency. Lower = better. |
| **95% CI** | The range within which the true long-term Mean Radius is expected to fall with 95% probability. Used internally to drive the Reliability Rating. |
| **ES POI (Group Size)** | Extreme spread of the points of impact — center-to-center distance between the two furthest shots. Highly sensitive to outliers. |
| **ES POI HV** | Horizontal (H) and vertical (V) spread of the group measured independently. |
| **SD POI HV** | Standard Deviation of the Horizontal or Vertical Points of Impact. A diagnostics tool to identify non-uniform scatter (stringing). |
| **MPI Offset** | Where your load actually prints relative to point of aim. |
| **Reliability Rating** | 0.5–5.0 stars composite score rating data quality based on sample size, bootstrap CI convergence, and normality. |
| **SD V** | Muzzle velocity standard deviation. Evaluates propellant burn consistency. |
| **ES V** | Extreme spread of muzzle velocities (max minus min). Good for flagging severe system issues. |
| **Vert Dispersion R²** | R-squared showing if velocity variation is driving vertical stringing (>40% = correlated). |

#### Step-by-Step

1. **Filter** sessions in the setup panel (Firearm → Cartridge → Bullet → Powder) to narrow the list.
2. **Select** sessions using checkboxes, or click **All**.
3. **Click ANALYZE SELECTED**.
4. **Review:**
   - **Analysis Results Table** — View Mean Radius (with 95% CI), ES POI, SD POI HV, SD V / R², and Reliability stars. Click **Show Insights** to inspect normality test results and rating breakdowns.
   - **Composite Plot** — View all groups overlaid and aligned by their Mean Point of Impact.
   - **Analysis Report** — Read or copy the text report of ranking, details, environmental conditions, and database parameters.
5. **Export & Copy:**
   - **SAVE IMAGE** — Downloads a high-resolution PNG image report containing the composite plot and data HUD table.
   - **Copy Report** — Copies the full structured text analysis report to your clipboard.

---

### Heurisko (Ballistics & Simulation Suite)

Heurisko is the app's internal scientific suite. "Heurisko" refers to heuristic ballistic modeling — using empirical data to make forward-looking performance predictions and thermodynamic simulation sweeps. The suite contains five tabs: **Efstathia**, **Kylindros**, **Monte Carlo**, **Ignition**, and **DOPE**.

#### Ballistic Engine Capabilities

- **High-resolution drag tables** — 79-point G1 and 87-point G7 (BRL/McCoy research)
- **Iterative 3-pass solver** — sub-0.001" zero precision
- **Altitude-dependent gravity** — inverse-square law correction
- **Humidity-corrected speed of sound**
- **Miller stability formula** — Sg from twist rate, bullet dimensions, and velocity
- **Propellant thermodynamic solver** — internal ballistics solver modeling combustion curves with fill-fraction-dependent burn rate
- **Spin drift** — predicted from Sg and range
- **Aerodynamic jump** — crosswind-induced vertical deflection

---

#### 1. Efstathia Analysis (Gyroscopic Stability)

This calculator implements the **Refined Miller Twist Rule** to compute the gyroscopic stability factor ($S_g$) of a bullet. It corrects for muzzle velocity and local atmospheric density (based on altitude, temperature, and station pressure).

**Key Features:**
- **Plastic Tip Compensation:** If a bullet has a plastic tip, check **Bullet has Plastic Tip** and enter the tip length. The calculator adjusts bullet core length to model the gyroscopic stability of the metal body.
- **Stability Thresholds:**
  - **Stable ($S_g \ge 1.5$):** Optimum stability. Projectiles maintain drag efficiency and dynamic stability.
  - **Marginally Stable ($1.0 \le S_g < 1.5$):** Bullet is stable but experiences yaw, which reduces the effective BC by up to 10–15% and increases group dispersion.
  - **Unstable ($S_g < 1.0$):** Bullet lacks spin to counteract aerodynamic forces and will tumble, causing keyholing.

#### 2. Kylindros (Ballistic Coefficient Estimation)

Kylindros estimates your bullet's Ballistic Coefficient (BC) based on shot muzzle velocities and downrange points of impact (POI). It uses an iterative bisection solver running on the 3DOF RK4 ballistics engine.

**Statistical Reliability Metrics:**
- **Shot-by-Shot Analysis**: Calculates individual BCs for each shot in the session, generating a distribution.
- **95% Confidence Interval**: Provides the statistical range where the true BC resides. If the interval is wide, the estimation is flagged as unreliable.
- **Reliability Assessment HUD**: Checks physical signals (distance, shot count) and data precision (velocities, CI width) to give a reliability rating from Highly Unreliable to High Reliability.

**Important Guidelines:**
- **Zero Angle Sensitivity**: Extremely sensitive to zero errors. A 0.25 MOA zero error translates to an 8% error in estimated BC.
- **Short Range Limit**: Target distance must be at least 300 yards/meters. Below this range, drag differences are masked by rifle dispersion, rendering calculations invalid.

---

#### 3. Monte Carlo Simulation (Hit Probability)

Uses a physics-based external ballistics engine seeded with your real measured session dispersion (Mean Radius) to predict field performance.

**Using the Simulator:**
1. Select a session — imports your real-world MR as the dispersion seed
2. Configure firearm — barrel length, twist rate, and sight height pull from your database
3. Configure load — BC, bullet weight, and velocity pull from your database
4. Set environmental conditions — temperature, altitude, wind
5. Set target — shape (IPSC, Circle, Square) and size
6. Run — generates P(Hit) vs Range curves

> **Interpreting results:** P(Hit) = 0.90 at 500 yards means your rifle/load/shooter system is expected to hit a target of that size 9 times out of 10 at that distance, accounting for measured dispersion and atmospheric ballistics.

---

#### 4. Propellant Ignition Simulator (Internal Ballistics)

This tab simulates thermodynamic propellant combustion and bullet acceleration down the barrel using a physics solver. It outputs pressure-time curves (P-V curves) and burned percentage along the barrel.

**Inputs & Features:**
- **Auto-Fill from database:** Pulls case capacity ($H_2O$ grains), bullet diameter, weight, length, powder burn rates ($Ba$, $\lambda$), heat of explosion, grain geometry, and solid density from loads and components.
- **Diagnostics & Safety Audits:**
  - **Chamber Pressure:** Compares peak simulated pressure against the SAAMI maximum limit. Triggers critical warnings if overpressure is predicted.
  - **Loading Density (Case Fill):** Flags low-fill hazards ($\lt 80\%$) which can cause erratic ignition/secondary detonation, and compressed loads ($\gt 100\%$, with critical alerts for excessive compression $\gt 105\%$).
  - **Neck Tension (Seating Depth):** Ensures bullet seating depth is at least one bullet diameter (1-caliber rule) for optimal neck tension and concentricity.
  - **OAL Boundaries:** Compares your COAL against the SAAMI maximum cartridge OAL to ensure magazine compatibility and chamber clearance.
- **Diagnostic Reports:** Generates a complete structured report with thermodynamic and safety recommendations.

**Sharing Your Diagnostic Report:**

The report share bar (below the EXPERIMENTAL warning banner) provides three methods to submit your report for developer support — all work on every device without requiring a local email client:

| Button | What it does |
|--------|--------------|
| **Copy Report** | Copies the full diagnostic report to your clipboard. Paste it anywhere — Discord, text file, email, etc. Button briefly shows ✓ *Copied!* on success. |
| **Download .txt** | Saves a `.txt` file named `ignition_report_<Cartridge>_<Powder>_<date>.txt` directly to your Downloads folder. Use this to attach the report to any message. |
| **Open Gmail** | Opens a pre-filled Gmail compose window in your browser with the report in the body and the developer email pre-addressed. No local mail app required. |

> **Tip:** The fastest path on mobile or shared computers is **Download .txt** — then attach it to a message on the Empirical Precision Discord.

---

#### 5. Ballistic DOPE Card & Point Blank Zero (MPBR)

Generates pocket-sized ballistic reference cards using the 4th-Order Runge-Kutta exterior ballistics engine.

**Key Features:**
- **MIL & MOA Support:** Supports turret click values of 0.1, 0.2, or 0.05 MIL, and 1/4, 1/8, 1/2, or 1 MOA.
- **Range Increments:** Choose regular distance steps (e.g., every 50 or 100 yards/meters) or comma-separated specific stops (e.g., custom target distances: `123, 400, 527, 750`).
- **Maximum Point Blank Range (MPBR):** Activates a solver that finds the optimal zero range (Point Blank Zero) keeping bullet impacts within a defined target vital zone (e.g., 8 inches) without any elevation adjustments, maximizing the range at which you can aim dead-center.
- **Visual Styles:** Multiple themes (Pocket Card size, Tactical Dark, Classic White, Hi-Viz Yellow, Military Green) optimized for direct high-resolution PNG image download.


### Components

The foundation of the application. The master database sync fills most of this automatically. Only add components not already in the library.

| Sub-tab | What It Stores |
|---------|---------------|
| **Manufacturers** | Companies producing bullets, powder, primers, brass, or ammo |
| **Diameters** | Caliber definitions (e.g., `.308`, `.264`) |
| **Cartridges** | Specific chamberings linked to a diameter, with SAAMI specs |
| **Bullets** | Full profiles: weight, length, ogive, BC, form factors |
| **Powders** | Propellant profiles including ballistic simulator coefficients (`baCoeff`, `baFillSlope`, `burnExponent`, `combustionEfficiency`) |
| **Primers** | Primer inventory linked to primer pocket size |
| **Brass** | Brass inventory with water capacity and primer data |

> Not all fields need to be filled. Optional fields improve ballistic simulation accuracy but the app functions without them.

---

### DB Management

#### Sync Empirical Precision Database
Imports the built-in library into your local database. Existing records are overwritten by ID, but your personal data is unaffected.
- **Sync Remote Repo** button: Syncs all bullet profiles, powders, cartridges, brass entries, and primers from the master library.

#### Import Saved JSON Data
Restore or merge your history, firearms, loads, and custom components from a previously exported `.json` file.
- Records are merged by ID. Base64 image data is automatically converted back to binary Blob storage on import.

#### Advanced Database Settings (Collapsible Panel)
- **Target Active Scope**: Dropdown to select either `-- Entire Database --` or a specific table (e.g. `firearms`, `loads`, `sessions`, `targetImages`).
- **Export Selected Scope** button: Downloads a `.json` backup of the active scope. Target images are automatically converted from binary Blobs to Base64 strings for JSON compatibility.
- **Install PWA App** button: Installs Empirical Precision as a standalone PWA on your device so you can run it fully offline at the shooting range.
- **Wipe Active Scope** button: Destructive operation that clears all records from the selected table or wipes the entire database.
- **Raw DB Records Browser**: View, inspect, or delete raw IndexedDB records when a specific table is selected.

---

## Troubleshooting

**My measurements are huge/wrong numbers**
You didn't set the scale before marking. The app is measuring in raw pixels. Load your marked target, set the scale under *Scale Setup*, and re-save.

**My groups/marked targets disappeared after closing the browser**
You didn't save your target or session. Always click **SAVE MARKED TARGET** in the Marking tab, and click **+ Create Session** / **Update Session** in the Sessions tab before navigating away. The canvas is not auto-saved.

**Sync Remote Repo didn't seem to do anything**
The records were already there from a previous sync and were silently overwritten. Your database is up to date.

**I cleared my browser history and lost all my data**
Clearing browser site data permanently deletes IndexedDB. There is no recovery without a JSON backup. Back up after every session.

**My scale looks wrong / measurements don't match reality**
Common causes: scale points weren't placed precisely; the target image was cropped or resized after printing; or the wrong units were entered. Re-set the scale by clicking **Set Scale** again and re-clicking the reference points carefully.

**The ballistic simulator gives unexpected results**
Check: Firearm has twist rate and sight over bore set. Bullet has G7 BC entered with `Preferred Model` = `G7`. Muzzle velocity is correct. Environmental conditions are realistic.

---

## Data Backup

> ⚠️ **Your data exists only in your browser. Clearing browser site data deletes it permanently with no recovery.**

### How to Back Up

1. Go to **DB Management**.
2. Click **Advanced Database Settings** to expand the panel.
3. Ensure **Target Active Scope** is set to `-- Entire Database --`.
4. Click **Export Selected Scope**.
5. Save the `.json` file to cloud storage, an external drive, or both.

### How to Restore

1. Go to **DB Management**.
2. Under the **Import Saved JSON Data** section, click the file input to select your backup `.json` file.
3. Click the **Import Saved JSON Data** button.
4. Records are merged — existing records with matching IDs are updated, personal records are preserved.

### Recommended Backup Schedule

- After every range session
- After adding new firearms or loads
- After running a master database sync

---

*For technical database schema documentation, see [SCHEMA.md](SCHEMA.md).*
*For the mathematical derivations behind the simulation engines, see [MATHS.md](MATHS.md).*

---

## Community & Support

Join the **Empirical Precision Discord** for load data discussion, bug reports, and feature requests:

> **[discord.gg/adymGUfjst](https://discord.gg/adymGUfjst)**

The **Join Discord** button on the app dashboard opens this link directly.
