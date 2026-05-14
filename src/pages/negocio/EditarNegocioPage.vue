<template>
  <q-page class="en-page">
    <!-- Decorative background blobs -->
    <div class="en-blob en-blob--1" aria-hidden="true" />
    <div class="en-blob en-blob--2" aria-hidden="true" />

    <div class="en-container">
      <!-- Header -->
      <div class="en-header">
        <div class="en-header__icon">
          <q-icon name="store" size="28px" />
        </div>
        <div>
          <h1 class="en-header__title">Editar Negocio</h1>
          <p class="en-header__subtitle">Actualiza la información de tu negocio</p>
        </div>
      </div>

      <q-form @submit="guardar" v-if="form" class="en-form">

        <!-- ── Sección: Información general ── -->
        <div class="en-section">
          <div class="en-section__label">
            <q-icon name="info_outline" size="16px" class="q-mr-xs" />
            Información General
          </div>

          <div class="en-grid en-grid--2">
            <div class="en-field-wrap en-grid--span2">
              <q-input
                v-model="form.nombre_comercial"
                label="Nombre comercial"
                outlined
                class="en-input"
                bg-color="transparent"
              >
                <template #prepend>
                  <q-icon name="storefront" class="en-input__icon" />
                </template>
              </q-input>
            </div>

            <div class="en-field-wrap en-grid--span2">
              <q-input
                v-model="form.descripcion"
                type="textarea"
                label="Descripción"
                outlined
                rows="3"
                autogrow
                class="en-input"
              >
                <template #prepend>
                  <q-icon name="description" class="en-input__icon" />
                </template>
              </q-input>
            </div>

            <div class="en-field-wrap">
              <q-select
                v-model="form.categoria"
                :options="categoriasOptions"
                label="Categoría"
                outlined
                class="en-input"
              >
                <template #prepend>
                  <q-icon name="category" class="en-input__icon" />
                </template>
              </q-select>
            </div>

            <div class="en-field-wrap">
              <q-input
                v-model="form.telefono"
                label="Teléfono"
                outlined
                class="en-input"
              >
                <template #prepend>
                  <q-icon name="phone" class="en-input__icon" />
                </template>
              </q-input>
            </div>

            <div class="en-field-wrap en-grid--span2">
              <q-input
                v-model="form.nit_registro"
                label="NIT / Registro"
                outlined
                class="en-input"
              >
                <template #prepend>
                  <q-icon name="badge" class="en-input__icon" />
                </template>
              </q-input>
            </div>
          </div>
        </div>

        <!-- ── Sección: Ubicación ── -->
        <div class="en-section">
          <div class="en-section__label">
            <q-icon name="place" size="16px" class="q-mr-xs" />
            Ubicación
          </div>

          <div class="en-grid en-grid--2">
            <div class="en-field-wrap">
              <q-select
                v-model="form.departamento"
                :options="departamentosOptions"
                label="Departamento"
                outlined
                emit-value
                map-options
                class="en-input"
                @update:model-value="handleDepartamentoChange"
              >
                <template #prepend>
                  <q-icon name="map" class="en-input__icon" />
                </template>
              </q-select>
            </div>

            <div class="en-field-wrap">
              <q-select
                v-model="form.distrito"
                :options="municipioOptions"
                label="Municipio"
                outlined
                class="en-input"
                :disable="!form.departamento"
                emit-value
                map-options
              >
                <template #prepend>
                  <q-icon name="location_city" class="en-input__icon" />
                </template>
              </q-select>
            </div>

            <div class="en-field-wrap en-grid--span2">
              <q-input
                v-model="form.direccion"
                label="Dirección"
                outlined
                class="en-input"
              >
                <template #prepend>
                  <q-icon name="home" class="en-input__icon" />
                </template>
              </q-input>
            </div>

            <!-- Coordenadas -->
            <div class="en-field-wrap">
              <q-input
                v-model="form.lat"
                label="Latitud"
                type="number"
                step="any"
                outlined
                class="en-input"
              >
                <template #prepend>
                  <q-icon name="my_location" class="en-input__icon" />
                </template>
              </q-input>
            </div>

            <div class="en-field-wrap">
              <q-input
                v-model="form.lng"
                label="Longitud"
                type="number"
                step="any"
                outlined
                class="en-input"
              >
                <template #prepend>
                  <q-icon name="my_location" class="en-input__icon" />
                </template>
              </q-input>
            </div>

            <!-- GPS Button -->
            <div class="en-field-wrap en-grid--span2">
              <q-btn
                label="Usar ubicación actual"
                class="en-gps-btn full-width"
                unelevated
                :loading="gpsLoading"
                @click="usarUbicacionActual"
              >
                <template #default>
                  <q-icon name="gps_fixed" class="q-mr-sm" />
                  Usar ubicación actual
                </template>
              </q-btn>
              <transition name="fade">
                <div v-if="gpsError" class="en-error-msg q-mt-xs">
                  <q-icon name="warning_amber" size="14px" class="q-mr-xs" />
                  {{ gpsError }}
                </div>
              </transition>
            </div>
          </div>
        </div>

        <!-- ── Sección: Horario y Portada ── -->
        <div class="en-section">
          <div class="en-section__label">
            <q-icon name="schedule" size="16px" class="q-mr-xs" />
            Información adicional
          </div>

          <HorarioSemanal v-model="form.horario" class="en-horario" />

          <div class="en-field-wrap q-mt-md">
            <q-file
              v-model="portadaFile"
              label="Imagen de portada"
              outlined
              accept="image/*"
              class="en-input en-file"
            >
              <template #prepend>
                <q-icon name="image" class="en-input__icon" />
              </template>
            </q-file>
          </div>
        </div>

        <!-- ── Submit ── -->
        <div class="en-submit-wrap">
          <q-btn
            type="submit"
            class="en-submit-btn full-width"
            unelevated
            :loading="saving"
          >
            <q-icon name="save_alt" class="q-mr-sm" />
            Guardar cambios
          </q-btn>
        </div>

      </q-form>
    </div>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { useConfiguracionStore } from 'src/stores/configuracion'
