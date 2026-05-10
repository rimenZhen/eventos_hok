<template>
  <q-dialog v-model="dialogVisible" persistent>
    <q-card class="wizard-card column no-wrap" :class="{ 'dark-mode': $q.dark.isActive }">
      <q-card-section class="wizard-header sitio-header row items-center no-wrap">
        <q-icon name="place" size="28px" class="q-mr-md" />
        <div>
          <div class="text-h6 text-weight-bold">
            {{ isEdit ? 'Editar Sitio Turístico' : 'Crear Sitio Turístico' }}
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
        <!-- Paso 1: Identidad -->
        <section v-if="currentStep === 1" class="step-content">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-input
                v-model.trim="form.nombre"
                label="Nombre del sitio *"
                placeholder="Ej: Parque Central"
                outlined
                :dark="$q.dark.isActive"
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

            <div class="col-12">
              <q-input
                v-model.trim="form.descripcion"
                label="Descripción *"
                placeholder="Describe el sitio turístico..."
                type="textarea"
                rows="4"
                outlined
                :dark="$q.dark.isActive"
                :error="!!errors.descripcion"
                :error-message="errors.descripcion"
              />
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
                class="upload-zone sitio-upload"
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
                  <div class="upload-title">
                    Arrastra fotos aquí o <span>selecciona archivos</span>
                  </div>
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

        <!-- Paso 2: Horarios -->
        <section v-if="currentStep === 2" class="step-content">
          <div class="text-subtitle1 text-weight-medium q-mb-md">Horarios de atención</div>
          <q-list bordered separator class="rounded-borders horarios-list" :dark="$q.dark.isActive">
            <q-item v-for="dia in diasSemana" :key="dia" class="horario-item">
              <q-item-section>
                <div class="horario-row">
                  <div class="horario-dia">
                    <div class="text-weight-medium">{{ dia }}</div>
                    <q-chip
                      dense
                      square
                      :color="form.horario[dia].cerrado ? 'grey-7' : 'positive'"
                      text-color="white"
                      class="horario-chip"
                    >
                      {{ form.horario[dia].cerrado ? 'Cerrado' : 'Abierto' }}
                    </q-chip>
                  </div>

                  <div class="horario-toggle">
                    <q-toggle
                      v-model="form.horario[dia].cerrado"
                      :true-value="false"
                      :false-value="true"
                      color="positive"
                      :label="form.horario[dia].cerrado ? 'Activar horario' : 'Horario activo'"
                    />
                  </div>

                  <div v-if="!form.horario[dia].cerrado" class="horario-horas">
                    <q-input
                      v-model="form.horario[dia].apertura"
                      label="Apertura"
                      type="time"
                      dense
                      outlined
                      :dark="$q.dark.isActive"
                      class="hora-input"
                      :error="!!errors[`horario_${dia}_apertura`]"
                      :error-message="errors[`horario_${dia}_apertura`]"
                    />
                    <q-input
                      v-model="form.horario[dia].cierre"
                      label="Cierre"
                      type="time"
                      dense
                      outlined
                      :dark="$q.dark.isActive"
                      class="hora-input"
                      :error="!!errors[`horario_${dia}_cierre`]"
                      :error-message="errors[`horario_${dia}_cierre`]"
                    />
                  </div>

                  <div v-else class="horario-cerrado-text">
                    No se solicitarán horas de apertura y cierre para este día.
                  </div>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </section>

        <!-- Paso 3: Ubicación y distrito -->
        <section v-if="currentStep === 3" class="step-content">
          <div class="text-subtitle1 text-weight-medium q-mb-md">
            Ubicación en el mapa y distrito
          </div>

          <div class="row q-col-gutter-md">
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
            <div v-if="errors.ubicacion" class="col-12 text-negative text-caption q-mt-xs">
              {{ errors.ubicacion }}
            </div>

            <div class="col-12 q-mt-md">
              <q-select
                v-model="form.distrito"
                :options="distritosOptions"
                label="Distrito donde se ubica el sitio *"
                outlined
                :dark="$q.dark.isActive"
                emit-value
                map-options
                :disable="distritosOptions.length === 0"
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
                :error="!!errors.direccion"
                :error-message="errors.direccion"
              />
            </div>
          </div>
        </section>

        <!-- Paso 4: Resumen visual mejorado -->
        <section v-if="currentStep === 4" class="step-content">
          <div class="text-h6 text-weight-bold q-mb-md">Resumen del sitio</div>

          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-card flat bordered class="summary-card">
                <q-card-section>
                  <div class="text-subtitle1 text-weight-bold">
                    <q-icon name="place" size="20px" class="q-mr-sm" />
                    {{ form.nombre || '(Sin nombre)' }}
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
                  <div class="text-overline">Horario</div>
                  <div class="text-body2">{{ resumenHorario }}</div>
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
            El sitio se publicará automáticamente al guardar.
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
          class="sitio-btn"
          label="Siguiente"
          icon-right="chevron_right"
          @click="nextStep"
        />
        <q-btn
          v-else
          unelevated
          class="sitio-btn"
          :loading="saving"
          :label="isEdit ? 'Guardar cambios' : 'Guardar sitio'"
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
  sitio: { type: Object, default: null },
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
const isEdit = computed(() => !!props.sitio)

