<template>
  <q-page>
    <!-- Hero Section (sin cambios) -->
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

    <!-- Sección: Eventos Destacados -->
    <q-separator />
    <div class="section-container q-py-xl q-px-md">
      <div class="text-center q-mb-lg">
        <h2 class="text-h4 text-weight-bolder q-mb-sm">Eventos Destacados</h2>
        <p class="text-subtitle1 text-grey-6">Descubre los mejores eventos que El Salvador tiene para ti</p>
        <div class="title-underline"></div>
      </div>
      <div v-if="eventosStore.eventos.length" class="row q-col-gutter-md q-mb-md justify-center">
        <div v-for="ev in eventosStore.eventos.slice(0,4)" :key="ev._id" class="col-12 col-sm-6 col-md-3 card-col">
          <TarjetaEvento :evento="ev" />
        </div>
      </div>
      <div v-else class="text-grey q-pa-md text-center">No hay eventos destacados en este momento.</div>
      <div class="text-right">
        <q-btn flat color="primary" label="Ver todos los eventos →" to="/descubre?tab=eventos" />
      </div>
    </div>

    <!-- Sección: Sitios Turísticos -->
    <div class="section-container q-py-xl q-px-md">
      <div class="text-center q-mb-lg">
        <h2 class="text-h4 text-weight-bolder q-mb-sm">Sitios Turísticos</h2>
        <p class="text-subtitle1 text-grey-6">Descubre los destinos más impresionantes de El Salvador</p>
        <div class="title-underline"></div>
      </div>
      <div v-if="sitiosStore.sitios.length" class="row q-col-gutter-md q-mb-md justify-center">
        <div v-for="st in sitiosStore.sitios.slice(0,4)" :key="st._id" class="col-12 col-sm-6 col-md-3 card-col">
          <TarjetaSitio :sitio="st" />
        </div>
      </div>
      <div v-else class="text-grey q-pa-md text-center">Explora próximamente sitios increíbles.</div>
      <div class="text-right">
        <q-btn flat color="primary" label="Ver todos los sitios →" to="/descubre?tab=sitios" />
      </div>
    </div>

    <!-- Sección: Negocios Cercanos -->
    <div class="section-container q-py-xl q-px-md">
      <div class="text-center q-mb-lg">
        <h2 class="text-h4 text-weight-bolder q-mb-sm">Negocios Cercanos</h2>
        <p class="text-subtitle1 text-grey-6">Apoya a los negocios locales y disfruta de lo mejor de cada región</p>
        <div class="title-underline"></div>
      </div>
      <div v-if="negociosStore.negocios.length" class="row q-col-gutter-md q-mb-md justify-center">
        <div v-for="neg in negociosStore.negocios.slice(0,4)" :key="neg._id" class="col-12 col-sm-6 col-md-3 card-col">
          <TarjetaNegocio :negocio="neg" />
        </div>
      </div>
      <div v-else class="text-grey q-pa-md text-center">Negocios locales se unirán pronto.</div>
      <div class="text-right">
        <q-btn flat color="primary" label="Ver todos los negocios →" to="/descubre?tab=negocios" />
      </div>
    </div>

    <!-- Sección: Explora en el mapa -->
    <div class="section-container q-py-xl q-px-md">
      <div class="text-center q-mb-lg">
        <h2 class="text-h4 text-weight-bolder q-mb-sm">Explora en el mapa</h2>
        <p class="text-subtitle1 text-grey-6">Encuentra eventos, sitios y negocios cerca de ti</p>
        <div class="title-underline"></div>
      </div>
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

/* Contenedor centrado con ancho máximo (como en DescubreMas) */
.section-container {
  max-width: 1200px;
  margin: 0 auto;
}

/* Línea decorativa debajo del título */
.title-underline {
  width: 80px;
  height: 4px;
  background: var(--q-color-primary);
  margin: 0.5rem auto 0;
  border-radius: 2px;
}

/* --- Nuevas reglas para igualar altura (tomadas de DescubreMas) --- */
.card-col {
  display: flex;
}

.card-col > * {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100% !important;
}

/* Eliminamos anchos fijos anteriores que ya no se usarán */
</style>
