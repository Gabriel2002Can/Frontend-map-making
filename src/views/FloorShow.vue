<template>
  <div class="floor-show-container">
    <!-- Header -->
    <header class="page-header">
      <button class="back-btn" @click="$router.push('/maps/' + mapId)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Map
      </button>
      <div v-if="floor" class="header-info">
        <h1>{{ floor.name }}</h1>
        <div class="header-meta">
          <span class="meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
            Floor {{ floor.number }}
          </span>
          <span class="meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            {{ floor.dimensionX }} × {{ floor.dimensionY }}
          </span>
          <span v-if="rooms.length > 0" class="meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            {{ rooms.length }} Rooms
          </span>
        </div>
      </div>
      <p v-else class="loading-text">Loading floor…</p>
    </header>

    <!-- Main Content -->
    <div v-if="floor" class="main-content">
      <!-- Map Area -->
      <div class="map-area">
        <!-- Zoom Controls -->
        <div class="zoom-toolbar">
          <button @click="zoomOut" :disabled="zoomLevel <= 0.3" class="zoom-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
          <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
          <button @click="zoomIn" :disabled="zoomLevel >= 2" class="zoom-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
          <button @click="resetZoom" class="zoom-btn reset" title="Reset zoom">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
          <button @click="fitToScreen" class="zoom-btn fit" title="Fit to screen">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path
                d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
              />
            </svg>
          </button>
        </div>

        <!-- Grid Container -->
        <div class="grid-container" ref="gridContainerRef">
          <div class="grid-scroll-area">
            <div class="grid-wrapper" :style="gridStyle">
              <div
                v-for="cell in allCells"
                :key="`${cell.x}-${cell.y}`"
                :class="getCellClass(cell)"
                :style="getCellStyle(cell)"
                @mouseenter="handleCellHover(cell, $event)"
                @mousemove="handleCellMove($event)"
                @mouseleave="handleCellLeave"
              ></div>
            </div>
          </div>

          <!-- Room Tooltip -->
          <transition name="tooltip-fade">
            <div v-if="tooltipVisible && tooltipRoom" class="room-tooltip" :style="tooltipStyle">
              <span class="tooltip-color" :style="{ backgroundColor: tooltipRoom.color }"></span>
              <span class="tooltip-name">{{ tooltipRoom.name }}</span>
            </div>
          </transition>
        </div>
      </div>

      <!-- Sidebar - Room Legend -->
      <aside v-if="rooms.length > 0" class="sidebar">
        <div class="sidebar-header">
          <h3>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Room Legend
          </h3>
          <span class="room-count">{{ rooms.length }}</span>
        </div>

        <div class="room-list">
          <div
            v-for="room in rooms"
            :key="room.id"
            class="room-card"
            @mouseenter="highlightRoom(room.id)"
            @mouseleave="unhighlightRoom"
          >
            <div class="room-card-header">
              <span class="room-color" :style="{ backgroundColor: room.color }"></span>
              <span class="room-name">{{ room.name }}</span>
            </div>
            <p v-if="room.description" class="room-desc">{{ room.description }}</p>
            <div class="room-stats">
              <span class="room-cell-count">{{ getRoomCellCount(room.id) }} cells</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getFloorById, getRoomsByFloorId } from '@/api/backend'

const props = defineProps({
  mapId: { type: Number, required: true },
  floorId: { type: Number, required: true },
})

const floor = ref(null)
const rooms = ref([])
const cellsWithRooms = ref(new Map())
const gridContainerRef = ref(null)

// Zoom state
const zoomLevel = ref(1)
const baseSize = 28

// Tooltip state
const tooltipVisible = ref(false)
const tooltipRoom = ref(null)
const tooltipPosition = ref({ x: 0, y: 0 })
let tooltipTimeout = null

// Highlight state
const highlightedRoomId = ref(null)

const load = async () => {
  try {
    floor.value = await getFloorById(props.floorId)

    // Load rooms
    const roomList = await getRoomsByFloorId(props.floorId)
    if (Array.isArray(roomList)) {
      rooms.value = roomList
    }

    // Build cell-to-room map
    if (floor.value?.cells) {
      const newMap = new Map()
      floor.value.cells.forEach((c) => {
        if (c.roomId != null) {
          newMap.set(`${c.x}-${c.y}`, c.roomId)
        }
      })
      cellsWithRooms.value = newMap
    }

    // Auto-fit after load
    setTimeout(() => fitToScreen(), 100)
  } catch (err) {
    console.error('Failed to load floor:', err)
    floor.value = null
  }
}

onMounted(load)

// Zoom functions
const zoomIn = () => {
  if (zoomLevel.value < 2) {
    zoomLevel.value = Math.min(2, zoomLevel.value + 0.2)
  }
}

const zoomOut = () => {
  if (zoomLevel.value > 0.3) {
    zoomLevel.value = Math.max(0.3, zoomLevel.value - 0.2)
  }
}

const resetZoom = () => {
  zoomLevel.value = 1
}

