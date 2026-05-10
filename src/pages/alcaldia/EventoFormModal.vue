<template>
  <q-dialog v-model="dialogVisible" persistent>
    <q-card class="wizard-card column no-wrap" :class="{ 'dark-mode': $q.dark.isActive }">
      <q-card-section class="wizard-header evento-header row items-center no-wrap">
        <q-icon name="event" size="28px" class="q-mr-md" />
        <div>
          <div class="text-h6 text-weight-bold">
            {{ isEdit ? 'Editar Evento' : 'Crear Evento' }}
          </div>
          <div class="text-caption">Paso {{ currentStep }} de 4: {{ currentStepTitle }}</div>
        </div>
        <q-space />
        <q-btn icon="close" flat dense round class="close-btn" @click="cerrarModal" />
      </q-card-section>

      <div class="progress-wrapper">
        <div
          v-for="step in steps"
          :key="step.number"
          class="progress-segment"
          :class="{ active: step.number <= currentStep }"
        />
      </div>

      <q-card-section class="wizard-body scroll">
        <!-- Paso 1: Datos básicos -->
        <section v-if="currentStep === 1" class="step-content">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-input
                v-model.trim="form.titulo"
                label="Nombre del evento *"
                placeholder="Ej: Festival Cultural"
                outlined
                :dark="$q.dark.isActive"
                :error="!!errors.titulo"
                :error-message="errors.titulo"
              />
            </div>

            <div class="col-12">
              <q-input
                v-model.trim="form.descripcion"
                label="Descripción *"
                placeholder="Describe el evento..."
                type="textarea"
                rows="4"
                outlined
                :dark="$q.dark.isActive"
                :error="!!errors.descripcion"
                :error-message="errors.descripcion"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-select
                v-model="form.categoria"
                :options="categoriasOptions"
                label="Categoría *"
                outlined
                :dark="$q.dark.isActive"
                emit-value
                map-options
                :error="!!errors.categoria"
                :error-message="errors.categoria"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                v-model.number="form.costo"
                label="Costo"
                type="number"
                step="0.01"
                min="0"
                outlined
                :dark="$q.dark.isActive"
                prefix="$"
                hint="Usa 0.00 si es gratis"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                v-model.trim="form.enlace_compra"
                label="Enlace de compra (opcional)"
                placeholder="https://ejemplo.com/entradas"
                type="url"
                outlined
                :dark="$q.dark.isActive"
              >
                <template #prepend>
                  <q-icon name="link" />
                </template>
              </q-input>
            </div>

            <!-- Imagen de portada -->
            <div class="col-12">
              <div class="field-label">
                <q-icon name="photo_camera" />
                Imagen principal {{ isEdit ? '' : '*' }}
              </div>

              <input
                ref="portadaInput"
                type="file"
                accept="image/*"
                class="hidden-input"
                @change="onPortadaSelected"
              />

              <div
                class="upload-zone evento-upload"
                :class="{ 'has-error': !!errors.imagen_portada }"
                @click="portadaInput?.click()"
              >
                <q-img
                  v-if="previewPortada"
                  :src="previewPortada"
                  class="upload-preview"
                  fit="cover"
                />
                <template v-else>
                  <q-icon name="photo_camera" size="46px" color="grey-5" />
                  <div class="upload-title">Click para subir imagen</div>
                  <div class="upload-hint">JPG, PNG o WebP</div>
                </template>
              </div>
              <div v-if="errors.imagen_portada" class="text-negative text-caption q-mt-xs">
                {{ errors.imagen_portada }}
              </div>
            </div>

            <!-- Imágenes adicionales -->
            <div class="col-12">
              <div class="field-label">Imágenes adicionales (opcional)</div>

              <input
                ref="extrasInput"
                type="file"
                accept="image/*"
                multiple
                class="hidden-input"
                @change="onExtrasSelected"
              />

              <div class="extras-row">
                <div
                  v-for="(img, idx) in imagenesExtra"
                  :key="img.id"
                  class="extra-preview relative-position"
                >
                  <q-img :src="img.src" class="fit rounded-borders" fit="cover" />
                  <q-btn
                    round
                    dense
                    color="negative"
                    text-color="white"
                    icon="close"
                    size="xs"
                    class="absolute-top-right"
                    @click.stop="removeExtraImage(idx)"
                  />
                </div>
                <div
                  v-if="imagenesExtra.length < MAX_EXTRA_IMAGES"
                  class="extra-add"
                  @click="extrasInput?.click()"
                >
                  <q-icon name="add" size="28px" color="grey-6" />
                </div>
              </div>
              <div class="text-caption text-grey-7 q-mt-xs">
                {{ imagenesExtra.length }} / {{ MAX_EXTRA_IMAGES }} imágenes adicionales
              </div>
            </div>
          </div>
        </section>

        <!-- Paso 2: Fecha y horario -->
        <section v-if="currentStep === 2" class="step-content">
          <div class="text-subtitle1 text-weight-medium q-mb-md">Fecha y horario del evento</div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.fecha_inicio"
                label="Fecha y hora de inicio *"
                type="datetime-local"
                outlined
                :dark="$q.dark.isActive"
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
                :dark="$q.dark.isActive"
                :error="!!errors.fecha_fin"
                :error-message="errors.fecha_fin"
              />
            </div>
          </div>
        </section>

        <!-- Paso 3: Ubicación y distrito -->
        <section v-if="currentStep === 3" class="step-content">
          <div class="text-subtitle1 text-weight-medium q-mb-md">Ubicación y distrito</div>

          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-select
                v-model="form.tipo_ubicacion"
                :options="opcionesUbicacion"
                label="¿Cómo definir la ubicación?"
                outlined
                :dark="$q.dark.isActive"
                emit-value
                map-options
                :error="!!errors.ubicacion"
                :error-message="errors.ubicacion"
                @update:model-value="onCambioTipoUbicacion"
              />
            </div>

            <!-- Opción: sitio turístico -->
            <div v-if="form.tipo_ubicacion === 'sitio'" class="col-12">
              <q-select
                v-model="form.sitio_asociado"
                :options="sitiosDisponibles"
                label="Sitio turístico existente"
                outlined
                :dark="$q.dark.isActive"
                emit-value
                map-options
                option-label="nombre"
                option-value="_id"
                clearable
                :error="!!errors.ubicacionSitio"
                :error-message="errors.ubicacionSitio"
                @update:model-value="aplicarSitioSeleccionado"
              >
                <template v-if="sitiosDisponibles.length === 0" #no-option>
                  <q-item>
                    <q-item-section class="text-grey-6">
                      No hay sitios disponibles. Crea uno primero.
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <!-- Opción: mapa -->
            <template v-if="form.tipo_ubicacion === 'mapa'">
              <div class="col-12">
                <div class="map-picker-wrapper hide-current-location-btn">
                  <MapLocationPicker
                    :latitude="form.lat"
                    :longitude="form.lng"
                    @update:location="actualizarUbicacion"
                    height="300px"
                  />
                </div>
              </div>
            </template>

            <!-- Opción: ubicación actual -->
            <div v-if="form.tipo_ubicacion === 'actual'" class="col-12">
              <q-banner :class="ubicacionMensaje?.tipo || 'bg-blue-1 text-blue-10'">
                <template #avatar>
                  <q-spinner v-if="ubicacionLoading" color="primary" />
                  <q-icon v-else name="my_location" />
                </template>
                {{
                  ubicacionMensaje?.texto || 'Se solicitará la ubicación actual del dispositivo.'
                }}
              </q-banner>
            </div>

            <!-- Distrito -->
            <div class="col-12 q-mt-md">
              <q-select
                v-model="form.distrito"
                :options="distritosOptions"
                label="Distrito donde será el evento *"
                outlined
                :dark="$q.dark.isActive"
                emit-value
                map-options
                :disable="form.tipo_ubicacion === 'sitio' || distritosOptions.length === 0"
                :error="!!errors.distrito"
                :error-message="errors.distrito"
                hint="Solo se muestran distritos asociados a la alcaldía/municipio del usuario"
              >
                <template v-if="distritosOptions.length === 0" #no-option>
                  <q-item>
                    <q-item-section class="text-grey-6">
                      No se encontraron distritos para esta alcaldía.
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <div class="col-12">
              <q-input
                v-model.trim="form.direccion"
                label="Dirección detallada *"
                outlined
                :dark="$q.dark.isActive"
                :readonly="form.tipo_ubicacion === 'sitio'"
                :error="!!errors.direccion"
                :error-message="errors.direccion"
              />
            </div>
          </div>
        </section>

        <!-- Paso 4: Resumen visual mejorado -->
        <section v-if="currentStep === 4" class="step-content">
          <div class="text-h6 text-weight-bold q-mb-md">Resumen del evento</div>

          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-card flat bordered class="summary-card">
                <q-card-section>
                  <div class="text-subtitle1 text-weight-bold">
                    <q-icon name="event" size="20px" class="q-mr-sm" />
                    {{ form.titulo || '(Sin título)' }}
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-md-6">
              <q-card flat bordered class="summary-card">
                <q-card-section>
                  <div class="text-overline">Categoría</div>
                  <div class="text-body1">{{ categoriaLabel || '---' }}</div>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-md-6">
              <q-card flat bordered class="summary-card">
                <q-card-section>
                  <div class="text-overline">Costo</div>
                  <div class="text-body1">{{ Number(form.costo || 0).toFixed(2) }} USD</div>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12">
              <q-card flat bordered class="summary-card">
                <q-card-section>
                  <div class="text-overline">Fechas</div>
                  <div class="text-body1">
                    {{ form.fecha_inicio || '---' }} →
                    {{ form.fecha_fin || '---' }}
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12">
              <q-card flat bordered class="summary-card">
                <q-card-section>
                  <div class="text-overline">Ubicación</div>
                  <div class="text-body1">
                    {{ distritoSeleccionado?.nombre || '---' }}<br />
                    {{ form.direccion || '---' }}
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12">
              <q-card flat bordered class="summary-card">
                <q-card-section>
                  <div class="text-overline">Descripción</div>
                  <div class="text-body2">
                    {{ form.descripcion || 'Sin descripción' }}
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <div class="text-caption text-grey-7 q-mt-md">
            El evento se publicará automáticamente al guardar.
          </div>
        </section>
      </q-card-section>

      <q-separator />
      <q-card-actions class="wizard-actions q-pa-md">
        <q-btn flat label="Cancelar" class="btn-cancelar-modal" @click="cerrarModal" />
        <q-space />
        <q-btn
          v-if="currentStep > 1"
          flat
          color="grey-8"
          label="Atrás"
          icon="chevron_left"
          @click="prevStep"
        />
        <q-btn
          v-if="currentStep < 4"
          unelevated
          class="evento-btn"
          label="Siguiente"
          icon-right="chevron_right"
          @click="nextStep"
        />
        <q-btn
          v-else
          unelevated
          class="evento-btn"
          :loading="saving"
          :label="isEdit ? 'Guardar cambios' : 'Guardar evento'"
          icon-right="save"
          @click="guardar"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'
