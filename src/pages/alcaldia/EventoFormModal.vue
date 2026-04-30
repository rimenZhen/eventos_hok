<template>
  <q-dialog v-model="dialogVisible" persistent>
    <q-card class="form-modal-card column no-wrap">
      <q-card-section class="bg-primary text-white row items-center q-py-sm">
        <div class="text-h6">{{ isEdit ? 'Editar Evento' : 'Crear Evento' }}</div>
        <q-space />
        <q-btn icon="close" flat dense round v-close-popup />
      </q-card-section>

      <q-tabs
        v-model="tab"
        class="bg-grey-2 text-grey-8"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        narrow-indicator
      >
        <q-tab name="general" label="General" icon="info" />
        <q-tab name="fechas" label="Fechas" icon="event" />
        <q-tab name="ubicacion" label="Ubicación" icon="map" />
        <q-tab name="publicacion" label="Publicación" icon="save" />
      </q-tabs>

      <q-separator />

      <q-card-section class="col scroll q-pa-none">
        <q-tab-panels v-model="tab" animated keep-alive class="full-height">
          <q-tab-panel name="general" class="q-pa-md">
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-input
                  v-model.trim="form.titulo"
                  label="Título del evento *"
                  outlined
                  :error="!!errors.titulo"
                  :error-message="errors.titulo"
                />
              </div>

              <div class="col-12 col-md-6">
                <q-select
                  v-model="form.categoria"
                  :options="categoriasOptions"
                  label="Categoría *"
                  outlined
                  emit-value
                  map-options
                  :error="!!errors.categoria"
                  :error-message="errors.categoria"
                />
              </div>

              <div class="col-12 col-md-6">
                <q-input
                  v-model.number="form.costo"
                  label="Costo (USD)"
                  type="number"
                  step="0.01"
                  min="0"
                  outlined
                  hint="0 = gratuito"
                />
              </div>

              <div class="col-12">
                <q-input
                  v-model.trim="form.descripcion"
                  label="Descripción *"
                  type="textarea"
                  rows="4"
                  outlined
                  :error="!!errors.descripcion"
                  :error-message="errors.descripcion"
                />
              </div>

              <div class="col-12 col-md-6">
                <q-input
                  v-model.trim="form.organizador"
                  label="Organizador *"
                  outlined
                  :error="!!errors.organizador"
                  :error-message="errors.organizador"
                />
              </div>

              <div class="col-12 col-md-6">
                <q-input
                  v-model.trim="form.contacto_organizador"
                  label="Contacto del organizador"
                  outlined
                />
              </div>

              <div class="col-12">
                <q-input
                  v-model.trim="form.enlace_compra"
                  label="Enlace de compra"
                  type="url"
                  outlined
                />
              </div>

              <div class="col-12">
                <div class="text-subtitle1 q-mb-sm">Imagen principal {{ isEdit ? '' : '*' }}</div>
                <q-file
                  v-model="portadaFile"
                  label="Seleccionar imagen"
                  accept="image/*"
                  outlined
                  clearable
                  :error="!!errors.imagen_portada"
                  :error-message="errors.imagen_portada"
                />
                <q-img
                  v-if="previewPortada"
                  :src="previewPortada"
                  class="q-mt-sm rounded-borders"
                  style="width: 150px; height: 100px"
                  fit="cover"
                />
              </div>

              <div class="col-12">
                <div class="text-subtitle1 q-mb-sm">Imágenes adicionales (opcional, hasta 5)</div>
                <q-file
                  v-model="imagenesExtrasFiles"
                  label="Seleccionar imágenes"
                  accept="image/*"
                  multiple
                  outlined
                  clearable
                  counter
                  max-files="5"
                />
                <div class="row q-gutter-sm q-mt-sm">
                  <div v-for="(img, idx) in previewsExtras" :key="idx" class="relative-position">
                    <q-img
                      :src="img"
                      class="rounded-borders"
                      style="width: 70px; height: 70px"
                      fit="cover"
                    />
                    <q-btn
                      round
                      dense
                      color="negative"
                      text-color="white"
                      icon="close"
                      size="xs"
                      class="absolute-top-right"
                      @click="removeExtraImage(idx)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="fechas" class="q-pa-md">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.fecha_inicio"
                  label="Fecha y hora de inicio *"
                  type="datetime-local"
                  outlined
                  :error="!!errors.fecha_inicio"
                  :error-message="errors.fecha_inicio"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.fecha_fin"
                  label="Fecha y hora de fin *"
                  type="datetime-local"
                  outlined
                  :error="!!errors.fecha_fin"
                  :error-message="errors.fecha_fin"
                />
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="ubicacion" class="q-pa-md">
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-select
                  v-model="form.tipo_ubicacion"
                  :options="opcionesUbicacion"
                  label="¿Cómo definir la ubicación?"
                  outlined
                  emit-value
                  map-options
                  :error="!!errors.ubicacion"
                  :error-message="errors.ubicacion"
                />
              </div>

              <div v-if="form.tipo_ubicacion === 'sitio'" class="col-12">
                <q-select
                  v-model="form.sitio_asociado"
                  :options="sitiosDisponibles"
                  label="Sitio turístico"
                  outlined
                  emit-value
                  map-options
                  option-label="nombre"
                  option-value="_id"
                  clearable
                  :error="!!errors.ubicacion"
                  :error-message="errors.ubicacion"
                />
              </div>

              <div v-if="form.tipo_ubicacion === 'coordenadas'" class="col-12">
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model.number="form.lat"
                      label="Latitud"
                      type="number"
                      step="any"
                      outlined
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model.number="form.lng"
                      label="Longitud"
                      type="number"
                      step="any"
                      outlined
                    />
                  </div>
                </div>
              </div>

              <div v-if="form.tipo_ubicacion === 'mapa'" class="col-12">
                <MapLocationPicker
                  :latitude="form.lat"
                  :longitude="form.lng"
                  @update:location="actualizarUbicacion"
                  height="300px"
                />
              </div>

              <div class="col-12 col-md-6">
                <q-input v-model.trim="form.departamento" label="Departamento" outlined />
              </div>
              <div class="col-12 col-md-6">
                <q-input v-model.trim="form.municipio" label="Municipio" outlined />
              </div>
              <div class="col-12">
                <q-input v-model.trim="form.direccion" label="Dirección" outlined />
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="publicacion" class="q-pa-md">
            <div class="q-mb-md">
              <div class="text-h6">Resumen del evento</div>
              <q-list dense bordered class="rounded-borders q-mt-sm">
                <q-item
                  ><q-item-section>Título: {{ form.titulo || '---' }}</q-item-section></q-item
                >
                <q-item
                  ><q-item-section>Categoría: {{ categoriaLabel || '---' }}</q-item-section></q-item
                >
                <q-item>
                  <q-item-section
                    >Fechas: {{ form.fecha_inicio || '---' }} →
                    {{ form.fecha_fin || '---' }}</q-item-section
                  >
                </q-item>
                <q-item
                  ><q-item-section>Ubicación: {{ resumenUbicacion }}</q-item-section></q-item
                >
              </q-list>
            </div>
            <q-toggle v-model="publishNow" label="Publicar inmediatamente" />
            <div class="text-caption text-grey q-mt-sm" v-if="!publishNow">
              Se guardará como borrador.
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>

      <q-separator />
      <q-card-actions align="right" class="bg-white q-pa-md">
        <q-btn flat label="Cancelar" v-close-popup />
        <q-btn @click="guardar" :loading="saving" label="Guardar" color="primary" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { useConfiguracionStore } from 'src/stores/configuracion'
