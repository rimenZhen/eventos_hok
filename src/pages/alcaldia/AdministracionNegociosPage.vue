<template>
  <q-page class="adm-page">
    <div class="adm-header q-px-md q-pt-md q-pb-sm">
      <div class="row items-center justify-between q-mb-sm">
        <div class="col-12 col-sm-auto">
          <div class="adm-title-group">
            <q-icon name="store" class="adm-title-icon" size="2rem" />
            <div>
              <div class="adm-title">Administración de Negocios</div>
              <div class="adm-subtitle">Negocios aprobados bajo tu alcaldía</div>
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-auto q-mt-sm q-mt-sm-none">
          <q-chip icon="check_circle" color="positive" text-color="white" class="adm-badge-chip">
            {{ negocios.length }} negocio{{ negocios.length !== 1 ? 's' : '' }}
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
            class="adm-search"
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
            class="adm-select"
          />
        </div>
        <div class="col-12 col-sm-auto">
          <q-select
            v-model="filtroEstado"
            :options="estadoOpciones"
            dense
            filled
            clearable
            option-value="value"
            option-label="label"
            emit-value
            map-options
            label="Estado"
            class="adm-select"
          />
        </div>
        <div class="col-12 col-sm-auto q-ml-auto">
          <q-btn
            flat dense
            icon="refresh"
            label="Actualizar"
            class="adm-btn-refresh"
            :loading="loading"
            @click="cargarNegocios"
          />
        </div>
      </div>
    </div>

    <div class="adm-stats-strip q-px-md q-py-sm row q-gutter-sm" v-if="!loading">
      <q-chip
        v-for="stat in estadisticas"
        :key="stat.label"
        :icon="stat.icon"
        :color="stat.color"
        text-color="white"
        size="sm"
        class="adm-stat-chip"
      >
        {{ stat.valor }} {{ stat.label }}
      </q-chip>
    </div>

    <div v-if="loading" class="q-px-md q-pb-md">
      <div v-for="n in 4" :key="n" class="q-mb-sm">
        <q-skeleton type="rect" height="80px" class="rounded-borders" />
      </div>
    </div>

    <div v-else-if="negociosFiltrados.length === 0" class="adm-empty-state">
      <q-icon name="store_mall_directory" size="4rem" class="adm-empty-icon" />
      <div class="adm-empty-title">Sin negocios registrados</div>
      <div class="adm-empty-desc">
        {{ busqueda || filtroDistrito || filtroEstado ? 'No hay resultados para tu búsqueda.' : 'Los negocios aprobados aparecerán aquí.' }}
      </div>
      <q-btn v-if="busqueda || filtroDistrito || filtroEstado" flat label="Limpiar filtros" icon="filter_alt_off" class="adm-btn-clear q-mt-md" @click="limpiarFiltros" />
    </div>

    <div v-else class="adm-cards-grid q-px-md q-pb-lg">
      <transition-group name="adm-card" tag="div" class="adm-grid-inner">
        <div
          v-for="neg in negociosFiltrados"
          :key="neg._id"
          class="adm-card"
        >
          <div class="adm-card-state-bar" :class="`adm-state-${neg.estado || 'activo'}`"></div>

          <div class="adm-card-header">
            <div class="adm-card-avatar" :style="avatarStyle(neg)">
              {{ iniciales(neg) }}
            </div>
            <div class="adm-card-info">
              <div class="adm-card-nombre">{{ neg.nombre_comercial || '—' }}</div>
              <div class="adm-card-propietario">
                <q-icon name="person" size="0.85rem" />
                {{ neg.usuario_propietario?.nombres || '' }} {{ neg.usuario_propietario?.apellidos || '' }}
              </div>
            </div>
            <q-chip
              :color="estadoColor(neg.estado)"
              text-color="white"
              size="sm"
              class="adm-status-chip"
            >
              {{ estadoLabel(neg.estado) }}
            </q-chip>
          </div>

          <div class="adm-card-body">
            <div class="adm-meta-row" v-if="neg.categoria">
              <q-icon name="category" size="0.9rem" />
              <q-chip
                dense
                size="0.75rem"
                text-color="white"
                :style="{ backgroundColor: getCategoriaInfo(neg.categoria).color }"
                class="q-ma-none text-weight-bold"
              >
                {{ getCategoriaInfo(neg.categoria).nombre }}
              </q-chip>
            </div>
            <div class="adm-meta-row">
              <q-icon name="place" size="0.9rem" />
              <span>{{ getNombreDistrito(neg.distrito || neg.municipio) || '—' }}</span>
            </div>
            <div class="adm-meta-row" v-if="neg.telefono">
              <q-icon name="phone" size="0.9rem" />
              <span>{{ neg.telefono }}</span>
            </div>
            <div class="adm-meta-row" v-if="neg.usuario_propietario?.correo">
              <q-icon name="email" size="0.9rem" />
              <span class="adm-email">{{ neg.usuario_propietario.correo }}</span>
            </div>
            <div class="adm-meta-row" v-if="neg.estado === 'suspendido' && neg.motivo_suspension">
              <q-icon name="info" size="0.9rem" class="text-negative" />
              <span class="text-negative">Motivo: {{ neg.motivo_suspension }}</span>
            </div>
          </div>

          <div class="adm-card-actions">
            <q-btn flat dense icon="visibility" round class="adm-btn-icon" title="Ver perfil" @click="$router.push('/negocio/' + neg._id)" />
            <q-btn flat dense icon="block" round class="adm-btn-icon adm-btn-suspend" title="Suspender" @click="confirmarSuspender(neg)" v-if="neg.estado === 'activo'" />
            <q-btn flat dense icon="check_circle" round class="adm-btn-icon adm-btn-activate" title="Reactivar" @click="cambiarEstadoNegocio(neg, 'activo')" v-if="neg.estado === 'suspendido'" />
            <q-btn flat dense icon="info" round class="adm-btn-icon adm-btn-detail" title="Ver detalles" @click="verDetalle(neg)" />
            <q-btn flat dense icon="email" round class="adm-btn-icon adm-btn-email" title="Copiar correo" @click="copiarCorreo(neg)" v-if="neg.usuario_propietario?.correo" />
            <q-space />
            <div class="adm-fecha" v-if="neg.fecha_creacion">
              <q-icon name="event" size="0.75rem" />
              {{ formatFechaCorta(neg.fecha_creacion) }}
            </div>
          </div>
        </div>
      </transition-group>
    </div>

    <q-dialog v-model="dialogDetalle">
      <q-card class="adm-dialog">
        <q-card-section class="adm-dialog-header">
          <q-icon name="store" size="2rem" class="adm-icon-green" />
          <div class="adm-dialog-title">Perfil del Negocio</div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>
        <q-card-section v-if="negocioActivo" class="adm-dialog-body">
          <div class="adm-detail-grid">
            <div class="adm-detail-item">
              <div class="adm-detail-label">Nombre comercial</div>
              <div class="adm-detail-value">{{ negocioActivo.nombre_comercial || '—' }}</div>
            </div>
            <div class="adm-detail-item">
              <div class="adm-detail-label">NIT / Registro</div>
              <div class="adm-detail-value">{{ negocioActivo.nit_registro || '—' }}</div>
            </div>
            <div class="adm-detail-item">
              <div class="adm-detail-label">Propietario</div>
              <div class="adm-detail-value">{{ negocioActivo.usuario_propietario?.nombres }} {{ negocioActivo.usuario_propietario?.apellidos }}</div>
            </div>
            <div class="adm-detail-item">
              <div class="adm-detail-label">Correo</div>
              <div class="adm-detail-value">{{ negocioActivo.usuario_propietario?.correo || '—' }}</div>
            </div>
            <div class="adm-detail-item">
              <div class="adm-detail-label">Teléfono</div>
              <div class="adm-detail-value">{{ negocioActivo.telefono || '—' }}</div>
            </div>
            <div class="adm-detail-item">
              <div class="adm-detail-label">Categoría</div>
              <div class="adm-detail-value">
                <q-chip
                  v-if="negocioActivo.categoria"
                  dense
                  text-color="white"
                  :style="{ backgroundColor: getCategoriaInfo(negocioActivo.categoria).color }"
                >
                  {{ getCategoriaInfo(negocioActivo.categoria).nombre }}
                </q-chip>
                <span v-else>—</span>
              </div>
            </div>
            <div class="adm-detail-item">
              <div class="adm-detail-label">Distrito</div>
              <div class="adm-detail-value">{{ getNombreDistrito(negocioActivo.distrito) || '—' }}</div>
            </div>
            <div class="adm-detail-item">
              <div class="adm-detail-label">Estado</div>
              <div class="adm-detail-value">
                <q-chip :color="estadoColor(negocioActivo.estado)" text-color="white" size="sm">
                  {{ estadoLabel(negocioActivo.estado) }}
                </q-chip>
              </div>
            </div>
            <div class="adm-detail-item" v-if="negocioActivo.localizacion?.direccion">
              <div class="adm-detail-label">Dirección</div>
              <div class="adm-detail-value">{{ negocioActivo.localizacion.direccion }}</div>
            </div>
            <div class="adm-detail-item" v-if="negocioActivo.fecha_creacion">
              <div class="adm-detail-label">Fecha de aprobación</div>
              <div class="adm-detail-value">{{ formatFecha(negocioActivo.fecha_creacion) }}</div>
            </div>
          </div>
          <div v-if="negocioActivo.descripcion" class="q-mt-md">
            <div class="adm-detail-label">Descripción</div>
            <div class="adm-detail-value q-mt-xs">{{ negocioActivo.descripcion }}</div>
          </div>
          <div v-if="negocioActivo.catalogo?.length" class="q-mt-md">
            <div class="adm-detail-label q-mb-xs">Catálogo ({{ negocioActivo.catalogo.length }} productos)</div>
            <div class="adm-catalogo-list">
              <div v-for="(item, i) in negocioActivo.catalogo.slice(0, 5)" :key="i" class="adm-catalogo-item">
                <q-icon name="inventory_2" size="0.85rem" class="adm-icon-green" />
                <span>{{ item.nombre || item.name || `Producto ${i + 1}` }}</span>
                <span v-if="item.precio" class="adm-precio">${{ item.precio }}</span>
              </div>
              <div v-if="negocioActivo.catalogo.length > 5" class="adm-catalogo-more">
                +{{ negocioActivo.catalogo.length - 5 }} más
              </div>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md q-pt-none">
          <q-btn unelevated icon="open_in_new" label="Ver perfil completo" class="adm-btn-ver-full" @click="dialogDetalle = false; $router.push('/negocio/' + negocioActivo._id)" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dialogSuspender" persistent>
      <q-card class="adm-dialog">
        <q-card-section class="adm-dialog-header">
          <q-icon name="block" size="2rem" class="text-negative" />
          <div class="adm-dialog-title">¿Suspender negocio?</div>
        </q-card-section>
        <q-card-section class="adm-dialog-body">
          <div class="adm-dialog-negocio">{{ negocioActivo?.nombre_comercial }}</div>
          <div class="adm-dialog-info q-mt-sm">
            El negocio dejará de ser visible en la plataforma. Podrás reactivarlo en cualquier momento.
          </div>
          <q-input
            v-model="motivoSuspension"
            type="textarea"
            filled
            label="Motivo (opcional)"
            rows="3"
            class="q-mt-md adm-textarea"
          />
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md q-pt-none">
          <q-btn flat label="Cancelar" v-close-popup class="adm-btn-cancel" />
          <q-btn unelevated icon="block" label="Suspender" class="adm-btn-rechazar" :loading="procesando" @click="ejecutarSuspension" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'
