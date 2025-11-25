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
          <button @click="fillAll" class="action-button fill-all" :disabled="isSaving">
            Fill All
          </button>
          <button @click="clearAll" class="action-button clear-all" :disabled="isSaving">
            Clear All
          </button>
        </div>
      </div>

      <!-- Selection Control Panel -->
      <transition name="slide-down">
        <div v-if="selectedArea.size > 0" class="selection-control-panel">
          <div class="selection-info">
            <span class="selection-text"
              >Selected Area: <strong>{{ selectedArea.size }}</strong> cells</span
            >
            <span class="selection-hint">Click again on selected cells to remove them</span>
          </div>
          <div class="selection-actions">
            <button @click="fillSelectedArea" class="action-btn fill-btn">Fill Area</button>
            <button @click="clearSelectedArea" class="action-btn clear-btn">Clear Area</button>
            <button @click="cancelSelection" class="action-btn cancel-btn">Cancel</button>
          </div>
        </div>
      </transition>

      <!-- Editing Area -->
      <div class="editor-wrapper" :class="`device-${deviceType}`">
        <!-- Grid -->
        <div class="grid-wrapper">
          <div v-if="isLoadingCells" class="loading-overlay">Loading cells…</div>
          <div
            class="grid-container"
            :style="gridStyle"
            @mouseleave="handleMouseLeave"
            @mouseup="handleMouseUp"
          >
            <div
              v-for="cell in allCells"
              :key="`${cell.x}-${cell.y}`"
              :class="getCellClass(cell)"
              @mousedown="handleMouseDown(cell, $event)"
              @mouseenter="handleMouseEnter(cell)"
              :title="`(${cell.x + 1}, ${cell.y + 1})`"
            >
              <span class="cell-text">{{ cell.x + 1 }},{{ cell.y + 1 }}</span>
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
                  ({{ cell.x + 1 }}, {{ cell.y + 1 }}) ✕
                </span>
              </div>
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
        <button @click="saveChanges" class="save-button" :disabled="isSaving">
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
const isLoadingCells = ref(false)
const actionMessage = ref(null)
const filledCellsData = ref([])
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)

// Selection state
const isSelecting = ref(false)
const isDragging = ref(false)
const selectedArea = ref(new Set())
const selectionStart = ref(null)
const mouseDownCell = ref(null)
const dragThreshold = 5
const mouseDownPosition = ref({ x: 0, y: 0 })
const currentDragArea = ref(new Set())

// Initialize filled cells from props (fallback)
if (props.floor.cells && Array.isArray(props.floor.cells)) {
  filledCellsData.value = props.floor.cells.filter((cell) => cell.isFilled)
}

// Load filled cells from API to ensure we show the persisted state
const loadInitialCells = async () => {
  isLoadingCells.value = true
  try {
    const fullFloor = await getFloorById(props.floor.id)
    if (fullFloor && Array.isArray(fullFloor.cells)) {
      filledCellsData.value = fullFloor.cells
        .filter((c) => c.isFilled)
        .map((c) => ({ x: c.x, y: c.y, isFilled: true }))
    }
  } catch (err) {
    console.error('Failed to load floor cells:', err)
  } finally {
    isLoadingCells.value = false
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
  window.addEventListener('mouseup', handleMouseUp)
  window.addEventListener('mousemove', handleGlobalMouseMove)
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
  window.removeEventListener('mouseup', handleMouseUp)
  window.removeEventListener('mousemove', handleGlobalMouseMove)
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

  for (let y = 0; y < props.floor.dimensionY; y++) {
    for (let x = 0; x < props.floor.dimensionX; x++) {
      cells.push({
        x,
        y,
        isFilled: filledMap.has(`${x}-${y}`),
      })
    }
  }

  return cells
})

//  Key: compute cell size based on device type and grid size (in px)
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

const isCellFilled = (cell) => {
  return filledCellsData.value.findIndex((c) => c.x === cell.x && c.y === cell.y) !== -1
}

const isInSelection = (cell) => {
  return selectedArea.value.has(`${cell.x}-${cell.y}`)
}

const isInCurrentDrag = (cell) => {
  return currentDragArea.value.has(`${cell.x}-${cell.y}`)
}

const getCellClass = (cell) => {
  const classes = ['grid-cell']

  if (isDragging.value && isInCurrentDrag(cell)) {
    if (isInSelection(cell)) {
      classes.push('grid-cell-removing')
    } else {
      if (isCellFilled(cell)) {
        classes.push('grid-cell-selecting-filled')
      } else {
        classes.push('grid-cell-selecting')
      }
    }
  } else if (isInSelection(cell)) {
    if (isCellFilled(cell)) {
      classes.push('grid-cell-selecting-filled')
    } else {
      classes.push('grid-cell-selecting')
    }
  } else {
    if (cell.isFilled) {
      classes.push('grid-cell-filled')
    } else {
      classes.push('grid-cell-empty')
    }
  }

  return classes
}