import { couch } from 'src/api/index'
import MapLocationPicker from 'src/components/MapLocationPicker.vue'

const props = defineProps({
  modelValue: Boolean,
  evento: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'saved'])

const auth = useAuthStore()
const configStore = useConfiguracionStore()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})
const isEdit = computed(() => !!props.evento)

const tab = ref('general')
const saving = ref(false)
const publishNow = ref(true)

const form = reactive(getEmptyForm())
const portadaFile = ref(null)
const imagenesExtrasFiles = ref([])
const previewPortada = ref(null)
const previewsExtras = ref([])
const errors = reactive({})
const sitiosDisponibles = ref([])

const categoriasOptions = computed(() =>
  (configStore.categorias || []).map((c) => ({ label: c.nombre, value: c.clave })),
)
const categoriaLabel = computed(() => {
  return categoriasOptions.value.find((c) => c.value === form.categoria)?.label || form.categoria
})
const resumenUbicacion = computed(() => {
  if (form.direccion) return form.direccion
  if (form.departamento || form.municipio) return `${form.departamento} ${form.municipio}`.trim()
  if (form.lat && form.lng) return `${form.lat}, ${form.lng}`
  return '---'
})
const opcionesUbicacion = [
  { label: 'Seleccionar sitio turístico existente', value: 'sitio' },
  { label: 'Ingresar coordenadas manualmente', value: 'coordenadas' },
  { label: 'Seleccionar en el mapa', value: 'mapa' },
]