const steps = [
  { number: 1, title: 'Identidad' },
  { number: 2, title: 'Horarios' },
  { number: 3, title: 'Ubicación' },
  { number: 4, title: 'Resumen' },
]
const currentStep = ref(1)
const currentStepTitle = computed(
  () => steps.find((step) => step.number === currentStep.value)?.title,
)

const saving = ref(false)
const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const form = reactive(getEmptyForm())
const portadaFile = ref(null)
const portadaInput = ref(null)
const previewPortada = ref(null)
const extrasInput = ref(null)
const imagenesExtra = ref([])
const errors = reactive({})
const distritosCatalogo = ref([])

const detalleAlcaldia = computed(() => auth.user?.detalles?.detalle_alcaldia || {})

const categoriasOptions = computed(() =>
  (configStore.categoriasSitios || configStore.categorias || []).map((c) => ({
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

const resumenHorario = computed(() => {
  return diasSemana
    .map((dia) => {
      const h = form.horario[dia]
      if (!h) return `${dia}: cerrado`
      return `${dia}: ${h.cerrado ? 'Cerrado' : `${h.apertura || '--:--'} - ${h.cierre || '--:--'}`}`
    })
    .join(' · ')
})

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
  await asegurarCatalogos()
  aplicarDatosAlcaldia()

  if (props.sitio) cargarSitio(props.sitio)
  inicializarHorario()
}

async function asegurarCatalogos() {
  if (
    (configStore.categoriasSitios || []).length === 0 ||
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

function aplicarDatosAlcaldia() {
  const detalle = detalleAlcaldia.value
  form.departamento = detalle.departamento || ''
  form.municipio = detalle.municipio || ''
}

function getEmptyForm() {
  return {
    nombre: '',
    categoria: null,
    descripcion: '',
    costo: 0,
    lat: null,
    lng: null,
    departamento: '',
    municipio: '',
    distrito: null,
    direccion: '',
    horario: {},
  }
}

function resetForm() {
  Object.assign(form, getEmptyForm())
  portadaFile.value = null
  previewPortada.value = null
  imagenesExtra.value = []
  inicializarHorario()
}

function inicializarHorario() {
  diasSemana.forEach((dia) => {
    if (!form.horario[dia]) {
      form.horario[dia] = {
        apertura: '09:00',
        cierre: '18:00',
        cerrado: false,
      }
    }
  })
}

function cargarSitio(s) {
  const dep = typeof s.departamento === 'object' ? s.departamento.value : s.departamento
  const mun =
    typeof s.municipio === 'object' ? s.municipio.nombre || s.municipio.value : s.municipio

  Object.assign(form, {
    nombre: s.nombre || '',
    categoria: typeof s.categoria === 'object' ? s.categoria.value : s.categoria || null,
    descripcion: s.descripcion || '',
    costo: s.costo ?? s.precio_entrada ?? 0,
    lat: s.localizacion?.lat ?? null,
    lng: s.localizacion?.lng ?? null,
    departamento: dep || detalleAlcaldia.value.departamento || '',
    municipio: mun || detalleAlcaldia.value.municipio || '',
    distrito: obtenerClaveDistrito(s.distrito),
    direccion: s.direccion || s.localizacion?.direccion || '',
    horario: s.horario ? { ...s.horario } : {},
  })

  inicializarHorario()

  previewPortada.value = s.imagen_portada
    ? couch.getImageUrl(`sit_${s._id}`, s.imagen_portada)
    : null

  imagenesExtra.value = normalizarListaImagenes(s.imagenes_extra).map((name) => ({
    id: `old-${name}`,
    name,
    src: couch.getImageUrl(`sit_${s._id}`, name),
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

function limpiarErrores() {
  Object.keys(errors).forEach((key) => delete errors[key])
}

function validarPaso1() {
  if (!form.nombre) errors.nombre = 'El nombre es obligatorio'
  if (!form.categoria) errors.categoria = 'Selecciona una categoría'
  if (!form.descripcion) errors.descripcion = 'La descripción es obligatoria'
  if (!portadaFile.value && !previewPortada.value && !isEdit.value) {
    errors.imagen_portada = 'Debes seleccionar una imagen principal'
  }
}

function validarPaso2() {
  diasSemana.forEach((dia) => {
    const horario = form.horario[dia]
    if (!horario.cerrado) {
      if (!horario.apertura) {
        errors[`horario_${dia}_apertura`] = 'Hora requerida'
      } else {
        delete errors[`horario_${dia}_apertura`]
      }
      if (!horario.cierre) {
        errors[`horario_${dia}_cierre`] = 'Hora requerida'
      } else {
        delete errors[`horario_${dia}_cierre`]
      }
    } else {
      delete errors[`horario_${dia}_apertura`]
      delete errors[`horario_${dia}_cierre`]
    }
  })
}

function validarPaso3() {
  if (!form.departamento) errors.departamento = 'No se pudo obtener el departamento de la alcaldía'
  if (!form.municipio) errors.municipio = 'No se pudo obtener el municipio de la alcaldía'
  if (!form.distrito) errors.distrito = 'Selecciona el distrito donde se ubica el sitio'
  if (form.lat === null || form.lng === null) {
    errors.ubicacion = 'Selecciona una ubicación en el mapa'
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

async function guardar() {
  if (!validarCompleto()) return
  saving.value = true

  try {
    const sitioData = {
      type: 'sitio',
      nombre: form.nombre,
      categoria: form.categoria,
      descripcion: form.descripcion,
      costo: form.costo || 0,
      localizacion: { lat: Number(form.lat), lng: Number(form.lng) },
      departamento: form.departamento,
      municipio: form.municipio,
      distrito: buildDistritoObject(form.distrito),
      direccion: form.direccion,
      horario: form.horario,
      estado: 'activo',
      alcaldia: {
        _id: auth.user._id,
        nombre_institucional: detalleAlcaldia.value.nombre_institucional || '',
        departamento: detalleAlcaldia.value.departamento || '',
        municipio: detalleAlcaldia.value.municipio || '',
      },
      fecha_creacion: props.sitio?.fecha_creacion || new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString(),
    }

    let idSitio
    if (isEdit.value) {
      const doc = await couch.get(DB, props.sitio._id)
      Object.assign(doc, sitioData)
      delete doc.precio_entrada
      await couch.put(DB, doc)
      idSitio = doc._id
    } else {
      const response = await couch.post(DB, sitioData)
      idSitio = response.id
    }

    if (portadaFile.value) {
      await couch.uploadEntityImage(
        { _id: idSitio, tipo: 'sitio' },
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
        { _id: idSitio, tipo: 'sitio' },
        'imagenes_extra',
        img.file,
      )
      imagenesExtraNombres.push(obtenerNombreImagenSubida(response, img.name))
    }

    const docFinal = await couch.get(DB, idSitio)
    docFinal.imagenes_extra = imagenesExtraNombres
    await couch.put(DB, docFinal)

    emit('saved')
    dialogVisible.value = false
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'No se pudo guardar el sitio' })
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

.sitio-header {
  background: #ff9800;
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
  background: #ff9800;
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

.upload-zone:hover,
.extra-add:hover {
  background: #fafafa;
}

.sitio-upload:hover,
.extra-add:hover {
  border-color: #ff9800;
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

.upload-title span {
  color: #fb8c00;
  font-weight: 600;
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

.horarios-list {
  overflow: hidden;
}

.horario-item {
  padding: 16px;
}

.horario-row {
  display: grid;
  grid-template-columns: 145px 190px minmax(260px, 1fr);
  gap: 14px;
  align-items: center;
  width: 100%;
}

.horario-dia {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.horario-chip {
  width: fit-content;
  margin: 0;
  font-size: 12px;
}

.horario-toggle {
  min-width: 175px;
}

.horario-horas {
  display: grid;
  grid-template-columns: repeat(2, minmax(130px, 1fr));
  gap: 12px;
  align-items: start;
}

.horario-cerrado-text {
  color: #6b7280;
  font-size: 13px;
  line-height: 1.4;
}

.hora-input {
  width: 100%;
  min-width: 0;
}

.map-picker-wrapper {
  position: relative;
}

/*
  En este formulario se oculta el botón interno de ubicación del mapa para
  evitar duplicados al editar un sitio con coordenadas ya cargadas.
*/
.hide-current-location-btn :deep(.my-location-btn),
.hide-current-location-btn :deep(.current-location-btn),
.hide-current-location-btn :deep(.location-button),
.hide-current-location-btn :deep(.leaflet-control-locate),
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

.sitio-btn {
  background: #ff9800;
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
  background: #ff9800;
}

.dark-mode .field-label {
  color: #ddd;
}

.dark-mode .upload-zone {
  background: #2b2b2b;
  border-color: #555;
}

.dark-mode .upload-zone:hover,
.dark-mode .extra-add:hover {
  background: #333;
}

.dark-mode .sitio-upload:hover,
.dark-mode .extra-add:hover {
  border-color: #ff9800;
}

.dark-mode .upload-title {
  color: #aaa;
}

.dark-mode .upload-title span {
  color: #fb8c00;
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

.dark-mode .horarios-list {
  border-color: #444;
}

.dark-mode .horario-cerrado-text {
  color: #cbd5e1;
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

  .horario-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .horario-horas {
    grid-template-columns: 1fr;
  }

  .horario-toggle {
    min-width: 0;
  }

  .hora-input {
    width: 100%;
  }
}
</style>
