<template>
  <q-card class="card-custom q-ma-sm bg-dark-card text-white shadow-10" style="width: 350px">
    <q-img
      :src="imagenPortada"
      :ratio="16/9"
      @error="onImageError"
    >
      <div class="absolute-top-left bg-transparent q-pa-sm">
        <q-chip :color="categoriaInfo.color" text-color="white" :label="categoriaInfo.nombre" size="sm" />
      </div>
      <div v-if="evento.destacado" class="absolute-top-right bg-transparent q-pa-sm">
        <q-chip size="sm" color="orange" text-color="white" icon="star" label="Destacado" />
      </div>
    </q-img>

    <q-card-section>
      <div class="text-h6 text-weight-bold q-mb-xs">{{ evento.titulo }}</div>
      <p class="text-caption text-grey-5 q-mb-sm">
        {{ descripcionCorta }}
      </p>

      <div class="row items-center text-primary q-gutter-x-sm q-mb-xs">
        <q-icon name="event" size="xs" />
        <span class="text-caption">{{ fechaFormateada }}</span>
        <q-icon name="schedule" size="xs" />
        <span class="text-caption">{{ horaFormateada }}</span>
      </div>

      <div class="row items-center text-grey-5 q-gutter-x-sm">
        <q-icon name="place" size="xs" color="orange" />
        <span class="text-caption">{{ ubicacion }}</span>
      </div>
    </q-card-section>

    <q-card-actions align="between" class="q-px-md q-pb-md">
      <div class="text-primary text-weight-bold">{{ precioMostrado }}</div>
      <q-btn
        unelevated
        color="primary"
        label="Ver detalles"
        icon-right="chevron_right"
        class="btn-rounded full-width q-mt-sm"
        :to="'/evento/' + evento._id"
      />
    </q-card-actions>
  </q-card>
</template>

<style scoped>
.bg-dark-card {
  background: v-bind("$q.dark.isActive ? '#1d1d1d' : '#ffffff'");
  color: v-bind("$q.dark.isActive ? '#ffffff' : '#1d1d1d'");
}
</style>

<script setup>
import { computed, ref } from 'vue'
import { couch } from 'src/api/index'

const props = defineProps({ evento: Object })
const imgError = ref(false)

// Extraer nombre de categoría (string o objeto)
const categoriaRaw = computed(() => {
  const cat = props.evento.categoria
  if (!cat) return ''
  if (typeof cat === 'string') return cat
  // Si es objeto, intentar obtener 'nombre' o 'clave'
  return cat.nombre || cat.clave || ''
})

// Mapeo de nombres legibles y colores
const categoriaInfo = computed(() => {
  const clave = categoriaRaw.value.toLowerCase()
  const map = {
    deportes: { nombre: 'Deportes', color: 'blue' },
    gastronomia: { nombre: 'Gastronomía', color: 'green' },
    musica: { nombre: 'Música', color: 'purple' },
    cultura: { nombre: 'Cultura', color: 'teal' },
    naturaleza: { nombre: 'Naturaleza', color: 'lime' },
    feria: { nombre: 'Feria', color: 'orange' },
    religioso: { nombre: 'Religioso', color: 'indigo' }
  }
  return map[clave] || { nombre: categoriaRaw.value || 'Evento', color: 'grey' }
})

// Extraer nombre del departamento (string u objeto)
const nombreDepartamento = computed(() => {
  const dep = props.evento.departamento
  if (!dep) return ''
  if (typeof dep === 'string') return dep
  return dep.nombre || dep.clave || ''
})

// Fecha y hora (con validación)
const fechaFormateada = computed(() => {
  if (!props.evento.fecha_inicio) return 'Fecha no definida'
  const date = new Date(props.evento.fecha_inicio)
  if (isNaN(date.getTime())) return 'Fecha inválida'
  return date.toLocaleDateString('es-SV', { year: 'numeric', month: 'short', day: 'numeric' })
})

const horaFormateada = computed(() => {
  if (!props.evento.fecha_inicio) return '--:--'
  const date = new Date(props.evento.fecha_inicio)
  if (isNaN(date.getTime())) return '--:--'
  return date.toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit', timeZone: 'America/El_Salvador' })
})

// Precio (si existe el campo, si no 'Gratis')
const precioMostrado = computed(() => {
  if (!props.evento.precio && props.evento.precio !== 0) return 'Gratis'
  if (typeof props.evento.precio === 'number') {
    return new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(props.evento.precio)
  }
  return props.evento.precio // string como "Gratis" o "$5"
})

// Descripción corta
const descripcionCorta = computed(() => {
  if (!props.evento.descripcion) return 'Sin descripción disponible'
  const maxLen = 80
  if (props.evento.descripcion.length <= maxLen) return props.evento.descripcion
  return props.evento.descripcion.substring(0, maxLen).trim() + '...'
})

// Ubicación: municipio + departamento (limpio)
const ubicacion = computed(() => {
  const municipio = props.evento.municipio || ''
  const departamento = nombreDepartamento.value
  if (municipio && departamento) return `${municipio}, ${departamento}`
  if (municipio) return municipio
  if (departamento) return departamento
  return 'Ubicación no especificada'
})

// Imagen: manejo de error de carga
const imgDocId = computed(() => 'evt_' + props.evento._id)
const imagenPortada = computed(() => {
  if (imgError.value || !props.evento.imagen_portada) {
    return 'https://via.placeholder.com/400x225?text=Evento'
  }
  return couch.getImageUrl(imgDocId.value, props.evento.imagen_portada)
})

const onImageError = () => {
  imgError.value = true
}
</script>