watch(portadaFile, (file) => {
  previewPortada.value = null
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => (previewPortada.value = e.target.result)
  reader.readAsDataURL(file)
})

watch(imagenesExtrasFiles, (files) => {
  previewsExtras.value = []
  if (!files?.length) return
  files.forEach((file) => {
    const reader = new FileReader()
    reader.onload = (e) => previewsExtras.value.push(e.target.result)
    reader.readAsDataURL(file)
  })
})

watch(
  () => dialogVisible.value,
  async (visible) => {
    if (!visible) return
    await prepararFormulario()
  },
)

async function prepararFormulario() {
  limpiarErrores()
  resetForm()
  tab.value = 'general'

  if ((configStore.categorias || []).length === 0) await configStore.fetchCatalogos()
  await cargarSitios()

  if (props.evento) cargarEvento(props.evento)
}

function getEmptyForm() {
  return {
    titulo: '',
    descripcion: '',
    categoria: null,
    costo: 0,
    organizador: '',
    contacto_organizador: '',
    enlace_compra: '',
    fecha_inicio: '',
    fecha_fin: '',
    tipo_ubicacion: 'mapa',
    sitio_asociado: null,
    lat: null,
    lng: null,
    departamento: '',
    municipio: '',
    direccion: '',
  }
}

function resetForm() {
  Object.assign(form, getEmptyForm())
  portadaFile.value = null
  imagenesExtrasFiles.value = []
  previewPortada.value = null
  previewsExtras.value = []
  publishNow.value = true
}

function cargarEvento(ev) {
  Object.assign(form, {
    titulo: ev.titulo || '',
    descripcion: ev.descripcion || '',
    categoria: typeof ev.categoria === 'object' ? ev.categoria.value : ev.categoria || null,
    costo: ev.costo || 0,
    organizador: ev.organizador || '',
    contacto_organizador: ev.contacto_organizador || '',
    enlace_compra: ev.enlace_compra || '',
    fecha_inicio: ev.fecha_inicio ? ev.fecha_inicio.slice(0, 16) : '',
    fecha_fin: ev.fecha_fin ? ev.fecha_fin.slice(0, 16) : '',
    tipo_ubicacion: ev.localizacion?.lat && ev.localizacion?.lng ? 'mapa' : 'sitio',
    lat: ev.localizacion?.lat || null,
    lng: ev.localizacion?.lng || null,
    departamento: ev.departamento || '',
    municipio: ev.municipio || '',
    direccion: ev.direccion || '',
  })
  previewPortada.value = ev.imagen_portada || null
  publishNow.value = ev.estado === 'activo'
}

async function cargarSitios() {
  try {
    const res = await couch.find(import.meta.env.VITE_DB_DATA, {
      type: 'sitio',
      'alcaldia._id': auth.user._id,
    })
    sitiosDisponibles.value = res.docs || []
  } catch (e) {
    console.error(e)
    sitiosDisponibles.value = []
  }
}

function actualizarUbicacion({ lat, lng }) {
  form.lat = lat
  form.lng = lng
}

function limpiarErrores() {
  Object.keys(errors).forEach((key) => delete errors[key])
}

