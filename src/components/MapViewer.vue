<template>
  <div class="map-viewer-container">
    <div class="map-viewer-card">
      <!-- 标题 / Title -->
      <h1 class="map-viewer-title">Map Management System</h1>

      <!-- 欢迎信息 / Welcome Message -->
      <div class="welcome-section">
        <p class="welcome-text">
          Welcome to the Floor Management System (欢迎来到楼层管理系统)
        </p>
      </div>

      <!-- 地图列表 / Maps List -->
      <div class="maps-section">
        <div class="section-header">
          <h2 class="section-title">Available Maps (可用地图)</h2>
          <button @click="createNewMap" class="create-map-button">
            + New Map
          </button>
        </div>

        <div v-if="maps.length === 0" class="empty-state">
          <p>No maps available yet</p>
          <p class="empty-help">Create a map first to get started</p>
        </div>

        <!-- 地图卡片 / Map Cards -->
        <div v-else class="maps-grid">
          <div
            v-for="map in maps"
            :key="map.id"
            class="map-card"
          >
            <!-- 地图头 / Map Header -->
            <div class="map-header">
              <!-- Map Name Edit Mode / 地图名称编辑模式 -->
              <div v-if="editingMapId === map.id" class="map-name-edit">
                <input
                  v-model="editingMapName"
                  type="text"
                  class="map-name-input"
                  @keyup.enter="saveMapName(map.id)"
                  @keyup.escape="cancelMapEdit"
                  placeholder="Enter map name"
                />
                <button @click="saveMapName(map.id)" class="save-btn">✓</button>
                <button @click="cancelMapEdit" class="cancel-btn">✕</button>
              </div>

              <!-- Map Name Display Mode / 地图名称显示模式 -->
              <div v-else class="map-name-display">
                <h3 class="map-name">{{ map.name }}</h3>
                <div class="map-actions-header">
                  <button
                    @click="startEditMap(map)"
                    class="action-btn edit-btn"
                    title="Edit map name"
                  >
                    ✎
                  </button>
                  <button
                    @click="deleteMap(map.id)"
                    class="action-btn delete-btn"
                    title="Delete map"
                  >
                    🗑
                  </button>
                </div>
              </div>

              <span class="map-badge">{{ map.numberOfFloors }} Floor(s)</span>
            </div>

            <!-- 楼层列表 / Floors List -->
            <div class="floors-list">
              <div class="floors-header">
                <h4 class="floors-title">Floors (楼层):</h4>
                <button
                  @click="createFloor(map)"
                  class="create-floor-btn"
                >
                  + Floor
                </button>
              </div>

              <div v-if="map.floors.length === 0" class="no-floors">
                <p>No floors yet - Create one to get started</p>
              </div>

              <div v-else class="floors-items">
                <div
                  v-for="floor in map.floors"
                  :key="floor.id"
                  class="floor-item"
                >
                  <!-- Floor Edit Mode / 楼层编辑模式 -->
                  <div v-if="editingFloorId === floor.id" class="floor-edit">
                    <input
                      v-model="editingFloorData.name"
                      type="text"
                      placeholder="Floor name"
                      class="edit-input"
                    />
                    <input
                      v-model.number="editingFloorData.number"
                      type="number"
                      placeholder="Floor #"
                      class="edit-input small"
                    />
                    <button @click="saveFloorEdit(floor.id)" class="save-btn">✓</button>
                    <button @click="cancelFloorEdit" class="cancel-btn">✕</button>
                  </div>

                  <!-- Floor Display Mode / 楼层显示模式 -->
                  <div v-else class="floor-display">
                    <div class="floor-info">
                      <span class="floor-name">{{ floor.name }} (#{{ floor.number }})</span>
                      <span class="floor-dimensions">
                        {{ floor.dimensionX }} × {{ floor.dimensionY }}
                      </span>
                    </div>
                    <div class="floor-actions">
                      <button
                        @click="editFloor(floor)"
                        class="action-btn edit-btn"
                        title="Edit floor grid"
                      >
                        ✎ Edit
                      </button>
                      <button
                        @click="startEditFloor(floor)"
                        class="action-btn"
                        title="Edit floor info"
                      >
                        ⚙
                      </button>
                      <button
                        @click="deleteFloor(map.id, floor.id)"
                        class="action-btn delete-btn"
                        title="Delete floor"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 模拟数据信息 / Mock Data Info -->
      <div class="mock-data-info">
        <p class="info-text">
          ℹ️ Currently using mock data (currently using JSON simulation)
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// 定义发射事件 / Define emitted events
const emit = defineEmits(['create-floor', 'edit-floor', 'create-map']);

// 响应式数据 / Reactive data
const maps = ref([
  {
    id: 1,
    name: "Office Building",
    numberOfFloors: 2,
    floors: [
      {
        id: 1,
        name: "Ground Floor",
        number: 0,
        dimensionX: 15,
        dimensionY: 12,
        mapId: 1,
        cells: [
          { id: 1, x: 1, y: 1, isFilled: false, floorId: 1 },
          { id: 2, x: 2, y: 2, isFilled: true, floorId: 1 }
        ]
      },
      {
        id: 2,
        name: "First Floor",
        number: 1,
        dimensionX: 15,
        dimensionY: 12,
        mapId: 1,
        cells: [
          { id: 5, x: 1, y: 1, isFilled: true, floorId: 2 }
        ]
      }
    ]
  },
  {
    id: 2,
    name: "Hospital Complex",
    numberOfFloors: 1,
    floors: [
      {
        id: 3,
        name: "Main Floor",
        number: 0,
        dimensionX: 20,
        dimensionY: 15,
        mapId: 2,
        cells: []
      }
    ]
  }
]);

// 编辑状态 / Editing state
const editingMapId = ref(null);
const editingMapName = ref('');
const editingFloorId = ref(null);
const editingFloorData = ref({
  name: '',
  number: 0
});

// 方法 / Methods

// 创建新地图 / Create new map
const createNewMap = () => {
  const newMap = {
    id: Math.max(...maps.value.map(m => m.id || 0)) + 1,
    name: `New Map ${maps.value.length + 1}`,
    numberOfFloors: 0,
    floors: []
  };
  maps.value.push(newMap);
};

// 开始编辑地图名称 / Start editing map name
const startEditMap = (map) => {
  editingMapId.value = map.id;
  editingMapName.value = map.name;
};

// 保存地图名称 / Save map name
const saveMapName = (mapId) => {
  const map = maps.value.find(m => m.id === mapId);
  if (map && editingMapName.value.trim()) {
    map.name = editingMapName.value.trim();
  }
  editingMapId.value = null;
  editingMapName.value = '';
};

// 取消编辑地图 / Cancel map edit
const cancelMapEdit = () => {
  editingMapId.value = null;
  editingMapName.value = '';
};

// 删除地图 / Delete map
const deleteMap = (mapId) => {
  if (confirm('Are you sure you want to delete this map? (确定要删除这个地图吗?)')) {
    const index = maps.value.findIndex(m => m.id === mapId);
    if (index !== -1) {
      maps.value.splice(index, 1);
    }
  }
};

// 创建新楼层 / Create new floor
const createFloor = (map) => {
  console.log('Creating floor for map:', map.id);
  emit('create-floor', map);
};

// 编辑楼层 (网格) / Edit floor (grid)
const editFloor = (floor) => {
  console.log('Editing floor grid:', floor.id);
  emit('edit-floor', floor);
};

// 开始编辑楼层信息 / Start editing floor info
const startEditFloor = (floor) => {
  editingFloorId.value = floor.id;
  editingFloorData.value = {
    name: floor.name,
    number: floor.number
  };
};

// 保存楼层编辑 / Save floor edit
const saveFloorEdit = (floorId) => {
  for (const map of maps.value) {
    const floor = map.floors.find(f => f.id === floorId);
    if (floor) {
      floor.name = editingFloorData.value.name.trim() || floor.name;
      floor.number = editingFloorData.value.number;
      editingFloorId.value = null;
      return;
    }
  }
};

// 取消楼层编辑 / Cancel floor edit
const cancelFloorEdit = () => {
  editingFloorId.value = null;
  editingFloorData.value = { name: '', number: 0 };
};

// 删除楼层 / Delete floor
const deleteFloor = (mapId, floorId) => {
  if (confirm('Are you sure you want to delete this floor? (确定要删除这个楼层吗?)')) {
    const map = maps.value.find(m => m.id === mapId);
    if (map) {
      const index = map.floors.findIndex(f => f.id === floorId);
      if (index !== -1) {
        map.floors.splice(index, 1);
        map.numberOfFloors = map.floors.length;
      }
    }
  }
};

// 添加新楼层到地图 / Add new floor to map
const addFloorToMap = (mapId, floorData) => {
  const map = maps.value.find(m => m.id === mapId);
  if (map) {
    const newFloor = {
      id: Math.max(...map.floors.map(f => f.id || 0), 0) + 1,
      ...floorData,
      cells: []
    };
    map.floors.push(newFloor);
    map.numberOfFloors = map.floors.length;
    return newFloor;
  }
};

// 更新楼层的填充格子 / Update floor filled cells
const updateFloorCells = (floorId, cellsData) => {
  for (const map of maps.value) {
    const floor = map.floors.find(f => f.id === floorId);
    if (floor) {
      cellsData.forEach(cellData => {
        const existingCell = floor.cells.find(
          c => c.x === cellData.x && c.y === cellData.y
        );
        if (existingCell) {
          existingCell.isFilled = cellData.isFilled;
        } else {
          floor.cells.push({
            id: Math.max(...floor.cells.map(c => c.id || 0), 0) + 1,
            x: cellData.x,
            y: cellData.y,
            isFilled: cellData.isFilled,
            floorId: floorId
          });
        }
      });
      return floor;
    }
  }
};

// 定义可用的方法供外部调用 / Define available methods for external calls
defineExpose({
  addFloorToMap,
  updateFloorCells
});
</script>

<style scoped>
.map-viewer-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.map-viewer-card {
  background-color: #1f2937;
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  padding: 2rem;
  max-width: 1400px;
  width: 100%;
  border: 1px solid #374151;
}

.map-viewer-title {
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
  text-align: center;
  margin-bottom: 1.5rem;
}

.welcome-section {
  text-align: center;
  margin-bottom: 2.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
  border-radius: 0.75rem;
  border-left: 4px solid #3b82f6;
}

.welcome-text {
  font-size: 1.1rem;
  color: #e5e7eb;
  font-weight: 600;
  margin: 0;
}

.maps-section {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #e5e7eb;
  margin: 0;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #374151;
  flex: 1;
}

.create-map-button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 10px 25px rgba(236, 72, 153, 0.3);
  white-space: nowrap;
  margin-left: 1rem;
}