const handleMouseDown = (cell, event) => {
  if (isLoadingCells.value) return

  event.preventDefault()
  isSelecting.value = true
  isDragging.value = false
  mouseDownCell.value = cell
  selectionStart.value = cell
  mouseDownPosition.value = { x: event.clientX, y: event.clientY }

  currentDragArea.value.clear()
}

const handleGlobalMouseMove = (event) => {
  if (!isSelecting.value || isDragging.value) return

  const deltaX = Math.abs(event.clientX - mouseDownPosition.value.x)
  const deltaY = Math.abs(event.clientY - mouseDownPosition.value.y)

  if (deltaX > dragThreshold || deltaY > dragThreshold) {
    isDragging.value = true
    if (selectionStart.value) {
      currentDragArea.value.add(`${selectionStart.value.x}-${selectionStart.value.y}`)
    }
  }
}

const handleMouseEnter = (cell) => {
  if (!isSelecting.value || !isDragging.value || !selectionStart.value) return

  const minX = Math.min(selectionStart.value.x, cell.x)
  const maxX = Math.max(selectionStart.value.x, cell.x)
  const minY = Math.min(selectionStart.value.y, cell.y)
  const maxY = Math.max(selectionStart.value.y, cell.y)

  currentDragArea.value.clear()
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      currentDragArea.value.add(`${x}-${y}`)
    }
  }
}

const handleMouseUp = () => {
  if (!isSelecting.value) return

  if (!isDragging.value && mouseDownCell.value) {
    const cellKey = `${mouseDownCell.value.x}-${mouseDownCell.value.y}`

    if (selectedArea.value.size > 0) {
      if (selectedArea.value.has(cellKey)) {
        selectedArea.value.delete(cellKey)
        showMessage('Cell removed from selection', 'info')
      } else {
        selectedArea.value.add(cellKey)
        showMessage('Cell added to selection', 'info')
      }
    } else {
      toggleCell(mouseDownCell.value)
    }
  } else if (isDragging.value) {
    currentDragArea.value.forEach((cellKey) => {
      if (selectedArea.value.has(cellKey)) {
        selectedArea.value.delete(cellKey)
      } else {
        selectedArea.value.add(cellKey)
      }
    })

    if (currentDragArea.value.size > 0) {
      showMessage(`Selection updated: ${selectedArea.value.size} cells selected`, 'info')
    }
  }

  isSelecting.value = false
  isDragging.value = false
  mouseDownCell.value = null
  selectionStart.value = null
  currentDragArea.value.clear()
}

const handleMouseLeave = () => {}

const fillSelectedArea = () => {
  if (selectedArea.value.size === 0) return

  let addedCount = 0
  selectedArea.value.forEach((cellKey) => {
    const [x, y] = cellKey.split('-').map(Number)
    const exists = filledCellsData.value.findIndex((c) => c.x === x && c.y === y)

    if (exists === -1) {
      filledCellsData.value.push({ x, y, isFilled: true })
      addedCount++
    }
  })

  showMessage(`Filled ${addedCount} cells in selected area`, 'success')
  cancelSelection()
}

const clearSelectedArea = () => {
  if (selectedArea.value.size === 0) return

  let removedCount = 0
  selectedArea.value.forEach((cellKey) => {
    const [x, y] = cellKey.split('-').map(Number)
    const index = filledCellsData.value.findIndex((c) => c.x === x && c.y === y)

    if (index !== -1) {
      filledCellsData.value.splice(index, 1)
      removedCount++
    }
  })

  showMessage(`Cleared ${removedCount} cells in selected area`, 'success')
  cancelSelection()
}

const cancelSelection = () => {
  selectedArea.value.clear()
  currentDragArea.value.clear()
  selectionStart.value = null
  isSelecting.value = false
  isDragging.value = false
}

// Methods
const toggleCell = (cell) => {
  if (isLoadingCells.value) return
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
  if (isLoadingCells.value) return
  const index = filledCellsData.value.findIndex((c) => c.x === cell.x && c.y === cell.y)

  if (index !== -1) {
    filledCellsData.value.splice(index, 1)
  }
}