import { negocioAPI } from 'src/api/negocio'
import { couch } from 'src/api/index'
import HorarioSemanal from 'src/components/HorarioSemanal.vue'

const auth = useAuthStore()
const configStore = useConfiguracionStore()
const router = useRouter()
const saving = ref(false)
const portadaFile = ref(null)
const negocioId = ref(null)
const docRev = ref(null)
const gpsLoading = ref(false)
const gpsError = ref('')

function crearHorarioBase() {
  return {
    lunes:      { abierto: true,  apertura: '08:00', cierre: '17:00' },
    martes:     { abierto: true,  apertura: '08:00', cierre: '17:00' },
    miércoles:  { abierto: true,  apertura: '08:00', cierre: '17:00' },
    jueves:     { abierto: true,  apertura: '08:00', cierre: '17:00' },
    viernes:    { abierto: true,  apertura: '08:00', cierre: '17:00' },
    sábado:     { abierto: true,  apertura: '08:00', cierre: '17:00' },
    domingo:    { abierto: false, apertura: null,    cierre: null    },
    cerrado_festivos: false,
    nota: ''
  }
}

const form = reactive({
  nombre_comercial: '',
  descripcion: '',
  categoria: null,
  telefono: '',
  nit_registro: '',
  departamento: null,
  distrito: null,
  direccion: '',
  lat: 13.7,
  lng: -89.2,
  horario: crearHorarioBase()
})

const categoriasOptions  = computed(() => configStore.categoriasNegocios?.map(c => ({ label: c.nombre, value: c.clave })) || [])
const departamentosOptions = computed(() => configStore.getDepartamentosOptions())

const getValue = (val) => {
  if (!val) return null
  if (typeof val === 'object') return val.value || val.clave || null
  return val
}

const municipioOptions = computed(() => {
  const deptoClave = getValue(form.departamento)
  if (!deptoClave) return []
  return configStore.getDistritosByDepartamento(deptoClave)
})

function handleDepartamentoChange(value) {
  form.departamento = value
  form.distrito = null
}

function findDistritoClaveByNombre(nombre, deptoClave) {
  if (!nombre || !deptoClave) return null
  const distritosDepto = configStore.getDistritosByDepartamento(deptoClave)
  const found = distritosDepto.find(d => d.label.toLowerCase() === nombre.toLowerCase())
  return found ? found.value : null
}

