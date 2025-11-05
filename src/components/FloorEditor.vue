<template>
  <div class="floor-editor-container">
    <div class="floor-editor-card">
      <!-- Back Button -->
      <div class="editor-header">
        <button @click="goBack" class="back-button">← Back to Maps</button>
        <h1 class="editor-title">Floor Editor</h1>
        <div class="header-spacer"></div>
      </div>

      <!-- Floor Information -->
      <div class="floor-info">
        <div class="info-card">
          <span class="info-label">Floor Name:</span>
          <span class="info-value">{{ floor.name }}</span>
        </div>
        <div class="info-card">
          <span class="info-label">Floor #:</span>
          <span class="info-value">{{ floor.number }}</span>
        </div>
        <div class="info-card">
          <span class="info-label">Size:</span>
          <span class="info-value">{{ floor.dimensionX }}×{{ floor.dimensionY }}</span>
        </div>
        <div class="info-card">
          <span class="info-label">Total:</span>
          <span class="info-value">{{ totalCells }}</span>
        </div>
        <div class="info-card">
          <span class="info-label">Filled:</span>
          <span class="info-value highlight-filled">{{ filledCells.length }}</span>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="toolbar-group">
          <label class="zoom-label">Zoom:</label>
          <div class="zoom-controls">
            <button @click="zoomOut" class="zoom-button" :disabled="zoomLevel <= 0.5">−</button>
            <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
            <button @click="zoomIn" class="zoom-button" :disabled="zoomLevel >= 2">+</button>
          </div>
        </div>

        <div class="toolbar-group">
          <button @click="fillAll" class="action-button fill-all">Fill All</button>
          <button @click="clearAll" class="action-button clear-all">Clear All</button>
        </div>
      </div>

      <!-- Editing Area -->
      <div class="editor-wrapper" :class="`device-${deviceType}`">
        <!-- Grid -->
        <div class="grid-wrapper">
          <div class="grid-container" :style="gridStyle">
            <div
              v-for="cell in allCells"
              :key="`${cell.x}-${cell.y}`"
              :class="['grid-cell', cell.isFilled ? 'grid-cell-filled' : 'grid-cell-empty']"
              @click="toggleCell(cell)"
              :title="`(${cell.x}, ${cell.y})`"
            >
              <span class="cell-text">{{ cell.x }},{{ cell.y }}</span>
            </div>
          </div>
        </div>

        <!-- Right Panel -->
        <div v-if="deviceType === 'desktop'" class="editor-sidebar">
          <!-- Filled Cells List -->
          <div class="filled-cells-section">
            <h3 class="section-title">Filled Cells {{ filledCells.length }}/{{ totalCells }}</h3>
            <div class="filled-cells-list">
              <div v-if="filledCells.length === 0" class="empty-state">
                <p>No cells filled</p>
              </div>
              <div v-else class="cells-tags">
                <span
                  v-for="(cell, idx) in filledCells"
                  :key="idx"
                  class="cell-tag"
                  @click="removeCell(cell)"
                >
                  ({{ cell.x }}, {{ cell.y }}) ✕
                </span>
              </div>
            </div>
          </div>

          <!-- JSON Preview -->
          <div class="json-section">
            <h3 class="section-title">JSON Payload</h3>
            <div class="json-output">
              <pre>{{ JSON.stringify(generatePayload(), null, 2) }}</pre>
            </div>
          </div>
        </div>

        <!-- Mobile summary -->
        <div v-else class="mobile-summary">
          <div class="summary-card">
            <span class="summary-label">Filled:</span>
            <span class="summary-value">{{ filledCells.length }} / {{ totalCells }}</span>
          </div>
        </div>
      </div>

      <!-- Bottom Buttons -->
      <div class="editor-footer">
        <button
          @click="saveChanges"
          class="save-button"
          :disabled="isSaving || filledCells.length === 0"
        >
          <span v-if="isSaving">Saving...</span>
          <span v-else>Save Changes</span>
        </button>
        <button @click="goBack" class="cancel-button">Go Back</button>
      </div>

      <!-- Action Message -->
      <transition name="fade">
        <div v-if="actionMessage" :class="['action-message', actionMessage.type]">
          {{ actionMessage.text }}
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { getFloorById } from '@/api/backend'

// Define emitted events
const emit = defineEmits(['save-cells', 'back'])

