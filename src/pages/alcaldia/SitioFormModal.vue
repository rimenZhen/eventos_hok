<template>
  <q-dialog v-model="dialogVisible">
    <q-card class="wizard-card column no-wrap">
      <q-card-section class="wizard-header sitio-header row items-center no-wrap">
        <q-icon name="place" size="28px" class="q-mr-md" />
        <div>
          <div class="text-h6 text-weight-bold">
            {{ isEdit ? 'Editar Sitio Turístico' : 'Crear Sitio Turístico' }}
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
                v-model.trim="form.nombre"
                label="Nombre del sitio *"
                placeholder="Ej: Catedral Metropolitana"
                outlined
                :error="!!errors.nombre"
                :error-message="errors.nombre"
              />
            </div>

            <div class="col-12">
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

            <div class="col-12">
              <q-input
                v-model.trim="form.descripcion"
                label="Descripción *"
                placeholder="Describe el sitio turístico..."
                type="textarea"
                rows="4"
                outlined
                :error="!!errors.descripcion"
                :error-message="errors.descripcion"
              />
            </div>

            <div class="col-12 col-md-5">
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
                  <div class="upload-hint">JPG, PNG o WebP. Máximo 5MB por imagen.</div>
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
          <div class="horarios-header">
            <div>
              <div class="text-subtitle1 text-weight-medium">Horarios de atención</div>
              <div class="text-caption text-grey-6">
                Activa únicamente los días en los que el sitio estará abierto.
              </div>
            </div>
          </div>

          <q-list bordered separator class="rounded-borders horarios-list">
            <q-item v-for="dia in diasSemana" :key="dia" class="horario-item">
              <q-item-section class="dia-section">
                <q-item-label class="text-weight-medium">{{ dia }}</q-item-label>
              </q-item-section>

              <q-item-section class="horario-section">
                <div class="horario-top-row">
                  <q-toggle
                    :model-value="!form.horario[dia].cerrado"
                    color="teal"
                    :label="form.horario[dia].cerrado ? 'Cerrado' : 'Abierto'"
                    @update:model-value="(val) => (form.horario[dia].cerrado = !val)"
                  />

                  <q-chip
                    dense
                    square
                    :color="form.horario[dia].cerrado ? 'grey-7' : 'teal'"
                    text-color="white"
                  >
                    {{ form.horario[dia].cerrado ? 'Sin atención' : 'Atiende este día' }}
                  </q-chip>
                </div>

                <div v-if="!form.horario[dia].cerrado" class="horario-inputs">
                  <q-input
                    v-model="form.horario[dia].apertura"
                    label="Hora de apertura"
                    type="time"
                    dense
                    outlined
                    class="hora-input"
                  />

                  <q-input
                    v-model="form.horario[dia].cierre"
                    label="Hora de cierre"
                    type="time"
                    dense
                    outlined
                    class="hora-input"
                  />
                </div>

                <div v-else class="text-caption text-grey-6 horario-cerrado-text">
                  Este día aparecerá como cerrado.
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </section>

        <section v-if="currentStep === 3" class="step-content">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div class="field-label">
                <q-icon name="map" />
                Selecciona la ubicación en el mapa *
              </div>
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

            <div class="col-12">
              <q-select
                v-model="form.distrito"
                :options="distritosOptions"
                label="Distrito donde se ubica el sitio *"
                outlined
                emit-value
                map-options
                :disable="distritosOptions.length === 0"
                :error="!!errors.distrito"
                :error-message="errors.distrito"
                hint="Solo se muestran los distritos asociados a tu alcaldía"
              />
            </div>

            <div class="col-12">
              <q-input v-model.trim="form.direccion" label="Dirección detallada" outlined />
            </div>
          </div>
        </section>

        <section v-if="currentStep === 4" class="step-content">
          <div class="summary-hero sitio-summary-hero">
            <div class="summary-hero-content">
              <q-chip dense color="white" text-color="orange-9" icon="visibility">
                Vista previa de publicación
              </q-chip>
              <div class="summary-title">{{ form.nombre || 'Sitio sin nombre' }}</div>
              <div class="summary-description">
                {{
                  form.descripcion ||
                  'Agrega una descripción para que los visitantes conozcan mejor este sitio.'
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
              <q-icon name="schedule" />
              <div>
                <span>Días abiertos</span>
                <strong>{{ horariosAbiertos.length }} de {{ diasSemana.length }}</strong>
              </div>
            </div>

            <div class="summary-card">
              <q-icon name="photo_library" />
              <div>
                <span>Galería</span>
                <strong>{{ previewsExtras.length }} imagen(es) extra</strong>
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
              <q-icon name="access_time" />
              <div>
                <span>Horario visible</span>
                <strong v-if="horariosAbiertos.length">{{ horariosAbiertos.join(', ') }}</strong>
                <strong v-else>Todos los días aparecen cerrados</strong>
              </div>
            </div>
          </div>

          <q-banner rounded class="publish-banner sitio-publish-banner q-mt-md">
            <template #avatar>
              <q-icon name="campaign" />
            </template>
            El sitio se publicará automáticamente al guardar. Revisa ubicación, costo y horarios
            antes de confirmar.
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

function cerrarFormulario() {
  if (saving.value) return
  dialogVisible.value = false
}

const steps = [
  { number: 1, title: 'Identidad' },
  { number: 2, title: 'Horarios' },
  { number: 3, title: 'Ubicación' },
  { number: 4, title: 'Publicación' },
]
const currentStep = ref(1)
const currentStepTitle = computed(
  () => steps.find((step) => step.number === currentStep.value)?.title,
)

const saving = ref(false)
const MAX_EXTRA_IMAGES = 5
const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const form = reactive(getEmptyForm())
const portadaFile = ref(null)
const portadaInput = ref(null)
const extrasInput = ref(null)
const previewPortada = ref(null)
const previewsExtras = ref([])
const errors = reactive({})

const detalleAlcaldia = computed(() => auth.user?.detalles?.detalle_alcaldia || {})

const categoriasOptions = computed(() =>
  (configStore.categoriasSitios || []).map((c) => ({ label: c.nombre, value: c.clave })),
)

const categoriaSeleccionada = computed(() =>
  categoriasOptions.value.find((cat) => cat.value === form.categoria),
)

const horariosAbiertos = computed(() =>
  diasSemana.filter((dia) => form.horario?.[dia] && !form.horario[dia].cerrado),
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
  currentStep.value = 1

  if (
    (configStore.categoriasSitios || []).length === 0 ||
    (configStore.distritos || []).length === 0
  ) {
    await configStore.fetchCatalogos()
  }

  aplicarDatosAlcaldia()

  if (props.sitio) cargarSitio(props.sitio)
  aplicarDatosAlcaldia()
  inicializarHorario()
}

function aplicarDatosAlcaldia() {
  const detalle = detalleAlcaldia.value
  form.departamento = detalle.departamento || form.departamento || ''
  form.municipio = detalle.municipio || form.municipio || ''
}

function getEmptyForm() {
  return {
    nombre: '',
    categoria: null,
    descripcion: '',
    costo: 0,
    distrito: null,
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
  previewsExtras.value = []
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
    costo: s.costo ?? s.precio_entrada ?? s.precio ?? 0,
    distrito: typeof s.distrito === 'object' ? s.distrito.clave : s.distrito || null,
    lat: s.localizacion?.lat ?? null,
    lng: s.localizacion?.lng ?? null,
    departamento: s.departamento || '',
    municipio: s.municipio || '',
    direccion: s.direccion || s.localizacion?.direccion || '',
    horario: s.horario ? { ...s.horario } : {},
  })
  previewPortada.value = s.imagen_portada || null
  previewsExtras.value = (s.imagenes_extra || []).map((name) => ({
    src: name,
    name,
    file: null,
    isNew: false,
  }))
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
  form.lat = lat
  form.lng = lng
  if (direccion && !form.direccion) form.direccion = direccion
}

function buildDistritoObject(clave = form.distrito) {
  const distrito = (configStore.distritos || []).find((d) => d.clave === clave)
  return distrito ? { clave: distrito.clave, nombre: distrito.nombre } : null
}

async function actualizarReferenciasImagenes(idSitio, imagenPortada, imagenesExtra) {
  const doc = await couch.get(import.meta.env.VITE_DB_DATA, idSitio)
  if (imagenPortada) doc.imagen_portada = imagenPortada
  doc.imagenes_extra = imagenesExtra
  doc.fecha_actualizacion = new Date().toISOString()
  await couch.put(import.meta.env.VITE_DB_DATA, doc)
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

function validarPaso3() {
  if (!form.distrito) errors.distrito = 'Selecciona el distrito'
  if (form.lat === null || form.lng === null) {
    errors.ubicacion = 'Selecciona una ubicación en el mapa'
  }
}

function validarPasoActual() {
  limpiarErrores()
  if (currentStep.value === 1) validarPaso1()
  if (currentStep.value === 3) validarPaso3()
  return Object.keys(errors).length === 0
}

function validarCompleto() {
  limpiarErrores()
  validarPaso1()
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
      distrito: buildDistritoObject(),
      direccion: form.direccion,
      horario: form.horario,
      estado: 'activo',
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
      delete doc.precio
      delete doc.precio_entrada
      Object.assign(doc, sitioData)
      await couch.put(import.meta.env.VITE_DB_DATA, doc)
      idSitio = doc._id
    } else {
      const response = await couch.post(import.meta.env.VITE_DB_DATA, sitioData)
      idSitio = response.id
    }

    const imagenPortadaFinal = portadaFile.value
      ? portadaFile.value.name
      : props.sitio?.imagen_portada || ''

    if (portadaFile.value) {
      await couch.uploadEntityImage(
        { _id: idSitio, tipo: 'sitio' },
        'imagen_portada',
        portadaFile.value,
      )
    }

    const imagenesExtraFinales = []
    for (const img of previewsExtras.value) {
      if (img.isNew && img.file) {
        await couch.uploadEntityImage({ _id: idSitio, tipo: 'sitio' }, 'imagenes_extra', img.file)
        imagenesExtraFinales.push(img.file.name)
      } else if (img.name) {
        imagenesExtraFinales.push(img.name)
      }
    }

    await actualizarReferenciasImagenes(idSitio, imagenPortadaFinal, imagenesExtraFinales)

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
  box-shadow: 0 24px 70px rgba(84, 55, 12, 0.2);
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
  background: rgba(255, 255, 255, 0.16);
  pointer-events: none;
  z-index: 0;
}

.sitio-header {
  background: linear-gradient(135deg, #e86d00 0%, #ff9800 55%, #ffc266 100%);
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
  background: linear-gradient(180deg, #ffffff 0%, #fff9f0 100%);
}

.progress-segment {
  height: 7px;
  border-radius: 999px;
  background: #eadfce;
}

.progress-segment.active {
  background: linear-gradient(90deg, #e86d00, #ffb338);
  box-shadow: 0 4px 10px rgba(255, 152, 0, 0.26);
}

.wizard-body {
  flex: 1 1 auto;
  padding: 18px 26px 22px;
  min-height: 0;
  background: #fbf8f2;
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
  border: 2px dashed #d5bd95;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  overflow: hidden;
  background: linear-gradient(135deg, #ffffff 0%, #fff8ec 100%);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.sitio-upload {
  border-color: #ff9800;
}

.upload-zone:hover {
  transform: translateY(-2px);
  background: #fffaf2;
  box-shadow: 0 12px 28px rgba(255, 152, 0, 0.16);
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

.upload-title span {
  color: #ff9800;
  font-weight: 800;
}

.upload-hint {
  color: #8d806e;
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
  box-shadow: 0 8px 18px rgba(84, 55, 12, 0.14);
}

.extra-add {
  border: 2px dashed #d5bd95;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #fff;
}

.extra-add:hover {
  border-color: #ff9800;
  background: #fffaf2;
}

.horarios-header {
  padding: 16px;
  border-radius: 18px;
  background: white;
  box-shadow: 0 10px 24px rgba(84, 55, 12, 0.08);
  margin-bottom: 14px;
}

.horarios-list {
  overflow: hidden;
  border-color: #eadfce;
  box-shadow: 0 12px 28px rgba(84, 55, 12, 0.08);
}

.horario-item {
  background: white;
}

.horario-top-row,
.horario-inputs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.hora-input {
  min-width: 150px;
}

.summary-hero {
  min-height: 220px;
  border-radius: 24px;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1.25fr 0.75fr;
  box-shadow: 0 18px 40px rgba(84, 55, 12, 0.18);
}

.sitio-summary-hero {
  background: linear-gradient(135deg, #e86d00, #ff9800 55%, #ffc266);
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
  box-shadow: 0 10px 26px rgba(84, 55, 12, 0.08);
  border: 1px solid #f0e5d5;
}

.summary-card-wide {
  grid-column: span 2;
}

.summary-card > .q-icon {
  font-size: 26px;
  color: #ff9800;
  background: #fff3df;
  padding: 8px;
  border-radius: 14px;
}

.summary-card span {
  display: block;
  color: #8d806e;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.summary-card strong {
  display: block;
  color: #2f2414;
  font-size: 15px;
  margin-top: 2px;
}

.summary-card small {
  display: block;
  color: #7d715f;
  margin-top: 4px;
  line-height: 1.35;
}

.highlight-card {
  border-color: rgba(255, 152, 0, 0.3);
}

.publish-banner {
  border: 1px solid rgba(255, 152, 0, 0.24);
  font-weight: 600;
}

.sitio-publish-banner {
  background: #fff3df;
  color: #704200;
}

.wizard-actions {
  flex-wrap: nowrap;
  background: #ffffff;
  box-shadow: 0 -10px 24px rgba(84, 55, 12, 0.07);
}

.sitio-btn {
  background: linear-gradient(135deg, #e86d00, #ff9800);
  color: white;
  border-radius: 12px;
  box-shadow: 0 8px 18px rgba(255, 152, 0, 0.26);
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
