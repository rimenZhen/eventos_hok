<template>
  <q-card class="card-custom q-ma-sm shadow-10" style="width: 350px">
    <q-img :src="imagenPortada" :ratio="16/9">
      <div class="absolute-top-left bg-transparent q-pa-sm">
        <q-chip size="sm" color="cyan" text-color="white" :label="categoriaMostrada" />
      </div>
      <div v-if="sitio.destacado" class="absolute-bottom-left bg-transparent">
        <q-chip size="sm" color="orange" text-color="white" icon="star" label="Destacado" />
      </div>
      <div class="absolute-bottom-right bg-transparent">
        <div class="text-caption row items-center">
          <q-icon name="place" color="white" />
          {{ getDisplayField(sitio.municipio) }}, {{ getDisplayField(sitio.departamento) }}
        </div>
      </div>
    </q-img>

    <q-card-section>
      <div class="text-h6 text-weight-bold">{{ sitio.nombre }}</div>
      <div class="text-caption text-grey-6 q-mb-sm">
        {{ descripcionCorta }}
      </div>
      <div class="row items-center q-gutter-xs q-mb-sm">
        <q-rating
          :model-value="sitio.calificacion_promedio || 0"
          readonly
          size="14px"
          color="orange"
        />
        <span class="text-caption text-grey">
          {{ (sitio.calificacion_promedio || 0).toFixed(1) }} ({{ cantidadResenas }} reseñas)
        </span>
      </div>
    </q-card-section>

    <q-space />

    <q-card-actions>
      <q-btn
        unelevated
        color="primary"
        label="Ver detalles"
        icon-right="chevron_right"
        class="full-width btn-rounded"
        :to="'/sitio/' + sitio._id"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'
import { couch } from 'src/api/index'

const props = defineProps({ sitio: Object })

function getDisplayField(field) {
  if (!field) return ''
  if (typeof field === 'string') return field
  if (typeof field === 'object') {
    return field.label || field.nombre || field.value || JSON.stringify(field)
  }
  return String(field)
}

const imgDocId = computed(() => 'sit_' + props.sitio._id)
const imagenPortada = computed(() => {
  if (props.sitio.imagen_portada) {
    return couch.getImageUrl(imgDocId.value, props.sitio.imagen_portada)
  }
  return 'https://via.placeholder.com/400x225?text=Sitio'
})

const categoriaMostrada = computed(() => {
  const cat = getDisplayField(props.sitio.categoria)
  if (!cat) return 'General'
  return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase()
})

const descripcionCorta = computed(() => {
  const desc = props.sitio.descripcion || ''
  return desc.length > 120 ? desc.substring(0, 120) + '…' : desc
})

const cantidadResenas = computed(() => props.sitio.reseñas?.length || 0)
</script>

<style scoped>
.card-custom {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.btn-rounded {
  border-radius: 8px;
}
</style>