function validar() {
  limpiarErrores()
  if (!form.titulo) errors.titulo = 'El título es obligatorio'
  if (!form.descripcion) errors.descripcion = 'La descripción es obligatoria'
  if (!form.categoria) errors.categoria = 'Selecciona una categoría'
  if (!form.organizador) errors.organizador = 'El organizador es obligatorio'
  if (!form.fecha_inicio) errors.fecha_inicio = 'La fecha de inicio es obligatoria'
  if (!form.fecha_fin) errors.fecha_fin = 'La fecha de fin es obligatoria'
  if (!portadaFile.value && !previewPortada.value && !isEdit.value)
    errors.imagen_portada = 'Debes seleccionar una imagen principal'
  if (
    form.fecha_inicio &&
    form.fecha_fin &&
    new Date(form.fecha_fin) <= new Date(form.fecha_inicio)
  ) {
    errors.fecha_fin = 'La fecha de fin debe ser posterior a la fecha de inicio'
  }
  if (form.tipo_ubicacion === 'sitio' && !form.sitio_asociado)
    errors.ubicacion = 'Selecciona un sitio'
  if (form.tipo_ubicacion !== 'sitio' && (!form.lat || !form.lng))
    errors.ubicacion = 'Selecciona o ingresa una ubicación'

  return Object.keys(errors).length === 0
}

async function guardar() {
  if (!validar()) return
  saving.value = true
  try {
    const eventoData = {
      type: 'evento',
      titulo: form.titulo,
      descripcion: form.descripcion,
      categoria: form.categoria,
      costo: form.costo || 0,
      organizador: form.organizador,
      contacto_organizador: form.contacto_organizador,
      enlace_compra: form.enlace_compra,
      fecha_inicio: new Date(form.fecha_inicio).toISOString(),
      fecha_fin: new Date(form.fecha_fin).toISOString(),
      departamento: form.departamento,
      municipio: form.municipio,
      direccion: form.direccion,
      localizacion: {},
      estado: publishNow.value ? 'activo' : 'borrador',
      alcaldia: {
        _id: auth.user._id,
        nombre_institucional: auth.user.detalles?.detalle_alcaldia?.nombre_institucional || '',
        departamento: auth.user.detalles?.detalle_alcaldia?.departamento || '',
        municipio: auth.user.detalles?.detalle_alcaldia?.municipio || '',
      },
      fecha_creacion: props.evento?.fecha_creacion || new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString(),
    }

    if (form.tipo_ubicacion === 'sitio' && form.sitio_asociado) {
      const sitio = sitiosDisponibles.value.find((s) => s._id === form.sitio_asociado)
      if (sitio) {
        eventoData.sitio_asociado = form.sitio_asociado
        eventoData.localizacion = sitio.localizacion || {}
        eventoData.departamento = sitio.departamento || ''
        eventoData.municipio = sitio.municipio || ''
        eventoData.direccion = sitio.direccion || ''
      }
    } else {
      eventoData.localizacion = { lat: form.lat, lng: form.lng }
    }

    let idEvento
    if (isEdit.value) {
      const doc = await couch.get(import.meta.env.VITE_DB_DATA, props.evento._id)
      Object.assign(doc, eventoData)
      await couch.put(import.meta.env.VITE_DB_DATA, doc)
      idEvento = doc._id
    } else {
      const response = await couch.post(import.meta.env.VITE_DB_DATA, eventoData)
      idEvento = response.id
    }

    if (portadaFile.value) {
      await couch.uploadEntityImage(
        { _id: idEvento, tipo: 'evento' },
        'imagen_portada',
        portadaFile.value,
      )
    }

    for (const file of imagenesExtrasFiles.value || []) {
      await couch.uploadEntityImage({ _id: idEvento, tipo: 'evento' }, 'imagenes_extra', file)
    }

    emit('saved')
    dialogVisible.value = false
  } catch (err) {
    console.error(err)
  } finally {
    saving.value = false
  }
}

function removeExtraImage(idx) {
  imagenesExtrasFiles.value = imagenesExtrasFiles.value.filter((_, i) => i !== idx)
  previewsExtras.value = previewsExtras.value.filter((_, i) => i !== idx)
}
</script>

<style scoped>
.form-modal-card {
  width: 900px;
  max-width: 95vw;
  height: 90vh;
  max-height: 90vh;
}

@media (max-width: 600px) {
  .form-modal-card {
    width: 100vw;
    max-width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
}
</style>
