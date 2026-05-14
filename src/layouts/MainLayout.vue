<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar class="main-toolbar">
        <!-- Menú normal fuera del panel de alcaldía -->
        <q-btn
          v-if="!isAlcaldiaPanel"
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          class="nav-btn"
          @click="toggleLeftDrawer"
        />

        <!-- Botón regresar dentro del panel de alcaldía -->
        <q-btn
          v-else
          flat
          dense
          round
          icon="arrow_back"
          :aria-label="isAlcaldiaDashboard ? 'Regresar al inicio' : 'Regresar al panel de alcaldía'"
          class="nav-btn"
          @click="volverDesdeAlcaldia"
        />

        <q-toolbar-title class="app-title">
          <router-link to="/" class="text-white text-no-decoration">
            El Salvador Turismo
          </router-link>
        </q-toolbar-title>

        <div class="toolbar-actions">
          <q-btn
            flat
            round
            dense
            :icon="isDark ? 'dark_mode' : 'light_mode'"
            @click="toggleDarkMode"
            aria-label="Cambiar tema"
            class="theme-btn"
          >
            <q-tooltip>{{ isDark ? 'Modo claro' : 'Modo oscuro' }}</q-tooltip>
          </q-btn>

          <template v-if="auth.isLoggedIn">
            <!-- Nombre sin icono de perfil -->
            <q-btn flat no-caps dense class="user-name-btn" @click="goToProfile">
              <span class="user-name-text">
                {{ auth.userName }}
              </span>

              <q-tooltip>Ver perfil</q-tooltip>
            </q-btn>

            <!-- Cerrar sesión responsive -->
            <q-btn
              flat
              dense
              no-caps
              class="logout-btn"
              icon="logout"
              label="Cerrar sesión"
              aria-label="Cerrar sesión"
              @click="logout"
            >
              <q-tooltip>Cerrar sesión</q-tooltip>
            </q-btn>
          </template>

          <template v-else>
            <q-btn flat dense no-caps label="Login" to="/auth/login" class="auth-btn" />
            <q-btn flat dense no-caps label="Registro" to="/auth/registro" class="auth-btn" />
          </template>
        </div>
      </q-toolbar>
    </q-header>

    <!-- Drawer principal: se oculta dentro del panel de alcaldía -->
    <q-drawer
      v-model="leftDrawerOpen"
      bordered
      show-if-above
      overlay
      behavior="mobile"
      :breakpoint="1024"
      @hide="leftDrawerOpen = false"
      v-show="!isAlcaldiaPanel"
    >
      <q-list>
        <q-item-label header>Navegación</q-item-label>

        <q-item clickable to="/" @click="leftDrawerOpen = false">
          <q-item-section avatar>
            <q-icon name="home" />
          </q-item-section>
          <q-item-section>Inicio</q-item-section>
        </q-item>

        <q-item clickable to="/descubre" @click="leftDrawerOpen = false">
          <q-item-section avatar>
            <q-icon name="search" />
          </q-item-section>
          <q-item-section>Descubre más</q-item-section>
        </q-item>

        <q-separator />

        <template v-if="auth.isLoggedIn">
          <q-item-label header>Mi Cuenta</q-item-label>

          <q-item clickable @click="goToProfile">
            <q-item-section avatar>
              <q-icon name="person" />
            </q-item-section>
            <q-item-section>Perfil</q-item-section>
          </q-item>

          <q-item v-if="auth.rol === 'usuario_final'" clickable @click="goToFavoritos">
            <q-item-section avatar>
              <q-icon name="favorite" />
            </q-item-section>
            <q-item-section>Favoritos</q-item-section>
          </q-item>

          <q-item
            v-if="auth.isLoggedIn && auth.rol === 'usuario_final'"
            clickable
            to="/usuario/resenas"
            @click="leftDrawerOpen = false"
          >
            <q-item-section avatar>
              <q-icon name="rate_review" />
            </q-item-section>
            <q-item-section>Mis reseñas</q-item-section>
          </q-item>
          <template v-if="auth.rol === 'alcaldia'">
            <q-item clickable to="/alcaldia" @click="leftDrawerOpen = false">
              <q-item-section avatar>
                <q-icon name="dashboard" />
              </q-item-section>
              <q-item-section>Panel Alcaldía</q-item-section>
            </q-item>
          </template>

          <template v-if="auth.rol === 'negocio'">
            <q-item clickable to="/negocio" @click="leftDrawerOpen = false">
              <q-item-section avatar>
                <q-icon name="store" />
              </q-item-section>
              <q-item-section>Mi Negocio</q-item-section>
            </q-item>
          </template>
        </template>

        <q-item clickable to="/politicas" @click="leftDrawerOpen = false">
          <q-item-section avatar>
            <q-icon name="gavel" />
          </q-item-section>
          <q-item-section>Políticas</q-item-section>
        </q-item>

        <q-item clickable to="/sobre-nosotros" @click="leftDrawerOpen = false">
          <q-item-section avatar>
            <q-icon name="group" />
          </q-item-section>
          <q-item-section>Sobre Nosotros</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const leftDrawerOpen = ref(false)