const fitToScreen = () => {
  if (!floor.value || !gridContainerRef.value) return

  const container = gridContainerRef.value
  const containerWidth = container.clientWidth - 40 // padding
  const containerHeight = container.clientHeight - 40

  const gridWidth = floor.value.dimensionX * baseSize
  const gridHeight = floor.value.dimensionY * baseSize

  const scaleX = containerWidth / gridWidth
  const scaleY = containerHeight / gridHeight

  // Use the smaller scale to fit both dimensions
  const newZoom = Math.min(scaleX, scaleY, 2)
  zoomLevel.value = Math.max(0.3, Math.min(2, newZoom))
}

// Handle window resize
const handleResize = () => {
  // Could auto-fit on resize if desired
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const getCellRoom = (cell) => {
  const cellKey = `${cell.x}-${cell.y}`
  const roomId = cellsWithRooms.value.get(cellKey)
  if (roomId == null) return null
  return rooms.value.find((r) => r.id === roomId)
}

const getRoomCellCount = (roomId) => {
  let count = 0
  cellsWithRooms.value.forEach((rid) => {
    if (rid === roomId) count++
  })
  return count
}

const allCells = computed(() => {
  if (!floor.value) return []
  const cells = []
  const filledMap = new Map(
    (floor.value.cells || []).filter((c) => c.isFilled).map((c) => [`${c.x}-${c.y}`, true]),
  )
  for (let y = 0; y < floor.value.dimensionY; y++) {
    for (let x = 0; x < floor.value.dimensionX; x++) {
      cells.push({ x, y, isFilled: !!filledMap.get(`${x}-${y}`) })
    }
  }
  return cells
})

const getCellClass = (cell) => {
  const room = getCellRoom(cell)
  const classes = ['cell']

  if (room) {
    classes.push('has-room')
    if (highlightedRoomId.value === room.id) {
      classes.push('highlighted')
    }
  } else if (cell.isFilled) {
    classes.push('filled')
  } else {
    classes.push('empty')
  }

  return classes
}

const getCellStyle = (cell) => {
  const cellRoom = getCellRoom(cell)
  const size = baseSize * zoomLevel.value

  if (!cellRoom) {
    return {
      width: `${size}px`,
      height: `${size}px`,
    }
  }

  const roomId = cellRoom.id
  const x = cell.x
  const y = cell.y

  // Check if adjacent cells have the same room
  const hasTop = cellsWithRooms.value.get(`${x}-${y - 1}`) === roomId
  const hasBottom = cellsWithRooms.value.get(`${x}-${y + 1}`) === roomId
  const hasLeft = cellsWithRooms.value.get(`${x - 1}-${y}`) === roomId
  const hasRight = cellsWithRooms.value.get(`${x + 1}-${y}`) === roomId

  const borderColor = cellRoom.color
  const borderWidth = Math.max(2, Math.round(2 * zoomLevel.value)) + 'px'

  // Use same color as background for internal borders (makes them invisible)
  const internalBorder = `${borderWidth} solid ${cellRoom.color}`
  const externalBorder = `${borderWidth} solid ${borderColor}`

  // Calculate border radius for corners
  const cornerRadius = Math.round(4 * zoomLevel.value) + 'px'
  const noRadius = '0px'

  const topLeft = !hasTop && !hasLeft ? cornerRadius : noRadius
  const topRight = !hasTop && !hasRight ? cornerRadius : noRadius
  const bottomLeft = !hasBottom && !hasLeft ? cornerRadius : noRadius
  const bottomRight = !hasBottom && !hasRight ? cornerRadius : noRadius

  return {
    width: `${size}px`,
    height: `${size}px`,
    borderTop: hasTop ? internalBorder : externalBorder,
    borderBottom: hasBottom ? internalBorder : externalBorder,
    borderLeft: hasLeft ? internalBorder : externalBorder,
    borderRight: hasRight ? internalBorder : externalBorder,
    borderRadius: `${topLeft} ${topRight} ${bottomRight} ${bottomLeft}`,
    backgroundColor: cellRoom.color,
  }
}

const tooltipStyle = computed(() => {
  return {
    left: `${tooltipPosition.value.x}px`,
    top: `${tooltipPosition.value.y}px`,
  }
})

const handleCellHover = (cell, event) => {
  const room = getCellRoom(cell)
  if (room) {
    clearTimeout(tooltipTimeout)
    tooltipTimeout = setTimeout(() => {
      tooltipRoom.value = room
      tooltipVisible.value = true
    }, 200)

    const rect = event.target.closest('.grid-container').getBoundingClientRect()
    tooltipPosition.value = {
      x: event.clientX - rect.left + 15,
      y: event.clientY - rect.top - 10,
    }
  }
}

const handleCellMove = (event) => {
  if (tooltipVisible.value || tooltipTimeout) {
    const rect = event.target.closest('.grid-container')?.getBoundingClientRect()
    if (rect) {
      tooltipPosition.value = {
        x: event.clientX - rect.left + 15,
        y: event.clientY - rect.top - 10,
      }
    }
  }
}

const handleCellLeave = () => {
  clearTimeout(tooltipTimeout)
  tooltipTimeout = null
  tooltipVisible.value = false
  tooltipRoom.value = null
}

const highlightRoom = (roomId) => {
  highlightedRoomId.value = roomId
}

const unhighlightRoom = () => {
  highlightedRoomId.value = null
}

const gridStyle = computed(() => {
  if (!floor.value) return {}
  const cols = floor.value.dimensionX || 1
  const size = baseSize * zoomLevel.value
  return {
    gridTemplateColumns: `repeat(${cols}, ${size}px)`,
    gridAutoRows: `${size}px`,
    gap: '0',
  }
})
</script>

<style scoped>
.floor-show-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  display: flex;
  flex-direction: column;
}

