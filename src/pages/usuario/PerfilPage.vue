<template>
  <q-page :class="pageClass" class="q-pa-xl">
    <div v-if="!auth.user" class="flex flex-center q-pa-xl">
      <q-spinner-dots color="cyan" size="50px" />
    </div>

    <div v-else class="max-width-container">
      <div class="q-mb-xl">
        <h4 class="text-weight-bold q-ma-none">Ajustes de Cuenta</h4>
        <p :class="paragraphClass">Gestiona tu identidad digital</p>
      </div>

      <div class="row q-col-gutter-xl">
        <div class="col-12 col-md-4">
          <q-card class="bg-grey-10 q-pa-md shadow-2 text-center" style="border-radius: 20px">
            <q-avatar size="120px" class="q-mb-sm">
              <q-img :src="previewUrl || fotoPerfilUrl" />
              <q-btn round color="cyan" icon="edit" size="sm" class="absolute-bottom-right" @click="fileInput.click()" />
            </q-avatar>
            <div class="text-h6 text-white">{{ auth.user.nombres }} {{ auth.user.apellidos }}</div>
            <q-chip :color="rolColor" text-color="white" size="sm">Perfil {{ auth.user.rol }}</q-chip>

            <div v-if="showPhotoActions" class="q-mt-sm q-gutter-sm">
              <q-btn label="Confirmar" color="cyan" text-color="black" @click="confirmPhoto" :loading="photoLoading" size="sm" />
              <q-btn label="Deshacer" outline color="white" @click="undoPhoto" size="sm" />
            </div>

            <q-list dark class="q-mt-md text-left">
              <q-item clickable v-ripple class="rounded-borders" @click="showPwdDialog = true">
                <q-item-section>Cambiar Contraseña</q-item-section>
                <q-item-section side><q-icon name="chevron_right" color="white" /></q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </div>

        <div class="col-12 col-md-8">
          <q-card class="bg-grey-10 q-pa-lg shadow-2" style="border-radius: 20px">
            <q-form @submit="guardarPerfil" class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <label class="text-grey-5 text-caption uppercase">Nombres</label>
                <q-input v-model="nombres" dark filled color="cyan" />
              </div>
              <div class="col-12 col-sm-6">
                <label class="text-grey-5 text-caption uppercase">Apellidos</label>
                <q-input v-model="apellidos" dark filled color="cyan" />
              </div>
              <div class="col-12">
                <label class="text-grey-5 text-caption uppercase">Número de Teléfono</label>
                <q-input v-model="telefono" dark filled color="cyan" mask="+### ####-####" />
              </div>
              
              <div class="col-12 col-sm-6">
                <label class="text-grey-5 text-caption uppercase">Departamento</label>
                <q-select v-model="departamentoInteres" :options="departamentosOptions" dark filled color="cyan" emit-value map-options />
              </div>

              <div class="col-12 row q-col-gutter-md q-mt-lg">
                <div class="col-6">
                  <q-btn label="Guardar" type="submit" color="cyan" text-color="black" class="full-width" rounded :loading="loading" />
                </div>
                <div class="col-6">
                  <q-btn label="Descartar" outline color="white" class="full-width" rounded @click="descartarCambios" />
                </div>
              </div>
            </q-form>
          </q-card>
        </div>
      </div>

      <q-dialog v-model="showPwdDialog" persistent shadow-24>
        <q-card class="bg-grey-10 text-white q-pa-md" style="min-width: 350px; border-radius: 20px; border: 1px solid #333">
          <q-card-section>
            <div class="text-h6 text-cyan">Seguridad</div>
            <div class="text-caption">Actualiza tu clave de acceso</div>
          </q-card-section>

          <q-card-section class="q-gutter-y-md">
            <q-input v-model="pwdForm.old" type="password" label="Contraseña anterior" dark filled color="cyan" />
            <q-input v-model="pwdForm.new" type="password" label="Contraseña nueva" dark filled color="cyan" />
            <q-input v-model="pwdForm.confirm" type="password" label="Reescriba la nueva contraseña" dark filled color="cyan" />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn label="Cancelar" flat v-close-popup @click="resetPwdForm" />
            <q-btn label="Cambiar ahora" color="cyan" text-color="black" @click="confirmarCambioPass" :loading="pwdLoading" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <input ref="fileInput" type="file" accept="image/*" @change="onFileSelected" style="display: none">
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'
import { useConfiguracionStore } from 'src/stores/configuracion'
import { usuariosAPI } from 'src/api/usuarios'
import { couch } from 'src/api/index'

