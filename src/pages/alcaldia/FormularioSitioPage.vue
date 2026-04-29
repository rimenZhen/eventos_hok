<!-- src/pages/alcaldia/FormularioSitioPage.vue -->
<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">{{ isEdit ? 'Editar' : 'Crear' }} Sitio Turístico</div>
    <q-form @submit="guardar">
      <q-input v-model="form.nombre" label="Nombre del sitio" outlined />
      <q-input
        v-model="form.descripcion"
        type="textarea"
        label="Descripción"
        outlined
        class="q-mt-sm"
      />
      <q-select
        v-model="form.categoria"
        :options="categoriasOptions"
        label="Categoría"
        outlined
        class="q-mt-sm"
      />
      <q-select
        v-model="form.departamento"
        :options="departamentosOptions"
        label="Departamento"
        outlined
      />
      <q-input v-model="form.municipio" label="Municipio" outlined />
      <q-input v-model="form.direccion" label="Dirección" outlined />
      <q-input
        v-model="form.lat"
        label="Latitud"
        type="number"
        step="any"
        outlined
      />
      <q-input
        v-model="form.lng"
        label="Longitud"
        type="number"
        step="any"
        outlined
      />

      <!-- Horario flexible -->
      <div class="text-h6 q-mt-md q-mb-sm">Horario</div>
      <HorarioSemanal v-model="horario" />

      <q-file
        v-model="portadaFile"
        label="Imagen de portada"
        outlined
        class="q-mt-md"
        accept="image/*"
      />
      <q-btn
        type="submit"
        label="Guardar"
        color="primary"
        class="q-mt-md full-width"
        :loading="saving"
      />
    </q-form>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { useConfiguracionStore } from 'src/stores/configuracion'
import { couch } from 'src/api/index'
import HorarioSemanal from 'src/components/HorarioSemanal.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const configStore = useConfiguracionStore()

const isEdit = computed(() => !!route.params.id)

const form = reactive({
  nombre: '',
  descripcion: '',
  categoria: null,
  departamento: null,
  municipio: '',
  direccion: '',
  lat: 13.7,
  lng: -89.2
})

const horario = ref({}) // se llenará con el componente HorarioSemanal
const portadaFile = ref(null)
const saving = ref(false)

const categoriasOptions = computed(() =>
  configStore.categorias.map(c => ({ label: c.nombre, value: c.clave }))
)
const departamentosOptions = computed(() =>
  configStore.departamentos.map(d => ({ label: d.nombre, value: d.clave }))
)

onMounted(async () => {
  if (configStore.departamentos.length === 0) {
    await configStore.fetchCatalogos()
  }
  if (isEdit.value) {
    try {
      const sitio = await couch.get(import.meta.env.VITE_DB_DATA, route.params.id)
      Object.assign(form, {
        nombre: sitio.nombre,
        descripcion: sitio.descripcion,
        categoria: sitio.categoria,
        departamento: sitio.departamento,
        municipio: sitio.municipio,
        direccion: sitio.localizacion?.direccion || '',
        lat: sitio.localizacion?.lat || 13.7,
        lng: sitio.localizacion?.lng || -89.2
      })
      if (sitio.horario) {
        horario.value = { ...sitio.horario }
      }
    } catch (e) {
      console.error(e)
    }
  }
})

async function guardar() {
  saving.value = true
  try {
    const sitioData = {
      type: 'sitio',
      nombre: form.nombre,
      descripcion: form.descripcion,
      categoria: form.categoria,
      departamento: form.departamento,
      municipio: form.municipio,
      localizacion: {
        lat: form.lat,
        lng: form.lng,
        direccion: form.direccion
      },
      horario: horario.value,
      estado: 'activo',
      alcaldia: {
        _id: auth.user._id,
        nombre_institucional:
          auth.user.detalles?.detalle_alcaldia?.nombre_institucional || '',
        departamento:
          auth.user.detalles?.detalle_alcaldia?.departamento || '',
        municipio:
          auth.user.detalles?.detalle_alcaldia?.municipio || ''
      },
      fecha_creacion: new Date().toISOString()
    }

    let idSitio
    if (isEdit.value) {
      const doc = await couch.get(import.meta.env.VITE_DB_DATA, route.params.id)
      idSitio = doc._id
      Object.assign(doc, sitioData)
      await couch.put(import.meta.env.VITE_DB_DATA, doc)
    } else {
      const response = await couch.post(import.meta.env.VITE_DB_DATA, sitioData)
      idSitio = response.id
    }

    // Manejo de imagen de portada
        if (portadaFile.value) {
      const imgDocId = 'sit_' + idSitio
      let imgDoc
      try {
        // Intentamos obtener el documento de imagen existente
        imgDoc = await couch.get(import.meta.env.VITE_DB_IMAGES, imgDocId)
      } catch {
        // Si no existe, lo creamos (sin attachments todavía)
        imgDoc = await couch.createImageDoc(imgDocId, 'sitio', idSitio)
      }

      // Subir el archivo usando la revisión correcta
      await couch.uploadImage(imgDocId, imgDoc._rev, portadaFile.value)

      // Actualizar el evento guardando el nombre del attachment
      const eventoDoc = await couch.get(import.meta.env.VITE_DB_DATA, idSitio)
      eventoDoc.imagen_portada = portadaFile.value.name
      await couch.put(import.meta.env.VITE_DB_DATA, eventoDoc)
    }

    router.push('/alcaldia/sitios')
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}
</script>
