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
      <div v-if="negocio.destacado" class="absolute-bottom-left bg-transparent">
        <q-chip size="sm" color="orange" text-color="white" icon="star" label="Destacado" />
      </div>
      <div class="absolute-bottom-right bg-transparent">
        <div class="text-caption row items-center">
          <q-icon name="place" color="white" />
          {{ getDisplayField(negocio.municipio) }}, {{ getDisplayField(negocio.departamento) }}
        </div>
      </div>
    </q-img>

    <q-card-section>
      <div class="row items-center q-gutter-xs q-mb-sm">
        <q-rating
          :model-value="negocio.calificacion_promedio || 0"
          readonly
          size="14px"
          color="orange"
        />
        <span class="text-caption text-grey">
          {{ (negocio.calificacion_promedio || 0).toFixed(1) }} ({{ cantidadResenas }} reseñas)
        </span>
      </div>
      <div class="text-h6 text-weight-bold q-mb-xs">{{ negocio.nombre_comercial }}</div>
      <div class="text-caption text-grey-6 q-mb-sm">
        {{ descripcionCorta }}
      </div>
      <div class="text-caption q-mb-xs" v-if="direccionMostrada">
        <q-icon name="location_on" size="xs" />
        {{ direccionMostrada }}
      </div>
      <div class="text-caption q-mb-xs" v-if="horarioResumido">
        <q-icon name="schedule" size="xs" />
        {{ horarioResumido }}
      </div>
      <div class="row q-gutter-xs q-mb-xs">
        <q-badge v-if="negocio.catalogo?.length" color="positive" text-color="white" label="Menú disponible" />
        <q-badge v-if="negocio.telefono" color="primary" outline :label="negocio.telefono" />
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
        :to="'/negocio/' + negocio._id"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { couch } from 'src/api/index'
import { useConfiguracionStore } from 'src/stores/configuracion'

const props = defineProps({ negocio: Object })
const configStore = useConfiguracionStore()

const docImagenes = ref(null)

function getDisplayField(field) {
  if (!field) return ''
  if (typeof field === 'string') return field
  if (typeof field === 'object') {
    return field.label || field.nombre || field.value || JSON.stringify(field)
  }
  return String(field)
}

const imgDocId = computed(() => 'neg_' + props.negocio._id)

async function cargarImagenes() {
  if (!props.negocio?._id) return
  try {
    docImagenes.value = await couch.get('eventos_imagenes', imgDocId.value)
  } catch {
    docImagenes.value = null
  }
}

const imagenPortada = computed(() => {
  if (!props.negocio) return 'https://via.placeholder.com/400x225?text=Negocio'
  if (props.negocio.imagen_portada) {
    return couch.getImageUrl(imgDocId.value, props.negocio.imagen_portada)
  }
  if (docImagenes.value && docImagenes.value._attachments) {
    const nombresArchivos = Object.keys(docImagenes.value._attachments)
    if (nombresArchivos.length > 0) {
      return couch.getImageUrl(imgDocId.value, nombresArchivos.at(-1))
    }
  }
  return 'https://via.placeholder.com/400x225?text=Negocio'
})

// ---- CATEGORÍA DESDE CONFIGURACIÓN ----
function extractCategoryKey(cat) {
  if (!cat) return ''
  if (typeof cat === 'string') return cat
  // Objeto típico { label: 'Restaurante', value: 'restaurante' }
  return cat.value || cat.clave || cat.label || ''
}

const categoriaKey = computed(() => extractCategoryKey(props.negocio.categoria).toLowerCase().trim())

const categoriaData = computed(() => {
  const key = categoriaKey.value
  const items = configStore.categoriasNegocios
  const found = items.find(item => item.clave.toLowerCase() === key || item.nombre.toLowerCase() === key)
  return found
    ? { nombre: found.nombre, color: found.color }
    : { nombre: 'General', color: '#9E9E9E' }
})
// ------------------------------------

const descripcionCorta = computed(() => {
  const desc = props.negocio.descripcion || ''
  return desc.length > 120 ? desc.substring(0, 120) + '…' : desc
})

const direccionMostrada = computed(() => {
  if (props.negocio.localizacion?.direccion) return props.negocio.localizacion.direccion
  return ''
})

const horarioResumido = computed(() => {
  const h = props.negocio.horario
  if (!h) return null
  const dias = ['lunes','martes','miercoles','jueves','viernes','sabado','domingo']
  const abiertos = dias.filter(d => h[d]?.abierto)
  if (!abiertos.length) return 'Cerrado'
  const apertura = h[abiertos[0]]?.apertura
  const cierre = h[abiertos[0]]?.cierre
  const mismoHorario = abiertos.every(d => h[d]?.apertura === apertura && h[d]?.cierre === cierre)
  if (mismoHorario && abiertos.length === 7) {
    return `Todos los días: ${apertura} – ${cierre}`
  }
  const abrev = { lunes:'Lun', martes:'Mar', miercoles:'Mié', jueves:'Jue', viernes:'Vie', sabado:'Sáb', domingo:'Dom' }
  const rangos = []
  let inicio = null, fin = null, rangoActual = null
  for (const d of dias) {
    const diaData = h[d]
    const activo = diaData?.abierto
    const apert = diaData?.apertura
    const cier = diaData?.cierre
    if (activo) {
      const clave = `${apert}-${cier}`
      if (clave !== rangoActual) {
        if (inicio) rangos.push(`${abrev[inicio]}-${abrev[fin]} ${rangoActual}`)
        inicio = d; fin = d; rangoActual = clave
      } else {
        fin = d
      }
    } else {
      if (inicio) {
        rangos.push(`${abrev[inicio]}-${abrev[fin]} ${rangoActual}`)
        inicio = null; fin = null; rangoActual = null
      }
    }
  }
  if (inicio) rangos.push(`${abrev[inicio]}-${abrev[fin]} ${rangoActual}`)
  return rangos.join(' | ') || 'Horario irregular'
})

const cantidadResenas = computed(() => props.negocio.reseñas?.length || 0)

onMounted(async () => {
  await configStore.fetchCatalogos()
  cargarImagenes()
})

watch(() => props.negocio._id, () => {
  cargarImagenes()
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