import { useConfiguracionStore } from 'src/stores/configuracion'
import { alcaldiaAPI } from 'src/api/alcaldia'
import { negocioAPI } from 'src/api/negocio'

const $q = useQuasar()
const auth = useAuthStore()
const configStore = useConfiguracionStore()

const negocios = ref([])
const loading = ref(false)
const procesando = ref(false)
const busqueda = ref('')
const filtroDistrito = ref(null)
const filtroEstado = ref(null)
const dialogDetalle = ref(false)
const dialogSuspender = ref(false)
const negocioActivo = ref(null)
const motivoSuspension = ref('')

const getNombreDistrito = (valor) => configStore.getDistritoNombre(valor)

/**
 * CORRECCIÓN: Función para procesar categorías
 * Resuelve el problema del objeto JSON y busca el color en el catálogo.
 */
function getCategoriaInfo(cat) {
  // Manejar si cat es un objeto {"label": "...", "value": "..."} o un string
  const clave = (typeof cat === 'object' && cat !== null) ? cat.value : cat
  const label = (typeof cat === 'object' && cat !== null) ? cat.label : cat

  // Buscar en las categorías de negocios de la store
  const encontrada = configStore.categoriasNegocios.find(item => item.clave === clave)

  if (encontrada) {
    return {
      nombre: encontrada.nombre,
      color: encontrada.color // Color definido en categorias.json
    }
  }

  // Retorno por defecto si no se encuentra (Gris)
  return {
    nombre: label || cat || 'Sin categoría',
    color: '#9ca3af'
  }
}

