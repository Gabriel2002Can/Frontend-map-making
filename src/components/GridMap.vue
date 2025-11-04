<template>
  <div class="grid-map-container">
    <div class="grid-map-card">
      <!-- Title -->
      <h1 class="grid-map-title">Grid Map Viewer</h1>

      <!-- Input Interface -->
      <div v-if="!gridGenerated" class="input-section">
        <div class="input-description">
          <p>Enter the dimensions for your grid map</p>
          <p class="subtitle">Enter your grid map dimensions</p>
        </div>

        <div class="input-group">
          <div class="input-field">
            <label for="cols-input">Columns (X Dimension)</label>
            <input
              id="cols-input"
              v-model.number="inputCols"
              type="number"
              min="1"
              max="20"
              placeholder="e.g., 5"
              class="dimension-input"
            />
          </div>

          <div class="input-separator">×</div>

          <div class="input-field">
            <label for="rows-input">Rows (Y Dimension)</label>
            <input
              id="rows-input"
              v-model.number="inputRows"
              type="number"
              min="1"
              max="20"
              placeholder="e.g., 5"
              class="dimension-input"
            />
          </div>
        </div>

        <button @click="generateGrid" class="generate-button" :disabled="!isValidInput">
          Generate Grid
        </button>

        <p v-if="!isValidInput" class="validation-message">
          ⚠️ Please enter valid dimensions (1-20 for both columns and rows)
        </p>
      </div>

      <!-- Map Display Interface -->
      <div v-else>
        <!-- Header Actions -->
        <div class="header-actions">
          <div class="header-left">
            <p class="grid-map-dimensions">Dimensions: {{ mapData.gridDimensions }}</p>
            <p class="grid-info">
              Total Cells: {{ allCells.length }} | Filled Cells: {{ filledCells.length }}
            </p>
          </div>

          <div class="control-buttons">
            <!-- Zoom Controls -->
            <div class="zoom-controls">
              <button @click="zoomOut" class="zoom-button" :disabled="zoomLevel <= 0.5">
                <span>−</span>
              </button>
              <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
              <button @click="zoomIn" class="zoom-button" :disabled="zoomLevel >= 2">
                <span>+</span>
              </button>
            </div>

            <!-- Action Buttons -->
            <button @click="fillAll" class="action-button fill-all">Fill All</button>
            <button @click="clearAll" class="action-button clear-all">Clear All</button>
            <button @click="resetGrid" class="reset-button">Change Size</button>
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="loading-state">⏳ Loading map data...</div>

        <!-- Error state -->
        <div v-else-if="error" class="error-state">
          <h2>Error Loading Map</h2>
          <p>{{ error }}</p>
        </div>

        <!-- Map grid -->
        <div v-else class="grid-wrapper">
          <div
            class="grid-container"
            :style="{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              '--cell-size': cellSize + 'rem',
            }"
          >
            <!-- Iterate through all rows and columns to generate cells -->
            <div
              v-for="(cell, index) in allCells"
              :key="index"
              :class="['grid-cell', cell.filled ? 'grid-cell-filled' : 'grid-cell-empty']"
              @click="toggleCell(cell)"
              :title="`Cell (${cell.x}, ${cell.y})`"
            >
              {{ cell.x }},{{ cell.y }}
            </div>
          </div>

          <!-- Right Panel -->
          <div class="grid-sidebar">
            <!-- List of filled cells -->
            <div class="filled-cells-container">
              <h2 class="filled-cells-title">
                Filled Cells - {{ filledCells.length }}/{{ allCells.length }}
              </h2>
              <div class="filled-cells-list">
                <span v-if="filledCells.length === 0" class="empty-message">
                  Click on cells to fill them
                </span>
                <span v-for="(cell, idx) in filledCells" :key="idx" class="filled-cell-tag">
                  ({{ cell.x }}, {{ cell.y }})
                </span>
              </div>
            </div>

            <!-- JSON Preview -->
            <div class="json-preview">
              <h3 class="json-title">Current State (JSON)</h3>
              <div class="json-content">
                <pre>{{ JSON.stringify(getCurrentState(), null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Input dimensions
const inputCols = ref(5)
const inputRows = ref(5)

// Whether grid is generated
const gridGenerated = ref(false)

// Reactive data
const mapData = ref({
  gridDimensions: '',
  gridElements: [],
})

const loading = ref(false)
const error = ref(null)
const zoomLevel = ref(1)

// ============================================
// Method 2: Fetch from API (commented out)
// When using, uncomment below and import onMounted
// ============================================
//
// onMounted(async () => {
//   // If need to fetch data from API on load
//   loading.value = true;
//
//   try {
//     // Fetch map data from API
//     const response = await fetch('https://backend-map-frd3e5bch9bvgjef.canadacentral-01.azurewebsites.net/api/floor/1');
//
//     if (!response.ok) {
//       throw new Error('Network response was not ok');
//     }
//
//     // API should return format:
//     // {
//     //   id: 1,
//     //   name: "Floor 1",
//     //   number: 1,
//     //   dimensionX: 10,
//     //   dimensionY: 10,
//     //   mapId: 1,
//     //   cells: [
//     //     { x: 1, y: 3, isFilled: true },
//     //     ...
//     //   ]
//     // }
//     const floor = await response.json();
//
//     // Convert API data to internal format
//     mapData.value = {
//       gridDimensions: `${floor.dimensionX}x${floor.dimensionY}`,
//       gridElements: floor.cells || []
//     };
//
//     gridGenerated.value = true; // Automatically show grid
//   } catch (err) {
//     console.error('Error fetching map data:', err);
//     error.value = err.message;
//   } finally {
//     loading.value = false;
//   }
// });

// Validate input
const isValidInput = computed(() => {
  return (
    inputCols.value >= 1 && inputCols.value <= 20 && inputRows.value >= 1 && inputRows.value <= 20
  )
})

// Generate grid
const generateGrid = () => {
  if (!isValidInput.value) return

  // Generate grid structure
  mapData.value = {
    gridDimensions: `${inputCols.value}x${inputRows.value}`,
    gridElements: [],
  }

  gridGenerated.value = true
}

// Reset grid
const resetGrid = () => {
  gridGenerated.value = false
  mapData.value = {
    gridDimensions: '',
    gridElements: [],
  }
}

// Toggle cell state
const toggleCell = (cell) => {
  const index = mapData.value.gridElements.findIndex((el) => el.x === cell.x && el.y === cell.y)

  if (index !== -1) {
    // If exists, remove
    mapData.value.gridElements.splice(index, 1)
  } else {
    // If doesn't exist, add
    mapData.value.gridElements.push({
      x: cell.x,
      y: cell.y,
      filled: true,
    })
  }
}

// Fill all cells
const fillAll = () => {
  mapData.value.gridElements = []
  for (let y = 1; y <= rows.value; y++) {
    for (let x = 1; x <= cols.value; x++) {
      mapData.value.gridElements.push({
        x,
        y,
        filled: true,
      })
    }
  }
}

// Clear all cells
const clearAll = () => {
  mapData.value.gridElements = []
}

// Zoom in
const zoomIn = () => {
  if (zoomLevel.value < 2) {
    zoomLevel.value += 0.2
  }
}

// Zoom out
const zoomOut = () => {
  if (zoomLevel.value > 0.5) {
    zoomLevel.value -= 0.2
  }
}

// Calculate cell size based on grid dimensions
const cellSize = computed(() => {
  const maxCols = Math.max(cols.value, rows.value)

  // Dynamically adjust cell size based on max dimension
  if (maxCols <= 5) return 4 // Large cells
  if (maxCols <= 8) return 3 // Medium cells
  if (maxCols <= 12) return 2.5 // Smaller cells
  if (maxCols <= 16) return 2 // Small cells
  return 1.5 // Minimum cells
})

// Calculate font size based on cell size
const fontSize = computed(() => {
  if (cellSize.value >= 4) return '0.875rem'
  if (cellSize.value >= 3) return '0.75rem'
  if (cellSize.value >= 2.5) return '0.65rem'
  if (cellSize.value >= 2) return '0.55rem'
  return '0.5rem'
})

// Computed: Parse grid dimensions
const cols = computed(() => {
  if (!mapData.value.gridDimensions) return 0
  const [c] = mapData.value.gridDimensions.split('x').map(Number)
  return c
})

const rows = computed(() => {
  if (!mapData.value.gridDimensions) return 0
  const [, r] = mapData.value.gridDimensions.split('x').map(Number)
  return r
})

// Computed: Get all filled cells
const filledCells = computed(() => {
  return mapData.value.gridElements.filter((el) => el.filled)
})

// Computed: Generate all cells (including empty)
const allCells = computed(() => {
  const cells = []
  // Create a Map for fast lookup of filled cells
  const filledMap = new Map(filledCells.value.map((cell) => [`${cell.x}-${cell.y}`, true]))

  // Iterate through all rows and columns
  for (let y = 1; y <= rows.value; y++) {
    for (let x = 1; x <= cols.value; x++) {
      cells.push({
        x,
        y,
        filled: filledMap.has(`${x}-${y}`),
      })
    }
  }

  return cells
})

// Get current state as JSON
const getCurrentState = () => {
  return {
    gridDimensions: mapData.value.gridDimensions,
    filledCells: filledCells.value,
    totalCells: allCells.value.length,
    fillPercentage:
      allCells.value.length > 0
        ? Math.round((filledCells.value.length / allCells.value.length) * 100)
        : 0,
  }
}
</script>

<style scoped>
.grid-map-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.grid-map-card {
  background-color: #1f2937;
  border-radius: 0.75rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  padding: 2rem;
  max-width: 1400px;
  width: 100%;
  border: 1px solid #374151;
}

.grid-map-title {
  font-size: 2rem;
  font-weight: bold;
  color: white;
  margin-bottom: 1.5rem;
  text-align: center;
}

/* Input Interface Styles */
.input-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 0;
}

.input-description {
  color: #9ca3af;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 1.125rem;
}

.subtitle {
  font-size: 0.95rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

.input-group {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.input-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-field label {
  color: #d1d5db;
  font-size: 0.875rem;
  font-weight: 500;
}

.dimension-input {
  width: 150px;
  padding: 0.75rem 1rem;
  font-size: 1.125rem;
  color: white;
  background-color: #374151;
  border: 2px solid #4b5563;
  border-radius: 0.5rem;
  outline: none;
  transition: all 0.3s;
  text-align: center;
}

.dimension-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.dimension-input::placeholder {
  color: #6b7280;
}

.input-separator {
  color: #9ca3af;
  font-size: 2rem;
  font-weight: bold;
  padding-bottom: 0.5rem;
}

.generate-button {
  padding: 0.75rem 2rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
  background-color: #3b82f6;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);
}

.generate-button:hover:not(:disabled) {
  background-color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 15px 20px -3px rgba(59, 130, 246, 0.4);
}

.generate-button:disabled {
  background-color: #4b5563;
  cursor: not-allowed;
  box-shadow: none;
}

.validation-message {
  color: #fca5a5;
  font-size: 0.875rem;
  margin-top: 1rem;
}

/* Header Actions */
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.grid-map-dimensions {
  color: #9ca3af;
  font-size: 1rem;
  font-weight: 600;
}

.grid-info {
  color: #6b7280;
  font-size: 0.9rem;
}

.control-buttons {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #374151;
  padding: 0.5rem;
  border-radius: 0.375rem;
}

.zoom-button {
  padding: 0.4rem 0.75rem;
  color: white;
  background-color: #4b5563;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
}

.zoom-button:hover:not(:disabled) {
  background-color: #3b82f6;
}

.zoom-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.zoom-level {
  color: #d1d5db;
  font-weight: 600;
  min-width: 50px;
  text-align: center;
}

.action-button {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.3s;
  color: white;
}

.action-button.fill-all {
  background-color: #10b981;
}

.action-button.fill-all:hover {
  background-color: #059669;
}

.action-button.clear-all {
  background-color: #ef4444;
}

.action-button.clear-all:hover {
  background-color: #dc2626;
}

.reset-button {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  background-color: #6b7280;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.3s;
}

.reset-button:hover {
  background-color: #4b5563;
}

.loading-state,
.error-state {
  color: white;
  text-align: center;
  padding: 2rem;
  font-size: 1.1rem;
}

.error-state {
  background-color: #ef4444;
  border-radius: 0.5rem;
}

.error-state h2 {
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.grid-wrapper {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.grid-container {
  display: inline-grid;
  gap: 0.5rem;
  padding: 1rem;
  background-color: #374151;
  border-radius: 0.5rem;
  justify-self: center;
  border: 1px solid #4b5563;
}

.grid-cell {
  width: var(--cell-size, 4rem);
  height: var(--cell-size, 4rem);
  border-radius: 0.375rem;
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: v-bind(fontSize);
  font-weight: 600;
  transition: all 0.3s;
  cursor: pointer;
  min-width: 1.5rem;
  min-height: 1.5rem;
}

.grid-cell:hover {
  transform: scale(1.08);
}

.grid-cell-filled {
  background-color: #3b82f6;
  border-color: #60a5fa;
  color: white;
  box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.5);
}

.grid-cell-filled:hover {
  box-shadow: 0 15px 20px -3px rgba(59, 130, 246, 0.6);
}

.grid-cell-empty {
  background-color: #4b5563;
  border-color: #6b7280;
  color: #9ca3af;
}

.grid-cell-empty:hover {
  background-color: #5a6575;
  border-color: #9ca3af;
}

.grid-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.filled-cells-container,
.json-preview {
  background-color: #374151;
  border-radius: 0.5rem;
  padding: 1rem;
  border: 1px solid #4b5563;
}

.filled-cells-title,
.json-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #60a5fa;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #4b5563;
}

.filled-cells-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 250px;
  overflow-y: auto;
}

.filled-cell-tag {
  padding: 0.5rem 0.75rem;
  background-color: #3b82f6;
  color: white;
  border-radius: 0.375rem;
  font-size: 0.85rem;
  font-weight: 500;
  border: 1px solid #2563eb;
}

.empty-message {
  color: #9ca3af;
  font-style: italic;
  padding: 1rem 0;
  text-align: center;
}

.json-content {
  background-color: #111827;
  padding: 0.75rem;
  border-radius: 0.375rem;
  max-height: 300px;
  overflow-y: auto;
}

.json-content pre {
  color: #10b981;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.4;
}

@media (max-width: 1024px) {
  .grid-wrapper {
    grid-template-columns: 1fr;
  }

  .grid-sidebar {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .grid-map-container {
    padding: 1rem;
  }

  .grid-map-card {
    padding: 1rem;
  }

  .grid-map-title {
    font-size: 1.5rem;
  }

  .header-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .control-buttons {
    flex-direction: column;
    width: 100%;
  }

  .grid-container {
    gap: 0.25rem;
    padding: 0.5rem;
  }

  .grid-cell {
    width: 30px;
    height: 30px;
    font-size: 0.5rem;
  }
}
</style>
