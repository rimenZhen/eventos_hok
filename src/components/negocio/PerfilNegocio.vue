<template>
  <div class="pn-wrap">
    <div class="pn-card" :class="{ 'pn-card--approved': isApproved }">

      <!-- Avatar + info -->
      <div class="pn-main">

        <!-- Avatar -->
        <div class="pn-avatar-wrap">
          <q-avatar size="88px" class="pn-avatar">
            <q-img :src="imageUrl" fit="cover" :alt="businessName" />
          </q-avatar>
          <div v-if="isApproved" class="pn-verified-dot" title="Negocio verificado">
            <q-icon name="verified" size="14px" color="white" />
          </div>
        </div>

        <!-- Texto -->
        <div class="pn-info">
          <div class="pn-name-row">
            <span class="pn-name">{{ businessName }}</span>
            <q-badge v-if="status === 'pendiente'" class="pn-badge-pending">Pendiente</q-badge>
          </div>

          <div class="pn-meta-row">
            <span class="pn-chip" :style="{ '--chip-color': categoryColorHex }">
              <q-icon :name="categoryIcon" size="13px" />
              {{ category }}
            </span>
          </div>

          <div class="pn-details">
            <div v-if="location" class="pn-detail">
              <q-icon name="location_on" size="14px" class="pn-detail__icon" />
              {{ location }}
            </div>
            <div class="pn-detail">
              <q-icon name="phone" size="14px" class="pn-detail__icon" />
              {{ phone }}
            </div>
            <div v-if="lastUpdate" class="pn-detail pn-detail--muted">
              <q-icon name="schedule" size="14px" />
              Actualizado {{ formatRelativeDate(lastUpdate) }}
            </div>
          </div>

          <div class="pn-divider" />

          <p class="pn-description">{{ description }}</p>

          <button class="pn-map-btn" @click="openMapDialog">
            <q-icon name="place" size="15px" class="q-mr-xs" />
            Ver en mapa
          </button>
        </div>

        <!-- Edit button -->
        <div class="pn-edit-wrap">
          <q-btn
            :label="editLabel"
            :icon="editIcon"
            class="pn-edit-btn"
            unelevated
            :to="editRoute"
            @click="$emit('edit')"
          />
        </div>
      </div>
    </div>

    <!-- Map dialog -->
    <q-dialog v-model="showMapDialog">
      <div class="pn-dialog">
        <div class="pn-dialog__header">
          <div class="pn-dialog__title">
            <q-icon name="place" size="20px" class="q-mr-xs" />
            Ubicación del negocio
          </div>
          <button class="pn-dialog__close" v-close-popup>
            <q-icon name="close" size="18px" />
          </button>
        </div>

        <div class="pn-dialog__body">
          <div v-if="hasCoordinates">
            <div class="pn-dialog__meta">
              <q-icon name="location_on" size="14px" class="q-mr-xs" />
              {{ location || 'Sin ubicación textual' }}
            </div>
            <div v-if="lastUpdate" class="pn-dialog__meta">
              <q-icon name="schedule" size="14px" class="q-mr-xs" />
              Última actualización: {{ formatRelativeDate(lastUpdate) }}
            </div>
            <div class="pn-dialog__coords">Lat: {{ mapLat }} · Lng: {{ mapLng }}</div>
            <MapaMini :lat="mapLat" :lng="mapLng" />
          </div>
          <div v-else class="pn-dialog__no-coords">
            <q-icon name="location_off" size="32px" />
            <p>Este negocio aún no tiene coordenadas registradas.</p>
          </div>
        </div>
      </div>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { date } from 'quasar'
import { useConfiguracionStore } from 'src/stores/configuracion'
import { couch } from 'src/api/index'
import MapaMini from 'src/components/MapaMini.vue'

const props = defineProps({
  negocio:   { type: Object, required: true },
  editLabel: { type: String, default: 'Editar Información' },
  editIcon:  { type: String, default: 'edit' },
  editRoute: { type: String, default: '/negocio/editar' }
})
defineEmits(['edit', 'view-map'])

const showMapDialog = ref(false)
const configStore   = useConfiguracionStore()

const businessName = computed(() => props.negocio?.nombre_comercial)

const getDisplayField = (field) => {
  if (!field) return ''
  if (typeof field === 'string') return field
  if (typeof field === 'object') return field.label || field.nombre || field.value || ''
  return String(field)
}

const category = computed(() => getDisplayField(props.negocio?.categoria) || 'Gastronomía')