const estadoOpciones = [
  { value: 'activo', label: 'Activo' },
  { value: 'suspendido', label: 'Suspendido' },
  { value: 'inactivo', label: 'Inactivo' }
]

const distritoOpciones = computed(() => {
  const vistos = new Set()
  return negocios.value
    .filter(n => n.distrito || n.municipio)
    .reduce((acc, n) => {
      const clave = n.distrito || n.municipio
      if (!vistos.has(clave)) {
        vistos.add(clave)
        acc.push({ value: clave, label: getNombreDistrito(clave) || clave })
      }
      return acc
    }, [])
})

const negociosFiltrados = computed(() => {
  return negocios.value.filter(neg => {
    const texto = busqueda.value.toLowerCase()
    const catData = getCategoriaInfo(neg.categoria)

    const coincideTexto = !busqueda.value ||
      (neg.nombre_comercial || '').toLowerCase().includes(texto) ||
      (catData.nombre.toLowerCase().includes(texto)) ||
      (`${neg.usuario_propietario?.nombres || ''} ${neg.usuario_propietario?.apellidos || ''}`).toLowerCase().includes(texto)

    const coincideDistrito = !filtroDistrito.value || (neg.distrito || neg.municipio) === filtroDistrito.value
    const coincideEstado = !filtroEstado.value || neg.estado === filtroEstado.value
    return coincideTexto && coincideDistrito && coincideEstado
  })
})

