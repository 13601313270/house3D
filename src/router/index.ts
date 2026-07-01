import { createRouter, RouteRecordRaw, createWebHistory } from 'vue-router'
import Application from '../views/Application.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: Application
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