const fillAll = () => {
  if (isLoadingCells.value) return
  filledCellsData.value = []
  for (let y = 0; y < props.floor.dimensionY; y++) {
    for (let x = 0; x < props.floor.dimensionX; x++) {
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
  if (isLoadingCells.value) return
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
  // Create full list of cells with filled status
  const allCellsWithStatus = []
  const filledMap = new Map(filledCells.value.map((c) => [`${c.x}-${c.y}`, true]))

  // Generate full grid with filled status
  for (let y = 0; y < props.floor.dimensionY; y++) {
    for (let x = 0; x < props.floor.dimensionX; x++) {
      allCellsWithStatus.push({
        x,
        y,
        isFilled: filledMap.has(`${x}-${y}`),
      })
    }
  }

  return {
    floorId: props.floor.id,
    cells: allCellsWithStatus,
  }
}

const saveChanges = async () => {
  isSaving.value = true
  const payload = generatePayload()

  try {
    emit('save-cells', payload)
    showMessage('Changes saved successfully!', 'success')
  } catch (err) {
    console.error('Save failed:', err)
    showMessage('Failed to save changes', 'error')
  } finally {
    setTimeout(() => {
      isSaving.value = false
    }, 500)
  }
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

/* Selection Control Panel */
.selection-control-panel {
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  border-radius: 0.75rem;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  box-shadow: 0 10px 25px rgba(139, 92, 246, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.selection-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: white;
}

.selection-text {
  font-size: 1rem;
  font-weight: 500;
}

.selection-text strong {
  font-weight: 700;
  font-size: 1.1rem;
}

.selection-hint {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  font-style: italic;
}

.selection-actions {
  display: flex;
  gap: 0.75rem;
}

.action-btn {
  padding: 0.6rem 1.2rem;
  font-size: 0.9rem;
  font-weight: 600;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.fill-btn {
  background-color: #10b981;
  color: white;
}

.fill-btn:hover {
  background-color: #059669;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
}

.clear-btn {
  background-color: #ef4444;
  color: white;
}

.clear-btn:hover {
  background-color: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
}

.cancel-btn {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  backdrop-filter: blur(10px);
}

.cancel-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

/* Panel Animation */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
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
  position: relative;
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

/* Selection Highlight */
.grid-cell-selecting {
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%) !important;
  border-color: #c4b5fd !important;
  color: white !important;
  box-shadow:
    0 0 20px rgba(139, 92, 246, 0.6),
    inset 0 0 10px rgba(255, 255, 255, 0.2) !important;
  transform: scale(1.05);
  z-index: 5;
  animation: selecting-pulse 1.5s ease-in-out infinite;
}

@keyframes selecting-pulse {
  0%,
  100% {
    box-shadow:
      0 0 20px rgba(139, 92, 246, 0.6),
      inset 0 0 10px rgba(255, 255, 255, 0.2);
  }
  50% {
    box-shadow:
      0 0 30px rgba(139, 92, 246, 0.8),
      inset 0 0 15px rgba(255, 255, 255, 0.3);
  }
}

.grid-cell-removing {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%) !important;
  border-color: #ef4444 !important;
  color: #fca5a5 !important;
  box-shadow:
    0 0 20px rgba(239, 68, 68, 0.6),
    inset 0 0 10px rgba(0, 0, 0, 0.3) !important;
  transform: scale(1.05);
  z-index: 5;
  animation: removing-pulse 1.5s ease-in-out infinite;
}

@keyframes removing-pulse {
  0%,
  100% {
    box-shadow:
      0 0 20px rgba(239, 68, 68, 0.6),
      inset 0 0 10px rgba(0, 0, 0, 0.3);
  }
  50% {
    box-shadow:
      0 0 30px rgba(239, 68, 68, 0.8),
      inset 0 0 15px rgba(0, 0, 0, 0.5);
  }
}

.grid-cell-selecting-filled {
  background: linear-gradient(135deg, #fb923c 0%, #f97316 100%) !important;
  border-color: #fdba74 !important;
  color: white !important;
  box-shadow:
    0 0 20px rgba(249, 115, 22, 0.6),
    inset 0 0 10px rgba(255, 255, 255, 0.2) !important;
  transform: scale(1.05);
  z-index: 5;
  animation: selecting-pulse-orange 1.5s ease-in-out infinite;
}

@keyframes selecting-pulse-orange {
  0%,
  100% {
    box-shadow:
      0 0 20px rgba(249, 115, 22, 0.6),
      inset 0 0 10px rgba(255, 255, 255, 0.2);
  }
  50% {
    box-shadow:
      0 0 30px rgba(249, 115, 22, 0.8),
      inset 0 0 15px rgba(255, 255, 255, 0.3);
  }
}

.cell-text {
  display: none;
}

.grid-cell:hover .cell-text {
  display: block;
  font-size: 0.5rem;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  color: #e5e7eb;
  font-weight: 600;
  z-index: 2;
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

  .selection-control-panel {
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .selection-info {
    justify-content: center;
  }

  .selection-text {
    font-size: 0.9rem;
  }

  .selection-actions {
    flex-direction: column;
    width: 100%;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
    padding: 0.5rem;
    font-size: 0.85rem;
  }
}
</style>