const estadisticas = computed(() => [
  { label: 'activos', valor: negocios.value.filter(n => n.estado === 'activo').length, icon: 'check_circle', color: 'positive' },
  { label: 'suspendidos', valor: negocios.value.filter(n => n.estado === 'suspendido').length, icon: 'block', color: 'negative' },
  {
    label: 'categorías',
    valor: new Set(negocios.value.map(n => getCategoriaInfo(n.categoria).nombre).filter(n => n !== 'Sin categoría')).size,
    icon: 'category',
    color: 'primary'
  }
])

function iniciales(neg) {
  return (neg.nombre_comercial || '?').charAt(0).toUpperCase()
}

const avatarColors = ['#16a34a', '#15803d', '#166534', '#4ade80', '#22c55e']
function avatarStyle(neg) {
  const idx = (neg.nombre_comercial || '').charCodeAt(0) % avatarColors.length
  return { background: avatarColors[idx] }
}

function estadoColor(estado) {
  return { activo: 'positive', suspendido: 'negative', inactivo: 'grey', pendiente: 'warning' }[estado] || 'grey'
}

function estadoLabel(estado) {
  return { activo: 'Activo', suspendido: 'Suspendido', inactivo: 'Inactivo', pendiente: 'Pendiente' }[estado] || estado || 'Activo'
}

function formatFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatFechaCorta(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: '2-digit' })
}

function limpiarFiltros() {
  busqueda.value = ''
  filtroDistrito.value = null
  filtroEstado.value = null
}

function verDetalle(neg) {
  negocioActivo.value = neg
  dialogDetalle.value = true
}

function confirmarSuspender(neg) {
  negocioActivo.value = neg
  motivoSuspension.value = ''
  dialogSuspender.value = true
}

async function ejecutarSuspension() {
  procesando.value = true;
  try {
    await negocioAPI.updateNegocio(negocioActivo.value._id, negocioActivo.value._rev, {
      estado: 'suspendido',
      motivo_suspension: motivoSuspension.value.trim() || null
    });
    // actualizar localmente
    const idx = negocios.value.findIndex(n => n._id === negocioActivo.value._id);
    if (idx !== -1) {
      negocios.value[idx] = {
        ...negocios.value[idx],
        estado: 'suspendido',
        motivo_suspension: motivoSuspension.value.trim() || null
      };
    }
    dialogSuspender.value = false;
    $q.notify({ type: 'warning', icon: 'block', message: `"${negocioActivo.value.nombre_comercial}" suspendido.`, position: 'top-right' });
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Error al suspender: ' + e.message });
  } finally {
    procesando.value = false;
  }
}

