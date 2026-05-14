<template>
  <q-page class="sol-page">
    <div class="sol-header q-px-md q-pt-md q-pb-sm">
      <div class="row items-center justify-between q-mb-sm">
        <div class="col-12 col-sm-auto">
          <div class="sol-title-group">
            <q-icon name="pending_actions" class="sol-title-icon" size="2rem" />
            <div>
              <div class="sol-title">Solicitudes de Negocios</div>
              <div class="sol-subtitle">Gestión de solicitudes pendientes de aprobación</div>
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-auto q-mt-sm q-mt-sm-none">
          <q-chip icon="circle" color="warning" text-color="white" class="sol-badge-chip">
            {{ solicitudes.length }} pendiente{{ solicitudes.length !== 1 ? 's' : '' }}
          </q-chip>
        </div>
      </div>

      <div class="row q-gutter-sm q-mt-sm">
        <div class="col-12 col-sm-5">
          <q-input
            v-model="busqueda"
            dense
            filled
            placeholder="Buscar por nombre, propietario..."
            class="sol-search"
          >
            <template #prepend><q-icon name="search" /></template>
            <template #append>
              <q-icon v-if="busqueda" name="close" class="cursor-pointer" @click="busqueda = ''" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-sm-3">
          <q-select
            v-model="filtroDistrito"
            :options="distritoOpciones"
            dense
            filled
            clearable
            option-value="value"
            option-label="label"
            emit-value
            map-options
            label="Filtrar por distrito"
            class="sol-select"
          />
        </div>
        <div class="col-12 col-sm-auto q-ml-auto">
          <q-btn
            flat
            dense
            icon="refresh"
            label="Actualizar"
            class="sol-btn-refresh"
            :loading="loading"
            @click="cargarSolicitudes"
          />
        </div>
      </div>
    </div>

    <div v-if="loading" class="q-px-md q-pb-md">
      <div v-for="n in 3" :key="n" class="sol-skeleton q-mb-sm">
        <q-skeleton type="rect" height="72px" class="rounded-borders" />
      </div>
    </div>

    <div v-else-if="solicitudesFiltradas.length === 0" class="sol-empty-state">
      <q-icon name="task_alt" size="4rem" class="sol-empty-icon" />
      <div class="sol-empty-title">Sin solicitudes pendientes</div>
      <div class="sol-empty-desc">
        {{ busqueda || filtroDistrito ? 'No hay resultados para tu búsqueda.' : 'No hay solicitudes pendientes de revisión en tu alcaldía.' }}
      </div>
      <q-btn v-if="busqueda || filtroDistrito" flat label="Limpiar filtros" icon="filter_alt_off" class="sol-btn-clear q-mt-md" @click="limpiarFiltros" />
    </div>

    <div v-else class="sol-cards-grid q-px-md q-pb-lg">
      <transition-group name="sol-card" tag="div" class="sol-grid-inner">
        <div
          v-for="sol in solicitudesFiltradas"
          :key="sol._id"
          class="sol-card"
        >
          <div class="sol-card-header">
            <div class="sol-card-avatar">
              {{ iniciales(sol) }}
            </div>
            <div class="sol-card-info">
              <div class="sol-card-negocio">{{ sol.nombre_comercial || '—' }}</div>
              <div class="sol-card-propietario">
                <q-icon name="person" size="0.9rem" />
                {{ sol.usuario_propietario?.nombres || '' }} {{ sol.usuario_propietario?.apellidos || '' }}
              </div>
            </div>
            <q-chip
              :color="estadoColor(sol.estado_solicitud)"
              text-color="white"
              size="sm"
              class="sol-status-chip"
            >
              {{ estadoLabel(sol.estado_solicitud) }}
            </q-chip>
          </div>

          <div class="sol-card-body">
            <div class="sol-detail-row" v-if="sol.categoria">
              <q-icon name="category" size="0.95rem" />
              <q-chip
                dense
                size="0.75rem"
                text-color="white"
                :style="{ backgroundColor: getCategoriaInfo(sol.categoria).color }"
                class="q-ma-none text-weight-bold"
              >
                {{ getCategoriaInfo(sol.categoria).nombre }}
              </q-chip>
            </div>
            <div class="sol-detail-row">
              <q-icon name="location_city" size="0.95rem" />
              <span>{{ getNombreDepartamento(sol.departamento) || '—' }}</span>
            </div>
            <div class="sol-detail-row">
              <q-icon name="place" size="0.95rem" />
              <span>{{ getNombreDistrito(sol.distrito) || '—' }}</span>
            </div>
            <div class="sol-detail-row" v-if="sol.telefono">
              <q-icon name="phone" size="0.95rem" />
              <span>{{ sol.telefono }}</span>
            </div>
            <div class="sol-detail-row" v-if="sol.usuario_propietario?.correo">
              <q-icon name="email" size="0.95rem" />
              <span class="sol-email">{{ sol.usuario_propietario.correo }}</span>
            </div>
            <div class="sol-detail-row" v-if="sol.nit_registro">
              <q-icon name="badge" size="0.95rem" />
              <span>NIT: {{ sol.nit_registro }}</span>
            </div>
            <div class="sol-detail-row" v-if="sol.fecha_solicitud || sol.updated_at">
              <q-icon name="schedule" size="0.95rem" />
              <span>{{ formatFecha(sol.fecha_solicitud || sol.updated_at) }}</span>
            </div>
          </div>

          <div class="sol-card-actions">
            <q-btn
              unelevated
              dense
              icon="check_circle"
              label="Aprobar"
              class="sol-btn-aprobar"
              @click="confirmarAprobacion(sol)"
            />
            <q-btn
              unelevated
              dense
              icon="rate_review"
              label="Observación"
              class="sol-btn-observacion"
              @click="abrirObservacion(sol)"
            />
            <q-btn
              unelevated
              dense
              icon="cancel"
              label="Rechazar"
              class="sol-btn-rechazar"
              @click="abrirRechazo(sol)"
            />
            <q-btn
              flat
              dense
              round
              icon="visibility"
              class="sol-btn-ver"
              title="Ver detalles"
              @click="verDetalle(sol)"
            />
          </div>
        </div>
      </transition-group>
    </div>

    <!-- Diálogo de confirmación para Aprobación -->
    <q-dialog v-model="dialogAprobar" persistent>
      <q-card class="sol-dialog">
        <q-card-section class="sol-dialog-header">
          <q-icon name="check_circle" size="2rem" class="text-positive" />
          <div class="sol-dialog-title">¿Aprobar solicitud?</div>
        </q-card-section>
        <q-card-section class="sol-dialog-body">
          <div class="sol-dialog-negocio">{{ dialogSol?.nombre_comercial }}</div>
          <div class="sol-dialog-sub">{{ dialogSol?.usuario_propietario?.nombres }} {{ dialogSol?.usuario_propietario?.apellidos }}</div>
          <div class="sol-dialog-info q-mt-sm">
            El negocio pasará a <strong>Administración de Negocios</strong> y quedará activo en la plataforma.
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md q-pt-none">
          <q-btn flat label="Cancelar" v-close-popup class="sol-btn-cancel-dialog" />
          <q-btn unelevated label="Sí, aprobar" class="sol-btn-aprobar" :loading="procesando" @click="ejecutarAprobacion" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Diálogo para Observación -->
    <q-dialog v-model="dialogObservacion" persistent>
      <q-card class="sol-dialog">
        <q-card-section class="sol-dialog-header">
          <q-icon name="rate_review" size="2rem" class="text-warning" />
          <div class="sol-dialog-title">Enviar Observación</div>
        </q-card-section>
        <q-card-section class="sol-dialog-body">
          <div class="sol-dialog-negocio">{{ dialogSol?.nombre_comercial }}</div>
          <q-input
            v-model="observacionTexto"
            type="textarea"
            filled
            label="Observación para el negocio"
            placeholder="Describe los cambios o correcciones requeridas..."
            rows="4"
            class="q-mt-md sol-textarea"
            counter
            maxlength="500"
            :rules="[val => !!val.trim() || 'El motivo es obligatorio']"
          />
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md q-pt-none">
          <q-btn flat label="Cancelar" v-close-popup class="sol-btn-cancel-dialog" />
          <q-btn
            unelevated
            label="Enviar observación"
            icon="send"
            class="sol-btn-observacion"
            :loading="procesando"
            :disable="!observacionTexto.trim()"
            @click="ejecutarObservacion"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Diálogo para Rechazo -->
    <q-dialog v-model="dialogRechazo" persistent>
      <q-card class="sol-dialog">
        <q-card-section class="sol-dialog-header">
          <q-icon name="cancel" size="2rem" class="text-negative" />
          <div class="sol-dialog-title">Rechazar solicitud</div>
        </q-card-section>
        <q-card-section class="sol-dialog-body">
          <div class="sol-dialog-negocio">{{ dialogSol?.nombre_comercial }}</div>
          <div class="sol-dialog-sub">{{ dialogSol?.usuario_propietario?.nombres }} {{ dialogSol?.usuario_propietario?.apellidos }}</div>
          <q-input
            v-model="motivoRechazo"
            type="textarea"
            filled
            label="Motivo del rechazo"
            placeholder="Indica el motivo por el cual se rechaza esta solicitud..."
            rows="4"
            class="q-mt-md sol-textarea"
            counter
            maxlength="500"
            :rules="[val => !!val.trim() || 'El motivo es obligatorio']"
          />
          <div class="sol-dialog-info q-mt-sm">
            El propietario será notificado del rechazo y podrá corregir y reenviar la solicitud.
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md q-pt-none">
          <q-btn flat label="Cancelar" v-close-popup class="sol-btn-cancel-dialog" />
          <q-btn
            unelevated
            label="Sí, rechazar"
            icon="cancel"
            class="sol-btn-rechazar"
            :loading="procesando"
            :disable="!motivoRechazo.trim()"
            @click="ejecutarRechazo"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Diálogo de Detalle -->
    <q-dialog v-model="dialogDetalle">
      <q-card class="sol-dialog sol-dialog-wide">
        <q-card-section class="sol-dialog-header">
          <q-icon name="storefront" size="2rem" class="sol-icon-green" />
          <div class="sol-dialog-title">Detalle del Negocio</div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>
        <q-card-section v-if="dialogSol" class="sol-dialog-body">
          <div class="sol-detail-grid">
            <div class="sol-detail-item">
              <div class="sol-detail-label">Nombre comercial</div>
              <div class="sol-detail-value">{{ dialogSol.nombre_comercial || '—' }}</div>
            </div>
            <div class="sol-detail-item">
              <div class="sol-detail-label">NIT / Registro</div>
              <div class="sol-detail-value">{{ dialogSol.nit_registro || '—' }}</div>
            </div>
            <div class="sol-detail-item">
              <div class="sol-detail-label">Propietario</div>
              <div class="sol-detail-value">{{ dialogSol.usuario_propietario?.nombres }} {{ dialogSol.usuario_propietario?.apellidos }}</div>
            </div>
            <div class="sol-detail-item">
              <div class="sol-detail-label">Correo</div>
              <div class="sol-detail-value">{{ dialogSol.usuario_propietario?.correo || '—' }}</div>
            </div>
            <div class="sol-detail-item">
              <div class="sol-detail-label">Teléfono</div>
              <div class="sol-detail-value">{{ dialogSol.telefono || '—' }}</div>
            </div>
            <div class="sol-detail-item">
              <div class="sol-detail-label">Categoría</div>
              <div class="sol-detail-value">
                <q-chip
                  v-if="dialogSol.categoria"
                  dense
                  text-color="white"
                  :style="{ backgroundColor: getCategoriaInfo(dialogSol.categoria).color }"
                >
                  {{ getCategoriaInfo(dialogSol.categoria).nombre }}
                </q-chip>
                <span v-else>—</span>
              </div>
            </div>
            <div class="sol-detail-item">
              <div class="sol-detail-label">Departamento</div>
              <div class="sol-detail-value">{{ getNombreDepartamento(dialogSol.departamento) || '—' }}</div>
            </div>
            <div class="sol-detail-item">
              <div class="sol-detail-label">Distrito</div>
              <div class="sol-detail-value">{{ getNombreDistrito(dialogSol.distrito) || '—' }}</div>
            </div>
            <div class="sol-detail-item" v-if="dialogSol.localizacion?.direccion">
              <div class="sol-detail-label">Dirección</div>
              <div class="sol-detail-value">{{ dialogSol.localizacion.direccion }}</div>
            </div>
            <div class="sol-detail-item" v-if="dialogSol.fecha_solicitud">
              <div class="sol-detail-label">Fecha de solicitud</div>
              <div class="sol-detail-value">{{ formatFecha(dialogSol.fecha_solicitud) }}</div>
            </div>
          </div>
          <div v-if="dialogSol.descripcion" class="q-mt-md">
            <div class="sol-detail-label">Descripción</div>
            <div class="sol-detail-value q-mt-xs">{{ dialogSol.descripcion }}</div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md q-pt-none">
          <q-btn unelevated icon="check_circle" label="Aprobar" class="sol-btn-aprobar" @click="dialogDetalle = false; confirmarAprobacion(dialogSol)" />
          <q-btn unelevated icon="cancel" label="Rechazar" class="sol-btn-rechazar" @click="dialogDetalle = false; abrirRechazo(dialogSol)" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-inner-loading :showing="procesando" label="Procesando..." />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'
