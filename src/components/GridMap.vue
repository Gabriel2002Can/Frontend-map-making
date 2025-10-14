<template>
  <div class="grid-map-container">
    <div class="grid-map-card">
      <!-- 标题和尺寸信息 / Title and dimension info -->
      <h1 class="grid-map-title">Grid Map Viewer</h1>
      <p class="grid-map-dimensions">Dimensions: {{ mapData.gridDimensions }}</p>

      <!-- 加载状态 / Loading state -->
      <div v-if="loading" class="loading-state">
        Loading map data...
      </div>

      <!-- 错误状态 / Error state -->
      <div v-else-if="error" class="error-state">
        <h2>Error Loading Map</h2>
        <p>{{ error }}</p>
      </div>

      <!-- 地图网格 / Map grid -->
      <div v-else class="grid-wrapper">
        <div
          class="grid-container"
          :style="{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }"
        >
          <!-- 遍历所有行和列，生成格子 / Iterate through all rows and columns -->
          <div
            v-for="(cell, index) in allCells"
            :key="index"
            :class="['grid-cell', cell.filled ? 'grid-cell-filled' : 'grid-cell-empty']"
          >
            {{ cell.x }},{{ cell.y }}
          </div>
        </div>

        <!-- 已填充格子列表 / List of filled cells -->
        <div class="filled-cells-container">
          <h2 class="filled-cells-title">
            Filled Cells ({{ filledCells.length }})
          </h2>
          <div class="filled-cells-list">
            <span
              v-for="(cell, idx) in filledCells"
              :key="idx"
              class="filled-cell-tag"
            >
              ({{ cell.x }}, {{ cell.y }})
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// ============================================
// 方式1: 使用模拟数据 (当前激活) / Method 1: Use mock data (currently active)
// ============================================
const mockMapData = {
  gridDimensions: "5x5",
  gridElements: [
    { x: 1, y: 1, filled: true },
    { x: 2, y: 1, filled: true },
    { x: 3, y: 2, filled: true },
    { x: 1, y: 3, filled: true },
    { x: 4, y: 3, filled: true },
    { x: 2, y: 4, filled: true },
    { x: 5, y: 5, filled: true },
  ]
};

// 响应式数据 / Reactive data
const mapData = ref(mockMapData);
const loading = ref(false);
const error = ref(null);

// ============================================
// 方式2: 从API获取数据 (注释掉) / Method 2: Fetch from API (commented out)
// 使用时需要取消下面的注释，并导入 onMounted:
// When using, uncomment below and import onMounted:
// import { ref, computed, onMounted } from 'vue';
// ============================================
//
// onMounted(async () => {
//   // 设置加载状态 / Set loading state
//   loading.value = true;
//
//   try {
//     // 从API获取地图数据 / Fetch map data from API
//     const response = await fetch('https://your-api-endpoint.com/api/maps/1');
//
//     if (!response.ok) {
//       throw new Error('Network response was not ok');
//     }
//
//     // API应该返回格式: / API should return format:
//     // {
//     //   gridDimensions: "5x5",
//     //   gridElements: [
//     //     { x: 1, y: 3, filled: true },
//     //     ...
//     //   ]
//     // }
//     const data = await response.json();
//     mapData.value = data;
//   } catch (err) {
//     console.error('Error fetching map data:', err);
//     error.value = err.message;
//   } finally {
//     loading.value = false;
//   }
// });

// 计算属性: 解析网格尺寸 / Computed: Parse grid dimensions
const cols = computed(() => {
  const [c] = mapData.value.gridDimensions.split('x').map(Number);
  return c;
});

const rows = computed(() => {
  const [, r] = mapData.value.gridDimensions.split('x').map(Number);
  return r;
});

// 计算属性: 获取所有填充的格子 / Computed: Get all filled cells
const filledCells = computed(() => {
  return mapData.value.gridElements.filter(el => el.filled);
});

// 计算属性: 生成所有格子（包括空的）/ Computed: Generate all cells (including empty)
const allCells = computed(() => {
  const cells = [];
  // 创建一个Map来快速查找已填充的格子 / Create a Map for fast lookup of filled cells
  const filledMap = new Map(
    filledCells.value.map(cell => [`${cell.x}-${cell.y}`, true])
  );

  // 遍历所有行和列 / Iterate through all rows and columns
  for (let y = 1; y <= rows.value; y++) {
    for (let x = 1; x <= cols.value; x++) {
      cells.push({
        x,
        y,
        filled: filledMap.has(`${x}-${y}`)
      });
    }
  }

  return cells;
});
</script>

<style scoped>
.grid-map-container {
  min-height: 100vh;
  background-color: #111827;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.grid-map-card {
  background-color: #1f2937;
  border-radius: 0.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  padding: 2rem;
  max-width: 56rem;
  width: 100%;
}

.grid-map-title {
  font-size: 1.875rem;
  font-weight: bold;
  color: white;
  margin-bottom: 0.5rem;
  text-align: center;
}

.grid-map-dimensions {
  color: #9ca3af;
  text-align: center;
  margin-bottom: 1.5rem;
}

.loading-state,
.error-state {
  color: white;
  text-align: center;
  padding: 2rem;
}

.error-state {
  background-color: #ef4444;
  border-radius: 0.5rem;
}

.error-state h2 {
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.grid-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.grid-container {
  display: inline-grid;
  gap: 0.5rem;
  padding: 1rem;
  background-color: #374151;
  border-radius: 0.5rem;
}

.grid-cell {
  width: 4rem;
  height: 4rem;
  border-radius: 0.375rem;
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.3s;
}

.grid-cell-filled {
  background-color: #3b82f6;
  border-color: #60a5fa;
  color: white;
  box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.5);
}

.grid-cell-empty {
  background-color: #4b5563;
  border-color: #6b7280;
  color: #9ca3af;
}

.filled-cells-container {
  margin-top: 2rem;
  background-color: #374151;
  border-radius: 0.5rem;
  padding: 1rem;
  width: 100%;
}

.filled-cells-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.75rem;
}

.filled-cells-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filled-cell-tag {
  padding: 0.25rem 0.75rem;
  background-color: #3b82f6;
  color: white;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}
</style>
