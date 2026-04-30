<template>
  <q-dialog v-model="dialogVisible" persistent>
    <q-card class="form-modal-card column no-wrap">
      <q-card-section class="bg-primary text-white row items-center q-py-sm">
        <div class="text-h6">{{ isEdit ? 'Editar Sitio' : 'Crear Sitio' }}</div>
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
        <q-tab name="horarios" label="Horarios" icon="schedule" />
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
                  v-model.trim="form.nombre"
                  label="Nombre del sitio *"
                  outlined
                  :error="!!errors.nombre"
                  :error-message="errors.nombre"
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
                  v-model.number="form.precio_entrada"
                  label="Precio de entrada (USD)"
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
            </div>
          </q-tab-panel>

          <q-tab-panel name="horarios" class="q-pa-md">
            <q-list bordered separator class="rounded-borders">
              <q-item v-for="dia in diasSemana" :key="dia" class="q-py-md horario-item">
                <q-item-section class="dia-section">
                  <q-item-label class="text-weight-medium">{{ dia }}</q-item-label>
                </q-item-section>

                <q-item-section>
                  <div class="row q-col-gutter-sm items-center">
                    <div class="col-12 col-sm-auto">
                      <q-toggle v-model="form.horario[dia].cerrado" label="Cerrado" />
                    </div>
                    <template v-if="!form.horario[dia].cerrado">
                      <div class="col-6 col-sm-auto">
                        <q-input
                          v-model="form.horario[dia].apertura"
                          label="Apertura"
                          type="time"
                          dense
                          outlined
                          class="hora-input"
                        />
                      </div>
                      <div class="col-6 col-sm-auto">
                        <q-input
                          v-model="form.horario[dia].cierre"
                          label="Cierre"
                          type="time"
                          dense
                          outlined
                          class="hora-input"
                        />
                      </div>
                    </template>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>

          <q-tab-panel name="ubicacion" class="q-pa-md">
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <MapLocationPicker
                  :latitude="form.lat"
                  :longitude="form.lng"
                  @update:location="actualizarUbicacion"
                  height="300px"
                />
                <div v-if="errors.ubicacion" class="text-negative text-caption q-mt-xs">
                  {{ errors.ubicacion }}
                </div>
              </div>

              <div class="col-12 col-md-6">
                <q-input v-model.trim="form.departamento" label="Departamento" outlined />
              </div>
              <div class="col-12 col-md-6">
                <q-input v-model.trim="form.municipio" label="Municipio" outlined />
              </div>
              <div class="col-12">
                <q-input v-model.trim="form.direccion" label="Dirección detallada" outlined />
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="publicacion" class="q-pa-md">
            <div class="q-mb-md">
              <div class="text-h6">Resumen del sitio</div>
              <q-list dense bordered class="rounded-borders q-mt-sm">
                <q-item
                  ><q-item-section>Nombre: {{ form.nombre || '---' }}</q-item-section></q-item
                >
                <q-item
                  ><q-item-section>Categoría: {{ categoriaLabel || '---' }}</q-item-section></q-item
                >
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
  sitio: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'saved'])

const auth = useAuthStore()
const configStore = useConfiguracionStore()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})
const isEdit = computed(() => !!props.sitio)

const tab = ref('general')
const saving = ref(false)
const publishNow = ref(true)
const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const form = reactive(getEmptyForm())
const portadaFile = ref(null)
const previewPortada = ref(null)
const errors = reactive({})

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

watch(portadaFile, (file) => {
  previewPortada.value = null
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => (previewPortada.value = e.target.result)
  reader.readAsDataURL(file)
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

  if (props.sitio) cargarSitio(props.sitio)
  inicializarHorario()
}

function getEmptyForm() {
  return {
    nombre: '',
    categoria: null,
    descripcion: '',
    precio_entrada: 0,
    lat: null,
    lng: null,
    departamento: '',
    municipio: '',
    direccion: '',
    horario: {},
  }
}

function resetForm() {
  Object.assign(form, getEmptyForm())
  portadaFile.value = null
  previewPortada.value = null
  publishNow.value = true
  inicializarHorario()
}

function inicializarHorario() {
  diasSemana.forEach((dia) => {
    if (!form.horario[dia]) {
      form.horario[dia] = { apertura: '09:00', cierre: '18:00', cerrado: false }
    }
  })
}

function cargarSitio(s) {
  Object.assign(form, {
    nombre: s.nombre || '',
    categoria: typeof s.categoria === 'object' ? s.categoria.value : s.categoria || null,
    descripcion: s.descripcion || '',
    precio_entrada: s.precio_entrada || 0,
    lat: s.localizacion?.lat || null,
    lng: s.localizacion?.lng || null,
    departamento: s.departamento || '',
    municipio: s.municipio || '',
    direccion: s.direccion || '',
    horario: s.horario ? { ...s.horario } : {},
  })
  previewPortada.value = s.imagen_portada || null
  publishNow.value = s.estado === 'activo'
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
  if (!form.nombre) errors.nombre = 'El nombre es obligatorio'
  if (!form.categoria) errors.categoria = 'Selecciona una categoría'
  if (!form.descripcion) errors.descripcion = 'La descripción es obligatoria'
  if (!portadaFile.value && !previewPortada.value && !isEdit.value)
    errors.imagen_portada = 'Debes seleccionar una imagen principal'
  if (!form.lat || !form.lng) errors.ubicacion = 'Selecciona una ubicación en el mapa'

  return Object.keys(errors).length === 0
}

async function guardar() {
  if (!validar()) return
  saving.value = true
  try {
    const sitioData = {
      type: 'sitio',
      nombre: form.nombre,
      categoria: form.categoria,
      descripcion: form.descripcion,
      precio_entrada: form.precio_entrada || 0,
      localizacion: { lat: form.lat, lng: form.lng },
      departamento: form.departamento,
      municipio: form.municipio,
      direccion: form.direccion,
      horario: form.horario,
      estado: publishNow.value ? 'activo' : 'borrador',
      alcaldia: {
        _id: auth.user._id,
        nombre_institucional: auth.user.detalles?.detalle_alcaldia?.nombre_institucional || '',
        departamento: auth.user.detalles?.detalle_alcaldia?.departamento || '',
        municipio: auth.user.detalles?.detalle_alcaldia?.municipio || '',
      },
      fecha_creacion: props.sitio?.fecha_creacion || new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString(),
    }

    let idSitio
    if (isEdit.value) {
      const doc = await couch.get(import.meta.env.VITE_DB_DATA, props.sitio._id)
      Object.assign(doc, sitioData)
      await couch.put(import.meta.env.VITE_DB_DATA, doc)
      idSitio = doc._id
    } else {
      const response = await couch.post(import.meta.env.VITE_DB_DATA, sitioData)
      idSitio = response.id
    }

    if (portadaFile.value) {
      await couch.uploadEntityImage(
        { _id: idSitio, tipo: 'sitio' },
        'imagen_portada',
        portadaFile.value,
      )
    }

    emit('saved')
    dialogVisible.value = false
  } catch (err) {
    console.error(err)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.form-modal-card {
  width: 900px;
  max-width: 95vw;
  height: 90vh;
  max-height: 90vh;
}

.horario-item {
  flex-wrap: wrap;
}

.dia-section {
  max-width: 130px;
}

.hora-input {
  width: 125px;
}

@media (max-width: 600px) {
  .form-modal-card {
    width: 100vw;
    max-width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }

  .dia-section {
    max-width: none;
    flex-basis: 100%;
    margin-bottom: 8px;
  }

  .hora-input {
    width: 100%;
  }
}
</style>
