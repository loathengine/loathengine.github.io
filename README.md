# Empirical Precision: User Guide

Welcome to Empirical Precision, your all-in-one tool for managing reloading data, tracking performance, and analyzing your shooting results with statistical rigor. This guide will walk you through the recommended workflow to get the most out of the application.

---

##  empfohlenen Vorgehensweise

For a seamless experience, it's best to enter data in a specific order, as some records depend on others. The recommended workflow is:

1.  **Setup Foundational Data (`Misc` Tab):** Add your manufacturers, bullet diameters, and cartridge types first.
2.  **Inventory Components (`Components` Tab):** Log the specific bullets, powders, primers, and brass you own.
3.  **Add Your Firearms (`Firearms` Tab):** Create profiles for each of your firearms.
4.  **Create Load Data (`Loads` Tab):** Define your hand loads or log your commercial ammunition.
5.  **Upload Targets (`Targets` Tab):** Add images of your shot targets.
6.  **Mark Your Shots (`Marking` Tab):** Digitize your groups by marking your point of aim and impacts on the target images.
7.  **Analyze Performance (`Analysis` Tab):** Review detailed statistics, compare sessions, and export your findings.
8.  **Manage Your Data (`DB Management` Tab):** Backup and restore your database as needed.

---

## 1. Setup: Foundational Data

Before you can track loads or firearms, you need to input the basic building blocks.

### The `Misc` Tab

This is the most important first step.
* **Manufacturers:** Go to the `Manufacturers` sub-tab. Enter the names of manufacturers (e.g., Hornady, Hodgdon, CCI) and check the boxes for the types of products they make. This populates the manufacturer dropdowns in other forms.
* **Diameters:** Go to the `Diameters` sub-tab. Add the bullet diameters you use (e.g., Imperial: `.224`, Metric: `5.56mm`).
* **Cartridges:** Go to the `Cartridges` sub-tab. Add the cartridges you use (e.g., `223 Remington`), selecting the appropriate diameter you just created.

### The `Components` Tab

Here, you'll create a detailed inventory of your reloading components.
* **Bullets:** Select the `Bullets` sub-tab. Enter the bullet's manufacturer, diameter, name, weight, and length.
* **Powder:** Select the `Powder` sub-tab and add your powders, linking them to a manufacturer.
* **Primers:** Select the `Primers` sub-tab and add your primers.
* **Brass:** Select the `Brass` sub-tab. Select a cartridge (which you created in the `Misc` tab) and the manufacturer.

### The `Firearms` Tab

Create a profile for each firearm you own.
1.  Enter a **Nickname** for easy identification.
2.  Select the **Diameter** and **Cartridge**. The cartridge list is filtered by the selected diameter.
3.  Fill in other details like barrel length and twist rate.
4.  Click **Save Firearm**.

---

## 2. Data Entry

With the setup complete, you can now enter your specific load and target data.

### The `Loads` Tab

You can log both custom hand loads and factory-loaded commercial ammunition.
* **For Hand Loads:**
    1.  Select the `Hand Load` sub-tab.
    2.  Choose the **Diameter** and **Cartridge**. This will filter the dropdowns for bullets and brass, showing only compatible components.
    3.  Select the **Bullet**, **Powder**, **Primer**, and **Brass** from your component inventory.
    4.  Enter the **Charge Weight**, COL (Cartridge Overall Length), CBTO (Cartridge Base to Ogive), and other relevant data.
    5.  Click **Save Hand Load**.
* **For Commercial Ammo:**
    1.  Select the `Commercial Ammo` sub-tab.
    2.  Choose the **Manufacturer**, **Ammo Name**, **Diameter**, and **Cartridge**.
    3.  Enter the bullet weight and lot number if you have it.
    4.  Click **Save Commercial Ammo**.

### The `Targets` Tab

This is where you build your library of target images for analysis.
1.  Click the **"Upload New Target Image(s)"** button and select one or more image files from your device.
2.  The images will be converted to an efficient format, saved, and displayed in the gallery.
3.  You can **Rename** or **Delete** targets directly from the gallery.

---

## 3. Marking & Analysis (The Core Loop)

This is where your data comes together to produce insights.

### The `Marking` Tab

Here you will digitize your shot groups.
1.  **Load Image:** In the `Setup` panel, select a target from the **Load Saved Image** dropdown. The image will appear on the canvas.
2.  **Set the Scale (Crucial Step):**
    * In the `Image Controls` panel, enter a known distance in the **Scale** input fields (e.g., the 1-inch grid on your target). Select the correct units.
    * Click the **Set Scale** button. It will turn blue.
    * Click two points on the canvas that correspond to the known distance. A red line will appear. The application now knows the real-world size of a pixel on your target image. This is essential for accurate measurements.
3.  **Mark Your Group:**
    * In the `Marking Tools` panel, click **New Group**. A group will be added to the `Active Group` dropdown.
    * Click the **Set POA** (Point of Aim) button.
    * Click on the canvas where you were aiming for this group. A crosshair `+` will appear.
    * The **Mark Impacts** button will automatically become active. Click on the canvas at the center of each bullet hole for that group. Blue dots will appear.
4.  **Enter Session Info:**
    * In the `Session Info` panel, select the **Firearm** and **Load** you used for this session.
    * Enter the **Target Distance** (e.g., 100 yards).
5.  **Save:** Click the **Save / Update Session** button.

*Tip: You can also enter shot velocities in the `Impact Data` section that appears below the canvas.*

### The `Analysis` Tab

This tab provides a deep dive into the performance of a saved session.
1.  **Load Session:** Select a session from the **Load Session from DB** dropdown. The shot data will populate the table and the calculated statistics will appear below.
2.  **Review Statistics:**
    * **Group Statistics:** See your group's Extreme Spread (ES) and Mean Radius.
    * **Dispersion Statistics:** View the Horizontal/Vertical Standard Deviation and, most importantly, the **Radial Standard Deviation (RSD)**—a robust measure of your group's precision.
    * **Velocity Statistics:** If you entered velocities, see the ES and SD for your muzzle velocity.
3.  **Compare Sessions (F-Test):**
    * Select another session in the **Compare Against Session** dropdown.
    * The `F-Test for Variance` box will appear, telling you if the difference in precision (variance) between the two groups is statistically significant. This is far more reliable than just comparing two 5-shot group sizes.
4.  **Export:** Click **Export Analysis as PDF** to generate a shareable report with all session info, statistics, and the target image.

---

## 4. Database Management

The `DB Management` tab gives you full control over your data.

* **Export Entire Database:** Use this to create a full backup of all your data into a single `.json` file. **It is highly recommended to do this regularly.**
* **Import Entire Database:** Restores your application from a backup file. **Warning:** This will overwrite all current data.
* **Delete Entire Database:** Wipes everything. **Use with extreme caution.**
* **Table Specific Actions:** You can also select a single data table (like `bullets` or `firearms`) to view, export, clear, or import data for just that table.