.create-map-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 35px rgba(236, 72, 153, 0.4);
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  background-color: #374151;
  border-radius: 0.5rem;
  color: #9ca3af;
}

.empty-help {
  font-size: 0.9rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

.maps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(600px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.map-card {
  background-color: #374151;
  border-radius: 0.75rem;
  padding: 1.5rem;
  border: 1px solid #4b5563;
  transition: all 0.3s;
}

.map-card:hover {
  border-color: #60a5fa;
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.2);
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #4b5563;
  flex-wrap: wrap;
  gap: 1rem;
}

.map-name-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.map-name {
  font-size: 1.35rem;
  font-weight: 700;
  color: white;
  margin: 0;
  word-break: break-word;
}

.map-name-edit {
  display: flex;
  gap: 0.5rem;
  flex: 1;
  max-width: 300px;
}

.map-name-input {
  flex: 1;
  padding: 0.5rem;
  font-size: 1rem;
  color: white;
  background-color: #2d3748;
  border: 2px solid #60a5fa;
  border-radius: 0.375rem;
  outline: none;
}

.map-actions-header {
  display: flex;
  gap: 0.5rem;
}

.map-badge {
  background-color: #3b82f6;
  color: white;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
}

.floors-list {
  margin-bottom: 1rem;
}

.floors-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.floors-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #d1d5db;
  margin: 0;
}