import { useConfiguracionStore } from 'src/stores/configuracion'
import { couch } from 'src/api/index'
import MapLocationPicker from 'src/components/MapLocationPicker.vue'

const props = defineProps({
  modelValue: Boolean,
  evento: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'saved'])

const $q = useQuasar()
const auth = useAuthStore()
const configStore = useConfiguracionStore()

const DB = import.meta.env.VITE_DB_DATA
const MAX_EXTRA_IMAGES = 5

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})
const isEdit = computed(() => !!props.evento)

const steps = [
  { number: 1, title: 'Datos básicos' },
  { number: 2, title: 'Fecha y horario' },
  { number: 3, title: 'Ubicación' },
  { number: 4, title: 'Resumen' },
]
const currentStep = ref(1)
const currentStepTitle = computed(
  () => steps.find((step) => step.number === currentStep.value)?.title,
)

const saving = ref(false)
const ubicacionLoading = ref(false)
const ubicacionMensaje = ref(null)
const form = reactive(getEmptyForm())
const portadaFile = ref(null)
const portadaInput = ref(null)
const previewPortada = ref(null)
const extrasInput = ref(null)
const imagenesExtra = ref([])
const errors = reactive({})
const sitiosDisponibles = ref([])
const distritosCatalogo = ref([])

const detalleAlcaldia = computed(() => auth.user?.detalles?.detalle_alcaldia || {})

