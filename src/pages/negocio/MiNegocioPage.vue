<template>
  <q-page class="mn-page">
    <!-- Decorative blobs -->
    <div class="mn-blob mn-blob--1" aria-hidden="true" />
    <div class="mn-blob mn-blob--2" aria-hidden="true" />

    <!-- Loading -->
    <div v-if="loading" class="mn-loading">
      <div class="mn-loading__ring">
        <q-spinner-dots color="positive" size="48px" />
      </div>
      <p class="mn-loading__text">Cargando tu negocio…</p>
    </div>

    <!-- Error -->
    <div v-else-if="!negocioData" class="mn-error">
      <q-icon name="store_mall_directory" size="48px" class="mn-error__icon" />
      <p class="mn-error__text">No se pudo cargar la información del negocio.</p>
    </div>

    <!-- Content -->
    <div v-else class="mn-container">

      <!-- Header -->
      <div class="mn-header">
        <div class="mn-header__icon">
          <q-icon name="storefront" size="26px" />
        </div>
        <div class="mn-header__text">
          <h1 class="mn-header__title">Mi Negocio</h1>
          <p class="mn-header__subtitle">Panel de gestión</p>
        </div>
      </div>

      <!-- Perfil component -->
      <div class="mn-card">
        <PerfilNegocio
          v-if="negocioData"
          :negocio="negocioData"
          editLabel="Editar Información"
          editIcon="edit"
          editRoute="/negocio/editar"
          @edit="handleEditClick"
          @view-map="handleViewMap"
        />
      </div>

      <!-- Información adicional -->
      <div class="mn-card">
        <div class="mn-card__header">
          <q-icon name="info_outline" size="18px" class="mn-card__header-icon" />
          <span>Información Adicional</span>
        </div>

        <div class="mn-info-grid">
          <div class="mn-info-item">
            <span class="mn-info-item__label">
              <q-icon name="badge" size="14px" class="q-mr-xs" />NIT
            </span>
            <span class="mn-info-item__value">{{ negocioData?.nit_registro || '—' }}</span>
          </div>

          <div class="mn-info-item">
            <span class="mn-info-item__label">
              <q-icon name="map" size="14px" class="q-mr-xs" />Departamento
            </span>
            <span class="mn-info-item__value">{{ departamento || '—' }}</span>
          </div>

          <div class="mn-info-item">
            <span class="mn-info-item__label">
              <q-icon name="location_city" size="14px" class="q-mr-xs" />Distrito
            </span>
            <span class="mn-info-item__value">{{ distrito || '—' }}</span>
          </div>

          <div class="mn-info-item">
            <span class="mn-info-item__label">
              <q-icon name="schedule" size="14px" class="q-mr-xs" />Horario
            </span>
            <span class="mn-info-item__value">
              <button
                v-if="negocioData?.horario"
                class="mn-toggle-btn"
                @click="showHorario = !showHorario"
              >
                <q-icon :name="showHorario ? 'expand_less' : 'expand_more'" size="16px" class="q-mr-xs" />
                {{ showHorario ? 'Ocultar horario' : 'Ver horario' }}
              </button>
              <span v-else>No especificado</span>
            </span>
          </div>
        </div>

        <!-- Horario expandible -->
        <transition name="mn-expand">
          <div v-if="showHorario && negocioData?.horario" class="mn-horario-wrap">
            <div class="mn-horario-divider" />
            <HorarioSemanal :model-value="negocioData.horario" readonly />
          </div>
        </transition>
      </div>

      <!-- Estado de aprobación -->
      <div class="mn-card" v-if="estadoSolicitud !== 'aprobado'">
        <div class="mn-card__header">
          <q-icon name="verified_user" size="18px" class="mn-card__header-icon" />
          <span>Estado de Aprobación</span>
        </div>

        <!-- Banner de éxito -->
        <transition name="mn-fade">
          <div v-if="successMessage" class="mn-success-banner">
            <q-icon name="check_circle" size="18px" class="q-mr-sm" />
            {{ successMessage }}
          </div>
        </transition>

        <div class="mn-status-row">
          <!-- Badge de estado -->
          <div class="mn-status-badge-wrap">
            <span class="mn-status-label">Estado actual:</span>
            <span
              class="mn-status-badge"
              :class="{
                'mn-status-badge--approved':  estadoSolicitud === 'aprobado',
                'mn-status-badge--pending':   estadoSolicitud === 'pendiente',
                'mn-status-badge--info':      estadoSolicitud === 'observacion',
                'mn-status-badge--none':      estadoSolicitud === 'sin_solicitud',
              }"
            >
              <span class="mn-status-badge__dot" />
              {{
                estadoSolicitud === 'aprobado'    ? 'Aprobado'       :
                estadoSolicitud === 'pendiente'   ? 'Pendiente'      :
                estadoSolicitud === 'observacion' ? 'En observación' :
                'Sin solicitud'
              }}
            </span>
          </div>

          <!-- Botón de solicitud -->
          <div v-if="estadoSolicitud === 'sin_solicitud' || estadoSolicitud === 'rechazado'" class="mn-approval-wrap">
            <button
              class="mn-approval-btn"
              :class="{ 'mn-approval-btn--disabled': !canSendApproval }"
              :disabled="!canSendApproval || sending"
              @click="handleSendApproval"
            >
              <q-spinner-dots v-if="sending" size="16px" />
              <q-icon v-else name="send" size="16px" class="q-mr-xs" />
              {{ bottonLabel }}
            </button>
            <p v-if="!canSendApproval" class="mn-warning-msg">
              <q-icon name="warning_amber" size="14px" class="q-mr-xs" />
              Completa el campo "Distrito" en tu perfil antes de enviar la solicitud
            </p>
          </div>
        </div>
      </div>

    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { useRouter } from 'vue-router'