// Receive props
const props = defineProps({
  floor: {
    type: Object,
    required: true,
  },
})

// Reactive data
const zoomLevel = ref(1)
const isSaving = ref(false)
const actionMessage = ref(null)
const filledCellsData = ref([])
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)

// Initialize filled cells from props (fallback)
if (props.floor.cells && Array.isArray(props.floor.cells)) {
  filledCellsData.value = props.floor.cells.filter((cell) => cell.isFilled)
}

// Load filled cells from API to ensure we show the persisted state
const loadInitialCells = async () => {
  try {
    const fullFloor = await getFloorById(props.floor.id)
    if (fullFloor && Array.isArray(fullFloor.cells)) {
      filledCellsData.value = fullFloor.cells
        .filter((c) => c.isFilled)
        .map((c) => ({ x: c.x, y: c.y, isFilled: true }))
    }
  } catch (err) {
    console.error('Failed to load floor cells:', err)
  }
}

// Listen to window size
const handleResize = () => {
  if (typeof window !== 'undefined') {
    windowWidth.value = window.innerWidth
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  // Fetch latest cells for this floor
  loadInitialCells()
})

// If the floor ID changes while this component is mounted, reload cells
watch(
  () => props.floor.id,
  () => {
    loadInitialCells()
  },
)

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// Compute device type
// mobile: < 640px
// tablet: 640px - 1024px
// desktop: >= 1024px
const deviceType = computed(() => {
  if (windowWidth.value < 640) return 'mobile'
  if (windowWidth.value < 1024) return 'tablet'
  return 'desktop'
})

// Computed properties

const totalCells = computed(() => {
  return props.floor.dimensionX * props.floor.dimensionY
})

const filledCells = computed(() => {
  return filledCellsData.value
})

const allCells = computed(() => {
  const cells = []
  const filledMap = new Map(filledCells.value.map((cell) => [`${cell.x}-${cell.y}`, true]))

  for (let y = 1; y <= props.floor.dimensionY; y++) {
    for (let x = 1; x <= props.floor.dimensionX; x++) {
      cells.push({
        x,
        y,
        isFilled: filledMap.has(`${x}-${y}`),
      })
    }
  }

  return cells
})

// 🔑 Key: compute cell size based on device type and grid size (in px)
const gridStyle = computed(() => {
  const cols = props.floor.dimensionX
  const rows = props.floor.dimensionY

  let baseCellSize = 40

  // Adjust base cell size for different device types
  if (deviceType.value === 'mobile') {
    // mobile: prefer showing full grid
    if (rows > 20) {
      baseCellSize = 24
    } else if (rows > 15) {
      baseCellSize = 28
    } else if (rows > 12) {
      baseCellSize = 32
    } else if (rows > 8) {
      baseCellSize = 38
    } else {
      baseCellSize = 44
    }
  } else if (deviceType.value === 'tablet') {
    // tablet: balance visibility and operability
    if (rows > 20) {
      baseCellSize = 34
    } else if (rows > 15) {
      baseCellSize = 42
    } else if (rows > 12) {
      baseCellSize = 50
    } else if (rows > 8) {
      baseCellSize = 60
    } else {
      baseCellSize = 72
    }
  } else {
    // desktop: larger cells for precise editing
    if (rows > 20) {
      baseCellSize = 44
    } else if (rows > 15) {
      baseCellSize = 56
    } else if (rows > 12) {
      baseCellSize = 68
    } else if (rows > 8) {
      baseCellSize = 84
    } else {
      baseCellSize = 100
    }
  }

  // Apply zoom
  const finalCellSize = baseCellSize * zoomLevel.value

  return {
    gridTemplateColumns: `repeat(${cols}, ${finalCellSize}px)`,
    gap: '0.25rem',
  }
})

// Methods

const toggleCell = (cell) => {
  const index = filledCellsData.value.findIndex((c) => c.x === cell.x && c.y === cell.y)

  if (index !== -1) {
    filledCellsData.value.splice(index, 1)
  } else {
    filledCellsData.value.push({
      x: cell.x,
      y: cell.y,
      isFilled: true,
    })
  }
}

const removeCell = (cell) => {
  const index = filledCellsData.value.findIndex((c) => c.x === cell.x && c.y === cell.y)

  if (index !== -1) {
    filledCellsData.value.splice(index, 1)
  }
}

