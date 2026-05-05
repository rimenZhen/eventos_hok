<template>
  <q-card class="business-profile q-pa-md shadow-1" :class="{ 'border-approved': isApproved }">

    <div class="row items-center no-wrap">

      <!-- Avatar -->
      <q-avatar size="90px" class="shadow-2">
        <q-img :src="imageUrl" fit="cover" :alt="businessName" />
      </q-avatar>

      <!-- Contenido -->
      <div class="col q-ml-md">

        <!-- Nombre + estado -->
        <div class="row items-center q-gutter-x-sm">
          <div class="text-h6 text-weight-bold">
            {{ businessName }}
          </div>

          <!-- Estado -->
          <q-icon
            v-if="status === 'aprobado'"
            name="verified"
            color="primary"
            size="sm"
          />

          <q-badge v-else-if="status === 'pendiente'" color="warning">
            Pendiente
          </q-badge>
        </div>

        <!-- Categoría -->
        <div class="text-caption q-mt-xs text-grey-7">
          <q-icon :name="categoryIcon" size="xs" class="q-mr-xs" :color="categoryColor" />
          <span :style="{ color: categoryColor }">{{ category }}</span>
        </div>

        <!-- Ubicación -->
        <div v-if="location" class="text-grey-7 text-caption q-mt-xs">
          <q-icon name="location_on" size="xs" class="q-mr-xs" />
          {{ location }}
        </div>

        <!-- Teléfono -->
        <div class="text-grey-8 text-caption q-mt-xs">
          <q-icon name="phone" size="xs" class="q-mr-xs" />
          {{ phone }}
        </div>

        <!-- Última actualización -->
        <div v-if="lastUpdate" class="text-grey-6 text-caption q-mt-xs">
          <q-icon name="schedule" size="xs" class="q-mr-xs" />
          Última actualización: {{ formatRelativeDate(lastUpdate) }}
        </div>

        <q-separator class="q-my-sm" />

        <!-- Descripción -->
        <div class="text-body2 text-grey-8">
          {{ description }}
        </div>

        <!-- Mapa -->
        <div class="q-mt-sm">
          <q-btn
            flat
            dense
            color="primary"
            icon="place"
            label="Coordenadas registradas (Ver en mapa)"
            @click="openMapDialog"
          />
        </div>

      </div>

      <!-- Botón derecha -->
      <div class="q-ml-auto">
        <q-btn
          :label="editLabel"
          :icon="editIcon"
          color="primary"
          unelevated
          class="q-px-lg q-py-sm"
          :to="editRoute"
          @click="$emit('edit')"
        />
      </div>

    </div>

  </q-card>

  <q-dialog v-model="showMapDialog">
    <q-card class="map-dialog-card">
      <q-card-section class="row items-center q-pb-sm">
        <div class="text-h6">Ubicacion del negocio</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div v-if="hasCoordinates">
          <div class="text-caption text-grey-7 q-mb-sm">
            <q-icon name="location_on" size="xs" class="q-mr-xs" />
            {{ location || 'Sin ubicacion textual' }}
          </div>
          <div v-if="lastUpdate" class="text-caption text-grey-6 q-mb-sm">
            <q-icon name="schedule" size="xs" class="q-mr-xs" />
            Última actualización: {{ formatRelativeDate(lastUpdate) }}
          </div>
          <div class="text-caption text-grey-7 q-mb-md">
            Lat: {{ mapLat }}, Lng: {{ mapLng }}
          </div>
          <MapaMini :lat="mapLat" :lng="mapLng" />
        </div>

        <q-banner v-else rounded class="bg-orange-1 text-orange-9">
          Este negocio aun no tiene coordenadas registradas.
        </q-banner>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { date } from 'quasar'
import { useConfiguracionStore } from 'src/stores/configuracion'
import { couch } from 'src/api/index'
import MapaMini from 'src/components/MapaMini.vue'

const props = defineProps({
  negocio: { type: Object, required: true },
  editLabel: { type: String, default: 'Editar Información' },
  editIcon: { type: String, default: 'edit' },
  editRoute: { type: String, default: '/negocio/editar' }
})

defineEmits(['edit', 'view-map'])
const showMapDialog = ref(false)
const configStore = useConfiguracionStore()

