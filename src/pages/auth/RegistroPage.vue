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
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'

const authStore = useAuthStore()
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
    contacto: ''
  },
  detalle_alcaldia: {
    nombre_institucional: '',
    telefono: ''
  }
})

async function onSubmit() {
  // Construir objeto detalles según rol
  let detalles = {}
  if (form.rol === 'usuario_final') {
    detalles = { detalle_usuario: {} }
  } else if (form.rol === 'negocio') {
    detalles = {
      detalle_negocio: {
        ...form.detalle_negocio,
        localizacion: { lat: 0, lng: 0, direccion: '' },
        estado_solicitud: 'pendiente'
      }
    }
  } else if (form.rol === 'alcaldia') {
    detalles = {
      detalle_alcaldia: {
        ...form.detalle_alcaldia,
        departamento: '',
        municipio: '',
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