const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const isDark = computed(() => $q.dark.isActive)

const isAlcaldiaPanel = computed(() => {
  return route.path.startsWith('/alcaldia')
})

const isAlcaldiaDashboard = computed(() => {
  return route.path === '/alcaldia'
})

function toggleLeftDrawer() {
  if (isAlcaldiaPanel.value) return
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function volverDesdeAlcaldia() {
  leftDrawerOpen.value = false

  if (isAlcaldiaDashboard.value) {
    router.push('/')
    return
  }

  router.push('/alcaldia')
}

function logout() {
  auth.logout()
  leftDrawerOpen.value = false
  router.push('/')
}

function goToProfile() {
  leftDrawerOpen.value = false

  if (auth.rol === 'negocio') {
    router.push('/negocio/perfil')
  } else {
    router.push('/usuario/perfil')
  }
}

function goToFavoritos() {
  leftDrawerOpen.value = false
  router.push('/usuario/favoritos')
}

onMounted(() => {
  const saved = localStorage.getItem('darkMode')

  if (saved !== null) {
    $q.dark.set(saved === 'true')
  }
})

function toggleDarkMode() {
  $q.dark.toggle()
  localStorage.setItem('darkMode', $q.dark.isActive)
}
</script>

<style scoped>
.text-no-decoration {
  text-decoration: none;
}

/* Toolbar */
.main-toolbar {
  min-height: 50px;
  padding-left: 10px;
  padding-right: 12px;
  gap: 6px;
  overflow: hidden;
}

.nav-btn {
  flex-shrink: 0;
}

.app-title {
  min-width: 0;
  flex: 1 1 auto;
  font-size: 20px;
  font-weight: 500;
}

.app-title a {
  display: block;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex-shrink: 0;
}

/* Nombre del usuario sin icono */
.user-name-btn {
  min-height: 34px;
  max-width: 190px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
}

.user-name-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.user-name-text {
  display: block;
  max-width: 165px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: white;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

/* Botón cerrar sesión */
.logout-btn {
  min-height: 34px;
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.logout-btn :deep(.q-icon) {
  font-size: 18px;
}

/* Tablet */
@media (max-width: 768px) {
  .main-toolbar {
    padding-left: 8px;
    padding-right: 8px;
    gap: 4px;
  }

  .app-title {
    font-size: 17px;
  }

  .toolbar-actions {
    gap: 4px;
  }

  .user-name-btn {
    max-width: 120px;
    padding: 4px 8px;
  }

  .user-name-text {
    max-width: 95px;
    font-size: 11px;
  }

  .logout-btn {
    padding: 4px 7px;
  }

  .logout-btn :deep(.q-btn__content .block) {
    display: none;
  }

  .logout-btn :deep(.q-icon) {
    margin-right: 0;
  }
}

/* Móvil */
@media (max-width: 480px) {
  .main-toolbar {
    min-height: 50px;
    padding-left: 6px;
    padding-right: 6px;
    gap: 3px;
  }

  .app-title {
    font-size: 15px;
  }

  .theme-btn {
    display: none;
  }

  .user-name-btn {
    max-width: 72px;
    min-height: 32px;
    padding: 3px 6px;
  }

  .user-name-text {
    max-width: 58px;
    font-size: 10px;
  }

  .logout-btn {
    width: 32px;
    min-width: 32px;
    min-height: 32px;
    padding: 0;
    border-radius: 50%;
  }

  .logout-btn :deep(.q-btn__content .block) {
    display: none;
  }

  .logout-btn :deep(.q-icon) {
    margin: 0;
    font-size: 18px;
  }

  .auth-btn {
    padding: 3px 5px;
    font-size: 11px;
  }
}

/* Móviles muy pequeños, como 300px */
@media (max-width: 340px) {
  .main-toolbar {
    padding-left: 4px;
    padding-right: 4px;
    gap: 2px;
  }

  .nav-btn {
    width: 32px;
    min-width: 32px;
  }

  .app-title {
    font-size: 14px;
  }

  .user-name-btn {
    max-width: 48px;
    min-width: 48px;
    padding: 2px 4px;
  }

  .user-name-text {
    max-width: 40px;
    font-size: 9px;
  }

  .logout-btn {
    width: 30px;
    min-width: 30px;
    min-height: 30px;
  }
}
</style>
