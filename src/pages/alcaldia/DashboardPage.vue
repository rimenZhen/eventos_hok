<template>
  <q-page padding>
    <div class="text-h4 q-mb-md">Panel de Alcaldía</div>
    <div class="row q-col-gutter-md">
      <div class="col-12 col-sm-4">
        <q-card class="bg-primary text-white">
          <q-card-section>
            <div class="text-h6">Eventos Activos</div>
            <div class="text-h4">{{ eventosActivos }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-4">
        <q-card class="bg-secondary text-white">
          <q-card-section>
            <div class="text-h6">Sitios Activos</div>
            <div class="text-h4">{{ sitiosActivos }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-4">
        <q-card class="bg-warning text-white">
          <q-card-section>
            <div class="text-h6">Solicitudes Pendientes</div>
            <div class="text-h4">{{ solicitudesPendientes }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { alcaldiaAPI } from 'src/api/alcaldia'

const auth = useAuthStore()
const eventosActivos = ref(0)
const sitiosActivos = ref(0)
const solicitudesPendientes = ref(0)

onMounted(async () => {
  if (!auth.user || auth.rol !== 'alcaldia') return
  const [eventos, sitios, solicitudes] = await Promise.all([
    alcaldiaAPI.getEventos(auth.user._id),
    alcaldiaAPI.getSitios(auth.user._id),
    alcaldiaAPI.getSolicitudesNegocios()
  ])
  eventosActivos.value = eventos.filter(e => e.estado === 'activo').length
  sitiosActivos.value = sitios.filter(s => s.estado === 'activo').length
  solicitudesPendientes.value = solicitudes.length
})
</script>
