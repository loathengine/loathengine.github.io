# Empirical Precision: User Guide

*A field manual for handloaders and precision shooters.*

---

## 1. What Empirical Precision Is and Who It's For

Empirical Precision is an **offline-first web app (PWA) for serious handloaders and precision rifle shooters.** It replaces gut feel with measured data and physics. Gut feel is the lucky three-shot group. It is the powder-chart guess and the folklore about "flyers". The app does four things and they reinforce each other:

- **Manage your components and ammunition.** Cartridges, bullets, powders, primers and brass live in one searchable library. Each handload recipe records everything down to CBTO and case firings.
- **Model internal ballistics.** A thermodynamic combustion solver predicts your **chamber pressure** and **muzzle velocity** from first principles. You can sanity-check a load against the SAAMI or C.I.P. pressure ceiling *before* you pull the trigger.
- **Model external ballistics.** A 3DOF Runge-Kutta trajectory engine predicts **drop, wind deflection, spin drift and hit probability** at distance from high-resolution G1/G7 drag tables.
- **Record and analyze live-fire.** Photograph your targets and mark the impacts. Pair them with chronograph velocities and get **composite group statistics** that actually mean something.

**Who benefits:** anyone who wants to know *why* a load shoots the way it does. That covers finding the least dispersion, confirming a bullet is stable out of your twist, building a DOPE card and comparing two loads by how often they'll hit a target at distance.

**What it covers: bottleneck rifle cartridges,** the cases with a shoulder that precision rifles chamber. Straight-wall cases such as the 45-70 Government, 350 Legend, 458 Winchester Magnum and 30 Carbine are not in the component library, their published loads are not in the Load Library's published data, and the Ignition engine is not fitted to them.

### Why everything is local

All of your data is stored in your browser's **IndexedDB**. It sits on your device rather than on a server. There is no account and no login. This matters for two concrete reasons:

- **Your data is always yours** There is no list of firearms, componets, or custom loads saved in an EP database somewhere.

- **It works at the range.** The app runs with **no cell signal and no Wi-Fi** once it is loaded or installed as a PWA. That is exactly where you need it.

The trade-off is that **clearing your browser's site data deletes everything permanently.** Back up regularly. See [Custom Data & Backups](#14-custom-data--backups). Installing the PWA requests persistent storage. That protects your data from routine browser eviction.

- **Privacy.** Empirical Precision uses Google Analytics/Ads. Nothing you enter into EP is ever sent to Google. Your loads, firearms and range sessions stay on your device. The one exception is a button you press yourself: Ignition's **Send Troubleshooting Report** posts that run's report, with your firearm and components, to the Empirical Precision Discord. It first shows you exactly what will be sent, and nothing leaves until you confirm.

> **Navigation bar order:** Firearms · Load Library · Marking · Chronos · Sessions · Analysis · Heurisko · Targets · Burn Chart · Components · Custom Data. The **Empirical Precision** logo at top-left returns you to the Dashboard.

---

## 2. The Core Workflow

This is the recommended path from a fresh install to a statistically verified load. Each step exists for a reason. Doing them in this order means every later step already has the data it needs.

**Step 0. Nothing to set up.** The component library of bullet profiles, powders, cartridges, primers and brass ships with the app and installs itself on the first launch, offline. So you rarely have to enter a component by hand. When a new version of the app brings a new library, it replaces the old one on its own and says so. It never touches your own records. A rifle, load or session of yours that names a cartridge the library no longer carries keeps everything else. The cartridge shows as **Unknown** on Firearms, and Ignition says the cartridge is no longer in your records when you pick the session or the load.

**Step 1. Add a Firearm.** *(Firearms tab)* Enter your rifle: cartridge, barrel length, twist rate and sight height over bore. **Why first:** twist rate drives the stability and spin-drift math. Sight height drives the trajectory zero. The cartridge determines which loads and pressure limits apply. Everything downstream inherits from this record.

**Step 2. Add a Load.** *(Load Library tab)* Build the handload recipe: bullet, powder and charge, brass, primer and seating dimensions (COAL/CBTO). **Why:** this is the exact ammunition whose performance you're about to measure and model. Precise seating data feeds the pressure and stability engines.

**Step 3. Mark your impacts.** *(Marking tab)* Upload a photo of your target. Set the scale and mark your point of aim and each bullet hole. **Why:** this converts a photograph into real measured coordinates. Those are the raw material for every group statistic. Save it as a **Marked Target.**

**Step 4. Attach chronograph velocities.** *(Chronos tab)* Import your chrono files and pair each velocity reading to a point of impact. **Why:** velocity is what connects *internal* consistency such as SD and ES to *external* behavior such as vertical stringing and drop. **Velocity now lives only in Chronos.** You can import many files at once. You can pair each shot to any impact in any order and even across different range sessions.

**Step 5. Build a Session.** *(Sessions tab)* Combine a Marked Target with a Firearm, a Load and the day's environment of temperature, pressure and altitude. **Why:** a Session is the complete self-contained record of what was fired, from what and in what conditions. It is the unit that Analysis and the simulators operate on.

**Step 6. Analyze.** *(Analysis tab)* Tick one Session or many. The results appear as you tick. **Why:** one small group is noise. Ten small groups composited around their centers is a real measurement. This is where you get Mean Radius, reliability, velocity SD and whether velocity is moving your vertical. To compare saved sessions distance by distance by how often each would hit, use **Manteis** on Heurisko.

---

## 3. Dashboard (Home)

The Dashboard is reached via the logo and it is your launch pad. It lays out the six-step Getting Started workflow as clickable cards. It also offers one-tap buttons to **open this User Guide** and **join the Discord**. It's the fastest way to orient a new install or jump back into the pipeline. The bottom of the page holds links to the **Documentation**, **Feedback** and **Models** references, plus contact and publisher information. The [Glossary](#17-glossary) below is the source of truth for any label that seems ambiguous.

---

## 4. Firearms

Register each physical rifle once and reuse it everywhere. Fields: **Nickname**, **Caliber → Cartridge**, **Barrel Length**, **Twist Rate** (entered as the `X` in 1:X), **Twist Direction**, **Sight Height** over bore, **Mag COAL** and **Elevation Tracking**.

**Why each field matters:**
- **Twist rate** feeds the gyroscopic-stability (Sg) and spin-drift calculations. Get it wrong and every long-range prediction is off.
- **Twist direction** is the way the rifling turns. Spin drift goes that way, and a crosswind's aerodynamic jump reverses with it. Nearly every barrel is right-hand, so a rifle saved without one is taken as right-hand. Varytita, Kyvos, Manteis and the Sight-In tool take it from the rifle; the table marks a left-hand barrel **LH**.
- **Sight height over bore** sets where the line of sight crosses the trajectory. It is essential for correct drop and zero.
- **Barrel length** feeds the internal-ballistics velocity prediction.
- **Mag COAL** records the longest round your magazine will feed. That may be shorter than SAAMI max.
- **Elevation Tracking** is what your scope's elevation turret really moves per unit it reads. Leave it blank and the turret is taken as labelled. To measure it, dial a large correction, such as 40 MOA or 10 MIL, on a tall target at a taped distance and measure how far the reticle or the group actually moved, in the same unit. Enter both under **Test: Dialed** and **Test: Moved** and the factor fills itself in: 40 dialed and 38.5 moved is 0.9625. Each yard off at 100 yards puts the factor 1% off, so tape the distance. A factor outside 0.8 to 1.2 is refused: a gap that large is a unit mix-up, not tracking.

**Lands.** Editing a saved rifle shows its lands log under the form: CBTO at the lands, measured in this chamber. Pick the **Bullet Maker** and **Bullet** you measured with (a bullet from the box you load), the **Method** (a modified-case gauge, a seated-long dummy round or another), the **Comparator** insert, the **Date** and the **Barrel Rounds** at the time, and type the **Readings** in inches, five or so, separated by spaces. Keep one method and one comparator: either changes the number by itself. Each sitting shows its average, its spread (largest less smallest) and how many readings. Throat wear moves the lands forward, so the log keeps every sitting:
- with two or more sittings of one bullet, comparator and method at different round counts, it says how far the lands moved and the rate per 100 rounds, from your own barrel;
- when this rifle's sessions record a later round count than the newest reading, it says how many rounds have gone by since;
- for each of your loads with that bullet and cartridge, it gives the **jump**: the lands' CBTO less the load's CBTO, from the newest reading on the same comparator. A negative jump is shown as **jam**. A load whose CBTO names another comparator, or none, gets no jump, and the line says why.

The jump also ends the recipe line of a session on the Analysis page and in its report, from the reading nearest the session's round count. It is a record only: Ignition still simulates every load with its fixed 0.067 in jump. Editing a rifle keeps its lands log; if the barrel length or cartridge changed, the page says so, and readings from the old barrel are yours to delete.

**Per-firearm velocity offset (pressure-safe).** Two rifles in the same chambering can throw the same load at different speeds because of bore, throat and finish differences. That is a property of *your barrel* rather than the powder. The **Ignition** simulator in Heurisko lets you compare the model's predicted velocity to your measured chronograph mean and store the difference as a correction **on the firearm record.** This correction adjusts only the *displayed* velocity. It never touches the pressure trace or the safety audit. It's the right way to reconcile the model with your rifle without corrupting the physics. Editing a rifle keeps its offset. Change its **Barrel Length** or its cartridge and the offset is cleared, because it was trued on other hardware, and the page says so: save a new one from a session on the rifle as it is now.

---

## 5. Load Library

Catalog every handload recipe in full. The form walks through six sections: **1) Cartridge Spec** (caliber and case), **2) Bullet Details** (weight, bullet), **3) Powder Charge** (manufacturer, brand, charge in grains), **4) Brass Specs** (manufacturer, pocket size, exact case, number of firings), **5) Primer Details** and **6) Seating & Precision Dimensions** (COAL, CBTO with comparator tool, base-to-shoulder with comparator). Leave the nickname blank to auto-generate a descriptive name.

**Why the detail is worth it:** the load record is what the engines read. Charge weight and case capacity drive the pressure and velocity model. Bullet and COAL drive stability and trajectory. Brass firings let you trace an anomaly back to the brass. The saved-loads list sorts by nickname, cartridge, bullet weight, powder, charge or COAL so you can compare a ladder at a glance.


**Box Label.** Each saved load has a **Box Label** button that opens a label for a box of it under the row: the load's name or cartridge, bullet, powder and charge, primer, brass and its firings, COAL and CBTO with its comparator, the lot numbers, the day it was loaded and the round count, and optionally the rifle it was built for and a note. The lots start from the load's last session that recorded any, and say so: change any that this box came from a new lot. Pick a **4 × 6** or **4 × 4** label; **Print** opens it at true size for a 4-inch thermal label printer, and **Save Image** downloads it. It prints in black only, and long text shrinks to fit. Nothing on the label is stored: it is printed from the load and what you type.
---

## 6. Marking

Marking turns a **photo of your target** into measured impact coordinates. Every group statistic in the app starts here, so do it carefully.

The page is a large photo stage with its tools on top, and four sections beside it (under it on a phone): **Photos**, **Scale**, **Groups** and **Job**. The steps run in order and each one hands you to the next: adding a photo arms **Set Scale**, finishing the scale arms **Set POA**, and placing the aim point arms **Mark POI**. The line under the photo always says what the next click will do.

**The golden rule: set the scale before you mark anything.** Without a scale nothing can be measured, and the page will not let you save.

- **Photos.** **Import into Gallery** adds photos to your permanent gallery (on a phone it offers the camera or your library). A photo you already imported is recognized rather than added twice. **Add Photo** opens the gallery; pick one and **Add to Canvas**. A job can hold several photos, each with its own scale and groups. A photo a saved job uses cannot be deleted from the gallery, and the page names the job that needs it.
- **Scale.** Choose **Inches** or **Millimeters**, then with **Set Scale** click both ends of a length you know: a grid square, a ring, a ruler in the photo. Enter that length in **Scale Reference Distance**; if it is blank when the line is drawn, the page asks for it right there. The readout says how many pixels per inch the photo resolves. You can change the length later and every mark on that photo is re-measured. A job is measured in one unit; if two photos disagree, one click converts one of them exactly.
- **Groups.** One group is the shots fired at one point of aim. **Set POA** and click the aim point, then **Mark POI** and click each hole. **New Group** (the **+** beside the group picker) starts the next. Each group's card shows its shots, MPI from Aim, the **Correction** in MOA or MIL (*"0.43 MOA DOWN"*), Group Size, Mean Radius and Width × Height, updated as you mark. **Copy POA** reuses another group's aim point.
- **Fixing mistakes.** **Adjust** selects the nearest mark: drag it, nudge it with the arrow keys, **Move to Group** or **Delete Shot**. **Undo** and **Redo** (Ctrl+Z, Ctrl+Shift+Z) step back through everything, up to 200 steps, including deleting a whole group.
- **Seeing the hole.** The mouse wheel or a pinch zooms about the pointer; drag to pan; **Fit** shows the whole photo. **Loupe** shows a magnified view while you hover. **Expand** fills the screen with the photo. **Show Bullet Size** draws a ring the size of your bullet around the pointer, so you can centre it on the hole.
- **On a phone.** Touch near the hole, slide the crosshair onto it and lift: the mark goes where the crosshair is, 64 px above your finger, so your finger never hides the hole. A quick flick scrolls instead of marking, and two fingers pan and zoom. The tools and **Save** sit in a bar at the bottom of the screen.
- **Keyboard.** With the photo focused, **S**, **A**, **M** and **V** pick the tools, the arrows move a crosshair and **Enter** places a mark. **?** lists every key.
- **Job.** Set the **Target Distance** in yards or meters (needed for MOA, MIL and every trajectory tool) and an optional **Nickname**; without one the job is named by its photos and distance. **Ready to save** lists anything still missing, and each item is a button that takes you to its fix. **Save Marking Job** (or **Update Marking Job**) says what it will write. **Previous Marking Jobs** opens and deletes your saved jobs; a job a Session uses cannot be deleted until you remove it from that Session. A Session takes its distance from the job, so when you change the distance of a job that Sessions use, the Job section names them and saving updates them too. **New Marking Job** starts fresh.

Unsaved marking survives a reload of the tab and is offered back to you, and the page asks before anything discards it.

**Why it matters:** the impact coordinates you capture here become Mean Radius, group size, MPI offset, stringing diagnostics and the dispersion seed for the hit-probability simulator. A careful scale and honest impact marks are the difference between a real measurement and garbage-in.

> **Velocity is not entered on this page.** Muzzle velocities are attached in **Chronos**, the next section, from a chronograph file or typed by hand. Re-saving a job never touches them: each shot keeps its reading. If you delete a shot that holds a chronograph reading, the reading goes back to its string in Chronos rather than being lost.

---

## 7. Chronos

Chronos is where **muzzle velocity meets point of impact.** It imports chronograph files, stores them as reusable sessions and exports them for spreadsheets. Its key job is to **pair each velocity reading with the shot that made it.**

### Import
Drag-and-drop or browse for one or more files. Formats are auto-detected: **Garmin FIT** (binary and including `.fit` exported from a Xero), **LabRadar CSV**, **MagnetoSpeed CSV**, **Garmin Xero CSV** and a **Generic CSV** fallback for any file with a numeric velocity column. After parsing you get an **Avg / SD V / ES V / Min / Max** summary and a per-shot velocity log. Parse problems show inline warnings.

- **One file** loads into the editor. Name it and **Save** it as a reusable Chrono Session.
- **Many files at once** are each imported straight into your library and auto-named. That is ideal for a full day's worth of strings you'll pair up later.
- **Deleting** a saved string from the Saved Sessions list removes its readings with it. An impact paired with one of its readings keeps its velocity and loses only the link to the string. A string a Session uses cannot be deleted until you remove it from that Session.

**Why import in bulk:** chrono data is independent of your targets. You can dump every string from a range trip now and associate them to impacts whenever it's convenient. You can even match one string against impacts spread across several marking sessions.

### Load Marking Data
Select **one or more Marked Targets** with the checkboxes. Their points of impact are **pooled into a single list**. So a single chrono string can be paired against impacts from multiple sessions. Each impact row has a velocity field you can also **type into by hand**. This is the new home for manual velocity entry.

### Associate & Apply Velocities
This is the heart of the tab and it works in **any order**:
1. Click **any chrono shot** in the import list. It highlights blue.
2. Click **any point of impact** from any loaded marking session to pair the two. Order doesn't matter and the chrono and impact lists need not line up.
3. Repeat for each shot. There is no automatic matching on purpose: foulers and sighters at the start of a string are never marked, so pairing the Nth reading with the Nth impact would shift every pair.
4. Review the pairings and click **Apply & Save to Database** to write each measured velocity onto its shot. **Unlink** any single pair or **Clear All** to start over.

### A reading that stands out
Every reading counts in every statistic the app shows. When one sits far from the rest, the string's summary names it and its row reads **stands out**. About 1 clean string in 20 shows one by chance, so a flag alone is not a reason to drop a reading. If you know the chronograph misread it, click **Set aside** on its row: the reading is kept, struck through and left out of every velocity statistic in the app, and **Restore** counts it again. Do not set a reading aside because it looks bad. A reading that is merely far from the rest is usually the edge of the load's normal spread.

**Why this design:** real chronograph strings and real target impacts rarely arrive in the same tidy order. You might shoot two groups, chrono one and lose a reading. Free-form cross-session pairing lets you reconstruct the truth instead of forcing a false 1:1 assumption. Those velocities then power vertical-stringing analysis, velocity SD and the firearm velocity offset.

### Export
Load a session and download it as **CSV**, **TSV** for pasting straight into Excel or Sheets, or **JSON** which includes computed stats, any impact links and which readings you set aside. **Copy to Clipboard** gives you a tab-separated table.

---

## 8. Sessions

