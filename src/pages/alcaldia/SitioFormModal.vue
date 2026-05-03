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
                v-model.number="form.precio_entrada"
                label="Precio de entrada"
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

        <section v-if="currentStep === 2" class="step-content">
          <div class="text-subtitle1 text-weight-medium q-mb-md">Horarios de atención</div>
          <q-list bordered separator class="rounded-borders horarios-list">
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
        </section>

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

            <div class="col-12 col-md-6">
              <q-select
                v-model="form.departamento"
                :options="departamentosOptions"
                label="Departamento *"
                outlined
                emit-value
                map-options
                :error="!!errors.departamento"
                :error-message="errors.departamento"
                @update:model-value="form.municipio = ''"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-select
                v-model="form.municipio"
                :options="municipiosOptions"
                label="Municipio *"
                outlined
                emit-value
                map-options
                :disable="!form.departamento"
                :error="!!errors.municipio"
                :error-message="errors.municipio"
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
              ><q-item-section>Categoría: {{ categoriaLabel || '---' }}</q-item-section></q-item
            >
            <q-item
              ><q-item-section>Ubicación: {{ resumenUbicacion }}</q-item-section></q-item
            >
            <q-item>
              <q-item-section>
                Precio: {{ Number(form.precio_entrada || 0).toFixed(2) }} USD
              </q-item-section>
            </q-item>
          </q-list>

          <q-toggle v-model="publishNow" label="Publicar inmediatamente" />
          <div class="text-caption text-grey-7 q-mt-sm" v-if="!publishNow">
            Se guardará como borrador.
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
const publishNow = ref(true)
const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const form = reactive(getEmptyForm())
const portadaFile = ref(null)
const portadaInput = ref(null)
const previewPortada = ref(null)
const errors = reactive({})

const categoriasOptions = computed(() =>
  (configStore.categorias || []).map((c) => ({ label: c.nombre, value: c.clave })),
)

const departamentosOptions = computed(() =>
  (configStore.departamentos || []).map((d) => ({ label: d.nombre, value: d.clave })),
)

const municipiosOptions = computed(() => {
  if (!form.departamento) return []
  const depto = configStore.departamentos?.find((d) => d.clave === form.departamento)
  return (depto?.municipios || []).map((m) => ({ label: m.nombre, value: m.nombre }))
})

const categoriaLabel = computed(() => {
  return categoriasOptions.value.find((c) => c.value === form.categoria)?.label || form.categoria
})

const resumenUbicacion = computed(() => {
  if (form.direccion) return form.direccion
  if (form.departamento || form.municipio) {
    const depNombre =
      departamentosOptions.value.find((d) => d.value === form.departamento)?.label ||
      form.departamento
    return `${form.municipio || ''}, ${depNombre}`.trim()
  }
  if (form.lat !== null && form.lng !== null) return `${form.lat}, ${form.lng}`
  return '---'
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

  if ((configStore.categorias || []).length === 0) await configStore.fetchCatalogos()

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
  const dep = typeof s.departamento === 'object' ? s.departamento.value : s.departamento
  const mun =
    typeof s.municipio === 'object' ? s.municipio.nombre || s.municipio.value : s.municipio

  Object.assign(form, {
    nombre: s.nombre || '',
    categoria: typeof s.categoria === 'object' ? s.categoria.value : s.categoria || null,
    descripcion: s.descripcion || '',
    precio_entrada: s.precio_entrada || 0,
    lat: s.localizacion?.lat ?? null,
    lng: s.localizacion?.lng ?? null,
    departamento: dep || '',
    municipio: mun || '',
    direccion: s.direccion || '',
    horario: s.horario ? { ...s.horario } : {},
  })
  previewPortada.value = s.imagen_portada || null
  publishNow.value = s.estado === 'activo'
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
  if (!form.departamento) errors.departamento = 'El departamento es obligatorio'
  if (!form.municipio) errors.municipio = 'El municipio es obligatorio'
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

.horario-item {
  flex-wrap: wrap;
}

.dia-section {
  max-width: 130px;
}

.hora-input {
  width: 125px;
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
    margin-bottom: 8px;
  }

  .hora-input {
    width: 100%;
  }
}
</style>
