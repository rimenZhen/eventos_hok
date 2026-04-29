<template>
  <q-page>
    <!-- Hero Section -->
    <div class="hero bg-primary text-white q-pa-xl">
      <div class="text-h3 text-weight-bolder">Descubre El Salvador</div>
      <p class="text-h6">Eventos culturales, sitios turísticos y negocios locales cerca de ti</p>
      <q-input dark dense standout v-model="busqueda" placeholder="Buscar eventos, sitios, negocios..." class="q-mt-md" @keyup.enter="irDescubre">
        <template v-slot:append>
          <q-icon name="search" />
        </template>
      </q-input>
      <q-btn label="Descubre más" color="secondary" class="q-mt-md" to="/descubre" />
    </div>

    <!-- Eventos Destacados -->
    <q-separator />
    <div class="q-pa-md">
      <div class="text-h5 q-mb-sm">Eventos Destacados <q-btn flat round icon="arrow_forward" to="/descubre?tab=eventos" /></div>
      <div class="row" style="overflow-x: auto; flex-wrap: nowrap">
        <TarjetaEvento v-for="ev in eventosStore.eventos" :key="ev._id" :evento="ev" />
        <div v-if="eventosStore.eventos.length === 0" class="text-grey q-pa-md">No hay eventos destacados en este momento.</div>
      </div>
    </div>

    <!-- Sitios Turísticos -->
    <div class="q-pa-md bg-grey-2">
      <div class="text-h5 q-mb-sm">Sitios Turísticos <q-btn flat round icon="arrow_forward" to="/descubre?tab=sitios" /></div>
      <div class="row" style="overflow-x: auto; flex-wrap: nowrap">
        <TarjetaSitio v-for="st in sitiosStore.sitios" :key="st._id" :sitio="st" />
        <div v-if="sitiosStore.sitios.length === 0" class="text-grey q-pa-md">Explora próximamente sitios increíbles.</div>
      </div>
    </div>

    <!-- Negocios Cercanos -->
    <div class="q-pa-md">
      <div class="text-h5 q-mb-sm">Negocios Cercanos <q-btn flat round icon="arrow_forward" to="/descubre?tab=negocios" /></div>
      <div class="row" style="overflow-x: auto; flex-wrap: nowrap">
        <TarjetaNegocio v-for="neg in negociosStore.negocios" :key="neg._id" :negocio="neg" />
        <div v-if="negociosStore.negocios.length === 0" class="text-grey q-pa-md">Negocios locales se unirán pronto.</div>
      </div>
    </div>

    <!-- Mapa -->
    <div class="q-pa-md bg-grey-2">
      <div class="text-h5 q-mb-sm">Explora en el mapa</div>
      <MapaInteractivo :eventos="eventosStore.eventos" :sitios="sitiosStore.sitios" />
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEventosStore } from 'src/stores/eventos'
import { useSitiosStore } from 'src/stores/sitios'
import { useNegociosStore } from 'src/stores/negocios'
import TarjetaEvento from 'src/components/TarjetaEvento.vue'
import TarjetaSitio from 'src/components/TarjetaSitio.vue'
import TarjetaNegocio from 'src/components/TarjetaNegocio.vue'
import MapaInteractivo from 'src/components/MapaInteractivo.vue'

const busqueda = ref('')
const router = useRouter()

const eventosStore = useEventosStore()
const sitiosStore = useSitiosStore()
const negociosStore = useNegociosStore()

onMounted(async () => {
  await Promise.all([
    eventosStore.fetchDestacados(),
    sitiosStore.fetchDestacados(),
    negociosStore.fetchActivos()
  ])
})

function irDescubre() {
  if (busqueda.value) {
    router.push({ path: '/descubre', query: { q: busqueda.value } })
  } else {
    router.push('/descubre')
  }
}
</script>

<style scoped>
.hero {
  background: linear-gradient(135deg, var(--q-color-primary), #2A9D8F);
}
</style>