const fillAll = () => {
  filledCellsData.value = []
  for (let y = 1; y <= props.floor.dimensionY; y++) {
    for (let x = 1; x <= props.floor.dimensionX; x++) {
      filledCellsData.value.push({
        x,
        y,
        isFilled: true,
      })
    }
  }
  showMessage('All cells filled!', 'success')
}

const clearAll = () => {
  if (filledCells.value.length === 0) {
    showMessage('No cells to clear', 'info')
    return
  }
  filledCellsData.value = []
  showMessage('All cells cleared!', 'success')
}

const zoomIn = () => {
  if (zoomLevel.value < 2) {
    zoomLevel.value += 0.2
  }
}

const zoomOut = () => {
  if (zoomLevel.value > 0.5) {
    zoomLevel.value -= 0.2
  }
}

const generatePayload = () => {
  return {
    floorId: props.floor.id,
    cells: filledCells.value.map((cell) => ({
      x: cell.x,
      y: cell.y,
      isFilled: true,
    })),
  }
}

const saveChanges = () => {
  if (filledCells.value.length === 0) {
    showMessage('Please fill at least one cell', 'error')
    return
  }

  isSaving.value = true
  const payload = generatePayload()
  emit('save-cells', payload)
  showMessage('✓ Changes saved!', 'success')
}

const showMessage = (text, type = 'info') => {
  actionMessage.value = { text, type }
  setTimeout(() => {
    actionMessage.value = null
  }, 3000)
}

const goBack = () => {
  emit('back')
}
</script>

<style scoped>
.floor-editor-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
}

.floor-editor-card {
  background-color: #1f2937;
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  padding: 1.5rem;
  max-width: 1600px;
  width: 100%;
  border: 1px solid #374151;
}

/* Header */
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.back-button {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: #60a5fa;
  background-color: transparent;
  border: 1px solid #60a5fa;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.back-button:hover {
  background-color: #60a5fa;
  color: #1f2937;
}

.editor-title {
  font-size: 1.875rem;
  font-weight: bold;
  color: white;
  text-align: center;
  flex: 1;
  margin: 0;
}

.header-spacer {
  width: 100px;
}