const categoriasOptions = computed(() =>
  (configStore.categoriasEventos || configStore.categorias || []).map((c) => ({
    label: c.nombre,
    value: c.clave,
  })),
)

const distritosFuente = computed(() =>
  (configStore.distritos || []).length > 0 ? configStore.distritos : distritosCatalogo.value,
)

const distritosOptions = computed(() => {
  const municipioAlcaldia = normalizarTexto(form.municipio || detalleAlcaldia.value.municipio)
  if (!municipioAlcaldia) return []

  return (distritosFuente.value || [])
    .filter((distrito) => {
      if (distrito.activo === false) return false
      const municipioDistrito = normalizarTexto(obtenerMunicipioDistrito(distrito))
      return municipioDistrito === municipioAlcaldia
    })
    .map((distrito) => ({
      label: distrito.nombre,
      value: distrito.clave || distrito.value,
    }))
})

const distritoSeleccionado = computed(() => buildDistritoObject(form.distrito))

const categoriaLabel = computed(() => {
  return categoriasOptions.value.find((c) => c.value === form.categoria)?.label || form.categoria
})

const opcionesUbicacion = [
  { label: 'Seleccionar en el mapa', value: 'mapa' },
  { label: 'Usar mi ubicación actual', value: 'actual' },
  { label: 'Asignar a un sitio existente', value: 'sitio' },
]

