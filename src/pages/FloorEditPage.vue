<template>
  <div class="floor-edit-page">
    <button @click="goBack" class="btn">← Back</button>

    <div v-if="loading">Loading floor…</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <FloorEditor v-else :floor="floor" @save-cells="onSaveCells" @back="goBack" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FloorEditor from '@/components/FloorEditor.vue'
import { getFloorById, updateCells } from '@/api/backend'

const route = useRoute()
const router = useRouter()
const mapId = Number(route.params.mapId)
const floorId = Number(route.params.floorId)

const loading = ref(false)
const error = ref(null)
const floor = ref(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    floor.value = await getFloorById(floorId)
  } catch (err) {
    error.value = err?.message || 'Failed to load floor'
  } finally {
    loading.value = false
  }
}

onMounted(load)

const goBack = () => {
  router.push({ name: 'map', params: { id: mapId } })
}

const onSaveCells = async (payload) => {
  try {
    await updateCells(payload)
    // after save, go back to map page
    router.push({ name: 'map', params: { id: mapId } })
  } catch (err) {
    alert(err?.message || 'Failed to save cells')
  }
}
</script>

<style scoped>
.btn {
  padding: 0.4rem 0.6rem;
  border-radius: 0.25rem;
  background: #374151;
  color: #e5e7eb;
  border: none;
}
.floor-edit-page {
  padding: 1rem;
}
</style>
