<template>
  <q-page
    class="alcaldia-panel"
    :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-grey-1 text-dark'"
  >
    <!-- Header del panel -->
    <div
      class="panel-mobile-header"
      :class="$q.dark.isActive ? 'bg-grey-10 text-white' : 'bg-purple-1 text-dark'"
    >
      <div class="header-left">
        <q-btn round color="blue" class="mobile-only-btn" :icon="menuOpen ? 'close' : 'menu'">
          <q-menu
            v-model="menuOpen"
            anchor="bottom left"
            self="top left"
            class="gestion-menu"
            :class="$q.dark.isActive ? 'bg-grey-10 text-white' : 'bg-white text-dark'"
          >
            <q-list style="min-width: 280px">
              <q-item-label
                header
                :class="$q.dark.isActive ? 'bg-grey-9 text-white' : 'bg-purple-1 text-dark'"
              >
                Administrar Alcaldía
              </q-item-label>

              <q-item clickable v-close-popup @click="abrirModalEvento(null)">
                <q-item-section avatar>
                  <q-btn round dense color="primary" icon="description" />
                </q-item-section>
                <q-item-section>Crear nuevo evento/sitio</q-item-section>
              </q-item>

              <q-item clickable v-close-popup>
                <q-item-section avatar>
                  <q-btn round dense color="primary" icon="info" />
                </q-item-section>
                <q-item-section>Información</q-item-section>
              </q-item>

              <q-item clickable v-close-popup @click="$router.push('/alcaldia/solicitudes')">
                <q-item-section avatar>
                  <q-btn round dense color="primary" icon="groups" />
                </q-item-section>
                <q-item-section>Administrar Solicitudes</q-item-section>
              </q-item>

              <q-item clickable v-close-popup @click="$router.push('/alcaldia/negocios')">
                <q-item-section avatar>
                  <q-btn round dense color="primary" icon="business_center" />
                </q-item-section>
                <q-item-section>Administrar negocios</q-item-section>
              </q-item>

              <q-item clickable v-close-popup @click="$router.push('/alcaldia/estadisticas')">
                <q-item-section avatar>
                  <q-btn round dense color="primary" icon="bar_chart" />
                </q-item-section>
                <q-item-section>Estadísticas</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>

      <div class="header-title">Panel de Gestión</div>

      <div class="header-right">
        <q-btn
          round
          color="primary"
          icon="arrow_back"
          class="mobile-only-btn"
          @click="$router.push('/')"
        />
      </div>
    </div>

    <!-- Botones de escritorio -->
    <div class="desktop-actions">
      <q-btn
        label="Crear nuevo evento/sitio"
        color="primary"
        icon="description"
        unelevated
        no-caps
        @click="abrirModalEvento(null)"
      />

      <q-btn
        label="Administrar Solicitudes"
        color="primary"
        icon="groups"
        unelevated
        no-caps
        @click="$router.push('/alcaldia/solicitudes')"
      />

      <q-btn
        label="Administrar negocios"
        color="primary"
        icon="business_center"
        unelevated
        no-caps
        @click="$router.push('/alcaldia/negocios')"
      />

      <q-btn
        label="Estadísticas"
        color="primary"
        icon="bar_chart"
        unelevated
        no-caps
        @click="$router.push('/alcaldia/estadisticas')"
      />
    </div>

    <!-- Contenido principal -->
    <div class="panel-content">
      <!-- Filtros -->
      <div class="filters-block">
        <q-select
          v-model="tipo"
          :options="tipoOptions"
          outlined
          emit-value
          map-options
          :dark="$q.dark.isActive"
          class="tipo-select"
          :class="$q.dark.isActive ? 'bg-grey-10 text-white' : 'bg-white text-dark'"
        />

        <div class="estado-buttons">
          <q-btn
            label="Todos"
            unelevated
            no-caps
            :color="!filtroEstado ? 'amber' : 'green-3'"
            :text-color="!filtroEstado ? 'black' : 'dark'"
            @click="filtroEstado = null"
          />

          <q-btn
            label="Activos"
            unelevated
            no-caps
            :color="filtroEstado === 'activo' ? 'primary' : 'green-3'"
            :text-color="filtroEstado === 'activo' ? 'white' : 'dark'"
            @click="filtroEstado = 'activo'"
          />

          <q-btn
            label="Archivados"
            unelevated
            no-caps
            :color="filtroEstado === 'archivado' ? 'primary' : 'green-3'"
            :text-color="filtroEstado === 'archivado' ? 'white' : 'dark'"
            @click="filtroEstado = 'archivado'"
          />
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex flex-center q-pa-xl">
        <q-spinner-dots color="primary" size="50px" />
      </div>

      <!-- Listado -->
      <div v-else>
        <div
          v-if="itemsFiltrados.length === 0"
          class="text-center q-pa-xl"
          :class="$q.dark.isActive ? 'text-grey-5' : 'text-grey-7'"
        >
          No hay elementos para mostrar.
        </div>

        <div class="row q-col-gutter-lg">
          <div v-for="item in itemsFiltrados" :key="item._id" class="col-12 col-sm-6 col-md-4">
            <div class="relative-position">
              <TarjetaEvento
                v-if="tipo === 'eventos'"
                :evento="item"
                @click="abrirModalEvento(item)"
              />

              <TarjetaSitio v-else :sitio="item" @click="abrirModalSitio(item)" />

              <div class="absolute-top-right q-pa-sm row q-gutter-xs">
                <q-btn
                  round
                  dense
                  flat
                  :color="$q.dark.isActive ? 'white' : 'primary'"
                  icon="edit"
                  @click.stop="abrirModalEdicion(item)"
                />

                <q-btn
                  round
                  dense
                  flat
                  :color="item.estado === 'archivado' ? 'positive' : 'negative'"
                  :icon="item.estado === 'archivado' ? 'unarchive' : 'archive'"
                  @click.stop="toggleArchivar(item)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modales -->
    <EventoFormModal
      v-model="modalEventoOpen"
      :evento="eventoSeleccionado"
      @saved="recargarDatos"
    />

    <SitioFormModal v-model="modalSitioOpen" :sitio="sitioSeleccionado" @saved="recargarDatos" />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'