const DB = import.meta.env.VITE_DB_DATA
const dbImages = import.meta.env.VITE_DB_IMAGES

const $q = useQuasar()
const auth = useAuthStore()
const configStore = useConfiguracionStore()

const nombres = ref('')
const apellidos = ref('')
const correo = ref('')
const telefono = ref('')
const departamentoInteres = ref(null)
const loading = ref(false)

const showPwdDialog = ref(false)
const pwdLoading = ref(false)
const pwdForm = ref({ old: '', new: '', confirm: '' })

const fileInput = ref(null)
const selectedFile = ref(null)
const previewUrl = ref(null)
const showPhotoActions = ref(false)
const photoLoading = ref(false)

const resetPwdForm = () => {
  pwdForm.value = { old: '', new: '', confirm: '' }
}

const onFileSelected = (event) => {
  const file = event.target.files[0]
  if (file && file.type.startsWith('image/')) {
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
    }
    selectedFile.value = file
    previewUrl.value = URL.createObjectURL(file)
    showPhotoActions.value = true
  } else {
    $q.notify({ message: 'Selecciona un archivo de imagen válido', color: 'negative' })
  }
}

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = reject
  reader.readAsDataURL(file)
})

const savePhotoFallback = async () => {
  const dataUrl = await fileToDataUrl(selectedFile.value)
  const doc = await couch.get(DB, auth.user._id)
  if (!doc.detalles) doc.detalles = {}
  if (!doc.detalles.detalle_usuario) doc.detalles.detalle_usuario = {}
  doc.detalles.detalle_usuario.foto_perfil = dataUrl
  await couch.put(DB, doc)
  await auth.refreshUser()
  $q.notify({ message: 'Foto de perfil actualizada con éxito', color: 'positive' })
}

const confirmPhoto = async () => {
  if (!selectedFile.value) return
  showPhotoActions.value = false
  photoLoading.value = true
  try {
    const imgDocId = 'usr_' + auth.user._id
    let rev
    try {
      const existing = await couch.get(dbImages, imgDocId)
      rev = existing._rev
    } catch (error) {
      if (error.details && error.details.error === 'not_found') {
        const created = await couch.createImageDoc(imgDocId, 'usuario', auth.user._id)
        rev = created._rev
      } else if (error.message.includes('401')) {
        await savePhotoFallback()
        return
      } else {
        throw error
      }
    }

    try {
      await couch.uploadImage(imgDocId, rev, selectedFile.value)
      const doc = await couch.get(DB, auth.user._id)
      if (!doc.detalles) doc.detalles = {}
      if (!doc.detalles.detalle_usuario) doc.detalles.detalle_usuario = {}
      doc.detalles.detalle_usuario.foto_perfil = selectedFile.value.name
      await couch.put(DB, doc)
      await auth.refreshUser()
      $q.notify({ message: 'Foto de perfil actualizada con éxito', color: 'positive' })
    } catch (uploadError) {
      console.warn('Upload failed, guardando fallback base64:', uploadError)
      if (uploadError.message.includes('401')) {
        await savePhotoFallback()
      } else {
        throw uploadError
      }
    }

    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
    }
    selectedFile.value = null
    previewUrl.value = null
    showPhotoActions.value = false
    if (fileInput.value) fileInput.value.value = ''
  } catch (error) {
    console.error('Error updating photo:', error)
    showPhotoActions.value = true
    $q.notify({ message: `Error al actualizar foto: ${error.message}`, color: 'negative' })
  } finally {
    photoLoading.value = false
  }
}

