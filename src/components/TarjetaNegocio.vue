<template>
  <q-card class="q-ma-sm" style="min-width: 250px">
    <q-img :src="imagenPortada" :ratio="16/9" />
    <q-card-section>
      <div class="text-h6">{{ negocio.nombre_comercial }}</div>
      <div class="text-subtitle2 text-grey">{{ negocio.municipio }}, {{ negocio.departamento }}</div>
      <div class="text-caption">{{ negocio.telefono }}</div>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn flat color="primary" :to="'/negocio/' + negocio._id">Ver más</q-btn>
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'
import { couch } from 'src/api/index'

const props = defineProps({ negocio: Object })
const imgDocId = 'neg_' + props.negocio._id
const imagenPortada = computed(() => {
  if (props.negocio.imagen_portada) {
    return couch.getImageUrl(imgDocId, props.negocio.imagen_portada)
  }
  return 'https://via.placeholder.com/400x225?text=Negocio'
})
</script>
