<template>
  <q-dialog v-model="dialogVisible">
    <q-card class="wizard-card column no-wrap">
      <q-card-section class="wizard-header evento-header row items-center no-wrap">
        <q-icon name="event" size="28px" class="q-mr-md" />
        <div>
          <div class="text-h6 text-weight-bold">
            {{ isEdit ? 'Editar Evento' : 'Crear Evento' }}
          </div>
          <div class="text-caption">Paso {{ currentStep }} de 4: {{ currentStepTitle }}</div>
        </div>
        <q-space />
        <q-btn
          icon="close"
          flat
          dense
          round
          class="close-btn"
          aria-label="Cerrar formulario"
          @click.stop="cerrarFormulario"
        />
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
        <section v-if="currentStep === 1" class="step-content">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-input
                v-model.trim="form.titulo"
                label="Nombre del evento *"
                placeholder="Ej: Festival de la Pupusa 2026"
                outlined
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
                emit-value
                map-options
                :error="!!errors.categoria"
                :error-message="errors.categoria"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                v-model.number="form.costo"
                label="Precio"
                type="number"
                step="0.01"
                min="0"
                outlined
                prefix="$"
                hint="Usa 0.00 si es gratis"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                v-model.trim="form.contacto_organizador"
                label="Contacto"
                placeholder="Teléfono o email"
                outlined
              />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                v-model.trim="form.enlace_compra"
                label="Enlace de compra"
                placeholder="https://ejemplo.com/entradas"
                type="url"
                outlined
              >
                <template #prepend>
                  <q-icon name="link" />
                </template>
              </q-input>
            </div>

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
                  <div class="upload-hint">JPG, PNG, WebP. Máx 2MB</div>
                </template>
              </div>
              <div v-if="errors.imagen_portada" class="text-negative text-caption q-mt-xs">
                {{ errors.imagen_portada }}
              </div>
            </div>

            <div class="col-12">
              <div class="field-label">Imágenes adicionales (opcional)</div>
              <div class="text-caption text-grey-7 q-mb-xs">
                Puedes agregar hasta {{ MAX_EXTRA_IMAGES }} imágenes adicionales. Actualmente:
                {{ previewsExtras.length }}/{{ MAX_EXTRA_IMAGES }}
              </div>

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
                  v-for="(img, idx) in previewsExtras"
                  :key="idx"
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
                  v-if="previewsExtras.length < MAX_EXTRA_IMAGES"
                  class="extra-add"
                  @click="extrasInput?.click()"
                >
                  <q-icon name="add" size="28px" color="grey-6" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section v-if="currentStep === 2" class="step-content">
          <div class="text-subtitle1 text-weight-medium q-mb-md">Fecha y horario del evento</div>
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
        </section>

        <section v-if="currentStep === 3" class="step-content">
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
                label="Asignar a un sitio existente"
                outlined
                emit-value
                map-options
                option-label="nombre"
                option-value="_id"
                clearable
                :error="!!errors.ubicacion"
                :error-message="errors.ubicacion"
                hint="Solo se muestran sitios creados por tu alcaldía"
              />
            </div>

            <div v-if="form.tipo_ubicacion === 'actual'" class="col-12">
              <q-banner rounded class="bg-grey-2 text-grey-9 q-mb-sm">
                Se tomará automáticamente la ubicación actual del dispositivo. El navegador puede
                pedir permiso.
              </q-banner>
              <div v-if="locationLoading" class="text-caption text-primary q-mt-sm">
                Obteniendo ubicación actual...
              </div>
              <div
                v-else-if="form.lat !== null && form.lng !== null"
                class="text-caption text-positive q-mt-sm"
              >
                Ubicación guardada correctamente.
              </div>
            </div>

            <div v-if="form.tipo_ubicacion === 'mapa'" class="col-12 event-map-picker">
              <MapLocationPicker
                :latitude="form.lat"
                :longitude="form.lng"
                @update:location="actualizarUbicacion"
                height="300px"
              />
            </div>

            <div class="col-12">
              <q-select
                v-model="form.distrito"
                :options="distritosOptions"
                label="Distrito donde será el evento *"
                outlined
                emit-value
                map-options
                :disable="form.tipo_ubicacion === 'sitio' || distritosOptions.length === 0"
                :error="!!errors.distrito"
                :error-message="errors.distrito"
                hint="Solo se muestran distritos asociados a tu alcaldía"
              />
            </div>

            <div class="col-12">
              <q-input
                v-model.trim="form.direccion"
                label="Dirección detallada"
                outlined
                :readonly="form.tipo_ubicacion === 'sitio'"
              />
            </div>
          </div>
        </section>

        <section v-if="currentStep === 4" class="step-content">
          <div class="summary-hero evento-summary-hero">
            <div class="summary-hero-content">
              <q-chip dense color="white" text-color="primary" icon="visibility">
                Vista previa de publicación
              </q-chip>
              <div class="summary-title">{{ form.titulo || 'Evento sin nombre' }}</div>
              <div class="summary-description">
                {{
                  form.descripcion ||
                  'Agrega una descripción para que las personas conozcan mejor el evento.'
                }}
              </div>
            </div>

            <q-img v-if="previewPortada" :src="previewPortada" class="summary-cover" fit="cover" />
            <div v-else class="summary-cover summary-cover-empty">
              <q-icon name="image" size="38px" />
              <span>Sin portada</span>
            </div>
          </div>

          <div class="summary-grid q-mt-md">
            <div class="summary-card highlight-card">
              <q-icon name="payments" />
              <div>
                <span>Costo</span>
                <strong>{{ Number(form.costo || 0).toFixed(2) }} USD</strong>
              </div>
            </div>

            <div class="summary-card">
              <q-icon name="category" />
              <div>
                <span>Categoría</span>
                <strong>{{ categoriaSeleccionada?.label || '---' }}</strong>
              </div>
            </div>

            <div class="summary-card">
              <q-icon name="event_available" />
              <div>
                <span>Inicio</span>
                <strong>{{ form.fecha_inicio || '---' }}</strong>
              </div>
            </div>

            <div class="summary-card">
              <q-icon name="event_busy" />
              <div>
                <span>Finaliza</span>
                <strong>{{ form.fecha_fin || '---' }}</strong>
              </div>
            </div>

            <div class="summary-card summary-card-wide">
              <q-icon name="place" />
              <div>
                <span>Ubicación</span>
                <strong>{{ distritoSeleccionado?.nombre || 'Distrito sin seleccionar' }}</strong>
                <small>{{ form.direccion || 'Sin dirección detallada' }}</small>
              </div>
            </div>

            <div class="summary-card summary-card-wide">
              <q-icon name="account_balance" />
              <div>
                <span>Organizador</span>
                <strong>{{ form.organizador || '---' }}</strong>
                <small>{{ form.contacto_organizador || 'Sin contacto registrado' }}</small>
              </div>
            </div>
          </div>

          <q-banner rounded class="publish-banner evento-publish-banner q-mt-md">
            <template #avatar>
              <q-icon name="campaign" />
            </template>
            El evento se publicará automáticamente al guardar. Revisa que la información sea
            correcta antes de confirmar.
          </q-banner>
        </section>
      </q-card-section>

      <q-separator />
      <q-card-actions class="wizard-actions bg-white q-pa-md">
        <q-btn flat label="Cancelar" @click.stop="cerrarFormulario" />
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

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})
const isEdit = computed(() => !!props.evento)

