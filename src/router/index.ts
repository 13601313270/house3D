import { createRouter, RouteRecordRaw, createWebHistory } from 'vue-router'
import Map2D from '../views/Map2D.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: Map2D
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
