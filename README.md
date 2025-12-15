# **Map Making Tool — Frontend**

A web application for creating, managing, and visualizing interactive floor maps. Design building layouts, define rooms, add icons, and navigate through multi-floor structures with ease.

**Link to the Backend:** https://github.com/Gabriel2002Can/Backend-map-making

---

## **Getting Started**

When you first open the application, you'll be greeted by the **Map Management System** — your central hub for all map-related activities.

---

## **Pages & Features**

### 🗺️ **Map Management (Home Page)**

This is the main dashboard where you can see all your maps at a glance.

**What you can do here:**

- **View all maps** — See a list of all maps you've created, along with how many floors each one has
- **Create a new map** — Click the "+ New Map" button to start building a new map from scratch
- **Edit map names** — Rename any map by clicking the edit (✎) button
- **Delete maps** — Remove maps you no longer need with the delete (🗑) button
- **Access floors** — Each map card shows its floors, allowing you to quickly jump into any floor

**From each map card, you can:**

- Click "View" to see the map's floor overview
- Add new floors using the "+ Floor" button
- Edit or delete individual floors

---

### 🏢 **Map Overview**

When you click "View" on a map, you'll see the **Map Overview** page.

**What you can do here:**

- **See all floors** — View a list of all floors belonging to this map, sorted by floor number
- **Navigate to floors** — Click on any floor to view its detailed layout
- **Go back** — Return to the main Map Management page using the "← Back" button

---

### 🛠️ **Create New Floor**

When you click "+ Floor" on a map, you'll be taken to the **Floor Creation** form.

**What you need to provide:**

- **Floor Name** — Give your floor a descriptive name (e.g., "Ground Floor", "Basement", "Rooftop")
- **Floor Number** — Assign a number to identify the floor's position in the building
- **Dimensions** — Set the width and height of your floor grid (1-50 cells each)

**Helpful features:**

- **Live preview** — See a summary of your floor settings before creating it
- **Cell count** — The form shows how many total cells your floor will have

---

### ✏️ **Floor Editor**

The **Floor Editor** is where the magic happens — this is your canvas for designing floor layouts.

**Main features:**

- **Interactive grid** — Click and drag to select cells on your floor
- **Zoom controls** — Zoom in and out to work with large or small areas
- **Fill/Clear all** — Quickly fill the entire floor or clear everything

**Cell editing options:**

- **Fill cells** — Mark cells as filled (solid/walkable areas)
- **Assign rooms** — Group cells together and assign them to named rooms with custom colors
- **Add icons** — Place icons on cells to indicate features like doors, stairs, elevators, etc.

**Room management:**

- Create new rooms with custom names and colors
- Assign selected cells to existing rooms
- Visualize different areas of your floor with color coding

**Saving your work:**

- Changes are saved when you click the save button
- The editor keeps track of filled cells, room assignments, and icons

---

### 👁️ **Floor View**

When you click on a floor from the Map Overview, you'll see the **Floor View** page — a read-only visualization of your floor.

**What you can see:**

- **Floor details** — Name, floor number, and dimensions displayed in the header
- **Room count** — See how many rooms are defined on this floor
- **Interactive grid** — View the complete floor layout with all cells, rooms, and icons
- **Room tooltips** — Hover over cells to see which room they belong to

**Navigation features:**

- **Zoom controls** — Zoom in/out, reset zoom, or fit the entire floor to your screen
- **Back button** — Return to the Map Overview

---

## **Typical Workflow**

1. **Create a map** — Start by creating a new map for your building or project
2. **Add floors** — Create floors for each level of your building
3. **Design layouts** — Use the Floor Editor to draw walls, define rooms, and add icons
4. **View your work** — Use the Floor View to see the final result and navigate your maps

---

## **Future Features**

- Pin placement and customization (markers with text, images, or links)
- Enhanced interactive map navigation
- Additional icon types and customization options
