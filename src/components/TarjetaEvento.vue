<template>
  <q-card class="q-ma-sm" style="min-width: 250px">
    <q-img :src="imagenPortada" :ratio="16/9" />
    <q-card-section>
      <div class="text-h6">{{ evento.titulo }}</div>
      <div class="text-subtitle2 text-grey">{{ evento.municipio }}, {{ evento.departamento }}</div>
      <div class="text-caption">{{ evento.fecha_inicio?.substring(0,10) }}</div>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn flat color="primary" :to="'/evento/' + evento._id">Ver más</q-btn>
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'
import { couch } from 'src/api/index'

const props = defineProps({ evento: Object })
const imgDocId = 'evt_' + props.evento._id
const imagenPortada = computed(() => {
  if (props.evento.imagen_portada) {
    return couch.getImageUrl(imgDocId, props.evento.imagen_portada)
  }
  return 'https://via.placeholder.com/400x225?text=Evento' // placeholder
})
</script>
