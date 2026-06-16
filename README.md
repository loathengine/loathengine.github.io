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
| **Mean Radius (MR)** | Average distance of all shots from their collective center. More reliable than Group Size on small groups |
| **95% CI** | 95% Confidence Interval for Mean Radius — the range the true long-term average is expected to fall in, from 1,000 bootstrap resamples |
| **MoE** | Margin of Error — the ±% half-width of the 95% CI. Lower means a more trustworthy estimate |
| **Group Size** | Distance between the two widest shots (Extreme Spread). Highly sensitive to outliers; unreliable on groups fewer than ~20 shots |
| **H / V Extreme Spread** | Horizontal and vertical extent of the group measured independently |
| **MPI Offset** | Mean Point of Impact — the geometric center of all shots; where your load actually prints on target |
| **Reliability Rating** | 0.5–5.0 star composite score based on sample size, bootstrap convergence (MoE), and Shapiro-Wilk normality |
| **Vel SD** | Standard deviation of muzzle velocities recorded in the session |
| **Velocity ES** | Extreme Spread of muzzle velocities (max minus min) |
| **Vert Dispersion R²** | R-squared correlation between muzzle velocity and vertical shot position — values above 40% indicate velocity is driving vertical stringing |
| **Shapiro-Wilk** | Normality test for shot location and velocity distributions — used in the Reliability Rating calculation |
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

Go to **DB Management → Sync Database**. This imports ~600 bullet profiles, 77 powders, 45 cartridges, primers, and brass from the built-in open-source library — no manual entry needed. Safe to run multiple times; it only adds or updates records without deleting your personal data.

**2. Add your firearm**

Go to **Firearms** and enter your rifle's nickname, cartridge, barrel length, twist rate, and scope height over bore.

**3. Add your load**

Go to **Load Data** and create a handload recipe.

### Range Day

**4. Upload your target**

Go to **Targets** and upload a photo of your range target, or design one with the built-in generator before you go.

**5. Mark your impacts**

Go to **Marking**. Select your target, set the scale, mark each bullet hole, associate the session with your firearm and load, and save.

**6. Analyze**

Go to **Analysis**, select your sessions, and review statistical results and the composite group plot.

**7. Back up**

Go to **DB Management → Export Entire Database** and save the `.json` file somewhere safe.

---

## Tab-by-Tab Guide

### About Us

The landing page. Provides an overview of the app's purpose and privacy architecture. No data entry here.

---

### Firearms

