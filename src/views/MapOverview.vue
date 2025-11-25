<template>
  <div class="map-overview-container">
    <div class="card">
      <button class="back" @click="$router.push('/')">← Back</button>
      <h1 v-if="map">{{ map.name }}</h1>
      <p v-else>Loading map…</p>

      <section v-if="map">
        <h2>Floors</h2>
        <div v-if="map.floors && map.floors.length">
          <ul class="floors-list">
            <li v-for="floor in map.floors" :key="floor.id">
              <router-link :to="`/maps/${map.id}/floors/${floor.id}`"
                >{{ floor.name }} (#{{ floor.number }})</router-link
              >
            </li>
          </ul>
        </div>
        <div v-else>
          <p>No floors available for this map.</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getMapById } from '@/api/backend'

const props = defineProps({ mapId: { type: Number, required: true } })

const map = ref(null)
const load = async () => {
  try {
    map.value = await getMapById(props.mapId)
  } catch (err) {
    console.error('Failed to load map:', err)
    map.value = null
  }

  map.value.floors = map.value.floors.sort((a, b) => a.number - b.number)
}

onMounted(load)
</script>

<style scoped>
.map-overview-container {
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
.floors-list {
  list-style: none;
  padding: 0;
}
.floors-list li {
  margin: 0.5rem 0;
}
.floors-list a {
  color: #93c5fd;
  text-decoration: none;
}
</style>
