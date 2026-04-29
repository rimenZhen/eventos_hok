// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'
import setupGuards from './guards'

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Aplicar guards de navegación
setupGuards(router)

export default router