.create-floor-btn {
  padding: 0.4rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
  background-color: #10b981;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.create-floor-btn:hover {
  background-color: #059669;
}

.no-floors {
  padding: 1rem;
  background-color: #4b5563;
  border-radius: 0.375rem;
  color: #9ca3af;
  font-style: italic;
  text-align: center;
}

.floors-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.floor-item {
  padding: 0.75rem;
  background-color: #4b5563;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.floor-item:hover {
  background-color: #5a6575;
}

.floor-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.floor-edit {
  display: flex;
  gap: 0.5rem;
  flex: 1;
  flex-wrap: wrap;
  align-items: center;
}

.floor-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.floor-name {
  font-weight: 600;
  color: #e5e7eb;
  font-size: 0.95rem;
}

.floor-dimensions {
  color: #9ca3af;
  font-size: 0.8rem;
}

.edit-input {
  padding: 0.4rem;
  font-size: 0.85rem;
  color: white;
  background-color: #2d3748;
  border: 1px solid #60a5fa;
  border-radius: 0.25rem;
  outline: none;
  min-width: 120px;
}

.edit-input.small {
  min-width: 60px;
}

.floor-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.4rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
  background-color: #3b82f6;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.action-btn:hover {
  background-color: #2563eb;
  transform: translateY(-1px);
}

