<template>
  <q-card class="card-custom q-ma-sm shadow-10" style="width: 350px">
    <q-img :src="imagenPortada" :ratio="16/9">
      <div class="absolute-top-left bg-transparent q-pa-sm">
        <q-chip
          size="sm"
          :color="categoriaColor"
          text-color="white"
          :label="categoriaMostrada"
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
      <!-- Calificación con estrellas -->
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

      <!-- Nombre -->
      <div class="text-h6 text-weight-bold q-mb-xs">{{ negocio.nombre_comercial }}</div>

      <!-- Descripción breve -->
      <div class="text-caption text-grey-6 q-mb-sm">
        {{ descripcionCorta }}
      </div>

      <!-- Ubicación (dirección) -->
      <div class="text-caption q-mb-xs" v-if="direccionMostrada">
        <q-icon name="location_on" size="xs" />
        {{ direccionMostrada }}
      </div>

      <!-- Horario resumido -->
      <div class="text-caption q-mb-xs" v-if="horarioResumido">
        <q-icon name="schedule" size="xs" />
        {{ horarioResumido }}
      </div>

      <!-- Indicadores extra -->
      <div class="row q-gutter-xs q-mb-xs">
        <q-badge v-if="negocio.catalogo?.length" color="positive" text-color="white" label="Menú disponible" />
        <q-badge v-if="negocio.telefono" color="primary" outline :label="negocio.telefono" />
      </div>
    </q-card-section>

    <!-- Espaciador flexible para empujar el botón hacia abajo -->
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
import { computed } from 'vue'
import { couch } from 'src/api/index'

const props = defineProps({ negocio: Object })

// Función auxiliar para campos que pueden ser string u objeto
function getDisplayField(field) {
  if (!field) return ''
  if (typeof field === 'string') return field
  if (typeof field === 'object') {
    return field.label || field.nombre || field.value || JSON.stringify(field)
  }
  return String(field)
}

// Imagen de portada
const imgDocId = computed(() => 'neg_' + props.negocio._id)
const imagenPortada = computed(() => {
  if (props.negocio.imagen_portada) {
    return couch.getImageUrl(imgDocId.value, props.negocio.imagen_portada)
  }
  return 'https://via.placeholder.com/400x225?text=Negocio'
})

// Categoría para el chip
const categoriaMostrada = computed(() => {
  const cat = getDisplayField(props.negocio.categoria)
  if (!cat) return 'General'
  return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase()
})

const categoriaColor = computed(() => {
  const map = {
    gastronomia: 'deep-orange',
    hospedaje: 'indigo',
    artesanias: 'brown',
    servicios: 'teal',
    general: 'grey'
  }
  const clave = getDisplayField(props.negocio.categoria).toLowerCase()
  return map[clave] || 'grey'
})

// Descripción corta
const descripcionCorta = computed(() => {
  const desc = props.negocio.descripcion || ''
  return desc.length > 120 ? desc.substring(0, 120) + '…' : desc
})

// Dirección (si existe localizacion.direccion o municipio)
const direccionMostrada = computed(() => {
  if (props.negocio.localizacion?.direccion) return props.negocio.localizacion.direccion
  return ''
})

// Horario resumido (mismo algoritmo anterior)
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