function getDepartamentoClave(val) {
  if (!val) return null
  if (typeof val === 'object') return val.value || val.clave || null
  return val
}

function usarUbicacionActual() {
  gpsError.value = ''
  if (!navigator.geolocation) {
    gpsError.value = 'Tu navegador no soporta geolocalización.'
    return
  }
  gpsLoading.value = true
  navigator.geolocation.getCurrentPosition(
    (position) => {
      form.lat = position.coords.latitude
      form.lng = position.coords.longitude
      gpsLoading.value = false
    },
    (error) => {
      gpsLoading.value = false
      if      (error.code === error.PERMISSION_DENIED)    gpsError.value = 'Debes permitir el acceso a tu ubicación.'
      else if (error.code === error.POSITION_UNAVAILABLE) gpsError.value = 'No fue posible obtener tu ubicación actual.'
      else if (error.code === error.TIMEOUT)              gpsError.value = 'Se agotó el tiempo para obtener tu ubicación.'
      else                                                gpsError.value = 'No se pudo obtener tu ubicación actual.'
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  )
}

onMounted(async () => {
  if (configStore.departamentos.length === 0) await configStore.fetchCatalogos()
  try {
    const negocio = await negocioAPI.getMiNegocio(auth.user._id)
    negocioId.value = negocio._id
    docRev.value    = negocio._rev

    const deptoClave = getDepartamentoClave(negocio.departamento)
    let distritoClave = getValue(negocio.distrito) || getValue(negocio.municipio)
    if (distritoClave && deptoClave) {
      const distritosDepto = configStore.getDistritosByDepartamento(deptoClave)
      const existe = distritosDepto.some(d => d.value === distritoClave)
      if (!existe) {
        const clave = findDistritoClaveByNombre(distritoClave, deptoClave)
        distritoClave = clave || null
      }
    }

    Object.assign(form, {
      nombre_comercial: negocio.nombre_comercial,
      descripcion:      negocio.descripcion || '',
      categoria:        getValue(negocio.categoria),
      telefono:         negocio.telefono    || '',
      nit_registro:     negocio.nit_registro|| '',
      departamento:     deptoClave,
      distrito:         distritoClave,
      direccion:        negocio.localizacion?.direccion || '',
      lat:              negocio.localizacion?.lat       || 13.7,
      lng:              negocio.localizacion?.lng       || -89.2,
      horario:          negocio.horario || crearHorarioBase()
    })
  } catch {
    console.log('Primer negocio — formulario vacío listo para crear')
  }
})

async function guardar() {
  saving.value = true
  try {
    const updates = {
      nombre_comercial: form.nombre_comercial,
      descripcion:      form.descripcion,
      categoria:        form.categoria,
      telefono:         form.telefono,
      nit_registro:     form.nit_registro,
      departamento:     form.departamento,
      distrito:         form.distrito,
      municipio:        form.distrito,
      horario:          form.horario,
      localizacion: {
        lat:      form.lat,
        lng:      form.lng,
        direccion: form.direccion
      }
    }

    if (portadaFile.value) updates.imagen_portada = portadaFile.value.name

    if (negocioId.value) {
      await negocioAPI.updateNegocio(negocioId.value, docRev.value, updates)
    } else {
      const nuevoNegocio = await negocioAPI.crearNegocio(auth.user._id, updates)
      negocioId.value = nuevoNegocio._id
      docRev.value    = nuevoNegocio._rev
    }

    if (portadaFile.value && negocioId.value) {
      const imgDocId = 'neg_' + negocioId.value
      let imgDoc
      try {
        imgDoc = await couch.get(import.meta.env.VITE_DB_IMAGES, imgDocId)
      } catch {
        imgDoc = await couch.createImageDoc(imgDocId, 'negocio', negocioId.value)
      }
      await couch.uploadImage(imgDocId, imgDoc._rev, portadaFile.value)
    }

    router.push('/negocio/perfil')
  } catch (e) {
    console.error('Error al guardar:', e)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
/* ═══════════════════════════════════════
   CSS VARIABLES — Light & Dark
═══════════════════════════════════════ */
.en-page {
  /* Light mode */
  --en-bg:           #f0faf4;
  --en-surface:      #ffffff;
  --en-surface-alt:  #f6fef9;
  --en-border:       #b7e4c7;
  --en-border-focus: #2d9e5f;
  --en-text:         #0f2d1c;
  --en-text-muted:   #4a7c5e;
  --en-text-label:   #2d7a4f;
  --en-accent:       #22c55e;
  --en-accent-dark:  #16a34a;
  --en-accent-deep:  #15803d;
  --en-gps-bg:       #dcfce7;
  --en-gps-text:     #15803d;
  --en-gps-border:   #86efac;
  --en-section-bg:   #f0fdf4;
  --en-section-border: #bbf7d0;
  --en-blob-1:       rgba(34, 197, 94, 0.12);
  --en-blob-2:       rgba(21, 128, 61, 0.08);
  --en-shadow:       0 4px 24px rgba(22, 163, 74, 0.10);
  --en-shadow-btn:   0 4px 20px rgba(22, 163, 74, 0.35);
  --en-error:        #dc2626;

  min-height: 100vh;
  background-color: var(--en-bg);
  position: relative;
  overflow-x: hidden;
  font-family: 'DM Sans', 'Nunito', sans-serif;
}

/* Dark mode overrides */
.body--dark .en-page {
  --en-bg:           #000000;
  --en-surface:      #0f2318;
  --en-surface-alt:  #111111;
  --en-border:       #1e4d30;
  --en-border-focus: #22c55e;
  --en-text:         #e8fdf0;
  --en-text-muted:   #6ee89a;
  --en-text-label:   #4ade80;
  --en-accent:       #22c55e;
  --en-accent-dark:  #16a34a;
  --en-accent-deep:  #4ade80;
  --en-gps-bg:       #052e16;
  --en-gps-text:     #86efac;
  --en-gps-border:   #166534;
  --en-section-bg:   #0f2318;
  --en-section-border: #1e4d30;
  --en-blob-1:       rgba(34, 197, 94, 0.07);
  --en-blob-2:       rgba(74, 222, 128, 0.05);
  --en-shadow:       0 4px 24px rgba(0, 0, 0, 0.5);
  --en-shadow-btn:   0 4px 20px rgba(34, 197, 94, 0.25);
  --en-error:        #f87171;
}

/* ═══════════════════════════════════════
   Decorative blobs
═══════════════════════════════════════ */
.en-blob {
  position: fixed;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}
.en-blob--1 {
  width: 500px;
  height: 500px;
  top: -120px;
  right: -150px;
  background: var(--en-blob-1);
}
.en-blob--2 {
  width: 400px;
  height: 400px;
  bottom: 60px;
  left: -100px;
  background: var(--en-blob-2);
}

/* ═══════════════════════════════════════
   Container
═══════════════════════════════════════ */
.en-container {
  position: relative;
  z-index: 1;
  max-width: 780px;
  margin: 0 auto;
  padding: 32px 16px 48px;
}

/* ═══════════════════════════════════════
   Header
═══════════════════════════════════════ */
.en-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}
.en-header__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--en-accent), var(--en-accent-dark));
  color: #fff;
  flex-shrink: 0;
  box-shadow: var(--en-shadow-btn);
}
.en-header__title {
  font-size: clamp(1.4rem, 4vw, 1.9rem);
  font-weight: 800;
  color: var(--en-text);
  margin: 0;
  line-height: 1.1;
  letter-spacing: -0.02em;
}
.en-header__subtitle {
  font-size: 0.875rem;
  color: var(--en-text-muted);
  margin: 4px 0 0;
  letter-spacing: 0.01em;
}

