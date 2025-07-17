# **How to Use the Empirical Precision Tool**

This guide will walk you through the steps to analyze shot groupings from an image of a target.

### **1\. Add an Image**

* Click the **"Add Image"** button to select a photo of your target from your device.  
* Once loaded, the image will appear in the main viewing area, and the "Add Image" button will be disabled.  
* To start over with a new image, click the **"Remove Image & Data"** button that appears.

### **2\. Set the Scale**

This is the most critical step for accurate measurements. You need to tell the tool what a real-world distance looks like in the image.

* Click the **"Set Scale"** button. It will turn green, indicating it's active.  
* The default unit is inches. If you need to use millimeters, click the **"Units: Imperial (in)"** button to toggle it to metric.  
* Find a feature on your target with a known length (e.g., a 1-inch grid square, the diameter of a bullseye).  
* Click on one end of your known distance on the image.  
* Click on the other end of your known distance.  
* The tool will automatically calculate the pixels-per-unit ratio, and a confirmation message will appear. The "Set Scale" button will return to its original color.

### **3\. Create a Group & Mark Points**

* Click the **"Add Group"** button. This will create a new group in the "Current Group" dropdown.  
* The **"Mark Point of Aim"** button will activate automatically. Click it if it's not already active (it will be green).  
* Click on the image to mark your intended point of aim for that group.  
* After marking the aim, the tool will automatically switch to impact marking mode. The **"Mark Impact"** button will turn green.  
* Click on the location of each shot/impact for the current group.  
* If you make a mistake, click **"Remove Impact"** to delete the last point you marked for the selected group.

### **4\. Analyze the Data**

As you mark points, the **Ballistic Analysis** panel will automatically update with the following statistics:

* **Horizontal ES:** The extreme spread (width) of the group.  
* **Vertical ES:** The extreme spread (height) of the group.  
* **H/V Ratio:** The ratio of horizontal to vertical spread.  
* **Mean Radius:** The average distance of all shots from the calculated center of the group.  
* **Std. Deviation:** The standard deviation of the radii, indicating the consistency of the shots.  
* **MoE (95% CI):** The Margin of Error for the Mean Radius at a 95% confidence interval.  
* **P95 Radius:** The radius from the group center that encompasses 95% of the shots in your sample.

The list below the stats shows the coordinates of each impact relative to the point of aim.

### **5\. Export Your Results**

* Once your analysis is complete, click the **"Export Image"** button.  
* This will generate and download a high-resolution PNG file. The exported image includes your original target, all marked points, and a clean table of the complete analysis data.

### **Additional Controls**

* **Zoom:** Use the **"+"** and **"-"** buttons to zoom in and out of the image.  
* **Pan:** Click and drag on the image to move it around within the viewer.  
* **Manage Groups:** You can create multiple groups on a single target. Use the "Current Group" dropdown to switch between them. Click **"Remove Group"** to delete the currently selected group.