/* Floor Info */
.floor-info {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.info-card {
  background-color: #374151;
  padding: 1rem;
  border-radius: 0.5rem;
  border-left: 4px solid #3b82f6;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  color: #9ca3af;
  font-size: 0.8rem;
  font-weight: 500;
}

.info-value {
  color: white;
  font-weight: 600;
  font-size: 1rem;
}

.info-value.highlight-filled {
  color: #10b981;
  background-color: rgba(16, 185, 129, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

/* Toolbar */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  background-color: #374151;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.zoom-label {
  color: #d1d5db;
  font-weight: 500;
  white-space: nowrap;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #1f2937;
  padding: 0.25rem;
  border-radius: 0.375rem;
}

.zoom-button {
  padding: 0.25rem 0.5rem;
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
  white-space: nowrap;
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

/* Editor Wrapper - responsive */
.editor-wrapper {
  display: grid;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

/* mobile: single column */
.editor-wrapper.device-mobile {
  grid-template-columns: 1fr;
}

/* tablet: single column */
.editor-wrapper.device-tablet {
  grid-template-columns: 1fr;
}

/* desktop: two columns (grid main, sidebar 300px) */
.editor-wrapper.device-desktop {
  grid-template-columns: 1fr 300px;
}

/* Grid Wrapper */
.grid-wrapper {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background-color: #111827;
  padding: 1.5rem;
  border-radius: 0.5rem;
  overflow: auto;
  border: 1px solid #374151;
  min-height: 500px;
}

.grid-container {
  display: inline-grid;
  gap: 0.25rem;
  padding: 0.5rem;
  background-color: #1f2937;
  border-radius: 0.375rem;
  place-self: start center;
}

/* Grid Cell */
.grid-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 600;
  border-radius: 0.25rem;
  border: 2px solid;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  min-width: 30px;
  min-height: 30px;
}

.grid-cell:hover {
  transform: scale(1.08);
}

.grid-cell-filled {
  background-color: #3b82f6;
  border-color: #60a5fa;
  color: white;
  box-shadow: 0 4px 10px -2px rgba(59, 130, 246, 0.5);
}

.grid-cell-filled:hover {
  box-shadow: 0 6px 15px -2px rgba(59, 130, 246, 0.7);
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

.cell-text {
  display: none;
}

.grid-cell:hover .cell-text {
  display: block;
  font-size: 0.5rem;
}

/* Sidebar (desktop only) */
.editor-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.filled-cells-section,
.json-section {
  background-color: #374151;
  border-radius: 0.5rem;
  padding: 1rem;
  border: 1px solid #4b5563;
}

.section-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #60a5fa;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #4b5563;
  margin: 0 0 0.75rem 0;
}

.filled-cells-list {
  max-height: 250px;
  overflow-y: auto;
}

.empty-state {
  text-align: center;
  color: #9ca3af;
  padding: 1rem 0;
}

.cells-tags {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cell-tag {
  background-color: #3b82f6;
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #2563eb;
}

.cell-tag:hover {
  background-color: #1d4ed8;
  border-color: #1e40af;
}

.json-output {
  background-color: #111827;
  padding: 0.75rem;
  border-radius: 0.375rem;
  max-height: 300px;
  overflow-y: auto;
}

.json-output pre {
  color: #10b981;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.4;
}

/* Mobile Summary */
.mobile-summary {
  background-color: #374151;
  padding: 1rem;
  border-radius: 0.5rem;
  display: flex;
  justify-content: center;
}

.summary-card {
  text-align: center;
  color: #d1d5db;
}

.summary-label {
  display: block;
  font-size: 0.8rem;
  color: #9ca3af;
  margin-bottom: 0.25rem;
}

.summary-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 600;
  color: #10b981;
}

/* Footer */
.editor-footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.save-button {
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background-color: #10b981;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3);
}

.save-button:hover:not(:disabled) {
  background-color: #059669;
  transform: translateY(-2px);
  box-shadow: 0 15px 20px -3px rgba(16, 185, 129, 0.4);
}

.save-button:disabled {
  background-color: #6b7280;
  cursor: not-allowed;
  box-shadow: none;
}

.cancel-button {
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background-color: #6b7280;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-button:hover {
  background-color: #4b5563;
}

/* Action Message */
.action-message {
  position: fixed;
  top: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  z-index: 1000;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.action-message.success {
  background-color: #10b981;
  color: white;
}

.action-message.error {
  background-color: #ef4444;
  color: white;
}

.action-message.info {
  background-color: #3b82f6;
  color: white;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Tablet adjustments */
@media (max-width: 1024px) {
  .floor-editor-card {
    padding: 1rem;
  }

  .floor-info {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  .info-card {
    padding: 0.75rem;
    font-size: 0.9rem;
  }

  .editor-title {
    font-size: 1.5rem;
  }

  .grid-wrapper {
    min-height: 400px;
  }
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .floor-editor-container {
    padding: 0.25rem;
  }

  .floor-editor-card {
    padding: 0.75rem;
    border-radius: 0.75rem;
  }

  .editor-header {
    flex-direction: column;
    align-items: stretch;
    margin-bottom: 1rem;
  }

  .editor-title {
    font-size: 1.25rem;
    margin: 0.5rem 0;
  }

  .back-button {
    width: 100%;
    text-align: center;
  }

  .header-spacer {
    display: none;
  }

  .floor-info {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .info-card {
    padding: 0.5rem;
    border-left-width: 3px;
    font-size: 0.8rem;
  }

  .info-label {
    font-size: 0.7rem;
  }

  .info-value {
    font-size: 0.9rem;
  }

  .toolbar {
    padding: 0.75rem;
    margin-bottom: 1rem;
    flex-direction: column;
    gap: 0.5rem;
  }

  .toolbar-group {
    width: 100%;
    justify-content: center;
    gap: 0.5rem;
  }

  .action-button {
    padding: 0.4rem 0.8rem;
    font-size: 0.75rem;
    flex: 1;
  }

  .grid-wrapper {
    min-height: 300px;
    padding: 0.75rem;
  }

  .editor-footer {
    gap: 0.5rem;
  }

  .save-button,
  .cancel-button {
    padding: 0.6rem;
    font-size: 0.9rem;
  }

  .action-message {
    top: 1rem;
    right: 1rem;
    padding: 0.75rem 1rem;
    font-size: 0.85rem;
  }
}
</style>
