<template>
  <q-page padding>
    <div class="text-h4 q-mb-md text-center">Descubre más</div>

    <!-- Tabs -->
    <q-tabs
      v-model="tab"
      dense
      class="text-grey"
      active-color="primary"
      indicator-color="primary"
      @update:model-value="cargarResultados"
    >
      <q-tab name="eventos" label="Eventos" />
      <q-tab name="sitios" label="Sitios Turísticos" />
      <q-tab name="negocios" label="Negocios" />
    </q-tabs>

    <q-separator />

    <!-- Filtros (sin cambios) -->
    <div class="row q-col-gutter-md q-my-md">
      <div class="col-12 col-sm-4">
        <q-select
          v-model="filtros.categoria"
          :options="opcionesCategorias"
          label="Categoría"
          clearable
          outlined
          dense
          @update:model-value="cargarResultados"
        />
      </div>
      <div class="col-12 col-sm-4">
        <q-select
          v-model="filtros.departamento"
          :options="opcionesDepartamentos"
          label="Departamento"
          clearable
          outlined
          dense
          @update:model-value="cargarResultados"
        />
      </div>
      <div class="col-12 col-sm-4">
        <q-input
          v-model="filtros.texto"
          label="Buscar..."
          outlined
          dense
          clearable
          @update:model-value="cargarResultados"
        />
      </div>
    </div>

    <!-- Resultados (contenedor centrado) -->
    <div class="result-container">
      <div v-if="loading" class="flex flex-center q-pa-xl">
        <q-spinner-dots color="primary" size="50px" />
      </div>
      <div v-else>
        <!-- Mensaje sin resultados -->
        <div v-if="items.length === 0" class="text-center text-grey q-pa-xl">
          No se encontraron resultados.
        </div>

        <!-- Grid de tarjetas -->
        <div v-else class="row q-col-gutter-md justify-center">
          <div
            v-for="item in paginatedItems"
            :key="item._id"
            class="col-12 col-sm-6 col-md-4 card-col"
          >
            <TarjetaEvento v-if="tab === 'eventos'" :evento="item" />
            <TarjetaSitio v-else-if="tab === 'sitios'" :sitio="item" />
            <TarjetaNegocio v-else-if="tab === 'negocios'" :negocio="item" />
          </div>
        </div>

        <!-- Paginación -->
        <div v-if="items.length > 0" class="row justify-between items-center q-mt-lg">
          <!-- Selector de elementos por página -->
          <div class="row items-center q-gutter-sm">
            <span class="text-caption">Mostrar:</span>
            <q-select
              v-model="itemsPerPage"
              :options="itemsPerPageOptions"
              dense
              outlined
              style="width: 80px"
              @update:model-value="currentPage = 1"
            />
          </div>

          <!-- Páginas numeradas -->
          <div class="row items-center q-gutter-sm">
            <span class="text-caption">
              {{ (currentPage - 1) * itemsPerPage + 1 }}-{{
                Math.min(currentPage * itemsPerPage, items.length)
              }} de {{ items.length }}
            </span>
            <q-pagination
              v-model="currentPage"
              :max="totalPages"
              :max-pages="6"
              direction-links
              flat
              color="primary"
              active-color="primary"
            />
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEventosStore } from 'src/stores/eventos'
import { useSitiosStore } from 'src/stores/sitios'
import { useNegociosStore } from 'src/stores/negocios'
import { useConfiguracionStore } from 'src/stores/configuracion'
import TarjetaEvento from 'src/components/TarjetaEvento.vue'
import TarjetaSitio from 'src/components/TarjetaSitio.vue'
import TarjetaNegocio from 'src/components/TarjetaNegocio.vue'

const route = useRoute()
const eventosStore = useEventosStore()
const sitiosStore = useSitiosStore()
const negociosStore = useNegociosStore()
const configStore = useConfiguracionStore()

const tab = ref('eventos')
const filtros = reactive({
  categoria: null,
  departamento: null,
  texto: ''
})

// Paginación
const currentPage = ref(1)
const itemsPerPage = ref(6)
const itemsPerPageOptions = [6, 12, 24]

// Opciones para selects
const opcionesCategorias = computed(() =>
  configStore.categorias.map(c => ({ label: c.nombre, value: c.clave }))
)
const opcionesDepartamentos = computed(() =>
  configStore.departamentos.map(d => ({ label: d.nombre, value: d.clave }))
)

const items = computed(() => {
  if (tab.value === 'eventos') return eventosStore.eventos
  if (tab.value === 'sitios') return sitiosStore.sitios
  if (tab.value === 'negocios') return negociosStore.negocios
  return []
})

const loading = computed(() => {
  if (tab.value === 'eventos') return eventosStore.loading
  if (tab.value === 'sitios') return sitiosStore.loading
  if (tab.value === 'negocios') return negociosStore.loading
  return false
})

const totalPages = computed(() => Math.ceil(items.value.length / itemsPerPage.value))

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return items.value.slice(start, start + itemsPerPage.value)
})

// Reiniciar página al cambiar tab o filtros
watch([tab, filtros], () => {
  currentPage.value = 1
}, { deep: true })

async function cargarResultados() {
  const filtrosActuales = {
    categoria: filtros.categoria,
    departamento: filtros.departamento,
    texto: filtros.texto
  }
  if (tab.value === 'eventos') {
    await eventosStore.fetchFiltered(filtrosActuales)
  } else if (tab.value === 'sitios') {
    await sitiosStore.fetchFiltered(filtrosActuales)
  } else if (tab.value === 'negocios') {
    await negociosStore.fetchFiltered(filtrosActuales)
  }
}

onMounted(async () => {
  if (route.query.tab && ['eventos', 'sitios', 'negocios'].includes(route.query.tab)) {
    tab.value = route.query.tab
  }
  if (configStore.departamentos.length === 0) {
    await configStore.fetchCatalogos()
  }
  await cargarResultados()
})
</script>

<style scoped>
/* Contenedor centrado con ancho máximo */
.result-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px; /* espacio lateral */
}

/* Forzamos que todas las tarjetas dentro de las columnas ocupen el 100% del ancho */
.card-col .card-custom {
  width: 100% !important;
  max-width: 100% !important;
}

/* Para TarjetaNegocio, que no usa la clase card-custom, igual la forzamos */
.card-col .tarjeta-negocio {
  width: 100% !important;
  min-width: unset !important;
}

/* Asegura mismo alto (opcional) */
.card-col {
  display: flex;
}

.card-col > * {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
