<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">{{ isEdit ? 'Editar' : 'Crear' }} Evento</div>
    <q-form @submit="guardar">
      <q-input v-model="form.titulo" label="Título" outlined />
      <q-input v-model="form.descripcion" type="textarea" label="Descripción" outlined class="q-mt-sm" />
      <q-select v-model="form.categoria" :options="categoriasOptions" label="Categoría" outlined class="q-mt-sm" />
      <q-select v-model="form.departamento" :options="departamentosOptions" label="Departamento" outlined />
      <q-input v-model="form.municipio" label="Municipio" outlined />
      <q-input v-model="form.direccion" label="Dirección" outlined />
      <q-input v-model="form.fecha_inicio" label="Fecha inicio" type="date" outlined />
      <q-input v-model="form.fecha_fin" label="Fecha fin" type="date" outlined />
      <q-input v-model="form.lat" label="Latitud" type="number" step="any" outlined />
      <q-input v-model="form.lng" label="Longitud" type="number" step="any" outlined />
      <q-file v-model="portadaFile" label="Imagen de portada" outlined class="q-mt-sm" accept="image/*" />
      <q-btn type="submit" label="Guardar" color="primary" class="q-mt-md" :loading="saving" />
    </q-form>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { useConfiguracionStore } from 'src/stores/configuracion'
import { couch } from 'src/api/index'
import { alcaldiaAPI } from 'src/api/alcaldia'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const configStore = useConfiguracionStore()
const isEdit = computed(() => !!route.params.id)
const form = reactive({
  titulo: '', descripcion: '', categoria: null, departamento: null,
  municipio: '', direccion: '', fecha_inicio: '', fecha_fin: '',
  lat: 13.7, lng: -89.2
})
const portadaFile = ref(null)
const saving = ref(false)

const categoriasOptions = computed(() => configStore.categorias.map(c => ({ label: c.nombre, value: c.clave })))
const departamentosOptions = computed(() => configStore.departamentos.map(d => ({ label: d.nombre, value: d.clave })))

onMounted(async () => {
  if (configStore.departamentos.length === 0) await configStore.fetchCatalogos()
  if (isEdit.value) {
    const evento = await couch.get(import.meta.env.VITE_DB_DATA, route.params.id)
    Object.assign(form, {
      titulo: evento.titulo, descripcion: evento.descripcion,
      categoria: evento.categoria, departamento: evento.departamento,
      municipio: evento.municipio, direccion: evento.direccion || '',
      fecha_inicio: evento.fecha_inicio?.substring(0,10),
      fecha_fin: evento.fecha_fin?.substring(0,10),
      lat: evento.localizacion?.lat || 13.7, lng: evento.localizacion?.lng || -89.2
    })
  }
})

async function guardar() {
  saving.value = true
  try {
    const eventoData = {
      type: 'evento',
      titulo: form.titulo, descripcion: form.descripcion,
      categoria: form.categoria, departamento: form.departamento,
      municipio: form.municipio, direccion: form.direccion,
      localizacion: { lat: form.lat, lng: form.lng },
      fecha_inicio: new Date(form.fecha_inicio).toISOString(),
      fecha_fin: new Date(form.fecha_fin).toISOString(),
      estado: 'activo',
      alcaldia: {
        _id: auth.user._id,
        nombre_institucional: auth.user.detalles?.detalle_alcaldia?.nombre_institucional || '',
        departamento: auth.user.detalles?.detalle_alcaldia?.departamento || '',
        municipio: auth.user.detalles?.detalle_alcaldia?.municipio || ''
      },
      fecha_creacion: new Date().toISOString()
    }

    let idEvento
    if (isEdit.value) {
      const doc = await couch.get(import.meta.env.VITE_DB_DATA, route.params.id)
      idEvento = doc._id
      Object.assign(doc, eventoData)
      await couch.put(import.meta.env.VITE_DB_DATA, doc)
    } else {
      const response = await alcaldiaAPI.createEvento(eventoData)
      idEvento = response.id
    }

        if (portadaFile.value) {
      const imgDocId = 'evt_' + idEvento
      let imgDoc
      try {
        // Intentamos obtener el documento de imagen existente
        imgDoc = await couch.get(import.meta.env.VITE_DB_IMAGES, imgDocId)
      } catch {
        // Si no existe, lo creamos (sin attachments todavía)
        imgDoc = await couch.createImageDoc(imgDocId, 'evento', idEvento)
      }

      // Subir el archivo usando la revisión correcta
      await couch.uploadImage(imgDocId, imgDoc._rev, portadaFile.value)

      // Actualizar el evento guardando el nombre del attachment
      const eventoDoc = await couch.get(import.meta.env.VITE_DB_DATA, idEvento)
      eventoDoc.imagen_portada = portadaFile.value.name
      await couch.put(import.meta.env.VITE_DB_DATA, eventoDoc)
    }

    router.push('/alcaldia/eventos')
  } catch (e) { console.error(e) }
  finally { saving.value = false }
}


</script>