import { useConfiguracionStore } from 'src/stores/configuracion'
import { alcaldiaAPI } from 'src/api/alcaldia'

const $q = useQuasar()
const auth = useAuthStore()
const configStore = useConfiguracionStore()

const solicitudes = ref([])
const loading = ref(false)
const procesando = ref(false)
const busqueda = ref('')
const filtroDistrito = ref(null)

const dialogAprobar = ref(false)
const dialogObservacion = ref(false)
const dialogRechazo = ref(false)
const dialogDetalle = ref(false)
const dialogSol = ref(null)
const observacionTexto = ref('')
const motivoRechazo = ref('')

const getNombreDepartamento = (valor) => configStore.getDepartamentoNombre(valor)
const getNombreDistrito = (valor) => configStore.getDistritoNombre(valor)

function getCategoriaInfo(cat) {
  const clave = (typeof cat === 'object' && cat !== null) ? cat.value : cat
  const label = (typeof cat === 'object' && cat !== null) ? cat.label : cat
  const encontrada = configStore.categoriasNegocios.find(item => item.clave === clave)
  if (encontrada) {
    return { nombre: encontrada.nombre, color: encontrada.color }
  }
  return { nombre: label || cat || 'Sin categoría', color: '#9ca3af' }
}

const distritoOpciones = computed(() => {
  const distritosVistos = new Set()
  return solicitudes.value
    .filter(s => s.distrito)
    .reduce((acc, s) => {
      const nombre = getNombreDistrito(s.distrito)
      if (!distritosVistos.has(s.distrito)) {
        distritosVistos.add(s.distrito)
        acc.push({ value: s.distrito, label: nombre || s.distrito })
      }
      return acc
    }, [])
})

