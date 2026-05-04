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

      <q-select
        v-model="form.distrito"
        :options="distritosOptions"
        label="Distrito"
        outlined
        class="q-mt-sm"
        :disable="!form.departamento"
        emit-value
        map-options
        @update:model-value="handleDistritoChange"
      />

      <q-select
        v-model="form.municipio"
        :options="municipiosOptions"
        label="Municipio"
        outlined
        class="q-mt-sm"
        :disable="!form.distrito"
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
import { usuariosAPI } from 'src/api/usuarios'
import { couch } from 'src/api/index'
import HorarioSemanal from 'src/components/HorarioSemanal.vue'

const DB = import.meta.env.VITE_DB_DATA

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
  distrito: null,
  municipio: '',
  direccion: '',
  lat: 13.7,
  lng: -89.2,
  horario: crearHorarioBase()
})

const categoriasOptions = computed(() => configStore.categoriasNegocios?.map(c => ({ label: c.nombre, value: c.clave })) || [])
const departamentosOptions = computed(() => configStore.getDepartamentosOptions())

const getValue = (value) => {
  if (!value) return null
  if (typeof value === 'object') return value.value || value.clave || null
  return value
}

const distritosOptions = computed(() => {
  return configStore.getDistritosByDepartamento(getValue(form.departamento))
})

const municipiosOptions = computed(() => {
  return configStore.getMunicipiosByDistrito(getValue(form.distrito))
})

function handleDepartamentoChange(value) {
  form.departamento = value
  form.distrito = null
  form.municipio = null
}

function handleDistritoChange(value) {
  form.distrito = value
  form.municipio = null
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
    // Intentar obtener el negocio aprobado
    const negocio = await negocioAPI.getMiNegocio(auth.user._id)
    negocioId.value = negocio._id
    docRev.value = negocio._rev
    Object.assign(form, {
      nombre_comercial: negocio.nombre_comercial,
      descripcion: negocio.descripcion || '',
      categoria: negocio.categoria,
      telefono: negocio.telefono || '',
      nit_registro: negocio.nit_registro || '',
      departamento: getValue(negocio.departamento),
      distrito: getValue(negocio.distrito) || getValue(negocio.alcaldia_destino?.distrito),
      municipio: getValue(negocio.municipio) || '',
      direccion: negocio.localizacion?.direccion || '',
      lat: negocio.localizacion?.lat || 13.7,
      lng: negocio.localizacion?.lng || -89.2,
      horario: negocio.horario || crearHorarioBase()
    })
  } catch {
    // Si no existe el negocio aprobado, intenta obtener datos del usuario
    try {
      const usuarioDoc = await couch.get(DB, auth.user._id)
      const detalle = usuarioDoc.detalles?.detalle_negocio
      if (detalle) {
        Object.assign(form, {
          nombre_comercial: detalle.nombre_comercial || '',
          descripcion: detalle.descripcion || '',
          categoria: detalle.categoria || null,
          telefono: detalle.contacto || '',
          nit_registro: detalle.nit_registro || '',
          departamento: getValue(detalle.departamento),
          distrito: getValue(detalle.distrito),
          municipio: getValue(detalle.municipio) || '',
          direccion: detalle.localizacion?.direccion || '',
          lat: detalle.localizacion?.lat || 13.7,
          lng: detalle.localizacion?.lng || -89.2,
          horario: detalle.horario || crearHorarioBase()
        })
      }
    } catch (e2) {
      console.error('Error al cargar datos del usuario:', e2)
    }
  }
})

async function guardar() {
  saving.value = true
  try {
    // 1. Preparamos los datos a actualizar
    const updates = {
      nombre_comercial: form.nombre_comercial,
      descripcion: form.descripcion,
      categoria: form.categoria,
      telefono: form.telefono,
      nit_registro: form.nit_registro,
      departamento: form.departamento,
      distrito: form.distrito,
      municipio: form.municipio,
      horario: form.horario,
      localizacion: {
        lat: form.lat,
        lng: form.lng,
        direccion: form.direccion
      }
    }

    // 2. Si hay una nueva imagen seleccionada, asignamos el nombre al campo imagen_portada
    if (portadaFile.value) {
      updates.imagen_portada = portadaFile.value.name
    }

    // 3. Guardar los cambios
    if (negocioId.value) {
      // Caso: Negocio aprobado (existe documento de negocio)
      await negocioAPI.updateNegocio(negocioId.value, docRev.value, updates)
    } else {
      // Caso: Negocio nuevo (solo existen datos en usuario)
      const usuarioDoc = await couch.get(DB, auth.user._id)
      usuarioDoc.detalles.detalle_negocio = {
        ...usuarioDoc.detalles.detalle_negocio,
        ...updates,
        contacto: form.telefono // Mapear teléfono al campo contacto del usuario
      }
      await couch.put(DB, usuarioDoc)
    }

    // 4. Si hay un archivo, lo subimos al documento de adjuntos correspondiente
    if (portadaFile.value && negocioId.value) {
      const imgDocId = 'neg_' + negocioId.value
      let imgDoc

      try {
        // Intentamos obtener el documento de imagen existente
        imgDoc = await couch.get(import.meta.env.VITE_DB_IMAGES, imgDocId)
      } catch {
        // Si no existe (es la primera vez), lo creamos
        // Nota: Usamos .value porque negocioId es un ref
        imgDoc = await couch.createImageDoc(imgDocId, 'negocio', negocioId.value)
      }

      // Subir el archivo físico a la base de datos de imágenes
      await couch.uploadImage(imgDocId, imgDoc._rev, portadaFile.value)
    }

    // 5. Si el estado es 'sin_solicitud' y ahora tiene municipio, enviar solicitud automáticamente
    if (form.municipio) {
      const usuarioDoc = await couch.get(DB, auth.user._id)
      const estado = usuarioDoc.detalles?.detalle_negocio?.estado_solicitud || 'sin_solicitud'
      
      if (estado === 'sin_solicitud' || estado === 'rechazado') {
        try {
          await usuariosAPI.submitNegocioApprovalRequest(auth.user._id)
          console.log('Solicitud de aprobación enviada automáticamente')
        } catch (e) {
          console.error('Error al enviar solicitud automática:', e)
        }
      }
    }

    router.push('/negocio/perfil')
  } catch (e) {
    console.error('Error al guardar:', e)
  } finally {
    saving.value = false
  }
}
</script>