import { useConfiguracionStore } from 'src/stores/configuracion'
import { negocioAPI } from 'src/api/negocio'
import { usuariosAPI } from 'src/api/usuarios'
import PerfilNegocio from 'src/components/negocio/PerfilNegocio.vue'
import HorarioSemanal from 'src/components/HorarioSemanal.vue'

const auth        = useAuthStore()
const router      = useRouter()
const configStore = useConfiguracionStore()
const negocio     = ref(null)
const loading     = ref(true)
const showHorario = ref(false)
const sending     = ref(false)
const successMessage = ref('')

const getValue = (val) => {
  if (!val) return null
  if (typeof val === 'object') return val.value || val.clave || null
  return val
}

const departamento = computed(() => {
  const clave = getValue(negocio.value?.departamento)
  return configStore.getDepartamentoNombre(clave)
})

const distrito = computed(() => {
  const clave = getValue(negocio.value?.distrito) || getValue(negocio.value?.municipio)
  return configStore.getDistritoNombre(clave)
})

const estadoSolicitud = computed(() => negocio.value?.estado_solicitud || 'sin_solicitud')
const negocioData     = computed(() => negocio.value)
const canSendApproval = computed(() => distrito.value && distrito.value.trim() !== '')
const bottonLabel     = computed(() => {
  const fueRechazado = negocio.value?.fue_rechazado || false
  return fueRechazado ? 'Apelar solicitud' : 'Enviar solicitud a la alcaldía'
})

const handleEditClick = () => router.push('/negocio/editar')
const handleViewMap   = () => {}

const handleSendApproval = async () => {
  if (!canSendApproval.value) return
  sending.value = true
  try {
    await usuariosAPI.submitNegocioApprovalRequest(auth.user._id)
    successMessage.value = 'Solicitud de aprobación enviada a la alcaldía'
    setTimeout(() => { successMessage.value = '' }, 3000)
    await cargarDatos()
  } catch (e) {
    console.error('Error al enviar solicitud:', e)
  } finally {
    sending.value = false
  }
}

const cargarDatos = async () => {
  try {
    negocio.value = await negocioAPI.getMiNegocio(auth.user._id)
  } catch (e) {
    console.error('Error al cargar negocio:', e)
    negocio.value = null
  }
}