const solicitudesFiltradas = computed(() => {
  return solicitudes.value.filter(sol => {
    const texto = busqueda.value.toLowerCase()
    const catData = getCategoriaInfo(sol.categoria)
    const coincideTexto = !busqueda.value ||
      (sol.nombre_comercial || '').toLowerCase().includes(texto) ||
      catData.nombre.toLowerCase().includes(texto) ||
      (`${sol.usuario_propietario?.nombres || ''} ${sol.usuario_propietario?.apellidos || ''}`).toLowerCase().includes(texto) ||
      (sol.usuario_propietario?.correo || '').toLowerCase().includes(texto)
    const coincideDistrito = !filtroDistrito.value || sol.distrito === filtroDistrito.value
    return coincideTexto && coincideDistrito
  })
})

function iniciales(sol) {
  const n = sol.nombre_comercial || sol.usuario_propietario?.nombres || '?'
  return n.charAt(0).toUpperCase()
}

function estadoColor(estado) {
  return { pendiente: 'warning', aprobado: 'positive', rechazado: 'negative', observacion: 'info' }[estado] || 'grey'
}

function estadoLabel(estado) {
  return { pendiente: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado', observacion: 'Observación' }[estado] || estado
}

function formatFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function limpiarFiltros() {
  busqueda.value = ''
  filtroDistrito.value = null
}

function confirmarAprobacion(sol) {
  dialogSol.value = sol
  dialogAprobar.value = true
}

function abrirObservacion(sol) {
  dialogSol.value = sol
  observacionTexto.value = ''
  dialogObservacion.value = true
}

function abrirRechazo(sol) {
  dialogSol.value = sol
  motivoRechazo.value = ''
  dialogRechazo.value = true
}

function verDetalle(sol) {
  dialogSol.value = sol
  dialogDetalle.value = true
}

async function ejecutarAprobacion() {
  procesando.value = true
  try {
    const alcaldiaData = {
      _id: auth.user._id,
      nombre_institucional: auth.user.detalles?.detalle_alcaldia?.nombre_institucional || '',
      departamento: auth.user.detalles?.detalle_alcaldia?.departamento || '',
      municipio: auth.user.detalles?.detalle_alcaldia?.municipio || ''
    }
    await alcaldiaAPI.cambiarEstadoSolicitud(
      dialogSol.value._id,
      'aprobado',
      alcaldiaData
    )
    solicitudes.value = solicitudes.value.filter(s => s._id !== dialogSol.value._id)
    dialogAprobar.value = false
    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: `"${dialogSol.value.nombre_comercial}" aprobado correctamente.`,
      position: 'top-right',
      timeout: 3500
    })
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Error al aprobar: ' + e.message, position: 'top-right' })
  } finally {
    procesando.value = false
  }
}

