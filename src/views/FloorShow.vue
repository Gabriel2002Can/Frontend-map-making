<template>
  <div class="floor-show-container">
    <div class="card">
      <button class="back" @click="$router.push('/maps/' + mapId)">← Back to map</button>
      <h1 v-if="floor">{{ floor.name }}</h1>
      <p v-else>Loading floor…</p>

      <div v-if="floor" class="meta">
        <p>Floor #: {{ floor.number }}</p>
        <p>Size: {{ floor.dimensionX }} × {{ floor.dimensionY }}</p>
      </div>

      <!-- Floor Grid -->
      <div v-if="floor" class="grid-section">
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

        <!-- Room Tooltip -->
        <transition name="tooltip-fade">
          <div v-if="tooltipVisible && tooltipRoom" class="room-tooltip" :style="tooltipStyle">
            <span class="tooltip-color" :style="{ backgroundColor: tooltipRoom.color }"></span>
            <span class="tooltip-name">{{ tooltipRoom.name }}</span>
          </div>
        </transition>
      </div>

      <!-- Rooms Legend -->
      <div v-if="floor && rooms.length > 0" class="rooms-legend">
        <h3 class="legend-title">Rooms</h3>
        <div class="legend-list">
          <div v-for="room in rooms" :key="room.id" class="legend-item">
            <span class="legend-color" :style="{ backgroundColor: room.color }"></span>
            <div class="legend-info">
              <span class="legend-name">{{ room.name }}</span>
              <span v-if="room.description" class="legend-desc">{{ room.description }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getFloorById, getRoomsByFloorId } from '@/api/backend'

const props = defineProps({
  mapId: { type: Number, required: true },
  floorId: { type: Number, required: true },
})

const floor = ref(null)
const rooms = ref([])
const cellsWithRooms = ref(new Map())

// Tooltip state
const tooltipVisible = ref(false)
const tooltipRoom = ref(null)
const tooltipPosition = ref({ x: 0, y: 0 })
let tooltipTimeout = null

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
  } catch (err) {
    console.error('Failed to load floor:', err)
    floor.value = null
  }
}

onMounted(load)

const getCellRoom = (cell) => {
  const cellKey = `${cell.x}-${cell.y}`
  const roomId = cellsWithRooms.value.get(cellKey)
  if (roomId == null) return null
  return rooms.value.find((r) => r.id === roomId)
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
  if (room) {
    return ['cell', 'has-room']
  }
  return ['cell', cell.isFilled ? 'filled' : 'empty']
}

const getCellStyle = (cell) => {
  const cellRoom = getCellRoom(cell)

  if (!cellRoom) {
    return {}
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
  const borderWidth = '2px'

  // Use same color as background for internal borders (makes them invisible)
  const internalBorder = `${borderWidth} solid ${cellRoom.color}`
  const externalBorder = `${borderWidth} solid ${borderColor}`

  // Calculate border radius for corners
  const cornerRadius = '4px'
  const noRadius = '0px'

  const topLeft = !hasTop && !hasLeft ? cornerRadius : noRadius
  const topRight = !hasTop && !hasRight ? cornerRadius : noRadius
  const bottomLeft = !hasBottom && !hasLeft ? cornerRadius : noRadius
  const bottomRight = !hasBottom && !hasRight ? cornerRadius : noRadius

  return {
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

    const rect = event.target.closest('.grid-section').getBoundingClientRect()
    tooltipPosition.value = {
      x: event.clientX - rect.left + 15,
      y: event.clientY - rect.top - 10,
    }
  }
}

const handleCellMove = (event) => {
  if (tooltipVisible.value || tooltipTimeout) {
    const rect = event.target.closest('.grid-section')?.getBoundingClientRect()
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

const gridStyle = computed(() => {
  if (!floor.value) return {}
  const cols = floor.value.dimensionX || 1
  const size = 28
  return {
    gridTemplateColumns: `repeat(${cols}, ${size}px)`,
    gridAutoRows: `${size}px`,
    gap: '0',
  }
})
</script>

<style scoped>
.floor-show-container {
  padding: 1.5rem;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
}

.card {
  background: linear-gradient(135deg, #1f2937, #111827);
  padding: 1.5rem;
  border-radius: 12px;
  color: #e5e7eb;
  max-width: 1200px;
  margin: 0 auto;
}

.back {
  background: transparent;
  border: 1px solid #60a5fa;
  color: #60a5fa;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 0.75rem;
  transition: all 0.2s;
}

.back:hover {
  background: #60a5fa;
  color: #1f2937;
}

h1 {
  margin: 0.5rem 0;
  color: #f1f5f9;
}

.meta {
  margin: 1rem 0;
  color: #9ca3af;
}

.meta p {
  margin: 0.25rem 0;
}

/* Grid Section */
.grid-section {
  position: relative;
  margin: 1.5rem 0;
}

.grid-wrapper {
  display: inline-grid;
  background: #1a2332;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #374151;
}

.cell {
  width: 28px;
  height: 28px;
  box-sizing: border-box;
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
  transition: filter 0.15s;
}

.cell.has-room:hover {
  filter: brightness(1.15);
  z-index: 10;
}

/* Room Tooltip */
.room-tooltip {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(145deg, #1f2937 0%, #111827 100%);
  border: 1px solid #374151;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  z-index: 100;
  pointer-events: none;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
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

/* Rooms Legend */
.rooms-legend {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #374151;
}

.legend-title {
  font-size: 1rem;
  font-weight: 600;
  color: #60a5fa;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-title::before {
  content: '';
  width: 4px;
  height: 16px;
  background: #60a5fa;
  border-radius: 2px;
}

.legend-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.legend-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: #1a2332;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid #2d3748;
  min-width: 180px;
  max-width: 280px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
  margin-top: 2px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.legend-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.legend-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #f1f5f9;
}

.legend-desc {
  font-size: 0.8rem;
  color: #94a3b8;
  line-height: 1.4;
}

/* Responsive */
@media (max-width: 640px) {
  .floor-show-container {
    padding: 0.75rem;
  }

  .card {
    padding: 1rem;
  }

  .legend-list {
    flex-direction: column;
  }

  .legend-item {
    max-width: 100%;
  }
}
</style>
