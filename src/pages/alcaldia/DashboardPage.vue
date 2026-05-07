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
                Menu de opciones
              </q-item-label>

              <q-item clickable v-close-popup @click="modalCrearOpen = true">
                <q-item-section avatar>
                  <q-btn round dense color="primary" icon="description" />
                </q-item-section>
                <q-item-section>Crear nuevo evento/sitio</q-item-section>
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

      <div class="header-title">Panel Administrativo</div>

      <div class="header-right"></div>
    </div>

    <!-- Botones de escritorio -->
    <div class="desktop-actions">
      <q-btn
        label="Crear nuevo evento/sitio"
        color="primary"
        icon="description"
        unelevated
        no-caps
        @click="modalCrearOpen = true"
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
            <div class="relative-position card-clickable">
              <TarjetaEvento v-if="tipo === 'eventos'" :evento="item" @click="abrirDetalle(item)" />

              <TarjetaSitio v-else :sitio="item" @click="abrirDetalle(item)" />

              <div class="absolute-top-right q-pa-sm row q-gutter-xs action-buttons">
                <q-btn
                  dense
                  unelevated
                  class="card-action-btn edit-action"
                  icon="edit_document"
                  @click.stop="abrirModalEdicion(item)"
                >
                  <q-tooltip>Editar</q-tooltip>
                </q-btn>

                <q-btn
                  dense
                  unelevated
                  class="card-action-btn archive-action"
                  :class="item.estado === 'archivado' ? 'restore-action' : ''"
                  :icon="item.estado === 'archivado' ? 'unarchive' : 'archive'"
                  @click.stop="toggleArchivar(item)"
                >
                  <q-tooltip>
                    {{ item.estado === 'archivado' ? 'Restaurar' : 'Archivar' }}
                  </q-tooltip>
                </q-btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para elegir qué crear -->
    <q-dialog v-model="modalCrearOpen">
      <q-card
        class="crear-modal"
        :class="$q.dark.isActive ? 'bg-grey-10 text-white' : 'bg-white text-dark'"
      >
        <q-card-section class="crear-modal-header">
          <div>
            <div class="text-h6 text-weight-bold">Crear nuevo</div>
            <div class="text-caption">Selecciona el tipo de registro</div>
          </div>

          <q-btn round flat dense icon="close" color="white" @click="modalCrearOpen = false" />
        </q-card-section>

        <q-card-section class="q-gutter-md crear-modal-body">
          <q-card
            flat
            bordered
            class="crear-option"
            :class="$q.dark.isActive ? 'bg-grey-9 text-white' : 'bg-grey-1 text-dark'"
            @click="seleccionarCrearSitio"
          >
            <q-card-section class="row items-center no-wrap q-gutter-md">
              <q-avatar color="orange" text-color="white" icon="place" size="56px" />

              <div>
                <div class="text-subtitle1 text-weight-bold">Sitio Turístico</div>
                <div class="text-caption crear-option-caption">
                  Registra un lugar de interés para visitantes
                </div>
              </div>
            </q-card-section>
          </q-card>

          <q-card
            flat
            bordered
            class="crear-option"
            :class="$q.dark.isActive ? 'bg-grey-9 text-white' : 'bg-grey-1 text-dark'"
            @click="seleccionarCrearEvento"
          >
            <q-card-section class="row items-center no-wrap q-gutter-md">
              <q-avatar color="indigo" text-color="white" icon="event" size="56px" />

              <div>
                <div class="text-subtitle1 text-weight-bold">Evento</div>
                <div class="text-caption crear-option-caption">
                  Crea un evento o actividad temporal
                </div>
              </div>
            </q-card-section>
          </q-card>
        </q-card-section>

        <q-card-section class="text-center text-caption crear-modal-footer">
          Ambos tipos pueden asociarse a negocios cercanos automáticamente
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Modales de formularios -->
    <EventoFormModal v-model="modalEventoOpen" :evento="eventoSeleccionado" @saved="onSaved" />

    <SitioFormModal v-model="modalSitioOpen" :sitio="sitioSeleccionado" @saved="onSaved" />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
const route = useRoute()
const router = useRouter()
const DB = import.meta.env.VITE_DB_DATA

const menuOpen = ref(false)
const modalCrearOpen = ref(false)

// Inicializar filtros desde los parámetros de consulta de la URL
const tipo = ref(route.query.tipo || 'eventos')
const filtroEstado = ref(route.query.estado || null)

