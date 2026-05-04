<template>
  <q-page class="flex flex-center bg-grey-2">
    <q-card class="q-pa-md" style="width: 500px; max-width: 90vw">
      <q-card-section class="text-center">
        <h4 class="q-mt-none q-mb-sm">Crear Cuenta</h4>
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-y-md">
          <!-- Campos comunes -->
          <q-input
            v-model="form.nombres"
            label="Nombres"
            lazy-rules
            :rules="[val => !!val || 'Campo obligatorio']"
            outlined
          />
          <q-input
            v-model="form.apellidos"
            label="Apellidos"
            lazy-rules
            :rules="[val => !!val || 'Campo obligatorio']"
            outlined
          />
          <q-input
            v-model="form.correo"
            type="email"
            label="Correo electrónico"
            lazy-rules
            :rules="[val => !!val || 'Correo obligatorio']"
            outlined
          />
          <q-input
            v-model="form.password"
            type="password"
            label="Contraseña"
            lazy-rules
            :rules="[val => !!val || 'Contraseña obligatoria']"
            outlined
          />

          <q-select
            v-model="form.rol"
            :options="roles"
            label="Tipo de cuenta"
            outlined
            emit-value
            map-options
            lazy-rules
            :rules="[val => !!val || 'Selecciona un rol']"
          />

          <!-- Negocio -->
          <template v-if="form.rol === 'negocio'">
            <q-input
              v-model="form.detalle_negocio.nombre_comercial"
              label="Nombre comercial"
              lazy-rules
              :rules="[val => !!val || 'Campo obligatorio']"
              outlined
            />
            <q-input
              v-model="form.detalle_negocio.nit_registro"
              label="NIT"
              outlined
            />
            <q-input
              v-model="form.detalle_negocio.contacto"
              label="Teléfono de contacto"
              outlined
            />
            <!-- Nuevo: Departamento -->
            <q-select
              v-model="form.detalle_negocio.departamento"
              :options="departamentosOptions"
              label="Departamento"
              outlined
              emit-value
              map-options
              lazy-rules
              :rules="[val => !!val || 'Selecciona un departamento']"
              @update:model-value="handleDepartamentoNegocioChange"
            />
            <!-- Nuevo: Distrito (filtrado por departamento) -->
            <q-select
              v-model="form.detalle_negocio.distrito"
              :options="negocioDistritosOptions"
              label="Distrito"
              outlined
              emit-value
              map-options
              lazy-rules
              :rules="[val => !!val || 'Selecciona un distrito']"
              :disable="!form.detalle_negocio.departamento || loadingDistritos"
              :loading="loadingDistritos"
            />
            <!-- Ubicación -->
            <q-input
              v-model="form.detalle_negocio.localizacion.lat"
              label="Latitud"
              type="number"
              step="any"
              outlined
            />
            <q-input
              v-model="form.detalle_negocio.localizacion.lng"
              label="Longitud"
              type="number"
              step="any"
              outlined
            />
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
          </template>

          <!-- Alcaldía (sin cambios) -->
          <template v-if="form.rol === 'alcaldia'">
            <q-input
              v-model="form.detalle_alcaldia.nombre_institucional"
              label="Nombre de la Alcaldía"
              lazy-rules
              :rules="[val => !!val || 'Campo obligatorio']"
              outlined
            />
            <q-input
              v-model="form.detalle_alcaldia.telefono"
              label="Teléfono institucional"
              outlined
            />
            <q-select
              v-model="form.detalle_alcaldia.departamento"
              :options="departamentosOptions"
              label="Departamento"
              outlined
              emit-value
              map-options
              lazy-rules
              :rules="[val => !!val || 'Selecciona un departamento']"
              @update:model-value="handleDepartamentoAlcaldiaChange"
            />
            <q-select
              v-model="form.detalle_alcaldia.municipio"
              :options="municipiosOptions"
              label="Municipio"
              outlined
              class="q-mt-sm"
              emit-value
              map-options
              lazy-rules
              :rules="[val => !!val || 'Selecciona un municipio']"
              :disable="!form.detalle_alcaldia.departamento || loadingMunicipios"
              :loading="loadingMunicipios"
              :hint="municipiosOptions.length === 0 && form.detalle_alcaldia.departamento ? 'No hay municipios disponibles' : ''"
            />
          </template>

          <div>
            <q-btn
              type="submit"
              label="Registrarse"
              color="primary"
              class="full-width"
              :loading="authStore.loading"
            />
          </div>

          <div v-if="authStore.error" class="text-red text-center">
            {{ authStore.error }}
          </div>
        </q-form>
      </q-card-section>

      <q-card-section class="text-center">
        <p class="text-grey-7">
          ¿Ya tienes cuenta?
          <router-link to="/auth/login">Inicia sesión</router-link>
        </p>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { useConfiguracionStore } from 'src/stores/configuracion'
import { couch } from 'src/api/index'

const DB = import.meta.env.VITE_DB_DATA

const authStore = useAuthStore()
const configStore = useConfiguracionStore()
const router = useRouter()

const roles = [
  { label: 'Usuario Final', value: 'usuario_final' },
  { label: 'Negocio', value: 'negocio' },
  { label: 'Alcaldía', value: 'alcaldia' }
]

const form = reactive({
  nombres: '',
  apellidos: '',
  correo: '',
  password: '',
  rol: null,
  detalle_negocio: {
    nombre_comercial: '',
    nit_registro: '',
    contacto: '',
    departamento: null,      // nuevo
    distrito: null,          // nuevo
    localizacion: { lat: '', lng: '', direccion: '' }
  },
  detalle_alcaldia: {
    nombre_institucional: '',
    telefono: '',
    departamento: null,
    municipio: null
  }
})

