<template>
  <div class="map-page-view">
    <div class="page-header">
      <router-link :to="{ name: 'home' }" class="btn">← Back to Maps</router-link>
    </div>

    <div v-if="loading" class="loading">Loading map…</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="map-details">
      <h1 class="map-name">{{ map.name }}</h1>
      <p class="map-meta">Floors: {{ map.numberOfFloors }}</p>

      <div v-if="!map.floors || map.floors.length === 0" class="no-floors">
        <p>No floors available for this map.</p>
      </div>

      <ul v-else class="floors-list">
        <li v-for="floor in map.floors" :key="floor.id" class="floor-item">
          <div class="floor-info">
            <strong>{{ floor.name }}</strong> — #{{ floor.number }} — {{ floor.dimensionX }}×{{
              floor.dimensionY
            }}
          </div>
          <router-link
            :to="{ name: 'floor-view', params: { mapId: map.id, floorId: floor.id } }"
            class="view-link"
          >
            View floor
          </router-link>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getMapById } from '@/api/backend'

const route = useRoute()
const id = Number(route.params.id)

const loading = ref(false)
const error = ref(null)
const map = ref({ id: id, name: '', numberOfFloors: 0, floors: [] })

async function loadMap() {
  loading.value = true
  error.value = null
  try {
    const m = await getMapById(id)
    if (!m) {
      error.value = 'Map not found'
      map.value = { id, name: '', numberOfFloors: 0, floors: [] }
      return
    }
    map.value = m
  } catch (err) {
    console.error('Failed to load map:', err)
    error.value = err?.message || 'Failed to load map'
  } finally {
    loading.value = false
  }
}

onMounted(loadMap)
</script>

<style scoped>
.map-page-view {
  padding: 1rem;
}
.btn {
  padding: 0.35rem 0.6rem;
  border-radius: 0.25rem;
  background: #374151;
  color: #e5e7eb;
  border: none;
}
.map-name {
  font-size: 1.8rem;
  margin: 0.5rem 0;
}
.map-meta {
  color: #cbd5e1;
  margin-bottom: 1rem;
}
.floors-list {
  list-style: none;
  padding: 0;
}
.floor-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}
.view-link {
  background: #2563eb;
  color: white;
  padding: 0.35rem 0.6rem;
  border-radius: 0.25rem;
  text-decoration: none;
}
.loading,
.error {
  padding: 1rem 0;
}
</style>
