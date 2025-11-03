<template>
  <div id="app">
    <!-- 显示地图浏览器 / Show Map Viewer -->
    <MapViewer
      v-if="currentPage === 'viewer'"
      @create-floor="goToCreateFloor"
      @edit-floor="goToEditFloor"
      ref="mapViewerRef"
    />

    <!-- 显示楼层表单 / Show Floor Form -->
    <FloorForm
      v-else-if="currentPage === 'createFloor'"
      @create-floor="handleCreateFloor"
      @back="goToViewer"
    />

    <!-- 显示楼层编辑器 / Show Floor Editor -->
    <FloorEditor
      v-else-if="currentPage === 'editFloor'"
      :floor="selectedFloor"
      @save-cells="handleSaveCells"
      @back="goToViewer"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import MapViewer from './components/MapViewer.vue';
import FloorForm from './components/FloorForm.vue';
import FloorEditor from './components/FloorEditor.vue';

// 响应式数据 / Reactive data

// 当前页面 / Current page state
// 可能值: 'viewer' | 'createFloor' | 'editFloor
const currentPage = ref('viewer');

// 选中的楼层 / Selected floor for editing
const selectedFloor = ref(null);

// 当前创建楼层的地图 / Current map for creating floor
const currentMapId = ref(null);

// 地图浏览器引用 / Map viewer reference
const mapViewerRef = ref(null);

// 方法 / Methods

// 导航到查看地图 / Navigate to Map Viewer
const goToViewer = () => {
  currentPage.value = 'viewer';
  selectedFloor.value = null;
  currentMapId.value = null;
};

// 导航到创建楼层 / Navigate to Create Floor
const goToCreateFloor = (map) => {
  console.log('Navigate to create floor for map:', map);
  currentMapId.value = map.id;
  currentPage.value = 'createFloor';
};

// 导航到编辑楼层 / Navigate to Edit Floor
const goToEditFloor = (floor) => {
  console.log('Navigate to edit floor:', floor);
  selectedFloor.value = floor;
  currentPage.value = 'editFloor';
};

// 处理创建楼层 / Handle floor creation
const handleCreateFloor = (floorData) => {
  console.log('Floor created with data:', floorData);

  // 调用地图浏览器的方法添加楼层 / Call MapViewer method to add floor
  if (mapViewerRef.value && currentMapId.value) {
    mapViewerRef.value.addFloorToMap(currentMapId.value, floorData);
  }

  // 这里你可以添加API调用 / Here you can add API call
  // POST /api/floor with floorData
  // const response = await fetch('https://backend-map-frd3e5bch9bvgjef.canadacentral-01.azurewebsites.net/api/floor', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(floorData)
  // });

  // 返回地图查看器 / Go back to viewer
  goToViewer();
};

// 处理保存格子 / Handle saving cells
const handleSaveCells = (cellsPayload) => {
  console.log('Cells saved with payload:', cellsPayload);

  // 调用地图浏览器的方法更新格子 / Call MapViewer method to update cells
  if (mapViewerRef.value) {
    mapViewerRef.value.updateFloorCells(
      cellsPayload.floorId,
      cellsPayload.cells
    );
  }

  // 这里你可以添加API调用 / Here you can add API call
  // POST /api/cell/update with cellsPayload
  // const response = await fetch('https://backend-map-frd3e5bch9bvgjef.canadacentral-01.azurewebsites.net/api/cell/update', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(cellsPayload)
  // });

  // 返回地图查看器 / Go back to viewer
  goToViewer();
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  width: 100%;
  min-height: 100vh;
}
</style>