onMounted(async () => {
  try {
    if (configStore.departamentos.length === 0) await configStore.fetchCatalogos()
    await cargarDatos()
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* ═══════════════════════════════════════
   CSS VARIABLES — Light & Dark
═══════════════════════════════════════ */
.mn-page {
  /* Light mode */
  --mn-bg:             #f0faf4;
  --mn-surface:        #ffffff;
  --mn-surface-alt:    #f6fef9;
  --mn-border:         #b7e4c7;
  --mn-text:           #0f2d1c;
  --mn-text-muted:     #4a7c5e;
  --mn-text-label:     #2d7a4f;
  --mn-accent:         #22c55e;
  --mn-accent-dark:    #16a34a;
  --mn-shadow:         0 4px 24px rgba(22, 163, 74, 0.10);
  --mn-shadow-btn:     0 4px 20px rgba(22, 163, 74, 0.32);
  --mn-blob-1:         rgba(34, 197, 94, 0.12);
  --mn-blob-2:         rgba(21, 128, 61, 0.08);
  --mn-badge-approved: #dcfce7;
  --mn-badge-approved-text: #15803d;
  --mn-badge-pending:  #fef9c3;
  --mn-badge-pending-text: #854d0e;
  --mn-badge-info:     #dbeafe;
  --mn-badge-info-text:#1d4ed8;
  --mn-badge-none:     #f3f4f6;
  --mn-badge-none-text:#374151;
  --mn-warning:        #d97706;
  --mn-success-bg:     #dcfce7;
  --mn-success-text:   #15803d;

  min-height: 100vh;
  background-color: var(--mn-bg);
  position: relative;
  overflow-x: hidden;
  font-family: 'DM Sans', 'Nunito', sans-serif;
}

/* Dark mode — fondo negro */
.body--dark .mn-page {
  --mn-bg:             #000000;
  --mn-surface:        #0d0d0d;
  --mn-surface-alt:    #111111;
  --mn-border:         #1e4d30;
  --mn-text:           #e8fdf0;
  --mn-text-muted:     #6ee89a;
  --mn-text-label:     #4ade80;
  --mn-accent:         #22c55e;
  --mn-accent-dark:    #16a34a;
  --mn-shadow:         0 4px 24px rgba(0, 0, 0, 0.6);
  --mn-shadow-btn:     0 4px 20px rgba(34, 197, 94, 0.22);
  --mn-blob-1:         rgba(34, 197, 94, 0.06);
  --mn-blob-2:         rgba(74, 222, 128, 0.04);
  --mn-badge-approved: #052e16;
  --mn-badge-approved-text: #86efac;
  --mn-badge-pending:  #1c1400;
  --mn-badge-pending-text: #fde68a;
  --mn-badge-info:     #0c1a3a;
  --mn-badge-info-text:#93c5fd;
  --mn-badge-none:     #1a1a1a;
  --mn-badge-none-text:#9ca3af;
  --mn-warning:        #fbbf24;
  --mn-success-bg:     #052e16;
  --mn-success-text:   #86efac;
}

/* ═══════════════════════════════════════
   Blobs decorativos
═══════════════════════════════════════ */
.mn-blob {
  position: fixed;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
  z-index: 0;
}
.mn-blob--1 {
  width: 480px; height: 480px;
  top: -100px; right: -130px;
  background: var(--mn-blob-1);
}
.mn-blob--2 {
  width: 360px; height: 360px;
  bottom: 40px; left: -80px;
  background: var(--mn-blob-2);
}

/* ═══════════════════════════════════════
   Loading & Error states
═══════════════════════════════════════ */
.mn-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 16px;
}
.mn-loading__ring {
  width: 80px; height: 80px;
  display: flex; align-items: center; justify-content: center;
  background: var(--mn-surface);
  border-radius: 50%;
  border: 1px solid var(--mn-border);
  box-shadow: var(--mn-shadow);
}
.mn-loading__text {
  color: var(--mn-text-muted);
  font-size: 0.9rem;
  margin: 0;
}
.mn-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 12px;
}
.mn-error__icon { color: var(--mn-text-muted); }
.mn-error__text {
  color: var(--mn-text-muted);
  font-size: 0.95rem;
  margin: 0;
}

/* ═══════════════════════════════════════
   Container
═══════════════════════════════════════ */
.mn-container {
  position: relative;
  z-index: 1;
  max-width: 780px;
  margin: 0 auto;
  padding: 32px 16px 52px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ═══════════════════════════════════════
   Header
═══════════════════════════════════════ */
.mn-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 4px;
}
.mn-header__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px; height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--mn-accent), var(--mn-accent-dark));
  color: #fff;
  flex-shrink: 0;
  box-shadow: var(--mn-shadow-btn);
}
.mn-header__title {
  font-size: clamp(1.4rem, 4vw, 1.9rem);
  font-weight: 800;
  color: var(--mn-text);
  margin: 0;
  line-height: 1.1;
  letter-spacing: -0.02em;
}
.mn-header__subtitle {
  font-size: 0.875rem;
  color: var(--mn-text-muted);
  margin: 4px 0 0;
}

