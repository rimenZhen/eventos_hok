<template>
  <q-card class="q-ma-sm tarjeta-negocio" style="min-width: 250px">
    <!-- Imagen de portada -->
    <q-img :src="imagenPortada" :ratio="16/9" />

    <q-card-section>
      <!-- Categoría como chip pequeño -->
      <div class="row items-center q-mb-xs">
        <q-badge :color="categoriaColor" text-color="white" :label="negocio.categoria" />
        <q-space />
        <!-- Calificación -->
        <div v-if="negocio.calificacion_promedio" class="row items-center">
          <q-icon name="star" color="amber" size="xs" />
          <span class="q-ml-xs text-caption text-weight-bold">{{ negocio.calificacion_promedio }}</span>
          <span class="text-caption text-grey q-ml-xs">({{ negocio.reseñas?.length || 0 }})</span>
        </div>
      </div>

      <!-- Nombre -->
      <div class="text-h6 q-mb-xs">{{ negocio.nombre_comercial }}</div>

      <!-- Descripción breve (truncada) -->
      <div class="text-body2 text-grey-7 q-mb-xs descripcion-truncada">
        {{ negocio.descripcion?.substring(0, 120) }}{{ negocio.descripcion?.length > 120 ? '...' : '' }}
      </div>

      <!-- Ubicación (dirección + municipio/depto) -->
      <div class="text-caption q-mb-xs">
        <q-icon name="location_on" size="xs" />
        {{ negocio.localizacion?.direccion || negocio.municipio + ', ' + negocio.departamento }}
      </div>

      <!-- Horario abreviado -->
      <div class="text-caption q-mb-xs" v-if="horarioResumido">
        <q-icon name="schedule" size="xs" /> {{ horarioResumido }}
      </div>

      <!-- Indicadores extra: catálogo disponible, WhatsApp, etc. -->
      <div class="row q-gutter-xs q-mb-xs">
        <q-badge v-if="negocio.catalogo?.length" color="positive" text-color="white" label="Menú disponible" />
        <q-badge v-if="negocio.telefono" color="primary" outline :label="negocio.telefono" />
      </div>
    </q-card-section>

    <q-card-actions align="right">
      <!-- Botón Ver más -->
      <q-btn flat color="primary" :to="'/negocio/' + negocio._id">Ver más</q-btn>
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'
import { couch } from 'src/api/index'

const props = defineProps({ negocio: Object })

// URL de la imagen de portada (mismo patrón usado en eventos/sitios)
const imgDocId = 'neg_' + props.negocio._id
const imagenPortada = computed(() => {
  if (props.negocio.imagen_portada) {
    return couch.getImageUrl(imgDocId, props.negocio.imagen_portada)
  }
  return 'https://via.placeholder.com/400x225?text=Negocio'
})

// Color para el badge de categoría (personalizable)
const categoriaColor = computed(() => {
  const map = {
    gastronomia: 'deep-orange',
    hospedaje: 'indigo',
    artesanias: 'brown',
    servicios: 'teal'
  }
  return map[props.negocio.categoria] || 'grey'
})

// Horario resumido a partir del objeto de días
const horarioResumido = computed(() => {
  const h = props.negocio.horario
  if (!h) return null
  // Intenta encontrar un horario común de lunes a domingo
  const dias = ['lunes','martes','miercoles','jueves','viernes','sabado','domingo']
  const abiertos = dias.filter(d => h[d]?.abierto)
  if (!abiertos.length) return 'Cerrado'
  const apertura = h[abiertos[0]]?.apertura
  const cierre = h[abiertos[0]]?.cierre
  const mismoHorario = abiertos.every(d => h[d]?.apertura === apertura && h[d]?.cierre === cierre)
  if (mismoHorario && abiertos.length === 7) {
    return `Todos los días: ${apertura} – ${cierre}`
  }
  // Formato rápido: Lun-Vie 7:00-21:00, Sáb 8:00-22:00, Dom cerrado
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
</script>

<style scoped>
.descripcion-truncada {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