const gpsLoading = ref(false)
const gpsError = ref('')
const registeredMunicipios = ref([])
const loadingMunicipios = ref(false)
const loadingDistritos = ref(false)

// --- Departamentos (común para ambos roles) ---
const departamentosOptions = computed(() => configStore.getDepartamentosOptions())

// --- Funciones auxiliares ---
const getValue = (val) => {
  if (!val) return null
  if (typeof val === 'object') return val.value || val.clave || null
  return val
}

// --- Para alcaldía: municipios (44 alcaldías) filtrados y excluyendo registrados ---
const municipiosOptions = computed(() => {
  const deptoClave = getValue(form.detalle_alcaldia.departamento)
  if (!deptoClave) return []
  return configStore.alcaldias
    .filter(item => item.departamento === deptoClave && item.activo)
    .filter(item => !registeredMunicipios.value.includes(item.clave))
    .map(item => ({ label: item.nombre, value: item.clave }))
})

async function fetchRegisteredAlcaldias() {
  loadingMunicipios.value = true
  try {
    const result = await couch.find(DB, { type: 'usuario', rol: 'alcaldia' })
    registeredMunicipios.value = result.docs
      .map(doc => doc.detalles?.detalle_alcaldia?.municipio)
      .filter(Boolean)
  } catch (err) {
    console.error('Error al obtener alcaldías registradas:', err)
  } finally {
    loadingMunicipios.value = false
  }
}

function handleDepartamentoAlcaldiaChange(value) {
  form.detalle_alcaldia.departamento = value
  form.detalle_alcaldia.municipio = null
}

// --- Para negocio: distritos por departamento (usando mapeo alcaldía) ---
const negocioDistritosOptions = computed(() => {
  const deptoClave = getValue(form.detalle_negocio.departamento)
  if (!deptoClave) return []

  // 1. Obtener todas las alcaldías del departamento
  const alcaldiasDelDepto = configStore.alcaldias
    .filter(a => a.departamento === deptoClave && a.activo)
    .map(a => a.clave)

  // 2. Filtrar distritos: los que tienen departamento_clave (nested) o alcaldia (catálogo separado)
  const distritosFiltrados = configStore.distritos.filter(d => {
    if (d.departamento_clave) {
      return d.departamento_clave === deptoClave
    }
    if (d.alcaldia) {
      return alcaldiasDelDepto.includes(d.alcaldia)
    }
    return false
  })

  // 3. Eliminar duplicados (por clave) y mapear a opciones
  const uniqueMap = new Map()
  distritosFiltrados.forEach(d => {
    if (!uniqueMap.has(d.clave)) {
      uniqueMap.set(d.clave, { label: d.nombre, value: d.clave })
    }
  })
  return Array.from(uniqueMap.values())
})

function handleDepartamentoNegocioChange(value) {
  form.detalle_negocio.departamento = value
  form.detalle_negocio.distrito = null
}

// --- On Mount ---
onMounted(async () => {
  if (configStore.departamentos.length === 0) {
    await configStore.fetchCatalogos()
  }
  await fetchRegisteredAlcaldias()
})

// --- Geolocalización ---
function usarUbicacionActual() {
  gpsError.value = ''
  if (!navigator.geolocation) {
    gpsError.value = 'Tu navegador no soporta geolocalización.'
    return
  }
  gpsLoading.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      form.detalle_negocio.localizacion.lat = pos.coords.latitude
      form.detalle_negocio.localizacion.lng = pos.coords.longitude
      gpsLoading.value = false
    },
    (err) => {
      gpsLoading.value = false
      const mensajes = {
        1: 'Debes permitir el acceso a tu ubicación.',
        2: 'No fue posible obtener tu ubicación actual.',
        3: 'Se agotó el tiempo para obtener tu ubicación.'
      }
      gpsError.value = mensajes[err.code] || 'No se pudo obtener tu ubicación actual.'
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  )
}

// --- Envío del formulario ---
async function onSubmit() {
  if (configStore.departamentos.length === 0) {
    await configStore.fetchCatalogos()
  }

  let detalles = {}
  if (form.rol === 'usuario_final') {
    detalles = { detalle_usuario: {} }
  } else if (form.rol === 'negocio') {
    detalles = {
      detalle_negocio: {
        nombre_comercial: form.detalle_negocio.nombre_comercial,
        nit_registro: form.detalle_negocio.nit_registro,
        contacto: form.detalle_negocio.contacto,
        departamento: form.detalle_negocio.departamento,
        distrito: form.detalle_negocio.distrito,
        localizacion: {
          lat: Number(form.detalle_negocio.localizacion.lat) || 0,
          lng: Number(form.detalle_negocio.localizacion.lng) || 0,
          direccion: form.detalle_negocio.localizacion.direccion || ''
        },
        estado_solicitud: 'pendiente'
      }
    }
  } else if (form.rol === 'alcaldia') {
    detalles = {
      detalle_alcaldia: {
        nombre_institucional: form.detalle_alcaldia.nombre_institucional,
        telefono: form.detalle_alcaldia.telefono,
        departamento: form.detalle_alcaldia.departamento,
        municipio: form.detalle_alcaldia.municipio,
        foto_perfil: ''
      }
    }
  }

  try {
    await authStore.registro({
      nombres: form.nombres,
      apellidos: form.apellidos,
      correo: form.correo,
      password: form.password,
      rol: form.rol,
      detalles
    })
    router.push('/')
  } catch {
    // error manejado en el store
  }
}
</script>
