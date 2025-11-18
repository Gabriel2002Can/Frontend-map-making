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

      <div v-if="floor" class="grid-wrapper" :style="gridStyle">
        <div
          v-for="cell in allCells"
          :key="`${cell.x}-${cell.y}`"
          :class="['cell', cell.isFilled ? 'filled' : 'empty']"
        >
          <!-- keep minimal content for readability -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getFloorById } from '@/api/backend'

const props = defineProps({
  mapId: { type: Number, required: true },
  floorId: { type: Number, required: true },
})

const floor = ref(null)
const load = async () => {
  try {
    floor.value = await getFloorById(props.floorId)
  } catch (err) {
    console.error('Failed to load floor:', err)
    floor.value = null
  }
}

onMounted(load)

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

const gridStyle = computed(() => {
  if (!floor.value) return {}
  const cols = floor.value.dimensionX || 1
  // fixed cell size to match CSS .cell width/height
  const size = 24
  return {
    gridTemplateColumns: `repeat(${cols}, ${size}px)`,
    gridAutoRows: `${size}px`,
    gap: '6px',
  }
})
</script>

<style scoped>
.floor-show-container {
  padding: 1.5rem;
}
.card {
  background: linear-gradient(135deg, #1f2937, #111827);
  padding: 1.5rem;
  border-radius: 12px;
  color: #e5e7eb;
}
.back {
  background: transparent;
  border: 1px solid #60a5fa;
  color: #60a5fa;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 0.75rem;
}
.meta {
  margin: 1rem 0;
  color: #9ca3af;
}
.grid-wrapper {
  display: grid;
  gap: 4px;
  grid-auto-rows: 24px;
  background: #111827;
  padding: 0.5rem;
  border-radius: 8px;
}
.cell {
  width: 24px;
  height: 24px;
  border-radius: 4px;
}
.cell.filled {
  background: #3b82f6;
}
.cell.empty {
  background: #4b5563;
}
</style>
