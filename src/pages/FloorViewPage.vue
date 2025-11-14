<template>
  <div class="floor-view-page">
    <div class="page-header">
      <router-link :to="{ name: 'map', params: { id: mapId } }" class="btn"
        >← Back to Map</router-link
      >
    </div>

    <div v-if="loading">Loading floor…</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="floor-view">
      <h2>{{ floor.name }} — #{{ floor.number }}</h2>
      <GridMap :floorId="floor.id" :readOnly="true" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import GridMap from '@/components/GridMap.vue'
import { getFloorById } from '@/api/backend'

const route = useRoute()
const mapId = Number(route.params.mapId)
const floorId = Number(route.params.floorId)

const loading = ref(false)
const error = ref(null)
const floor = ref(null)

async function loadFloor() {
  loading.value = true
  error.value = null
  try {
    floor.value = await getFloorById(floorId)
    if (!floor.value) throw new Error('Floor not found')
  } catch (err) {
    console.error('Failed to load floor:', err)
    error.value = err?.message || 'Failed to load floor'
  } finally {
    loading.value = false
  }
}

onMounted(loadFloor)
</script>

<style scoped>
.btn {
  padding: 0.35rem 0.6rem;
  border-radius: 0.25rem;
  background: #374151;
  color: #e5e7eb;
  border: none;
}
.floor-view-page {
  padding: 1rem;
}
.floor-view h2 {
  margin-top: 0.5rem;
}
</style>
