<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Estadísticas</div>
    <div v-if="metrics" class="row q-col-gutter-md">
      <div class="col-12 col-sm-6">
        <q-card class="bg-primary text-white">
          <q-card-section>
            <div class="text-h6">Visitas del mes</div>
            <div class="text-h3">{{ metrics.monthTotal || 0 }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6">
        <q-card class="bg-secondary text-white">
          <q-card-section>
            <div class="text-h6">Visitas del año</div>
            <div class="text-h3">{{ metrics.yearTotal || 0 }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { negocioAPI } from 'src/api/negocio'

const auth = useAuthStore()
const negocio = ref(null)
const metrics = ref(null)

onMounted(async () => {
  negocio.value = await negocioAPI.getMiNegocio(auth.user._id)
  metrics.value = await negocioAPI.getBusinessMetricsSummary(negocio.value._id, { period: '30' })
})
</script>
