<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          <router-link to="/" class="text-white text-no-decoration">El Salvador Turismo</router-link>
        </q-toolbar-title>

        <div class="q-gutter-x-sm">
          <q-btn
            flat
            round
            :icon="isDark ? 'dark_mode' : 'light_mode'"
            @click="toggleDarkMode"
            aria-label="Cambiar tema"
          >
            <q-tooltip>{{ isDark ? 'Modo claro' : 'Modo oscuro' }}</q-tooltip>
          </q-btn>

          <template v-if="auth.isLoggedIn">
            <q-btn flat :label="auth.userName" @click="goToProfile" />
            <q-btn flat label="Cerrar sesión" @click="logout" />
          </template>
          <template v-else>
            <q-btn flat label="Login" to="/auth/login" />
            <q-btn flat label="Registro" to="/auth/registro" />
          </template>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" bordered>
      <q-list>
        <q-item-label header>Navegación</q-item-label>
        <q-item clickable tag="a" href="/">
          <q-item-section avatar><q-icon name="home" /></q-item-section>
          <q-item-section>Inicio</q-item-section>
        </q-item>
        <q-item clickable tag="a" href="/descubre">
          <q-item-section avatar><q-icon name="search" /></q-item-section>
          <q-item-section>Descubre más</q-item-section>
        </q-item>
        <q-separator />
        <template v-if="auth.isLoggedIn">
          <q-item-label header>Mi Cuenta</q-item-label>
          <q-item clickable @click="goToProfile">
            <q-item-section avatar><q-icon name="person" /></q-item-section>
            <q-item-section>Perfil</q-item-section>
          </q-item>
          <q-item clickable @click="goToFavoritos" v-if="auth.rol === 'usuario_final'">
            <q-item-section avatar><q-icon name="favorite" /></q-item-section>
            <q-item-section>Favoritos</q-item-section>
          </q-item>
          <!-- Links según rol -->
          <template v-if="auth.rol === 'alcaldia'">
            <q-item clickable href="/alcaldia">
              <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
              <q-item-section>Panel Alcaldía</q-item-section>
            </q-item>
          </template>
          <template v-if="auth.rol === 'negocio'">
            <q-item clickable href="/negocio">
              <q-item-section avatar><q-icon name="store" /></q-item-section>
              <q-item-section>Mi Negocio</q-item-section>
            </q-item>
          </template>
        </template>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const leftDrawerOpen = ref(false)
const auth = useAuthStore()
const router = useRouter()
const isDark = computed(() => $q.dark.isActive)
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function logout() {
  auth.logout()
  router.push('/')
}

function goToProfile() {
  // Redirigir según rol
  if (auth.rol === 'negocio') router.push('/negocio/perfil')
  else router.push('/usuario/perfil')
}

function goToFavoritos() {
  router.push('/usuario/favoritos')
}

// Cargar preferencia guardada al montar
onMounted(() => {
  const saved = localStorage.getItem('darkMode')
  if (saved !== null) {
    $q.dark.set(saved === 'true')
  }
})


// Alternar tema y guardar en localStorage
function toggleDarkMode() {
  $q.dark.toggle()
  localStorage.setItem('darkMode', $q.dark.isActive)
}
</script>

<style scoped>
.text-no-decoration {
  text-decoration: none;
}
</style>