const location = computed(() => {
  const direccion = props.negocio?.localizacion?.direccion
  if (direccion) return direccion
  const distritoClave    = getDisplayField(props.negocio?.distrito)
  const departamentoClave= getDisplayField(props.negocio?.departamento)
  const distrito    = configStore.getDistritoNombre(distritoClave)
  const departamento= configStore.getDepartamentoNombre(departamentoClave)
  return [distrito, departamento].filter(Boolean).join(', ')
})

const phone      = computed(() => props.negocio?.telefono || '+503 0000-0000')
const status     = computed(() => props.negocio?.estado_solicitud)
const description= computed(() => props.negocio?.descripcion || 'Sin descripción disponible')
const lastUpdate = computed(() => props.negocio?.updated_at || props.negocio?.updatedAt)
const isApproved = computed(() => status.value === 'aprobado')

const normalizeCategory = (v) => (v || '').toString().toLowerCase().trim()

const CATEGORY_META = {
  'gastronomía':       { hex: '#ef4444', icon: 'restaurant' },
  'gastronomia':       { hex: '#ef4444', icon: 'restaurant' },
  'hospedaje':         { hex: '#a855f7', icon: 'hotel' },
  'transporte':        { hex: '#3b82f6', icon: 'directions_bus' },
  'tours':             { hex: '#22c55e', icon: 'map' },
  'tienda de recuerdos':{ hex: '#f97316', icon: 'storefront' },
  'recuerdos':         { hex: '#f97316', icon: 'storefront' },
  'artesanías':        { hex: '#f59e0b', icon: 'palette' },
  'artesanias':        { hex: '#f59e0b', icon: 'palette' },
  'cafetería':         { hex: '#92400e', icon: 'local_cafe' },
  'cafeteria':         { hex: '#92400e', icon: 'local_cafe' }
}

const categoryColorHex = computed(() => CATEGORY_META[normalizeCategory(category.value)]?.hex || '#22c55e')
const categoryIcon     = computed(() => CATEGORY_META[normalizeCategory(category.value)]?.icon || 'category')

const parseCoordinate = (v) => { const p = Number(v); return Number.isFinite(p) ? p : null }
const mapLat = computed(() => parseCoordinate(props.negocio?.localizacion?.lat ?? props.negocio?.lat ?? props.negocio?.latitude))
const mapLng = computed(() => parseCoordinate(props.negocio?.localizacion?.lng ?? props.negocio?.lng ?? props.negocio?.longitude))
const hasCoordinates = computed(() => mapLat.value !== null && mapLng.value !== null)
const openMapDialog = () => { showMapDialog.value = true }

const imageUrl = computed(() => {
  if (props.negocio?.imagen_portada && props.negocio._id)
    return couch.getImageUrl('neg_' + props.negocio._id, props.negocio.imagen_portada)
  return 'https://via.placeholder.com/150?text=Logo'
})

const formatRelativeDate = (dateStr) => {
  if (!dateStr) return '-'
  const sourceDate = new Date(dateStr)
  if (Number.isNaN(sourceDate.getTime())) return '-'
  const now = new Date()
  const diffMinutes = Math.floor((now - sourceDate) / (1000 * 60))
  if (diffMinutes < 1)  return 'ahora mismo'
  if (diffMinutes < 60) return `hace ${diffMinutes} min`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24)   return `hace ${diffHours} h`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1)   return 'hace 1 día'
  if (diffDays < 7)     return `hace ${diffDays} días`
  return date.formatDate(sourceDate, 'DD/MM/YYYY')
}
</script>

<style scoped>
/* ── Variables ── */
.pn-wrap {
  --pn-accent:       #22c55e;
  --pn-accent-dark:  #16a34a;
  --pn-bg:           #ffffff;
  --pn-border:       #b7e4c7;
  --pn-text:         #0f2d1c;
  --pn-text-muted:   #4a7c5e;
  --pn-shadow:       0 4px 24px rgba(22,163,74,0.10);
  --pn-shadow-btn:   0 4px 16px rgba(22,163,74,0.30);
}
.body--dark .pn-wrap {
  --pn-bg:           #0d0d0d;
  --pn-border:       #1e4d30;
  --pn-text:         #e8fdf0;
  --pn-text-muted:   #6ee89a;
  --pn-shadow:       0 4px 24px rgba(0,0,0,0.5);
  --pn-shadow-btn:   0 4px 16px rgba(34,197,94,0.20);
}

