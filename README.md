# Empirical Precision - User Guide

## Table of Contents
1.  [Introduction](#introduction)
2.  [Core Concepts: Data & Privacy](#core-concepts-data--privacy)
3.  [Recommended Workflow](#recommended-workflow)
4.  [Tab-by-Tab Guide](#tab-by-tab-guide)
    - [About Us](#about-us)
    - [Setup Tabs (Misc & Components)](#setup-tabs-misc--components)
    - [Firearms Tab](#firearms-tab)
    - [Load Data Tab](#load-data-tab)
    - [Targets Tab](#targets-tab)
    - [Marking Tab (Core Functionality)](#marking-tab-core-functionality)
    - [Analysis Tab](#analysis-tab)
    - [DB Management Tab](#db-management-tab)
5.  [Data Backup and Management](#data-backup-and-management)

---

## Introduction

Welcome to Empirical Precision! This application is a powerful, all-in-one tool for shooting enthusiasts to manage every aspect of their hobby. From cataloging reloading components and firearms to performing in-depth statistical analysis of target performance, this app helps you make data-driven decisions to improve your precision.

### Core Concepts: Data & Privacy

-   **Offline First:** The application works entirely within your web browser. It does not require an internet connection after the initial page load.
-   **100% Private:** All data you enter—firearms, load recipes, targets, and analysis—is stored locally on your computer in your browser's IndexedDB storage. **No data is ever uploaded to a server.**
-   **Data Persistence:** Your data will remain available as long as you do not clear your browser's site data for this application. It is **highly recommended** that you regularly back up your database using the features on the `DB Management` tab.

---

## Recommended Workflow

For the most efficient use of the application, follow this workflow:

1.  **Setup Foundational Data:**
    -   Go to the `Misc` tab to add **Diameters** (e.g., .308) and **Manufacturers** (e.g., Hornady, Hodgdon).
    -   Go to the `Components` tab to add your specific **Bullets**, **Powders**, **Primers**, and **Brass**. These lists will populate the dropdowns used for creating load data.

2.  **Define Your Equipment:**
    -   Go to the `Firearms` tab to add the rifles or pistols you will be testing.

3.  **Create Load Data:**
    -   Go to the `Load Data` tab to create entries for your handloads or commercial ammunition.

4.  **Upload Your Targets:**
    -   Go to the `Targets` tab and upload images of your shot targets.

5.  **Mark and Save a Session:**
    -   Go to the `Marking` tab. This is where you will load a target image, mark your point of aim and impacts, associate the session with a firearm and load, and save the session data.

6.  **Analyze Your Performance:**
    -   Go to the `Analysis` tab to load one or more saved sessions, compare their performance statistics, and diagnose potential issues with your loads.

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

### Load Data Tab
This tab lets you catalog your ammunition.

-   **Hand Load vs. Commercial Ammo:** Use the sub-tabs to switch between creating a custom handload recipe and logging factory ammunition.
-   **Creating a Hand Load:** The form uses a series of dependent dropdowns. For example, after you select a `Diameter`, the `Cartridge` and `Bullet Weight` dropdowns will be filtered to show only relevant options. Fill in all known details for your recipe.
-   **Creating Commercial Ammo:** A simpler form to log factory ammunition by manufacturer, name, and lot number.

### Targets Tab
This is your digital library of target images.

-   Click **"Upload New Target Image(s)"** to select one or more image files from your computer.
-   The images are automatically converted to the efficient `.webp` format to save space.
-   You can **Rename** or **Delete** targets directly from this gallery.

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
7.  **Save the Session:** Click **"Save / Update Session"**. Your marked points, scale, and session info are now saved and ready for analysis.

### Analysis Tab
This is where you can view and compare the performance of your saved sessions.

1.  **Select Sessions:** Use the list to select one or more sessions. To select multiple, hold `Ctrl` (on Windows/Linux) or `Cmd` (on Mac) and click on each session you want to analyze.
2.  **Analyze:** Click the **"Analyze Selected Session(s)"** button.
3.  **Review the Results:**
    -   A **table** will appear with detailed statistics. Each session is color-coded.
    -   **Mean Radius (MR):** The primary measure of precision. Smaller is better. The Confidence Interval (CI) tells you how reliable that measurement is based on the number of shots.
    -   **Dispersion Analysis:** This is the most powerful diagnostic column.
        -   If it says **"Nominal"**, your horizontal and vertical spread are balanced.
        -   If it flags **"Vertical stringing detected"**, it means your vertical spread is unusually large. If you did not provide velocity data, it will prompt you to do so.
        -   If you did provide velocity, it will show an **R-squared (R²)** value. This percentage tells you how much of that vertical stringing is likely caused by inconsistent muzzle velocity. A high R² (e.g., 65%) strongly suggests your powder charge is the culprit.
4.  **View the Plot:** Below the table, a plot visually represents all selected groups overlaid on top of each other, centered on their point of impact. This makes it easy to visually compare group shapes and sizes.
5.  **Export:** Click **"Export as Image"** to save a high-quality PNG image of the plot and results table, perfect for sharing or record-keeping.

### DB Management Tab
This tab is for advanced data management. **Use with caution.**

-   **Global Actions:**
    -   `Export Entire Database`: Saves a single JSON file of all your data. **This is the recommended way to create backups.**
    -   `Import Entire Database`: Restores your data from a backup file. This will overwrite all existing data.
    -   `Delete Entire Database`: **PERMANENTLY DELETES ALL DATA.** This action cannot be undone.
-   **Table Specific Actions:** Allows you to export, import, or clear the data from individual tables (e.g., just your bullets).

---

## Data Backup and Management

Because all data is stored within your browser, it is vulnerable to being deleted if you clear your browser's cache or site data.

**It is critical that you regularly back up your database.**

To do this, go to the `DB Management` tab and click **"Export Entire Database"**. Save the resulting `.json` file in a safe place. You can use this file to restore all of your data at any time.
