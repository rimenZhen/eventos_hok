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
        <!-- Paso 1 -->
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
                Fotos del sitio {{ isEdit ? '' : '*' }}
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
          </div>
        </section>

        <!-- Paso 2 -->
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

        <!-- Paso 3 -->
        <section v-if="currentStep === 3" class="step-content">
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

        <!-- Paso 4: Resumen (sin toggle de publicación) -->
        <section v-if="currentStep === 4" class="step-content">
          <div class="text-h6 q-mb-sm">Resumen del sitio</div>
          <q-list dense bordered class="rounded-borders q-mb-md">
            <q-item>
              <q-item-section>Nombre: {{ form.nombre || '---' }}</q-item-section>
            </q-item>
            <q-item>
              <q-item-section>Descripción: {{ form.descripcion || '---' }}</q-item-section>
            </q-item>
            <q-item>
              <q-item-section>Precio: {{ Number(form.costo || 0).toFixed(2) }} USD</q-item-section>
            </q-item>
            <q-item>
              <q-item-section>Distrito: {{ distritoSeleccionado?.nombre || '---' }}</q-item-section>
            </q-item>
            <q-item>
              <q-item-section>Dirección detallada: {{ form.direccion || '---' }}</q-item-section>
            </q-item>
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
const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const form = reactive(getEmptyForm())
const portadaFile = ref(null)
const portadaInput = ref(null)
const previewPortada = ref(null)
const errors = reactive({})
const distritosCatalogo = ref([])

const categoriasOptions = computed(() =>
  (configStore.categoriasSitios || []).map((c) => ({ label: c.nombre, value: c.clave })),
)

const distritosFuente = computed(() =>
  (configStore.distritos || []).length > 0 ? configStore.distritos : distritosCatalogo.value,
)

const distritosOptions = computed(() =>
  (distritosFuente.value || [])
    .filter((distrito) => distrito.activo !== false && distrito.alcaldia === form.municipio)
    .map((distrito) => ({ label: distrito.nombre, value: distrito.clave })),
)

const distritoSeleccionado = computed(() => {
  const distrito = (distritosFuente.value || []).find((item) => item.clave === form.distrito)
  if (!distrito) return null
  return {
    clave: distrito.clave,
    nombre: distrito.nombre,
  }
})

watch(
  () => dialogVisible.value,
  async (visible) => {
    if (!visible) return
    await prepararFormulario()
  },
)

async function cargarDistritosFallback() {
  try {
    const result = await couch.find(import.meta.env.VITE_DB_DATA, { type: 'configuracion' })
    const distritosDoc = (result.docs || []).find((doc) => {
      const descripcion = doc.descripcion?.toLowerCase() || ''
      return descripcion.includes('distrito') || descripcion.includes('distritos')
    })
    distritosCatalogo.value = distritosDoc?.items?.filter((item) => item.activo !== false) || []
  } catch (error) {
    console.error(error)
    distritosCatalogo.value = []
  }
}

async function prepararFormulario() {
  limpiarErrores()
  resetForm()
  currentStep.value = 1

  if (
    (configStore.categoriasSitios || []).length === 0 ||
    (configStore.distritos || []).length === 0
  )
    await configStore.fetchCatalogos()
  if ((configStore.distritos || []).length === 0) await cargarDistritosFallback()

  if (!isEdit.value) {
    const detalle = auth.user?.detalles?.detalle_alcaldia
    if (detalle?.departamento) form.departamento = detalle.departamento
    if (detalle?.municipio) form.municipio = detalle.municipio
  }

  if (props.sitio) cargarSitio(props.sitio)
  inicializarHorario()
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
  inicializarHorario()
}

function inicializarHorario() {
  diasSemana.forEach((dia) => {
    if (!form.horario[dia]) {
      form.horario[dia] = { apertura: '09:00', cierre: '18:00', cerrado: true }
    }
  })
}

function cargarSitio(s) {
  const dep = typeof s.departamento === 'object' ? s.departamento.value : s.departamento
  const mun =
    typeof s.municipio === 'object' ? s.municipio.nombre || s.municipio.value : s.municipio
  const distrito =
    typeof s.distrito === 'object' ? s.distrito.clave || s.distrito.value : s.distrito

  Object.assign(form, {
    nombre: s.nombre || '',
    categoria: typeof s.categoria === 'object' ? s.categoria.value : s.categoria || null,
    descripcion: s.descripcion || '',
    costo: s.costo ?? s.precio_entrada ?? 0,
    lat: s.localizacion?.lat ?? null,
    lng: s.localizacion?.lng ?? null,
    departamento: dep || '',
    municipio: mun || '',
    distrito: distrito || null,
    direccion: s.direccion || s.localizacion?.direccion || '',
    horario: s.horario ? { ...s.horario } : {},
  })
  previewPortada.value = s.imagen_portada || null
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

function actualizarUbicacion({ lat, lng }) {
  form.lat = lat
  form.lng = lng
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
  if (!form.departamento) errors.departamento = 'No se pudo obtener el departamento de la alcaldía'
  if (!form.municipio) errors.municipio = 'No se pudo obtener el municipio de la alcaldía'
  if (!form.distrito) errors.distrito = 'Selecciona el distrito donde se ubica el sitio'
  if (form.lat === null || form.lng === null)
    errors.ubicacion = 'Selecciona una ubicación en el mapa'
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
      distrito: distritoSeleccionado.value,
      direccion: form.direccion,
      horario: form.horario,
      estado: 'activo', // siempre se publica
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

.upload-zone:hover {
  background: #fafafa;
}

.sitio-upload:hover {
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

.wizard-actions {
  flex-wrap: nowrap;
}

.sitio-btn {
  background: #ff9800;
  color: white;
}

.horarios-header {
  margin-bottom: 14px;
}

.horarios-list {
  overflow: hidden;
}

.horario-item {
  align-items: flex-start;
  padding: 18px 16px;
}

.dia-section {
  max-width: 130px;
  padding-top: 8px;
}

.horario-section {
  min-width: 0;
}

.horario-top-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.horario-inputs {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.hora-input {
  width: 180px;
}

.horario-cerrado-text {
  margin-top: 4px;
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

  .wizard-header {
    padding: 16px 18px;
  }

  .progress-wrapper {
    padding: 14px 18px 8px;
  }

  .wizard-body {
    padding: 12px 18px 16px;
  }

  .dia-section {
    max-width: none;
    flex-basis: 100%;
    margin-bottom: 6px;
    padding-top: 0;
  }

  .horario-top-row {
    gap: 8px;
  }

  .horario-inputs {
    flex-direction: column;
  }

  .hora-input {
    width: 100%;
  }
}
</style>
