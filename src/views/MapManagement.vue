<template>
  <div id="app">
    <!-- Show Map Viewer -->
    <MapViewer
      v-if="currentPage === 'viewer'"
      @create-floor="goToCreateFloor"
      @edit-floor="goToEditFloor"
      ref="mapViewerRef"
    />

    <!-- Show Floor Form -->
    <FloorForm
      v-else-if="currentPage === 'createFloor'"
      :mapId="currentMapId"
      @create-floor="handleCreateFloor"
      @back="goToViewer"
    />

    <!-- Show Floor Editor -->
    <FloorEditor
      v-else-if="currentPage === 'editFloor'"
      :floor="selectedFloor"
      @save-cells="handleSaveCells"
      @back="goToViewer"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import MapViewer from '@/components/MapViewer.vue'
import FloorForm from '@/components/FloorForm.vue'
import FloorEditor from '@/components/FloorEditor.vue'
import { updateCells as apiUpdateCells } from '@/api/backend'

// Reactive data

// Current page state
// 'viewer' | 'createFloor' | 'editFloor
const currentPage = ref('viewer')

// Selected floor for editing
const selectedFloor = ref(null)

// Current map for creating floor
const currentMapId = ref(null)

// Map viewer reference
const mapViewerRef = ref(null)

// Methods

// Navigate to Map Viewer
const goToViewer = () => {
  currentPage.value = 'viewer'
  selectedFloor.value = null
  currentMapId.value = null
}

// Navigate to Create Floor
const goToCreateFloor = (map) => {
  console.log('Navigate to create floor for map:', map)
  currentMapId.value = map.id
  currentPage.value = 'createFloor'
}

// Navigate to Edit Floor
const goToEditFloor = (floor) => {
  console.log('Navigate to edit floor:', floor)
  selectedFloor.value = floor
  currentPage.value = 'editFloor'
}

// Handle floor creation
const handleCreateFloor = (floorData) => {
  console.log('Floor created with data:', floorData)

  // Call MapViewer method to add floor
  if (mapViewerRef.value && currentMapId.value) {
    mapViewerRef.value.addFloorToMap(currentMapId.value, floorData)
  }

  // Go back to viewer
  goToViewer()
}

// Handle saving cells
const handleSaveCells = async (cellsPayload) => {
  console.log('Cells saved with payload:', cellsPayload)

  try {
    // Persist to backend
    await apiUpdateCells(cellsPayload)
  } catch (err) {
    console.error('Failed to update cells:', err)
    alert(err?.message || 'Failed to save cells')
  }

  // Navigate back to viewer; MapViewer will refetch from API on mount
  goToViewer()
}
</script>

<style scoped>
/* Keep styles minimal here; components provide their own styles */
#app {
  width: 100%;
  min-height: 100vh;
}
</style>
