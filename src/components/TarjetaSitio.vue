<template>
  <q-card class="card-custom q-ma-sm shadow-10" style="width: 350px">
    <q-img :src="imagenPortada" :ratio="16/9">
      <div class="absolute-top-left bg-transparent q-pa-sm">
        <q-chip
          size="sm"
          :style="{ backgroundColor: categoriaData.color }"
          text-color="white"
          :label="categoriaData.nombre"
        />
      </div>
      <div v-if="sitio.destacado" class="absolute-bottom-left bg-transparent">
        <q-chip size="sm" color="orange" text-color="white" icon="star" label="Destacado" />
      </div>
      <div class="absolute-bottom-right bg-transparent">
        <div class="text-caption row items-center">
          <q-icon name="place" color="white" />
          {{ ubicacion }}
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
import { computed, onMounted } from 'vue'
import { couch } from 'src/api/index'
import { useConfiguracionStore } from 'src/stores/configuracion'

const props = defineProps({ sitio: Object })
const configStore = useConfiguracionStore()

// ---- CATEGORÍA DESDE CONFIGURACIÓN ----
function extractCategoryKey(cat) {
  if (!cat) return ''
  if (typeof cat === 'string') return cat
  return cat.value || cat.clave || cat.label || ''
}

const categoriaKey = computed(() => extractCategoryKey(props.sitio.categoria).toLowerCase().trim())

const categoriaData = computed(() => {
  const key = categoriaKey.value
  const items = configStore.categoriasSitios
  const found = items.find(item => item.clave.toLowerCase() === key || item.nombre.toLowerCase() === key)
  return found
    ? { nombre: found.nombre, color: found.color }
    : { nombre: 'General', color: '#9E9E9E' }
})

// ---- NOMBRE DEL DEPARTAMENTO DESDE CATÁLOGO ----
const departamentoNombre = computed(() => {
  const dep = props.sitio.departamento
  if (!dep) return ''
  if (typeof dep === 'string') {
    const found = configStore.departamentos.find(d => d.clave === dep)
    return found?.nombre || dep
  }
  return dep.nombre || dep.clave || ''
})

// ---- NOMBRE DEL DISTRITO (prioriza distrito.nombre) ----
const distritoNombre = computed(() => {
  // 1. Si el sitio tiene el objeto distrito con nombre, usarlo
  if (props.sitio?.distrito?.nombre) {
    return props.sitio.distrito.nombre
  }

  // 2. Si no, buscar a partir de municipio
  const mun = props.sitio?.municipio
  if (!mun) return ''

  let clave = ''
  if (typeof mun === 'string') clave = mun
  else if (mun.clave) clave = mun.clave
  else if (mun.value) clave = mun.value
  else return mun.nombre || ''

  // 3. Buscar en catálogo de distritos por clave
  const distrito = configStore.distritos.find(d => d.clave === clave)
  if (distrito) return distrito.nombre

  // 4. Podría ser una alcaldía; extraer distrito principal
  const alcaldia = configStore.alcaldias.find(a => a.clave === clave)
  if (alcaldia) {
    const distritosAlc = configStore.distritos.filter(d => d.alcaldia === clave)
    if (distritosAlc.length > 0) {
      const base = alcaldia.nombre.replace(/\s+(Norte|Sur|Este|Oeste|Centro)$/i, '').trim()
      const match = distritosAlc.find(d => d.nombre.toLowerCase() === base.toLowerCase())
      if (match) return match.nombre
      return distritosAlc[0].nombre
    }
    return alcaldia.nombre
  }
  return clave
})

// ---- UBICACIÓN FORMATEADA ----
const ubicacion = computed(() => {
  const d = distritoNombre.value
  const dep = departamentoNombre.value
  if (d && dep) return `${d}, ${dep}`
  if (d) return d
  if (dep) return dep
  return 'Ubicación no especificada'
})

// ---- IMAGEN ----
const imgDocId = computed(() => 'sit_' + props.sitio._id)
const imagenPortada = computed(() => {
  if (props.sitio.imagen_portada) {
    return couch.getImageUrl(imgDocId.value, props.sitio.imagen_portada)
  }
  return 'https://via.placeholder.com/400x225?text=Sitio'
})

// ---- DESCRIPCIÓN CORTA ----
const descripcionCorta = computed(() => {
  const desc = props.sitio.descripcion || ''
  return desc.length > 120 ? desc.substring(0, 120) + '…' : desc
})

const cantidadResenas = computed(() => props.sitio.reseñas?.length || 0)

onMounted(async () => {
  await configStore.fetchCatalogos()
})
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