watch(
  () => dialogVisible.value,
  async (visible) => {
    if (!visible) return
    await prepararFormulario()
  },
)

function cerrarModal() {
  dialogVisible.value = false
}

async function prepararFormulario() {
  limpiarErrores()
  resetForm()
  currentStep.value = 1
  ubicacionMensaje.value = null
  ubicacionLoading.value = false

  await asegurarCatalogos()
  await cargarSitios()
  aplicarDatosAlcaldia()

  if (props.evento) cargarEvento(props.evento)
}

async function asegurarCatalogos() {
  if (
    (configStore.categoriasEventos || []).length === 0 ||
    (configStore.alcaldias || []).length === 0 ||
    (configStore.distritos || []).length === 0
  ) {
    await configStore.fetchCatalogos()
  }

  if ((configStore.distritos || []).length === 0) {
    await cargarDistritosFallback()
  }
}

async function cargarDistritosFallback() {
  try {
    const result = await couch.find(DB, { type: 'configuracion' }, { limit: 100 })
    const distritosDoc = (result.docs || []).find((doc) => {
      const texto = [doc._id, doc.clave, doc.nombre, doc.descripcion, doc.tipo]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return texto.includes('distrito') || texto.includes('distritos')
    })
    distritosCatalogo.value = distritosDoc?.items?.filter((item) => item.activo !== false) || []
  } catch (error) {
    console.error('No se pudieron cargar distritos:', error)
    distritosCatalogo.value = []
  }
}

async function cargarSitios() {
  try {
    const selector = {
      type: 'sitio',
      'alcaldia._id': auth.user?._id,
      estado: 'activo',
    }
    const res = await couch.find(DB, selector, { limit: 100 })
    sitiosDisponibles.value = res.docs || []
  } catch (e) {
    console.error('No se pudieron cargar sitios:', e)
    sitiosDisponibles.value = []
  }
}

function aplicarDatosAlcaldia() {
  const detalle = detalleAlcaldia.value
  form.departamento = detalle.departamento || ''
  form.municipio = detalle.municipio || ''
  form.organizador = detalle.nombre_institucional || ''
  // El contacto se toma automáticamente, no se muestra en el formulario
}

function getEmptyForm() {
  return {
    titulo: '',
    descripcion: '',
    categoria: null,
    costo: 0,
    enlace_compra: '',
    fecha_inicio: '',
    fecha_fin: '',
    tipo_ubicacion: 'mapa',
    sitio_asociado: null,
    lat: null,
    lng: null,
    departamento: '',
    municipio: '',
    distrito: null,
    direccion: '',
    organizador: '',
  }
}

