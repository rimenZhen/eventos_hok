<template>
  <q-page padding>
    <div class="text-h4 q-mb-md">Descubre más</div>

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

    <!-- Filtros -->
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

    <!-- Resultados -->
    <div v-if="loading" class="flex flex-center q-pa-xl">
      <q-spinner-dots color="primary" size="50px" />
    </div>
    <div v-else>
      <div v-if="items.length === 0" class="text-center text-grey q-pa-xl">
        No se encontraron resultados.
      </div>
      <div v-else class="row q-col-gutter-md">
        <div v-for="item in items" :key="item._id" class="col-12 col-sm-6 col-md-4">
          <TarjetaEvento v-if="tab === 'eventos'" :evento="item" />
          <TarjetaSitio v-else-if="tab === 'sitios'" :sitio="item" />
          <TarjetaNegocio v-else-if="tab === 'negocios'" :negocio="item" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
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
  // Si la URL tiene ?tab=sitios, lo activamos
  if (route.query.tab && ['eventos', 'sitios', 'negocios'].includes(route.query.tab)) {
    tab.value = route.query.tab
  }
  // Cargar catálogos si no están
  if (configStore.departamentos.length === 0) {
    await configStore.fetchCatalogos()
  }
  // Cargar los resultados iniciales (ya con el tab correcto)
  await cargarResultados()
})
</script>
