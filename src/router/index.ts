import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: import(/* webpackChunkName: "map2d" */ '../views/Map2D.vue')
  },
  {
    path: '/edit',
    name: 'edit',
    component: () => import(/* webpackChunkName: "edit" */ '../views/EditView.vue')
  },
  {
    path: '/map2d',
    name: 'map2d',
    component: () => import(/* webpackChunkName: "map2d" */ '../views/Map2D.vue')
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
