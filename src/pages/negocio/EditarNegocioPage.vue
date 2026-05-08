<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Editar Negocio</div>
    <q-form @submit="guardar" v-if="form">
      <q-input v-model="form.nombre_comercial" label="Nombre comercial" outlined />
      <q-input v-model="form.descripcion" type="textarea" label="Descripción" outlined class="q-mt-sm" />
      <q-select v-model="form.categoria" :options="categoriasOptions" label="Categoría" outlined class="q-mt-sm" />
      <q-input v-model="form.telefono" label="Teléfono" outlined />
      <q-input v-model="form.nit_registro" label="NIT" outlined />

      <q-select
        v-model="form.departamento"
        :options="departamentosOptions"
        label="Departamento"
        outlined
        emit-value
        map-options
        @update:model-value="handleDepartamentoChange"
      />

      <!-- Renombrado a Municipio (en realidad selecciona el distrito) -->
      <q-select
        v-model="form.distrito"
        :options="municipioOptions"
        label="Municipio"
        outlined
        class="q-mt-sm"
        :disable="!form.departamento"
        emit-value
        map-options
      />

      <q-input v-model="form.direccion" label="Dirección" outlined />
      <q-input v-model="form.lat" label="Latitud" type="number" step="any" outlined />
      <q-input v-model="form.lng" label="Longitud" type="number" step="any" outlined />
      <q-btn
        label="Usar ubicación actual"
        color="secondary"
        class="full-width"
        outline
        :loading="gpsLoading"
        @click="usarUbicacionActual"
      />
      <div v-if="gpsError" class="text-negative text-caption q-mt-xs">
        {{ gpsError }}
      </div>

      <q-separator class="q-my-lg" />

      <div class="text-subtitle1 text-weight-bold q-mb-sm">Información adicional del negocio</div>

      <HorarioSemanal v-model="form.horario" />

      <q-file v-model="portadaFile" label="Imagen de portada" outlined class="q-mt-sm" accept="image/*" />

      <q-btn type="submit" label="Guardar cambios" color="primary" class="q-mt-md full-width" :loading="saving" />
    </q-form>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { useConfiguracionStore } from 'src/stores/configuracion'
import { negocioAPI } from 'src/api/negocio'
import { couch } from 'src/api/index'
import HorarioSemanal from 'src/components/HorarioSemanal.vue'


const auth = useAuthStore()
const configStore = useConfiguracionStore()
const router = useRouter()
const saving = ref(false)
const portadaFile = ref(null)
const negocioId = ref(null)
const docRev = ref(null)
const gpsLoading = ref(false)
const gpsError = ref('')

function crearHorarioBase() {
  return {
    lunes: { abierto: true, apertura: '08:00', cierre: '17:00' },
    martes: { abierto: true, apertura: '08:00', cierre: '17:00' },
    miércoles: { abierto: true, apertura: '08:00', cierre: '17:00' },
    jueves: { abierto: true, apertura: '08:00', cierre: '17:00' },
    viernes: { abierto: true, apertura: '08:00', cierre: '17:00' },
    sábado: { abierto: true, apertura: '08:00', cierre: '17:00' },
    domingo: { abierto: false, apertura: null, cierre: null },
    cerrado_festivos: false,
    nota: ''
  }
}

const form = reactive({
  nombre_comercial: '',
  descripcion: '',
  categoria: null,
  telefono: '',
  nit_registro: '',
  departamento: null,
  distrito: null,      // ahora solo un campo, clave del distrito
  direccion: '',
  lat: 13.7,
  lng: -89.2,
  horario: crearHorarioBase()
})

const categoriasOptions = computed(() => configStore.categoriasNegocios?.map(c => ({ label: c.nombre, value: c.clave })) || [])
const departamentosOptions = computed(() => configStore.getDepartamentosOptions())

const getValue = (val) => {
  if (!val) return null
  if (typeof val === 'object') return val.value || val.clave || null
  return val
}

// Opciones para el select "Municipio" (distritos filtrados por departamento)
const municipioOptions = computed(() => {
  const deptoClave = getValue(form.departamento)
  if (!deptoClave) return []
  return configStore.getDistritosByDepartamento(deptoClave)
  // getDistritosByDepartamento ya devuelve [{label, value}]
})

function handleDepartamentoChange(value) {
  form.departamento = value
  form.distrito = null
}

/**
 * Busca la clave del distrito a partir de su nombre, dentro de un departamento.
 * (Para negocios antiguos que guardaban el nombre en lugar de la clave)
 */