function cerrarFormulario() {
  if (saving.value) return
  dialogVisible.value = false
}

const steps = [
  { number: 1, title: 'Datos básicos' },
  { number: 2, title: 'Fecha y horario' },
  { number: 3, title: 'Ubicación' },
  { number: 4, title: 'Publicación' },
]
const currentStep = ref(1)
const currentStepTitle = computed(
  () => steps.find((step) => step.number === currentStep.value)?.title,
)

const saving = ref(false)
const MAX_EXTRA_IMAGES = 5

const form = reactive(getEmptyForm())
const portadaFile = ref(null)
const portadaInput = ref(null)
const extrasInput = ref(null)
const previewPortada = ref(null)
const previewsExtras = ref([])
const errors = reactive({})
const sitiosDisponibles = ref([])
const locationLoading = ref(false)

const detalleAlcaldia = computed(() => auth.user?.detalles?.detalle_alcaldia || {})

const categoriasOptions = computed(() =>
  (configStore.categoriasEventos || []).map((c) => ({ label: c.nombre, value: c.clave })),
)

const categoriaSeleccionada = computed(() =>
  categoriasOptions.value.find((cat) => cat.value === form.categoria),
)

const distritosOptions = computed(() => {
  const alcaldiaClave = form.municipio || detalleAlcaldia.value.municipio
  if (!alcaldiaClave) return []

  return (configStore.distritos || [])
    .filter((d) => d.activo !== false && d.alcaldia === alcaldiaClave)
    .map((d) => ({ label: d.nombre, value: d.clave }))
})

