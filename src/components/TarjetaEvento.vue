<template>
  <q-card class="card-custom q-ma-sm bg-dark-card shadow-10" style="width: 350px">
    <q-img
      :src="imagenPortada"
      :ratio="16/9"
      @error="onImageError"
    >
      <div class="absolute-top-left bg-transparent q-pa-sm">
        <q-chip
          :style="{ backgroundColor: categoriaData.color }"
          text-color="white"
          :label="categoriaData.nombre"
          size="sm"
        />
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

      <div class="column q-gutter-y-xs q-mb-sm text-primary">
        <div class="row items-center q-gutter-x-xs">
          <q-icon name="event" size="xs" />
          <span class="text-caption text-weight-medium">{{ displayFecha }}</span>
        </div>
        <div class="row items-center q-gutter-x-xs">
          <q-icon name="schedule" size="xs" />
          <span class="text-caption text-weight-medium">{{ displayHora }}</span>
        </div>
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
import { computed, ref, onMounted } from 'vue'
import { couch } from 'src/api/index'
import { useQuasar } from 'quasar'
import { useConfiguracionStore } from 'src/stores/configuracion'

const $q = useQuasar()
const props = defineProps({ evento: Object })
const configStore = useConfiguracionStore()
const imgError = ref(false)

// ---- CATEGORÍA DESDE CONFIGURACIÓN ----
function extractCategoryKey(cat) {
  if (!cat) return ''
  if (typeof cat === 'string') return cat
  return cat.value || cat.clave || cat.label || ''
}

const categoriaKey = computed(() => extractCategoryKey(props.evento.categoria).toLowerCase().trim())

const categoriaData = computed(() => {
  const key = categoriaKey.value
  const items = configStore.categoriasEventos
  const found = items.find(item => item.clave.toLowerCase() === key || item.nombre.toLowerCase() === key)
  return found
    ? { nombre: found.nombre, color: found.color }
    : { nombre: 'Evento', color: '#9E9E9E' }
})

// ---- NOMBRE DEL DEPARTAMENTO ----
const nombreDepartamento = computed(() => {
  const dep = props.evento.departamento
  if (!dep) return ''
  if (typeof dep === 'string') {
    const found = configStore.departamentos.find(d => d.clave === dep)
    return found?.nombre || dep
  }
  return dep.nombre || dep.clave || ''
})

// ---- NOMBRE DEL DISTRITO (prioriza distrito.nombre, luego busca por municipio) ----
const distritoNombre = computed(() => {
  // 1. Si el evento tiene el objeto distrito con nombre, usarlo directamente
  if (props.evento?.distrito?.nombre) {
    return props.evento.distrito.nombre
  }

  // 2. Si no, buscar a partir de municipio (que puede ser objeto o string)
  const mun = props.evento?.municipio
  if (!mun) return ''

  let clave = ''
  if (typeof mun === 'string') clave = mun
  else if (mun.clave) clave = mun.clave
  else if (mun.value) clave = mun.value
  else return mun.nombre || ''

  // 3. Buscar en catálogo de distritos por clave
  const distrito = configStore.distritos.find(d => d.clave === clave)
  if (distrito) return distrito.nombre

  // 4. Si no se encuentra, podría ser una alcaldía; extraer el distrito principal
  const alcaldiaEncontrada = configStore.alcaldias.find(a => a.clave === clave)
  if (alcaldiaEncontrada) {
    const distritosAlc = configStore.distritos.filter(d => d.alcaldia === clave)
    if (distritosAlc.length > 0) {
      const base = alcaldiaEncontrada.nombre.replace(/\s+(Norte|Sur|Este|Oeste|Centro)$/i, '').trim()
      const match = distritosAlc.find(d => d.nombre.toLowerCase() === base.toLowerCase())
      if (match) return match.nombre
      return distritosAlc[0].nombre
    }
    return alcaldiaEncontrada.nombre
  }

  return clave
})

// ---- UBICACIÓN (distrito, departamento) ----
const ubicacion = computed(() => {
  const distrito = distritoNombre.value
  const departamento = nombreDepartamento.value
  if (distrito && departamento) return `${distrito}, ${departamento}`
  if (distrito) return distrito
  if (departamento) return departamento
  return 'Ubicación no especificada'
})

// --- LÓGICA DE HORARIOS Y FECHAS ---

// Formatea AM/PM a a. m. / p. m.
const formatAMPM = (date) => {
  return date.toLocaleTimeString('es-SV', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/El_Salvador'
  }).replace('AM', 'a. m.').replace('PM', 'p. m.');
}

// Obtiene abreviación del día (Jue, Sáb, etc.)
const getDiaSemanaAbbr = (date) => {
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return dias[date.getDay()];
}

const displayFecha = computed(() => {
  if (!props.evento.fecha_inicio) return 'Fecha no definida';

  const inicio = new Date(props.evento.fecha_inicio);
  const fin = props.evento.fecha_fin ? new Date(props.evento.fecha_fin) : null;

  if (isNaN(inicio.getTime())) return 'Fecha inválida';

  const anio = inicio.getFullYear();
  const opciones = { day: 'numeric', month: 'short' };

  // Caso: Mismo día
  if (!fin || inicio.toDateString() === fin.toDateString()) {
    return inicio.toLocaleDateString('es-SV', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // Caso: Rango de días (Ej: 28 may — 30 may, 2026)
  return `${inicio.toLocaleDateString('es-SV', opciones)} — ${fin.toLocaleDateString('es-SV', opciones)}, ${anio}`;
});

const displayHora = computed(() => {
  if (!props.evento.fecha_inicio) return '--:--';

  const inicio = new Date(props.evento.fecha_inicio);
  const fin = props.evento.fecha_fin ? new Date(props.evento.fecha_fin) : null;

  if (isNaN(inicio.getTime())) return '--:--';

  const horaInicioStr = formatAMPM(inicio);

  // Caso: Mismo día
  if (!fin || inicio.toDateString() === fin.toDateString()) {
    const horaFinStr = fin ? formatAMPM(fin) : '';
    return horaFinStr ? `${horaInicioStr} — ${horaFinStr}` : horaInicioStr;
  }

  // Caso: Diferentes días (añade el día de la semana para mayor claridad)
  const horaFinStr = formatAMPM(fin);
  return `${horaInicioStr} (${getDiaSemanaAbbr(inicio)}) — ${horaFinStr} (${getDiaSemanaAbbr(fin)})`;
});

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

onMounted(async () => {
  await configStore.fetchCatalogos()
})
</script>
