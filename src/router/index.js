import { createRouter, createWebHistory } from 'vue-router'
import MapViewer from '@/components/MapViewer.vue'
import MapPage from '@/pages/MapPage.vue'
import FloorViewPage from '@/pages/FloorViewPage.vue'
import FloorEditPage from '@/pages/FloorEditPage.vue'

const routes = [
  { path: '/', name: 'home', component: MapViewer },
  { path: '/map/:id', name: 'map', component: MapPage, props: true },
  { path: '/map/:mapId/floor/:floorId', name: 'floor-view', component: FloorViewPage, props: true },
  {
    path: '/map/:mapId/floor/:floorId/edit',
    name: 'floor-edit',
    component: FloorEditPage,
    props: true,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