function resetForm() {
  Object.assign(form, getEmptyForm())
  portadaFile.value = null
  previewPortada.value = null
  imagenesExtra.value = []
}

function cargarEvento(ev) {
  const dep = typeof ev.departamento === 'object' ? ev.departamento.value : ev.departamento
  const mun =
    typeof ev.municipio === 'object' ? ev.municipio.nombre || ev.municipio.value : ev.municipio

  Object.assign(form, {
    titulo: ev.titulo || '',
    descripcion: ev.descripcion || '',
    categoria: typeof ev.categoria === 'object' ? ev.categoria.value : ev.categoria || null,
    costo: ev.costo || 0,
    organizador: ev.organizador || detalleAlcaldia.value.nombre_institucional || '',
    enlace_compra: ev.enlace_compra || '',
    fecha_inicio: ev.fecha_inicio ? ev.fecha_inicio.slice(0, 16) : '',
    fecha_fin: ev.fecha_fin ? ev.fecha_fin.slice(0, 16) : '',
    tipo_ubicacion: ev.sitio_asociado ? 'sitio' : 'mapa',
    sitio_asociado: ev.sitio_asociado || null,
    lat: ev.localizacion?.lat ?? null,
    lng: ev.localizacion?.lng ?? null,
    departamento: dep || detalleAlcaldia.value.departamento || '',
    municipio: mun || detalleAlcaldia.value.municipio || '',
    distrito: obtenerClaveDistrito(ev.distrito),
    direccion: ev.direccion || ev.localizacion?.direccion || '',
  })

  previewPortada.value = ev.imagen_portada
    ? couch.getImageUrl(`evt_${ev._id}`, ev.imagen_portada)
    : null

  imagenesExtra.value = normalizarListaImagenes(ev.imagenes_extra).map((name) => ({
    id: `old-${name}`,
    name,
    src: couch.getImageUrl(`evt_${ev._id}`, name),
    existing: true,
    file: null,
  }))
}

function normalizarListaImagenes(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string') return [value]
  return []
}

function obtenerClaveDistrito(distrito) {
  if (!distrito) return null
  if (typeof distrito === 'string') return distrito
  return distrito.clave || distrito.value || null
}

function normalizarTexto(value) {
  if (!value) return ''
  if (typeof value === 'object') return normalizarTexto(value.clave || value.value || value.nombre)
  return String(value).trim().toUpperCase()
}

function obtenerMunicipioDistrito(distrito) {
  return (
    distrito.alcaldia ||
    distrito.municipio ||
    distrito.municipio_clave ||
    distrito.municipioClave ||
    distrito.codigo_municipio ||
    distrito.codigoMunicipio ||
    ''
  )
}

function buildDistritoObject(clave = form.distrito) {
  if (!clave) return null
  const claveNormalizada = normalizarTexto(clave)
  const distrito = (distritosFuente.value || []).find(
    (item) => normalizarTexto(item.clave || item.value) === claveNormalizada,
  )
  return distrito ? { clave: distrito.clave || distrito.value, nombre: distrito.nombre } : null
}

function onPortadaSelected(event) {
  const file = event.target.files?.[0]
  portadaFile.value = file || null
  previewPortada.value = null
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => (previewPortada.value = e.target.result)
  reader.readAsDataURL(file)
}

function onExtrasSelected(event) {
  const nuevos = Array.from(event.target.files || [])
  const espacioDisponible = MAX_EXTRA_IMAGES - imagenesExtra.value.length
  const seleccionados = nuevos.slice(0, espacioDisponible)

  seleccionados.forEach((file) => {
    const item = {
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      name: file.name,
      src: '',
      existing: false,
      file,
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      item.src = e.target.result
    }
    reader.readAsDataURL(file)
    imagenesExtra.value.push(item)
  })

  if (event.target) event.target.value = ''
}

function removeExtraImage(idx) {
  imagenesExtra.value = imagenesExtra.value.filter((_, i) => i !== idx)
}

function obtenerNombreImagenSubida(response, fallback) {
  return (
    response?.filename || response?.nombre || response?.name || response?.attachmentName || fallback
  )
}

