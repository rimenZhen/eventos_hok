<template>
  <q-dialog v-model="dialogVisible" persistent>
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
        <q-btn icon="close" flat dense round class="close-btn" v-close-popup />
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
          <div class="text-h6 q-mb-sm">Resumen del sitio</div>
          <q-list dense bordered class="rounded-borders q-mb-md">
            <q-item
              ><q-item-section>Nombre: {{ form.nombre || '---' }}</q-item-section></q-item
            >
            <q-item
              ><q-item-section>Descripción: {{ form.descripcion || '---' }}</q-item-section></q-item
            >
            <q-item
              ><q-item-section
                >Precio: {{ Number(form.costo || 0).toFixed(2) }} USD</q-item-section
              ></q-item
            >
            <q-item
              ><q-item-section
                >Distrito: {{ distritoSeleccionado?.nombre || '---' }}</q-item-section
              ></q-item
            >
            <q-item
              ><q-item-section
                >Dirección detallada: {{ form.direccion || '---' }}</q-item-section
              ></q-item
            >
          </q-list>
          <div class="text-caption text-grey-7">
            El sitio se publicará automáticamente al guardar.
          </div>
        </section>
      </q-card-section>

      <q-separator />
      <q-card-actions class="wizard-actions bg-white q-pa-md">
        <q-btn flat label="Cancelar" v-close-popup />
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
  width: min(680px, 94vw);
  height: min(92vh, 760px);
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
  min-height: 135px;
  border: 2px dashed #b9c8dd;
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

.sitio-upload {
  border-color: #ff9800;
}

.upload-zone:hover {
  background: #fffaf2;
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
  color: #ff9800;
  font-weight: 700;
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

.extra-add:hover {
  border-color: #ff9800;
  background: #fffaf2;
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

.wizard-actions {
  flex-wrap: nowrap;
}

.sitio-btn {
  background: #ff9800;
  color: white;
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
