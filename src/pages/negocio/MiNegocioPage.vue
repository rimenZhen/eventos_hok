<template>
  <q-page padding>
    <div v-if="loading" class="flex flex-center q-pa-xl">
      <q-spinner-dots color="primary" size="50px" />
    </div>
    <div v-else-if="negocio">
      <div class="text-h5 q-mb-md">{{ negocio.nombre_comercial }}</div>
      <q-card>
        <q-card-section>
          <div class="row items-center">
            <q-avatar size="100px" class="q-mr-md">
              <q-img :src="imagenPortada" />
            </q-avatar>
            <div>
              <div class="text-h6">{{ negocio.nombre_comercial }}</div>
              <div class="text-subtitle2 text-grey">{{ negocio.municipio }}, {{ negocio.departamento }}</div>
              <q-badge v-if="negocio.estado_solicitud === 'pendiente'" color="warning">Pendiente de aprobación</q-badge>
              <q-badge v-else-if="negocio.estado_solicitud === 'aprobado'" color="positive">Aprobado</q-badge>
            </div>
          </div>
          <div class="q-mt-md">
            <p><strong>Descripción:</strong> {{ negocio.descripcion || 'Sin descripción' }}</p>
            <p><strong>Teléfono:</strong> {{ negocio.telefono || '-' }}</p>
            <p><strong>NIT:</strong> {{ negocio.nit_registro || '-' }}</p>
            <p><strong>Categoría:</strong> {{ negocio.categoria || '-' }}</p>
            <p><strong>Horario:</strong> <span v-if="negocio.horario">Ver horario</span></p>
          </div>
          <div class="q-mt-md">
            <q-btn label="Editar negocio" color="primary" icon="edit" to="/negocio/editar" />
          </div>
        </q-card-section>
      </q-card>
    </div>
    <div v-else class="text-red">No se pudo cargar el negocio.</div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { negocioAPI } from 'src/api/negocio'
import { couch } from 'src/api/index'

const auth = useAuthStore()
const negocio = ref(null)
const loading = ref(true)

const imagenPortada = computed(() => {
  if (negocio.value?.imagen_portada) {
    const imgDocId = 'neg_' + negocio.value._id
    return couch.getImageUrl(imgDocId, negocio.value.imagen_portada)
  }
  return 'https://via.placeholder.com/100'
})

onMounted(async () => {
  try {
    if (auth.user) {
      negocio.value = await negocioAPI.getMiNegocio(auth.user._id)
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>
