import { createRouter, createWebHistory } from 'vue-router'
import MapManagement from '@/views/MapManagement.vue'
import MapOverview from '@/views/MapOverview.vue'
import FloorShow from '@/views/FloorShow.vue'

const routes = [
  { path: '/', name: 'Home', component: MapManagement },
  {
    path: '/maps/:mapId',
    name: 'MapOverview',
    component: MapOverview,
    props: (route) => ({ mapId: Number(route.params.mapId) }),
  },
  {
    path: '/maps/:mapId/floors/:floorId',
    name: 'FloorShow',
    component: FloorShow,
    props: (route) => ({
      mapId: Number(route.params.mapId),
      floorId: Number(route.params.floorId),
    }),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