import { alcaldiaAPI } from 'src/api/alcaldia'
import { couch } from 'src/api/index'
import TarjetaEvento from 'src/components/TarjetaEvento.vue'
import TarjetaSitio from 'src/components/TarjetaSitio.vue'
import EventoFormModal from 'src/pages/alcaldia/EventoFormModal.vue'
import SitioFormModal from 'src/pages/alcaldia/SitioFormModal.vue'

const $q = useQuasar()
const auth = useAuthStore()
const DB = import.meta.env.VITE_DB_DATA

const menuOpen = ref(false)

const tipo = ref('eventos')
const filtroEstado = ref(null)
const eventos = ref([])
const sitios = ref([])
const loading = ref(false)

const modalEventoOpen = ref(false)
const modalSitioOpen = ref(false)
const eventoSeleccionado = ref(null)
const sitioSeleccionado = ref(null)

const tipoOptions = [
  { label: 'Eventos', value: 'eventos' },
  { label: 'Sitios Turísticos', value: 'sitios' },
]

const itemsActuales = computed(() => {
  return tipo.value === 'eventos' ? eventos.value : sitios.value
})

const itemsFiltrados = computed(() => {
  if (!filtroEstado.value) return itemsActuales.value
  return itemsActuales.value.filter((item) => item.estado === filtroEstado.value)
})

async function cargarDatos() {
  loading.value = true

  try {
    if (tipo.value === 'eventos') {
      eventos.value = await alcaldiaAPI.getEventos(auth.user._id)
    } else {
      sitios.value = await alcaldiaAPI.getSitios(auth.user._id)
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function recargarDatos() {
  await cargarDatos()
}

async function toggleArchivar(item) {
  const nuevoEstado = item.estado === 'archivado' ? 'activo' : 'archivado'

  try {
    const doc = await couch.get(DB, item._id)
    doc.estado = nuevoEstado
    await couch.put(DB, doc)
    await cargarDatos()
  } catch (e) {
    console.error(e)
  }
}

function abrirModalEvento(item = null) {
  eventoSeleccionado.value = item
  modalEventoOpen.value = true
}

function abrirModalSitio(item = null) {
  sitioSeleccionado.value = item
  modalSitioOpen.value = true
}

function abrirModalEdicion(item) {
  if (tipo.value === 'eventos') {
    abrirModalEvento(item)
  } else {
    abrirModalSitio(item)
  }
}

watch(tipo, () => cargarDatos())

onMounted(() => {
  cargarDatos()
})
</script>

<style scoped>
.alcaldia-panel {
  min-height: 100vh;
  transition:
    background-color 0.25s ease,
    color 0.25s ease;
}

/* Header */
.panel-mobile-header {
  height: 72px;
  padding: 0 18px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  border-bottom: 1px solid #ddd;
}

.header-left {
  display: flex;
  justify-content: flex-start;
}

.header-title {
  text-align: center;
  font-size: 22px;
  font-weight: 700;
}

.header-right {
  display: flex;
  justify-content: flex-end;
}

/* Ocultar botones circulares en PC */
.mobile-only-btn {
  display: none;
}

/* Acciones de escritorio */
.desktop-actions {
  padding: 12px 18px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  border-bottom: 1px solid #ddd;
}

.body--dark .desktop-actions,
.body--dark .panel-mobile-header {
  border-bottom-color: #333;
}

/* Contenido */
.panel-content {
  padding: 26px 34px;
}

.filters-block {
  margin-bottom: 26px;
}

.tipo-select {
  width: 180px;
  margin-bottom: 16px;
}

.estado-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Menú */
.gestion-menu {
  border-radius: 12px;
  overflow: hidden;
}

/* Botones encima de cards */
.absolute-top-right {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 10;
}

/* Móvil */
@media (max-width: 600px) {
  .alcaldia-panel {
    max-width: 395px;
    margin: 0 auto;
  }

  .panel-mobile-header {
    height: 64px;
    padding: 0 16px;
    grid-template-columns: 48px 1fr 48px;
  }

  .mobile-only-btn {
    display: flex;
  }

  .header-title {
    font-size: 20px;
  }

  .desktop-actions {
    display: none;
  }

  .panel-content {
    padding: 16px;
  }

  .tipo-select {
    width: 180px;
    margin-bottom: 16px;
  }

  .estado-buttons {
    gap: 8px;
    margin-bottom: 8px;
  }

  .estado-buttons .q-btn {
    min-height: 40px;
    border-radius: 8px;
  }
}
</style>