// Sincronizar cambios de filtros con la URL sin recargar la página
watch([tipo, filtroEstado], ([newTipo, newEstado]) => {
  router.replace({
    query: {
      tipo: newTipo,
      estado: newEstado || undefined,
    },
  })
})

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

    $q.notify({
      type: 'negative',
      message: 'No se pudieron cargar los registros.',
      position: 'top',
      timeout: 2500,
    })
  } finally {
    loading.value = false
  }
}

async function recargarDatos() {
  await cargarDatos()
}

function onSaved() {
  $q.notify({
    type: 'positive',
    message: 'El registro se ha guardado correctamente.',
    position: 'top',
    timeout: 2500,
  })

  recargarDatos()
}

async function toggleArchivar(item) {
  const nuevoEstado = item.estado === 'archivado' ? 'activo' : 'archivado'

  try {
    const doc = await couch.get(DB, item._id)

    doc.estado = nuevoEstado

    await couch.put(DB, doc)
    await cargarDatos()

    $q.notify({
      type: 'positive',
      message: nuevoEstado === 'archivado' ? 'Registro archivado.' : 'Registro restaurado.',
      position: 'top',
      timeout: 2000,
    })
  } catch (e) {
    console.error(e)

    $q.notify({
      type: 'negative',
      message: 'No se pudo actualizar el estado del registro.',
      position: 'top',
      timeout: 2500,
    })
  }
}

function abrirDetalle(item) {
  if (!item?._id) return

  if (tipo.value === 'eventos') {
    router.push(`/alcaldia/evento/${item._id}`)
  } else {
    router.push(`/alcaldia/sitio/${item._id}`)
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

function seleccionarCrearEvento() {
  modalCrearOpen.value = false
  abrirModalEvento(null)
}

function seleccionarCrearSitio() {
  modalCrearOpen.value = false
  abrirModalSitio(null)
}

function abrirModalEdicion(item) {
  if (tipo.value === 'eventos') {
    abrirModalEvento(item)
  } else {
    abrirModalSitio(item)
  }
}

// Escucha el cambio de tipo para recargar datos automáticamente
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

/* Cards clickeables */
.card-clickable {
  cursor: pointer;
}

/* Botones encima de cards */
.absolute-top-right {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 10;
}

/* Botones de acción sobre las tarjetas */
.action-buttons {
  align-items: center;
}

.card-action-btn {
  width: 34px;
  height: 34px;
  min-width: 34px;
  border-radius: 9px;
  color: white;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.22);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    filter 0.2s ease;
}

.card-action-btn :deep(.q-icon) {
  font-size: 19px;
}

.card-action-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.05);
  box-shadow: 0 7px 16px rgba(0, 0, 0, 0.28);
}

.edit-action {
  background: linear-gradient(135deg, #1e88ff, #0052cc);
}

.archive-action {
  background: linear-gradient(135deg, #111827, #374151);
}

.restore-action {
  background: linear-gradient(135deg, #16a34a, #047857);
}

/* Modal crear nuevo */
.crear-modal {
  width: 450px;
  max-width: 92vw;
  border-radius: 16px;
  overflow: hidden;
}

.crear-modal-header {
  background: var(--q-primary);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.crear-modal-body {
  padding: 26px 24px 12px;
}

.crear-option {
  border-radius: 12px;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.crear-option:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.crear-option-caption {
  color: #6b7280;
}

.body--dark .crear-option-caption {
  color: #c7c7c7;
}

.crear-modal-footer {
  color: #8a8fa3;
  padding-top: 4px;
  padding-bottom: 18px;
}

/* Ajuste responsive para cards internas */
.panel-content :deep(.q-card),
.panel-content :deep(.evento-card),
.panel-content :deep(.sitio-card),
.panel-content :deep(.card-custom) {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  box-sizing: border-box;
  overflow: hidden;
}

.panel-content :deep(img),
.panel-content :deep(.q-img),
.panel-content :deep(.q-img__image) {
  width: 100% !important;
  max-width: 100% !important;
  object-fit: cover;
}

.panel-content :deep(.q-card__section),
.panel-content :deep(.text-h6),
.panel-content :deep(.text-subtitle1),
.panel-content :deep(.text-body1),
.panel-content :deep(.text-body2) {
  overflow-wrap: break-word;
  word-break: break-word;
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

  .panel-content .row {
    margin-left: 0;
    margin-right: 0;
  }

  .panel-content [class*='col-'] {
    padding-left: 0;
    padding-right: 0;
  }

  .crear-modal {
    width: 92vw;
  }

  .crear-modal-body {
    padding: 22px 18px 10px;
  }
}
</style>