async function cambiarEstadoNegocio(neg, nuevoEstado) {
  try {
    const updates = { estado: nuevoEstado };
    if (nuevoEstado === 'activo') {
      updates.motivoSuspension = null;   // limpia el motivo al reactivar
    }
    await negocioAPI.updateNegocio(neg._id, neg._rev, { estado: nuevoEstado })
    const idx = negocios.value.findIndex(n => n._id === neg._id)
    if (idx !== -1) negocios.value[idx] = { ...negocios.value[idx], estado: nuevoEstado, motivo_suspension: null }
    $q.notify({ type: 'positive', icon: 'check_circle', message: `"${neg.nombre_comercial}" reactivado.`, position: 'top-right', timeout: 3000 })
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Error: ' + e.message, position: 'top-right' })
  }
}

async function copiarCorreo(neg) {
  const correo = neg.usuario_propietario?.correo
  if (!correo) return
  await navigator.clipboard.writeText(correo)
  $q.notify({ type: 'positive', icon: 'content_copy', message: `Correo copiado: ${correo}`, position: 'top-right', timeout: 2000 })
}

async function cargarNegocios() {
  loading.value = true
  try {
    // IMPORTANTE: Asegurar que los catálogos estén en la store para obtener los colores
    if (configStore.departamentos.length === 0) await configStore.fetchCatalogos()

    const todos = await alcaldiaAPI.getNegociosAprobados()
    const miAlcaldiaId = auth.user._id
    const miAlcaldiaNombre = auth.user.detalles?.detalle_alcaldia?.nombre_institucional || ''
    const miAlcaldiaMunicipio = auth.user.detalles?.detalle_alcaldia?.municipio || ''
    const distritoAlcaldiaMap = new Map()

    configStore.distritos.forEach(d => {
      if (d.alcaldia) distritoAlcaldiaMap.set(d.clave, d.alcaldia)
    })

    const normalize = v => String(v || '').trim().toLowerCase()
    negocios.value = todos.filter(neg => {
      const aprobadoraId = neg.alcaldia_aprobadora?._id
      if (aprobadoraId) return aprobadoraId === miAlcaldiaId
      const aprobadoraNombre = neg.alcaldia_aprobadora?.nombre_institucional || ''
      if (aprobadoraNombre) return normalize(aprobadoraNombre) === normalize(miAlcaldiaNombre)
      const distritoClave = neg.distrito || neg.municipio
      return distritoClave && distritoAlcaldiaMap.get(distritoClave) === miAlcaldiaMunicipio
    })
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Error al cargar negocios: ' + e.message })
    negocios.value = []
  } finally {
    loading.value = false
  }
}

onMounted(cargarNegocios)
</script>

<style scoped>
/* Estilos existentes se mantienen igual */
.adm-page {
  --adm-green: #22c55e;
  --adm-green-dark: #16a34a;
  --adm-green-soft: rgba(34,197,94,0.10);
  --adm-green-border: rgba(34,197,94,0.25);
  --adm-radius: 14px;
  --adm-radius-sm: 8px;
  min-height: 100vh;
}

.adm-header {
  border-bottom: 1px solid var(--adm-green-border);
  background: var(--adm-green-soft);
}

.adm-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.adm-title-icon { color: var(--adm-green); }
.adm-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--adm-green-dark);
  line-height: 1.2;
}
.body--dark .adm-title { color: var(--adm-green); }
.adm-subtitle { font-size: 0.8rem; opacity: 0.65; }
.adm-badge-chip { font-weight: 600; }

.adm-stats-strip {
  background: var(--adm-green-soft);
  border-bottom: 1px solid var(--adm-green-border);
}
.adm-stat-chip { font-weight: 600; }

.adm-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}
.adm-empty-icon { color: var(--adm-green); opacity: 0.4; }
.adm-empty-title { font-size: 1.1rem; font-weight: 600; margin-top: 12px; }
.adm-empty-desc { opacity: 0.6; margin-top: 6px; max-width: 340px; font-size: 0.9rem; }
.adm-btn-clear { color: var(--adm-green-dark); }
.body--dark .adm-btn-clear { color: var(--adm-green); }

.adm-cards-grid { padding-top: 16px; }
.adm-grid-inner {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 16px;
}

