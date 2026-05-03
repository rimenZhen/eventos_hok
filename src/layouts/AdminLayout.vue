<template>
  <q-layout
    view="lHh Lpr lFf"
    :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-grey-1 text-dark'"
  >
    <!-- Header global: se oculta para alcaldía porque DashboardPage tendrá su propio header -->
    <q-header
      v-if="auth.rol !== 'alcaldia'"
      elevated
      class="admin-header"
      :class="$q.dark.isActive ? 'bg-grey-10 text-white' : 'bg-primary text-white'"
    >
      <q-toolbar class="admin-toolbar">
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

        <q-btn
          flat
          dense
          round
          :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
          aria-label="Cambiar modo oscuro"
          @click="toggleDarkMode"
        />

        <q-btn flat label="Cerrar sesión" @click="logout" />
      </q-toolbar>
    </q-header>

    <!-- Drawer solo para negocio -->
    <q-drawer
      v-if="auth.rol === 'negocio'"
      v-model="leftDrawerOpen"
      bordered
      :class="$q.dark.isActive ? 'bg-grey-10 text-white' : 'bg-white text-dark'"
    >
      <q-list>
        <q-item-label header>Administración</q-item-label>

        <q-item clickable to="/negocio">
          <q-item-section avatar>
            <q-icon name="dashboard" />
          </q-item-section>
          <q-item-section>Dashboard</q-item-section>
        </q-item>

        <q-item clickable to="/negocio/perfil">
          <q-item-section avatar>
            <q-icon name="store" />
          </q-item-section>
          <q-item-section>Mi Negocio</q-item-section>
        </q-item>

        <q-item clickable to="/negocio/catalogo">
          <q-item-section avatar>
            <q-icon name="list" />
          </q-item-section>
          <q-item-section>Catálogo</q-item-section>
        </q-item>

        <q-item clickable to="/negocio/estadisticas">
          <q-item-section avatar>
            <q-icon name="bar_chart" />
          </q-item-section>
          <q-item-section>Estadísticas</q-item-section>
        </q-item>

        <q-item clickable to="/negocio/resenas">
          <q-item-section avatar>
            <q-icon name="reviews" />
          </q-item-section>
          <q-item-section>Reseñas</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container
      class="admin-page-container"
      :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-grey-1 text-dark'"
    >
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'

const $q = useQuasar()
const router = useRouter()
const auth = useAuthStore()

const leftDrawerOpen = ref(false)

// Inicializar el tema al montar el layout
onMounted(() => {
  const saved = localStorage.getItem('darkMode')
  if (saved !== null) {
    $q.dark.set(saved === 'true')
  }
})

//Alternar tema y guardar preferencia
function toggleDarkMode() {
  $q.dark.toggle()
  localStorage.setItem('darkMode', $q.dark.isActive)
}

function logout() {
  auth.logout()
  router.push('/')
}
</script>

<style scoped>
.admin-header {
  height: 48px;
}

.admin-toolbar {
  min-height: 48px;
}
</style>
