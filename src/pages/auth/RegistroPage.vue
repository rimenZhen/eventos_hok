<template>
  <q-page class="flex flex-center bg-grey-2">
    <q-card class="q-pa-md" style="width: 500px; max-width: 90vw">
      <q-card-section class="text-center">
        <h4 class="q-mt-none q-mb-sm">Crear Cuenta</h4>
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-y-md">
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

          <!-- Campos adicionales según rol -->
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
              @update:model-value="handleDepartamentoAlcaldiaChange"
            />
            <q-select
              v-model="form.detalle_alcaldia.distrito"
              :options="distritosOptions"
              label="Distrito"
              outlined
              class="q-mt-sm"
              emit-value
              map-options
              :disable="!form.detalle_alcaldia.departamento"
              @update:model-value="handleDistritoAlcaldiaChange"
            />
            <q-select
              v-model="form.detalle_alcaldia.municipio"
              :options="municipiosOptions"
              label="Municipio"
              outlined
              class="q-mt-sm"
              emit-value
              map-options
              :disable="!form.detalle_alcaldia.distrito"
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
    localizacion: {
      lat: '',
      lng: '',
      direccion: ''
    }
  },
  detalle_alcaldia: {
    nombre_institucional: '',
    telefono: '',
    departamento: null,
    distrito: null,
    municipio: null
  }
})

const gpsLoading = ref(false)
const gpsError = ref('')

const departamentosOptions = computed(() => configStore.getDepartamentosOptions())
const getValue = (value) => {
  if (!value) return null
  if (typeof value === 'object') return value.value || value.clave || null
  return value
}

const distritosOptions = computed(() => configStore.getDistritosByDepartamento(getValue(form.detalle_alcaldia.departamento)))
const municipiosOptions = computed(() => configStore.getMunicipiosByDistrito(getValue(form.detalle_alcaldia.distrito)))

function handleDepartamentoAlcaldiaChange(value) {
  form.detalle_alcaldia.departamento = value
  form.detalle_alcaldia.distrito = null
  form.detalle_alcaldia.municipio = null
}

function handleDistritoAlcaldiaChange(value) {
  form.detalle_alcaldia.distrito = value
  form.detalle_alcaldia.municipio = null
}

onMounted(async () => {
  if (configStore.departamentos.length === 0) {
    await configStore.fetchCatalogos()
  }
})

function usarUbicacionActual() {
  gpsError.value = ''

  if (!navigator.geolocation) {
    gpsError.value = 'Tu navegador no soporta geolocalización.'
    return
  }

  gpsLoading.value = true
  navigator.geolocation.getCurrentPosition(
    (position) => {
      form.detalle_negocio.localizacion.lat = position.coords.latitude
      form.detalle_negocio.localizacion.lng = position.coords.longitude
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

async function onSubmit() {
  if (configStore.departamentos.length === 0) {
    await configStore.fetchCatalogos()
  }

  // Construir objeto detalles según rol
  let detalles = {}
  if (form.rol === 'usuario_final') {
    detalles = { detalle_usuario: {} }
  } else if (form.rol === 'negocio') {
    detalles = {
      detalle_negocio: {
        ...form.detalle_negocio,
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
        ...form.detalle_alcaldia,
        departamento: form.detalle_alcaldia.departamento,
        distrito: form.detalle_alcaldia.distrito,
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
    // error manejado en store
  }
}
</script>
