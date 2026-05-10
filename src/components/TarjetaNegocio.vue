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
          {{ ubicacion }}
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

      <!-- Indicador de estado de apertura con mensaje completo -->
      <div v-if="estadoApertura" class="row items-center q-mb-xs">
        <q-icon
          name="circle"
          :color="estadoApertura.abierto ? 'green' : 'red'"
          size="10px"
          class="q-mr-xs"
        />
        <span class="text-caption text-weight-medium">
          {{ estadoApertura.mensaje }}
        </span>
      </div>

      <div class="text-caption text-grey-6 q-mb-sm">
        {{ descripcionCorta }}
      </div>
      <div class="text-caption q-mb-xs" v-if="direccionMostrada">
        <q-icon name="location_on" size="xs" />
        {{ direccionMostrada }}
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

function extractCategoryKey(cat) {
  if (!cat) return ''
  if (typeof cat === 'string') return cat
  return cat.value || cat.clave || cat.label || ''
}

const categoriaKey = computed(() =>
  extractCategoryKey(props.negocio.categoria).toLowerCase().trim()
)

const categoriaData = computed(() => {
  const key = categoriaKey.value
  const items = configStore.categoriasNegocios
  const found = items.find(
    (item) =>
      item.clave.toLowerCase() === key || item.nombre.toLowerCase() === key
  )
  return found
    ? { nombre: found.nombre, color: found.color }
    : { nombre: 'General', color: '#9E9E9E' }
})

const departamentoNombre = computed(() => {
  const dep = props.negocio.departamento
  if (!dep) return ''
  if (typeof dep === 'string') {
    const found = configStore.departamentos.find((d) => d.clave === dep)
    return found?.nombre || dep
  }
  return dep.nombre || dep.clave || ''
})

const distritoNombre = computed(() => {
  if (props.negocio?.distrito?.nombre) return props.negocio.distrito.nombre
  const mun = props.negocio?.municipio
  if (!mun) return ''
  let clave = ''
  if (typeof mun === 'string') clave = mun
  else if (mun.clave) clave = mun.clave
  else if (mun.value) clave = mun.value
  else return mun.nombre || ''

  const distrito = configStore.distritos.find((d) => d.clave === clave)
  if (distrito) return distrito.nombre

  const alcaldia = configStore.alcaldias.find((a) => a.clave === clave)
  if (alcaldia) {
    const distritosAlc = configStore.distritos.filter(
      (d) => d.alcaldia === clave
    )
    if (distritosAlc.length > 0) {
      const base = alcaldia.nombre
        .replace(/\s+(Norte|Sur|Este|Oeste|Centro)$/i, '')
        .trim()
      const match = distritosAlc.find(
        (d) => d.nombre.toLowerCase() === base.toLowerCase()
      )
      if (match) return match.nombre
      return distritosAlc[0].nombre
    }
    return alcaldia.nombre
  }
  return clave
})

const ubicacion = computed(() => {
  const d = distritoNombre.value
  const dep = departamentoNombre.value
  if (d && dep) return `${d}, ${dep}`
  if (d) return d
  if (dep) return dep
  return 'Ubicación no especificada'
})

const descripcionCorta = computed(() => {
  const desc = props.negocio.descripcion || ''
  return desc.length > 120 ? desc.substring(0, 120) + '…' : desc
})

const direccionMostrada = computed(() => {
  return props.negocio.localizacion?.direccion || ''
})

const cantidadResenas = computed(() => props.negocio.reseñas?.length || 0)

// ---------- LÓGICA DE ESTADO DE APERTURA MEJORADA ----------
const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null
  const [h, m] = timeStr.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return null
  return h * 60 + m
}

const estadoApertura = computed(() => {
  const horario = props.negocio.horario
  if (!horario) return null

  const now = new Date()
  const diasSemana = [
    'domingo',
    'lunes',
    'martes',
    'miércoles',
    'jueves',
    'viernes',
    'sábado',
  ]
  const hoyIdx = now.getDay() // 0=domingo, 1=lunes, ...
  const nombreHoy = diasSemana[hoyIdx]
  const minutosAhora = now.getHours() * 60 + now.getMinutes()

  // Obtener entrada del día actual (soporta claves en minúscula o capitalizada)
  const entradaHoy =
    horario[nombreHoy] ||
    horario[nombreHoy.charAt(0).toUpperCase() + nombreHoy.slice(1)]

  // Función para buscar el próximo día con apertura
  const buscarProximoAbierto = (desdeDiaIdx) => {
    for (let i = 1; i <= 7; i++) {
      const idx = (desdeDiaIdx + i) % 7
      const nombreDia = diasSemana[idx]
      const entrada =
        horario[nombreDia] ||
        horario[nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1)]
      if (entrada && entrada.abierto && entrada.apertura) {
        const nombreCapitalizado =
          nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1)
        return {
          encontrado: true,
          diaNombre: nombreCapitalizado,
          apertura: entrada.apertura,
          diasHasta: i,
        }
      }
    }
    return { encontrado: false }
  }

  // Caso 1: Hay entrada para hoy y está abierto
  if (entradaHoy && entradaHoy.abierto) {
    const aperturaMin = timeToMinutes(entradaHoy.apertura)
    const cierreMin = timeToMinutes(entradaHoy.cierre)
    if (aperturaMin !== null && cierreMin !== null) {
      if (minutosAhora >= aperturaMin && minutosAhora < cierreMin) {
        return {
          abierto: true,
          mensaje: `Abierto ahora · Cierra a las ${entradaHoy.cierre}`,
        }
      } else if (minutosAhora < aperturaMin) {
        return {
          abierto: false,
          mensaje: `Cerrado ahora · Abre hoy a las ${entradaHoy.apertura}`,
        }
      } else {
        // Ya pasó la hora de cierre, buscar el siguiente día que abra
        const proximo = buscarProximoAbierto(hoyIdx)
        if (proximo.encontrado) {
          if (proximo.diasHasta === 1) {
            return {
              abierto: false,
              mensaje: `Cerrado ahora · Abre mañana a las ${proximo.apertura}`,
            }
          } else {
            return {
              abierto: false,
              mensaje: `Cerrado ahora · Abre el ${proximo.diaNombre} a las ${proximo.apertura}`,
            }
          }
        }
        return { abierto: false, mensaje: 'Cerrado permanentemente' }
      }
    }
  }

  // Caso 2: No hay entrada para hoy o está cerrada explícitamente
  const proximo = buscarProximoAbierto(hoyIdx)
  if (proximo.encontrado) {
    if (proximo.diasHasta === 1) {
      return {
        abierto: false,
        mensaje: `Cerrado ahora · Abre mañana a las ${proximo.apertura}`,
      }
    } else {
      return {
        abierto: false,
        mensaje: `Cerrado ahora · Abre el ${proximo.diaNombre} a las ${proximo.apertura}`,
      }
    }
  }

  return { abierto: false, mensaje: 'Cerrado permanentemente' }
})

onMounted(async () => {
  await configStore.fetchCatalogos()
  cargarImagenes()
})

watch(
  () => props.negocio._id,
  () => {
    cargarImagenes()
  }
)
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