function actualizarUbicacion({ lat, lng }) {
  form.lat = Number(lat)
  form.lng = Number(lng)
}

async function onCambioTipoUbicacion(value) {
  errors.ubicacion = undefined
  errors.ubicacionSitio = undefined
  ubicacionMensaje.value = null

  if (value !== 'sitio') {
    form.sitio_asociado = null
    form.departamento = detalleAlcaldia.value.departamento || form.departamento
    form.municipio = detalleAlcaldia.value.municipio || form.municipio
  }

  if (value === 'actual') {
    await obtenerUbicacionActual()
  }
}

async function obtenerUbicacionActual() {
  ubicacionLoading.value = true
  ubicacionMensaje.value = null

  if (!navigator.geolocation) {
    ubicacionMensaje.value = {
      tipo: 'bg-negative text-white',
      texto: 'Tu navegador no permite obtener la ubicación.',
    }
    ubicacionLoading.value = false
    return
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      form.lat = position.coords.latitude
      form.lng = position.coords.longitude
      ubicacionMensaje.value = {
        tipo: 'bg-positive text-white',
        texto: 'Ubicación obtenida correctamente.',
      }
      ubicacionLoading.value = false
    },
    () => {
      ubicacionMensaje.value = {
        tipo: 'bg-negative text-white',
        texto: 'No se pudo obtener la ubicación.',
      }
      ubicacionLoading.value = false
    },
    { enableHighAccuracy: true, timeout: 10000 },
  )
}

function aplicarSitioSeleccionado(idSitio) {
  const sitio = sitiosDisponibles.value.find((item) => item._id === idSitio)
  if (!sitio) return

  form.departamento = sitio.departamento || detalleAlcaldia.value.departamento || ''
  form.municipio = sitio.municipio || detalleAlcaldia.value.municipio || ''
  form.distrito = obtenerClaveDistrito(sitio.distrito)
  form.direccion = sitio.direccion || sitio.localizacion?.direccion || ''
  form.lat = sitio.localizacion?.lat ?? null
  form.lng = sitio.localizacion?.lng ?? null

  if (form.lat !== null && form.lng !== null) {
    $q.notify({
      type: 'positive',
      message: 'La ubicación del sitio fue guardada correctamente',
    })
  } else {
    $q.notify({
      type: 'negative',
      message: 'El sitio seleccionado no tiene ubicación válida',
    })
  }
}

function limpiarErrores() {
  Object.keys(errors).forEach((key) => delete errors[key])
}

function validarPaso1() {
  if (!form.titulo) errors.titulo = 'El título es obligatorio'
  if (!form.descripcion) errors.descripcion = 'La descripción es obligatoria'
  if (!form.categoria) errors.categoria = 'Selecciona una categoría'
  if (!portadaFile.value && !previewPortada.value && !isEdit.value) {
    errors.imagen_portada = 'Debes seleccionar una imagen principal'
  }
}

function validarPaso2() {
  if (!form.fecha_inicio) errors.fecha_inicio = 'La fecha de inicio es obligatoria'
  if (!form.fecha_fin) errors.fecha_fin = 'La fecha de fin es obligatoria'
  if (form.fecha_inicio && form.fecha_fin && form.fecha_fin <= form.fecha_inicio) {
    errors.fecha_fin = 'La fecha de fin debe ser posterior a la fecha de inicio'
  }
}

function validarPaso3() {
  if (!form.departamento) errors.departamento = 'No se pudo obtener el departamento de la alcaldía'
  if (!form.municipio) errors.municipio = 'No se pudo obtener el municipio de la alcaldía'

  if (form.tipo_ubicacion === 'sitio') {
    if (!form.sitio_asociado) errors.ubicacionSitio = 'Selecciona un sitio'
  } else {
    if (!form.distrito) errors.distrito = 'Selecciona el distrito donde será el evento'
    if (form.lat === null || form.lng === null) {
      errors.ubicacion =
        form.tipo_ubicacion === 'actual'
          ? 'No se pudo obtener la ubicación actual'
          : 'Selecciona una ubicación en el mapa o usa tu ubicación actual'
    }
  }

  if (!form.direccion) errors.direccion = 'Ingresa la dirección detallada'
}