/* ═══════════════════════════════════════
   Cards
═══════════════════════════════════════ */
.mn-card {
  background: var(--mn-surface);
  border: 1px solid var(--mn-border);
  border-radius: 18px;
  padding: 22px 20px;
  box-shadow: var(--mn-shadow);
  transition: border-color 0.25s, box-shadow 0.25s;
}
.mn-card:hover {
  border-color: var(--mn-accent);
  box-shadow: 0 6px 32px rgba(34, 197, 94, 0.12);
}
.mn-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--mn-text-label);
  background: var(--mn-surface-alt);
  border: 1px solid var(--mn-border);
  border-radius: 999px;
  padding: 5px 14px;
  width: fit-content;
  margin-bottom: 18px;
}
.mn-card__header-icon {
  color: var(--mn-accent-dark);
}
.body--dark .mn-card__header-icon {
  color: var(--mn-accent);
}

/* ═══════════════════════════════════════
   Info grid
═══════════════════════════════════════ */
.mn-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 480px) {
  .mn-info-grid { grid-template-columns: 1fr; }
}

.mn-info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  background: var(--mn-surface-alt);
  border: 1px solid var(--mn-border);
  border-radius: 12px;
  transition: border-color 0.2s;
}
.mn-info-item:hover {
  border-color: var(--mn-accent);
}
.mn-info-item__label {
  display: flex;
  align-items: center;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--mn-text-muted);
}
.mn-info-item__value {
  font-size: 0.92rem;
  font-weight: 500;
  color: var(--mn-text);
}

/* Horario toggle button */
.mn-toggle-btn {
  display: inline-flex;
  align-items: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--mn-accent-dark);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;
}
.body--dark .mn-toggle-btn { color: var(--mn-accent); }
.mn-toggle-btn:hover { color: var(--mn-text-label); }

/* Horario expandible */
.mn-horario-divider {
  height: 1px;
  background: var(--mn-border);
  margin: 16px 0;
}
.mn-horario-wrap { overflow: hidden; }

/* ═══════════════════════════════════════
   Status section
═══════════════════════════════════════ */
.mn-success-banner {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--mn-success-bg);
  color: var(--mn-success-text);
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 16px;
  border: 1px solid var(--mn-accent-dark);
}

.mn-status-row {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: space-between;
}
.mn-status-badge-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.mn-status-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--mn-text-muted);
}

/* Estado badges */
.mn-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 5px 14px;
  border-radius: 999px;
  letter-spacing: 0.04em;
}
.mn-status-badge__dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}
.mn-status-badge--approved {
  background: var(--mn-badge-approved);
  color: var(--mn-badge-approved-text);
}
.mn-status-badge--pending {
  background: var(--mn-badge-pending);
  color: var(--mn-badge-pending-text);
}
.mn-status-badge--info {
  background: var(--mn-badge-info);
  color: var(--mn-badge-info-text);
}
.mn-status-badge--none {
  background: var(--mn-badge-none);
  color: var(--mn-badge-none-text);
}

/* Approval button */
.mn-approval-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}
.mn-approval-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, var(--mn-accent), var(--mn-accent-dark));
  color: #fff;
  font-size: 0.875rem;
  font-weight: 700;
  padding: 10px 20px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  box-shadow: var(--mn-shadow-btn);
  transition: filter 0.15s, transform 0.15s, box-shadow 0.15s;
  letter-spacing: 0.02em;
}
.mn-approval-btn:hover:not(.mn-approval-btn--disabled) {
  filter: brightness(1.08);
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(34, 197, 94, 0.38);
}
.mn-approval-btn:active { transform: translateY(0); }
.mn-approval-btn--disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.mn-warning-msg {
  display: flex;
  align-items: center;
  font-size: 0.775rem;
  color: var(--mn-warning);
  font-weight: 500;
  margin: 0;
  text-align: right;
}

/* ═══════════════════════════════════════
   Transitions
═══════════════════════════════════════ */
.mn-fade-enter-active,
.mn-fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.mn-fade-enter-from,
.mn-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.mn-expand-enter-active,
.mn-expand-leave-active {
  transition: opacity 0.3s, max-height 0.4s ease;
  max-height: 600px;
}
.mn-expand-enter-from,
.mn-expand-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