A **Session** ties everything together into one analyzable record: a **Marked Target** plus the **Firearm**, the **Load** and the **environmental conditions** of temperature, pressure type and altitude. **Round Temperature (°F)** is optional: the ammunition's own temperature when fired, read from a logger kept with the rounds. Powder burns at its own temperature, not the air's, and a box in the sun can run well above the air, so where you record it Varytita uses it in place of the air for velocity against temperature. **Lot Numbers** are optional text: the powder, primer, bullet and brass lots printed on the boxes the rounds came from. A new session takes them from its load's last session that recorded any and says so, until you type one; change any that came from a new lot. Nothing computes with them. Velocity Against History on the Analysis page names a lot new to the sessions it judges against, and the text report lists them. Selecting a firearm filters the load list to matching cartridges. Give it a name or accept the auto-generated one and then click **Create Session**.

**Why the Session is the unit of analysis:** dispersion and trajectory both depend on conditions and equipment rather than only on where the holes landed. Bundling the target with the exact rifle, load and atmosphere makes the record reproducible. It also lets Analysis and the simulators pull correct inputs automatically. You can edit, delete and **export individual sessions as JSON**. You can also **import** sessions others have shared. That is a clean way to back up or exchange a single load's history.

**Work-Up.** A charge work-up is recorded the usual way: one session per charge, each with its own load and its own chronograph string (**Duplicate** copies a session into the form for the next rung). Edit any of them and a **Work-Up** panel opens above the saved sessions. It gathers this rifle's sessions whose loads differ only in charge (the same cartridge, bullet, powder, primer, brass and COAL) and lists them lowest first. Nothing is typed twice: each rung reads its own string.
- A chart above the table draws each rung's average against its charge, with a whisker up to its fastest shot, Ignition's prediction as a blue line in its p10–p90 band, and the two stops as red dashes. The first rung that meets a stop is amber, the rungs above it grey, and the session you are editing the larger dot.
- Each rung shows its charge, readings, average, SD and fastest shot, and Ignition's predicted velocity for that charge in this barrel with its p10–p90 band, and the difference. A steady difference is this barrel; a rung that breaks from it is worth a look.
- **Published Maximum.** Where the published-load library has a maximum for this cartridge, bullet and powder, the panel sets two stops: the book maximum charge, and a **velocity stop**, the book's velocity at that maximum less **Velocity Lost per Inch** (30 by default) for each inch this rifle is shorter than the test barrel. A longer barrel gets no credit. With several sources it takes the lowest of each; pick one source to use only its figures. The per-inch figure is rough: published barrel tests lose 17 to 43 fps per inch from one cartridge to another, so set it from your own barrel if you know it.
- **The gain test.** From the fourth rung on, a rung whose average sits above the straight line through the rungs below it by more than that line's 97.5% prediction limit is flagged. It needs three readings on each rung: at one shot a rung it catches a real 40 fps jump only 6 times in 10. On a ladder with nothing wrong it flags about 1 ladder in 8 somewhere, so read a flag as a reason to look, not proof.
- The first rung that meets the charge stop, the velocity stop (any one shot) or the gain test is shaded and named, and the rungs above it are greyed. Pressure signs and anything you cannot explain are stops too, and velocity readings cannot show them.
- A session whose recipe was fired at one charge only shows no panel.

**Contribute.** The **Contribute…** link at the top of the saved-session list opens a page that packages complete sessions for submission back to the project. A package carries the load, components, conditions and chronograph velocities. So the internal-ballistics model can be refit against more real-world data. It checks each session first and tells you exactly what is missing from the ones that aren't eligible. Submission is optional and can be anonymous.

---

## 9. Analysis

Analysis is where small groups become a real measurement. Choose **Sessions** or **Queues** at the top of the page. Tick the sessions to compare and the results appear as you tick. There is no button to press. Each session takes a color and a shape, and the same mark shows beside it in the list, on its result card and on the composite plot. It keeps them until you untick it, so ticking or unticking another session never recolors the rest. **Filters** narrow the list by firearm, cartridge, bullet or powder. Each filter lists only what the sessions left by the others hold. The search box matches any of those, a session's id or its nickname. A session with no marked shots cannot be ticked and says so.

**Queues** build a dataset from single shots in any sessions. Use one to combine ladder rungs or to leave out a shot you know went wrong. Make a queue under **Queues**. Then under **Add Shots** choose a session and tick shots or whole groups. Every queue that holds shots is one result. Shots from different distances are scaled to 100 yards (100 m for a target measured in millimeters) so their angles compare. A queue that mixes sessions with and without a target distance is not analyzed, because the two cannot be scaled to one another. The page names the session to fix. Queues are part of your backup, so they move between devices with the rest of your data.

**Reading the results.** Each result is a card, ranked by the upper end of its Mean Radius 95% interval. The card shows four numbers: **Mean Radius**, **Group Size (ES)**, **Velocity SD** and **Velocity vs Height**. The **MOA / MIL** switch sets the angular unit everywhere on the page, and the size on paper sits beside each angle. **Show Details** opens where the group prints (**MPI from Aim**), SD H and SD V with a stringing flag, both normality tests, **Velocity Against History** for a session with velocities, the star rating breakdown and any note the numbers need, such as a unit conversion, a queue's scaling, a queue that mixes loads or a velocity reading that stands out from the rest. A session without a target distance has no angles, ranks after those that do and says so. A session the page cannot analyze is named at the top of the results with the reason and where to fix it.

**Compare Loads.** With two or more results, a card under the ranking tests each load against the leader. For group size the smallest Mean Radius leads, and each other load is tested by the ratio of the two Mean Radii, read on the same statistics as their 95% intervals, so loads shot in different group sizes compare. For velocity the smallest SD leads, and an F-test compares the two variances over every reading. A load is **Worse** when its p-value is below 0.05 shared among the pairs of loads shown: 0.016 for 3 loads, 0.0083 for 4 and 0.005 for 5. Otherwise it is **Tied with the leader**, which means these shots cannot tell the two apart. Show only the loads you meant to compare, because every extra result tightens the line. When some results have a target distance and some do not, the ones without are left out of the group comparison and the card says so. The comparison is in the Text Report too.

**Shots Needed.** Decide the shot count before you shoot. Enter the **Difference to Find** (1.5 means one load groups, or strings, 1.5 times as wide as the other), your **Group Size** and how many **Loads** you will compare, and it gives the shots each load needs for Compare Loads to find a real difference of that size 8 times in 10. In 5-shot groups, two loads 1.5 to 1 apart need 35 shots each for group size and 50 readings each for velocity SD; 1.25 to 1 needs 110 and 160. Fewer, larger groups need a few shots less. More loads need more, because the line each must pass is stricter. When Compare Loads calls two loads tied, its **Shots Needed** link opens the planner.

**Against a Goal.** Set a **Goal Mean Radius** (MOA or MIL) and a **Goal Velocity SD** (fps), either or both, from what you need to hit at your distance. Each result is then judged by its 90% range: **Met** when the upper end is inside the goal, **Missed** when even the lower end is above it, and **Not yet** when the range straddles the goal and these shots have not decided it. A result without a target distance cannot be judged on Mean Radius, and one without velocities cannot be judged on SD; each says so. The goal is kept in this browser, the section opens by itself once one is set, and the Text Report carries the verdicts.

**The composite plot** draws every result's shots about their own group centers in one frame. When every result has a target distance it is drawn in MOA or MIL, so groups shot at different distances compare. Otherwise it is drawn at size on paper and a note says which session has no distance. Point at a shot or tap it for its number and velocity. Point at a POA for where that group prints.

> **Why composite?** A single 5-shot group is mostly luck. Ten 5-shot groups aligned by their centers give you a 50-shot picture of what the rifle and load actually do. Mean Radius on 50 shots is worth far more than extreme spread on 5.

**Export:** **Save Image** downloads the ranking and the composite plot as one high-resolution image, in the angular unit on screen. **Copy Report** copies the full text report: the ranking, every result's numbers, its conditions and notes, and any session or queue that was not analyzed and why. **Text Report** shows the same text on the page.

### Dispersion: how tight is it really?
- **Mean Radius (MR)** is the average distance of every shot from the group center. It is the preferred precision metric because it uses *every* shot rather than just the two widest. Reported in inches and mm. Also in **MOA** and MIL when a target distance is set. **Analysis reports the Mean Radius the load would group at.** A group's own center is worked out from its shots, so it sits closer to them than the load's true center does and the distances measured from it read small: 18% small for 3-shot groups, 10% for 5-shot groups and 5% for 10. Analysis corrects each shot for that. A load shot as small groups therefore no longer outranks one shot as large groups for that reason alone. **Show Details** also gives the value as measured, which is what Marking's group cards show.
- **95% Confidence Interval (CI)** is the range the *true* Mean Radius falls in 95 times in 100. A wide CI is the app telling you "you haven't shot enough to be sure yet." Every shot narrows it and every group uses up a little, because the group's center is taken from its own shots. So 20 shots in one group pin the Mean Radius more closely than 20 shots in ten groups. A group that strings gets a wider interval too. Rankings are sorted by the CI **upper bound**, so a lucky small sample can't jump the queue.
- **ES POI (Group Size)** and **ES POI H/V** are classic extreme spread and its horizontal and vertical split. They are quick to read but outlier-sensitive. Use them to *flag* a gross problem such as a baffle strike or loose screws rather than to judge precision.
- **SD POI H / V** is the standard deviation of impacts horizontally versus vertically. It is a diagnostic. If vertical is much larger than horizontal you have **vertical stringing**. So suspect velocity spread, firing pin or barrel contact. Horizontal much larger than vertical points at **wind, bipod or trigger push**. The page calls stringing only when the difference is more than chance gives the shots, so a round group is called strung 1 time in 20. A fixed rule of one axis 1.5 times the other would call half of all round 5-shot groups strung.
- **MPI Offset** is where the group's center prints relative to aim. It tells you *where* it hits rather than *how tightly*.

### Velocity: how consistent is the ammo?
- **SD V (velocity standard deviation)** is the primary measure of internal-ballistic consistency. It is reported with its own confidence interval. Lower is better. It's what drives vertical drop at distance.
- **ES V (velocity extreme spread)** is a red-flag indicator. A sudden jump of 60+ fps points at something mechanical such as a blown primer, erratic ignition or inconsistent neck tension.
- **Velocity vs Height** asks whether this target shows velocity moving its shots up and down. Velocity and height are each measured from their own group's average and their correlation is tested at the shot count you have. **Slow shots are the low ones** means velocity is moving your vertical, so a lower SD will tighten it. **No link these shots can show** means a lower SD is not shown to tighten this group. For a single session the details also fly the load to the target distance and say how much of the vertical the string's SD can account for. At 100 yards that is almost none.
- **Velocity Against History** asks whether a session's average velocity fits this rifle's other sessions of the same load. Their averages are fitted on temperature, a line when they span 10 °F or more and their mean otherwise, and the session is predicted at its own temperature with a band around it. An unchanged load lands inside the band 95 times in 100. The band is wider when the history is short, when its sessions vary from day to day more than their shot counts explain, and when this session has few readings. **Within its history** means nothing in the velocity says the load or the rifle changed. **N fps faster** or **slower than its history** means something did: look at the powder or primer lot, the barrel, the chronograph and its setup, and the conditions before using that velocity for dope. It needs 4 other sessions of the load in the rifle, each with two or more velocities and a temperature; with fewer it says what is missing. It uses the rounds' own temperature when this session and 4 others recorded it, and the air's otherwise, never both at once. Other sessions that span under 10 °F carry only to a session within 5 °F of their mean. Where the sessions record **Lot Numbers**, a lot this session fired that none of the others did is named under the verdict, so a new jug of powder that moved the velocity shows as the likely cause. This is how to check a new lot: fire it in a session of the same load and rifle, record its lot, and read this check.

### Reliability Rating
A single **0.5–5.0 star** grade that answers "how much should I trust this result?" without needing the statistics. It starts from how closely the Mean Radius is known: the upper end of its 95% interval. That is where the number of shots counts, once. One group of 50 shots earns 5.0 stars, 30 shots 4.5, 20 shots 3.5, 10 shots about 2.5 and 5 shots 1.5. The same shots spread across many small groups earn less. Then each check the data fails takes a star away and says what to look at:

- **Flyer Check.** One shot sits further from its group's center than the other shots make likely. Each shot is measured against the spread of all the others, so a flyer cannot hide by widening the spread it is judged against. Look at that hole: a flyer, a pulled shot or a hole marked in the wrong place.
- **Group Consistency.** One group is much wider or much tighter than the rest. Pooling groups assumes they show the same rifle and load, so something may have changed between them: the barrel's heat, the wind, the position or the rest.

Each check flags about 1 clean target in 20 by chance. A failed check is also said on the result's card itself. **Low stars with no warning mean shoot more. Low stars with a warning mean look at the target first.** A five-star tight group is a conclusion. A two-star tight group is a hint that needs more rounds.

### The long-range metric: "most precise" is not "best out to distance"
**Manteis** on Heurisko computes a **95% Hit Limit** for each session. Analysis does not. That is the farthest range at which the load holds **95% or better hits on a circle of the run's Target Size, in the first crosswind you typed.** The defaults are 2 MOA and 5 mph. It reads "<" and the first distance when the load is under 95% there, and "≥" and the last distance when it holds through the whole band. The group is deliberately *conservative*: each axis of it is widened to the Mean Radius 95% upper bound. Nothing else is. The velocity SD flies at its point value. BC, range, cant and zero carry no error at all. The wind does: each shot is held for a wind call that misses by a 1σ error, 1.25 mph at every crosswind at the defaults. Raise **Wind Call Error Growth** and that error grows with the wind ([15.5](#155-manteis-comparing-loads-across-sessions)). It's *anisotropic* since the vertical and horizontal spread of the group are measured and flown separately. It's honest about missing data: a velocity SD not measured over at least 3 readings is **imputed at 15 fps and marked** `*`. Alongside it each session's card gives:

- **Miss Budget.** Of the misses at the fall-off distance, the share that were mostly vertical (velocity-driven) and the share that were mostly horizontal (wind-driven). This tells you *what to fix*.
- **Transonic Limit (Mach 1.2).** The range where the bullet slows to Mach 1.2, searched out to the last distance flown. Past that it reads ">" and the last distance. *It* caps your effective range rather than your grouping whenever it comes before the dispersion limit. **Binding Constraint** says which came first.
- **Every crosswind you typed.** Each cell of the matrix holds p(hit) at every crosswind. The 95% Hit Limit is for the first one, the primary wind, only. At the defaults the crosswinds differ by a point or two, because the call error is the same at every wind. Raise **Wind Call Error Growth** and a stronger crosswind costs hits: at 10% p(hit) at 1000 yd on a typical 6.5 Creedmoor match load falls from about 67% at 5 mph to about 51% at 15 mph. At 0% all three read about 69%.

**Why the two disagree:** Analysis ranks by pure dispersion for the best *average* group. Manteis does not rank. At each distance it marks a session **TOP** only where it beats every other one by more than the 95% Monte Carlo margin for its 600 runs, and marks the leaders **TIE** where it cannot separate them. A load that prints the tiniest 100-yard group can be **beaten at 800 yards** by a slightly larger-grouping load with a higher BC, tighter velocity SD or more supersonic margin. "Most precise up close" and "hits farthest" are different questions and this is the tool that separates them.

---
## 10. Heurisko: the Ballistics & Simulation Suite

"Heurisko" is Greek for *I find*. It is the app's scientific bench. There are **five sub-tabs** in this order and each answers a different forward-looking question. All of them **auto-fill from your firearms, loads and sessions** so you're modeling your real equipment rather than made-up numbers.

