# Empirical Precision - User Guide

## Table of Contents
1.  [Introduction](#introduction)
2.  [Core Concepts: Data & Privacy](#core-concepts-data--privacy)
3.  [Recommended Workflow](#recommended-workflow)
4.  [Tab-by-Tab Guide](#tab-by-tab-guide)
    - [About Us](#about-us)
    - [Setup Tabs (Misc & Components)](#setup-tabs-misc--components)
    - [Firearms Tab](#firearms-tab)
    - [Ammo Data Tab](#ammo-data-tab)
    - [Targets Tab](#targets-tab)
    - [Marking Tab (Core Functionality)](#marking-tab-core-functionality)
    - [Analysis Tab (Composite & Compare)](#analysis-tab-composite--compare)
    - [DB Management Tab](#db-management-tab)
5.  [Data Backup and Management](#data-backup-and-management)

---

## Introduction

Welcome to Empirical Precision! This application is a powerful, all-in-one tool for shooting enthusiasts to manage every aspect of their hobby. From cataloging reloading components and firearms to performing in-depth statistical analysis of target performance, this app helps you make data-driven decisions to improve your precision.

**Key Feature: Group Compositing**
One of the primary functions of this application is to allow you to shoot multiple smaller groups (e.g., 3-shot or 5-shot groups) on different targets or on different days, and then **composite** them into a single large-sample analysis. This provides statistically significant data without requiring you to shoot 20+ rounds at a single point of aim in one sitting.

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
    -   Go to the `Misc` tab to add any custom **Diameters** or **Manufacturers** not covered by the master database.
    -   Go to the `Components` tab to add your specific inventory of **Bullets**, **Powders**, **Primers**, and **Brass**.

3.  **Define Your Equipment:**
    -   Go to the `Firearms` tab to add the rifles or pistols you will be testing.

4.  **Create Ammo Data:**
    -   Go to the `Ammo Data` tab to create entries for your handloads or commercial ammunition.

5.  **Upload Your Targets:**
    -   Go to the `Targets` tab. You can upload existing images of your shot targets, or use the **"Create Target"** feature to generate and print custom targets (NRA B-8, ISSF, etc.).

6.  **Mark and Save Sessions:**
    -   Go to the `Marking` tab. Load a target image, set the scale, and mark your impacts.
    -   **Important:** You can mark individual groups on different targets and save them as separate sessions. The Analysis tab will let you combine them later.

7.  **Analyze & Composite:**
    -   Go to the `Analysis` tab. Select multiple sessions corresponding to the same load/firearm combination.
    -   The app will **composite** these separate groups into a single aggregate analysis, giving you a true picture of your precision (Mean Radius, SD, etc.) based on the total number of shots.

---

## Tab-by-Tab Guide

### About Us
This is the landing page. It provides a general overview of the application's purpose and features, along with the recommended workflow for new users.

### Setup Tabs (Misc & Components)

These two tabs are the foundation of the application. Populating them first will make creating firearms and loads much easier.

-   **Misc Tab:** Use the sub-tabs here to manage the basic building blocks:
    -   **Manufacturers:** Add the names of companies that make bullets, powder, etc.
    -   **Diameters:** Define the calibers you use (e.g., `.223`, `.308`).
    -   **Cartridges:** Define the specific cartridges you use (e.g., `308 Winchester`), linking them to a diameter.
-   **Components Tab:** Use the sub-tabs here to create a detailed inventory of your reloading components. The manufacturers you added in the `Misc` tab will be available in the dropdowns.

### Firearms Tab
Here, you can manage your collection of firearms.

-   **To Add a Firearm:** Fill out the form with a nickname, cartridge, barrel length, and other details. Click **"Save Firearm"**.
-   **To Edit a Firearm:** Click the **"Edit"** button next to an entry in the table. The form will be populated with its data. Make your changes and click **"Save Firearm"** again.

### Ammo Data Tab
This tab lets you catalog your ammunition.

-   **Hand Load vs. Commercial Ammo:** Use the sub-tabs to switch between creating a custom handload recipe and logging factory ammunition.
-   **Creating a Hand Load:** The form uses a series of dependent dropdowns. For example, after you select a `Diameter`, the `Cartridge` and `Bullet Weight` dropdowns will be filtered to show only relevant options. Fill in all known details for your recipe.
-   **Creating Commercial Ammo:** A simpler form to log factory ammunition by diameter, cartridge, name, and lot number.

### Targets Tab
This is your digital library of target images.

-   **Manage Targets:** Click **"Upload New Target Image(s)"** to select one or more image files from your computer. The images are automatically converted to the efficient `.webp` format to save space. You can **Rename** or **Delete** targets directly from this gallery.
-   **Create Target:** Use this sub-tab to generate custom printable targets. You can select standard presets like **NRA B-8** or **ISSF 10m**, or define your own grid, bullseye size, and layout. You can then download the target as an image or print it directly.

### Marking Tab (Core Functionality)
This is the most interactive part of the application, where you turn a target image into analyzable data.

1.  **Load a Target:** Use the **"Load Saved Image"** dropdown to select a target you uploaded. It will appear on the canvas.
2.  **Set the Scale (CRITICAL STEP):** For the application to make accurate measurements, you must tell it how large things are in the image.
    -   Enter a known distance in the **Scale** input fields (e.g., `1` and `Inches (in)` if your target grid is 1 inch).
    -   Click the **"Set Scale"** button. It will turn blue and become active.
    -   Click two points on the canvas that correspond to the distance you entered (e.g., the start and end of a 1-inch line on the target grid). The scale is now set.
3.  **Create a Group:** Click **"New Group"**. This will create an active group for you to work with.
4.  **Mark Points:**
    -   Click the **"Set POA"** (Point of Aim) button and click on the canvas where you were aiming for that group.
    -   The **"Mark Impacts"** button will automatically become active. Click on the canvas to mark each bullet hole for that group.
5.  **Enter Session Info:**
    -   Use the dropdowns to associate the session with a **Firearm** and a **Load**.
    -   Enter the **Target Distance**.
6.  **Enter Velocity Data (Optional but Recommended):**
    -   As you mark impacts, a list will appear below the canvas. You can type the muzzle velocity for each shot into the input field next to it. This is crucial for advanced dispersion analysis.
7.  **Save the Session:** Click **"Save / Update Session"**. Your marked points, scale, and session info are now saved. You can treat each saved session as a "part" of a larger aggregate group if you wish.

### Analysis Tab (Composite & Compare)
This is where the magic happens. You can analyze individual sessions or **composite multiple sessions** to get better statistical data.

1.  **Select Sessions:** Use the list to select sessions.
    -   **Comparison:** Select different loads to compare them side-by-side.
    -   **Compositing:** Select multiple sessions that used the **same load** (e.g., "5 shots on Target A" and "5 shots on Target B"). The app will overlay them based on their Point of Aim (POA) to simulate a single 10-shot group.
    -   Hold `Ctrl` (on Windows/Linux) or `Cmd` (on Mac) to select multiple items.
2.  **Analyze:** Click the **"Analyze Selected Session(s)"** button.
3.  **Review the Results:**
    -   A **table** will appear with detailed statistics (Mean Radius, SD, etc.) in **Milliradians (mrad)** (if distance was provided) or original units.
    -   **Dispersion Analysis:** Checks for vertical stringing and velocity correlations.
4.  **View the Composite Plot:** Below the table, a plot visually represents all selected groups overlaid on top of each other, centered on their point of impact (MPI).
5.  **Export:** Click **"Export as Image"** to save a timestamped image of the plot and stats.

### DB Management Tab
This tab is for advanced data management. **Use with caution.**

-   **Global Actions:**
    -   `Export Entire Database`: Saves a single JSON file of all your data. **This is the recommended way to create backups.**
    -   `Import Master Database`: Imports a master database from a pre-defined online source. **This will overwrite all existing data.** Use this to initialize the application with a standard set of components and data.
    -   `Import Entire Database`: Restores your data from a backup file. This will overwrite all existing data.
    -   `Delete Entire Database`: **PERMANENTLY DELETES ALL DATA.** This action cannot be undone.
-   **Table Specific Actions:** Allows you to export, import, or clear the data from individual tables (e.g., just your bullets).

---

## Data Backup and Management

Because all data is stored within your browser, it is vulnerable to being deleted if you clear your browser's cache or site data.

**It is critical that you regularly back up your database.**

To do this, go to the `DB Management` tab and click **"Export Entire Database"**. Save the resulting `.json` file in a safe place. You can use this file to restore all of your data at any time.