/* ── Card ── */
.pn-card {
  background: var(--pn-bg);
  border: 1px solid var(--pn-border);
  border-left: 4px solid var(--pn-accent);
  border-radius: 18px;
  padding: 20px;
  box-shadow: var(--pn-shadow);
  transition: box-shadow 0.25s, border-color 0.25s;
}
.pn-card:hover { box-shadow: 0 8px 32px rgba(34,197,94,0.14); }
.pn-card--approved { border-left-color: var(--pn-accent); }

/* ── Layout ── */
.pn-main {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  flex-wrap: wrap;
}

/* ── Avatar ── */
.pn-avatar-wrap { position: relative; flex-shrink: 0; }
.pn-avatar { border: 3px solid var(--pn-accent); box-shadow: 0 0 0 4px rgba(34,197,94,0.12); }
.pn-verified-dot {
  position: absolute; bottom: 2px; right: 2px;
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--pn-accent);
  display: flex; align-items: center; justify-content: center;
  border: 2px solid var(--pn-bg);
}

/* ── Info block ── */
.pn-info { flex: 1; min-width: 0; }

.pn-name-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }
.pn-name {
  font-size: 1.15rem; font-weight: 800;
  color: var(--pn-text); letter-spacing: -0.01em;
}
.pn-badge-pending {
  background: #fef9c3 !important; color: #854d0e !important;
  font-size: 0.7rem; font-weight: 700; padding: 3px 10px; border-radius: 999px;
}
.body--dark .pn-badge-pending { background: #1c1400 !important; color: #fde68a !important; }

.pn-meta-row { margin-bottom: 10px; }
.pn-chip {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 0.75rem; font-weight: 700;
  color: var(--chip-color, #22c55e);
  background: color-mix(in srgb, var(--chip-color, #22c55e) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--chip-color, #22c55e) 30%, transparent);
  border-radius: 999px; padding: 3px 10px;
}

.pn-details { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
.pn-detail {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.8rem; color: var(--pn-text-muted);
}
.pn-detail__icon { color: var(--pn-accent); }
.pn-detail--muted { opacity: 0.7; font-size: 0.75rem; }

.pn-divider { height: 1px; background: var(--pn-border); margin: 10px 0; }

.pn-description {
  font-size: 0.875rem; color: var(--pn-text-muted);
  line-height: 1.5; margin: 0 0 10px;
}

.pn-map-btn {
  display: inline-flex; align-items: center;
  font-size: 0.8rem; font-weight: 600;
  color: var(--pn-accent-dark);
  background: none; border: none; cursor: pointer; padding: 0;
  transition: color 0.2s;
}
.body--dark .pn-map-btn { color: var(--pn-accent); }
.pn-map-btn:hover { opacity: 0.8; }

/* ── Edit button ── */
.pn-edit-wrap { flex-shrink: 0; align-self: center; }
.pn-edit-btn {
  background: linear-gradient(135deg, var(--pn-accent), var(--pn-accent-dark)) !important;
  color: #fff !important;
  border-radius: 12px !important;
  font-weight: 700 !important;
  font-size: 0.85rem !important;
  box-shadow: var(--pn-shadow-btn) !important;
  transition: filter 0.15s, transform 0.15s;
}
.pn-edit-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }

@media (max-width: 540px) {
  .pn-edit-wrap { width: 100%; }
  .pn-edit-btn { width: 100% !important; }
}

/* ── Dialog ── */
.pn-dialog {
  width: min(720px, 92vw);
  background: var(--pn-bg);
  border: 1px solid var(--pn-border);
  border-radius: 18px;
  overflow: hidden;
}
.pn-dialog__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(34,197,94,0.08), transparent);
  border-bottom: 1px solid var(--pn-border);
}
.pn-dialog__title {
  display: flex; align-items: center;
  font-weight: 700; font-size: 1rem; color: var(--pn-text);
}
.pn-dialog__close {
  background: none; border: none; cursor: pointer;
  color: var(--pn-text-muted); border-radius: 8px; padding: 4px;
  transition: background 0.15s;
}
.pn-dialog__close:hover { background: rgba(34,197,94,0.1); }
.pn-dialog__body { padding: 20px; }
.pn-dialog__meta {
  display: flex; align-items: center;
  font-size: 0.8rem; color: var(--pn-text-muted); margin-bottom: 6px;
}
.pn-dialog__coords {
  font-size: 0.75rem; color: var(--pn-text-muted);
  font-family: monospace; margin-bottom: 14px;
  background: rgba(34,197,94,0.07); padding: 6px 10px; border-radius: 8px;
}
.pn-dialog__no-coords {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 24px;
  color: var(--pn-text-muted); text-align: center;
}
</style>
