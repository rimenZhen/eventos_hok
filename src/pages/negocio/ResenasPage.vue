<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Reseñas de clientes</div>
    <div v-if="negocio?.reseñas?.length">
      <div v-for="(res, idx) in negocio.reseñas" :key="idx" class="q-mb-sm">
        <q-card flat bordered>
          <q-card-section>
            <div class="row items-center">
              <q-rating :model-value="res.calificacion" readonly size="1.5em" color="amber" />
              <span class="q-ml-sm text-weight-bold">{{ res.usuario_nombres }} {{ res.usuario_apellidos }}</span>
            </div>
            <div class="text-caption text-grey">{{ res.fecha?.substring(0,10) }}</div>
            <div>{{ res.comentario }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
    <div v-else class="text-grey q-pa-md">No hay reseñas aún.</div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { negocioAPI } from 'src/api/negocio'

const auth = useAuthStore()
const negocio = ref(null)

onMounted(async () => {
  negocio.value = await negocioAPI.getMiNegocio(auth.user._id)
})
</script>
