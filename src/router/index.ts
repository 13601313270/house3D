import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import Map2D from '../views/Map2D.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: Map2D
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
