import { createRouter, RouteRecordRaw, createWebHashHistory } from 'vue-router'
import Application from '../views/Application.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: Application
  },
  {
    path: '/alipayBuySuccess',
    name: 'alipayBuySuccess',
    component: () => import('../views/alipayBuySuccess.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
