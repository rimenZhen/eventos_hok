<template>
  <q-page padding class="alcaldia-panel">
    <!-- Cabecera con botón regresar -->
    <div class="row items-center q-mb-md">
      <q-btn flat round icon="arrow_back" @click="$router.push('/')" class="q-mr-sm" />
      <div class="text-h4">Panel de Gestión</div>
    </div>

    <!-- Botones de acción principales -->
    <div class="row q-col-gutter-sm q-mb-lg">
      <div class="col-12 col-sm-6 col-md-3">
        <q-btn
          label="Crear Evento"
          color="primary"
          icon="add"
          class="full-width"
          @click="abrirModalEvento(null)"
        />
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-btn
          label="Crear Sitio"
          color="primary"
          icon="add_location"
          class="full-width"
          @click="abrirModalSitio(null)"
        />
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-btn
          label="Administrar Solicitudes"
          color="secondary"
          icon="pending"
          class="full-width"
          @click="$router.push('/alcaldia/solicitudes')"
        />
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-btn
          label="Administrar Negocios"
          color="secondary"
          icon="store"
          class="full-width"
          @click="$router.push('/alcaldia/negocios')"
        />
      </div>
    </div>

    <!-- Filtros: tipo (eventos/sitios) y estado -->
    <div class="row q-col-gutter-md items-center q-mb-md">
      <div class="col-12 col-md-4">
        <q-btn-toggle
          v-model="tipo"
          :options="tipoOptions"
          color="primary"
          toggle-color="primary"
          glossy
          class="full-width"
        />
      </div>
      <div class="col-12 col-md-4">
        <q-select
          v-model="filtroEstado"
          :options="estadoOptions"
          label="Filtrar por estado"
          outlined
          dense
          clearable
        />
      </div>
    </div>

    <!-- Listado de tarjetas -->
    <div v-if="loading" class="flex flex-center q-pa-xl">
      <q-spinner-dots color="primary" size="50px" />
    </div>
    <div v-else>
      <div v-if="itemsFiltrados.length === 0" class="text-center text-grey q-pa-xl">
        No hay elementos para mostrar.
      </div>
      <div class="row q-col-gutter-md">
        <div v-for="item in itemsFiltrados" :key="item._id" class="col-12 col-sm-6 col-md-4">
          <div class="relative-position">
            <!-- Tarjeta según el tipo -->
            <TarjetaEvento
              v-if="tipo === 'eventos'"
              :evento="item"
              @click="abrirModalEvento(item)"
            />
            <TarjetaSitio v-else :sitio="item" @click="abrirModalSitio(item)" />
            <!-- Botones de edición/archivo superpuestos -->
            <div class="absolute-top-right q-pa-sm row q-gutter-xs">
              <q-btn
                round
                dense
                flat
                color="white"
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

    <!-- MODALES -->
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
//import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { alcaldiaAPI } from 'src/api/alcaldia'
import { couch } from 'src/api/index'
import TarjetaEvento from 'src/components/TarjetaEvento.vue'
import TarjetaSitio from 'src/components/TarjetaSitio.vue'
import EventoFormModal from 'src/pages/alcaldia/EventoFormModal.vue'
import SitioFormModal from 'src/pages/alcaldia/SitioFormModal.vue'

//const router = useRouter()
const auth = useAuthStore()
const DB = import.meta.env.VITE_DB_DATA

// Estado
const tipo = ref('eventos') // 'eventos' o 'sitios'
const filtroEstado = ref(null)
const eventos = ref([])
const sitios = ref([])
const loading = ref(false)

// Modales
const modalEventoOpen = ref(false)
const modalSitioOpen = ref(false)
const eventoSeleccionado = ref(null)
const sitioSeleccionado = ref(null)

const tipoOptions = [
  { label: 'Eventos', value: 'eventos' },
  { label: 'Sitios Turísticos', value: 'sitios' },
]

const estadoOptions = [
  { label: 'Todos', value: null },
  { label: 'Activos', value: 'activo' },
  { label: 'Archivados', value: 'archivado' },
]

// Items según tipo actual
const itemsActuales = computed(() => {
  return tipo.value === 'eventos' ? eventos.value : sitios.value
})

// Filtrado por estado
const itemsFiltrados = computed(() => {
  if (!filtroEstado.value) return itemsActuales.value
  return itemsActuales.value.filter((item) => item.estado === filtroEstado.value)
})

// Cargar datos según el tipo
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

// Recargar después de guardar/editar
async function recargarDatos() {
  await cargarDatos()
}

// Alternar archivado / activo
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

// Abrir modal de evento (null = nuevo, objeto = editar)
function abrirModalEvento(item = null) {
  eventoSeleccionado.value = item
  modalEventoOpen.value = true
}

// Abrir modal de sitio
function abrirModalSitio(item = null) {
  sitioSeleccionado.value = item
  modalSitioOpen.value = true
}

// Un solo método para editar desde la tarjeta (usa el tipo actual)
function abrirModalEdicion(item) {
  if (tipo.value === 'eventos') {
    abrirModalEvento(item)
  } else {
    abrirModalSitio(item)
  }
}

// Observar cambio de tipo para recargar
watch(tipo, () => cargarDatos())

onMounted(() => {
  cargarDatos()
})
</script>

<style scoped>
.alcaldia-panel {
  background: #f5f5f5;
  min-height: 100vh;
}
.absolute-top-right {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 10;
}
</style>