async function ejecutarObservacion() {
  procesando.value = true
  try {
    const alcaldiaData = {
      _id: auth.user._id,
      nombre_institucional: auth.user.detalles?.detalle_alcaldia?.nombre_institucional || '',
      departamento: auth.user.detalles?.detalle_alcaldia?.departamento || '',
      municipio: auth.user.detalles?.detalle_alcaldia?.municipio || ''
    }
    await alcaldiaAPI.cambiarEstadoSolicitud(
      dialogSol.value._id,
      'observacion',
      alcaldiaData,
      { motivo: observacionTexto.value.trim() }
    )
    solicitudes.value = solicitudes.value.filter(s => s._id !== dialogSol.value._id)
    dialogObservacion.value = false
    $q.notify({
      type: 'warning',
      icon: 'rate_review',
      message: `Observación enviada a "${dialogSol.value.nombre_comercial}".`,
      position: 'top-right',
      timeout: 3500
    })
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Error al enviar observación: ' + e.message, position: 'top-right' })
  } finally {
    procesando.value = false
  }
}

async function ejecutarRechazo() {
  procesando.value = true
  try {
    const alcaldiaData = {
      _id: auth.user._id,
      nombre_institucional: auth.user.detalles?.detalle_alcaldia?.nombre_institucional || '',
      departamento: auth.user.detalles?.detalle_alcaldia?.departamento || '',
      municipio: auth.user.detalles?.detalle_alcaldia?.municipio || ''
    }
    await alcaldiaAPI.cambiarEstadoSolicitud(
      dialogSol.value._id,
      'rechazado',
      alcaldiaData,
      { motivo: motivoRechazo.value.trim() }
    )
    solicitudes.value = solicitudes.value.filter(s => s._id !== dialogSol.value._id)
    dialogRechazo.value = false
    $q.notify({
      type: 'negative',
      icon: 'cancel',
      message: `Solicitud de "${dialogSol.value.nombre_comercial}" rechazada.`,
      position: 'top-right',
      timeout: 3500
    })
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Error al rechazar: ' + e.message, position: 'top-right' })
  } finally {
    procesando.value = false
  }
}