/* ═══════════════════════════════════════
   Form
═══════════════════════════════════════ */
.en-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ═══════════════════════════════════════
   Sections (card-like groups)
═══════════════════════════════════════ */
.en-section {
  background: var(--en-surface);
  border: 1px solid var(--en-border);
  border-radius: 18px;
  padding: 24px 20px 20px;
  box-shadow: var(--en-shadow);
  transition: border-color 0.25s, box-shadow 0.25s;
}
.en-section:hover {
  border-color: var(--en-accent);
  box-shadow: 0 6px 32px rgba(34, 197, 94, 0.14);
}

.en-section__label {
  display: inline-flex;
  align-items: center;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--en-text-label);
  background: var(--en-section-bg);
  border: 1px solid var(--en-section-border);
  border-radius: 999px;
  padding: 4px 14px;
  margin-bottom: 20px;
}

/* ═══════════════════════════════════════
   Grid
═══════════════════════════════════════ */
.en-grid {
  display: grid;
  gap: 14px;
}
.en-grid--2 {
  grid-template-columns: 1fr 1fr;
}
.en-grid--span2 {
  grid-column: 1 / -1;
}

@media (max-width: 540px) {
  .en-grid--2 {
    grid-template-columns: 1fr;
  }
  .en-grid--span2 {
    grid-column: 1;
  }
}

