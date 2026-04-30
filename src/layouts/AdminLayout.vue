<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <!-- Botón de menú solo para negocio, o lo ocultamos para alcaldía -->
        <q-btn
          v-if="auth.rol === 'negocio'"
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />
        <q-toolbar-title>Panel de Administración</q-toolbar-title>
        <q-btn flat label="Cerrar sesión" @click="logout" />
      </q-toolbar>
    </q-header>

    <!-- Drawer solo para negocio (alcaldía ya no lo necesita) -->
    <q-drawer v-if="auth.rol === 'negocio'" v-model="leftDrawerOpen" bordered>
      <q-list>
        <q-item-label header>Administración</q-item-label>
        <template v-if="auth.rol === 'negocio'">
          <q-item clickable to="/negocio">
            <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
            <q-item-section>Dashboard</q-item-section>
          </q-item>
          <q-item clickable to="/negocio/perfil">
            <q-item-section avatar><q-icon name="store" /></q-item-section>
            <q-item-section>Mi Negocio</q-item-section>
          </q-item>
          <q-item clickable to="/negocio/catalogo">
            <q-item-section avatar><q-icon name="list" /></q-item-section>
            <q-item-section>Catálogo</q-item-section>
          </q-item>
          <q-item clickable to="/negocio/estadisticas">
            <q-item-section avatar><q-icon name="bar-chart" /></q-item-section>
            <q-item-section>Estadísticas</q-item-section>
          </q-item>
          <q-item clickable to="/negocio/resenas">
            <q-item-section avatar><q-icon name="reviews" /></q-item-section>
            <q-item-section>Reseñas</q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'

const leftDrawerOpen = ref(false)
const auth = useAuthStore()
const router = useRouter()

function logout() {
  auth.logout()
  router.push('/')
}
</script>
