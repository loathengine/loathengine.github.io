# Empirical Precision: Scientific Ballistics Reference
This document provides a comprehensive technical overview of the physical and thermodynamic equations, constants, and numerical integration algorithms implemented in the **Empirical Precision** ballistics simulation engines, along with the design decisions justifying why each specific model or engine is used.

---

## 1. External Ballistics Engine (Trajectory Simulator)
The external ballistics engine (implemented in [ballisticsEngine.ts](file:///home/jobelche/Documents/github/EPv4/src/utils/ballisticsEngine.ts)) computes the flight path of a projectile in three dimensions from the muzzle to the target.

### 1.1 The 3-Degrees-of-Freedom (3DOF) Point-Mass Model
The bullet is treated as a point mass with coordinates in three-dimensional space $\vec{r} = (x, y, z)$ and a velocity vector $\vec{v} = (v_x, v_y, v_z)$:
* $x$: Horizontal range along the firing axis (meters).
* $y$: Vertical height above/below the muzzle axis (meters).
* $z$: Cross-range lateral drift/windage (meters).
* $t$: Time of flight (seconds).

The equations of motion are expressed as a system of first-order ordinary differential equations (ODEs):
$$\frac{d\vec{r}}{dt} = \vec{v}$$
$$\frac{d\vec{v}}{dt} = \vec{a}_{drag} + \vec{a}_{gravity} + \vec{a}_{coriolis}$$

#### *Why this model is used:*
1. **Balance of Computational Cost and Accuracy:** A full 6DOF (6 Degrees of Freedom) model tracks the projectile's physical pitch, yaw, roll, and body orientations. However, 6DOF requires detailed aerodynamic coefficients (such as overturning moment, dynamic cross-force, and spin-damping coefficients) which are proprietary or unknown for the vast majority of commercial bullets. 
2. **Superiority over Analytical Approximations (Siacci/Pejsa):** Classic closed-form models like the Siacci or Pejsa methods were developed in the pre-computer era to approximate drop tables using pencil and paper. They fail to handle dynamic atmospheric gradients, varying crosswinds, or Coriolis integrations over long flight paths. 
3. **Stochastic Feasibility:** The 3DOF model provides high-fidelity trajectories (integrating air density, gravity, wind, Coriolis, and spin effects) while executing fast enough to run thousands of iterations within a client-side browser context—critical for real-time Monte Carlo dispersion simulations.

---

### 1.2 Atmospheric Physics & Speed of Sound
Standard aerodynamic drag is modeled relative to the localized air density and the speed of sound.

#### 1.2.1 Vapor Pressure of Water ($p_{vapor}$)
Water vapor reduces the density of air. The vapor pressure of water is modeled using the Magnus-Tetens formula:
$$p_{vapor} = H_{humidity} \cdot 6.1078 \cdot 10^{\frac{7.5 \cdot T_{celsius}}{T_{celsius} + 237.3}} \cdot 100 \quad [\text{Pa}]$$
Where:
* $H_{humidity}$ is relative humidity as a fraction ($0.0 \text{ to } 1.0$).
* $T_{celsius}$ is the ambient temperature in Celsius.

#### 1.2.2 Dry Air Partial Pressure ($p_{dry}$)
$$p_{dry} = p_{total} - p_{vapor} \quad [\text{Pa}]$$
Where $p_{total}$ is the barometric station pressure in Pascals.

#### 1.2.3 Air Density ($\rho$)
$$\rho = \frac{p_{dry}}{R_{dry} \cdot T_{kelvin}} + \frac{p_{vapor}}{R_{vapor} \cdot T_{kelvin}} \quad [\text{kg/m}^3]$$
Where:
* $T_{kelvin} = T_{celsius} + 273.15 \quad [\text{K}]$
* $R_{dry} = 287.058 \quad [\text{J/(kg}\cdot\text{K)}]$ (Specific gas constant for dry air)
* $R_{vapor} = 461.495 \quad [\text{J/(kg}\cdot\text{K)}]$ (Specific gas constant for water vapor)

#### 1.2.4 Speed of Sound ($c_{sos}$)
$$x_w = \frac{p_{vapor}}{p_{total}}$$
$$M_{eff} = M_{dry} \cdot (1 - x_w) + M_{vapor} \cdot x_w \quad [\text{kg/mol}]$$
$$\gamma_{eff} = 1.4 \cdot (1 - x_w) + 1.33 \cdot x_w$$
$$c_{sos} = \sqrt{\frac{\gamma_{eff} \cdot R_{universal} \cdot T_{kelvin}}{M_{eff}}} \quad [\text{m/s}]$$
Where:
* $M_{dry} = 0.028964 \quad [\text{kg/mol}]$
* $M_{vapor} = 0.018015 \quad [\text{kg/mol}]$
* $R_{universal} = 8.314462 \quad [\text{J/(mol}\cdot\text{K)}]$ (Universal gas constant)

#### *Why these atmospheric corrections are used:*
1. **Dynamic Drag Corrections:** Drag is directly proportional to air density ($\rho$). Since density varies heavily with elevation, pressure, temperature, and humidity, static standard atmospheres are insufficient for precision shooting.
2. **Mach-Speed Scaling:** Bullet drag coefficients ($C_d$) change dramatically as the bullet transitions from supersonic ($M > 1.2$) through the transonic barrier ($0.8 \le M \le 1.2$) to subsonic speeds ($M < 0.8$). Because the Mach boundary shifts with the speed of sound, and the speed of sound is highly sensitive to temperature and humidity, calculating a precise, humidity-corrected $c_{sos}$ is mandatory to map the drag lookup tables accurately.

---

### 1.3 Aerodynamic Drag Model
The drag force acts directly opposite to the bullet's relative velocity through the air mass.

#### 1.3.1 Relative Velocity ($\vec{v}_r$)
The velocity of the bullet relative to the wind vector $\vec{w} = (w_x, 0, w_z)$ is:
$$\vec{v}_r = \vec{v} - \vec{w} = (v_x - w_x, v_y, v_z - w_z) \quad [\text{m/s}]$$
Where the wind components are resolved from wind speed ($W$) and wind direction ($\theta_{wind}$ where $0^\circ$ is a headwind and $90^\circ$ is a right-to-left crosswind):
$$w_x = -W \cdot \cos(\theta_{wind})$$
$$w_z = -W \cdot \sin(\theta_{wind})$$
$$v_r = \sqrt{(v_x - w_x)^2 + v_y^2 + (v_z - w_z)^2} \quad [\text{m/s}]$$

#### 1.3.2 Mach Number ($M$)
$$M = \frac{v_r}{c_{sos}}$$

#### 1.3.3 Sectional Density ($SD$) and Drag Form Factor ($i$)
$$\text{Sectional Density } SD = \frac{m_{grains}}{7000 \cdot d_{inches}^2} \quad [\text{lb/in}^2]$$
$$\text{Form Factor } i = \frac{SD}{BC} \quad [\text{dimensionless}]$$
Where:
* $m_{grains}$: Bullet weight in grains.
* $d_{inches}$: Bullet diameter in inches.
* $BC$: The G1 or G7 Ballistic Coefficient.

#### 1.3.4 Drag Coefficient ($C_d$) and Acceleration
The standard drag coefficient $C_{d, std}(M)$ is determined using linear interpolation from a G1 (79-point) or G7 (87-point) Mach lookup table:
$$C_d = C_{d, std}(M) \cdot i$$
The resulting drag acceleration vector is:
$$\vec{a}_{drag} = -\frac{1}{2} \rho v_r^2 \cdot C_d \cdot \frac{A_{ref}}{m_{bullet}} \cdot \frac{\vec{v}_r}{v_r} \quad [\text{m/s}^2]$$
Where $A_{ref} = \pi \frac{d^2}{4}$ (Reference area, meters), and $m_{bullet}$ is bullet mass in kilograms.

#### *Why G1 and G7 models are used:*
1. **Shape-Matching Drag Curves:** Projectiles experience different boundary layer drag patterns based on their shape. 
   * **G1 Drag Table:** Calibrated for flat-base, short-nose projectiles (similar to classic pistol or flat-base rifle bullets).
   * **G7 Drag Table:** Calibrated for modern, streamlined, boat-tail, long-secant-ogive bullets.
2. **Eliminating Velocity-Dependent BC Drift:** If a modern boat-tail bullet is modeled using a G1 profile, its Ballistic Coefficient will appear to shift or "drift" as it slows down because the G1 drag curve does not match the bullet's physical shape. Using the G7 model for boat-tails keeps the BC constant across supersonic, transonic, and subsonic envelopes, avoiding significant elevation errors at long ranges.

---

### 1.4 Gravitational Acceleration (Altitude-Dependent)
To account for long trajectories or high altitudes, gravity is modeled using the Earth's inverse-square law:
$$g(y_{alt}) = g_0 \cdot \left(\frac{R_e}{R_e + y_{alt}}\right)^2 \quad [\text{m/s}^2]$$
Where:
* $g_0 = 9.80665 \quad [\text{m/s}^2]$ (Standard gravity at sea level)
* $R_e = 6,371,000 \quad [\text{meters}]$ (Earth mean radius)
* $y_{alt}$: Total absolute altitude above sea level ($Altitude_{local} + y_{bullet}$).

#### *Why altitude-dependent gravity is used:*
For extreme long-range shooting (e.g., ELR past 1500 yards), bullets reach high peak-trajectory heights (called the *ordinate*). Modeling gravity as a variable rather than a constant ($9.8 \text{ m/s}^2$) prevents vertical calculation drift as the bullet travels through different gravity fields.

---

### 1.5 Coriolis Effect (3D Earth Rotation)
Coriolis acceleration describes the lateral and vertical deviations caused by the rotation of the Earth beneath the bullet during its flight:
$$\vec{a}_{coriolis} = -2 (\vec{\Omega} \times \vec{v}) \quad [\text{m/s}^2]$$
Given firing latitude ($\phi$) and firing azimuth direction ($\theta_{azimuth}$):
$$\Omega_x = \Omega \cdot \cos(\phi) \cdot \cos(\theta_{azimuth})$$
$$\Omega_y = \Omega \cdot \sin(\phi)$$
$$\Omega_z = -\Omega \cdot \cos(\phi) \cdot \sin(\theta_{azimuth})$$
$$\vec{a}_{coriolis} = \begin{bmatrix} a_{c, x} \\ a_{c, y} \\ a_{c, z} \end{bmatrix} = \begin{bmatrix} -2 (\Omega_y v_z - \Omega_z v_y) \\ -2 (\Omega_z v_x - \Omega_x v_z) \\ -2 (\Omega_x v_y - \Omega_y v_x) \end{bmatrix} \quad [\text{m/s}^2]$$

#### *Why the Coriolis model is used:*
At ranges beyond 600 yards, the flight time of the bullet is long enough (often $1.0\text{ to } 3.0+$ seconds) for the Earth to rotate significantly beneath it. This manifests as horizontal deviation (Coriolis drift) and vertical deviation (Eötvös effect). For precision target impacts, accounting for latitude and firing azimuth is mandatory.

---

### 1.6 Spin Drift and Aerodynamic Jump

#### 1.6.1 Gyroscopic Stability Factor ($S_g$)
Calculated using the Refined Miller Twist equation:
$$S_g = \frac{30 \cdot m_{grains}}{T^2 \cdot d_{inches}^3 \cdot l \cdot (1 + l^2)} \cdot \left(\frac{V_{fps}}{2800}\right)^{1/3}$$
Where $T$ is twist rate in calibers, $l$ is length in calibers, and $V_{fps}$ is muzzle velocity in fps.

#### 1.6.2 Spin Drift Deflection
$$\text{Drift}_{inches} = 1.25 \cdot (S_g + 1.2) \cdot t^{1.83}$$
$$\text{Drift}_{meters} = \text{Drift}_{inches} \cdot 0.0254$$

#### 1.6.3 Aerodynamic Jump
$$\text{Jump}_{moa} = 0.01 \cdot W_{crosswind, mph}$$
$$\text{Jump}_{rad} = \text{Jump}_{moa} \cdot 0.000290888$$

#### *Why these spin-stabilization effects are modeled:*
1. **Spin Drift:** A spin-stabilized projectile does not fly perfectly straight; gyroscopic precession causes it to tilt slightly off the flight path, resulting in a continuous lateral drift in the direction of the barrel's rifling twist (usually right). At $1000\text{ yards}$, spin drift can push a bullet $6\text{ to } 10\text{ inches}$ laterally, which is more than enough to miss a target completely.
2. **Aerodynamic Jump:** When a spinning bullet exits the muzzle into a crosswind, the wind immediately exerts a force on its nose. Due to gyroscopic precession, this lateral force causes a vertical tilt. Integrating this jump prevents vertical point-of-impact errors when shooting in high wind conditions.

---

### 1.7 Numerical Integrator (4th-Order Runge-Kutta)
The ODE system is integrated step-by-step using a classical **Runge-Kutta 4th-order (RK4)** method with a fixed time step ($dt = 0.005$ seconds):
$$\vec{k}_1 = \vec{f}(t_n, \vec{y}_n)$$
$$\vec{k}_2 = \vec{f}\left(t_n + \frac{dt}{2}, \vec{y}_n + \frac{dt}{2}\vec{k}_1\right)$$
$$\vec{k}_3 = \vec{f}\left(t_n + \frac{dt}{2}, \vec{y}_n + \frac{dt}{2}\vec{k}_2\right)$$
$$\vec{k}_4 = \vec{f}\left(t_n + dt, \vec{y}_n + dt\vec{k}_3\right)$$
$$\vec{y}_{n+1} = \vec{y}_n + \frac{dt}{6} \left(\vec{k}_1 + 2\vec{k}_2 + 2\vec{k}_3 + \vec{k}_4\right)$$
Where the state vector $\vec{y} = [x, y, z, v_x, v_y, v_z]$.

#### *Why the RK4 integrator is used:*
1. **Superior Accuracy over Euler:** A simple Euler integrator ($y_{n+1} = y_n + dt \cdot f(t_n)$) has a local truncation error of $O(dt^2)$, which causes rapid error accumulation (drift) over long trajectories unless the time step is impractically small. RK4 provides 4th-order accuracy ($O(dt^5)$ local, $O(dt^4)$ global), ensuring sub-millimeter trajectory precision even with a larger time step of $0.005$ seconds.
2. **Efficiency of Fixed Step Size:** Because external flight trajectories are smooth and continuous curves (without sudden, stiff spikes), a fixed-step integrator is highly efficient. It avoids the mathematical overhead of step-size calculations (unlike adaptive methods) and compiles into simple, predictable loop arrays that run extremely fast inside background Web Workers during Monte Carlo simulations.

---

### 1.8 Target Zeroing and MPBR Solvers

#### 1.8.1 Iterative Zeroing Method
To find the initial elevation angle ($\theta_e$) and windage angle ($\theta_w$) required to zero the rifle at a target distance ($D_{zero}$), the solver uses a shooting/secant iteration loop:
1. Initialize $\theta_e = 0$, $\theta_w = 0$.
2. Run trajectory simulation.
3. Find the vertical ($miss_y$) and lateral ($miss_z$) error at $x = D_{zero}$ via interpolation.
4. Correct the launching angles:
   $$\theta_e \leftarrow \theta_e + \arctan\left(\frac{-miss_y}{D_{zero}}\right)$$
   $$\theta_w \leftarrow \theta_w + \arctan\left(\frac{-miss_z}{D_{zero}}\right)$$
5. Repeat 3 times to achieve precise zero alignment on paper.

#### 1.8.2 Maximum Point Blank Range (MPBR) Solver
Determines the optimum zero distance to hit a vital zone of size $V$ (e.g. 8 inches) without dialing adjustments.
* It uses a binary search between $10\text{m}$ and $600\text{m}$ to find a zero distance where the maximum trajectory peak ($y_{peak}$) above the line of sight is exactly:
  $$y_{peak} = \frac{V}{2}$$
* The **Near Zero** is the range where the bullet rises above $0$.
* The **Far Zero** is the calculated optimum zero.
* The **MPBR Limit** is the range where the falling bullet drops below:
  $$y_{drop} = -\frac{V}{2}$$

#### *Why these solvers are used:*
These solvers eliminate manual trial-and-error. Finding exact zero launch angles and MPBR ranges mathematically requires solving boundary value problems (where the final position at a distance is fixed, but the initial angles are unknown). The iterative shooting method solves this in milliseconds, ensuring that the DOPE cards and target indicators match physical targets.

---
---

## 2. Internal Ballistics Engine (Ignition Simulator)
The internal ballistics engine (implemented in [internalBallisticsEngine.ts](file:///home/jobelche/Documents/github/EPv4/src/utils/internalBallisticsEngine.ts)) models chemical propellant combustion, thermodynamic expansion, heat transfer, and mechanical friction as the bullet travels down the barrel bore.

### 2.1 Thermodynamic Equation of State (Noble-Abel)
The model simulates a closed-system thermodynamic expansion of powder gases using the **Noble-Abel Equation of State**:
$$P_{mean} = \frac{(\gamma - 1) \cdot E_{gas}}{V_{free} - m_{gas} \cdot \eta} \quad [\text{Pa}]$$
Where:
* $P_{mean}$: Average spatial gas pressure inside the chamber/bore.
* $\gamma$: Ratio of specific heats of the propellant gas (`kCoeff`, typical value range 1.2 – 1.25).
* $\eta$: Covolume of gas products (`COVOLUME = 0.00095 m³/kg`), representing the physical volume of gas molecules.
* $m_{gas}$: Mass of burned propellant gas.
* $E_{gas}$: Total thermal energy of the gas.

#### 2.1.1 Free Expansion Volume ($V_{free}$)
$$V_{free} = V_0 + A_{bore} \cdot x - \frac{m_{powder, solid}}{\rho_{propellant}} \quad [\text{m}^3]$$
Where:
* $A_{bore} = \pi \frac{d_{bore}^2}{4}$ (Bore cross-sectional area, meters).
* $x$: Bullet travel distance down the bore (meters).
* $m_{powder, solid}$: Mass of remaining solid unburned propellant.
* $\rho_{propellant} = 1600 \quad [\text{kg/m}^3]$ (Solid density of nitrocellulose propellant).
* $V_0$: Initial chamber volume after subtracting bullet seating displacement:
  $$V_0 = V_{case\_water\_capacity} - \left(A_{bullet} \cdot SeatingDepth \cdot 0.62\right) \quad [\text{m}^3]$$

#### *Why this model and EOS is used:*
1. **Ideal Gas Law Inadequacy:** The Ideal Gas Law ($PV = nRT$) assumes that gas molecules are infinitely small points with no volume of their own. At the extreme pressures found in rifle chambers ($50,000\text{ to } 80,000\text{ PSI}$), gas molecules are packed so tightly that their physical volume (covolume, $\eta$) is significant. Ignoring this covolume leads to massive underestimations of chamber pressure (often by $30\%\text{ to } 40\%$). The Noble-Abel EOS corrects for this volume displacement, maintaining scientific accuracy at extreme pressures.
2. **Advantages over Empirical Calculators:** Empirical calculators rely on static, pre-calculated curves. A thermodynamic internal ballistics model allows the user to dynamically change barrel length, propellant charges, seating depth (altering the combustion chamber volume $V_0$), and ambient temperatures, and instantly see their impact on muzzle velocity and pressure.

---

### 2.2 Energy Balance Equation
The internal gas energy ($E_{gas}$) is determined by subtracting kinetic work and heat loss from the total chemical energy input:
$$E_{gas} = \left(m_{gas} \cdot Q + E_{primer}\right) - E_{kinetic} - E_{heat} \quad [\text{J}]$$
Where:
* $Q$: Heat of explosion of the propellant (`heatOfExplosionKjKg * 1000`, J/kg).
* $E_{primer}$: Electrical/impact energy input from the primer (typically 8 – 14 Joules).
* $E_{heat}$: Accumulated heat energy lost to the metal walls of the chamber and barrel.

#### 2.2.1 Lagrange Kinetic Energy Correction
The model accounts for the kinetic energy of both the projectile and the accelerating gas column behind it. The gas velocity is assumed to vary linearly from zero at the breech to $v$ at the bullet base:
$$E_{kinetic} = \frac{1}{2} \cdot \left(m_{bullet} + \frac{m_{gas}}{3}\right) \cdot v^2 \quad [\text{J}]$$

#### *Why this energy formulation is used:*
1. **Conserving Energy:** Internal ballistics is a classical thermodynamic expansion. By tracking the conversion of chemical energy into work (bullet movement), heat loss (barrel heating), and gas kinetic energy, we guarantee that the system obeys the First Law of Thermodynamics.
2. **The Lagrange Correction:** In a rifle barrel, the gas column is not static; it is expanding rapidly. The gas nearest to the breech is nearly stationary, while the gas pushing the bullet is moving at bullet velocity. Accelerating this gas column consumes a substantial portion of the chemical energy. Adding $1/3$ of the gas mass to the bullet weight (the Lagrange correction) prevents the simulation from overestimating muzzle velocity.

---

### 2.3 Propellant Burning Rate & Grain Geometry

#### 2.3.1 Vieille’s Law (Saint-Robert Equation)
The linear regression rate of the solid propellant is modeled as a power function of pressure:
$$\text{Burn Rate } r = \sqrt{\beta_{adj}} \cdot 350.0 \cdot \left(\frac{P_{mean}}{10^6}\right)^{0.65} \quad [\text{m/s}]$$
Where $\beta_{adj}$ is the adjusted burn rate coefficient corrected for ambient temperature sensitivity and cartridge chamber expansion geometry ($\beta$).

#### 2.3.2 Mass Burn Rate ($\frac{dm_p}{dt}$)
$$\frac{dm_p}{dt} = -r \cdot 350.0 \cdot m_{powder, solid} \cdot \theta(Z) \cdot \text{taper} \quad [\text{kg/s}]$$
Where $Z = 1 - \frac{m_{powder, solid}}{m_{powder, total}}$ (Fraction of powder burned), and $\theta(Z)$ is the geometry form factor.

#### 2.3.3 Surface Form Factor $\theta(Z)$
The remaining surface area of the grain is modeled according to its mechanical geometry:
* **Ball / Flake:** Degressive burning (burning surface area shrinks): $\theta(Z) = (1 - Z)^{2/3}$
* **Extruded Single-Perforated:** Approximately neutral/slightly progressive: $\theta(Z) = 1.0 + 0.3 \cdot Z$
* **Extruded Multi-Perforated:** Highly progressive: $\theta(Z) = 1.0 + 0.8 \cdot Z$

#### *Why burn rate and geometry models are used:*
Propellants do not ignite all at once. The rate at which chemical energy is released into the chamber is controlled by the physical shape of the individual gunpowder grains. By modeling these geometry form factors (progressive vs. degressive), the engine can accurately predict the shape of the pressure curve over time—distinguishing between fast-burning pistol powders (which spike quickly) and slow-burning rifle powders (which maintain pressure longer down the barrel).

---

### 2.4 Pressure Gradient (Breech vs. Bullet Base)
Due to gas column acceleration, the pressure at the base of the bullet ($P_{base}$) is lower than the mean pressure. It is modeled using the Lagrange gradient equation:
$$P_{base} = \frac{P_{mean}}{1 + \frac{m_{gas}}{3 \cdot m_{bullet}} \cdot \left(1 + K_{gradient\_scale} \cdot (\beta - 1)\right)} \quad [\text{Pa}]$$
Where $K_{gradient\_scale} = 0.15$. The calculated breech pressure ($P_{breech}$) is:
$$P_{breech} = P_{mean} \cdot \left(1 + \frac{m_{gas}}{2 \cdot m_{bullet}}\right) \quad [\text{Pa}]$$
Breech pressures are further corrected by a standard piezoelectric correction factor of **0.58** to align breech gas calculations with industry-standard SAAMI piezoelectric copper crusher/piezo sensor specs.

#### *Why the pressure gradient is modeled:*
If the pressure was assumed to be uniform, the force pushing the bullet would be over-estimated, leading to inaccurate muzzle velocities, and the calculated chamber pressures would not match actual transducer data. Modeling the gradient is necessary to bridge the gap between breech-sensor readings and bullet base dynamics.

---

### 2.5 Resisting Forces & Bullet Acceleration
The acceleration of the bullet down the bore is:
$$\frac{dv}{dt} = \frac{P_{base} \cdot A_{bore} - F_{engraving} - F_{friction}}{m_{bullet}} \quad [\text{m/s}^2]$$

#### 2.5.1 Engraving Resistance ($F_{engraving}$)
* For $x < 0.75\text{ mm}$ (Ramping up to rifling contact):
  $$P_{eng\_profile}(x) = P_{start} + \frac{x}{0.00075} \cdot (P_{peak} - P_{start}) \quad [\text{Pa}]$$
* For $x \ge 0.75\text{ mm}$ (Exponential decay as the bullet slides):
  $$P_{eng\_profile}(x) = P_{slide} + (P_{peak} - P_{slide}) \cdot e^{-1500 \cdot (x - 0.00075)} \quad [\text{Pa}]$$
Where pressure parameters depend on bullet jacket material (Monolithic copper: $65\text{ MPa}$, Jacketed lead: $32\text{ MPa}$, Cast lead: $12\text{ MPa}$).

#### 2.5.2 Poisson-Effect Bore Friction ($F_{friction}$)
$$F_{friction} = f_{static\_friction} + K_{pressure\_friction} \cdot P_{base} \cdot \left(\pi \cdot d_{bullet} \cdot L_{bearing}\right) \quad [\text{N}]$$
Where $K_{pressure\_friction} = 0.04$ (Poisson expansion friction factor).

#### *Why these resistance forces are modeled:*
1. **Engraving Force spike:** Entering the rifling is the most mechanically demanding part of the bullet's travel. This initial resistance delays bullet movement by a fraction of a millisecond, which keeps the bullet in the chamber longer and allows pressure to build up to the threshold required for efficient powder combustion.
2. **Poisson Friction:** High gas pressure does not just push the bullet forward; it also squeezes the bullet's rear core, expanding it radially against the barrel walls. This creates a pressure-dependent friction force (the Poisson effect) that is far higher than simple sliding friction. Modeling this prevents over-estimation of muzzle velocities in high-pressure cartridges.

---

### 2.6 Dynamic Heat Loss and Boundary Layer Insulation
The rate of heat accumulation in the barrel wall is the sum of convective and radiative heat transfer:
$$\frac{dE_{heat}}{dt} = Q_{convective} + Q_{radiative} \quad [\text{J/s}]$$

#### 2.6.1 Effective Heat Transfer Area ($A_{wall, eff}$)
To simulate the physical cooling of boundary gases along the barrel, the effective bore area is insulated by a turbulent boundary layer factor:
$$A_{wall, eff} = A_{chamber} + A_{bore} \cdot \left(\frac{1}{1 + 1.8\sqrt{x_{travel}}}\right) \quad [\text{m}^2]$$

#### 2.6.2 Convective Loss ($Q_{convective}$)
$$Q_{convective} = h_{conv} \cdot A_{wall, eff} \cdot (T_{gas} - T_{wall}) \quad [\text{J/s}]$$
Where $h_{conv}$ is the convective heat transfer coefficient calculated dynamically:
$$h_{conv} = \alpha_{heat} \cdot \left(\frac{P_{mean}}{10^6}\right)^{0.8} \cdot (v_{bullet} + 30.0)^{0.8} \cdot d_{bullet}^{-0.2}$$

#### 2.6.3 Radiative Loss ($Q_{radiative}$)
$$Q_{radiative} = \epsilon \cdot \sigma \cdot A_{wall, eff} \cdot (T_{gas}^4 - T_{wall}^4) \quad [\text{J/s}]$$

#### *Why heat loss and boundary layer insulation are modeled:*
Gunpowder combustion temperatures exceed $3000\text{ K}$, and steel conducts heat rapidly. If heat loss was ignored, the simulated gas would remain too hot, pressure would remain artificially high, and muzzle velocities would be over-estimated. However, if simple pipe convection was used, heat loss would be vastly *over*-estimated. The boundary layer factor models the cool gas buffer that shields the barrel walls, ensuring realistic velocity outputs.

---

### 2.7 Numerical Integrator (Runge-Kutta-Fehlberg 4/5)
The internal ballistics ODE system is integrated using an adaptive-step **Runge-Kutta-Fehlberg 4/5 (RKF45)** method to handle the stiff pressure rises during early ignition.

The solver computes two predictions of the state vector $\vec{y} = [x, v, m_p, E_{heat}]$ at each step:
$$\vec{y}_{4th\_order} = \vec{y}_n + h \cdot \sum_{i=1}^{5} CH_i \cdot \vec{k}_i$$
$$\vec{y}_{5th\_order} = \vec{y}_n + h \cdot \sum_{i=1}^{6} CT_i \cdot \vec{k}_i$$

#### Step Size Control
The local truncation error $err$ is calculated as the maximum component difference:
$$err = \max_{j} \left| \frac{y_{5, j} - y_{4, j}}{atol + rtol \cdot \max(|y_{n, j}|, |y_{5, j}|)} \right|$$
* If $err \le 1.0$, the step is **accepted**, the state is updated to $\vec{y}_{5th\_order}$, and the time step $h$ is adjusted.
* If $err > 1.0$, the step is **rejected**, and the solver retries with a smaller $h$:
$$h_{next} = h \cdot 0.84 \cdot err^{-0.2}$$

#### *Why the RKF45 adaptive integrator is used:*
Internal ballistics is a **mathematically stiff** problem. 
1. **Early Ignition Phase:** In the first millisecond, the powder ignites and pressure spikes from atmospheric to $60,000+\text{ PSI}$. During this phase, the rate of change is extremely high, and the integrator must use tiny steps ($dt < 1\mu\text{s}$) to prevent numerical divergence (exploding values).
2. **Expansion Phase:** Once the bullet begins moving down the barrel, the pressure changes slowly, and a tiny step size would make the simulation take forever to compute.
3. **Adaptive-Step Solution:** RKF45 dynamically manages this, scaling down the step size during stiff spikes to ensure safety/accuracy, and scaling it up during expansion to maximize calculation speed. This allows a complete simulation to run in under $5\text{ms}$ on a client-side browser.
