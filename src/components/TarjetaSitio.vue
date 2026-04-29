<template>
  <q-card class="q-ma-sm" style="min-width: 250px">
    <q-img :src="imagenPortada" :ratio="16/9" />
    <q-card-section>
      <div class="text-h6">{{ sitio.nombre }}</div>
      <div class="text-subtitle2 text-grey">{{ sitio.municipio }}, {{ sitio.departamento }}</div>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn flat color="primary" :to="'/sitio/' + sitio._id">Ver más</q-btn>
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'
import { couch } from 'src/api/index'

const props = defineProps({ sitio: Object })
const imgDocId = 'sit_' + props.sitio._id
const imagenPortada = computed(() => {
  if (props.sitio.imagen_portada) {
    return couch.getImageUrl(imgDocId, props.sitio.imagen_portada)
  }
  return 'https://via.placeholder.com/400x225?text=Sitio'
})
</script>