async function cargarSolicitudes() {
  loading.value = true
  try {
    if (configStore.departamentos.length === 0) await configStore.fetchCatalogos()
    const miAlcaldiaId = auth.user._id
    const miAlcaldiaNombre = auth.user.detalles?.detalle_alcaldia?.nombre_institucional || ''
    const miAlcaldiaMunicipio = auth.user.detalles?.detalle_alcaldia?.municipio || ''

    const distritoAlcaldiaMap = new Map()
    configStore.distritos.forEach(d => {
      if (d.alcaldia) distritoAlcaldiaMap.set(d.clave, d.alcaldia)
    })

    const todas = await alcaldiaAPI.getSolicitudesNegocios()
    const normalize = v => String(v || '').trim().toLowerCase()

    solicitudes.value = todas.filter(sol => {
      const destinoId = sol.alcaldia_destino?._id
      if (destinoId) return destinoId === miAlcaldiaId
      const destinoNombre = sol.alcaldia_destino?.nombre_institucional || ''
      if (destinoNombre) return normalize(destinoNombre) === normalize(miAlcaldiaNombre)
      const distritoClave = sol.distrito || sol.municipio
      if (distritoClave) {
        const alcaldiaDelDistrito = distritoAlcaldiaMap.get(distritoClave)
        return alcaldiaDelDistrito === miAlcaldiaMunicipio
      }
      return false
    })
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Error al cargar solicitudes: ' + e.message })
  } finally {
    loading.value = false
  }
}