function validarPasoActual() {
  limpiarErrores()
  if (currentStep.value === 1) validarPaso1()
  if (currentStep.value === 2) validarPaso2()
  if (currentStep.value === 3) validarPaso3()
  return Object.keys(errors).length === 0
}

function validarCompleto() {
  limpiarErrores()
  validarPaso1()
  validarPaso2()
  validarPaso3()
  return Object.keys(errors).length === 0
}

function nextStep() {
  if (!validarPasoActual()) return
  currentStep.value = Math.min(currentStep.value + 1, 4)
}

function prevStep() {
  limpiarErrores()
  currentStep.value = Math.max(currentStep.value - 1, 1)
}

function toStoredDateTime(value) {
  if (!value) return ''
  return value.length === 16 ? `${value}:00` : value
}

async function guardar() {
  if (!validarCompleto()) return
  saving.value = true

  try {
    const eventoData = {
      type: 'evento',
      titulo: form.titulo,
      descripcion: form.descripcion,
      categoria: form.categoria,
      costo: form.costo || 0,
      organizador: detalleAlcaldia.value.nombre_institucional || form.organizador,
      contacto_organizador: detalleAlcaldia.value.telefono || '', // implícito
      enlace_compra: form.enlace_compra,
      fecha_inicio: toStoredDateTime(form.fecha_inicio),
      fecha_fin: toStoredDateTime(form.fecha_fin),
      departamento: form.departamento,
      municipio: form.municipio,
      distrito: buildDistritoObject(form.distrito),
      direccion: form.direccion,
      localizacion: { lat: Number(form.lat), lng: Number(form.lng) },
      estado: 'activo',
      alcaldia: {
        _id: auth.user._id,
        nombre_institucional: detalleAlcaldia.value.nombre_institucional || '',
        departamento: detalleAlcaldia.value.departamento || '',
        municipio: detalleAlcaldia.value.municipio || '',
      },
      fecha_creacion: props.evento?.fecha_creacion || new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString(),
    }

    if (form.tipo_ubicacion === 'sitio' && form.sitio_asociado) {
      const sitio = sitiosDisponibles.value.find((item) => item._id === form.sitio_asociado)
      if (sitio) {
        eventoData.sitio_asociado = form.sitio_asociado
        eventoData.departamento = sitio.departamento || eventoData.departamento
        eventoData.municipio = sitio.municipio || eventoData.municipio
        eventoData.distrito =
          typeof sitio.distrito === 'object'
            ? { clave: sitio.distrito.clave, nombre: sitio.distrito.nombre }
            : buildDistritoObject(sitio.distrito)
        eventoData.direccion = sitio.direccion || sitio.localizacion?.direccion || ''
        eventoData.localizacion = {
          lat: Number(sitio.localizacion?.lat),
          lng: Number(sitio.localizacion?.lng),
        }
      }
    }

    let idEvento
    if (isEdit.value) {
      const doc = await couch.get(DB, props.evento._id)
      Object.assign(doc, eventoData)
      if (form.tipo_ubicacion !== 'sitio') delete doc.sitio_asociado
      await couch.put(DB, doc)
      idEvento = doc._id
    } else {
      const response = await couch.post(DB, eventoData)
      idEvento = response.id
    }

    if (portadaFile.value) {
      await couch.uploadEntityImage(
        { _id: idEvento, tipo: 'evento' },
        'imagen_portada',
        portadaFile.value,
      )
    }

    const imagenesExtraNombres = imagenesExtra.value
      .filter((img) => img.existing && img.name)
      .map((img) => img.name)
    const nuevasImagenes = imagenesExtra.value.filter((img) => !img.existing && img.file)

    for (const img of nuevasImagenes) {
      const response = await couch.uploadEntityImage(
        { _id: idEvento, tipo: 'evento' },
        'imagenes_extra',
        img.file,
      )
      imagenesExtraNombres.push(obtenerNombreImagenSubida(response, img.name))
    }

    const docFinal = await couch.get(DB, idEvento)
    docFinal.imagenes_extra = imagenesExtraNombres
    await couch.put(DB, docFinal)

    emit('saved')
    dialogVisible.value = false
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'No se pudo guardar el evento' })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.wizard-card {
  width: min(720px, 94vw);
  height: min(92vh, 780px);
  max-height: 92vh;
  border-radius: 14px;
  overflow: hidden;
}