const distritoSeleccionado = computed(() => {
  const clave = typeof form.distrito === 'object' ? form.distrito?.clave : form.distrito
  const distrito = (configStore.distritos || []).find((d) => d.clave === clave)
  return distrito ? { clave: distrito.clave, nombre: distrito.nombre } : null
})

const opcionesUbicacion = [
  { label: 'Usar mapa', value: 'mapa' },
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

watch(
  () => form.tipo_ubicacion,
  (tipo) => {
    if (tipo !== 'sitio') form.sitio_asociado = null
    if (tipo === 'actual') {
      usarUbicacionActual()
    }
  },
)

watch(
  () => form.sitio_asociado,
  (sitioId) => {
    if (!sitioId || form.tipo_ubicacion !== 'sitio') return
    const sitio = sitiosDisponibles.value.find((s) => s._id === sitioId)
    if (!sitio) return

    form.departamento = sitio.departamento || detalleAlcaldia.value.departamento || ''
    form.municipio = sitio.municipio || detalleAlcaldia.value.municipio || ''
    form.distrito =
      typeof sitio.distrito === 'object' ? sitio.distrito.clave : sitio.distrito || null
    form.direccion = sitio.direccion || sitio.localizacion?.direccion || ''
    form.lat = sitio.localizacion?.lat ?? null
    form.lng = sitio.localizacion?.lng ?? null

    if (form.lat !== null && form.lng !== null) {
      delete errors.ubicacion
      notifyLocationSuccess('La ubicación del sitio fue guardada correctamente')
    } else {
      errors.ubicacion = 'El sitio seleccionado no tiene una ubicación válida'
      notifyLocationError('El sitio seleccionado no tiene una ubicación válida')
    }
  },
)

async function prepararFormulario() {
  limpiarErrores()
  resetForm()
  currentStep.value = 1

  if (
    (configStore.categoriasEventos || []).length === 0 ||
    (configStore.distritos || []).length === 0
  ) {
    await configStore.fetchCatalogos()
  }

  aplicarDatosAlcaldia()
  await cargarSitios()

  if (props.evento) cargarEvento(props.evento)
  aplicarDatosAlcaldia()
}

function aplicarDatosAlcaldia() {
  const detalle = detalleAlcaldia.value
  form.organizador = detalle.nombre_institucional || ''
  form.contacto_organizador = form.contacto_organizador || detalle.telefono || ''
  form.departamento = detalle.departamento || form.departamento || ''
  form.municipio = detalle.municipio || form.municipio || ''
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
    distrito: null,
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
  previewPortada.value = null
  previewsExtras.value = []
  locationLoading.value = false
}

function cargarEvento(ev) {
  Object.assign(form, {
    titulo: ev.titulo || '',
    descripcion: ev.descripcion || '',
    categoria: typeof ev.categoria === 'object' ? ev.categoria.value : ev.categoria || null,
    costo: ev.costo ?? ev.precio ?? 0,
    organizador: ev.organizador || detalleAlcaldia.value.nombre_institucional || '',
    contacto_organizador: ev.contacto_organizador || detalleAlcaldia.value.telefono || '',
    enlace_compra: ev.enlace_compra || '',
    fecha_inicio: ev.fecha_inicio ? ev.fecha_inicio.slice(0, 16) : '',
    fecha_fin: ev.fecha_fin ? ev.fecha_fin.slice(0, 16) : '',
    tipo_ubicacion: ev.sitio_asociado ? 'sitio' : 'mapa',
    sitio_asociado: ev.sitio_asociado || null,
    distrito: typeof ev.distrito === 'object' ? ev.distrito.clave : ev.distrito || null,
    lat: ev.localizacion?.lat ?? null,
    lng: ev.localizacion?.lng ?? null,
    departamento: ev.departamento || '',
    municipio: ev.municipio || '',
    direccion: ev.direccion || ev.localizacion?.direccion || '',
  })

  previewPortada.value = ev.imagen_portada || null
  previewsExtras.value = (ev.imagenes_extra || []).map((name) => ({
    src: name,
    name,
    file: null,
    isNew: false,
  }))
}

async function cargarSitios() {
  try {
    const res = await couch.find(import.meta.env.VITE_DB_DATA, {
      type: 'sitio',
      estado: 'activo',
      'alcaldia._id': auth.user?._id,
    })
    sitiosDisponibles.value = res.docs || []
  } catch (e) {
    console.error(e)
    sitiosDisponibles.value = []
  }
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
  const disponibles = MAX_EXTRA_IMAGES - previewsExtras.value.length
  const seleccionados = nuevos.slice(0, disponibles)

  seleccionados.forEach((file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      previewsExtras.value.push({
        src: e.target.result,
        name: file.name,
        file,
        isNew: true,
      })
    }
    reader.readAsDataURL(file)
  })

  if (extrasInput.value) extrasInput.value.value = ''
}