onMounted(cargarSolicitudes)
</script>

<style scoped>
/* Tus estilos existentes se mantienen igual (no se han modificado) */
.sol-page {
  --sol-green: #22c55e;
  --sol-green-dark: #16a34a;
  --sol-green-soft: rgba(34,197,94,0.12);
  --sol-green-border: rgba(34,197,94,0.3);
  --sol-radius: 14px;
  --sol-radius-sm: 8px;
  min-height: 100vh;
}

.sol-header {
  border-bottom: 1px solid var(--sol-green-border);
  background: var(--sol-green-soft);
}

.sol-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sol-title-icon { color: var(--sol-green); }
.sol-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--sol-green-dark);
  line-height: 1.2;
}
.body--dark .sol-title { color: var(--sol-green); }
.sol-subtitle { font-size: 0.8rem; opacity: 0.65; }
.sol-badge-chip { font-weight: 600; }

.sol-search :deep(.q-field__control),
.sol-select :deep(.q-field__control) {
  border-radius: var(--sol-radius-sm);
}

.sol-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}
.sol-empty-icon { color: var(--sol-green); opacity: 0.5; }
.sol-empty-title { font-size: 1.15rem; font-weight: 600; margin-top: 12px; }
.sol-empty-desc { opacity: 0.6; margin-top: 6px; max-width: 340px; font-size: 0.9rem; }
.sol-btn-clear { color: var(--sol-green-dark); }
.body--dark .sol-btn-clear { color: var(--sol-green); }

