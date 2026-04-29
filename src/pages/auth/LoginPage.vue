<template>
  <q-page class="flex flex-center bg-grey-2">
    <q-card class="q-pa-md" style="width: 400px; max-width: 90vw">
      <q-card-section class="text-center">
        <h4 class="q-mt-none q-mb-sm">Iniciar Sesión</h4>
        <p class="text-grey">Portal de Eventos Turísticos</p>
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-y-md">
          <q-input
            v-model="email"
            type="email"
            label="Correo electrónico"
            lazy-rules
            :rules="[val => !!val || 'El correo es obligatorio']"
            outlined
          />

          <q-input
            v-model="password"
            type="password"
            label="Contraseña"
            lazy-rules
            :rules="[val => !!val || 'La contraseña es obligatoria']"
            outlined
          />

          <div>
            <q-btn
              type="submit"
              label="Ingresar"
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
          ¿No tienes cuenta?
          <router-link to="/auth/registro">Regístrate</router-link>
        </p>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'

const email = ref('')
const password = ref('')
const authStore = useAuthStore()
const router = useRouter()

async function onSubmit() {
  try {
    await authStore.login(email.value, password.value)
    // Redirigir según rol
    const rol = authStore.rol
    if (rol === 'alcaldia') router.push('/alcaldia')
    else if (rol === 'negocio') router.push('/negocio')
    else router.push('/')  // usuario_final o cualquier otro
  } catch {
    // error ya manejado en store
  }
}
</script>
