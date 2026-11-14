# Empirical Precision: A No-Nonsense Approach to Shooting Analysis

This guide provides a structured methodology for evaluating precision shooting performance. It is intended to assess a rifle system through objective, repeatable techniques.

---

## BLUF: Bottom Line Up Front

Real analysis is neither cheap nor easy. Mid-tier modern rifles can often exhibit exemplary performance, and surpassing those capabilities requires significant discipline. There are no shortcuts, gadgets, lucky charms, or rituals to simplify precision shooting. Anyone telling you differently is trying to sell you something. 

---

## Historical Context: Transitioning from Anecdotal to Statistical Evaluation

I fondly remember the day my father had me zero my own rifle. We used a simple, unquestioned method: fire three shots, adjust the scope, and repeat until the shots were "dead nuts on," while maybe throwing out a few shots I must have "pulled." We left the range that afternoon with maybe just a little less than half a box of .30-30 Super-X still in the yellow cardboard box. Not only was it a form of a rite of passage, it "just worked." For years, I carried that tradition forward, relying on three-shot and five-shot groups to tell me everything I thought I needed to know about a rifle. It was cheap, it was simple, and it was the way it had always been.

Time passed, the targets stretched further out, the rifles changed, and the old ways began to show their cracks. But the process still "just worked"... didn't it? Then the internet arrived, bringing with it a flood of forum posts, competing theories, and endless arguments over what "just worked." Everyone had a system that "just worked," yet somehow, many claimed their system was the only one that "just worked." I happened to start reading about competition shooting, F-class, and benchrest. I always knew these groups existed, but I just thought it was good ol' boys with more money than sense playing with shiny rifles and reloading to save money. Turns out these competitors are serious. They are the real deal, and they all have a system... and it "just worked." It caused a reckoning in me. No longer was a process that "just worked" good enough. I wanted to know exactly how well it worked. How well your process works compared to mine. How can I change my process to make it just work better? Did the change actually make an improvement? Then I had a second reckoning. I made a pan of white-trash lasagna. I took a square from the corner. It was as close to perfect as I have ever made in the realm of white-trash-style lasagna; browned on the top with crispy cheese on the sides. It was not too sloppy but not too dry. Just what I wanted. Then I saw a cut from near the center... it was still cold. The cheese wasn't even melted. How could this be?  It was obvious.  I have no right to claim my lasagna is perfect based only from the single square I cut from my favorite corner.  

The nostalgia of those early range days is a great memory. One of my favorites. But what worked for a Stevens .30-30 with ammo bought from the local hardware store wasn't working for me anymore. Extraordinary claims require extraordinary evidence. So let's go get some evidence.

---

## Terminology of Key Metrics

To execute any modern evaluation, you must understand the exact definitions of the metrics used to track performance.

| Term | Definition | Application in this Methodology |
| :--- | :--- | :--- |
| **Extreme Spread (ES)** | The distance between the centers of the two furthest shots in a group. | Used primarily to diagnose massive hardware failures early on; otherwise discarded as a metric for group sizes because it ignores the majority of the data. |
| **Mean Point of Impact (MPI)** | The calculated geometric center of a dataset of shots, derived from the average of all X and Y coordinates. | The dynamic center point from which all radial distances are measured. |
| **Mean Radius (MR)** | The average distance of all shots from the Mean Point of Impact. | The primary statistical indicator of dispersion size (smaller is better) and the core variable used for evaluations. |
| **Velocity SD ($SD_{MV}$)** | The Standard Deviation of muzzle velocities within a batch. | An indicator of internal ballistic consistency: one input to vertical dispersion at long range, never a substitute for measuring the dispersion itself. |
| **Sample Size (n)** | The cumulative total number of recorded shots for a specific recipe. | Dictates the statistical power of the evaluation framework (e.g., the test comparing two Mean Radii). |
| **Confidence Interval (CI)** | A mathematical range representing the margin of error around your calculated average (e.g., a 95% CI). | Shows how far the true value may sit from your average. Heavily overlapping intervals mean no winner yet; whether two recipes truly differ is a question for a test of the difference. |
| **p-value** | The probability of seeing a gap at least this large between two recipes if they truly performed the same. | Evidence that a gap is real, not the probability that one recipe is better. Method 3 eliminates on it, against a threshold adjusted for the number of recipes and looks. |

---

## Statistical Foundation: The Law of Large Numbers

The Law of Large Numbers (LLN) posits that as the number of observations increases, the sample mean approaches the true mean. 

* **Randomness in the Short Run**: The small collections in a short-run are inherently uncertain.
* **Convergence in the Long Run**: Regardless of the initial conditions, all systems will eventually converge to the same long-run level.

To understand why small shot groups lie to you, you have to understand how the LLN governs reality in other industries. Here are examples of the Law of Large Numbers in the wild:

**1. The Casino's Edge (Variance vs. Truth)**
A gambler walks up to a roulette table, bets on black, and wins three times in a row. In this tiny sample size ($n=3$), black has hit 100% of the time. The gambler thinks he has discovered a winning system. The casino owners, however, aren't panicking. They trust the Law of Large Numbers. They know that over 10,000 spins, the true probability (47.4% for black on an American wheel) will inevitably emerge, and the house will smoothly extract its 5.26% mathematical edge. 
* *The Shooting Parallel:* A tiny 3-shot group is just a gambler hitting black three times. It feels like a permanent system, but it is just a temporary, lucky clustering of statistical noise.

