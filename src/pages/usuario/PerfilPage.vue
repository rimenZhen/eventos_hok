<template>
  <q-page padding>
    <div v-if="!auth.user" class="flex flex-center q-pa-xl">
      <q-spinner-dots color="primary" size="50px" />
    </div>
    <div v-else>
      <div class="text-h5 q-mb-md">Mi Perfil</div>
      <q-card>
        <q-card-section>
          <div class="row items-center q-mb-md">
            <q-avatar size="100px" class="q-mr-md">
              <q-img :src="fotoPerfilUrl" />
            </q-avatar>
            <div>
              <div class="text-h6">{{ auth.user.nombres }} {{ auth.user.apellidos }}</div>
              <div class="text-subtitle2 text-grey">{{ auth.user.login?.correo }}</div>
              <q-badge :color="rolColor">{{ auth.user.rol }}</q-badge>
            </div>
          </div>
          <q-form @submit="guardarPerfil" class="q-gutter-y-md">
            <q-input v-model="nombres" label="Nombres" outlined />
            <q-input v-model="apellidos" label="Apellidos" outlined />
            <q-select
              v-model="departamentoInteres"
              :options="departamentosOptions"
              label="Departamento de interés"
              clearable
              outlined
            />
            <q-select
              v-model="categoriasFavoritas"
              :options="categoriasOptions"
              label="Categorías favoritas"
              multiple
              use-chips
              outlined
            />
            <q-btn
              type="submit"
              label="Guardar cambios"
              color="primary"
              :loading="loading"
            />
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { useConfiguracionStore } from 'src/stores/configuracion'
import { usuariosAPI } from 'src/api/usuarios'
import { couch } from 'src/api/index'

const auth = useAuthStore()
const configStore = useConfiguracionStore()
const nombres = ref('')
const apellidos = ref('')
const departamentoInteres = ref(null)
const categoriasFavoritas = ref([])
const loading = ref(false)

const departamentosOptions = computed(() =>
  (configStore.departamentos || []).map(d => ({ label: d.nombre, value: d.clave }))
)
const categoriasOptions = computed(() =>
  (configStore.categorias || []).map(c => ({ label: c.nombre, value: c.clave }))
)

const fotoPerfilUrl = computed(() => {
  const user = auth.user
  if (user?.detalles?.detalle_usuario?.foto_perfil) {
    return couch.getImageUrl(
      'usr_' + user._id,
      user.detalles.detalle_usuario.foto_perfil
    )
  }
  return 'https://via.placeholder.com/100'
})

const rolColor = computed(() => {
  switch (auth.rol) {
    case 'alcaldia': return 'orange'
    case 'negocio': return 'teal'
    default: return 'primary'
  }
})

onMounted(async () => {
  if (!auth.user) await auth.refreshUser()
  if (configStore.departamentos.length === 0) {
    await configStore.fetchCatalogos()
  }
  if (auth.user) {
    nombres.value = auth.user.nombres || ''
    apellidos.value = auth.user.apellidos || ''
    departamentoInteres.value =
      auth.user.detalles?.detalle_usuario?.departamento_interes || null
    categoriasFavoritas.value =
      auth.user.detalles?.detalle_usuario?.categorias_favoritas || []
  }
})

async function guardarPerfil() {
  if (!auth.user) return
  loading.value = true
  try {
    const updates = {
      nombres: nombres.value,
      apellidos: apellidos.value,
      detalles: {
        ...auth.user.detalles,
        detalle_usuario: {
          ...auth.user.detalles?.detalle_usuario,
          departamento_interes: departamentoInteres.value,
          categorias_favoritas: categoriasFavoritas.value
        }
      }
    }
    await usuariosAPI.updateProfile(auth.user._id, updates)
    await auth.refreshUser()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>