.adm-card {
  border-radius: var(--adm-radius);
  border: 1.5px solid var(--adm-green-border);
  background: #fff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.adm-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(34,197,94,0.16);
}
.body--dark .adm-card {
  background: #1a2118;
  border-color: rgba(34,197,94,0.18);
}

.adm-card-state-bar {
  height: 4px;
  width: 100%;
}
.adm-state-activo { background: #22c55e; }
.adm-state-suspendido { background: #ef4444; }
.adm-state-inactivo { background: #9ca3af; }
.adm-state-pendiente { background: #f59e0b; }

.adm-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px 10px;
  border-bottom: 1px solid var(--adm-green-border);
}

.adm-card-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.adm-card-info { flex: 1; min-width: 0; }
.adm-card-nombre {
  font-weight: 700;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.adm-card-propietario {
  font-size: 0.78rem;
  opacity: 0.6;
  display: flex;
  align-items: center;
  gap: 3px;
  margin-top: 2px;
}
.adm-status-chip { flex-shrink: 0; }

.adm-card-body {
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
}

.adm-meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  opacity: 0.75;
}
.adm-meta-row .q-icon { color: var(--adm-green); flex-shrink: 0; }
.adm-email { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.adm-card-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 10px 10px;
  border-top: 1px solid var(--adm-green-border);
}

.adm-btn-icon { color: var(--adm-green) !important; }
.adm-btn-suspend { color: #ef4444 !important; }
.adm-btn-activate { color: #22c55e !important; }
.adm-btn-detail { color: #3b82f6 !important; }
.adm-btn-email { color: #8b5cf6 !important; }

.adm-fecha {
  font-size: 0.72rem;
  opacity: 0.5;
  display: flex;
  align-items: center;
  gap: 3px;
}

.adm-btn-refresh {
  color: var(--adm-green-dark) !important;
  border: 1px solid var(--adm-green-border);
  border-radius: var(--adm-radius-sm) !important;
}
.body--dark .adm-btn-refresh { color: var(--adm-green) !important; }

.adm-dialog {
  min-width: 320px;
  max-width: 560px;
  border-radius: var(--adm-radius) !important;
  background: #fff;
}
.body--dark .adm-dialog { background: #1a2118 !important; }

.adm-dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--adm-green-border);
}
.adm-dialog-title { font-size: 1.05rem; font-weight: 700; }
.adm-dialog-body { padding-top: 12px; }
.adm-dialog-negocio { font-weight: 700; font-size: 1rem; }
.adm-dialog-info { font-size: 0.85rem; opacity: 0.7; line-height: 1.5; }

.adm-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 16px;
}
.adm-detail-label { font-size: 0.72rem; opacity: 0.55; text-transform: uppercase; letter-spacing: 0.04em; }
.adm-detail-value { font-size: 0.88rem; font-weight: 500; margin-top: 2px; }

.adm-icon-green { color: var(--adm-green) !important; }

.adm-catalogo-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--adm-green-soft);
  border-radius: var(--adm-radius-sm);
  padding: 8px 10px;
}
.adm-catalogo-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
}
.adm-precio {
  margin-left: auto;
  font-weight: 600;
  color: var(--adm-green-dark);
}
.body--dark .adm-precio { color: var(--adm-green); }
.adm-catalogo-more {
  font-size: 0.78rem;
  opacity: 0.55;
  text-align: center;
  padding-top: 4px;
}

.adm-btn-rechazar {
  background: #dc2626 !important;
  color: #fff !important;
  border-radius: var(--adm-radius-sm) !important;
}
.adm-btn-cancel {
  color: inherit !important;
  opacity: 0.7;
}
.adm-btn-ver-full {
  background: var(--adm-green-dark) !important;
  color: #fff !important;
  border-radius: var(--adm-radius-sm) !important;
}

.adm-textarea :deep(.q-field__control) {
  border-radius: var(--adm-radius-sm);
}

.adm-card-enter-active, .adm-card-leave-active { transition: all 0.28s ease; }
.adm-card-enter-from, .adm-card-leave-to { opacity: 0; transform: translateY(10px); }

@media (max-width: 599px) {
  .adm-grid-inner { grid-template-columns: 1fr; }
  .adm-detail-grid { grid-template-columns: 1fr; }
  .adm-dialog { min-width: unset; width: 95vw; }
}
</style>
