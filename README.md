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

For the most efficient use of the application, follow this logical flow:

1.  **Add Firearm:** Go to the `Firearms` tab and define your rifle or pistol.
2.  **Add Load Data:** Go to the `Load Data` tab and log your commercial ammo or custom handload recipe.
3.  **Create Target:** Use the generator in the `Targets` tab to design your ideal target.
4.  **Print Target:** Print your generated custom target.
5.  **Range Session:** Take your target to the range and make impacts on it (shoot your groups).
6.  **Import Target:** Take a photo of your shot target and import it into the app via the `Targets` or `Marking` tab.
7.  **Mark Shots:** Go to the `Marking` tab, load your image, set the scale, and mark your shots to create a session.
8.  **Analyze Session:** Switch to the `Analysis` tab and run statistical analysis on the range session target.
9.  **Compare Sessions:** Select multiple sessions in the `Analysis` tab to easily composite and compare your data.
10. **Check Stability:** If necessary, utilize the `Stability` tab to verify the gyroscopic stability of your bullet.

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
    -   **Statistics Table:** View robust statistical metrics including **Mean Radius (MR)**, Group Size (Extreme Spread), **Circular Error Probable (CEP)** at 90%, and A-ZED.
        - *Note: CEP 90% mathematically models an impact radius where 90% of your shots are expected to land, making it an excellent predictor of field capability compared to highly-variable Extreme Spread.*
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

-   **Unified Database:** The application manages all your firearms, targets, sessions, and load data within a centralized IndexedDB architecture.
-   **Sync Tools:**
    -   `Sync Database`: Merges hundreds of standard bullet profiles, powders, brass makes, and commercial loads directly from the Open-Source `master-db.json` into your application. **Note:** This explicitly overwrites matching records within all tables seamlessly!
-   **Management Actions:** (Action labels dynamically adapt based on the scope selected in the Advanced Table Browser)
    -   `Nuclear Reset`: Aggressively clears all data from the entire database to initialize a completely clean session using schema-agnostic clearing routines.
    -   `Clear Table`: Replaces the Nuclear Reset button when a specific table is singled out in the browser, allowing surgically precise clearing of individual tables without touching others.
    -   `Export Data`: Generates a fully compliant JSON backup of whatever context (entire database or table scope) is currently selected.
    -   `Restore / Merge Data`: Safely restores data from a JSON backup by parsing records and mapping them into the correct tables, seamlessly overwriting matching IDs.

---

## Data Backup and Management

Because all data is stored within your browser, it is vulnerable to being deleted if you clear your browser's cache or site data.

**It is critical that you regularly back up your database.**

Go to the `DB Management` tab and click **"Export Entire Database"** regularly. Save the `.json` file safely.


## Database Schema Index

This section serves as a technical reference for the standard JSON objects stored in the `master-db.json` and the local IndexedDB.

### Cartridges
```json
{
  "id": "CTG_17HMR_N1H2",
  "name": "17 HMR",
  "diameterId": "DIA_172_QW2R",
  "maxCaseLength": 1.058,
  "trimLength": 1.048,
  "oal": 1.075
}
```

### Brass
```json
{
  "id": "BRS_ADGB_22CM_NYXQ",
  "cartridgeId": "CTG_22CM_cA72",
  "manufacturerId": "MAN_ADG_A4D7",
  "primerHole": "0.080 (2mm)",
  "primerPocket": "SMALL"
}
```

### Firearms
```json
{
  "id": "FIREARM_12345",
  "name": "Custom R700",
  "cartridgeId": "CTG_308WIN_cC82",
  "barrelLength": 24,
  "twistRate": 10,
  "sightHeight": 2.0,
  "notes": "Primary match rifle."
}
```

### Loads
```json
{
  "id": "LOAD_COMM_HORN_65CM_140_ELDM",
  "name": "Hornady Match 140gr ELD-M",
  "loadType": "commercial",
  "manufacturerId": "MAN_HORNADY_JGR4",
  "cartridgeId": "CTG_65CM_cN72",
  "bulletId": "BUL_HORNADY_264_140_ELDM",
  "powderCharge": null,
  "powderId": null,
  "primerId": null,
  "brassId": "BRS_HORN_65CM_drV7",
  "notes": "Dominant commercial baseline for 6.5 Creedmoor."
}
```

### Impactdata
```json
{
  "id": "SESS_12345",
  "date": "2026-04-19T12:00:00.000Z",
  "firearmId": "FIREARM_12345",
  "loadId": "LOAD_COMM_HORN_65CM_140_ELDM",
  "targetDistance": 100,
  "distanceUnits": "yd",
  "groups": [
    {
      "id": "GRP_1",
      "pois": [
        {
          "x": 0.5,
          "y": 0.2,
          "velocity": 2700
        },
        {
          "x": 0.4,
          "y": 0.3,
          "velocity": 2710
        },
        {
          "x": 0.6,
          "y": 0.1,
          "velocity": 2695
        }
      ],
      "poa": {
        "x": 0,
        "y": 0
      }
    }
  ],
  "targetImageId": "IMG_12345",
  "notes": "Test session."
}
```

### Targetimages
```json
{
  "id": "IMG_12345",
  "name": "Grid Target",
  "date": "2026-04-19T12:00:00.000Z",
  "dataUrl": "data:image/webp;base64,UklGR...",
  "thumbnailUrl": "data:image/webp;base64,UklGR...",
  "notes": "Standard 1-inch grid."
}
```

### Customtargets
```json
{
  "id": "CTGT_12345",
  "name": "My Custom Diamond",
  "config": {
    "pageSize": "letter",
    "gridType": "1in",
    "bullseyeShape": "diamond",
    "bullseyeSize": 1.0,
    "layout": "5-diamond"
  }
}
```

### Manufacturers
```json
{
  "id": "MAN_ACCURATE_A6B8",
  "name": "Accurate",
  "type": [
    "powder"
  ]
}
```

### Diameters
```json
{
  "id": "DIA_172_QW2R",
  "imperial": ".172",
  "metric": "4.5mm"
}
```

### Powders
```json
{
  "id": "PWD_ACCU_2230_R1A6",
  "manufacturerId": "MAN_ACCURATE_A6B8",
  "name": "Accurate 2230"
}
```

### Primers
```json
{
  "id": "PRI_CCI_200_C1R2",
  "manufacturerId": "MAN_CCI_C2W7",
  "name": "No. 200 Large Rifle"
}
```

### Bullets
```json
{
  "id": "BUL_BARNES_204_26_VG",
  "manufacturerId": "MAN_BARNES_B2N5",
  "name": "Varmint Grenade FB",
  "weight": 26.0,
  "diameterId": "DIA_204_M9K3",
  "length": 0.535,
  "ballistics": {
    "g1_bc": 0.204,
    "g7_bc": null,
    "g7_form_factor": 0.131
  },
  "stability_vars": {
    "is_tipped": false,
    "tip_length": null,
    "ix": 26.0,
    "iy": 26.0,
    "cg_from_base": 0.131
  }
}
```