function findDistritoClaveByNombre(nombre, deptoClave) {
  if (!nombre || !deptoClave) return null
  const distritosDepto = configStore.getDistritosByDepartamento(deptoClave)
  const found = distritosDepto.find(d => d.label.toLowerCase() === nombre.toLowerCase())
  return found ? found.value : null
}

/**
 * Obtiene la clave del departamento a partir de un valor (objeto o string)
 */
function getDepartamentoClave(val) {
  if (!val) return null
  if (typeof val === 'object') return val.value || val.clave || null
  return val
}

function usarUbicacionActual() {
  gpsError.value = ''
  if (!navigator.geolocation) {
    gpsError.value = 'Tu navegador no soporta geolocalización.'
    return
  }
  gpsLoading.value = true
  navigator.geolocation.getCurrentPosition(
    (position) => {
      form.lat = position.coords.latitude
      form.lng = position.coords.longitude
      gpsLoading.value = false
    },
    (error) => {
      gpsLoading.value = false
      if (error.code === error.PERMISSION_DENIED) {
        gpsError.value = 'Debes permitir el acceso a tu ubicación.'
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        gpsError.value = 'No fue posible obtener tu ubicación actual.'
      } else if (error.code === error.TIMEOUT) {
        gpsError.value = 'Se agotó el tiempo para obtener tu ubicación.'
      } else {
        gpsError.value = 'No se pudo obtener tu ubicación actual.'
      }
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  )
}

onMounted(async () => {
  if (configStore.departamentos.length === 0) await configStore.fetchCatalogos()
  try {
    // Intentar cargar negocio existente desde DB_NEGOCIOS
    const negocio = await negocioAPI.getMiNegocio(auth.user._id)
    negocioId.value = negocio._id
    docRev.value = negocio._rev

    // Extraer departamento (puede ser string u objeto)
    const deptoClave = getDepartamentoClave(negocio.departamento)
    // Si el municipio almacenado es un nombre (ej. "El Congo"), convertirlo a clave
    let distritoClave = getValue(negocio.distrito) || getValue(negocio.municipio)
    if (distritoClave && deptoClave) {
      const distritosDepto = configStore.getDistritosByDepartamento(deptoClave)
      const existe = distritosDepto.some(d => d.value === distritoClave)
      if (!existe) {
        // Podría ser un nombre, buscar por nombre
        const clave = findDistritoClaveByNombre(distritoClave, deptoClave)
        distritoClave = clave || null
      }
    }

    Object.assign(form, {
      nombre_comercial: negocio.nombre_comercial,
      descripcion: negocio.descripcion || '',
      categoria: getValue(negocio.categoria),
      telefono: negocio.telefono || '',
      nit_registro: negocio.nit_registro || '',
      departamento: deptoClave,
      distrito: distritoClave,
      direccion: negocio.localizacion?.direccion || '',
      lat: negocio.localizacion?.lat || 13.7,
      lng: negocio.localizacion?.lng || -89.2,
      horario: negocio.horario || crearHorarioBase()
    })
    } catch {
    // Primer negocio: No existe aún en DB_NEGOCIOS
    console.log('Primer negocio - formulario vacío listo para crear')
  }
})

async function guardar() {
  saving.value = true
  try {
    const updates = {
      nombre_comercial: form.nombre_comercial,
      descripcion: form.descripcion,
      categoria: form.categoria,
      telefono: form.telefono,
      nit_registro: form.nit_registro,
      departamento: form.departamento,
      distrito: form.distrito,
      municipio: form.distrito,
      horario: form.horario,
      localizacion: {
        lat: form.lat,
        lng: form.lng,
        direccion: form.direccion
      }
    }

    if (portadaFile.value) {
      updates.imagen_portada = portadaFile.value.name
    }

    if (negocioId.value) {
      // Actualizar negocio existente
      await negocioAPI.updateNegocio(negocioId.value, docRev.value, updates)
    } else {
      // Crear nuevo negocio en DB_NEGOCIOS
      const nuevoNegocio = await negocioAPI.crearNegocio(auth.user._id, updates)
      negocioId.value = nuevoNegocio._id
      docRev.value = nuevoNegocio._rev
    }

    // Subir imagen si existe
    if (portadaFile.value && negocioId.value) {
      const imgDocId = 'neg_' + negocioId.value
      let imgDoc
      try {
        imgDoc = await couch.get(import.meta.env.VITE_DB_IMAGES, imgDocId)
      } catch {
        imgDoc = await couch.createImageDoc(imgDocId, 'negocio', negocioId.value)
      }
      await couch.uploadImage(imgDocId, imgDoc._rev, portadaFile.value)
    }

    router.push('/negocio/perfil')
  } catch (e) {
    console.error('Error al guardar:', e)
  } finally {
    saving.value = false
  }
}
</script>
