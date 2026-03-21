# Empirical Precision - User Guide

## Table of Contents
1.  [Introduction](#introduction)
2.  [Core Concepts: Data & Privacy](#core-concepts-data--privacy)
3.  [Recommended Workflow](#recommended-workflow)
4.  [Tab-by-Tab Guide](#tab-by-tab-guide)
    - [About Us](#about-us)
    - [Components Tab (Foundational Data)](#components-tab-foundational-data)
    - [Firearms Tab](#firearms-tab)
    - [Load Data Tab](#load-data-tab)
    - [Targets Tab](#targets-tab)
    - [Marking Tab (Core Functionality)](#marking-tab-core-functionality)
    - [Analysis Tab (Composite & Compare)](#analysis-tab-composite--compare)
    - [Stability Tab (Miller Twist Calculator)](#stability-tab-miller-twist-calculator)
    - [DB Management Tab](#db-management-tab)
5.  [Data Backup and Management](#data-backup-and-management)

---

## Introduction

Welcome to Empirical Precision! This application is a powerful, all-in-one tool for shooting enthusiasts to manage every aspect of their hobby. From cataloging reloading components and firearms to performing in-depth statistical analysis of target performance, this app helps you make data-driven decisions to improve your precision.

**Key Feature: Statistical Composite Group Analysis**
One of the primary functions of this application is to allow you to shoot multiple smaller groups (e.g., 3-shot or 5-shot groups) on different targets or on different days, and then **composite** them into a single large-sample analysis. By aligning the groups around their Centers of Impact or Points of Aim, this provides an aggregated, statistically significant dataset focused on **Mean Radius (MR)**, mitigating the unreliability of Extreme Spread measurements on small sample batches.

### Core Concepts: Data & Privacy

-   **Offline First:** The application works entirely within your web browser. It does not require an internet connection after the initial page load.
-   **100% Private:** All data you enter—firearms, load recipes, targets, and analysis—is stored locally on your computer in your browser's IndexedDB storage. **No data is ever uploaded to a server.**
-   **Data Persistence:** Your data will remain available as long as you do not clear your browser's site data for this application. It is **highly recommended** that you regularly back up your database using the features on the `DB Management` tab.

---

## Recommended Workflow

For the most efficient use of the application, follow this workflow:

1.  **Initialize Database (Recommended):**
    -   **Important:** Before adding your own data, go to the `DB Management` tab and click **"Import Master Database"**. 
    -   This will populate the application with a comprehensive list of standard diameters, cartridges, and manufacturers (Hornady, Sierra, Hodgdon, etc.), saving you hours of manual entry.

2.  **Setup Foundational Data:**
    -   Go to the **Components** tab.
    -   Use the **Manufacturers**, **Diameters**, and **Cartridges** sub-tabs to add any custom items not covered by the master database.
    -   Then, use the **Bullets**, **Powders**, **Primers**, and **Brass** sub-tabs to add your specific inventory.

3.  **Define Your Equipment:**
    -   Go to the **Firearms** tab to add the rifles or pistols you will be testing.

4.  **Create Load Data:**
    -   Go to the **Load Data** tab to create entries for your handloads or commercial ammunition.

5.  **Upload Your Targets:**
    -   Go to the **Targets** tab. You can upload images of your shot targets, or use the **"Create Target"** feature to generate and print custom targets (NRA B-8, ISSF, etc.).

6.  **Mark and Save Sessions:**
    -   Go to the **Marking** tab. Load a target image, set the scale, and mark your impacts.
    -   **Important:** You can mark individual groups on different targets and save them as separate sessions for composite analysis later.

7.  **Analyze & Composite:**
    -   Go to the **Analysis** tab. Select multiple sessions corresponding to the same load/firearm combination.
    -   The app will **composite** these separate groups into a single aggregate analysis, providing reliable metrics (Mean Radius, standard deviations, extreme spread) based on an aggregated, large-sample dataset.

---

## Tab-by-Tab Guide

### About Us
This is the landing page. It provides a general overview of the application's purpose, scientific methodology, and privacy architecture.

### Components Tab (Foundational Data)

This tab is the foundation of the application. Populating it first will make creating firearms and loads much easier. It is divided into several sub-tabs:

-   **Manufacturers:** Add the names of companies that make bullets, powder, etc.
-   **Diameters:** Define the calibers you use (e.g., `.223`, `.308`).
-   **Cartridges:** Define the specific cartridges you use (e.g., `308 Winchester`), linking them to a diameter.
-   **Inventory (Bullets, Powder, Primers, Brass):** Create a detailed inventory of your reloading components. The manufacturers and diameters you added previously will be available in these forms.

### Firearms Tab
Here, you can manage your collection of firearms.

-   **To Add a Firearm:** Fill out the form with a nickname, cartridge, barrel length, and other details. Click **"Save Firearm"**.
-   **To Edit a Firearm:** Click the **"Edit"** button next to an entry in the table. The form will be populated with its data. Make your changes and click **"Save Firearm"** again.

### Load Data Tab
This tab lets you catalog your ammunition.

-   **Hand Load vs. Commercial Ammo:** Use the sub-tabs to switch between creating a custom handload recipe and logging factory ammunition.
-   **Creating a Hand Load:** The form uses a series of dependent dropdowns. Fill in all known details for your recipe. You can enter multiple charge weights or COALs separated by commas.
-   **Creating Commercial Ammo:** A simpler form to log factory ammunition by diameter, cartridge, name, and lot number.
-   **Recipe Sheet:** Click the **"Recipe"** button in the table to generate a printable summary of a specific handload.

### Targets Tab
This is your digital library of target images and a custom target generator.

-   **Upload Targets:** Click **"Upload New Target Image(s)"** to select one or more image files. The images are automatically converted to `.webp` to save space.
-   **Create Target:** A robust tool to generate custom printable targets. You can define page size, grid options, bullseye shapes (Circle, Square, Diamond, etc.), and layout. You can also import firearm and load data directly onto the target as a text label.

### Marking Tab (Core Functionality)
This is where you turn a target image into analyzable data.

1.  **Load a Target:** Use the **"Load Saved Image"** dropdown to select a target.
2.  **Set the Scale (CRITICAL STEP):** 
    -   Enter a known distance and units (e.g., `1` and `Inches (in)`).
    -   Click **"Set Scale"**.
    -   Click two points on the canvas that correspond to that distance.
3.  **Create a Group:** Click **"New Group"**.
4.  **Mark Points:**
    -   Click **"Set POA"** (Point of Aim) and click where you were aiming.
    -   Click **"Mark Impacts"** and click on each bullet hole.
5.  **Enter Range Session Info:** Associate the group with a Firearm, Load, and Target Distance.
6.  **Enter Velocity Data (Optional):** You can type the muzzle velocity for each shot in the list below the canvas.
7.  **Save the Session:** Click **"Save / Update Session"**.

### Analysis Tab (Composite & Compare)
Analyze individual sessions or **composite multiple sessions** for better statistical data.

1.  **Select Sessions:** Use the list to select sessions. Hold `Ctrl` or `Cmd` to select multiple.
2.  **Analyze:** Click **"Analyze Selected Session(s)"**.
3.  **Review the Results:**
    -   **Statistics Table:** View robust statistical metrics including **Mean Radius (MR)**, Group Size (Extreme Spread), 95th Percentile Radius, and A-ZED. 
    -   **Dispersion Analysis:** Checks for vertical stringing and velocity correlations.
    -   **Composite Plot:** A visual representation of all selected groups overlaid, aligned by their Mean Point of Impact (MPI). This effectively builds a much larger, statistically significant dataset that accurately illustrates the true dispersion capabilities of the system.
4.  **Export:** Click **"Export as Image"** to save the plot and stats.

### Stability Tab (Miller Twist Calculator)
Estimate the gyroscopic stability ($S_g$) of your projectiles.

-   **Firearm Selection:** Automatically pulls twist rate from your firearms database.
-   **Bullet Selection:** Pulls bullet specifications (weight, diameter, length) from your load data or bullet inventory.
-   **Environmental Correction:** Models the Air Density Ratio (ADR) relative to Standard Sea Level by accounting for temperature, altitude, and station pressure. 
-   **Refined Miller Twist Formula:** Incorporates real-time velocity corrections and plastic tip length logic (effective metal length vs overall length) to provide an incredibly precise $S_g$ value. An $S_g \ge 1.5$ corresponds to optimum stability and maximum ballistic coefficient retention.

### DB Management Tab
Advanced data management for your local IndexedDB.

-   **Global Actions:**
    -   `Export Entire Database`: Saves a JSON backup. **Highly recommended.**
    -   `Import Master Database`: Loads a standard set of components. **Overwrites existing data.**
    -   `Import Entire Database`: Restores from a backup file.
    -   `Delete Entire Database`: **Permanent deletion.**
-   **Merge Database:** Allows you to select a JSON backup and merge its contents into your current database. You can "Test Merge" first to see how many new records will be added or updated.
-   **Table Specific Actions:** Export, import, or clear individual tables (e.g., just your firearms).

---

## Data Backup and Management

Because all data is stored within your browser, it is vulnerable to being deleted if you clear your browser's cache or site data.

**It is critical that you regularly back up your database.**

Go to the `DB Management` tab and click **"Export Entire Database"** regularly. Save the `.json` file safely.