**2. The Coin Flip (The Illusion of Precision)**
If you flip a perfectly balanced coin 10 times, getting 8 heads and 2 tails is an entirely plausible outcome. If you stop testing there, your data tells you the coin is rigged to land on heads 80% of the time. But if you flip that exact same coin 10,000 times, the results will aggressively smooth out and converge onto a 50/50 split. 
* *The Shooting Parallel:* Your 5-shot "bug hole" group is just 8 heads in a row. It does not reflect the rifle system's true mechanical capability; it only reflects a momentary anomaly that will vanish as round count increases.

**3. Medical Trials (Life and Death Math)**
If a pharmaceutical company gives a new, experimental heart medication to only 5 people, and 4 of them see their symptoms vanish, no regulator will approve the drug. Why? Because a sample size of 5 is entirely too small to separate the drug's actual effect from random chance (perhaps those 4 patients simply had stronger immune systems). Regulators require large controlled trials to wash out the "noise" and isolate the true mathematical effect of the medication. 
* *The Shooting Parallel:* You should not make expensive, barrel-burning decisions about your equipment based on a sample size that the scientific community would laugh at.

---

## The Geometry of Dispersion: Normal and Rayleigh Distributions

To truly comprehend your rifle's capabilities, you must understand how shots disperse over a large sample size. In a stable, optimized rifle system, the physical impacts of the bullets will naturally form a **Bivariate Normal Distribution**—essentially a two-dimensional bell curve overlaid on your target.

When you fire a statistically significant number of rounds, the shots do not land uniformly across the group size. Instead, they cluster heavily around the Mean Point of Impact (MPI). Each axis on its own follows the Empirical Rule (the 68-95-99.7 rule): horizontally, 68% of your shots fall within one standard deviation of the MPI, 95% within two and 99.7% within three, and the same holds vertically.

Distance from the MPI behaves differently. A miss distance cannot be negative, so measured as a radius the shots follow the Rayleigh distribution below, which skews to the right. With equal horizontal and vertical spread (each with standard deviation σ):
* **About 39% of your shots** fall within 1σ of the MPI.
* **About 86%** fall within 2σ.
* **About 99%** fall within 3σ.

The Mean Radius itself is about 1.25σ. So about 14% of all shots land more than 2σ out, and a 5-shot group has roughly even odds of holding at least one of them. When you see a "flier" in a 5-shot group, you are often just observing that tail showing up on schedule. Over a large enough sample size, that flier is no longer an anomaly; it is a predicted mathematical certainty.