.sol-cards-grid { padding-top: 16px; }
.sol-grid-inner {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.sol-card {
  border-radius: var(--sol-radius);
  border: 1.5px solid var(--sol-green-border);
  background: #ffffff;
  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  display: flex;
  flex-direction: column;
}
.sol-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(34,197,94,0.18);
}
.body--dark .sol-card {
  background: #1e2621;
  border-color: rgba(34,197,94,0.2);
}

.sol-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 14px 10px;
  border-bottom: 1px solid var(--sol-green-border);
  background: var(--sol-green-soft);
}

.sol-card-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--sol-green);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.sol-card-info { flex: 1; min-width: 0; }
.sol-card-negocio {
  font-weight: 700;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sol-card-propietario {
  font-size: 0.78rem;
  opacity: 0.65;
  display: flex;
  align-items: center;
  gap: 3px;
  margin-top: 2px;
}

.sol-status-chip { flex-shrink: 0; }

.sol-card-body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
}

.sol-detail-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  opacity: 0.8;
}
.sol-detail-row .q-icon { color: var(--sol-green); flex-shrink: 0; }
.sol-email { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.sol-card-actions {
  display: flex;
  gap: 6px;
  padding: 10px 14px 12px;
  flex-wrap: wrap;
  border-top: 1px solid var(--sol-green-border);
}

.sol-btn-aprobar {
  background: #16a34a !important;
  color: #fff !important;
  border-radius: var(--sol-radius-sm) !important;
  font-size: 0.78rem !important;
  flex: 1;
}
.sol-btn-rechazar {
  background: #dc2626 !important;
  color: #fff !important;
  border-radius: var(--sol-radius-sm) !important;
  font-size: 0.78rem !important;
  flex: 1;
}
.sol-btn-observacion {
  background: #d97706 !important;
  color: #fff !important;
  border-radius: var(--sol-radius-sm) !important;
  font-size: 0.78rem !important;
  flex: 1;
}
.sol-btn-ver { color: var(--sol-green) !important; }
.sol-btn-refresh {
  color: var(--sol-green-dark) !important;
  border: 1px solid var(--sol-green-border);
  border-radius: var(--sol-radius-sm) !important;
}
.body--dark .sol-btn-refresh { color: var(--sol-green) !important; }
.sol-btn-cancel-dialog { color: inherit !important; opacity: 0.7; }

.sol-dialog {
  min-width: 320px;
  max-width: 480px;
  border-radius: var(--sol-radius) !important;
  background: #ffffff;
}
.body--dark .sol-dialog { background: #1e2621 !important; }
.sol-dialog-wide { max-width: 580px; min-width: 340px; }

.sol-dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--sol-green-border);
}
.sol-dialog-title { font-size: 1.05rem; font-weight: 700; }
.sol-dialog-body { padding-top: 12px; }
.sol-dialog-negocio { font-weight: 700; font-size: 1rem; }
.sol-dialog-sub { opacity: 0.65; font-size: 0.85rem; }
.sol-dialog-info { font-size: 0.85rem; opacity: 0.75; line-height: 1.5; }

.sol-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 16px;
}
.sol-detail-label { font-size: 0.72rem; opacity: 0.55; text-transform: uppercase; letter-spacing: 0.04em; }
.sol-detail-value { font-size: 0.88rem; font-weight: 500; margin-top: 2px; }

.sol-icon-green { color: var(--sol-green) !important; }
.sol-textarea :deep(.q-field__control) { border-radius: var(--sol-radius-sm); }

.sol-card-enter-active, .sol-card-leave-active { transition: all 0.28s ease; }
.sol-card-enter-from, .sol-card-leave-to { opacity: 0; transform: translateY(10px); }

@media (max-width: 599px) {
  .sol-grid-inner { grid-template-columns: 1fr; }
  .sol-card-actions { flex-direction: column; }
  .sol-btn-aprobar, .sol-btn-rechazar, .sol-btn-observacion { flex: unset; width: 100%; }
  .sol-detail-grid { grid-template-columns: 1fr; }
  .sol-dialog { min-width: unset; width: 95vw; }
}
</style>