**Ignition is internal ballistics: the pressure and velocity engine.** Simulates propellant combustion and bullet acceleration down the bore. It produces pressure-time curves, burn percentage and predicted muzzle velocity, with a p10–p90 band under velocity and pressure. Its **safety audits** are the standout feature: peak pressure against the SAAMI ceiling (C.I.P.'s where SAAMI has none, or one you enter), case-fill flags for low fill and compression, a one-caliber seating-depth check, COAL against the cartridge's maximum overall length and the bullet's spin rate. This is also where you derive the **per-firearm velocity offset**. *Why:* it's the closest thing to a pressure test you can run at your bench and it fails loud rather than guessing.

**Varytita: drop chart, DOPE card and field solution.** Charts elevation, wind and velocity from the RK4 trajectory engine, with truing, cant, look angle and a **Maximum Point Blank Range (MPBR)** solver. It has four tiers. Quick and Advanced draw the chart and its table. DOPE adds pocket range cards with wind brackets, as a PNG or CSV. Field replaces the chart with a list of targets solved in large type, with lead for movers and a reticle view. *Why:* a field-ready come-up card built from your exact load and conditions.

**Kyvos: hit probability.** Seeds the trajectory engine with your dispersion and the *uncertainty* in every input. It then fires thousands of virtual shots to produce P(Hit) against range curves and an impact heat map on a target you define. *Why:* turns "it groups well" into "it hits a 10-inch plate 9 times out of 10 at 500 yards."

**Strovilos: gyroscopic stability (Sg).** Uses the Refined Miller Twist Rule corrected for velocity and air density to compute your stability factor. **Sg ≥ 1.5** is Stable. **1.1 to 1.5** is Marginal: yaw costs up to 10–15% of BC and opens groups. **Below 1.1** is Insufficient. From 1.0 to 1.1 the bullet is still gyroscopically stable but has no margin. **Below 1.0** it will not stabilize, and it tumbles and keyholes. It handles plastic-tipped bullets with Courtney and Miller's formula, which counts the tip in the bullet's shape but not in its mass. Varytita, Kyvos, Manteis and the Sight-In Target fly the same formula for spin drift and aerodynamic jump. *Why:* tells you before you buy whether a bullet will even stabilize out of your twist.

**Manteis: empirical hit probability.** The only tool that compares **many saved sessions at once**. It builds a hit-percentage matrix across a distance band and a set of crosswinds. It uses each session's *measured* group dispersion and velocity consistency. At each distance it marks the leader where the run can separate it and a tie where it cannot. *Why:* answers "which of my loads should I actually take to a 700-yard match?" using data you already shot.

> **Four tools start the same way.** Ignition, Varytita, Kyvos and Strovilos open with the same chain. Pick a **Session** to fill what it recorded or work down **Firearm → Caliber → Cartridge → Bullet Manufacturer → Bullet Name**. Caliber narrows the Cartridge, Bullet Manufacturer and Bullet Name lists. Cartridge narrows nothing. So **choosing a cartridge never picks a bullet for you.** Manteis works on a list of your saved sessions instead. Field-by-field detail for all five tools is in [The Advanced Tool Guide](#15-the-advanced-tool-guide-heurisko-field-by-field).

---

## 11. Targets

Two tools for printing targets *before* the range trip. Both print at the sheet's own size, so print at **100%** (Actual Size), never "fit to page".

**Target Design** builds bullseye targets. Start by choosing a sheet from the tiles: Letter, Legal, A4, A3, 12 × 12 in, or **4 × 4 and 4 × 6 in label stock** for 4-inch thermal label printers. Nothing is drawn until you do. Each sheet loads its own premade target, ready to print: one 6 in bullseye on Letter, Legal and A4, one 10 in on A3 and 12 × 12, and black-and-white label targets (two 2.5 in bullseyes on a 4 × 6, one 3 in on a 4 × 4). Your saved presets for that sheet sit beside it as thumbnails. Change anything and **Save Preset** updates it or saves a new one; the preview stays beside the controls as you work.

- **Label**: fill it from a saved firearm and load, pick the corner, set the text size. Label text you typed is kept when you change the sheet.
- **Target Shape**: seven shapes, diameter and ring count. **Layout** says how many targets fit and offers fixes when they would overlap.
- **Colors**: each color opens a palette of named print colors, the colors already in your presets, and a custom picker with a hex code. Color schemes set the center and rings in one click, and a legend shows which ring each color paints.
- **Label printers print black only.** On a label sheet the palette opens in *Black Only* mode, a notice names any color that would print as a dot pattern or not at all and offers to fix it, and *Label Printer View* shows roughly what the printer will produce.
- Changing the sheet or loading a preset over your edits can be undone with **Undo**.

**Sight-In Target** is for zeroing at a distance you cannot shoot. Enter the range you can shoot and the zero you want, choose your rifle and load (or type the ballistic profile), and the answer appears at once: how far above or below the aim mark the group must land, in inches, MOA, mils and turret clicks. The sheet draws an aim mark and an impact mark that exact distance apart, with a 4 in check bar to measure before you shoot. Sight height is required and never assumed, because at short range it moves the answer by more than an inch. Bullet Length, Tip Length and Twist Rate are optional and refine spin drift; **Twist Direction** sets which way it goes, filled from the rifle and carried in Varytita's link. A tip follows Courtney and Miller's formula, as in Strovilos, and a tip the bullet fills is tagged "estimated" where its length is an estimate. If the offset does not fit the sheet, it says so and offers the sheets it fits on. **From an MPBR chart:** Varytita's **Make a Sight-In Target** opens this tool already filled in with the rifle, bullet, muzzle velocity, BC, bullet length and tip, sight height and air the chart flew, and the chart's far zero as the zero you want. Pick the range you can shoot and print.

On a phone both tools keep their result and the **Print** button in a bar at the bottom of the screen.

**Why it matters:** a target with a known grid or ring size gives you a precise printed reference distance. That makes scale-setting in Marking fast and accurate. Photos of your *shot* targets are uploaded and scaled on the **Marking** page rather than here.

---

## 12. Burn Chart

The page has two tabs. **Burn Speed** is the burn chart this section describes. **Optimizer** takes one cartridge, bullet and barrel, loads every powder in it with the Ignition engine and ranks the powders by up to three things you choose. By default that is the highest muzzle velocity, then the least velocity change per 0.1 gr of powder, then the lowest muzzle pressure. A small change per 0.1 gr means a weighing error moves the velocity least. Every number on the Optimizer is the model's, not load data: use it to choose powders to look up, then work up from the manufacturer's published start load.

**Burn Speed.** A **powder burn chart**: every rifle powder in the library, one row each, from **fastest at the top** to **slowest at the bottom**. Type a powder's name in **Find a powder** and the chart jumps to it and highlights it, so you can see at a glance what sits above (faster) and below (slower). That is the quick check a burn chart is for: making sure the jug in your hand is roughly the speed you meant to buy.

**Where the order comes from.** A powder's place comes from **how much of it the published manuals load to reach the maximum pressure**: a slower powder needs more of itself to get there. The powders are compared inside tables where one manual loaded several of them with the same cartridge, bullet and rifle, so those drop out, and several thousand such tables are combined. The spacing means something too: two dots close together take nearly the same charge to reach the same pressure. This order agrees closely with the makers' own printed charts.

**Choose a cartridge** and the Ignition engine loads every powder in it itself — not the published loads, so one odd experiment in a manual cannot put a pistol powder on a rifle chart. It uses three typical bullets for the cartridge (light, middle and heavy), finds the charge that reaches the SAAMI pressure limit (C.I.P.'s where SAAMI has none) or fills the case to 110% if that comes first, and a start charge 10% lighter. The bullets and barrel it used are printed under the cartridge box. Each dot becomes a **bar** spanning how long those loads take to burn 90% of the powder; the bright line is the median of those loads, and the rows are re-sorted by it, fastest at the top, so the order is the order *in that cartridge*.

**Too fast and too slow.** A powder that reaches the pressure limit with the case less than 80% full is **too fast** for the cartridge — N110 in 308 Winchester reaches it at about 61%. One where a case filled to 110% builds less than 80% of the limit (the pressure of a typical start load), or that is still short of 90% burned at the muzzle, is **too slow**. Both are listed under the chart rather than drawn, and searching for one says which it is.

**Why the bars matter.** Where bars overlap, the powders do not keep a strict faster-and-slower order in that cartridge. A powder that moves up or down against the general view is that cartridge disagreeing with the general chart.

### Worked example: 308 Winchester

Say you own a jug of **Hodgdon Varget** and a 308 Winchester, and you want to know where Varget sits and what burns like it. The order below is from the current build and can move a little with each update to the library and the model.

**Step 1. Find the powder in the general chart.** Leave **Cartridge** on *All powders (general burn order)* and type `Varget` in **Find a powder**. The chart scrolls to Varget and highlights it. Its neighbours are powders a 308 shooter already knows: Ramshot TAC, IMR 4064 and Vihtavuori N140 just ahead of it, Reload Swiss RS50 and RS52 and Alliant Power Pro Varmint just behind, with Hodgdon H4895 a little faster and Hodgdon CFE 223 a little slower. This view comes from every cartridge the manuals print and says nothing yet about 308 in particular.

**Step 2. Choose 308 Winchester.** Pick it in the **Cartridge** box. The line under the box says exactly what the engine loaded:

> Loaded by the engine with 125 gr Sierra Pro-Hunter Spitzer, 168 gr Sierra MatchKing HPBT and 175 gr Sierra MatchKing HPBT in a 24.0 in barrel, up to the SAAMI maximum of 62,000 psi.

For every powder the engine worked six loads: each of those three bullets at a **max charge** (the charge that reaches 62,000 psi, or a case filled to 110% if that comes first) and a **start charge** 10% lighter. The column header now reads *Useful in 308 Winchester*, and the chart shrinks from 145 rows to **90**. The engine ruled out 51 of the other 55 for this cartridge (Step 5). Of the last 4, three are withheld while their fitted burn rate is reviewed and one, Reload Swiss RS24, has no fitted model yet (see the end of this walkthrough).

**Step 3. Read the bars.** Every row is now a bar spanning the burn times of that powder's useful loads, with the bright line at their median. The rows are re-sorted by that median. The fastest bar end in 308 Winchester belongs to Hodgdon CFE BLK and the slowest to Norma URP. A few familiar powders, fastest first: IMR 3031, Hodgdon CFE 223, Hodgdon H4895, Alliant Reloder 7, Hodgdon Varget, IMR 4064, Alliant Reloder 15, Hodgdon H4350 and, near the bottom, Alliant Reloder 19.

Varget and H4895 have almost the same bar, so in 308 Winchester the engine does not put one strictly ahead of the other — which is where the load manuals put them too. IMR 4064, Hodgdon Benchmark and IMR 3031 overlap them closely as well.

**Step 4. Look for powders that moved.** In the general chart Reloder 7 is well ahead of CFE 223. In 308 Winchester the order flips and CFE 223 comes first. That is the cartridge disagreeing with the general chart, and it is the reason to choose one.

**Step 5. Check the two lists under the chart.**

- **Too fast for 308 Winchester** (12): Vihtavuori N110, Hodgdon H110, Alliant 2400, Hodgdon Lil'Gun, Norma R123 and the other pistol and small-case powders. Each reaches 62,000 psi with the case less than 80% full.
- **Too slow for 308 Winchester** (39): Hodgdon H4831, H1000 and Retumbo, Alliant Reloder 22 through 33, Hodgdon US 869, Ramshot LRT, Vihtavuori N568, Reload Swiss RS76 and RS80 and the other magnum and 50 BMG powders. With these three bullets Accurate 4350, Ramshot Hunter and Reload Swiss RS62 land here too. A case filled to 110% builds less than 80% of 62,000 psi with them, or they are still short of 90% burned at the muzzle.

Search for one of these and the page says why it has no row. Typing `N110` answers *"Vihtavuori N110 is too fast for 308 Winchester: it reaches the pressure limit with the case less than 80% full."* Typing `H1000` answers that it is too slow.

**What you take away.** In 308 Winchester, Varget sits in the middle of the useful range, with H4895, IMR 4064, Benchmark and IMR 3031 burning at nearly the same rate. Faster lie ball powders such as CFE 223 and Ramshot TAC; slower lie Reloder 15, H4350 and, near the bottom, IMR 4350 and Reloder 17. **That tells you which manual pages to open. It does not give you a charge** — every powder in that neighbourhood still needs its own published start load.

> **A burn chart is a guide, not load data.** Burn order shifts with cartridge, bullet, pressure, temperature and lot. The general order comes from the manuals' own loads; a cartridge's order comes from the Ignition engine and will disagree with a maker's chart in places, and where it does, trust the maker. Never substitute one powder for another because they sit close together. **Always consult the powder manufacturer's published load data before developing a load.**

The chart holds rifle powders and bottleneck rifle cartridges only; the library has no pistol or shotgun powders and no straight-wall cases. Three powders are in the general view but left out of the cartridge views, and searching for one there says so: Norma 217 and Hodgdon Trail Boss, whose fits are under review, and IMR SR-4759, which the Ignition engine has no fit for (most of its published loads are reduced loads, filling the case less than the fit covers, and the five left are too few to fit it). Reload Swiss RS24 is in the general view only for the same reason: too few of its published loads are in bottleneck rifle cartridges to fit it, so no cartridge view can load it, and searching for it there says so. The chart is rebuilt with every update to the library and the model, and is available offline once the app has cached it. A cartridge's bars are built to SAAMI's pressure limit where SAAMI sets one and to C.I.P.'s otherwise, so in 8x57 IS and 6.5x55 Swedish, where SAAMI's limit is the lower, more powders are marked too fast than a European chart would show.

---

## 13. Components

The foundation library beneath everything else. Most of it is the component library, which ships with the app and cannot be changed or deleted on your device. So you usually only add what's missing or custom.

Each tab is laid out the same way. Every editor and list puts the fields in one order: the name, then the maker, then what the record belongs to (caliber, cartridge, primer pocket, grain type), then its figures. Brass has no name, so its cartridge comes first. A field has the same label in the editor, the list's column and the search chips, and a value the record doesn't hold shows as a dash. The editor sits beside the list on a wide screen and stays in view as you scroll. On a phone it folds away above the list and opens when you press **New** or edit a record. A form you are part-way through survives a look at another tab. Opening another record over unsaved changes asks first.

- **Search** finds records by any field. The chips under the box narrow a search to the fields you pick, and a term such as `gr:140` or `mfr:hornady` searches one field. Results come best match first.
- **All / Library / Mine** shows everything, only the shipped library, or only what you added and your copies of library records. Every row carries a badge saying which it is: **Library**, **My Copy** or **Mine**.
- **Save** checks the required fields first. If any are blank it names them all, and each name takes you to its field.
- **Delete** is offered on your own records only. It tells you what uses the record before you confirm: how many loads, firearms or other components name it. Anything that uses a deleted record shows it as missing. A library record has no Delete. Use **Mine** to see only your own.
- On a phone the list is cards rather than a table, with a **Sort By** control in place of the column headings.

| Sub-tab | What it stores |
|---|---|
| **Manufacturers** | Makers of bullets, powder, primers, brass, firearms, cartridges or ammo. A maker appears in a component's Manufacturer list only for the types it makes |
| **Diameters** | Caliber definitions such as `.308` and `.264`. Selected as **Caliber** everywhere in the app |
| **Cartridges** | Bottleneck rifle chamberings tied to a diameter, with SAAMI specs and both pressure limits: SAAMI in PSI and C.I.P. in bar. The two are different standards, not two units of one number. The library carries no straight-wall case. One of yours adds your own pressure ceiling |
| **Bullets** | Full profiles: weight, length, ogive, boat tail, tip (an estimated one amber with a tilde, as a modelled BC is), bearing surface, engraving pressure, G1/G7 BC and the drag curve |
| **Powders** | The burn model's inputs: heat of explosion, solid and bulk density, grain type, burn exponent and the burning-surface profile (surface peak gain Bp, and the fractions burnt at the surface peak Z1 and at sliver start Z2) |
| **Primers** | Primers by pocket size, with brisance energy |
| **Brass** | Cases with water capacity and primer data |

**Why it matters:** a wrong number here silently corrupts every load and simulation that references it. Optional fields improve simulation accuracy. The app fails loudly on truly missing data rather than guessing.

**What a powder's figures do.** The Ignition engine is fitted to every library powder, and the fit sets four of its figures: the energy, the burn exponent, Bp and Z1. The engine reads the densities, grain type and Z2 from the record. So on a copy of a library powder, changing those four changes nothing it reports, and the form shows the value the engine uses beside each. The table's **Burn Coefficient B (1/s)** column is the fit's burn rate for each powder, the same figure the Ignition page fills in. It is the burn figure that differs from one powder to the next. The burn exponent is one value for every fitted powder, 0.70, chosen because the loads cannot tell a per-powder value apart from B and the energy. The engine runs a powder only on a fit. A copy of a library powder runs on that powder's fit. A powder you make from scratch has none, and the engine will not run it.

**Editing a bullet's drag curve.** Every bullet row has an **Edit Drag Curve** button (the curve icon beside the pencil), and Varytita's **Edit curve →** link next to Drag Model opens the same editor. It shows the bullet's drag coefficient (Cd) at each of the library's 25 Mach points, as a chart beside the curve as it was opened, and as a table you can type into. **Scale** multiplies the whole curve, or only its supersonic, transonic or subsonic part. **Revert**, **Library curve** (on a copy), **G7 shape** and **G1 shape** start again from that curve. A bullet with no curve opens on the standard shape at its BC. The G7 BC is worked out from the curve the way every library BC is, so the number beside the bullet is the one it flies. A point may move from half to twice the curve it started from. Further than that is refused and the point is named. Saving a library bullet's curve makes your (CUST) copy like any other edit, labelled **curve edited by you**. Editing that bullet's dimensions later keeps your curve and warns you to check it. Screens that use the library bullet keep using it, so pick the copy there.

**A cartridge you make runs uncorrected.** The Ignition engine corrects its predictions cartridge by cartridge, from the published loads it was fitted on, and a cartridge you make from scratch, a wildcat, has no corrections of its own. The engine runs it uncorrected. Ignition's Data Quality tab says so under **Cartridge Corrections**, and the velocity and pressure bands widen by how far the fit's corrections spread across cartridges, about 3% on velocity and 8% on pressure. **Your Pressure Ceiling (PSI)** is the limit for a cartridge of yours: a wildcat's, or a lower one for your rifle. Ignition checks the run against it, labelled **Your ceiling**, and the Powder Optimizer loads to it, ahead of SAAMI or C.I.P.

**Editing a library record makes your own copy.** The library is the same on every device and never changes on yours. Open a library record, change it and press **Save as My Copy**. The app saves a new record with **(CUST)** on its name. Brass has no name, so its copy shows (CUST) in the lists. The library record stays as shipped. Your loads, sessions and firearms keep using whatever they used before. Pick the (CUST) copy for anything new. A copy keeps its link to the original, so the Ignition engine's fitted corrections for the original still apply to it. If you change something those corrections depend on, like case capacity, they were fitted to the original's value. Your copies travel in your backup file and a library update never touches them. Editing a copy changes it in place. Saving with nothing changed saves nothing. A copy of a record a later library drops, such as a 45-70 Government, stays yours and still works, but the Ignition engine no longer has fitted corrections for the original, so its predictions are the uncorrected engine's.

---

## 14. Custom Data & Backups

Everything of yours, backed up, moved between devices and reset. The component library is not on this page to change: it ships with the app.

- **Component Library** shows which release of the library this device holds, when it was installed here and how many records of each kind it has. It is read-only. The library updates when the app does, and the first launch after an update says so in a notice at the top of the page. Nothing on the device can change or delete a library record. Editing one on the Components page saves your own copy instead.
- **Back Up and Move** is your backup and your way of keeping two browsers in step, such as a desktop and a tablet. **Export Backup** writes one personal DB file (PDBF) holding your firearms, loads, targets, sessions, chronograph strings, Analysis queues, saved scenarios and your own components, copies included. The library is left out since every install has the one its app ships. On a phone or tablet it is two taps: **Prepare Backup** builds the file and a **Share Backup** button then opens the device's share sheet so the file can go straight to AirDrop, Nearby Share, Files or a cloud folder. The share sheet has to open directly from a tap. That is why the file is prepared first. The shared copy is named `.txt` because phone share sheets refuse `.json`. It is the same file and Import reads either name. On a desktop without a share sheet **Export Backup** downloads in one tap. **Import Backup** merges that file into the device. A backup from an older version of the app is refused and says so. Export it again from the current one. Every record carries the time it was last written. The newer copy wins. A record deleted on one device is deleted on the other when the file arrives. Records the device made itself are untouched. Images are rebuilt automatically. Export the tablet and import on the desktop and both end up the same. A library record in an older backup is left alone and the import says how many. Session files (EPSF) from the Sessions page are a different format and are imported there. They are your data too: importing one never changes the library.
- **Data Check** looks for rows two old bugs left behind: pieces of marking jobs whose delete failed partway, copies of paired impacts that re-saving a chronograph string used to make, which counted those shots twice in Analysis, and the readings a deleted chronograph string used to leave behind. **Check Data** only reads and says what it found. **Remove Leftovers** asks first, then removes exactly that: a leftover shot that holds a chronograph reading goes back to its string, a copy is deleted while the impact it copied keeps its velocity, and an impact still linked to a deleted string keeps its velocity and loses the dead link. Run it once after updating; a clean database reports nothing to remove.
- **Install Offline App** installs the PWA so the app launches from your home screen and runs fully offline, library included. On iPhone and iPad use Safari's Share → *Add to Home Screen*.
- **Delete All My Data** removes every record of yours from this device and leaves the library as shipped. The confirm lists what goes. It cannot be undone, so export a backup first if you may want any of it. The deletion is not carried to your other devices.

### Backups: keeping your data safe

> ⚠️ **Your data lives only in your browser. Clearing site data deletes it permanently. There is no recovery except a backup.**

**Back up:** **Back Up and Move → Export Backup** → save or share the `.json` somewhere safe such as cloud storage and an external drive.

**Restore:** **Back Up and Move → Import Backup** → choose your PDBF → merge. Newer copies win and deletions carry across. Firearm velocity offsets ride along automatically.

**Keep two devices in step:** export on one and import on the other, in either direction, as often as you like. Each merge reports what it added, replaced, kept and deleted.

**Back up after** every range session, after adding firearms or loads, and after saving a velocity offset. Installing the PWA also requests persistent storage. That guards against routine browser eviction.

---

## 15. The Advanced Tool Guide: Heurisko field by field

This section exists so you never have to guess what a box does. **Every input in every Heurisko tool is listed.** Each entry gives what it is in shooter's terms, where the app gets it, what happens to your answer, when you should override it and when overriding it will make your results worse. **That last one matters just as much as the rest.** On the pages, a field the tool cannot run without carries a yellow asterisk (*) beside its label; hover it to read "Required". Here such a field says "Required."

### How to read this section

Each field is written as:

> **Field name.** What it is. **Auto-fills from:** where the number comes from. **Raise it / lower it:** which way the result moves. **Change it when:** the legitimate reason. **Don't touch it when:** the trap.

Three rules apply everywhere and are not repeated for each field:

1. **Anything auto-filled is already your data.** A box filled by a Session, Firearm or Load holds a number from your library. Overriding it is a "what-if" rather than a correction. The exception is a library record that is genuinely wrong. Fix the *record* in that case rather than the simulator box.
2. **Nothing you type in Heurisko is saved back** to your firearms or loads. There are two exceptions in Ignition and you save each deliberately with its own button: the velocity offset, which goes on the firearm, and **Save to Loads Library**, which adds the form as a new load.
3. **Garbage in gives confident-looking garbage out.** Every box refuses a number outside the physical range it states and keeps the last good one. Inside that range these tools do not refuse a silly number. They model it faithfully. A 4000 fps muzzle velocity on a 175 gr bullet will produce a beautiful wrong DOPE card.

Two more things hold in every tool. A value a record filled carries a **From …** tag beside its label, naming the record. Type over it and the tag goes. And **a result describes the run that made it.** Change any input afterwards and a banner says the result is for the previous inputs until you press **RUN** again. A run that is refused shows the reason in place of the result.

### The selection chain: the same in four tools

Ignition, Varytita, Kyvos and Strovilos open with a **Selections** card. It exists to fill the physics for you. Manteis has none: its list of saved sessions is its selection ([15.5](#155-manteis-comparing-loads-across-sessions)).

**Session.** One of your saved range sessions. Selecting one fills what the session recorded: the firearm, the load's bullet and its dimensions, and the air of that day. Where the tool uses them it also fills the *measured* muzzle velocity and group dispersion. **A session replaces what was there.** A value it did not record is cleared rather than left over from the last selection, so it shows blank or flies at its default. A session that recorded no pressure leaves Pressure blank and does not impose the pressure type it stored. **This is the highest-fidelity way to start.** Everything downstream is then describing ammunition you actually fired. Clearing it back to "-- Choose Saved Session --" leaves the values in place for you to edit freely. So does picking any other selector afterwards: the session is deselected and its values stay.

The **muzzle velocity** a session fills is resolved the same way in every tool: its chronograph string first, then the velocities on its marked shots, then the Ignition engine's estimate for its load and firearm with the rifle's velocity offset applied. The field's tag says which. When there is none the field stays blank and says why.

**Firearm.** One of your saved rifles. Fills the twist rate and the cartridge, and where the tool uses them the sight height over bore (Varytita, Kyvos) or the barrel length (Ignition). A rifle with no twist on record clears a twist the last rifle filled. A firearm of another caliber clears the bullet. One in the same caliber keeps it. Clearing Firearm only deselects it.

**Caliber.** The bore size such as `.308` or `.264`. It narrows the Cartridge, Bullet Manufacturer and Bullet Name lists, which stay closed until a caliber is picked. Changing it clears a cartridge and a bullet of another caliber. In Ignition it also fills Bullet Diameter. Nothing else is calculated from it.

**Cartridge.** The chambering. In Ignition it fills case capacity, case length, the pressure ceiling, the nominal COAL, the bullet diameter and the primer pocket size. In the other tools it fills nothing. **It does not choose a bullet for you.** A cartridge is fired with hundreds of different bullets and the app will not guess which is yours. Another cartridge in the same caliber keeps the bullet you picked.

**Bullet Manufacturer → Bullet Name.** The projectile. Filling this is what populates weight and length, and where the tool uses them the diameter, BC and Drag Model, bearing surface or tip length. **This is the single most consequential selection in every tool** because bullet geometry drives stability, drag, seating depth and case fill all at once. A bullet with no BC on record leaves BC blank and marked missing rather than guessing one. Clearing or replacing the bullet clears what it filled, unless you have typed over a value since. Picking another manufacturer clears a bullet of the last one.

---
### 15.1 Ignition: internal ballistics

**What it answers:** what pressure will this charge make and how fast will the bullet leave? Everything here happens between the primer strike and the muzzle.

**The one safety rule.** The engine's powder parameters are fitted against laboratory pressure-transducer data. That is what makes the pressure comparison meaningful. **Never edit the propellant numbers to make predicted velocity match your chronograph.** Doing that does not correct the model. You have moved the pressure curve and quietly invalidated the audit that is supposed to keep you safe. The correct fix is the velocity offset in the **Data Quality** tab (below).

#### Selections specific to Ignition

Ignition needs the whole cartridge rather than just the bullet. So it adds four selectors to the standard chain. The standard ones behave a little differently here:

- A **session** fills the rifle and the session's load: the components, the charge, the COAL and the brass, as **Load from Library** does. What it does not name is cleared. A session with no load clears the bullet, powder and charge and takes the cartridge from the rifle. The banner under it gives the session's measured velocity, which the offset is trued from.
- A **firearm** fills the barrel length, the twist rate and the cartridge. It does not use the sight height.
- **Caliber** fills Bullet Diameter, and **Cartridge** fills the case figures listed under Cartridge Parameters. Any cartridge change clears the brass. A cartridge record missing one of those figures fills the rest and names what it lacks in an **Incomplete cartridge record** banner at the top of the page.

**Load from Library** *(optional)*. Pick a saved handload and it fills its cartridge, bullet, powder, brass and primer, the charge weight and the COAL. What the load does not name (a brass, a primer or a charge) is cleared rather than left from before. The list holds the loads for the selected firearm's cartridge, or every load with no firearm. **This is the fastest and most accurate way to start** because it models the exact recipe you wrote down rather than one you re-typed.

**Powder Manufacturer → Powder Name.** The propellant. **This is the most consequential selection in the tool.** It fills the fitted **Burn Coefficient B** from the Ignition calibration, and **Grain Type** and **Bulk Density** from the powder record. The fit also carries the powder's energy, burn exponent and burning-surface figures, which have no field here. Together that is the entire thermodynamic description. Two powders at the same charge weight can differ by 20,000 PSI. There is no generic "similar burn rate" substitute. Pick the powder you will actually throw. A powder the calibration has never seen is listed as "not calibrated" and cannot be simulated.

**Brass Manufacturer → Brass.** The case. The list needs a cartridge first. Fills **case capacity** and the **primer pocket size**. A brass with no capacity on record leaves the cartridge's figure. Case capacity is the volume the powder burns in. Cases of the same cartridge vary by a couple of grains of water between makers and that is a real pressure difference at the top of a load. **Change it when:** you switch headstamps. Treat a headstamp change on a max load as a reason to back off and re-work up. The tool will show you exactly that.

**Primer Manufacturer → Primer Name.** The primer. The list is filtered to primers matching the pocket size your brass or cartridge specifies. So you can't pick a large rifle primer for a small primer case. Each primer shows its brisance energy, measured or the pocket's nominal figure marked as such. **Nothing about the primer reaches the engine.** It is recorded in the report and in a load you save, and the Data Quality tab lists it among what the engine does not read.

#### Firearm Parameters

**Twist Rate (1:X).** Inches of barrel per full bullet rotation. Enter the `X`. So a 1:8" barrel is `8`. Required. **Auto-fills from:** the firearm. **Lower it** from 8 to 7 for a faster twist and spin goes up. **Effect here:** it does not change pressure or velocity. It sets the bullet's spin, which the **Bullet Spin Rate** audit and the spin curve on the Combustion tab read. **Change it when:** modelling a barrel you don't own yet. **Don't touch it when:** you're chasing a velocity mismatch. Twist is not the cause.

**Barrel Length (in).** Muzzle to bolt-face, typed in the box. Required. **Auto-fills from:** the firearm. **Raise it** and velocity rises with diminishing returns. Expect roughly 15–30 fps per inch in the middle of a typical rifle case and less as you get long. It does **not** change peak pressure since peak happens in the first few inches. **Change it when:** deciding how much velocity a barrel chop will cost you. Type the shorter barrel and press **RUN** again. That makes it an excellent "what does 2 inches cost me?" tool. Nothing on this page re-runs by itself.

#### Cartridge Parameters

**Bullet Diameter (in).** The bullet (groove) diameter such as `0.308`. Required. **Auto-fills from:** the cartridge's caliber, or the Caliber you pick. **Why it matters:** this sets the bore area and pressure acts on that area to accelerate the bullet. Area goes as diameter squared. So **a typo here is one of the few single-digit mistakes that can change velocity by hundreds of fps.** **Don't touch it** unless you are modelling a genuinely odd bore.

**Case Capacity (gr H2O).** How much water the fired case holds in grains. Required. **Auto-fills from:** your selected brass, else the cartridge's nominal figure. The field's tag says which. **Lower it** for thicker brass such as military or Lapua against commercial and the same charge is squeezed into less room. So **pressure and velocity both rise.** This is one of the biggest levers in the whole tool. A 2 gr H2O difference between brass makes a real pressure difference. **Change it when:** you have weighed water in *your* fired brass. **Do that** if you're near max. It is the highest-value measurement a handloader can make for pressure modelling.

**Case Length (in).** Trim-to length. **Auto-fills from:** the cartridge. **Seating is measured from the cartridge's maximum case length**, the convention of the published loads the engine was fitted on. So this field counts only for a cartridge with no maximum on record. That holds for the run and for the Seating Depth, Usable Capacity and Case Fill readouts alike. The field's hint and the **Data Quality** tab name which one was used.

**Max Pressure (PSI).** The published pressure ceiling for the chambering. **Auto-fills from:** the cartridge record: your own ceiling if you saved one on your cartridge, else its SAAMI limit, else its C.I.P. limit, and the field says which. The two are different standards and disagree by up to 17%, so the result names the one it used. A chambering with neither leaves the field blank, and the pressure audit then says it had no ceiling to check against. SAAMI sets a few old cartridges only a crusher (CUP) limit, which is a different measurement from PSI and not one this app compares against. 25-35 Winchester and 30-40 Krag therefore take C.I.P.'s limit, and the field says so. For some European cartridges SAAMI's limit is set for older rifles and sits well below C.I.P.'s: 8x57 IS (Mauser) is 35,000 psi by SAAMI, and 6.5x55 Swedish 51,000 psi. Ignition, the Burn Chart and the Powder Optimizer then build max loads to that lower figure, and many powders a European manual loads in those cases read as too fast. Type C.I.P.'s figure into Max Pressure if your rifle and your load data are built to it. A ceiling you type is reported as "Your limit … (entered by you)". **This is the line the safety audit measures you against.** **Raise it** and you are not making anything safe. You are only moving the goalposts. **Change it when:** the cartridge is a wildcat with no SAAMI number and you know the correct ceiling. Better, save it on the cartridge as **Your Pressure Ceiling** so every run and the Powder Optimizer use it. **Don't touch it** to make a red audit turn green. That is the one edit in this app that can actually hurt you.

#### Bullet & Loading Parameters

**Bullet Weight (gr).** Projectile mass. Required. **Auto-fills from:** the bullet. A bullet with no weight on record leaves it empty, and the run waits until you enter one. **Raise it** and pressure rises while velocity falls. More mass is slower to get moving. That gives the powder more time to burn against resistance. Heavier bullets are a *pressure* decision as much as a ballistic one.

**Bullet Length (in).** Overall projectile length from tip to base. Required. **Auto-fills from:** the bullet. A bullet with no length on record leaves it empty, and the run waits until you enter one. **Feeds:** the seating depth, so how much of the bullet sits inside the case, and with it Usable Capacity and Case Fill. Bullet inside the case steals powder space. Ignition has no stability check: that is [Strovilos](#154-strovilos-gyroscopic-stability). **Change it when:** you have measured the bullet. Catalogue lengths are often nominal.

**Bearing Surface (in).** The length of full-diameter shank actually gripping the rifling. **Auto-fills from:** the bullet record or defaults to **a third of the bullet length** (33.3%, the median of the library's measured bearing surfaces) when unknown. **Raise it** and friction and engraving resistance rise and nudge pressure up. **Important and counterintuitive:** the engine's correction factors were fitted *with* that default in place. **Typing in a "better" value can make the prediction worse rather than better** when your bullet record has no measured bearing surface. The model has already been calibrated around the assumption. Only override it when the value is measured *and* you are prepared to sanity-check the result against a chronograph.

**COAL (in).** Cartridge overall length as loaded. **Auto-fills from:** the load or the cartridge's nominal. Left empty, the run and the readouts seat to the cartridge's nominal overall length. **Lower it** to seat deeper and you reduce usable case volume. So **pressure and velocity rise**. This is the classic hidden pressure increase. Seating 0.030" deeper on a near-max load is a real and frequently underestimated pressure step. **Change it when:** modelling a seating-depth ladder. Watch Case Fill and the audit as you go. Every run uses the same 0.067 in jump to the lands. A COAL that seats the bullet into the lands raises real pressure in a way the prediction cannot show.

**Seating Depth (in)** *(computed and read-only)*. How far the bullet sits inside the case: bullet length less the part of it beyond the case mouth at your COAL, with the case length measured as described under Case Length. It is the engine's own figure for the run. The audit wants at least **one caliber** of bearing for reliable neck tension.

**Usable Capacity (gr H2O)** *(computed and read-only)*. Case capacity minus the volume the seated bullet occupies. **This is the space the powder actually has. Raw case capacity is not.**

**Case Fill** *(computed and read-only)*. The charge's bulk volume as a share of usable capacity, which is how full the case is. The number to watch, and the bands it is judged by, taken from where the published loads sit:
- **Below 60%.** The floor of the calibrated range. The model's corrections were never fitted down here and the run is refused.
- **60–70%.** Low fill, a caution. Ignition may be less consistent and the model's error roughly doubles. Ball powders get a sharper warning at every low band because they light poorly in a part-empty case.
- **70–80%.** The low side of the published range, a note. One rifle starting load in four sits here.
- **80–100%.** The normal well-behaved range.
- **100–105%.** Lightly compressed, a note. One published load in six is.
- **105–110%.** Compressed, a caution. Common at maximum charges, but seating crushes powder at this density. It does change as the powder settles and it can push bullets back out over time.
- **Above 110%.** Heavily compressed, a warning. Published loads rarely go here and the model's error climbs. Above 130% the run is refused.

#### Powder Parameters

> These three fields describe **the powder itself** rather than your load. Read the safety rule at the top of this tool again before changing any of them. The powder's energy, burn exponent and burning-surface figures Bp and Z1 come from the fit and have no field here. Solid density is read from the powder record. So is the heat of explosion, which the record must carry or the run is refused, though the energy that flies is the fit's.

**Grain Type.** The powder kernel's shape: ball, flake, extruded stick and their perforated variants. Required. **Auto-fills from:** the powder record. It is blank until a powder fills it. A powder with no shape on record runs on a stand-in, and the Data Quality tab counts it. It determines how burning surface area evolves as the kernel is consumed. Progressive shapes hold pressure longer and degressive ones spike early. **Don't touch it** on a library powder: the fit was made with the record's shape. A powder the library doesn't have cannot be simulated at all, because the engine has no fit for it, so there is no case for changing this.

**Burn Coefficient B (1/s).** The fitted burn-rate constant for this powder and the single most influential propellant number. Required. **Auto-fills from:** the calibration file entry for that powder, tagged "From the Ignition fit". **Raise it** and the powder burns faster. So pressure peaks earlier and higher. **Change it when:** essentially never. It is shown so you can *see* it. It is not shown so you can tune it. A powder the library doesn't have cannot be simulated, whatever is typed here: the engine needs that powder's fit, not just its burn rate.

**Bulk Density (kg/m³).** The density of the powder *as poured* with the air between kernels included. Required. **Auto-fills from:** the powder record. **This is what determines whether your charge fits.** Ball powders pour dense at around 950–1,000. Extruded sticks are much less dense at around 800–900. **Change it when:** you have measured your powder's bulk density. Get it right because a wrong bulk density gives a wrong Case Fill and therefore a wrong compression warning.

#### The charge and the environment

**Powder Charge (gr).** Your actual charge weight. Required. **This is the field you came here to change.** It is a plain box until the case geometry, the bulk density and the calibration are known. Then it becomes a slider with a box. The slider spans the calibrated window, the charges that fill the usable case from 60% to 130%, so both of its ends run without a refusal. A load fills the charge as stored, to 0.001 gr. Moving the slider does not run anything. Set a charge and press **RUN** for each step, and the run's pressure is your pressure ladder. Watch peak pressure approach the ceiling and Case Fill climb. **The right way to work up a load in this tool** is to fix everything else from your real components and move only this.

**There is no powder temperature field.** The Ignition engine has no temperature term, so it predicts the same pressure and velocity at any temperature, and a field for one could only suggest otherwise. Real powders are temperature-sensitive, and the same charge that is comfortable at 40 °F can be over pressure at 100 °F. **This tool cannot show you that.**

#### Reading the results

Nothing runs until you press **RUN**. The chips above it show what RUN still needs. A run the engine refuses shows **Simulation refused** and the reason in place of a result. Change any input after a run and a banner marks the result stale until you run again.

- **Four headline cards.** **Muzzle Velocity** (predicted, or corrected for the rifle when it carries a current offset), **Peak Pressure**, **Burn Efficiency** and **Case Fill**. Under velocity and pressure is a **p10–p90 band** from the same load run 64 times with its inputs nudged by their real uncertainty, so it shows how far the answer moves when they do. When that ensemble cannot run, a banner says why and the headline numbers stand alone.
- **Peak pressure against the ceiling.** The headline audit. Its colour turns amber above 92% of the ceiling and red over it. Over the line is over the line.
- **Muzzle velocity.** Expect it to differ from your chronograph by some consistent amount. That's what the offset is for.
- **Burn Efficiency.** How much powder was consumed before the bullet left. Well under 100% means you are burning powder in the air. So a slower powder or a longer barrel would use it better.
- **P-V Curve**, **Combustion** and **Inch Matrix** tabs. Pressure and velocity against time, powder burned and bullet spin against time, and an inch-by-inch table of time, pressure, velocity and powder burned down the barrel. For seeing *where* in the bore the work happens.
- **Charge Spread** tab. What the spread of your powder charges costs in velocity. It shows how many fps each 0.1 gr moves this load at its charge and barrel: the velocity it loses with 0.1 gr less powder, the same figure the Powder Optimizer ranks on. Checked against more than 30,000 published ladders, the engine's figure reads each publisher's own with no bias and is typically within 9% of it. Working it out from another publisher's start and maximum loads for the same components, in another barrel and another lab, is typically 13% out, where the engine is 10% out on the same ladders. Enter **Charge SD (gr)**, the SD of 20 or more of your weighed charges, and it gives the velocity SD those charges add. Charges trickled to a scale's reading vary by about 0.3 of its last digit: 0.03 gr on a scale that reads tenths. Spreads add as squares, so the charges' part matters only once it nears the spread from everything else: half its size raises the total by 12%. With a session of this load on this rifle picked and run at its charge, it also says what share of that session's measured velocity variance the charges account for, and what its SD would be with no charge spread at all. That second figure rests on the session's few readings, whose own 95% range is shown beside it. An SD from 20 charges is itself within ×0.79 to ×1.37 of the true one 90% of the time, so the more charges you weigh, the firmer the answer.
- **Safety Audit**, under the P-V Curve. Five cards, each with a status: **Chamber Pressure** against the ceiling, **Case Fill** by the bands above, **Bullet Seating Depth** (at least one caliber deep, with a note past two), **COAL vs Maximum OAL** against the cartridge's maximum overall length, and **Bullet Spin Rate** (a caution from 250,000 rpm, where thin-jacketed bullets have been known to fail).
- **Data Quality** tab. Where each figure the engine used for the run came from: the records, the fit, a value typed on this page, or a **stand-in** the engine supplied because the record has none, such as a third of the bullet length for a missing bearing surface. Stand-ins are counted. **Cartridge Corrections** says whether the fit corrects this cartridge: its own corrections, the original's for your copy of a library cartridge, or none. It also names what the engine does not read: the primer and the bullet's ogive and boat tail. The velocity offset lives here too.
- **The report.** The plain-text **Simulation Report** under the results describes the run that made it. **Copy Report** copies it and **Download .txt** saves it. **Send Troubleshooting Report** posts it, with your firearm and components, to the Empirical Precision Discord support channel. It shows you exactly what will be sent first, and nothing leaves until you press **Send Report**.
- **Save to Loads Library**, at the foot of the Profile card, saves the form's cartridge, bullet, powder, charge, COAL, brass and primer as a new load, under the optional **Nickname**. A recipe already in the library is not saved twice.

#### The per-firearm velocity offset

A chronograph that consistently reads 40 fps below prediction is telling you about your barrel rather than the physics. Store the difference on the **firearm**, from the **Rifle Velocity Offset** panel in the **Data Quality** tab. There are two ways to set it:

- **From one session.** Pick the session, run its own load on its own rifle and press **Save velocity offset to this firearm**. It needs at least 5 shots with an SD under 25 fps. If the run is not the session's load and rifle, or the inputs have changed since the run, the panel says so and will not save.
- **From every session on the rifle.** **True from every session on this rifle** pools every qualifying session, weighted by shots, and says which it skipped and why. **Save pooled offset to this firearm** stores it.

Either way it asks before it overwrites a stored offset, and an offset over 4% asks you to confirm you have checked your inputs. It shifts **velocity only**: Ignition's headline velocity and report, and the Ignition estimate the other tools fall back on. The pressure trace and the entire safety audit are untouched. An offset applies only while it was trued against the calibration the app now carries. After an update to the model it shows as **Stored, Stale** and is not applied until you true it again. This is the sanctioned way to reconcile the model with your rifle and it is why you never need to touch a burn coefficient.

---

---

### 15.2 Varytita: the drop chart, the DOPE card and the field solution

**What it answers:** how far does this bullet fall and drift at every distance today, and what do I dial or hold? Varytita has four tiers, chosen with the buttons at the top of the page:

| Tier | What it shows |
|---|---|
| **Quick** | The essentials. Bullet, MV, zero and wind, with everything else on the defaults. A chart and a table |
| **Advanced** | Every input: the full profile, the atmosphere, truing and the chart's engine settings |
| **DOPE** | Advanced plus a printable range card, wind brackets, a PNG and a CSV |
| **Field** | Advanced's inputs, with the chart, table and RUN replaced by a list of targets solved as you type, each in large type with lead and a reticle view |

The tier only decides what is on screen. Every field keeps its value in every tier and feeds every run. A field Quick hides still counts. The one exception is **Wind Bracket**, which flies only in DOPE. Until you change them, the hidden fields sit at the standard defaults: 1:10 twist, 1.5 in sight height, 59 °F, 29.92 inHg, 50% humidity, sea level, latitude 45°, a firing azimuth of 0 and the wind from 3 o'clock. So Quick's wind blows full value from the right until you set **Wind From** in Advanced.

**A card is only as good as the atmosphere you built it in.** Elevation and temperature change air density and air density changes drop. A card built at sea level in winter will be wrong in a summer match at 5,000 ft. Build a new one or accept that you'll be re-truing in the field.

#### Profiles

**Saved Profile / Profile Name / Save / Export / Import / Delete.** A profile is the whole page: every field, the selections and your truing history. **Save** stores it under the **Profile Name** and the same name updates it. Save and Export need the four required fields. **Export** writes the form as it is now to a file you can keep or move to another device. **Import** reads one back and opens it. An imported name already in your list gets a number, so Save cannot overwrite the wrong one. A file that is not a Varytita profile is refused. So is a profile file exported before Tip Length existed. A saved profile from before it will not load: delete it and save the page again. Loading a profile restores every field as it was saved, its trued MV and drag scale included, and its selections without filling anything from them. So nothing the profile holds is overwritten by the library.

#### Selections

**Session / Firearm / Caliber / Cartridge / Bullet Manufacturer / Bullet Name.** The fast way to fill the profile.
- A **session** fills the MV from your recorded velocities, or from the internal ballistics engine when none were recorded. The field's tag says which. It also fills the bullet and the firearm, the session's temperature, pressure and altitude, its target distance as the zero distance, its range unit and the zero offsets from your marked shots. The air, the zero and the offsets it fills are tagged "From session". What it did not record is cleared, so humidity, which sessions do not record, flies at 50%. Its range unit is set without converting anything. In density-altitude mode it switches **Air Entered As** to Weather and says so, because a session records weather.
- A **firearm** fills the twist, the sight height and the cartridge.
- A **bullet** fills the weight, diameter, length, BC and drag model.

Or leave them all blank and type the four numbers straight off the box.

#### Profile

**Bullet Diameter (in) / Bullet Weight (gr) / Muzzle Velocity (fps) / Ballistic Coefficient (BC).** The four required fields. The chips above the RUN button turn green as each is filled. In density-altitude mode **Density Altitude (ft)** is required too.

**Ballistic Coefficient (BC).** **The field that shapes the whole chart.** **Raise it** and every drop number shrinks. **Change it when:** the bullet record's number is wrong for your bullet. If the card only goes wrong at long range, true Drag in the Truing card below instead. An optimistic advertised BC produces a card that's close at 300 and increasingly wrong past 700. That is the classic "my dope stops matching past 600" complaint.

**Drag Model.** G7 for boat-tail bullets and G1 for flat-base ones. It must match the family the BC was published in. G7 numbers are roughly half the G1 number for the same bullet. Switching it re-reads the selected bullet's BC in the family you pick. A bullet with no BC in that family clears a BC it filled, so the box shows as missing rather than holding the other family's number. A BC you typed stays as typed. For a library bullet with its own drag curve, the note under the box says what the BC rests on and where the curve came from. That bullet then flies its own curve in either family, so switching G1 and G7 changes the number shown and not the trajectory. **Edit curve →** opens the bullet's curve in the editor on the Components page (section 13).

**Muzzle Velocity (fps).** The measured mean and ideally one taken at the temperature you'll be shooting. **Raise it** and everything flattens.

**Adjust MV for powder temperature.** (Advanced.) A **Slope (fps per °F)**, the powder temperature the MV above was measured at, **MV Measured At (°F)**, and **Powder Temp Today (°F)**. Switched on, the run flies the MV the slope gives at today's powder temperature. **Powder Temp Today** left blank uses the air temperature; enter the rounds' own temperature when you read it. A session fills MV Measured At with its round temperature when it recorded one and its air temperature otherwise, and only when its MV was measured, not estimated. It fills Powder Temp Today with its round temperature, or blank. When the session picked has a load with at least two chronographed sessions 10 °F or more apart, the slope they fit is shown under the box with a **Use this slope** button. The fit uses round temperatures when two or more of those sessions recorded them 10 °F apart, and air temperatures otherwise, never both at once, and says which. Nothing fills the slope until you press it.

**Zero Distance (yd).** The range where the rifle is zeroed. **This is the anchor for every row.** A session fills it with its target distance. The MPBR chart replaces it with the zero it calculates and greys the box out.

**Twist Rate (1:X) / Twist Direction.** (Advanced.) Feed **stability**, **spin drift** and **aerodynamic jump**, and the chart includes all three. At 1000 yd spin drift is several inches and always the same way. So leaving twist wrong bakes a constant lateral error into the chart. Right-hand twist drifts right and left-hand twist drifts left. Choosing a rifle fills Twist Direction from it. Twist Direction also sets which way a crosswind jumps the bullet. With right-hand twist a wind from the right lifts it and a wind from the left drops it. Left-hand twist reverses both. Spin drift follows Litz's formula, which grows in step with Sg. Every published check of it sits between Sg 1.6 and 2.3, and one comparison found it reads high even there. A short bullet in a fast twist can sit far above that band, and its drift is then the formula's extrapolation.

**Sight Height (in).** (Advanced.) Bore centre to scope centre. Wrong here means a chart that's fine far out and wrong up close.

**Bullet Length (in)** and **Tip Length (in).** (Advanced.) Feed stability, spin drift and aerodynamic jump. **Auto-fill from:** the bullet. A bullet with no tip on record leaves Tip Length blank, and blank means no plastic tip. With a tip, stability follows Courtney and Miller's formula for tipped bullets, the one Strovilos uses, so the Sg chip reads what Strovilos reads for the same inputs. Tip Length must be less than Bullet Length, and RUN refuses it otherwise. Left blank, Bullet Length assumes 4.5 calibers and the Sg chip is starred. Tip Length is then ignored, because a measured tip taken off a guessed length is not a metal length. Clearing or replacing the bullet clears both unless you typed over them. Every tipped bullet in the library carries a tip. Where JBM's length list or Courtney and Miller measured it, it is that measurement. Otherwise it is estimated from measured tips of the same design and calibre, and the field says so: "From InterBond, estimated". An estimate is typically within 0.02 in, which moves Sg about 3%. Measure the tip when stability is close.

**Zero Offset X / Y (in).** (Advanced.) Where your group actually sits at the zero distance, from your measured point of impact, right and up positive. Blank is 0, a true zero. A session fills these from its marked shots.

**Drag Scale by Mach.** (Advanced.) Multipliers on the drag curve, each pinned at a Mach number. Empty is the curve as shipped. One point scales the whole curve. Two or more run in a straight line between their Mach numbers and hold flat beyond them, so the transonic band can be corrected without moving the supersonic one. Truing adds the points (below). **Add Point** adds one by hand if you already know yours, and **Clear** removes them all.

**Cant (°).** (Advanced.) How far the rifle is tilted, positive clockwise. The holds are solved for it at every range, dial and all, and a chip shows where the shot lands if you ignore it. A clockwise cant sends the shot right and low. At 1000 yd 5° is about 30 in.

#### Environment & Atmosphere

A section of the Profile card. Quick shows the wind speed only, under the heading **Wind**. Advanced shows the rest.

**Air Entered As.** Either **weather** (temperature, pressure, altitude and humidity) or **density altitude and temperature**. Pick density altitude when that is what your Kestrel or weather app gives you. Humidity is already inside a density altitude, so it is not asked for again.

**Temperature (°F) / Pressure (inHg) / Pressure Type / Humidity (%) / Altitude (ft).** The air, in weather mode. A blank box flies the standard day, and its hint says what that is. **Pressure Type** says how to read the pressure: a weather report gives **Barometric (Sea Level)** pressure, which the chart corrects to your altitude. A Kestrel reading on the spot is **Station (Absolute)** pressure and is used as it is.

**Wind Speed (mph) / Wind From (°).** The wind the Wind column is computed for. The speed slider runs to 30 mph and its box takes up to 100. Wind From is set in degrees and read as a **clock on the line of fire**: 0° is 12 o'clock, a headwind. 90° is 3 o'clock, blowing from the right. 180° is 6 o'clock, a tailwind, and 270° is 9 o'clock, blowing from the left. Many shooters build the card at a **10 mph, 3 o'clock** wind and then scale in their head since half the wind is half the hold. That's a good default. The Elev column includes that wind's aerodynamic jump, and the jump changes sign with the wind's side. With right-hand twist a 3 o'clock wind lifts the shot and a 9 o'clock wind drops it by the same amount. So a card built at 3 o'clock holds too little elevation in a 9 o'clock wind, by twice the jump: about 1 MOA at 10 mph for a 175 gr .308. Left-hand twist reverses it.

**Firing Azimuth / Latitude (°).** The compass direction of fire and your latitude, for Coriolis. Only meaningful past roughly 800 yd. The pin button reads your latitude from the device. Southern latitudes are negative.

**Look Angle (°).** Uphill positive, downhill negative, to 60°. Ranges are then **slant range** along the line of sight, as a rangefinder reads them. The chart flies the whole inclined trajectory rather than applying a cosine.

**Zeroed in different conditions.** Switch it on when the rifle was zeroed on a different day. Enter that day's **Zero-Day Temperature (°F)**, **Zero-Day Pressure (inHg)**, read as barometric, and **Zero-Day Altitude (ft)**. The zero is flown in that air and at that powder temperature, and today's shot on the same angles. Left off, the rifle is taken as zeroed in today's air. Either way the zero is solved on a level range, upright and in still air. The MPBR chart always zeroes in today's air.

#### Chart Settings

**Range Column: Regular Steps / Specific Stops.** (Advanced.) How the rows are chosen.
- **Regular Steps** gives a row every **Increment** out to the **Max Range**. Every tier has the Increment box, with 25, 50 and 100 as one-tap chips.
- **Specific Stops** takes your own list in **Range Stops**. It is better for a card built around the known distances of a range or a match stage: `100, 285, 400, 630, 875`. Sub-yard stops are allowed. Quick runs on whichever you set last in Advanced.

**Elevation & Wind Units.** Switch on any of inches (centimetres in meters mode), MOA and MIL. One stays on. Each adds an Elev and a Wind column. Changing them re-shapes the table without a re-run.

**Maximum Point Blank Range chart.** Switched on, the run solves the zero that keeps the bullet inside the vital zone for the longest span and **replaces your zero distance with it**. It marks the Apex, the Far Zero and the MPBR on the table and draws the vital-zone pipe on the chart. If no zero from 10 to 600 m (11 to 656 yd) keeps the bullet inside the zone, the run says so and draws nothing. **Make a Sight-In Target**, in the purple strip under RUN once the chart has run, takes it to your local range: it opens the [Sight-In Target](#11-targets) with this rifle, load and air, and the far zero as the zero you want. Choose the distance you can shoot and print the sheet. Truing, cant, look angle and zero offsets stay here, because none of them moves a sight-in mark you could see: the largest, one drag factor at the truing limit, shifts a 100 yd mark about a tenth of an inch.

**Range Units.** (Advanced.) Yards or meters for the whole page. Changing it converts every distance on the page, so 100 yd becomes 91.44 m rather than 100 m. A session sets the unit without converting anything, and the hint then says so.

**Turret Unit / Click Value.** (Advanced.) **Turret Unit** is MOA or MIL. Pick MIL for a MIL scope. Getting the unit wrong is the fastest way to a dangerous miss because MIL and MOA numbers are similar in size and easy to confuse under stress. **Click Value** is your scope's click in that unit, with chips for the common ones: 1/8, 1/4, 1/2 and 1 MOA, or 0.05, 0.1 and 0.2 MIL. Changing the unit resets it to 1/4 MOA or 0.1 MIL. The Clicks column counts in it.

**Elevation Tracking (× dialed).** (Advanced.) Your elevation turret's tracking factor. **Auto-fills from:** the firearm. Blank takes the turret as labelled. When it is set, the chart, the DOPE card and the CSV gain a **Dial** column: the elevation divided by the factor, which is the number to put on the turret, with the clicks beside it. The **Elev** columns stay the true correction, so truing reads them as before. In the Field tier the turret number is the dial and any remainder held on the reticle is the true angle left over. Windage and reticle holds are unchanged.

**MPBR Vital Zone (in).** (Advanced.) The target the MPBR solver must stay inside: 4 for varmints, 6 or 8 for deer and 10 for elk. Each has a chip. **This is the only input to point-blank zero that matters.** **Lower it** and the point-blank span shrinks sharply. That is the trade-off, and seeing it quantified is the point of the tool.

#### Truing

(Advanced.) Shoot a group at a known range and enter where it landed, then let the chart solve the number that explains it.

**Truing Range / Observed Drop / Observed Drop Unit.** The **observed drop** is the total from the line of sight: the chart's Elev for that range plus however low (+) or high (−) the group printed. Both buttons need the four required fields, a range and a drop. In MPBR mode truing flies the MPBR far zero, as RUN does.

**True MV / True Drag.** A miss in the supersonic band is a muzzle-velocity error. A miss in the transonic band is a drag error. So **true MV first** with a group inside the **Mach 1.2** range, then **true Drag** near the **Mach 0.9** range. Run the chart first and the card names both ranges. **True MV** writes the solved velocity into the MV field. When no velocity from 0.6 to 1.4 times the current one puts the group at that drop, it says so and changes nothing: check the drop, its unit and the zero. **True Drag** pins a drag point at the Mach the bullet had at that range. The first drag point after an MV truing also gets a point of 1.0 at the MV truing's Mach, so fixing the far groups cannot undo the near ones. True Drag again at another range to add a point there. The same band trued twice replaces its point. It warns when the answer hits the edge of the allowed band, 0.85 to 1.15. That usually means the MV, the BC or the drag family is wrong. Each truing is logged with its Mach and saves with the profile. Firing east or west, set the azimuth first: the vertical Coriolis term is real and is in the chart.

#### Reading the results

**The chips** above the chart:
- **DA:** density altitude.
- **Sg:** stability, by Courtney and Miller's formula when Tip Length is set. It turns amber under 1.5, and a star means the bullet length was assumed and any tip ignored.
- **Mach 1.2 and Mach 0.9:** the ranges where the bullet slows to each, which are also the truing ranges.
- **When set:** the temperature-adjusted MV, the trued drag scale, the cant with its ignored-cant miss, the zero-day air and the look angle.

**The chart** is the bullet's path against the line of sight, with the zero marked. In MPBR mode it also shows the vital-zone pipe and the MPBR.

**The table.** Every number is a correction. **Elev** is positive up. **Wind** names the side to hold, R or L, and includes spin drift and Coriolis. Advanced adds a **Clicks** column in the turret's unit. Velocity, energy and time of flight follow. Rows past Mach 1 turn amber and one **Subsonic** row marks where the bullet drops below the speed of sound in today's air. Past Mach 1.2 trajectories become less predictable. That is usually the honest end of your card whatever the numbers say below it.

**Why It Might Not Match.** (Advanced.) Eight checks on the inputs behind most "the app is wrong" reports: sight height, pressure type, a BC in the wrong drag family, a typed rather than measured MV, the default twist, a blank bullet length, a zero past 300 yd and nothing trued yet. Each flag says what to fix. The pressure-type check drops out in density-altitude mode and the zero check in MPBR mode, since neither applies there. Muzzle velocity passes only when it was measured or trued. A BC the bullet filled passes the drag-family check, and a typed one is judged by its size.

#### DOPE tier

**The card** is the white printout. It is named after the profile you loaded, else the session, and it describes the run that made it. Its Elev and Wind columns follow the units you switched on and always include the turret's unit, which carries the click count in brackets. **Vel**, with its unit, follows. Its header gives the temperature and pressure, or **Temp / DA** in density-altitude mode. **Strategy** reads Aim Center inside the MPBR and Dial beyond it. The MPBR block gives the near zero, the far zero and the maximum point-blank range. The warning under it matters: the chart is only valid with the rifle zeroed at one of those two distances.

**Wind Bracket (mph).** In Chart Settings, DOPE tier only. A comma list such as `5, 10, 15`. The card grows one Wind column per speed, in the turret's unit, at the wind direction above, with R or L for the side to hold. Blank keeps a single wind column. An entry that is not a number is refused by name.

**SAVE IMAGE** writes the card as a PNG. **Copy Report** gives the whole table as CSV, with energy and time of flight that the card leaves off.

#### Field tier

**Targets.** One line per target. Each has its own **slant range**, as a rangefinder reads it, its own **bearing** and its own **look angle**. A new target's bearing starts blank, and a blank bearing follows the **Firing Azimuth**. Solutions update as you type, with no RUN button. Until the four required fields are filled, the chips above the list say what is missing.

**Mover mph.** A moving target's speed and the way it moves, as a clock on its line of fire: 3 is straight right, 9 straight left, 12 straight away. Lead is held for the crossing part only, so a target walking toward 1 or 5 o'clock gets half the lead of one crossing at 3.

**Wind here.** The page's wind is set once, as a clock on the firing azimuth, and turned to each target's bearing. So a target off to one side gets its own wind angle. That is where several commercial apps go wrong. When the wind at one target is different, a speed and a clock on that target's own line of fire replace it for that target only. Leave both on **page** to use the page's wind.

**Hold Mode: Dial elevation, hold wind / Hold everything.** Whether the elevation goes on the turret or on the reticle. Dialing rounds to whole clicks and the reticle shows what is left over.

**The solution.** Click a target for its solution in large type: the dial, the hold, the wind and lead parts of the hold, time of flight, velocity and Mach. Lead is the target's speed times the time of flight, held the way it is moving. With a cant set, it also says where the shot lands if you ignore the cant.

**The reticle.** A plain mil or MOA grid in your turret's unit. **The amber mark is where the target sits in the scope.** That is below and opposite the hold, which is how a tree reticle is read.

---

### 15.3 Kyvos: hit probability

**What it answers:** how many out of a thousand shots hit this target at this range in these conditions? It fires thousands of virtual shots and counts the holes. Each shot gets a slightly different velocity, BC, wind and aim.

**The idea that makes it work.** A single predicted trajectory tells you where a *perfect* shot goes. Real shots vary. The **Parameter Uncertainties** section is where you tell the simulator how much each input varies and it is the difference between a toy and a tool. Everything above it describes the average shot. The uncertainties describe the spread around it.

**Two tiers.** **Quick** shows the selections, the profile's muzzle velocity, weight, diameter, BC, Drag Model and twist, the wind speed, the target and Range Max. **Advanced** adds the zero, the atmosphere, the Parameter Uncertainties, Range Step, Monte Carlo Runs and Saved Scenarios. Every value flies in both, so a field Quick hides still counts.

#### Profile

**Twist Rate (1:X).** As above. Required. **Auto-fills from:** the firearm. **Feeds:** spin drift and aerodynamic jump. A right-twist barrel walks the bullet right by several inches at 1000 yd.

**Twist Direction.** Right-hand or left-hand. **Auto-fills from:** the firearm. A left-hand barrel walks the bullet left instead, and reverses which way a crosswind jumps it. The report prints it beside the twist rate.

**Bullet Length (in)** and **Tip Length (in).** (Advanced.) **Auto-fill from:** the bullet record. **Feed:** the stability factor behind spin drift and aerodynamic jump. With a tip, stability follows Courtney and Miller's formula, as in Strovilos and Varytita. An estimated tip is tagged as one, and the report prints it as estimated. Blank Tip Length means no plastic tip, and it must be less than Bullet Length. Leave Bullet Length empty and the engine assumes a length of 4.5 calibres and ignores the tip. Every tool that flies a trajectory reads twist, sight height, zero, the atmosphere and the bullet's length and tip through one shared builder with one table of defaults. So a blank field means the same thing on every tab.

**Sight Height (in).** (Advanced.) Centerline of scope above centerline of bore. **Auto-fills from:** the firearm. Typically 1.5–2.0" on a bolt gun and more on an AR. **Raise it** and near-range trajectory changes noticeably since the bullet starts further below the sight line. At distance the effect washes out. **Change it when:** you switch rings or mounts. **Getting it wrong is the most common cause of a DOPE card that's fine at 600 and wrong at 100.**

**Zero Distance (yd).** (Advanced.) The range where your scope is zeroed. **Raise it** and the whole curve shifts. **Change it when:** it doesn't match your rifle. Everything the tool reports is relative to this. So an incorrect zero distance is a uniform invisible error. A session does not fill it.

**Bullet Diameter (in)** and **Bullet Weight (gr).** As in Ignition. Both required. **Auto-fills from:** the bullet. Weight and diameter set the sectional density. Sectional density and BC together govern how the bullet holds velocity.

**Ballistic Coefficient (BC).** The bullet's drag number. Required. **Auto-fills from:** the bullet record, in the Drag Model shown when the bullet has a BC in that family. Otherwise it takes the other family's and the Drag Model switches to match. A bullet with no BC at all leaves the box blank and says so. **Raise it** and the bullet drops less, drifts less and stays supersonic longer. **Change it when:** the bullet record's number is wrong for your bullet. Advertised BCs are frequently optimistic and are quoted at velocities you may not be shooting. **Make sure it matches the Drag Model beside it.** A G1 number entered against a G7 model is the single most common way to get a badly wrong answer here because G1 values are roughly double G7 for the same bullet.

**Drag Model.** G1 or G7, beside the BC in both tiers. **G7 for modern boat-tail long-range bullets. G1 for flat-base and round-nose.** The reference projectile shape has to resemble your bullet. Otherwise the drag curve is wrong at the ends of the flight even when it's right in the middle. **It must match whatever your BC number is quoted as.** Switching it re-reads the selected bullet's BC in that family. When the bullet has none in that family, a BC it filled is cleared and a message asks you for one. A BC you typed stays.

**Muzzle Velocity (fps).** The average speed at the muzzle. Required. **Auto-fills from:** the session's chronograph string if there is one, else velocities on its marked target, else the Ignition estimate with your rifle's saved velocity offset applied. Every Heurisko tool resolves it the same way and shows the same number. The field's tag says which. With none it stays blank, and the note under Session says why. **Use your measured mean if you have it.**

**Zero Offset X / Y (in).** (Advanced.) A deliberate constant aim error. It is your group's center relative to your point of aim at the zero distance, right and up positive. Nothing fills it. **Leave at 0** for a perfectly zeroed rifle. **Set it when:** you want to know what a rifle that prints 0.5" high and 0.3" left actually costs you at distance. The answer is usually "more than you think" because a constant offset scales with range while your group does not.

**Rifle Cant (°).** (Advanced.) The rifle's mean tilt from upright, positive clockwise. **Leave at 0** unless you have a reason. Kyvos treats a cant as accidental: you dial or hold the level solution and fire with the rifle tilted. Everything on the scope tilts with it: the zero, the sight height above the bore and, by far the largest, the elevation you dial or hold for the distance. That hold swings sideways by about the hold × sin(cant) and sits a little lower. A clockwise cant sends the group right and low. For the 6.5 CM load in the tables below, 5° moves the group 6.3" right at 500 yd, and 32.0" right and 0.5" low at 1000 yd, where the elevation hold is 328". Varytita's **Cant (°)** chip reports the same miss as "ignored" for the same rifle and range, to the hundredth of a MOA.

#### Environment & Atmosphere

Quick shows the wind speed only, under the heading **Wind**. Advanced shows the rest.

**Temperature (°F)**, **Pressure (inHg)**, **Pressure Type**, **Altitude (ft)** and **Humidity (%)** describe the air the bullet flies through. They start at the standard day: 59 °F, 29.92 inHg, sea level and 50%. **Auto-fills from:** the session, for temperature, pressure and altitude. What the session did not record is left blank and flies at the standard day. Sessions do not record humidity, so a session leaves it alone. **Pressure Type** is **Barometric (Sea Level)**, a weather report's figure corrected to your Altitude, or **Station (Absolute)**, read at the firing point. A session sets it only when it recorded a pressure. Together these set air density and **air density is drag**. Thin air that is hot, high and low pressure means less drop and less drift. Dense air means more of both. **Change them when:** modelling a match at a different elevation. The difference between sea level and 6,000 ft is a real dial-able amount of elevation. Humidity is the weakest of the four so don't agonize over it.

**Wind Speed (mph)** and **Wind Angle (°).** The average wind. **0° is a headwind. 90° is a full-value crosswind from the right. 180° is a tailwind. 270° is full-value from the left.** Only the crosswind component pushes the bullet sideways. So a 10 mph wind at 90° drifts about ten times as much as the same wind at 5°. **Change them when:** planning for known conditions.

**Latitude (°)** and **Azimuth (°).** Your position on Earth and the compass direction you're firing. These drive the **Coriolis** correction. **Leave them alone unless you shoot past roughly 800 yards.** Past that the effect becomes measurable at a few inches. Azimuth matters because firing east or west adds a small vertical component while north and south is purely horizontal. They start at latitude 45° and an azimuth of 0 (north).

#### Parameter Uncertainties: the part that makes it honest

> **Advanced, at the foot of the Profile card.** Each box is a slider with its own number box. They start at a typical rifle: **System Precision SD** 0.35 MOA, **Muzzle Velocity SD** 15 fps, **BC SD** 1% and the rest at 0. Tune them to yours. Set every one to 0 and every virtual shot is identical, so P(Hit) is 100% until the trajectory simply misses. That is a trajectory calculator rather than a probability model. The wind boxes start at 0, and they are where the truth usually is.

##### What a standard deviation actually means here

Every box in this card is a **1σ (one standard deviation)** figure and the simulator draws a bell curve around your average using it. The translation you need is:

| You enter 1σ = | About this share of shots land within | Practically |
|---|---|---|
| ±1σ | **68%** | the normal spread |
| ±2σ | **95%** | what you should plan for |
| ±3σ | **99.7%** | the worst you'll realistically see |

So **a 15 mph wind with a Wind Speed SD of 2** means two-thirds of your shots see 13–17 mph, 95% see 11–19 mph and the rare gust hits 21. That is a *steady* wind. **A 15 mph wind with an SD of 6** means 95% of shots see 3–27 mph. That is a completely different day requiring a completely different plan even though the average is identical.

##### What 1σ is worth in inches

The numbers below come from this app's own trajectory engine, the one Kyvos flies. They convert an uncertainty into the thing you care about. That is inches on the target. You can then see which boxes deserve your attention.

**The inputs behind them:** 59 °F, 29.92 inHg barometric at sea level, 50% humidity, a 100 yd zero, 1.5" sight height and a 1:10 twist, with Bullet Length blank. Bullet diameters are .264, .308 and .224. Each figure is a shot fired from the nominal load's zero, as Kyvos scores it, with only the named input changed.

**Drift in inches per 1 mph of full-value (90°) crosswind:**

| Load | 300 yd | 500 yd | 700 yd | 1000 yd |
|---|---|---|---|---|
| 6.5 CM 140 gr, G7 .315 @ 2700 | 0.52" | 1.53" | 3.18" | 7.19" |
| .308 Win 175 gr, G7 .243 @ 2600 | 0.73" | 2.19" | 4.70" | 11.17" |
| .223 Rem 55 gr, G1 .243 @ 3240 | 1.18" | 3.82" | 8.78" | 20.23" |

**Vertical in inches per 10 fps of muzzle velocity:**

| Load | 300 yd | 500 yd | 700 yd | 1000 yd |
|---|---|---|---|---|
| 6.5 CM 140 gr | 0.18" | 0.56" | 1.23" | 3.03" |
| .308 Win 175 gr | 0.21" | 0.69" | 1.58" | 4.30" |
| .223 Rem 55 gr | 0.13" | 0.49" | 1.32" | 3.68" |

**For scale 1 MOA is** 3.1" at 300 yd, 5.2" at 500, 7.3" at 700 and 10.5" at 1000.

**Use these as multipliers.** A 6.5 CM shooter with **Wind Speed SD = 3 mph** at 700 yd carries 3 × 3.18 = **9.5" of 1σ horizontal spread from gusts alone**. That is larger than a 1 MOA group at that distance. It is the whole point of this card. Past about 500 yards the shooter's uncertainties usually dwarf the rifle's grouping.

##### Wind Speed SD with real conditions

"Gusty" means nothing on its own. Here is the same idea expressed as numbers you can type. Each row names the conditions it describes:

| Situation | Wind Speed | Wind Speed SD | What that means in the field |
|---|---|---|---|
| **Pronghorn, open plains, mid-morning** | 15 mph | **1–2** | A steady prairie blow. 95% of shots see 11–19 mph. The wind is strong but *honest* and you can hold for it. |
| **Prairie dogs, flat pasture, afternoon** | 3 mph | **3** | Light and switchy. One shot in six sees the wind from the other side and some see 9 mph. The average is nearly useless. The variability *is* the condition. |
| **Ridge-to-ridge, mountain goat, 400 yd across a canyon** | 10 mph | **5** | Terrain-channeled and unpredictable. The wind at your muzzle, mid-canyon and at the animal are three different winds. 95% of shots see 0–20 mph. This is the hardest case in the table. |
| **Whitetail, dense southern timber, 80 yd** | 2 mph | **2** | Barely moving air under canopy. At 80 yd the entire effect is a small fraction of an inch. Set it and watch the tool confirm it doesn't matter. |
| **F-Class relay, flat range, flags out** | 8 mph | **2–3** | Readable cyclical wind with visible indicators. You can time your shots. That is why competitors do. |
| **Coastal or frontal passage** | 12 mph | **6–8** | Genuinely unstable air. If your model says you can make the shot, your model is being optimistic about *your patience* rather than your rifle. |

**Big SDs and calm days.** A sampled wind speed below zero is not clamped. It is wind from the other side. So gusts about a calm day push both ways, and a 3 mph wind with an SD of 3 sends one shot in six the other way. That is a wind that reverses along the same line. **Model a wind that swings around to another angle with Wind Direction SD.**

##### Wind Direction SD and why it matters less than you think at 90°

This is in **degrees** and its effect depends enormously on the wind angle you are already at because only the crosswind component pushes the bullet.

Same 6.5 CM, 10 mph and a 10° direction error:

| Where the wind is coming from | Cost of being 10° wrong at 700 yd | At 1000 yd |
|---|---|---|
| Near **full value** (90° → 80°) | **0.5"** | **1.0"** |
| Near a **shallow angle** (30° → 20°) | **5.1"** | **11.4"** |

**The lesson:** at full value direction error is nearly free. That is why "hold for a full-value 10" works. At shallow angles the crosswind component changes fastest and the same 10° mistake costs more than ten times as much. **Set Wind Direction SD by how confidently you can call the angle:** 5° with flags or mirage on a known range, 10–15° reading grass and trees, 20°+ in swirling terrain.

##### Wind Call Error SD is often the biggest number on the page

The difference matters and is worth stating plainly. **Wind Speed SD is the wind changing. Wind Call Error SD is you being wrong about it.** The wind can be rock steady at 12 mph and you can still call it 8. Kyvos holds the DOPE windage and elevation for the wind you called. The error lies along the wind's direction, so 1 mph of call error costs the drift of 1 mph of wind from the **Wind Angle** you set, whatever the wind speed and on a calm day too. At 90° that is the full-value figure in the drift table above. It also costs that wind's aerodynamic jump, a small move up or down: for the 6.5 CM 0.28" per mph at 700 yd and 0.39" at 1000, at 90°. Off full value the head or tail share of the misread wind changes the drop as well.

Enter it as one standard deviation. Litz's WEZ analysis (Applied Ballistics 2021, Table 1) gives a crosswind call as ±1, ±2.5 and ±4 mph for high, medium and low confidence, and its footnote makes each a 95% interval of a normal distribution. That is two standard deviations, so Kyvos wants half of each:

| Who (Litz's WEZ, Table 1) | Litz's 95% bound | Wind Call Error SD | Cost at 700 yd, 6.5 CM (1σ) |
|---|---|---|---|
| High confidence: an elite caller with good indicators | ±1 mph | **0.5 mph** | 1.6" |
| Medium confidence | ±2.5 mph | **1.25 mph** | 4.0" |
| Low confidence: a novice wind reader in a difficult place | ±4 mph | **2 mph** | 6.4" |

Typing the ± figure as the SD doubles the error. Litz's table stops at low confidence. Broken terrain with thermals and no reference at the target can be worse, and no published figure says by how much.

Run your model twice. Once with your honest call error and once with 0. **The difference between those two hit percentages is your wind-reading skill expressed in the only unit that matters.** For most shooters at distance it is a bigger number than anything they could gain by reloading.

##### Muzzle Velocity SD

Your chronograph's SD in fps. **Auto-fills from:** the session's measured velocities, when the session has at least 3 readings you have not set aside, as Manteis needs. Otherwise it resets to 15 fps and the note under Session says why. An Ignition estimate has no spread, so it never fills this. **The dominant cause of vertical spread at distance.**

| Load quality | SD | 1σ vertical at 700 yd (6.5 CM) | at 1000 yd |
|---|---|---|---|
| Exceptional handload, weighed charges, sorted brass | **5 fps** | 0.6" | 1.5" |
| Good handload | **10 fps** | 1.2" | 3.0" |
| Acceptable handload or premium factory match | **15 fps** | 1.8" | 4.5" |
| Ordinary factory ammunition | **25 fps** | 3.1" | 7.6" |
| Something is wrong: ignition, neck tension, charge weight | **40 fps+** | 4.9"+ | 12.1"+ |

**Read that table against a 10.5" 1 MOA circle at 1000 yd** and the picture is clear. At 5 fps SD velocity is a non-issue. At 40 fps it is most of your vertical. Note also how little it matters at 300 yd. Chasing single-digit SD for a 300-yard rifle is effort spent in the wrong place.

##### BC SD

Shot-to-shot variation in drag. The box is **BC SD (%)**: enter it as a **percent**, so `1` is 1%. It comes from meplat and base inconsistency.

| Bullets | BC SD (%) | Effect at 1000 yd (6.5 CM: 1.89" per 1%) |
|---|---|---|
| Meplat-trimmed and pointed match bullets | **0.5** | ~0.9" |
| Quality factory match bullets | **1–2** | 1.9–3.8" |
| Bulk or hunting bullets | **3** | ~5.7" |

Below 600 yd it is nearly invisible. Past 800 it stacks on top of velocity SD in the vertical.

##### Range Error SD

Uncertainty in your range estimate in yards. You dial the hold for the range you think it is. The trajectory steepens with distance. So the same ranging error costs more the further out you go. **The 6.5 CM sees 2.1" of vertical at 300 yd from 25 yards of error and 13.8" at 1000 yd.**

| How you ranged it | Range Error SD |
|---|---|
| Quality LRF on a reflective target | **1–3 yd** |
| LRF on an animal in brush, or at its limit | **10–15 yd** |
| Ranged a nearby landmark instead of the target | **15–25 yd** |
| Estimated by eye or mil-reticle on an unknown-size target | **25–50 yd** |

At 1000 yd with a 50 yd estimate error the 6.5 CM sees 27.7" of 1σ vertical. That is **more than two and a half times a 1 MOA group.** This is why nobody ranges by eye at distance.

##### System Precision SD (MOA)

Your rifle-and-ammo dispersion as a 1σ angular figure. **Auto-fills from:** the session's group: its Mean Radius in MOA divided by 1.2533, the Rayleigh constant. That needs the session's target distance to read the group as an angle. Without one, or without marked shots, it resets to 0.35 MOA and the note under Session says why. Use the measured value if you have it since guessing here is guessing about the one thing you can actually observe. From a group size alone, divide a 5-shot extreme spread by 3.

As a rough guide: **0.25 MOA** is a genuinely excellent rifle and load. **0.5 MOA** is a good precision rifle. **1.0 MOA** is a typical hunting rifle with decent ammunition. **1.5–2 MOA** is a factory sporter with hunting ammunition.

**Keep it in perspective.** At 700 yd going from 1.0 to 0.5 MOA saves you about 3.6" of spread. Cutting a 2 mph wind-call error to 0.5 mph, Litz's novice to his elite caller, saves 4.8". The rifle is often not the limiting factor.

##### Cant SD

Shot-to-shot variation in how level you hold the rifle in degrees. Use **1–2°** for a shooter without a level on a bipod and **under 0.5°** with a bubble level you actually check. Each shot's tilt turns the hold you dialed, exactly as **Rifle Cant** does, so the cost grows with the hold and therefore with range. For the 6.5 CM it is about 6.4" of 1σ horizontal per degree at 1000 yd. At 2° that is 12.7", wider than a 1 MOA circle, and the group also sits about 0.2" low. It is the cheapest of all these to fix since a level costs less than a box of match bullets.

#### Simulation Settings: target, range & run count

**Target Shape.** Circle, Rectangle or **IPSC Silhouette**.
- **Circle** uses Target Width as the diameter. It is the right choice for a steel plate.
- **Rectangle** uses width and height.
- **IPSC Silhouette** is the **official IPSC target** from IPSC Handgun Rules Appendix B2. It is a 450 × 570 mm octagon with A, C and D scoring zones and a 5 mm non-scoring border. Selecting it **locks Target Width and Height** because the target is a fixed real-world size. You then get an **A / C / D hit distribution** alongside P(Hit). The practical-shooting question isn't just "did I hit it". It's "did I hit the A zone".

**Target Width (in) / Target Height (in).** The target's real size. Required. Height shows for the Rectangle and the IPSC Silhouette. **Lower them** and P(Hit) falls at every range. **Change them when:** modelling the plate you'll actually shoot. Disabled for IPSC.

**Range Max (yd)** and **Range Step (yd).** The distance band and its resolution. Both required, and Range Step is Advanced. Range Max must be at least Range Step, and a run scores 200 range steps at most. A step of 25–50 yd over a 1000 yd band is plenty. A 5 yd step multiplies runtime for a smoother line that tells you nothing new.

**Monte Carlo Runs.** (Advanced.) Virtual shots per range step, a whole number from 1 to 10,000. **1,000 is fast and 5,000 is thorough.** More runs don't change the answer. They sharpen it. At 1,000 runs a reported 90% is roughly ±1%. That is fine for decisions. Go to 5,000+ when you're comparing two loads that are genuinely close. Every run uses one fixed random seed. So the same inputs give the same answer, and two close loads are compared on the same random draws.

#### Saved Scenarios

(Advanced.) **Load Scenario / Save Scenario As.** Store and recall a complete parameter set under a name. Useful for keeping a "match conditions" and a "practice conditions" scenario side by side. Saving under a name another scenario already has asks before it overwrites. A scenario keeps the Twist Direction; one saved before the field existed is refused by name, so delete it and save the page again. **Delete** removes the one loaded. A scenario keeps the numbers. It does not keep the selections, Bullet Length, Tip Length or the bullet's own drag curve. So loading one clears every selection and both lengths rather than leave the last bullet's name beside numbers that are not its own.

#### Reading the results

The result describes the run that made it, and a banner marks it stale once you change an input. **View Dispersion At Range** picks the range step whose heat map, P(Hit) and statistics are shown. **CEP about aim (50%)** and **R90 about aim (90%)** are the radii about the aim point, not about the group centre, that hold half and nine tenths of the shots. With the IPSC target the A, C and D zone hits are listed too. The **P(Hit) vs Range** chart and the **Data Table** cover every range step. **Save Image**, beside RUN, downloads the heat map and its statistics at the range shown. The **Simulation Diagnostics Report** lists every value the run flew, marks a blank optional field "(blank: default)", says whether Tip Length went into stability and gives the random seed. **Copy Report** copies it.

#### Worked example: getting to a real answer

*Goal: will my 6.5 CM load hold 90% hits on a 12" plate at 700 yards?*

1. Switch to **Advanced** and pick the **Session** you shot that load in. Profile, environment, measured velocity and dispersion all fill. The note under Session lists anything it could not fill and why.
2. Confirm **BC** and **Drag Model** agree. So a G7 number with a G7 model.
3. Check in **Parameter Uncertainties** that **Muzzle Velocity SD** and **System Precision SD** came from your data: each shows a "From …" line. Add a realistic **Wind Call Error SD** and start at 1.25 mph, Litz's medium confidence.
4. Set **Target Shape** to Circle and **Target Width** to 12.
5. Set **Range Max** 900, **Range Step** 25 and **Monte Carlo Runs** 5,000.
6. Run it and then read the P(Hit) curve where it crosses 90%.
7. Now set **Wind Call Error SD** to 0 and re-run. The gap between the two answers is *your wind-reading skill expressed in yards*. For most shooters it is a bigger number than anything they could gain by reloading.

---

---

### 15.4 Strovilos: gyroscopic stability

**What it answers:** will this bullet fly point-first out of my barrel or wobble? One number called **Sg** from the Refined Miller Twist Rule corrected for velocity and air density.

**Read the answer like this.** **Sg ≥ 1.5** is **Stable**: the bullet flies at its full BC with margin for colder, denser air. **1.1 to 1.5** is **Marginal**. The bullet flies but yaws, and that costs up to 10–15% of your BC and opens groups. **Below 1.1** is **Insufficient**. From 1.0 to 1.1 the bullet is still gyroscopically stable but has no margin: colder air or a slower load can take it under. **Below 1.0** it will not stabilize. It keyholes and no amount of load tuning fixes it, and the result says so in a line of its own.

Every field below is required, except Altitude with a station pressure. A session, firearm or bullet fills what it knows and tags it. A selection never estimates a value its record does not hold: that field stays blank and RUN asks for it.

**Bullet Weight (gr).** Heavier is generally *longer* and length is what actually destabilizes. **Auto-fills from:** the bullet.

**Bullet Diameter (in).** The bullet's diameter. It appears squared-ish in the stability math. So a typo swings Sg hard. **Auto-fills from:** the bullet's caliber.

**Bullet Length (in).** **The field that decides the answer.** Stability falls off roughly with the cube of length. **Auto-fills from:** the bullet. A bullet with no length on record leaves the field blank and RUN asks for it. **Change it when:** you have measured the bullet with calipers. **Do measure it** if the answer lands between 1.3 and 1.6. That's the band where a nominal catalogue length can flip the verdict.

**Bullet has Plastic Tip** and **Tip Length (in).** For polymer-tipped bullets. A plastic tip is long but nearly weightless. So it lengthens the bullet without adding the mass that resists tumbling. With the switch on, the tool uses Courtney and Miller's formula for tipped bullets (*Precision Shooting*, January 2012). The **metal length**, bullet length less tip length, replaces the full length in the formula's (1 + L²) term. That term stands for the bullet's moments of inertia, and the tip adds little to them. The other length in the formula stays the full length. It stands for the centre of pressure, which the bullet's shape sets whatever it is made of. In their firing tests V-MAX bullets keyholed within a few percent of Sg 1.0 by this formula. **Auto-fills from:** the bullet's tip length. A bullet with a tip on record turns the switch on and fills it. One with none turns the switch off. With the switch on, Tip Length is required and must be shorter than Bullet Length. **Set this when:** your bullet has a plastic tip. **Leaving it off makes a tipped bullet look less stable than it is.** That is the classic false "unstable" verdict. **Measure the tip when the answer is close.** A longer tip raises Sg. A tip on record is measured where JBM's length list or Courtney and Miller measured it. Otherwise it is estimated from measured tips of the same design and calibre and tagged "estimated"; an estimate is typically within 0.02 in. The formula treats the tip as weightless. Hornady's A-Tip is aluminium, about a third the density of copper, so for an A-Tip it reads slightly high. The formula reads low for a lead-free tipped bullet whose powdered core is much lighter than its jacket: that bullet is more stable than the number says.

**Twist Rate (1:X).** Inches per rotation. **Lower it for a faster twist and Sg rises** roughly with the square. **Auto-fills from:** the firearm. This is the lever you have when a bullet won't stabilize and it's a barrel purchase rather than a load change.

**Muzzle Velocity (fps).** Faster means more spin from the same twist. **The effect is real but weak** since the velocity correction goes as roughly the cube root. So 200 fps buys very little. **Don't** expect to solve a stability problem with a hotter load. Below 1120 fps the correction stops changing. Miller holds it at its 1120 fps value, his figure for the speed of sound, so every subsonic velocity gives the same Sg. **Auto-fills from:** the session: the chronograph string first, then the marked target, then the Ignition estimate. The field says which. When there is none it stays blank and says why.

**Temperature (°F)**, **Pressure Type**, **Pressure (inHg)** and **Altitude (ft)** describe the air, in their own **Environment** card. They start at 59 °F, 29.92 inHg and sea level. **Cold, dense, sea-level air is the hard case.** Dense air raises the overturning moment and the spin does not change, so Sg falls as air density rises. **Model your coldest, lowest, densest expected day.** A bullet that shows Sg 1.5 on an 80 °F summer afternoon at 5,000 ft is about 1.1 on a 20 °F January day at sea level. **Pressure Type** sits above Pressure. **Barometric (Sea Level)** is what a weather or METAR report gives, and the tool corrects it to your Altitude. **Station (Absolute)** is what a weather station on site reads, and the tool uses it as read and greys out Altitude. Pick the one matching your source or the altitude correction will be applied twice. A session with no recorded pressure leaves Pressure blank and sets the type to Barometric.

**Calculation Details**, under the result, lists the run's inputs and the intermediates: the metal length, the length-to-diameter ratio, the metal length-to-diameter ratio that goes in (1 + L²), the velocity correction, the station pressure and the air density ratio. Without a tip the two ratios are the same. Below 1120 fps the velocity correction says it was held at its 1120 fps value. It describes the run that made the number. Change any field and a banner marks the result stale until you press RUN.

**Typical use:** before buying bullets. Enter your twist, the bullet's real length and your worst-case weather. Sg under 1.5 means you choose a shorter bullet or a faster barrel.

---

### 15.5 Manteis: comparing loads across sessions

**What it answers:** which of the loads I've actually shot hits best at 600 yards? This is the only Heurisko tool that works on **many sessions at once** and every number in it comes from measured data rather than a hypothetical. It has no Selections card: its list of sessions is the selection.

**Saved Sessions.** Tick as many as you want to compare. **Select All** and **Clear** are there for convenience. The columns run in the order you tick, and each ticked session shows its place in that order. Each session contributes its own measured group dispersion, velocity consistency, air and load data.

**What a session needs.** Marked shots at a known target distance, a firearm, a load whose bullet has a weight, a BC and a caliber diameter, and a muzzle velocity. The velocity comes from its chronograph string, else the velocities on its marked shots, else the Ignition estimate for its load and firearm. A session missing any of these is listed above the matrix with its reason and gets no column. The others still run.

**Sessions without enough chronograph data are handled honestly.** A velocity SD measured over at least 3 readings you have not set aside is used as measured. Otherwise, and always for an Ignition velocity, it is imputed at 15 fps and marked `*` on the column, on its TOP or TIE badge and in the copied table. 15 fps is a typical handload rather than a worst case, so a load that runs wider will look better than it is. Treat a `*` column with care. Each session flies the air it recorded and the standard day for what it did not, and a rifle with no twist or sight height on record flies the defaults. Its detail card says which.

**Min Distance (yd) / Max Distance (yd) / Step Distance (yd).** The distance band of the comparison matrix and the spacing of its rows. They start at 100, 1200 and 100, and Max must be greater than Min. **Set the max to something past where you expect the loads to fall apart.** The interesting information is where the curves cross and if the band stops too early you never see it.

**Crosswind Speeds (mph).** Comma-separated, in the order you want them shown. Required. It starts at `5, 10, 15`. Each entry is a full-value crosswind from 0 to 60 mph and none may repeat. A bad entry is named and refused in the field. **The first value is the primary wind.** It colours the cells, decides TOP and sets the 95% Hit Limit. Each shot is held for the wind you would call. The call misses by the error the next two fields set. At the default 0% Growth that error is the same at every crosswind, so the crosswinds differ by a point or two at most. Raise Growth and the error grows with the wind: a stronger crosswind then costs hits, and at 10% the crosswinds can differ by 15 points or more at long range. A misread wind also moves the shot a little up or down, through aerodynamic jump. The wind's direction also scatters 5° about full value, which costs almost nothing there.

**Wind Call Error Floor (mph)** and **Wind Call Error Growth (% of wind).** Required. They start at 1.25 mph and 0%. The 1σ call error flown at each crosswind is √(floor² + (growth × wind)²). At the defaults that is 1.25 mph at every crosswind. At 10% Growth it is 1.35 mph at 5 mph, 1.60 at 10 and 1.95 at 15. The Growth hint shows it for the winds you typed. Floor runs 0 to 10 mph and Growth 0 to 50%. This one error is the whole gap between the wind you hold for and the wind the bullet meets. It covers a misread wind and the wind changing after you read it, so there is no separate gust. Kyvos keeps those apart, as **Wind Call Error SD** and **Wind Speed SD**. The misread wind moves the shot a little up or down too, through its aerodynamic jump, as in Kyvos. **Where the defaults come from.** Litz's WEZ analysis (Applied Ballistics 2021, Table 1) puts a crosswind call within ±1 mph for an elite caller with good indicators, ±2.5 mph at medium confidence and ±4 mph for a novice in a difficult place. Those are 95% bounds, so 1σ is 0.5, 1.25 and 2 mph. Floor starts at the middle one. Kestrel's WEZ starts its wind SD at 1.0 mph. Every published value is fixed, and no study measures how a call's error grows with the wind, so Growth starts at 0: Litz's fixed form. **Growth is how the crosswind columns come apart.** At 0 they differ by a point or two at most. Growth stands for what does grow: the wind's own gusting is a share of its speed, and the Army sniper manual (FM 23-10) says mirage stops showing small changes above about 12 mph. Any Growth above 0 is an estimate. At 10% the crosswinds can differ by 15 points at long range. **Change them when:** you know how well you read wind. Use 0.5 for flags and mirage on a known range, 2 for broken ground with no indicators. Raise Growth when you want a stronger crosswind to cost more.

**Target Size (MOA).** The target as an *angular* size, a circle this many MOA across. So it scales with distance. 2 MOA, the default, is about a 2" circle at 100 yd and 21" at 1000 yd. **Lower it** for a hard target and the whole matrix drops. **Change it when:** you want realism for your discipline. Use 1 MOA for small steel, 2 MOA as a general standard and 4+ MOA for large silhouettes.

**Reading the matrix.** Each row is a distance and each column a session, keyed S1, S2 and up. The column header names the rifle, the load, the nickname and the session's id. Each cell lists p(hit) at every crosswind in the order typed and takes its colour from the first. **TOP** marks a session that beats every other one at the primary wind by more than the 95% Monte Carlo margin for its 600 runs. Where the run cannot separate the leaders, each of them is marked **TIE**. **Watch for the crossover.** The column that leads at 300 is often not the one that leads at 800 and that is precisely the decision this tool exists to inform. **What this run assumed**, under the matrix, states the model in full: the wind call error flown at each crosswind and the vertical it adds through aerodynamic jump, BC, range, cant and zero exact, the group widened to its Mean Radius 95% upper bound, the velocity SD at its point value, and the horizontal keeping the test day's wind with the call error added on top, so it errs wide.

**Session Detail.** One card per column: the **95% Hit Limit**, the **Transonic Limit (Mach 1.2)**, the **Binding Constraint**, the test distance, the shots and groups, the muzzle velocity and where it came from, the velocity SD and how it was arrived at, the precision, air and rifle flown (the rifle line names the bullet length and plastic tip stability flew on, from the bullet's record, and says when the tip is estimated), the vertical the velocity SD alone causes and the **Miss Budget** at the fall-off distance.

**Copy Table** copies the matrix as text. It adds the wind call error flown at each crosswind, each session's muzzle velocity and its source, its SD, its 95% Hit Limit and transonic point, and the sessions that were not computed with their reasons. Every run uses one fixed seed, so the same sessions and settings give the same matrix.

---

---

### 15.6 Which tool answers which question

| Your question | Tool | The field that matters most |
|---|---|---|
| Is this charge safe? | **Ignition** | Powder Charge, Case Capacity, Max Pressure (PSI) |
| How much velocity will a shorter barrel cost me? | **Ignition** | Barrel Length |
| Why is my velocity 40 fps off the model? | **Ignition** | the velocity offset, *not* the burn coefficient |
| Will this bullet stabilize in my twist? | **Strovilos** | Bullet Length, Twist Rate, Tip Length |
| Will I hit that plate at 700? | **Kyvos** | the Parameter Uncertainties |
| How much is my wind-reading costing me? | **Kyvos** | Wind Call Error SD |
| Which of my loads is best at distance? | **Manteis** | Target Size (MOA), Wind Call Error Floor and Growth, and the sessions you tick |
| What do I dial? | **Varytita** (DOPE tier) | Ballistic Coefficient, Turret Unit and Click Value |
| Where can I hold dead-on? | **Varytita** (MPBR chart) | MPBR Vital Zone |
| How do I set that zero at a short range? | **Varytita** (MPBR chart), then **Sight-In Target** | Make a Sight-In Target, then Range You Can Shoot |
| What do I dial and hold for this stage, or this mover? | **Varytita** (Field tier) | Targets, Wind From, Hold Mode |

### 15.7 The four mistakes that produce confident and wrong answers

1. **A G1 BC entered against a G7 drag model** or the reverse. G1 values are roughly double G7 for the same bullet. So the mismatch is enormous and the tool cannot detect it. Check them together every time.
2. **Kyvos's wind uncertainties left at zero.** Wind Speed SD, Wind Direction SD and Wind Call Error SD start at 0, so the starting values model a steady wind you read perfectly. That number is not a probability for a real range and it will get you beaten on the clock. Set every uncertainty to 0 and you have a trajectory calculator reporting 100% hits.
3. **Editing a powder's burn coefficients to match a chronograph.** It moves the pressure curve and voids the safety audit. Use the per-firearm velocity offset.
4. **Modelling stability or a max load in pleasant weather.** Check Sg in the coldest densest air you'll shoot in. Pressure is harder. The Ignition engine has no temperature term, so it shows the same pressure at any temperature. A load near the line in mild weather has nothing left for the hottest day your ammunition will see in a truck, and this tool cannot show you that.

---

## 16. Troubleshooting

**My measurements are huge or nonsensical.** The scale is wrong: the reference line was drawn across the wrong length, or the length typed does not match it. Open the job, check the **Scale** readout, redraw the line or correct the length, and re-save. Every mark on that photo is re-measured.

**My groups disappeared after closing the browser.** Unsaved marking survives a reload of the same tab, not a closed browser. Always **Save Marking Job** in Marking and **Create/Update Session** in Sessions before leaving.

**Where did the velocity boxes go in Marking?** Velocity entry lives in **Chronos**. Either import a chrono file and pair each reading to an impact or type velocities by hand in the *Load Marking Data* impact list there. Re-saving a marking job keeps every pairing.

**The trajectory or stability results look wrong.** Check that the firearm has twist rate and sight height, the bullet has a G7 BC, the muzzle velocity is realistic and the environment is set.

**The Ignition simulator's velocity doesn't match my chronograph.** That is expected because the model is calibrated to lab pressure data rather than to your specific barrel. Use the **per-firearm velocity offset** in Ignition's **Data Quality** tab to store the difference. **Do not** edit powder burn coefficients to force a match. That corrupts the pressure prediction and safety audit.

**Kyvos says 100% hits at every range.** The **Parameter Uncertainties** (Advanced) are zero, or too small for the target. With every one at 0 all thousand virtual shots are identical. They start at 0.35 MOA System Precision SD, 15 fps Muzzle Velocity SD and 1% BC SD, with the wind boxes at 0. Set your measured Muzzle Velocity SD and System Precision SD, or pick a session to fill them, and add a realistic Wind Call Error SD. See [The Advanced Tool Guide](#15-the-advanced-tool-guide-heurisko-field-by-field).

**My drop card is right at 300 and wrong at 800.** It is almost always an optimistic BC or a BC quoted for the wrong drag model. Confirm the number and the G1/G7 setting agree and then true the chart in Varytita's Truing card: MV first, then Drag.

**A bullet the app calls unstable shoots fine.** If it's polymer-tipped, switch on **Bullet has Plastic Tip** in Strovilos and set Tip Length. Picking the bullet does both when its record holds a tip length. The tool then counts the tip in the bullet's shape but not in its mass. If the tip is tagged estimated, measure it. Check Bullet Length and Twist Rate too, and the air: Sg is computed for the temperature and pressure you entered.

**Which box do I change to get X?** Every field in every Heurisko tool is documented in [The Advanced Tool Guide](#15-the-advanced-tool-guide-heurisko-field-by-field). That includes when changing it will make your answer worse.

**I cleared my browser and lost everything.** Without a JSON backup there is no recovery. Back up after every session.

---

## 17. Glossary

The canonical definition for every term used here and throughout the app. Match the wording below when standardizing a label anywhere.

### Workflow

| Term | Meaning |
|---|---|
| **Session** | One analyzable record: a marked target plus firearm, load, distance and environment |
| **Marked Target** | A target photo with its scale, groups, points of aim and marked impacts |
| **Group** | A set of shots fired at a single point of aim |
| **POA** | Point of Aim. Where you were aiming |
| **POI** | Point of Impact. Where a bullet struck. The coordinate every group statistic is built from |
| **MPI** | Mean Point of Impact. The average position of all POIs in a group and the group's center |
| **Scale** | The pixels-per-inch calibration you set in Marking |
| **Composite Analysis** | Combining multiple sessions aligned by MPI to build meaningful sample sizes from small groups |
| **Rifle Velocity Offset** | A per-firearm correction reconciling the model's predicted velocity with your chronograph. It affects velocity only and never pressure or the safety audit. It applies only while trued against the current calibration |

### Statistics & Precision

| Term | Meaning |
|---|---|
| **Mean Radius (MR)** | Average distance of every shot from the group center. The preferred precision metric |
| **95% CI** | Confidence interval. The range the true value falls in 95 times in 100, from the shots and the groups they came in |
| **ES POI (Group Size)** | Center-to-center distance between the two widest shots. Outlier-sensitive |
| **ES POI H/V** | Horizontal and vertical extreme spread, measured separately |
| **SD POI H/V** | Standard deviation of impacts horizontally and vertically. A stringing diagnostic |
| **MPI Offset** | Average impact position relative to aim. Where it prints rather than how tightly |
| **Reliability Rating** | A 0.5–5.0 star trust score: how closely the Mean Radius is known, less a star for each data check that fails |
| **SD V** | Velocity standard deviation. The primary indicator of internal-ballistic consistency |
| **ES V** | Velocity extreme spread. A red-flag indicator rather than a precision metric |
| **Velocity vs Height** | Whether a target shows its slow shots landing low, tested at its shot count. The Analysis page's test of whether velocity is moving the vertical |
| **Velocity Against History** | Whether a session's average velocity fits the same rifle's other sessions of the load at its temperature, inside a 95% band. Outside it means something changed |
| **Shapiro-Wilk** | Normality test on impact radii and on velocities. Feeds the reliability rating |
| **95% Hit Limit** | Manteis's farthest range holding 95% or better hits on a circle of the run's Target Size in its primary (first) crosswind. The group is widened to its Mean Radius 95% upper bound and each shot is held for a wind call that errs by the run's call error |
| **TOP / TIE** | Manteis's marks at each distance. TOP leads every other session beyond the 95% Monte Carlo margin. TIE marks leaders the run cannot separate |
| **Miss Budget** | The vertical (velocity) against horizontal (wind) split of misses at the fall-off distance |
| **Parameter Uncertainty** | The shot-to-shot variation you give Kyvos such as velocity SD, wind SD and wind-call error. It is what turns a trajectory into a probability |
| **Wind Call Error SD** | How far your wind *call* is from the true wind, as 1σ. Litz puts it at 0.5, 1.25 and 2 mph for high, medium and low confidence. Distinct from wind variability. It moves the shot sideways by the wind's drift and up or down by its aerodynamic jump |
| **Wind Call Error Floor / Growth** | Manteis's wind call error. Its 1σ at each crosswind is √(floor² + (growth × wind)²). Growth starts at 0, so the error is the floor at every wind until you raise it. Unlike Kyvos's Wind Call Error SD it also carries the wind changing, so Manteis has no separate gust |
| **Transonic Limit** | Range where the bullet slows to Mach 1.2. It may cap effective range before dispersion does |

### Cartridge & Seating

| Term | Meaning |
|---|---|
| **COAL** | Cartridge Overall Length. The measured length of your loaded round |
| **SAAMI OAL** | The published maximum overall length. A ceiling rather than your measurement |
| **Mag COAL** | The longest round a given magazine will feed |
| **CBTO** | Cartridge Base to Ogive. More repeatable than COAL for setting seating depth |
| **Jump** | How far the bullet moves before it meets the rifling: the lands' CBTO less the load's, on one comparator. A firearm's lands log gives it per load. Ignition simulates every load with a fixed 0.067 in |
| **Case Capacity** | Water the fired case holds, in grains. The volume the charge is burned in |
| **Usable Capacity** | Case capacity minus the volume the seated bullet occupies. What the powder actually gets |
| **Case Fill** | The charge's bulk volume as a share of usable capacity. Below 80% is flagged, above 100% is compressed, and outside 60–130% Ignition refuses to run |
| **Bearing Surface** | The full-diameter shank gripping the rifling. Defaults to a third of the bullet length when unmeasured |

### Angular & Ballistic

| Term | Meaning |
|---|---|
| **MOA** | Minute of Angle, roughly 1.047 in at 100 yd |
| **MIL** | Milliradian, 10 cm at 100 m |
| **BC** | Ballistic Coefficient. Resistance to drag. Higher means flatter with less wind drift. G1 and G7 supported |
| **Sg** | Gyroscopic Stability Factor. 1.5 or higher is Stable, 1.1 to 1.5 Marginal and below 1.1 Insufficient. Below 1.0 it tumbles |
| **Spin Drift** | Lateral drift caused by the bullet's rotation. Always the same direction as the twist |
| **Coriolis** | Deflection from the Earth's rotation. Measurable past roughly 800 yd and set by latitude and firing azimuth |
| **Drag Model** | Which reference projectile the BC is quoted against. G7 for boat-tails and G1 for flat-base |
| **IPSC Target** | The official 450 × 570 mm octagon with A / C / D scoring zones (IPSC Handgun Rules, Appendix B2) |
| **Internal Ballistics** | Combustion, pressure and muzzle velocity inside the barrel |
| **External Ballistics** | Drag, wind, drop, spin drift and Coriolis after the muzzle |

### Heurisko Tools

| Term | Meaning |
|---|---|
| **Ignition** | Internal-ballistics pressure and velocity engine with SAAMI and C.I.P. safety audits |
| **Varytita** | Drop, drift and velocity chart, a DOPE-card tier and a Field tier for target lists |
| **Kyvos** | Hit-probability trajectory simulator |
| **Strovilos** | Gyroscopic stability (Sg) calculator |
| **Manteis** | Empirical hit-probability comparison across many saved sessions |
| **DOPE** | Data On Previous Engagement. A drop and drift correction card, Varytita's third tier |
| **MPBR** | Maximum Point Blank Range. The no-dial zero keeping impacts in a vital zone |

### Technical

| Term | Meaning |
|---|---|
| **PWA** | Progressive Web App. An installable fully offline version of the app |
| **IndexedDB** | The in-browser database where all your data is stored locally |

---

## Community & Support

Join the **Empirical Precision Discord** for load discussion, bug reports and feature requests: **[discord.gg/adymGUfjst](https://discord.gg/adymGUfjst)**. It is also linked from the Dashboard.