### The Rayleigh Distribution (The Math of Radial Misses)
You must also recognize how distance from the center behaves. Because a physical distance cannot be negative (you can't have a miss of -1 inches), radial miss distances are constrained at zero. When you map the radial distance of every shot from the center, the data naturally skews to the right, forming a **Rayleigh Distribution**. Understanding this prevents shooters from panicking when they see a disproportionate number of shots landing slightly further out from the exact center than a standard bell curve would predict.

---

## Data-Driven Methodology: Every Shot Matters

All shots contribute valuable information. Discarding data, such as outliers (fliers), compromises data integrity. Record every shot you fire. The decision to exclude data points from the analysis should not be taken lightly and must be carefully considered and justified. Removing data points can lead to biased or misleading conclusions, undermining the integrity of research or analysis.

* **Bias and distorted results**: Removing shots that don't fit a desired outcome can skew results, creating a distorted picture of the data and leading to inaccurate conclusions.
* **Loss of valuable information**: Fliers or unusual shots might represent valuable information that could shed light on unexpected phenomena, errors in data collection, or even reveal insights about the rifle system.
* **Reduced statistical power**: Removing data can decrease the variability in the dataset, which in turn reduces statistical power and potentially impacts the ability to detect true effects or relationships.
* **Compromised transparency and reproducibility**: "Rationalizing" reasons for excluding data points compromises transparency and reproducibility, making it difficult to understand and/or replicate the analysis. Examples of data to exclude would be something like sighter, warm up, and fouling shots. But once you commit to printing shots... record the shots.

---

## Comparing Extreme Spread vs. Mean Radius

Extreme Spread (ES) measures the distance between the two furthest shots, analyzing only the two worst shots. This is a less useful form of analysis. If you are printing 3-shot groups, there is no other data to derive from the group. If you are printing 20-shot groups, there are significantly more tools that make use of EVERY shot.

ES remains useful for diagnosing significant malfunctions. For instance, a $7,000 rifle advertised as sub-0.5 MOA yielding a 6-inch ES after three shots suggests issues such as unsecured optics or defective ammunition, requiring no further testing to identify a problem. It should be understood that if the group is "bad" there is no reason to continue testing unless you just want to prove how bad the group is. Example case might be where you print a 6-inch group at 100 yards. The single variable you change is scope rings. You return to test, and the first 3 shots are 5 inches. No point wasting shots; three shots is enough to prove that changing the scope rings didn't turn it from a 6-MOA system to a 0.5-MOA system.

**Mean Radius (MR)** calculation involves determining the group center (Mean Point of Impact), measuring each shot’s distance using the formula $\sqrt{((x_2 - x_1)^2 + (y_2 - y_1)^2)}$, and computing the average. Don't panic, modern technology simplifies this process. MR offers a more thorough assessment by averaging the distance of each shot from the group’s center, rather than focusing on the two most extreme shots. When using ES you might be tempted to exclude a "flier" because you realize that one data point is VERY significant to the results. In using MR any "flier" is much less significant because MR uses averaging... and that's the point.

---

## Internal Ballistics: The Velocity Factor

While Mean Radius measures external dispersion (where the bullet physically lands), a 100-yard Mean Radius does not tell the whole story. At 1,000 yards, a load with a tiny Mean Radius at 100 yards will fall apart if the muzzle velocity is erratic. Chronograph statistics belong in the analysis. They are an input to dispersion, not a substitute for it, and the target has the final word (see *Velocity Is a Means, Not the Target* below).

* **Velocity Standard Deviation ($SD_{MV}$):** It matters at long range. An $SD_{MV}$ under 10 feet per second (fps) is the long-range standard. At 1,000 yards a 6.5 Creedmoor match bullet strikes about 0.3 inches lower for every fps it is slow, so an SD of 10 fps is 3 inches of vertical at one standard deviation and an SD of 25 fps is nearly 8. That is disastrous at that distance. But it is one input among several, it is measured with noise, and at 100 or 300 yards it is almost none of the vertical you see.
* **Velocity Extreme Spread ($ES_{MV}$):** ES is a weak number for velocity too. It grows with the number of shots, it rests on the two most extreme readings, and those readings carry the chronograph's own error. Use it the way this guide uses group ES: to catch a gross failure early. A single slow round will drop below the plate at 1,200 yards if it really was slow, and the target at that distance will say whether it was.

---

## Establishing a Hardware Baseline

A baseline represents the rifle system’s performance in a **strictly defined physical state**. When you establish the baseline, you will always be able to reference that baseline to compare all future component changes. 

However, it is critical to understand that this baseline is tied entirely to the hardware configuration at the time of testing. **You must completely solidify your rifle system before starting a rigorous evaluation.** You can completely invalidate your results by making a significant physical change to the rifle mid-test. Changing the scope, swapping the stock, replacing scope rings, or installing a new trigger fundamentally alters the system's physical attributes and interface. 

For example, if you are halfway through testing a batch of ammunition and you install an upgraded, lighter trigger, your group sizes might suddenly shrink. The new data will make those later ammunition recipes look mathematically superior. In reality, the improvement came from your upgraded trigger control reducing human error, not from the ammunition itself. You will have permanently corrupted your dataset because you are no longer comparing apples to apples. If you change the hardware, your previous baseline is void, and you must establish a new one.

---

## Managing Session-to-Session Variance (Environment)

Because establishing statistical significance requires shooting multiple blocks of ammunition over time, you must be acutely aware of external factors that can skew your data between range trips. You are evaluating the load components, not the weather, but the weather *will* affect the components.

**1. Temperature (The Undisputed King of Session-to-Session Variance)**
* **Internal Ballistics:** Critical. If you develop a load during a hot July session and then take that same ammo on a freezing November hunt, you will likely see a massive drop in muzzle velocity. In Hodgdon's test of its temperature-stable Extreme powders against fifteen others, the others moved 26 to 166 fps between 0°F and 125°F and the Extreme powders 4 to 20 fps (the numbers are in *Load Development* below). Conversely, ammo left sitting in a hot car or chambered in a hot gun between strings of fire can spike pressures to dangerous levels. Temperature stability of your powder is the single biggest internal variable between sessions.
* **External Ballistics:** Critical. Temperature swings radically change air density from month to month. Your bullet will strike significantly lower in dense, cold winter air compared to thin, hot summer air, meaning your 500-yard DOPE (Data On Previous Engagements) from August will be completely wrong in December.

**2. Elevation / Station Pressure (The Baseline Shifter)**
* **External Ballistics:** Major. If your multiple sessions take place at different geographic locations (e.g., zeroing your rifle at your home range at 500 feet above sea level, then traveling to a match or hunt at 6,000 feet), barometric pressure and elevation become your biggest external hurdles. The thinner air at high elevations drastically reduces aerodynamic drag. Your rifle will shoot much flatter, and you will need to recalculate your entire drop table.
* **Internal Ballistics:** None.

**3. Humidity (The Storage Killer)**
* **Internal Ballistics:** Moderate to Severe. While atmospheric humidity still barely affects a bullet in flight, storage humidity between sessions is a major issue. Brass casings are not hermetically sealed unless you seal them yourself. If your ammo or unburnt powder sits in a humid garage or damp basement for months between sessions, the powder can degrade, resulting in erratic velocities, hang-fires, or complete duds.
* **External Ballistics:** Minor. Still mathematically insignificant for trajectory unless you are shooting extreme long ranges.

**4. Wind**
* **External Ballistics:** Moderate (Contextually). Wind is still the hardest thing to read while you are shooting, but it ranks lowest for session-to-session variance because it is not a baseline shift. You don't have to change your rifle's zero or rewrite your drop charts between sessions just because it was windy last Tuesday. You simply hold for the wind you have in that exact moment.

---

## Load Development: What Survives the Evidence

Load development is where most of the superstition in this hobby lives. Every method has a following, and every one of them "just works" for the people who use it. This guide asks every method the question it asks of a 3-shot group: does it hold up when the sample gets large?

The evidence below is ranked. First come controlled tests with large samples: Bryan Litz and Applied Ballistics (*Modern Advancements in Long Range Shooting*, vols. I–III) and Hornady's ballistics lab. Then come government ballistics research (the Army Research Laboratory and its predecessor, the Ballistic Research Laboratory) and arithmetic anyone can check. Forum consensus comes last, and nothing here rests on it. Where a number was computed rather than quoted, it says so.

### Nodes, Ladders and "Flat Spots"

The Audette ladder, the Satterlee 10-shot velocity ladder and Optimal Charge Weight (OCW) all hunt for a *node*: a band of charge weights where velocity or point of impact stops changing, so that small charge errors stop mattering. The methods do not even agree on what a node is. Satterlee reads the chronograph. Audette and OCW read the target.

* **Litz repeated the ladder.** Applied Ballistics ran the same ladder test more than once (vol. III): *"A single pass of a ladder test will always show one or more relative flat spots, however those are not in the same place each time the test is repeated."*
* **Hornady's lab found the same thing from the other end.** Nodes that appeared in small samples disappeared as the samples grew. Their guidance is to judge a load on 20 to 30 shots, not 3 to 5.
* **Chance alone makes flat spots.** Simulate a rifle whose velocity rises in a perfectly straight line with charge (60 fps per grain, 0.2 gr steps, 12 fps a step) and give it a true SD of 8 to 10 fps. A 10-shot Satterlee ladder shows three consecutive shots within 10 fps of each other in **39% to 44%** of runs (computed, 200,000 ladders per SD). That rifle has no node. It has noise.

**The verdict:** a flat spot in a one-shot-per-step ladder is noise until a large sample says otherwise. Choose a charge for its velocity and its pressure margin, then prove it with the sample sizes below.

### Optimal Barrel Time and Barrel Harmonics

Barrel motion is real, and it moves shots: the Army Research Laboratory measured a stiff barrel cutting both muzzle motion and the dispersion it causes, against a standard M4 (Celmins, ARL-TR-5540, 2011). What has no controlled support is the narrower claim that a load groups because its bullet leaves at one of a few "optimal" barrel times (Chris Long's OBT). The predicted good times sit only 0.08 to 0.13 ms apart, against barrel times of 1.0 to 1.5 ms, so every load ever fired sits within about 5% of one of them. A theory that fits every load predicts none.

### Velocity SD: What It Buys You

This table turns SD into what you see on target. It was computed with this app's trajectory engine: 100-yard zero, standard sea-level air, the zero held while the velocity varies, as it does shot to shot.

| Load | Vertical per fps at 400 / 600 / 1,000 yd | A 10 fps SD at 400 / 1,000 yd (1 SD) |
| :--- | :--- | :--- |
| 6.5 Creedmoor, 140 gr ELD-M at 2,700 fps | 0.034 / 0.086 / 0.31 in | 0.34 / 3.1 in |
| .308 Win, 175 gr SMK at 2,650 fps | 0.039 / 0.100 / 0.40 in | 0.39 / 4.0 in |

Precision Rifle Blog measured 0.28 inches per fps for a 6.5 Creedmoor match load at 1,000 yards, in agreement.

* **At long range SD matters, and it is not alone.** Litz: *"A MV SD of 10 fps has a comparable effect on vertical dispersion as 1.0 percent SD in BC."* Premium match bullets run 0.4% to 0.6% BC SD, typical bullets 0.8% to 1.2%. Below about 5 fps of velocity SD, the bullets add as much vertical as the powder.
* **At practical ranges, wind swamps it.** In Litz's *Maximum Effective Range* paper, a 10 fps velocity error moved a 300-yard shot 0.16 inches. A 2 mph error in the wind call moved the same shot 2.51 inches.

### Velocity SD: What It Costs to Know

A standard deviation from a handful of shots is a guess with a wide margin. The true SD lies between these multiples of the one you measured, 95% of the time (the chi-square interval; NIST *e-Handbook of Statistical Methods* §1.3.5.8):

| Shots | True SD lies between |
| :--- | :--- |
| 5 | 0.60× and 2.87× the measured SD |
| 10 | 0.69× and 1.83× |
| 20 | 0.76× and 1.46× |
| 30 | 0.80× and 1.34× |
| 50 | 0.84× and 1.25× |

A 5-shot SD of 9 fps is consistent with a true SD anywhere from 5.4 to 26 fps.

Comparing two loads is harder. To tell two SDs apart with an F test (5% significance, detected 80% of the time), you need about **20 shots per load** when one SD is twice the other, about **55** when they differ by 2:3 (10 fps against 15), and about **100** when they differ by 3:4 (computed). Most claims that a primer or a brass change "cut my SD" rest on ten shots.

Extreme spread is worse, because it grows with the number of shots. The expected ES of normally distributed velocities is 1.69 SD at 3 shots, 2.33 at 5, 3.08 at 10, 3.73 at 20 and 4.09 at 30 (computed; the distribution of extreme spread is worked out in Taylor & Grubbs, BRL-MR-2438, 1975). An ES from five shots and an ES from twenty cannot be compared at all.

### Velocity Is a Means, Not the Target

The goal is hits, which means total dispersion at the distance you shoot (see *WEZ* below). Velocity SD is one input to it. It is measured with noise, it is not the only source of vertical, and at most distances it is not the largest. Chasing a lower SD at the expense of a smaller group is a bad trade.

* **The chronograph's own error is inside every SD it reports.** Garmin specifies its Xero C1 Pro radar at ±0.1% of velocity for rifles, which is ±2.8 fps at 2,800 fps. Garmin does not say whether that is a limit or one standard deviation. Either way it adds root-sum-square: if it is one standard deviation, a measured 5 fps SD is about 4.1 fps of ammunition, and a measured 4 fps is 2.9. Below about 5 fps, the instrument is a large part of the number.
* **Velocity is not the only thing that moves a shot up and down.** The rifle's mechanical precision, the bullets' own BC variation (Litz: 1% of BC SD acts like 10 fps of velocity SD), the shooter, and how the muzzle happens to be moving at the instant the bullet leaves all put vertical on the target. None of them shows on a chronograph. A shot's recorded velocity and its height on the target are never perfectly correlated, and at short range they are barely correlated at all.
* **At short range velocity is invisible.** For the 6.5 Creedmoor load above, each fps moves the shot 0.002 inches at 100 yards, 0.008 at 200 and 0.018 at 300 (computed). A 30 fps extreme spread moves a 100-yard shot 0.05 inches. Vertical stringing at 100 yards is not velocity.
* **Chasing SD can cost you dispersion.** Take two loads in the same 6.5 Creedmoor. Load A has a 4 fps SD and groups 1.0 MOA. Load B has a 9 fps SD and groups 0.4 MOA (5-shot groups at 100 yards, whose extreme spread averages 3.09 standard deviations). Their total vertical, at one standard deviation (computed):

| Distance | Load A: SD 4 fps, 1.0 MOA | Load B: SD 9 fps, 0.4 MOA | Velocity's share of B's vertical |
| :--- | :--- | :--- | :--- |
| 100 yd | 0.34 in | 0.14 in | 1% |
| 300 yd | 1.02 in | 0.44 in | 14% |
| 600 yd | 2.06 in | 1.12 in | 47% |
| 1,000 yd | 3.60 in | 3.06 in | 80% |

Load B, with more than twice the SD, has the smaller vertical at every distance to 1,000 yards. Its horizontal is smaller too, because velocity adds almost nothing sideways. A load is not better because its SD is lower. It is better when it puts more shots on the target at your distance.

### Finding a Velocity Problem on Paper

If velocity is costing you hits, the target will show it. Shoot at a distance where velocity matters, 600 yards or farther. Record each shot's velocity beside its impact (this app pairs chronograph readings with marked shots, and its Analysis page runs the checks below as *Velocity vs Height*). Then check three things:

1. **Low shots should be slow shots.** A shot's expected height is its velocity's difference from the mean times the vertical per fps: 0.086 inches at 600 yards and 0.31 at 1,000 for the load above. If velocity drives your vertical, the observed heights follow the predicted ones.
2. **Test the correlation, with enough shots.** With 20 shots, the correlation between velocity and height has to exceed about 0.45 before it means anything at the 5% level. With 30 shots it has to exceed 0.36 (computed). When velocity is half the vertical, as for Load B at 600 yards, the expected correlation is about 0.7 and it shows. When velocity is 3% of the vertical, as for Load A, the expected correlation is about 0.17 and it never will.
3. **If the paper does not show it, velocity is not your problem.** A lower SD will not shrink a group whose vertical comes from somewhere else. Work on what the target shows.

### Case Fill

The common rule is to choose the powder that fills the case at maximum pressure. There is a mechanism behind it: in a partly empty case, where the powder lies changes the result. A Naval Postgraduate School study found forward ignition in .30-06 and 7.62 NATO cut pressure by up to 6,300 psi and added 35 fps at the same charge (Culver & Burns, 1972).

But Applied Ballistics tested five cartridges, from .223 Remington to .338 Lapua, at 80%, 90% and 100% fill, and found no systematic SD advantage at 100%: *"The highest MV SD was in fact measured in an 80% fill ratio load. However, the lowest MV SD was also measured for a different 80% load!"*

**The verdict:** a full case is a sound default, because it usually means a burn rate matched to the case. It does not guarantee a low SD, and it is not a reason to pass over a powder that tests better.

### Temperature

Hodgdon's own test fired each load at 0°F, 70°F and 125°F. It is a maker's test of its own product, so read it with that in mind. The independent test below also finds Varget and H4350 moving well under 1 fps per °F. A few rows:

| Load | Powder | Velocity spread across the three temperatures |
| :--- | :--- | :--- |
| 30-06, 165 gr | H4350 | 4 fps |
| | IMR 4350 | 67 fps |
| .308 Win, 168 gr SMK | Varget | 8 fps |
| | Winchester 748 | 114 fps |
| .300 Win Mag, 180 gr | H4831SC | 10 fps |
| | IMR 4831 | 127 fps |

* Precision Rifle Blog soaked ammunition for 8 hours at each temperature and fired 10 shots at each: Varget in 6 Dasher moved 0.136 fps per °F and H4350 in 6 Creedmoor 0.140 fps per °F between 5°F and about 105°F.
* The Ballistic Research Laboratory fitted military ball and IMR propellants from −65°F to 160°F: velocity changes by about 0.04% per °F, or about 1.1 fps per °F at 2,800 fps (Wagoner, BRL-MR-3825, 1990).
* **What it costs:** a 40 fps shift, a 40°F swing with a 1 fps/°F powder, moves a 6.5 Creedmoor 140 gr bullet 1.4 inches at 400 yards and 12 inches at 1,000 (computed as above). That is four times the vertical of a 10 fps SD.
* A load worked up to maximum on a cold day is over maximum on a hot one.

### Pressure Signs

Denton Bramwell fired 28 rounds, from 35,000 to 65,000 psi, against a strain gauge and measured the usual signs on every case (instrumented, not peer-reviewed). Pressure-ring expansion explained only 42.6% of the measured pressure, and a single ring diameter was consistent with anything from 44,000 to 73,000 psi. The one-shot error of each method:

| Method | One-shot error (1 SD) |
| :--- | :--- |
| Case-head expansion | 7,500 psi |
| Pressure-ring expansion | 6,800 psi |
| Copper crusher | 1,827 psi |
| Piezo transducer | 1,366 psi |
| Strain gauge | 667 psi |

Published data and a pressure trace can find a maximum. Brass cannot.

### Components: What Measurably Matters

* **Neck tension.** Litz took neck tension from .001 to .003 inches: SD fell from 9 to 6 fps in .223 and from 13 to 7 fps in .243, and the .308, already at 7 fps, did not change. Heavier tension was never worse.
* **Powder lot.** Four lots of Varget in the same .223 loads: the three faster lots ran 23 to 46 fps faster than the slowest with a 69 gr bullet, and 8 to 15 fps with a 53 gr bullet (Courtney & Courtney, arXiv:1501.07163). Check velocity again on every new lot, even of a powder sold as lot-consistent.
* **Your scale.** Independent errors add root-sum-square; the Army Research Laboratory builds its velocity error budgets that way (Strohm, ARL-TR-6494, 2013). At 52 fps per grain, a 0.05 gr scale error adds 2.6 fps: it lifts a 12 fps load to 12.3 and a 5 fps load to 5.6. A 0.10 gr error lifts the 5 fps load to 7.2 (computed). A better scale shows only when everything else is already good.
* **Brass capacity.** Fifty cases from one lot varied 0.26% in capacity (1 SD) after one firing and 0.14% after four, and case weight did not predict capacity (Ammolytics, 6.5 Creedmoor). Sort by water capacity or fire-form, not by weight.
* **Primers.** The primer alone drives the bullet into the rifling before the powder has burned (Ritter & Beyer, ARL-TR-7479, 2015). A primer is part of the charge. Test it as one.
* **Seating depth.** One .223 rifle fired 400 rounds over ten charges and six seating depths: charge mattered, charge and depth together mattered, and depth alone did not (Anderson, Boneh & Grevstad, arXiv:0905.0727). One rifle proves nothing general. Test depth in yours with the same sample-size rules as anything else.
* **Annealing, full brass prep, bullet sorting.** No controlled test was found either way. Treat each as a hypothesis to test, not a step to take on faith.

### For Hunters

* **The bullet sets the range, not the energy.** A hunting bullet needs a minimum impact velocity to open, and the makers publish it: Nosler AccuBond 1,800 fps, AccuBond Long Range 1,300; Berger's hunting bullets 1,800; Hornady CX 2,000; Swift A-Frame 1,650. A 6.5 Creedmoor 143 gr ELD-X leaving at 2,650 fps falls to 1,800 fps at about 630 yards, and 100 fps less at the muzzle brings that in by about 70 yards (computed).
* **SD barely matters inside 400 yards. Temperature does.** A 10 fps SD adds about a third of an inch of vertical at 400 yards. A summer zero and a 40°F-colder morning can move the same bullet an inch and a half with an ordinary powder.
* **Energy floors are a rule of thumb.** Figures like 1,000 ft-lb for deer come from Townsend Whelen's experience, not a measurement; what kills is a bullet that opens and reaches the vitals. Some are law, though (Colorado requires 1,000 ft-lb at 100 yards for deer and elk), so know yours.

---

## Range Data Collection Protocol

Before choosing a statistical analysis framework, you must establish strict range discipline and data handling procedures. Garbage data in yields garbage data out.

* Conduct testing in a controlled environment to minimize variables. Utilize a stable rest at an indoor facility if possible, or shoot prone with sandbags. Control for all the variables you can, and never change more than one variable at a time.
* Choose a target that is easy to read, and if possible, easy to take back home with you. Analysis is easier at home on the coffee table than in the field.
* Position impacts away from your point of aim. It is very possible to shoot out your POA, making it harder to maintain a consistent hold.
* Record each shot’s horizontal (X) and vertical (Y) distance from the point of aim. Adjusting the scope so impacts are above and to the right of the point of aim is highly beneficial. On a grid, up (Y) and right (X) can both be positive integers, which keeps all the math in the realm of "natural" numbers and avoids negative coordinate confusion.

### The Raw Data Architecture
Rather than calculating and storing averages of previous averages (which artificially shrinks variance and destroys degrees of freedom), the shooter's database—whether hand-calculated on paper, tracked in a spreadsheet, or managed via a sophisticated database—stores the absolute, raw data for every shot fired. Each entry records the exact horizontal ($x$) offset and vertical ($y$) offset. All subsequent statistical analysis is drawn directly from this continuously growing master pool of raw coordinates.

### The Iterative Block Protocol
To mitigate the effects of barrel heat, shooter fatigue, and logistical chaos, multi-phase testing is conducted in blocks. A block is simply a physical batch of ammunition fired in a single session to add individual data points to your growing master database. The size of the block does not dictate your statistical power—the total accumulated database does. However, the size of the block you choose comes with practical and environmental trade-offs:

* **3-Round Blocks:** * *Pros:* Extremely fast to shoot, minimal barrel heat, conserves components early on. 
  * *Cons:* Logistically tedious and environmentally exposed. Tracking 10 different recipes of 3 rounds each on a single target is much harder to keep organized than tracking fewer recipes of larger counts. Furthermore, it causes environmental fragmentation. If you need 30 rounds for a full dataset, shooting 3-round blocks means you are spreading that recipe across 10 different range trips. Mixing a 3-round block fired on a hot July day with another fired on a freezing November day introduces massive environmental noise into that recipe's database.
* **5-Round Blocks:** * *Pros:* The logistical "sweet spot." Standard ammo boxes are divided into rows of 5, making bench organization simple. It is easier to track 6 different recipes of 5 rounds (30 total rounds) per range session than juggling 10 different recipes of 3 rounds. It balances component usage while reducing the number of total sessions (and weather changes) required to build a full dataset.
  * *Cons:* Still requires multiple range trips to complete a robust dataset, leaving the data somewhat exposed to session-to-session environmental shifts.
* **10-Round Blocks:** * *Pros:* Consolidates the dataset into fewer environmental conditions, meaning the majority of your data for that recipe shares the exact same weather and baseline pressure. 
  * *Cons:* Noticeable barrel heat which can induce vertical stringing, increases shooter fatigue, and consumes components faster on losing recipes before you get home to run the math.
* **20-Round Blocks:** * *Pros:* Eliminates day-to-day environmental variance entirely. All data for that recipe is collected under identical atmospheric conditions. 
  * *Cons:* Severe barrel heat, high fatigue, and wastes significant components if the recipe was inherently flawed by shot three.

---

## Statistical Evaluation Frameworks

To move from conceptual math to a rigorously applied scientific study, there are a couple of different methods to use. Because we are dealing with samples, you must employ **Confidence Intervals (CI)** when analyzing results. If Recipe A has a Mean Radius of 0.35 inches [95% CI: 0.28, 0.42] and Recipe B has an MR of 0.38 inches [95% CI: 0.31, 0.45], the intervals overlap heavily: you cannot yet declare a winner without firing more rounds. The reverse does not hold either way: two intervals that overlap a little can still hide a real difference, so compare recipes with a test of the difference rather than by eye. Keep this margin of error in mind when selecting a framework.

### Method 1: The Fixed-Sample Brute Force Method (Easiest)

This is the most straightforward, "set-and-forget" approach to statistical analysis. You choose a robust sample size upfront, load every single round before hitting the range, and shoot the entire batch to establish a complete dataset for every recipe in a single phase.

#### Execution Directions
1. **Select a Target Sample Size:** Choose a statistically significant round count per recipe (e.g., 30 to 35 rounds per combination).
2. **Load Everything Upfront:** If you are testing 5 different component recipes, load 35 rounds of each (175 rounds total).
3. **Fire in Structured Blocks:** To prevent barrel heat or shooter fatigue from biasing a single recipe, do not shoot all 35 rounds of Recipe A in a row. Instead, shoot them in interleaved blocks (e.g., a 5-round block of Recipe A, then a 5-round block of Recipe B, rotating through until all 175 rounds are fired).
4. **Analyze the Final Pool:** Once every round is recorded, paste all the raw coordinates into your analysis software or spreadsheet. Calculate the final Mean Point of Impact (MPI) and Mean Radius (MR) for each recipe. The recipe with the smallest cumulative MR is your winner.

#### Pros and Cons
* **Pros:** * *Zero Math at the Range:* No need to run calculations between strings; you just pull the trigger and log data.
    * *No Premature Elimination:* Ensures every recipe gets a complete, fair trial over a large sample size, preventing a recipe from being dropped early due to a single bad block caused by user error.
* **Cons:**
    * *High Component Waste:* If Recipe C is inherently terrible, you will still end up loading and shooting all 35 rounds of it, wasting powder, primers, bullets, and barrel life on a known loser.
    * *High Logistics/Fatigue:* Requires preparing and firing a massive volume of ammunition upfront.

### Method 2: The Two-Phase Screening Method (The Balanced Filter)

This method acts as a middle ground, using a small-sample "screening" phase to weed out obviously poor performers before committing heavy components to the top contenders.

#### Execution Directions
1. **Phase 1 (Screening):** Load a small, uniform block for every recipe—typically 10 rounds each. 
2. **Execute and Filter:** Fire the 10-round blocks. Calculate the initial MR for each recipe. Eliminate the worst-performing options immediately (e.g., if you started with 6 recipes, cut the bottom 3).
3. **Phase 2 (Validation):** Take the remaining top-performing recipes and load a much larger validation batch (e.g., an additional 25 rounds each).
4. **Combine and Conclude:** Fire the validation rounds, pool the new data with the Phase 1 data for those specific recipes, and evaluate the final statistical leader.

#### Pros and Cons
* **Pros:**
    * *Saves Components:* You avoid loading heavy volume for recipes that exhibit massive dispersion right out of the gate.
    * *Structured Workflow:* Clearly separates the "exploratory" phase from the "verification" phase.
* **Cons:**
    * *Risk of False Negatives:* Because a 10-round sample size is still subject to statistical noise, an inherently good recipe could accidentally be eliminated in Phase 1 if you happen to experience a string of bad luck or poor environmental conditions during its screening block.

### Method 3: The Sequential Analysis Protocol (The Automated Optimizer)

This is the dynamic, software-driven approach. It treats evaluation as an ongoing tournament, utilizing real-time hypothesis testing to drop losers as early as mathematically possible to preserve components and barrel life.

#### Execution Directions
1. **Load Initial Iterative Blocks:** Load a small initial block (typically 5 rounds) for every recipe in the cohort.
2. **Log and Recalculate:** Fire the blocks, record the raw X and Y coordinates, and update the master database. After a block is recorded, the entire cumulative dataset for that specific recipe is re-evaluated. The geometric center (MPI) is dynamically recalculated, and the radial distance of every historical shot is re-measured to yield the current cumulative MR.
3. **Run Hypothesis Testing:** Identify the "Current Leader" (lowest cumulative MR). Then test every other surviving recipe against it by comparing the two Mean Radii: the squared ratio of two Mean Radii follows an F distribution when the recipes are truly equal, with degrees of freedom set by the shots and the groups they came in. This is the test the app's Analysis page uses to compare loads. The common alternative, a **Welch's t-test** on each shot's radial distance, calls equal loads different too often (about 7.5% of the time in 5-shot groups at a nominal 5%), because radii measured from a shared group center are not independent.
4. **Apply the Statistical Trigger:** Eliminate a recipe when its $p$-value against the leader falls below the threshold for that look. Do not use a plain 0.05. You test again after every block, and the leader is the luckiest recipe of the group, so each extra look and each extra recipe adds a chance of dropping a good recipe by mistake: with four equal recipes, a plain 0.05 at each of six looks drops at least one of them more than half the time. Take each look's threshold from the O'Brien-Fleming table below and divide it by the number of pairs of recipes, recipes × (recipes − 1) / 2. Set every threshold before the first shot.
5. **Repeat the Loop:** Only load and fire the next 5-round block for recipes that survived elimination. Repeat this cycle until only one recipe remains or your maximum sample size is achieved.

**O'Brien-Fleming thresholds** (two-sided $p$-values, 5% overall, equally spaced looks), before dividing by the number of pairs:

| Planned looks | Look 1 | Look 2 | Look 3 | Look 4 | Look 5 | Look 6 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 2 | 0.0051 | 0.048 | | | | |
| 3 | 0.00051 | 0.014 | 0.045 | | | |
| 4 | No cut | 0.0042 | 0.019 | 0.042 | | |
| 5 | No cut | 0.0012 | 0.0084 | 0.022 | 0.041 | |
| 6 | No cut | 0.00037 | 0.0036 | 0.011 | 0.024 | 0.040 |

"No cut" means a threshold below 0.0001, which a few shots almost never clear. Four recipes make 6 pairs, so with six looks of 5 shots the thresholds run from no cut at 5 and 10 shots to 0.040 / 6 = 0.0066 at 30. The early looks protect a good recipe from one unlucky block; the last keeps nearly the power of a plain 0.05. A $p$-value below the threshold is strong evidence against equal performance, not proof, and a recipe dropped early is a calculated risk.

#### Pros and Cons
* **Pros:**
    * *Maximum Efficiency:* Minimizes total component consumption and preserves precious barrel life by cutting losers as soon as the evidence against them clears the threshold.
    * *Strict Statistical Rigor:* Handles varying sample sizes and spreads objectively, with thresholds that hold the overall error rate at 5%.
* **Cons:**
    * *High Administrative Overhead:* Requires you to log data and run statistical calculations between range sessions or loading cycles before you know what to load next.
    * *Environmental Fragmentation:* If a winning recipe takes multiple sessions to confirm, its dataset will span across different days, potentially introducing session-to-session environmental noise (like temperature or air density shifts) into the final numbers.

---

## The Ultimate Goal: Weapon Employment Zone (WEZ) and Hit Probability

Groups on paper are merely a means to an end. The ultimate goal of precision analysis is calculating your true **Hit Probability** at extended ranges. 

WEZ analysis is the capstone of this methodology. It takes your rifle's mechanical dispersion (your calculated Mean Radius), your ammunition's velocity variance ($SD_{MV}$), and your personal environmental uncertainties (wind reading error, rangefinding error) and runs them through a Monte Carlo simulation. 

It translates raw data into a practical, operational reality: *"With this load, I have an 88% probability of hitting a 10-inch plate at 800 yards in a 5 mph wind."* This is the final evolution of precision analysis, proving exactly what your system is capable of when the trigger is pulled.