/* Header */
.page-header {
  background: linear-gradient(180deg, #1e293b 0%, transparent 100%);
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  border-bottom: 1px solid #334155;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: 1px solid #60a5fa;
  color: #60a5fa;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}

.back-btn svg {
  width: 18px;
  height: 18px;
}

.back-btn:hover {
  background: #60a5fa;
  color: #0f172a;
}

.header-info {
  flex: 1;
}

.header-info h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #f1f5f9;
}

.header-meta {
  display: flex;
  gap: 1.5rem;
  margin-top: 0.35rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: #94a3b8;
}

.meta-item svg {
  width: 16px;
  height: 16px;
  opacity: 0.7;
}

.loading-text {
  color: #94a3b8;
  margin: 0;
}

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* Map Area */
.map-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* Zoom Toolbar */
.zoom-toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #1e293b;
  border-bottom: 1px solid #334155;
}

.zoom-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: #334155;
  border: 1px solid #475569;
  border-radius: 8px;
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.2s;
}

.zoom-btn svg {
  width: 18px;
  height: 18px;
}

.zoom-btn:hover:not(:disabled) {
  background: #475569;
  border-color: #60a5fa;
  color: #60a5fa;
}

.zoom-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.zoom-btn.reset,
.zoom-btn.fit {
  margin-left: 0.5rem;
}

.zoom-level {
  min-width: 50px;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: #e2e8f0;
}

/* Grid Container */
.grid-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #0f172a;
}

.grid-scroll-area {
  position: absolute;
  inset: 0;
  overflow: auto;
  padding: 1.5rem;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.grid-wrapper {
  display: inline-grid;
  background: #1a2332;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid #334155;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

/* Cells */
.cell {
  box-sizing: border-box;
  transition:
    filter 0.15s,
    transform 0.15s;
}

.cell.filled {
  background: #3b82f6;
  border: 2px solid #4b5563;
  border-radius: 4px;
  margin: 1px;
}

.cell.empty {
  background: #374151;
  border: 2px solid #4b5563;
  border-radius: 4px;
  margin: 1px;
}

.cell.has-room {
  cursor: pointer;
}

.cell.has-room:hover {
  filter: brightness(1.2);
  z-index: 10;
}

.cell.highlighted {
  filter: brightness(1.3);
  z-index: 10;
  animation: pulse-highlight 1s ease-in-out infinite;
}

@keyframes pulse-highlight {
  0%,
  100% {
    filter: brightness(1.3);
  }
  50% {
    filter: brightness(1.5);
  }
}

/* Room Tooltip */
.room-tooltip {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(145deg, #1f2937 0%, #111827 100%);
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  z-index: 100;
  pointer-events: none;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
}

.tooltip-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}

.tooltip-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #f1f5f9;
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: all 0.15s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translateY(5px);
}

/* Sidebar */
.sidebar {
  width: 280px;
  background: #1e293b;
  border-left: 1px solid #334155;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #334155;
}

.sidebar-header h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #f1f5f9;
}

.sidebar-header h3 svg {
  width: 18px;
  height: 18px;
  color: #60a5fa;
}

.room-count {
  background: #334155;
  color: #94a3b8;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.room-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.room-card {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.room-card:hover {
  border-color: #60a5fa;
  background: #1a2744;
}

.room-card-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.room-color {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.room-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #f1f5f9;
}

.room-desc {
  margin: 0.5rem 0 0;
  padding-left: 1.35rem;
  font-size: 0.8rem;
  color: #94a3b8;
  line-height: 1.4;
}

.room-stats {
  margin-top: 0.5rem;
  padding-left: 1.35rem;
}

.room-cell-count {
  font-size: 0.75rem;
  color: #64748b;
}

/* Responsive */
@media (max-width: 900px) {
  .main-content {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    max-height: 250px;
    border-left: none;
    border-top: 1px solid #334155;
  }

  .room-list {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .room-card {
    flex: 1;
    min-width: 200px;
    max-width: 300px;
  }
}

@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-meta {
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .zoom-toolbar {
    justify-content: center;
  }

  .sidebar {
    max-height: 200px;
  }

  .room-card {
    min-width: 150px;
  }
}
</style>
