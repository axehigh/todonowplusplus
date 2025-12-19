import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import HomePage from '../views/HomePage.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/done',
    name: 'Done',
    component: () => import('../views/DonePage.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/SettingsPage.vue')
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('../views/AuthPage.vue')
  },
  {
    path: '/lists',
    name: 'ListManagement',
    component: () => import('../views/ListManagementPage.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
