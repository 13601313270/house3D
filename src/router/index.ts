import { createRouter, RouteRecordRaw, createWebHistory } from 'vue-router'
import Application from '../views/Application.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: Application
  },
  {
    path: '/alipay/buySuccess',
    name: 'alipayBuySuccess',
    component: () => import('../views/alipayBuySuccess.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