/* ═══════════════════════════════════════
   Field wrapper
═══════════════════════════════════════ */
.en-field-wrap {
  display: flex;
  flex-direction: column;
}

/* ═══════════════════════════════════════
   Quasar input overrides — green theme
═══════════════════════════════════════ */
.en-input :deep(.q-field__control) {
  background: var(--en-surface-alt) !important;
  border-radius: 12px !important;
  color: var(--en-text) !important;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.en-input :deep(.q-field__control:before) {
  border-color: var(--en-border) !important;
  border-radius: 12px !important;
  transition: border-color 0.2s;
}
.en-input :deep(.q-field__control:hover:before) {
  border-color: var(--en-accent) !important;
}
.en-input :deep(.q-field--focused .q-field__control:before) {
  border-color: var(--en-border-focus) !important;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.18) !important;
}
.en-input :deep(.q-field__label) {
  color: var(--en-text-muted) !important;
  font-size: 0.875rem !important;
}
.en-input :deep(.q-field--float .q-field__label) {
  color: var(--en-text-label) !important;
}
.en-input :deep(input),
.en-input :deep(textarea) {
  color: var(--en-text) !important;
  caret-color: var(--en-accent) !important;
}
.en-input :deep(.q-field__native) {
  color: var(--en-text) !important;
}

/* Icon color */
.en-input__icon {
  color: var(--en-accent-dark) !important;
}
.body--dark .en-input__icon {
  color: var(--en-accent) !important;
}

/* Quasar select popup (handled globally but ensure legibility) */
.en-input :deep(.q-item__label) {
  color: var(--en-text) !important;
}

/* File input */
.en-file :deep(.q-field__control) {
  cursor: pointer;
}

/* ═══════════════════════════════════════
   GPS button
═══════════════════════════════════════ */
.en-gps-btn {
  background: var(--en-gps-bg) !important;
  color: var(--en-gps-text) !important;
  border: 1.5px solid var(--en-gps-border) !important;
  border-radius: 12px !important;
  font-weight: 600 !important;
  font-size: 0.875rem !important;
  letter-spacing: 0.01em;
  padding: 10px 0 !important;
  transition: filter 0.2s, box-shadow 0.2s;
}
.en-gps-btn:hover {
  filter: brightness(1.06);
  box-shadow: 0 2px 12px rgba(34, 197, 94, 0.2);
}

/* ═══════════════════════════════════════
   Error message
═══════════════════════════════════════ */
.en-error-msg {
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  color: var(--en-error);
  font-weight: 500;
  padding: 4px 8px;
  background: rgba(220, 38, 38, 0.07);
  border-radius: 8px;
}

/* ═══════════════════════════════════════
   Horario
═══════════════════════════════════════ */
.en-horario {
  border-radius: 12px;
  overflow: hidden;
}

/* ═══════════════════════════════════════
   Submit area
═══════════════════════════════════════ */
.en-submit-wrap {
  padding-top: 4px;
}
.en-submit-btn {
  background: linear-gradient(135deg, var(--en-accent), var(--en-accent-dark)) !important;
  color: #fff !important;
  border-radius: 14px !important;
  font-size: 1rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.02em;
  padding: 14px 0 !important;
  box-shadow: var(--en-shadow-btn) !important;
  transition: transform 0.15s, box-shadow 0.15s, filter 0.15s;
}
.en-submit-btn:hover {
  filter: brightness(1.07);
  transform: translateY(-1px);
  box-shadow: 0 8px 28px rgba(22, 163, 74, 0.4) !important;
}
.en-submit-btn:active {
  transform: translateY(0);
}

/* ═══════════════════════════════════════
   Fade transition (GPS error)
═══════════════════════════════════════ */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
