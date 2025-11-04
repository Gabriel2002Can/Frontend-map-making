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
import MapViewer from './components/MapViewer.vue'
import FloorForm from './components/FloorForm.vue'
import FloorEditor from './components/FloorEditor.vue'

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

  // Here you can add API call
  // POST /api/floor with floorData
  // const response = await fetch('https://backend-map-frd3e5bch9bvgjef.canadacentral-01.azurewebsites.net/api/floor', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(floorData)
  // });

  // Go back to viewer
  goToViewer()
}

// Handle saving cells
const handleSaveCells = (cellsPayload) => {
  console.log('Cells saved with payload:', cellsPayload)

  // Call MapViewer method to update cells
  if (mapViewerRef.value) {
    mapViewerRef.value.updateFloorCells(cellsPayload.floorId, cellsPayload.cells)
  }

  // Here you can add API call
  // POST /api/cell/update with cellsPayload
  // const response = await fetch('https://backend-map-frd3e5bch9bvgjef.canadacentral-01.azurewebsites.net/api/cell/update', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(cellsPayload)
  // });

  // Go back to viewer
  goToViewer()
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell',
    'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  width: 100%;
  min-height: 100vh;
}
</style>
