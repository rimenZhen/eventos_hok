<template>
  <q-card class="card-custom q-ma-sm bg-dark-card shadow-10" style="width: 350px">
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
      <p class="text-caption q-mb-sm" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'">
        {{ descripcionCorta }}
      </p>

      <div class="row items-center text-primary q-gutter-x-sm q-mb-xs">
        <q-icon name="event" size="xs" />
        <span class="text-caption">{{ fechaFormateada }}</span>
        <q-icon name="schedule" size="xs" />
        <span class="text-caption">{{ horaFormateada }}</span>
      </div>

      <div class="row items-center q-gutter-x-sm" :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'">
        <q-icon name="place" size="xs" color="orange" />
        <span class="text-caption">{{ ubicacion }}</span>
      </div>
    </q-card-section>

    <q-space />

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
.card-custom {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.btn-rounded {
  border-radius: 8px;
}
</style>

<script setup>
import { computed, ref } from 'vue'
import { couch } from 'src/api/index'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const props = defineProps({ evento: Object })
const imgError = ref(false)

// Extraer nombre de categoría (string o objeto)
const categoriaRaw = computed(() => {
  const cat = props.evento.categoria
  if (!cat) return ''
  if (typeof cat === 'string') return cat
  // Agregamos 'label' y 'value' para evitar errores si viene de un QSelect
  return cat.label || cat.nombre || cat.value || cat.clave || ''
})

const categoriaInfo = computed(() => {
  if (!categoriaRaw.value) return { nombre: 'Evento', color: 'grey' }

  // Normalizar la clave para buscar en el mapa (minúsculas y sin espacios extra)
  const clave = categoriaRaw.value.toLowerCase().trim()

  // Mapa ampliado y unificado con los colores de TarjetaNegocio
  const map = {
    deportes: { nombre: 'Deportes', color: 'blue' },
    gastronomia: { nombre: 'Gastronomía', color: 'deep-orange' },
    musica: { nombre: 'Música', color: 'purple' },
    cultura: { nombre: 'Cultura', color: 'teal' },
    naturaleza: { nombre: 'Naturaleza', color: 'green' },
    feria: { nombre: 'Feria', color: 'orange' },
    religioso: { nombre: 'Religioso', color: 'indigo' },
    artesanias: { nombre: 'Artesanías', color: 'brown' },
    hospedaje: { nombre: 'Hospedaje', color: 'indigo' },
    servicios: { nombre: 'Servicios', color: 'cyan' }
  }

  if (map[clave]) {
    return map[clave]
  }

  // Fallback inteligente: si la categoría no está en el mapa,
  // capitaliza la primera letra para que siempre se vea bien.
  const nombreFormateado = categoriaRaw.value.charAt(0).toUpperCase() + categoriaRaw.value.slice(1).toLowerCase()

  return {
    nombre: nombreFormateado,
    color: 'grey-8'
  }
})

const nombreDepartamento = computed(() => {
  const dep = props.evento.departamento
  if (!dep) return ''
  if (typeof dep === 'string') return dep
  return dep.nombre || dep.clave || ''
})

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

const precioMostrado = computed(() => {
  if (!props.evento.precio && props.evento.precio !== 0) return 'Gratis'
  if (typeof props.evento.precio === 'number') {
    return new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(props.evento.precio)
  }
  return props.evento.precio
})

const descripcionCorta = computed(() => {
  if (!props.evento.descripcion) return 'Sin descripción disponible'
  const maxLen = 80
  if (props.evento.descripcion.length <= maxLen) return props.evento.descripcion
  return props.evento.descripcion.substring(0, maxLen).trim() + '...'
})

const ubicacion = computed(() => {
  const municipio = props.evento.municipio || ''
  const departamento = nombreDepartamento.value
  if (municipio && departamento) return `${municipio}, ${departamento}`
  if (municipio) return municipio
  if (departamento) return departamento
  return 'Ubicación no especificada'
})

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