const undoPhoto = () => {
  selectedFile.value = null
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
  showPhotoActions.value = false
  if (fileInput.value) fileInput.value.value = ''
}

async function confirmarCambioPass() {
  if (!pwdForm.value.old) {
    $q.notify({ message: 'Debe ingresar la contraseña anterior', color: 'negative' })
    return
  }
  if (pwdForm.value.new === pwdForm.value.old) {
    $q.notify({ message: 'La nueva contraseña no puede ser igual a la anterior', color: 'negative' })
    return
  }
  if (pwdForm.value.new !== pwdForm.value.confirm) {
    $q.notify({ message: 'Las contraseñas no coinciden', color: 'negative' })
    return
  }
  
  pwdLoading.value = true
  try {
    await usuariosAPI.updatePassword(auth.user._id, {
      oldPassword: pwdForm.value.old,
      newPassword: pwdForm.value.new
    })
    $q.notify({ message: 'Contraseña cambiada correctamente', color: 'positive', icon: 'lock' })
    showPwdDialog.value = false
    resetPwdForm()
  } catch {
    $q.notify({ message: 'Error: Contraseña actual incorrecta', color: 'negative' })
  } finally {
    pwdLoading.value = false
  }
}

const cargarDatosEnFormulario = () => {
  if (auth.user) {
    nombres.value = auth.user.nombres || ''
    apellidos.value = auth.user.apellidos || ''
    correo.value = auth.user.login?.correo || ''
    telefono.value = auth.user.detalles?.telefono || ''
    departamentoInteres.value = auth.user.detalles?.detalle_usuario?.departamento_interes || null
  }
}

onMounted(async () => {
  if (!auth.user) await auth.refreshUser()
  if (configStore.departamentos.length === 0) await configStore.fetchCatalogos()
  cargarDatosEnFormulario()
})

const departamentosOptions = computed(() => (configStore.departamentos || []).map(d => ({ label: d.nombre, value: d.clave })))

const fotoPerfilUrl = computed(() => {
  const foto = auth.user?.detalles?.detalle_usuario?.foto_perfil
  if (!foto) return 'https://cdn.quasar.dev/img/avatar.png'
  return foto.startsWith('data:') ? foto : couch.getImageUrl('usr_' + auth.user._id, foto)
})
const rolColor = computed(() => auth.rol === 'alcaldia' ? 'orange' : auth.rol === 'negocio' ? 'teal' : 'cyan')
const pageClass = computed(() => $q.dark.isActive ? 'bg-black text-white' : 'bg-white text-dark')
const paragraphClass = computed(() => $q.dark.isActive ? 'text-grey-5' : 'text-grey-8')

const descartarCambios = () => {
  cargarDatosEnFormulario()
  $q.notify({ message: 'Cambios descartados', color: 'info' })
}

async function guardarPerfil() {
  if (!auth.user) return
  loading.value = true
  try {
    const updates = {
      nombres: nombres.value,
      apellidos: apellidos.value,
      detalles: {
        ...auth.user.detalles,
        telefono: telefono.value,
        detalle_usuario: {
          ...auth.user.detalles?.detalle_usuario,
          departamento_interes: departamentoInteres.value
        }
      }
    }
    await usuariosAPI.updateProfile(auth.user._id, updates)
    await auth.refreshUser()
    $q.notify({ message: 'Perfil actualizado', color: 'positive' })
  } catch {
    $q.notify({ message: 'Error al actualizar', color: 'negative' })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.max-width-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 1rem;
}

.bg-grey-10 {
  background: #1d1d1d !important;
}

.rounded-borders {
  border-radius: 12px;
}

@media (max-width: 959px) {
  .max-width-container {
    padding: 0 0.8rem;
  }

  .q-page {
    padding: 1rem !important;
  }
}

@media (max-width: 599px) {
  .row.q-col-gutter-xl {
    flex-direction: column;
  }

  .q-card {
    padding: 1rem !important;
  }
}
</style>