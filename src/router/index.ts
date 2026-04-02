import { createRouter, createWebHistory } from 'vue-router'
import { setupRouterGuards } from './guards'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/test-auth',
      name: 'test-auth',
      component: () => import('../views/TestView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      redirect: '/medicines',
    },
    {
      path: '/medicines',
      name: 'medicines',
      component: () => import('../views/MedicinesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/medicines/:id',
      name: 'medicine-details',
      component: () => import('../views/MedicineDetailsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/batches',
      name: 'batches',
      component: () => import('../views/BatchesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/batches/:id',
      name: 'batch-details',
      component: () => import('../views/BatchDetailsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/sensors',
      name: 'sensors',
      component: () => import('../views/SensorsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/sensors/:id',
      name: 'sensor-details',
      component: () => import('../views/SensorDetailsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('../views/UsersView.vue'),
      meta: { requiresAuth: true, allowedRoles: ['admin'] },
    },
    {
      path: '/users/:id',
      name: 'user-details',
      component: () => import('../views/UserDetailsView.vue'),
      meta: { requiresAuth: true, allowedRoles: ['admin'] },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/UserDetailsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/no-access',
      name: 'no-access',
      component: () => import('../views/NoAccessView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { requiresAuth: true, allowedRoles: ['admin'] },
    },
    {
      path: '/zones',
      name: 'zones',
      component: () => import('../views/ZonesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/zones/:id',
      name: 'zone-details',
      component: () => import('../views/ZoneDetailsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/logs',
      name: 'logs',
      component: () => import('../views/LogsView.vue'),
      meta: { requiresAuth: true, allowedRoles: ['admin'] },
    },
    {
      path: '/alerts',
      name: 'alerts',
      component: () => import('../views/AlertsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/alerts/:id',
      name: 'alert-details',
      component: () => import('../views/AlertDetailsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
})

// Setup navigation guards
setupRouterGuards(router)

export default router