**Adding a firearm:**
1. Enter a **Nickname** (e.g., `6.5 PRC Hunting Rifle`)
2. Select the **Cartridge** it's chambered in
3. Enter **Barrel Length**, **Twist Rate** (e.g., `8` for 1-in-8"), and **Sight Over Bore** (scope centerline height above bore, in inches)
4. Click **Save Firearm**

**Editing:** Click **Edit** next to any entry, make changes, then click **Save Firearm** again.

> **Why twist rate matters:** The ballistic simulator uses twist rate to calculate gyroscopic stability (Sg) and spin drift, which directly affect long-range predictions.

---

### Load Data

**Creating a Handload:**
- Select Cartridge → Bullet → Powder in order (dropdowns are chained)
- Enter **Charge Weight** (grains), **COAL**, and **CBTO** if you measure it
- Click **Save Load**

**Recipe Sheet:** Click **Recipe** on any handload to generate a printable summary card.

---

### Targets

#### Range Targets (Upload)

1. Click **"Upload New Target Image(s)"** and select image files from your device
2. Images are automatically converted to `.webp` and stored as efficient binary data
3. Use **Preview**, **Rename**, **Download**, or **Delete** from the gallery

> **Tip:** Name your targets descriptively before going to the Marking tab — e.g., `100yd 5-shot Jun-2026`. The name appears in session dropdowns.

#### Custom Targets (Generator)

Design and print targets before your range trip:
- Set paper size, orientation, and grid options
- Choose bullseye shape (Circle, Square, Diamond, Cross, etc.), ring count, and colors
- Add a label that can pull firearm and load data automatically
- Use **Download PNG** or **Print** to output the design

---

### Marking

> **The golden rule:** Always set the scale before marking any shots. Without it, all measurements will be in raw pixels — scientifically meaningless.

#### Step-by-Step

**1. Select your target image** using the **Load Saved Image** dropdown.

**2. Set the Scale**

The scale tells the app how many pixels equal one inch on your specific image.

- Enter a **known distance** (e.g., `2`)
- Select **units** (e.g., `Inches`)
- Click **Set Scale**
- Click two points on the canvas exactly that distance apart

*Example: If your target has a 2-inch bullseye ring, type `2`, select `Inches`, click Set Scale, then click the left edge and right edge of that ring.*

**3. Create a Group** — Click **New Group**. Each group is one set of shots at a single aiming point. You can have multiple groups per session (e.g., a ladder test with different charge weights).

**4. Set POA** — Click **Set POA**, then click the exact spot on the target you were aiming at.

**5. Mark Impacts** — Click **Mark Impacts**, then click each bullet hole. A numbered dot appears per shot. Click **Undo** if you misclick.

**6. Enter Shot Velocities (Optional)** — If you used a chronograph, enter each shot's velocity in the list below the canvas. This enables velocity-dispersion correlation analysis.

**7. Enter Session Details** — Select the Firearm, Load, Target Distance, and environmental conditions (temperature, altitude, pressure) in the right panel.

**8. Save** — Click **Save / Update Session**. Always do this before navigating away — the canvas is not auto-saved.

---

### Analysis

> **Why composite?** A 5-shot group gives a rough picture. Ten 5-shot groups composited around their centers give a 50-shot dataset that reveals the true capability of your rifle and load. Mean Radius on 50 shots is far more meaningful than Extreme Spread on 5.

#### Metric Reference

| Metric | What It Tells You |
|--------|-------------------|
| **Mean Radius (MR)** | Typical shot-to-shot consistency. Lower = better |
| **95% CI (\u00b1MoE%)** | How confident you can be in the Mean Radius estimate. Tighter CI = more trustworthy |
| **Group Size** | Worst-case spread — highly variable on small groups, one flyer can wreck it |
| **H / V Extreme Spread** | Horizontal and vertical extent measured independently |
| **MPI Offset** | Where your load actually prints relative to point of aim |
| **Reliability Rating** | 0.5–5.0 stars: composite quality score including sample size, convergence, and normality |
| **Vel SD** | Muzzle velocity consistency shot-to-shot |
| **Vert Dispersion R²** | Whether velocity variation is causing your vertical stringing (>40% = correlated) |

#### Step-by-Step

1. **Filter** using the chained panel (Firearm → Cartridge → Bullet → Powder) to narrow the session list
2. **Select** sessions with checkboxes, or click **All**
3. **Click Analyze Selected**
4. **Review:**
   - **Analysis Results Table** — Mean Radius (with 95% CI), Group Size, Shot SD, Vel SD / Vert Dispersion R², and Reliability Rating per session
   - **Dispersion Analysis** — checks for vertical stringing and velocity-spread correlation
   - **Composite Plot** — all groups overlaid and aligned by MPI
5. **Export:**
   - **Export as Image** — downloads a 16:9 HUD report
   - **Export Data (JSON)** — full data export including the visual report embedded as base64

---

### Heurisko (Ballistics & Simulation Suite)

Heurisko is the app's internal scientific suite. "Heurisko" refers to heuristic ballistic modeling — using empirical data to make forward-looking performance predictions and thermodynamic simulation sweeps. The suite contains four tabs: **Stability**, **Monte Carlo**, **Ignition**, and **DOPE**.

#### Ballistic Engine Capabilities

- **High-resolution drag tables** — 79-point G1 and 87-point G7 (BRL/McCoy research)
- **Iterative 3-pass solver** — sub-0.001" zero precision
- **Altitude-dependent gravity** — inverse-square law correction
- **Humidity-corrected speed of sound**
- **Miller stability formula** — Sg from twist rate, bullet dimensions, and velocity
- **Propellant thermodynamic solver** — internal ballistics solver modeling combustion curves
- **Spin drift** — predicted from Sg and range
- **Aerodynamic jump** — crosswind-induced vertical deflection

---

#### 1. Stability Analysis (Gyroscopic Stability)

This calculator implements the **Refined Miller Twist Rule** to compute the gyroscopic stability factor ($S_g$) of a bullet. It corrects for muzzle velocity and local atmospheric density (based on altitude, temperature, and station pressure).

**Key Features:**
- **Plastic Tip Compensation:** If a bullet has a plastic tip, check **Bullet has Plastic Tip** and enter the tip length. The calculator adjusts bullet core length to model the gyroscopic stability of the metal body.
- **Stability Thresholds:**
  - **Stable ($S_g \ge 1.5$):** Optimum stability. Projectiles maintain drag efficiency and dynamic stability.
  - **Marginally Stable ($1.0 \le S_g < 1.5$):** Bullet is stable but experiences yaw, which reduces the effective BC by up to 10–15% and increases group dispersion.
  - **Unstable ($S_g < 1.0$):** Bullet lacks spin to counteract aerodynamic forces and will tumble, causing keyholing.

---

#### 2. Monte Carlo Simulation (Hit Probability)

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

#### 3. Propellant Ignition Simulator (Internal Ballistics)

This tab simulates thermodynamic propellant combustion and bullet acceleration down the barrel using a physics solver. It outputs pressure-time curves (P-V curves) and burned percentage along the barrel.

**Inputs & Features:**
- **Auto-Fill from database:** Pulls case capacity ($H_2O$ grains), bullet diameter, weight, length, powder burn rates ($Ba$), heat of explosion, grain geometry, and solid density from loads and components.
- **Diagnostics & Safety Audits:**
  - **Chamber Pressure:** Compares peak simulated pressure against the SAAMI maximum limit. Triggers critical warnings if overpressure is predicted.
  - **Loading Density (Case Fill):** Flags low-fill hazards ($< 80\%$) which can cause erratic ignition/secondary detonation, and compressed loads ($> 100\%$, with critical alerts for excessive compression $> 105\%$).
  - **Neck Tension (Seating Depth):** Ensures bullet seating depth is at least one bullet diameter (1-caliber rule) for optimal neck tension and concentricity.
  - **OAL Boundaries:** Compares your COAL against the SAAMI maximum cartridge OAL to ensure magazine compatibility and chamber clearance.
- **Diagnostic Reports:** Generates a complete structured report with thermodynamic and safety recommendations that can be copied/downloaded.

---

#### 4. Ballistic DOPE Card & Point Blank Zero (MPBR)

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
| **Powders** | Propellant profiles including ballistic simulator coefficients |
| **Primers** | Primer inventory linked to primer pocket size |
| **Brass** | Brass inventory with water capacity and primer data |

> Not all fields need to be filled. Optional fields improve ballistic simulation accuracy but the app functions without them.

---

### DB Management

#### Sync Database

Imports the built-in `master-db.json` library into your local database. Uses `put()` semantics — existing records are overwritten by ID, your personal data is unaffected.

**What gets synced:** ~600 bullet profiles, 77 powders, 45 cartridges, 29 brass entries, and 33 primers.

#### Nuclear Reset

⚠️ **Destructive.** Clears every record from every table. Export a backup first.

#### Clear Table

Clears one specific table without touching others.

#### Export Data

Downloads a `.json` backup. Target images are automatically converted from binary Blob to Base64 strings for JSON compatibility.

#### Restore / Merge Data

Imports a `.json` backup. Records are merged by ID. Base64 image data is automatically converted back to binary Blob storage on import.

#### Table Browser

Raw view of every table and record. Useful for inspecting or debugging specific entries.

---

## Troubleshooting

**My measurements are huge/wrong numbers**
You didn't set the scale before marking. The app is measuring in raw pixels. Start a new session, set the scale first, then re-mark your shots.

**My groups disappeared after closing the browser**
You didn't save the session. Always click **Save / Update Session** before navigating away. The canvas is not auto-saved.

**Sync Database didn't seem to do anything**
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

1. Go to **DB Management**
2. Ensure **"Entire Database"** scope is selected
3. Click **Export Data**
4. Save the `.json` file to cloud storage, an external drive, or both

### How to Restore

1. Go to **DB Management**
2. Click **Restore / Merge Data**
3. Select your backup `.json` file
4. Records are merged — existing records overwritten, personal records preserved

### Recommended Backup Schedule

- After every range session
- After adding new firearms or loads
- After running a master database sync

---

*For technical database schema documentation, see [SCHEMA.md](SCHEMA.md).*