const businessName = computed(() => props.negocio?.nombre_comercial)
const category = computed(() => {
  const cat = props.negocio?.categoria
  return getDisplayField(cat) || 'Gastronomía'
})

const getDisplayField = (field) => {
  if (!field) return ''
  if (typeof field === 'string') return field
  if (typeof field === 'object') {
    return field.label || field.nombre || field.value || ''
  }
  return String(field)
}

const location = computed(() => {
  const direccion = props.negocio?.localizacion?.direccion
  if (direccion) return direccion

  const distritoClave = getDisplayField(props.negocio?.distrito)
  const departamentoClave = getDisplayField(props.negocio?.departamento)

  const distrito = configStore.getDistritoNombre(distritoClave)
  const departamento = configStore.getDepartamentoNombre(departamentoClave)

  return [distrito, departamento].filter(Boolean).join(', ')
})
const phone = computed(() => props.negocio?.telefono || '+503 0000-0000')
const status = computed(() => props.negocio?.estado_solicitud)
const description = computed(() => props.negocio?.descripcion || 'Sin descripción disponible')
const lastUpdate = computed(() => props.negocio?.updated_at || props.negocio?.updatedAt)
const isApproved = computed(() => status.value === 'aprobado')


const normalizeCategory = (value) => (value || '').toString().toLowerCase().trim()

const CATEGORY_META = {
  'gastronomía': { color: 'red', icon: 'restaurant' },
  'gastronomia': { color: 'red', icon: 'restaurant' },
  'hospedaje': { color: 'purple', icon: 'hotel' },
  'transporte': { color: 'blue', icon: 'directions_bus' },
  'tours': { color: 'green', icon: 'map' },
  'tienda de recuerdos': { color: 'orange', icon: 'storefront' },
  'recuerdos': { color: 'orange', icon: 'storefront' },
  'artesanías': { color: 'amber', icon: 'palette' },
  'artesanias': { color: 'amber', icon: 'palette' },
  'cafetería': { color: 'brown', icon: 'local_cafe' },
  'cafeteria': { color: 'brown', icon: 'local_cafe' }
}

const categoryColor = computed(() => {
  const key = normalizeCategory(category.value)
  return CATEGORY_META[key]?.color || 'primary'
})

const categoryIcon = computed(() => {
  const key = normalizeCategory(category.value)
  return CATEGORY_META[key]?.icon || 'category'
})

const parseCoordinate = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const mapLat = computed(() => {
  return parseCoordinate(props.negocio?.localizacion?.lat ?? props.negocio?.lat ?? props.negocio?.latitude)
})

const mapLng = computed(() => {
  return parseCoordinate(props.negocio?.localizacion?.lng ?? props.negocio?.lng ?? props.negocio?.longitude)
})

const hasCoordinates = computed(() => mapLat.value !== null && mapLng.value !== null)

const openMapDialog = () => {
  showMapDialog.value = true
}

const imageUrl = computed(() => {
  if (props.negocio?.imagen_portada && props.negocio._id) {
    return couch.getImageUrl('neg_' + props.negocio._id, props.negocio.imagen_portada)
  }
  return 'https://via.placeholder.com/150?text=Logo'
})

const formatRelativeDate = (dateStr) => {
  if (!dateStr) return '-'

  const sourceDate = new Date(dateStr)
  if (Number.isNaN(sourceDate.getTime())) return '-'

  const now = new Date()
  const diffMinutes = Math.floor((now - sourceDate) / (1000 * 60))

  if (diffMinutes < 1) return 'actualizado ahora mismo'
  if (diffMinutes < 60) return `hace ${diffMinutes} min`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `hace ${diffHours} h`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'hace 1 día'
  if (diffDays < 7) return `hace ${diffDays} días`

  return date.formatDate(sourceDate, 'DD/MM/YYYY')
}
</script>

<style scoped>
.business-profile {
  border-left: 4px solid var(--q-primary);
  transition: box-shadow 0.2s;
}
.business-profile:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important;
}
.border-approved {
  border-left-color: #4CAF50;
}

.map-dialog-card {
  width: min(720px, 92vw);
}
</style>