.action-btn.delete-btn {
  background-color: #ef4444;
}

.action-btn.delete-btn:hover {
  background-color: #dc2626;
}

.action-btn.edit-btn {
  background-color: #8b5cf6;
}

.action-btn.edit-btn:hover {
  background-color: #7c3aed;
}

.save-btn {
  padding: 0.4rem 0.6rem;
  font-size: 1rem;
  color: white;
  background-color: #10b981;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn:hover {
  background-color: #059669;
}

.cancel-btn {
  padding: 0.4rem 0.6rem;
  font-size: 1rem;
  color: white;
  background-color: #ef4444;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background-color: #dc2626;
}

.mock-data-info {
  margin-top: 2rem;
  padding: 1rem;
  background-color: #374151;
  border-left: 4px solid #f59e0b;
  border-radius: 0.5rem;
}

.info-text {
  color: #9ca3af;
  font-size: 0.9rem;
  margin: 0.5rem 0;
}

.info-text:first-child {
  margin-top: 0;
}

.info-text:last-child {
  margin-bottom: 0;
}

/* 响应式设计 / Responsive Design */
@media (max-width: 1024px) {
  .maps-grid {
    grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  }

  .map-viewer-card {
    padding: 1.5rem;
  }

  .map-viewer-title {
    font-size: 2rem;
  }
}

@media (max-width: 768px) {
  .maps-grid {
    grid-template-columns: 1fr;
  }

  .map-viewer-card {
    padding: 1rem;
  }

  .map-viewer-title {
    font-size: 1.75rem;
  }

  .map-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .map-name-display {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
  }

  .map-name {
    font-size: 1.1rem;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .create-map-button {
    margin-left: 0;
    width: 100%;
  }

  .floor-display {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .floor-actions {
    width: 100%;
  }

  .action-btn {
    flex: 1;
  }
}

@media (max-width: 480px) {
  .maps-grid {
    grid-template-columns: 1fr;
  }

  .map-viewer-title {
    font-size: 1.5rem;
  }

  .map-name {
    font-size: 1rem;
  }

  .floor-name {
    font-size: 0.85rem;
  }

  .action-btn,
  .save-btn,
  .cancel-btn {
    padding: 0.3rem 0.5rem;
    font-size: 0.75rem;
  }
}
</style>