.wizard-header {
  min-height: 78px;
  padding: 18px 24px;
}

.evento-header {
  background: #2f83f6;
  color: white;
}

.close-btn {
  background: rgba(255, 255, 255, 0.22);
  color: white;
}

.progress-wrapper {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 5px;
  padding: 16px 24px 10px;
  background: white;
}

.progress-segment {
  height: 5px;
  border-radius: 999px;
  background: #e1e5eb;
}

.progress-segment.active {
  background: #2f83f6;
}

.wizard-body {
  flex: 1 1 auto;
  padding: 14px 24px 18px;
  min-height: 0;
}

.step-content {
  animation: fadeIn 0.15s ease-in-out;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;
  color: #26364a;
  margin-bottom: 8px;
}

.hidden-input {
  display: none;
}

.upload-zone {
  min-height: 145px;
  border: 2px dashed #cbd3df;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  overflow: hidden;
  background: #fff;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}

.evento-upload:hover,
.extra-add:hover {
  border-color: #2f83f6;
  background: #f8fbff;
}

.upload-zone.has-error {
  border-color: #c10015;
}

.upload-preview {
  width: 100%;
  height: 185px;
}

.upload-title {
  color: #7b8495;
  margin-top: 10px;
}

.upload-hint {
  color: #9aa4b4;
  font-size: 12px;
  margin-top: 6px;
}

.extras-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.extra-add,
.extra-preview {
  width: 116px;
  height: 66px;
  border-radius: 12px;
}

.extra-add {
  border: 2px dashed #cbd3df;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #fff;
}

.map-picker-wrapper {
  position: relative;
}

/*
  El formulario de evento ya tiene "Usar mi ubicación actual" dentro del
  selector de tipo de ubicación. Por eso se oculta cualquier botón interno
  del mapa que intente hacer la misma acción y cause duplicados.
*/
.hide-current-location-btn :deep(.my-location-btn),
.hide-current-location-btn :deep(.current-location-btn),
.hide-current-location-btn :deep(.location-button),
.hide-current-location-btn :deep(.leaflet-control-locate),
.hide-current-location-btn :deep(.q-btn),
.hide-current-location-btn :deep(button),
.hide-current-location-btn :deep([aria-label*='ubicación' i]),
.hide-current-location-btn :deep([aria-label*='location' i]),
.hide-current-location-btn :deep([title*='ubicación' i]),
.hide-current-location-btn :deep([title*='location' i]) {
  display: none !important;
}

.wizard-actions {
  flex-wrap: nowrap;
  background: white;
}

.evento-btn {
  background: #2f83f6;
  color: white;
}

.btn-cancelar-modal {
  color: #374151;
  font-weight: 600;
}

/* Resumen */
.summary-card {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}

/* Modo oscuro */
.dark-mode .progress-wrapper {
  background: #1e1e1e;
}

.dark-mode .progress-segment {
  background: #555;
}

.dark-mode .progress-segment.active {
  background: #2f83f6;
}

.dark-mode .field-label {
  color: #ddd;
}

.dark-mode .upload-zone {
  background: #2b2b2b;
  border-color: #555;
}

.dark-mode .evento-upload:hover,
.dark-mode .extra-add:hover {
  background: #333;
  border-color: #2f83f6;
}

.dark-mode .upload-title {
  color: #aaa;
}

.dark-mode .upload-hint {
  color: #888;
}

.dark-mode .extra-add {
  background: #2b2b2b;
  border-color: #555;
}

.dark-mode .wizard-actions {
  background: #1e1e1e;
}

.dark-mode .btn-cancelar-modal {
  color: #f9fafb;
}

.dark-mode .summary-card {
  background: rgba(255, 255, 255, 0.03);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 600px) {
  .wizard-card {
    width: 100vw;
    max-width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }

  .wizard-header,
  .progress-wrapper,
  .wizard-body {
    padding-left: 18px;
    padding-right: 18px;
  }
}
</style>
