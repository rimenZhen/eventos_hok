<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Editar Negocio</div>
    <q-form @submit="guardar" v-if="form">
      <q-input v-model="form.nombre_comercial" label="Nombre comercial" outlined />
      <q-input v-model="form.descripcion" type="textarea" label="Descripción" outlined class="q-mt-sm" />
      <q-select v-model="form.categoria" :options="categoriasOptions" label="Categoría" outlined class="q-mt-sm" />
      <q-input v-model="form.telefono" label="Teléfono" outlined />
      <q-input v-model="form.nit_registro" label="NIT" outlined />
      <q-select v-model="form.departamento" :options="departamentosOptions" label="Departamento" outlined />
      <q-input v-model="form.municipio" label="Municipio" outlined />
      <q-input v-model="form.direccion" label="Dirección" outlined />
      <q-input v-model="form.lat" label="Latitud" type="number" step="any" outlined />
      <q-input v-model="form.lng" label="Longitud" type="number" step="any" outlined />

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

const auth = useAuthStore()
const configStore = useConfiguracionStore()
const router = useRouter()
const saving = ref(false)
const portadaFile = ref(null)
const negocioId = ref(null)
const docRev = ref(null)

const form = reactive({
  nombre_comercial: '',
  descripcion: '',
  categoria: null,
  telefono: '',
  nit_registro: '',
  departamento: null,
  municipio: '',
  direccion: '',
  lat: 13.7,
  lng: -89.2
})

const categoriasOptions = computed(() => configStore.categorias?.map(c => ({ label: c.nombre, value: c.clave })) || [])
const departamentosOptions = computed(() => configStore.departamentos?.map(d => ({ label: d.nombre, value: d.clave })) || [])

onMounted(async () => {
  if (configStore.departamentos.length === 0) await configStore.fetchCatalogos()
  try {
    const negocio = await negocioAPI.getMiNegocio(auth.user._id)
    negocioId.value = negocio._id
    docRev.value = negocio._rev
    Object.assign(form, {
      nombre_comercial: negocio.nombre_comercial,
      descripcion: negocio.descripcion || '',
      categoria: negocio.categoria,
      telefono: negocio.telefono || '',
      nit_registro: negocio.nit_registro || '',
      departamento: negocio.departamento,
      municipio: negocio.municipio || '',
      direccion: negocio.localizacion?.direccion || '',
      lat: negocio.localizacion?.lat || 13.7,
      lng: negocio.localizacion?.lng || -89.2
    })
  } catch (e) {
    console.error(e)
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
      municipio: form.municipio,
      localizacion: {
        lat: form.lat,
        lng: form.lng,
        direccion: form.direccion
      }
    }

    // 2. Si hay una nueva imagen seleccionada, asignamos el nombre al campo imagen_portada
    // Esto asegura que se guarde en el documento del negocio
    if (portadaFile.value) {
      updates.imagen_portada = portadaFile.value.name
    }

    // 3. Realizamos una ÚNICA actualización del negocio con todos los campos
    await negocioAPI.updateNegocio(negocioId.value, docRev.value, updates)

    // 4. Si hay un archivo, lo subimos al documento de adjuntos correspondiente
    if (portadaFile.value) {
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

    // Redirigir al perfil para ver los cambios
    router.push('/negocio/perfil')
  } catch (e) {
    console.error('Error al guardar los cambios:', e)
  } finally {
    saving.value = false
  }
}
</script>