function removeExtraImage(idx) {
  previewsExtras.value = previewsExtras.value.filter((_, i) => i !== idx)
}

function actualizarUbicacion({ lat, lng, direccion }) {
  form.lat = Number(lat)
  form.lng = Number(lng)
  if (direccion && !form.direccion) form.direccion = direccion
  delete errors.ubicacion
}

function notifyLocationSuccess(message = 'La ubicación ha sido guardada correctamente') {
  $q.notify({
    type: 'positive',
    message,
    timeout: 2200,
  })
}

function notifyLocationError(message = 'No se pudo guardar la ubicación') {
  $q.notify({
    type: 'negative',
    message,
    timeout: 2600,
  })
}

function usarUbicacionActual() {
  if (!navigator.geolocation) {
    errors.ubicacion = 'Tu navegador no permite obtener la ubicación actual'
    notifyLocationError('Tu navegador no permite obtener la ubicación actual')
    return
  }

  locationLoading.value = true

  navigator.geolocation.getCurrentPosition(
    (position) => {
      form.lat = position.coords.latitude
      form.lng = position.coords.longitude
      locationLoading.value = false
      delete errors.ubicacion
      notifyLocationSuccess('La ubicación actual fue guardada correctamente')
    },
    () => {
      locationLoading.value = false
      errors.ubicacion = 'No se pudo obtener la ubicación actual'
      notifyLocationError('No se pudo obtener la ubicación actual')
    },
  )
}

function buildDistritoObject(clave = form.distrito) {
  const distrito = (configStore.distritos || []).find((d) => d.clave === clave)
  return distrito ? { clave: distrito.clave, nombre: distrito.nombre } : null
}

async function actualizarReferenciasImagenes(idEvento, imagenPortada, imagenesExtra) {
  const doc = await couch.get(import.meta.env.VITE_DB_DATA, idEvento)
  if (imagenPortada) doc.imagen_portada = imagenPortada
  doc.imagenes_extra = imagenesExtra
  doc.fecha_actualizacion = new Date().toISOString()
  await couch.put(import.meta.env.VITE_DB_DATA, doc)
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
  if (
    form.fecha_inicio &&
    form.fecha_fin &&
    new Date(form.fecha_fin) <= new Date(form.fecha_inicio)
  ) {
    errors.fecha_fin = 'La fecha de fin debe ser posterior a la fecha de inicio'
  }
}

