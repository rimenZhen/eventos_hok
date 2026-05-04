<template>
  <q-page padding class="stats-page">
    <div class="text-center q-mb-lg">
      <h2 class="text-h4 text-weight-bolder">Estadísticas de la plataforma</h2>
      <div class="title-underline"></div>
    </div>

    <!-- Banner de modo demostración -->
    <q-banner v-if="demoMode" class="bg-warning q-mb-md" rounded>
      <template v-slot:avatar>
        <q-icon name="info" color="white" />
      </template>
      <span class="text-weight-bold">Modo demostración</span> – Los datos mostrados son valores de ejemplo. Conéctate a CouchDB para ver estadísticas reales.
    </q-banner>

    <div v-if="loadingStats" class="flex flex-center q-pa-xl">
      <q-spinner-dots color="primary" size="50px" />
    </div>
    <div v-else class="row q-col-gutter-md justify-center">
      <div class="col-12 col-sm-6 col-md-3" v-for="stat in stats" :key="stat.label">
        <q-card flat bordered class="stats-card">
          <q-card-section class="text-center">
            <q-icon :name="stat.icon" size="3rem" color="primary" />
            <div class="text-h4 q-mt-sm">{{ stat.value }}</div>
            <div class="text-subtitle2">{{ stat.label }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
// import { couch } from 'src/api/index'

// Cambia a false cuando tengas conexión real a la base de datos
const demoMode = ref(true)

const loadingStats = ref(false)
const stats = ref([
  { label: 'Eventos activos', value: 24, icon: 'event' },
  { label: 'Sitios turísticos', value: 18, icon: 'landscape' },
  { label: 'Negocios registrados', value: 32, icon: 'store' },
  { label: 'Usuarios activos', value: 156, icon: 'people' },
  { label: 'Reseñas publicadas', value: 89, icon: 'rate_review' }
])

// Función real para conectar a CouchDB (comentada mientras estés en demo)
/*
const fetchStatistics = async () => {
  loadingStats.value = true
  try {
    const db = import.meta.env.VITE_DB_DATA

    const eventos = await couch.find(db, { type: 'evento', estado: 'activo' }, { limit: 0 })
    const sitios = await couch.find(db, { type: 'sitio', estado: 'activo' }, { limit: 0 })
    const negocios = await couch.find(db, { type: 'negocio', estado: 'activo' }, { limit: 0 })
    const usuarios = await couch.find(db, { type: 'usuario', activo: true }, { limit: 0 })

    const allEventos = await couch.find(db, { type: 'evento' }, { fields: ['reseñas'] })
    const allSitios = await couch.find(db, { type: 'sitio' }, { fields: ['reseñas'] })
    const allNegocios = await couch.find(db, { type: 'negocio' }, { fields: ['reseñas'] })
    const totalResenas =
      (allEventos.docs.reduce((acc, ev) => acc + (ev.reseñas?.length || 0), 0) +
       allSitios.docs.reduce((acc, si) => acc + (si.reseñas?.length || 0), 0) +
       allNegocios.docs.reduce((acc, ne) => acc + (ne.reseñas?.length || 0), 0))

    stats.value = [
      { label: 'Eventos activos', value: eventos.docs.length, icon: 'event' },
      { label: 'Sitios turísticos', value: sitios.docs.length, icon: 'landscape' },
      { label: 'Negocios registrados', value: negocios.docs.length, icon: 'store' },
      { label: 'Usuarios activos', value: usuarios.docs.length, icon: 'people' },
      { label: 'Reseñas publicadas', value: totalResenas, icon: 'rate_review' }
    ]
  } catch (error) {
    console.error(error)
    stats.value = []
  } finally {
    loadingStats.value = false
  }
}
*/

// En lugar de cargar datos reales, mostramos el demo sin llamar a fetch
onMounted(() => {
  if (!demoMode.value) {
    loadingStats.value = true
    // fetchStatistics() // descomentar cuando tengas conexión
    loadingStats.value = false
  }
})
</script>

<style scoped>
.stats-page {
  max-width: 1200px;
  margin: 0 auto;
}
.title-underline {
  width: 80px;
  height: 4px;
  background: var(--q-color-primary);
  margin: 0.5rem auto 0;
  border-radius: 2px;
}
.stats-card {
  transition: transform 0.2s;
}
.stats-card:hover {
  transform: translateY(-5px);
}
</style>