function validarPaso3() {
  if (form.tipo_ubicacion === 'sitio' && !form.sitio_asociado) {
    errors.ubicacion = 'Selecciona un sitio'
  }
  if (form.tipo_ubicacion !== 'sitio' && !form.distrito) {
    errors.distrito = 'Selecciona el distrito'
  }
  if (form.tipo_ubicacion !== 'sitio' && (form.lat === null || form.lng === null)) {
    errors.ubicacion = 'Selecciona una ubicación en el mapa o usa tu ubicación actual'
  }
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
      organizador: form.organizador,
      contacto_organizador: form.contacto_organizador,
      enlace_compra: form.enlace_compra,
      fecha_inicio: new Date(form.fecha_inicio).toISOString(),
      fecha_fin: new Date(form.fecha_fin).toISOString(),
      departamento: form.departamento,
      municipio: form.municipio,
      distrito: buildDistritoObject(),
      direccion: form.direccion,
      localizacion: {},
      estado: 'activo',
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
        eventoData.localizacion = {
          lat: Number(sitio.localizacion?.lat),
          lng: Number(sitio.localizacion?.lng),
        }
        eventoData.departamento = sitio.departamento || form.departamento
        eventoData.municipio = sitio.municipio || form.municipio
        eventoData.distrito =
          typeof sitio.distrito === 'object'
            ? sitio.distrito
            : buildDistritoObject(sitio.distrito || form.distrito)
        eventoData.direccion = sitio.direccion || sitio.localizacion?.direccion || form.direccion
      }
    } else {
      eventoData.localizacion = { lat: Number(form.lat), lng: Number(form.lng) }
      delete eventoData.sitio_asociado
    }

    let idEvento
    if (isEdit.value) {
      const doc = await couch.get(import.meta.env.VITE_DB_DATA, props.evento._id)
      delete doc.precio
      Object.assign(doc, eventoData)
      await couch.put(import.meta.env.VITE_DB_DATA, doc)
      idEvento = doc._id
    } else {
      const response = await couch.post(import.meta.env.VITE_DB_DATA, eventoData)
      idEvento = response.id
    }

    const imagenPortadaFinal = portadaFile.value
      ? portadaFile.value.name
      : props.evento?.imagen_portada || ''

    if (portadaFile.value) {
      await couch.uploadEntityImage(
        { _id: idEvento, tipo: 'evento' },
        'imagen_portada',
        portadaFile.value,
      )
    }

    const imagenesExtraFinales = []
    for (const img of previewsExtras.value) {
      if (img.isNew && img.file) {
        await couch.uploadEntityImage({ _id: idEvento, tipo: 'evento' }, 'imagenes_extra', img.file)
        imagenesExtraFinales.push(img.file.name)
      } else if (img.name) {
        imagenesExtraFinales.push(img.name)
      }
    }

    await actualizarReferenciasImagenes(idEvento, imagenPortadaFinal, imagenesExtraFinales)

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
.wizard-card {
  width: min(760px, 96vw);
  height: min(92vh, 820px);
  max-height: 92vh;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 24px 70px rgba(31, 58, 94, 0.22);
}

.wizard-header {
  min-height: 92px;
  padding: 22px 26px;
  position: relative;
  overflow: hidden;
}

.wizard-header > * {
  position: relative;
  z-index: 1;
}

.wizard-header::after {
  content: '';
  position: absolute;
  right: -50px;
  top: -70px;
  width: 190px;
  height: 190px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  pointer-events: none;
  z-index: 0;
}

.evento-header {
  background: linear-gradient(135deg, #1769e8 0%, #2f83f6 52%, #64b5ff 100%);
  color: white;
}

.close-btn {
  background: rgba(255, 255, 255, 0.22);
  color: white;
  backdrop-filter: blur(8px);
  cursor: pointer;
}

.progress-wrapper {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 7px;
  padding: 18px 26px 12px;
  background: linear-gradient(180deg, #ffffff 0%, #f7faff 100%);
}

.progress-segment {
  height: 7px;
  border-radius: 999px;
  background: #dfe7f3;
  overflow: hidden;
}

.progress-segment.active {
  background: linear-gradient(90deg, #1769e8, #5bb7ff);
  box-shadow: 0 4px 10px rgba(47, 131, 246, 0.26);
}

.wizard-body {
  flex: 1 1 auto;
  padding: 18px 26px 22px;
  min-height: 0;
  background: #f7f9fd;
}

.step-content {
  animation: fadeIn 0.18s ease-in-out;
}

:deep(.q-field--outlined .q-field__control) {
  border-radius: 14px;
  background: white;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-weight: 700;
  color: #26364a;
  margin-bottom: 8px;
}

.hidden-input {
  display: none;
}

.upload-zone {
  min-height: 155px;
  border: 2px dashed #b9c8dd;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  overflow: hidden;
  background: linear-gradient(135deg, #ffffff 0%, #f4f8ff 100%);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.evento-upload {
  border-color: #3c8cff;
}

.upload-zone:hover {
  transform: translateY(-2px);
  background: #f8fbff;
  box-shadow: 0 12px 28px rgba(47, 131, 246, 0.16);
}

.upload-zone.has-error {
  border-color: #c10015;
}

.upload-preview {
  width: 100%;
  height: 210px;
}

.upload-title {
  color: #2d4059;
  margin-top: 10px;
  font-weight: 700;
}

.upload-hint {
  color: #7e8ca1;
  font-size: 12px;
  margin-top: 6px;
}

.extras-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.extra-add,
.extra-preview {
  width: 124px;
  height: 74px;
  border-radius: 16px;
  overflow: hidden;
}

.extra-preview {
  box-shadow: 0 8px 18px rgba(31, 58, 94, 0.14);
}

.extra-add {
  border: 2px dashed #cbd3df;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #fff;
}

.extra-add:hover {
  border-color: #2f83f6;
  background: #f8fbff;
}

.summary-hero {
  min-height: 220px;
  border-radius: 24px;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1.25fr 0.75fr;
  box-shadow: 0 18px 40px rgba(31, 58, 94, 0.18);
}

.evento-summary-hero {
  background: linear-gradient(135deg, #1769e8, #2f83f6 55%, #76c7ff);
}

.summary-hero-content {
  padding: 24px;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
}

.summary-title {
  font-size: clamp(22px, 4vw, 32px);
  line-height: 1.08;
  font-weight: 900;
}

.summary-description {
  font-size: 14px;
  line-height: 1.55;
  opacity: 0.95;
  display: -webkit-box;
  line-clamp: 4;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.summary-cover {
  min-height: 220px;
  height: 100%;
}

.summary-cover-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.16);
  pointer-events: none;
  z-index: 0;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.summary-card {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 16px;
  border-radius: 18px;
  background: white;
  box-shadow: 0 10px 26px rgba(31, 58, 94, 0.08);
  border: 1px solid #edf1f7;
}

.summary-card-wide {
  grid-column: span 2;
}

.summary-card > .q-icon {
  font-size: 26px;
  color: #2f83f6;
  background: #eaf3ff;
  padding: 8px;
  border-radius: 14px;
}

.summary-card span {
  display: block;
  color: #7c8798;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.summary-card strong {
  display: block;
  color: #223047;
  font-size: 15px;
  margin-top: 2px;
}

.summary-card small {
  display: block;
  color: #748094;
  margin-top: 4px;
  line-height: 1.35;
}

.highlight-card {
  border-color: rgba(47, 131, 246, 0.28);
}

.publish-banner {
  border: 1px solid rgba(47, 131, 246, 0.2);
  font-weight: 600;
}

.evento-publish-banner {
  background: #edf6ff;
  color: #1f4f8f;
}

.wizard-actions {
  flex-wrap: nowrap;
  background: #ffffff;
  box-shadow: 0 -10px 24px rgba(31, 58, 94, 0.07);
}

.evento-btn {
  background: linear-gradient(135deg, #1769e8, #2f83f6);
  color: white;
  border-radius: 12px;
  box-shadow: 0 8px 18px rgba(47, 131, 246, 0.26);
}

.event-map-picker :deep(.q-btn) {
  display: none !important;
}

@media (max-width: 620px) {
  .wizard-card {
    width: 96vw;
    border-radius: 18px;
  }

  .summary-hero,
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .summary-card-wide {
    grid-column: span 1;
  }

  .summary-cover {
    min-height: 160px;
  }

  .wizard-actions {
    gap: 6px;
  }
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
</style>
