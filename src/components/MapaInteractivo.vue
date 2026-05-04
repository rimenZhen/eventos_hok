<template>
  <div class="mapa-wrapper" :class="{ 'dark': $q.dark.isActive }">

    <!-- PANTALLA DE BIENVENIDA (sin punto elegido) -->
    <transition name="fade-slide">
      <div v-if="!puntoInicial" class="welcome-screen">
        <div class="welcome-bg">
          <div class="welcome-orb orb-1" />
          <div class="welcome-orb orb-2" />
          <div class="welcome-orb orb-3" />
        </div>

        <div class="welcome-content">
          <div class="welcome-header">
            <div class="compass-icon">
              <svg viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="1.5" />
                <path d="M20 8v2M20 30v2M8 20h2M30 20h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                <path d="M20 14l3 6-3 3-3-3 3-6z" fill="currentColor" opacity="0.3" />
                <path d="M20 14l3 6-3 3V14z" fill="currentColor" />
              </svg>
            </div>
            <h1 class="welcome-title">Explorar</h1>
            <p class="welcome-subtitle">Descubre eventos, sitios y negocios cerca de ti</p>
          </div>

          <div class="options-grid">
            <!-- Opción 1: GPS -->
            <button class="option-card option-primary" @click="usarGPS" :disabled="locating">
              <div class="option-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                  <circle cx="12" cy="12" r="8" stroke-dasharray="2 3" />
                </svg>
              </div>
              <div class="option-text">
                <span class="option-label">Mi ubicación</span>
                <span class="option-desc">Usar GPS del dispositivo</span>
              </div>
              <div class="option-arrow">
                <q-spinner v-if="locating" color="white" size="16px" />
                <svg v-else viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </div>
            </button>

            <!-- Opción 2: Toque en mapa -->
            <button class="option-card option-secondary" @click="activarModoToque">
              <div class="option-icon option-icon--outline">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
              </div>
              <div class="option-text">
                <span class="option-label">Elegir en el mapa</span>
                <span class="option-desc">Toca cualquier punto</span>
              </div>
              <svg class="option-arrow-outline" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </button>

            <!-- Opción 3: Departamento -->
            <button class="option-card option-secondary" @click="mostrarDepartamentos = true">
              <div class="option-icon option-icon--outline">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="8" height="8" rx="1.5" />
                  <rect x="13" y="3" width="8" height="8" rx="1.5" />
                  <rect x="3" y="13" width="8" height="8" rx="1.5" />
                  <rect x="13" y="13" width="8" height="8" rx="1.5" />
                </svg>
              </div>
              <div class="option-text">
                <span class="option-label">Por departamento</span>
                <span class="option-desc">Explora toda una zona</span>
              </div>
              <svg class="option-arrow-outline" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Modal departamentos -->
        <transition name="sheet-up">
          <div v-if="mostrarDepartamentos" class="dept-overlay" @click.self="mostrarDepartamentos = false">
            <div class="dept-sheet">
              <div class="sheet-handle" />
              <h3 class="sheet-title">¿Qué departamento?</h3>
              <div class="dept-grid">
                <button
                  v-for="dep in departamentosOpciones"
                  :key="dep.nombre"
                  class="dept-chip"
                  @click="elegirDepartamento(dep)"
                >
                  {{ dep.nombre }}
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- MAPA PRINCIPAL (con punto elegido) -->
    <transition name="fade-slide">
      <div v-if="puntoInicial" class="map-view">

        <!-- BARRA SUPERIOR -->
        <div class="map-topbar">
          <button class="btn-back" @click="resetearPunto" title="Cambiar punto">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M10 3L5 8l5 5" />
            </svg>
          </button>

          <div class="location-pill">
            <div class="location-dot" :class="`dot--${puntoInicial.tipo}`" />
            <span class="location-text">{{ labelPunto }}</span>
          </div>

          <button class="btn-filter" @click="drawerFiltros = true">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M2 4h12M5 8h6M7 12h2" stroke-linecap="round" />
            </svg>
            <span v-if="filtrosActivos > 0" class="filter-badge">{{ filtrosActivos }}</span>
          </button>
        </div>

        <!-- CHIPS DE TIPO -->
        <div class="chips-bar">
          <button
            v-for="tipo in tiposConfig"
            :key="tipo.key"
            class="type-chip"
            :class="[`chip--${tipo.key}`, { 'chip--active': tipo.activo, 'chip--inactive': !tipo.activo }]"
            @click="tipo.activo = !tipo.activo"
          >
            <span class="chip-dot" />
            <span class="chip-label">{{ tipo.label }}</span>
            <span class="chip-count">{{ contarTipo(tipo.key) }}</span>
          </button>

          <!-- Control de radio visible solo si NO es por departamento -->
          <div v-if="puntoInicial.tipo !== 'departamento'" class="radius-inline">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="width:12px;height:12px;flex-shrink:0">
              <circle cx="8" cy="8" r="6" />
              <circle cx="8" cy="8" r="3" />
            </svg>
            <input type="range" v-model.number="radiusKm" :min="1" :max="5" :step="1" class="radius-input" />
            <span class="radius-label">{{ radiusKm }} km</span>
          </div>
        </div>

        <!-- MAPA LEAFLET -->
        <div class="leaflet-container" :class="{ 'mode-toque': modoToque }">
          <l-map
            ref="mapRef"
            :zoom="zoom"
            :center="center"
            :use-global-leaflet="false"
            @click="onMapClick"
            style="height:100%;width:100%"
          >
            <l-tile-layer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution=""
            />

            <!-- Radio alrededor del punto solo si no es departamento -->
            <l-circle
              v-if="puntoInicial && puntoInicial.tipo !== 'departamento' && radiusKm > 0"
              :lat-lng="[puntoInicial.lat, puntoInicial.lng]"
              :radius="radiusKm * 1000"
              color="#3B82F6"
              :weight="1.5"
              :fill-opacity="0.06"
              :opacity="0.4"
            />

            <!-- Marcador del punto elegido -->
            <l-marker
              v-if="puntoInicial"
              :lat-lng="[puntoInicial.lat, puntoInicial.lng]"
              :icon="iconoUsuario"
            />

            <!-- Marcadores filtrados -->
            <l-marker
              v-for="item in marcadoresFiltrados"
              :key="item.id"
              :lat-lng="[item.lat, item.lng]"
              :icon="obtenerIcono(item.tipo)"
              @click="seleccionarMarcador(item)"
            />
          </l-map>

          <!-- Instrucción modo toque -->
          <transition name="fade">
            <div v-if="modoToque" class="toque-hint">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="width:14px;height:14px">
                <path d="M8 2v12M2 8h12" />
              </svg>
              Toca el mapa para colocar el punto
              <button class="toque-cancel" @click="modoToque = false">Cancelar</button>
            </div>
          </transition>
        </div>

        <!-- BOTTOM SHEET DE RESULTADOS -->
        <div class="results-sheet" :class="{ 'sheet--expanded': sheetExpanded }">
          <button class="sheet-toggle" @click="sheetExpanded = !sheetExpanded">
            <div class="sheet-handle" />
            <span class="sheet-summary">
              <span v-if="marcadoresFiltrados.length > 0">
                {{ marcadoresFiltrados.length }} resultado{{ marcadoresFiltrados.length !== 1 ? 's' : '' }} cerca
              </span>
              <span v-else class="sheet-empty-label">Nada encontrado aquí</span>
            </span>
          </button>

          <!-- Lista de resultados -->
          <div class="results-list" v-if="sheetExpanded">
            <div v-if="marcadoresFiltrados.length === 0" class="empty-state">
              <div class="empty-icon">
                <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.2">
                  <circle cx="20" cy="20" r="16" stroke-dasharray="4 3" />
                  <path d="M14 20h12M20 14v12" opacity="0.3" />
                </svg>
              </div>
              <p class="empty-text">No hay resultados con los filtros actuales</p>
              <button v-if="puntoInicial.tipo !== 'departamento'" class="btn-ampliar" @click="radiusKm = Math.min(radiusKm + 10, 50)">
                Ampliar radio a {{ Math.min(radiusKm + 10, 50) }} km
              </button>
            </div>

            <div
              v-for="item in marcadoresFiltrados.slice(0, 20)"
              :key="item.id"
              class="result-item"
              :class="`item--${item.tipo}`"
              @click="seleccionarMarcador(item); centrarEn(item)"
            >
              <div class="result-icon" :class="`icon--${item.tipo}`">
                <svg v-if="item.tipo === 'evento'" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="2" y="3" width="12" height="11" rx="1.5" />
                  <path d="M2 7h12M6 1v4M10 1v4" stroke-linecap="round" />
                </svg>
                <svg v-else-if="item.tipo === 'sitio'" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M8 1C5.24 1 3 3.24 3 6c0 3.94 5 9 5 9s5-5.06 5-9c0-2.76-2.24-5-5-5z" />
                  <circle cx="8" cy="6" r="1.5" />
                </svg>
                <svg v-else viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="2" y="5" width="12" height="9" rx="1.5" />
                  <path d="M5 5V3.5a3 3 0 016 0V5" />
                </svg>
              </div>
              <div class="result-info">
                <span class="result-title">{{ item.titulo }}</span>
                <span class="result-meta">{{ item.municipio }}, {{ item.departamento }} · {{ formatDistancia(item.distancia) }}</span>
              </div>
              <div class="result-dist-badge">{{ formatDistancia(item.distancia) }}</div>
            </div>

            <p v-if="marcadoresFiltrados.length > 20" class="results-more">
              +{{ marcadoresFiltrados.length - 20 }} más en el mapa
            </p>
          </div>
        </div>

        <!-- POPUP FLOTANTE DE DETALLE -->
        <transition name="popup-up">
          <div v-if="marcadorSeleccionado" class="popup-detail">
            <button class="popup-close" @click="marcadorSeleccionado = null">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M2 2l8 8M10 2l-8 8" />
              </svg>
            </button>
            <div class="popup-tag" :class="`tag--${marcadorSeleccionado.tipo}`">
              {{ tipoLabel(marcadorSeleccionado.tipo) }}
            </div>
            <h4 class="popup-title">{{ marcadorSeleccionado.titulo }}</h4>
            <p class="popup-meta">{{ marcadorSeleccionado.municipio }}, {{ marcadorSeleccionado.departamento }}</p>
            <p v-if="marcadorSeleccionado.distancia != null" class="popup-dist">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" style="width:11px;height:11px">
                <circle cx="6" cy="6" r="5" /><circle cx="6" cy="6" r="2" />
              </svg>
              {{ formatDistancia(marcadorSeleccionado.distancia) }} de tu punto
            </p>
            <button class="popup-cta" @click="irADetalle(marcadorSeleccionado)">
              Ver detalle completo
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" style="width:11px;height:11px">
                <path d="M2 6h8M6 2l4 4-4 4" />
              </svg>
            </button>
          </div>
        </transition>

        <!-- DRAWER FILTROS (lateral) -->
        <q-drawer
          v-model="drawerFiltros"
          side="right"
          bordered
          :width="300"
          :overlay="true"
          class="filtros-drawer"
        >
          <div class="drawer-inner">
            <div class="drawer-header">
              <h3 class="drawer-title">Filtros</h3>
              <button class="drawer-close" @click="drawerFiltros = false">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M3 3l10 10M13 3l-10 10" />
                </svg>
              </button>
            </div>

            <!-- Categorías por tipo -->
            <div v-for="grupo in categoriasPorTipo" :key="grupo.tipo" class="drawer-section">
              <p class="drawer-section-label">{{ tipoLabel(grupo.tipo) }}</p>
              <div class="cat-grid">
                <button
                  v-for="cat in grupo.items"
                  :key="cat.clave"
                  class="cat-chip"
                  :style="catActiva(cat.clave, grupo.tipo)
                    ? { color: '#fff', backgroundColor: cat.color || '#999', borderColor: cat.color || '#999' }
                    : { backgroundColor: 'transparent', borderColor: cat.color || '#999' }"
                  :class="{ 'cat-active': catActiva(cat.clave, grupo.tipo) }"
                  @click="toggleCategoria(cat.clave, grupo.tipo)"
                >
                  {{ cat.nombre }}
                </button>
              </div>
            </div>

            <!-- Control de radio solo si no es departamento -->
            <div v-if="puntoInicial && puntoInicial.tipo !== 'departamento'" class="drawer-section">
              <p class="drawer-section-label">Radio de búsqueda</p>
              <div class="radius-control">
                <input type="range" v-model.number="radiusKm" :min="0" :max="5" :step="1" class="radius-full" />
                <div class="radius-marks">
                  <span>0 km</span>
                  <span class="radius-current">{{ radiusKm }} km</span>
                  <span>5 km</span>
                </div>
              </div>
            </div>

            <div class="drawer-footer">
              <button class="btn-reset" @click="resetearFiltros">Limpiar filtros</button>
              <button class="btn-apply" @click="drawerFiltros = false">
                Aplicar ({{ marcadoresFiltrados.length }})
              </button>
            </div>
          </div>
        </q-drawer>

      </div>
    </transition>

  </div>
</template>
<script setup>
import { ref, computed, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { LMap, LTileLayer, LMarker,  LCircle } from '@vue-leaflet/vue-leaflet'
import L from 'leaflet'

const props = defineProps({
  eventos:  { type: Array, default: () => [] },
  sitios:   { type: Array, default: () => [] },
  negocios: { type: Array, default: () => [] },
  categoriasEventos:  { type: Array, default: () => [] },
  categoriasSitios:   { type: Array, default: () => [] },
  categoriasNegocios: { type: Array, default: () => [] },
  departamentos:      { type: Array, default: () => [] }
})

const $q = useQuasar()
const router = useRouter()

const puntoInicial           = ref(null)
const locating               = ref(false)
const modoToque              = ref(false)
const mostrarDepartamentos   = ref(false)
const drawerFiltros           = ref(false)
const sheetExpanded           = ref(false)
const marcadorSeleccionado    = ref(null)

const mapRef = ref(null)
const center = ref([13.7, -89.2])
const zoom   = ref(8)

// Radio 0‑5 km
const radiusKm = ref(5)
const tiposConfig = ref([
  { key: 'evento',  label: 'Eventos',  activo: true },
  { key: 'sitio',   label: 'Sitios',   activo: true },
  { key: 'negocio', label: 'Negocios', activo: true },
])
const categoriasSeleccionadas = ref([])  // { clave, tipo }

// ─── Coordenadas fijas para los departamentos ───────────────
const DEPTOS_COORDS = {
  'san salvador':  { lat: 13.6929, lng: -89.2182, zoom: 11 },
  'santa ana':     { lat: 13.9942, lng: -89.5597, zoom: 11 },
  'san miguel':    { lat: 13.4833, lng: -88.1833, zoom: 11 },
  'la libertad':   { lat: 13.4885, lng: -89.3099, zoom: 11 },
  'sonsonate':     { lat: 13.7185, lng: -89.7238, zoom: 11 },
  'usulután':      { lat: 13.35,   lng: -88.4333, zoom: 11 },
  'cuscatlán':     { lat: 13.7162, lng: -88.9307, zoom: 11 },
  'chalatenango':  { lat: 14.0344, lng: -88.9332, zoom: 11 },
  'cabañas':       { lat: 13.8591, lng: -88.75,   zoom: 11 },
  'la paz':        { lat: 13.4706, lng: -88.9942, zoom: 11 },
  'la unión':      { lat: 13.3363, lng: -87.8438, zoom: 11 },
  'morazán':       { lat: 13.7681, lng: -88.1282, zoom: 11 },
  'san vicente':   { lat: 13.6420, lng: -88.7854, zoom: 11 },
  'ahuachapán':    { lat: 13.9213, lng: -89.8448, zoom: 11 }
}

function extraerLabel(val) {
  if (!val) return ''
  if (typeof val === 'string') return val
  return val.label || val.nombre || val.clave || ''
}
const quitarTildes = (str) => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// Departamentos finales, con coordenadas
const departamentosOpciones = computed(() => {
  // Crea una versión sin tildes de DEPTOS_COORDS para emparejar
  const coordsNormalizados = Object.entries(DEPTOS_COORDS).reduce((acc, [key, val]) => {
    acc[quitarTildes(key).toLowerCase()] = val
    return acc
  }, {})

  if (props.departamentos?.length) {
    return props.departamentos
      .filter(d => d.activo !== false)
      .map(d => {
        const nombre = extraerLabel(d)
        const nombreNormalizado = quitarTildes(nombre).toLowerCase()
        const coords = coordsNormalizados[nombreNormalizado] || {}
        return {
          nombre: nombre,
          lat: d.lat || coords.lat,
          lng: d.lng || coords.lng,
          zoom: d.zoom || coords.zoom || 11
        }
      })
  }
  // fallback con todos los departamentos conocidos (usamos el mismo coordsNormalizados)
  return Object.entries(coordsNormalizados).map(([nombreNormalizado, coords]) => ({
    nombre: nombreNormalizado.charAt(0).toUpperCase() + nombreNormalizado.slice(1),
    ...coords
  }))
})


function extraerClave(cat) {
  if (!cat) return ''
  if (typeof cat === 'string') return cat
  return cat.value || cat.clave || ''
}

// ─── Marcadores ─────────────────────────────────────────────
const todosMarcadores = computed(() => {
  const lista = []
  props.eventos?.forEach(ev => {
    if (ev.localizacion?.lat && ev.localizacion?.lng) {
      lista.push({
        id: ev._id,
        lat: ev.localizacion.lat,
        lng: ev.localizacion.lng,
        titulo: ev.titulo,
        departamento: extraerLabel(ev.departamento),
        municipio: extraerLabel(ev.municipio),
        tipo: 'evento',
        categoria: ev.categoria || '',
        categoriaClave: extraerClave(ev.categoria)
      })
    }
  })
  props.sitios?.forEach(st => {
    if (st.localizacion?.lat && st.localizacion?.lng) {
      lista.push({
        id: st._id,
        lat: st.localizacion.lat,
        lng: st.localizacion.lng,
        titulo: st.nombre,
        departamento: extraerLabel(st.departamento),
        municipio: extraerLabel(st.municipio),
        tipo: 'sitio',
        categoria: st.categoria || '',
        categoriaClave: extraerClave(st.categoria)
        })
    }
  })
  props.negocios?.forEach(neg => {
    if (neg.localizacion?.lat && neg.localizacion?.lng) {
      lista.push({
        id: neg._id,
        lat: neg.localizacion.lat,
        lng: neg.localizacion.lng,
        titulo: neg.nombre_comercial,
        departamento: extraerLabel(neg.departamento),
        municipio: extraerLabel(neg.municipio),
        tipo: 'negocio',
        categoria: neg.categoria || '',
        categoriaClave: extraerClave(neg.categoria)
      })
    }
  })
  return lista
})

const filtrosActivos = computed(() => {
  let n = 0
  if (tiposConfig.value.some(t => !t.activo)) n++
  if (categoriasSeleccionadas.value.length > 0) n++
  return n
})

const marcadoresFiltrados = computed(() => {
  if (!puntoInicial.value) return []

  // Usar los que ya están en el radio de búsqueda
  let filtrados = marcadoresEnArea.value

  // Filtro 1: Tipos Activos (los tags principales)
  const tiposActivos = tiposConfig.value.filter(t => t.activo).map(t => t.key)
  filtrados = filtrados.filter(m => tiposActivos.includes(m.tipo))

  // Filtro 2: Categorías seleccionadas en el drawer
  if (categoriasSeleccionadas.value.length > 0) {
    filtrados = filtrados.filter(m => {
      return categoriasSeleccionadas.value.some(c => c.tipo === m.tipo && c.clave === m.categoriaClave)
    })
  }

  // Retornar ordenados por distancia (si tienen distancia)
  return filtrados.sort((a, b) => (a.distancia || 0) - (b.distancia || 0))
})

const categoriasPorTipo = computed(() => {
  const tiposActivos = tiposConfig.value.filter(t => t.activo).map(t => t.key)
  const grupos = []

  if (tiposActivos.includes('evento') && props.categoriasEventos?.length) {
    // Obtener las claves de categoría únicas que están presentes en el área
    const clavesPresentes = new Set(marcadoresEnArea.value.filter(m => m.tipo === 'evento').map(m => m.categoriaClave))
    const itemsDisponibles = props.categoriasEventos.filter(cat => clavesPresentes.has(cat.clave))

    if (itemsDisponibles.length > 0) {
      grupos.push({ tipo: 'evento', items: itemsDisponibles })
    }
  }

  if (tiposActivos.includes('sitio') && props.categoriasSitios?.length) {
    const clavesPresentes = new Set(marcadoresEnArea.value.filter(m => m.tipo === 'sitio').map(m => m.categoriaClave))
    const itemsDisponibles = props.categoriasSitios.filter(cat => clavesPresentes.has(cat.clave))

    if (itemsDisponibles.length > 0) {
      grupos.push({ tipo: 'sitio', items: itemsDisponibles })
    }
  }

  if (tiposActivos.includes('negocio') && props.categoriasNegocios?.length) {
    const clavesPresentes = new Set(marcadoresEnArea.value.filter(m => m.tipo === 'negocio').map(m => m.categoriaClave))
    const itemsDisponibles = props.categoriasNegocios.filter(cat => clavesPresentes.has(cat.clave))

    if (itemsDisponibles.length > 0) {
      grupos.push({ tipo: 'negocio', items: itemsDisponibles })
    }
  }

  return grupos
})

// Agrega esto junto a tus otros computed
const marcadoresEnArea = computed(() => {
  if (!puntoInicial.value) return []

  let base = todosMarcadores.value

  // 1. Filtrar si es por departamento
  if (puntoInicial.value.tipo === 'departamento') {
    return base.filter(m => m.departamento === puntoInicial.value.label)
  } else {
    // 2. Si es por ubicación (GPS o mapa), calcular distancias y filtrar por el radioKm
    return base.map(m => ({
      ...m,
      distancia: calcularDistancia(puntoInicial.value.lat, puntoInicial.value.lng, m.lat, m.lng)
    })).filter(m => m.distancia <= radiusKm.value)
  }
})

// ─── Contadores ─────────────────────────────────────────────
function contarTipo(tipoKey) {
  // Cuenta cuántos elementos de ese tipo hay dentro del departamento o radio
  return marcadoresEnArea.value.filter(m => m.tipo === tipoKey).length
}

// ─── Etiqueta del punto ──────────────────────────────────────
const labelPunto = computed(() => {
  if (!puntoInicial.value) return ''
  if (puntoInicial.value.tipo === 'gps') return 'Mi ubicación'
  if (puntoInicial.value.tipo === 'departamento') return puntoInicial.value.label
  return 'Punto personalizado'
})

// ─── Acciones de punto inicial ───────────────────────────────
async function usarGPS() {
  if (!navigator.geolocation) {
    $q.notify({ type: 'negative', message: 'Tu navegador no soporta geolocalización' })
    return
  }
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords
      puntoInicial.value = { lat, lng, tipo: 'gps', label: 'Mi ubicación' }
      center.value = [lat, lng]
      zoom.value = 13
      locating.value = false
    },
    () => {
      $q.notify({ type: 'negative', message: 'No se pudo obtener tu ubicación' })
      locating.value = false
    },
    { timeout: 8000 }
  )
}

function activarModoToque() {
  modoToque.value = true
  center.value = [13.7, -89.2]
  zoom.value = 9
  puntoInicial.value = { lat: 13.7, lng: -89.2, tipo: 'manual', label: 'Punto personalizado', _pendiente: true }
}

function onMapClick(e) {
  if (!modoToque.value) return
  const { lat, lng } = e.latlng
  puntoInicial.value = { lat, lng, tipo: 'manual', label: 'Punto personalizado' }
  modoToque.value = false

  // Actualizar reactivamente y forzar con setView
  center.value = [lat, lng]
  zoom.value = 13
  nextTick(() => {
    if (mapRef.value?.leafletObject) {
      mapRef.value.leafletObject.setView([lat, lng], 13)
    }
  })
}

function elegirDepartamento(dep) {
  puntoInicial.value = { lat: dep.lat, lng: dep.lng, tipo: 'departamento', label: dep.nombre }
  center.value = [dep.lat, dep.lng]
  zoom.value = dep.zoom || 11
  mostrarDepartamentos.value = false
  // No tocamos radiusKm, se ignorará en el filtro
}

function resetearPunto() {
  puntoInicial.value = null
  marcadorSeleccionado.value = null
  modoToque.value = false
  sheetExpanded.value = false
}

function seleccionarMarcador(item) {
  marcadorSeleccionado.value = item
}

function centrarEn(item) {
  center.value = [item.lat, item.lng]
  zoom.value = 14
  nextTick(() => {
    if (mapRef.value?.leafletObject) {
      mapRef.value.leafletObject.setView([item.lat, item.lng], 14)
    }
  })
}

// ─── Filtros de categorías ─────────────────────────────────
function toggleCategoria(clave, tipo) {
  const idx = categoriasSeleccionadas.value.findIndex(c => c.clave === clave && c.tipo === tipo)
  if (idx === -1) {
    categoriasSeleccionadas.value.push({ clave, tipo })
  } else {
    categoriasSeleccionadas.value.splice(idx, 1)
  }
}

function catActiva(clave, tipo) {
  return categoriasSeleccionadas.value.some(c => c.clave === clave && c.tipo === tipo)
}

function resetearFiltros() {
  tiposConfig.value.forEach(t => t.activo = true)
  categoriasSeleccionadas.value = []
  radiusKm.value = 5
}

// ─── Navegación a detalle ──────────────────────────────────
function irADetalle(item) {
  const rutas = {
    evento: '/evento/',
    sitio: '/sitio/',
    negocio: '/negocio/'
  }
  router.push(rutas[item.tipo] + item.id)
}

// ─── Utilidades ──────────────────────────────────────────────
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDistancia(km) {
  if (!km && km !== 0) return ''
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

function tipoLabel(tipo) {
  return { evento: 'Evento', sitio: 'Sitio turístico', negocio: 'Negocio' }[tipo] || tipo
}

// ─── Íconos Leaflet ─────────────────────────────────────────
function crearIcono(color, size = 28) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="${size}" height="${Math.round(size*1.33)}">
      <defs>
        <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.25)"/>
        </filter>
      </defs>
      <path d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 17 9 17s9-10.25 9-17c0-4.97-4.03-9-9-9z"
        fill="${color}" filter="url(#s)" />
      <circle cx="12" cy="9" r="4" fill="white" opacity="0.9"/>
    </svg>`
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, Math.round(size * 1.33)],
    iconAnchor: [size / 2, Math.round(size * 1.33)],
    popupAnchor: [0, -Math.round(size * 1.33)],
  })
}

function crearIconoUsuario() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
      <circle cx="12" cy="12" r="8" fill="#3B82F6" opacity="0.2"/>
      <circle cx="12" cy="12" r="5" fill="#3B82F6"/>
      <circle cx="12" cy="12" r="3" fill="white"/>
    </svg>`
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

const iconosCache = {
  evento:  crearIcono('#7C3AED'),
  sitio:   crearIcono('#059669'),
  negocio: crearIcono('#EA580C'),
}
const iconoUsuario = crearIconoUsuario()

function obtenerIcono(tipo) {
  return iconosCache[tipo] || iconosCache.evento
}
</script>

<style scoped>
/* (El estilo se mantiene exactamente igual que el original que proporcionaste, no se modifica) */
/* ─── Fuentes ─────────────────────────────────────────── */
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');

/* ─── Variables ──────────────────────────────────────── */
.mapa-wrapper {
  --font-display: 'Sora', sans-serif;
  --font-body:    'Plus Jakarta Sans', sans-serif;
  --c-evento:     #7C3AED;
  --c-evento-bg:  #EDE9FE;
  --c-sitio:      #059669;
  --c-sitio-bg:   #D1FAE5;
  --c-negocio:    #EA580C;
  --c-negocio-bg: #FFEDD5;
  --c-accent:     #3B82F6;
  --c-surface:    #FFFFFF;
  --c-surface2:   #F8F8F6;
  --c-border:     rgba(0,0,0,0.08);
  --c-text:       #111111;
  --c-text2:      #666666;
  --c-text3:      #999999;
  --radius-sm:    8px;
  --radius-md:    12px;
  --radius-lg:    18px;
  --radius-xl:    24px;
  --shadow-sm:    0 1px 4px rgba(0,0,0,0.08);
  --shadow-md:    0 4px 16px rgba(0,0,0,0.10);
  --shadow-lg:    0 8px 32px rgba(0,0,0,0.12);

  font-family: var(--font-body);
  position: relative;
  width: 100%;
  height: 520px;
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: var(--c-surface);
  color: var(--c-text);
}

/* Modo oscuro */
.mapa-wrapper.dark {
  --c-surface:  #1A1A1A;
  --c-surface2: #242424;
  --c-border:   rgba(255,255,255,0.08);
  --c-text:     #F0F0F0;
  --c-text2:    #AAAAAA;
  --c-text3:    #777777;
  --c-evento-bg:  rgba(124,58,237,0.15);
  --c-sitio-bg:   rgba(5,150,105,0.15);
  --c-negocio-bg: rgba(234,88,12,0.15);
  --shadow-sm:  0 1px 4px rgba(0,0,0,0.3);
  --shadow-md:  0 4px 16px rgba(0,0,0,0.4);
  --shadow-lg:  0 8px 32px rgba(0,0,0,0.5);
}

/* ─── PANTALLA BIENVENIDA ────────────────────────────── */
.welcome-screen {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--c-surface);
  z-index: 10;
  overflow: hidden;
}

.welcome-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.welcome-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
}
.orb-1 {
  width: 300px; height: 300px;
  top: -80px; left: -80px;
  background: rgba(124,58,237,0.08);
}
.orb-2 {
  width: 250px; height: 250px;
  bottom: -60px; right: -60px;
  background: rgba(5,150,105,0.07);
}
.orb-3 {
  width: 200px; height: 200px;
  top: 40%; left: 60%;
  background: rgba(234,88,12,0.06);
}

.welcome-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 400px;
  padding: 24px 20px;
}

.welcome-header {
  text-align: center;
  margin-bottom: 28px;
}
.compass-icon {
  width: 52px; height: 52px;
  margin: 0 auto 12px;
  color: var(--c-accent);
}
.compass-icon svg { width: 100%; height: 100%; }

.welcome-title {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 600;
  letter-spacing: -0.03em;
  color: var(--c-text);
  margin: 0 0 6px;
}
.welcome-subtitle {
  font-size: 0.875rem;
  color: var(--c-text2);
  margin: 0;
  line-height: 1.5;
}

.options-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-card {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 16px;
  border: none;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  text-align: left;
  font-family: var(--font-body);
}
.option-card:active { transform: scale(0.98); }

.option-primary {
  background: var(--c-accent);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 20px rgba(59,130,246,0.35);
  color: #fff;
}
.option-primary:hover { box-shadow: 0 6px 24px rgba(59,130,246,0.45); }

.option-secondary {
  background: var(--c-surface);
  border-radius: var(--radius-md);
  border: 1px solid var(--c-border) !important;
  box-shadow: var(--shadow-sm);
  color: var(--c-text);
}
.option-secondary:hover { box-shadow: var(--shadow-md); }

.option-icon {
  width: 36px; height: 36px;
  background: rgba(255,255,255,0.2);
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.option-icon svg { width: 18px; height: 18px; }

.option-icon--outline {
  background: var(--c-surface2);
  color: var(--c-text2);
}

.option-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.option-label {
  font-size: 0.875rem;
  font-weight: 600;
}
.option-primary .option-label { color: #fff; }

.option-desc {
  font-size: 0.75rem;
  opacity: 0.7;
}

.option-arrow { width: 18px; height: 18px; flex-shrink: 0; }
.option-arrow svg { width: 100%; height: 100%; }
.option-arrow-outline { width: 16px; height: 16px; color: var(--c-text3); flex-shrink: 0; }

/* Modal departamentos */
.dept-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: flex-end;
  z-index: 20;
}
.dept-sheet {
  background: var(--c-surface);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  padding: 12px 20px 28px;
  width: 100%;
  max-height: 70%;
  overflow-y: auto;
}
.sheet-handle {
  width: 36px; height: 4px;
  background: var(--c-border);
  border-radius: 2px;
  margin: 0 auto 16px;
}
.sheet-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--c-text);
  margin: 0 0 16px;
}
.dept-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.dept-chip {
  padding: 7px 14px;
  border-radius: 20px;
  border: 1px solid var(--c-border);
  background: var(--c-surface2);
  color: var(--c-text);
  font-size: 0.8rem;
  font-family: var(--font-body);
  cursor: pointer;
  transition: all 0.15s ease;
}
.dept-chip:hover {
  background: var(--c-accent);
  color: #fff;
  border-color: var(--c-accent);
  transform: scale(1.03);
}

/* ─── VISTA MAPA ─────────────────────────────────────── */
.map-view {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
}

/* Barra superior */
.map-topbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px 6px;
  background: var(--c-surface);
  border-bottom: 1px solid var(--c-border);
  z-index: 5;
  flex-shrink: 0;
}
.btn-back {
  width: 32px; height: 32px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--c-border);
  background: var(--c-surface2);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--c-text);
  flex-shrink: 0;
}
.btn-back svg { width: 16px; height: 16px; }

.location-pill {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 7px;
  background: var(--c-surface2);
  border: 1px solid var(--c-border);
  border-radius: 20px;
  padding: 6px 12px;
  min-width: 0;
}
.location-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot--gps        { background: var(--c-accent); }
.dot--manual     { background: var(--c-negocio); }
.dot--departamento { background: var(--c-sitio); }

.location-text {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--c-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-filter {
  position: relative;
  width: 34px; height: 34px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--c-border);
  background: var(--c-surface2);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--c-text);
  flex-shrink: 0;
}
.btn-filter svg { width: 16px; height: 16px; }
.filter-badge {
  position: absolute;
  top: -4px; right: -4px;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: var(--c-accent);
  color: #fff;
  font-size: 9px;
  font-weight: 600;
  display: flex; align-items: center; justify-content: center;
}

/* Chips de tipo */
.chips-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--c-surface);
  border-bottom: 1px solid var(--c-border);
  flex-shrink: 0;
  overflow-x: auto;
  scrollbar-width: none;
}
.chips-bar::-webkit-scrollbar { display: none; }

.type-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  border-radius: 20px;
  border: 1px solid;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  font-family: var(--font-body);
}
.chip-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
}
.chip-label { font-size: 0.75rem; font-weight: 500; }
.chip-count { font-size: 0.7rem; opacity: 0.7; }

.chip--evento.chip--active  { background: var(--c-evento-bg);  border-color: var(--c-evento);  color: var(--c-evento);  }
.chip--sitio.chip--active   { background: var(--c-sitio-bg);   border-color: var(--c-sitio);   color: var(--c-sitio);   }
.chip--negocio.chip--active { background: var(--c-negocio-bg); border-color: var(--c-negocio); color: var(--c-negocio); }
.chip--evento  .chip-dot  { background: var(--c-evento); }
.chip--sitio   .chip-dot  { background: var(--c-sitio); }
.chip--negocio .chip-dot  { background: var(--c-negocio); }
.chip--inactive { background: var(--c-surface2); border-color: var(--c-border); color: var(--c-text3); opacity: 0.7; }
.chip--inactive .chip-dot { background: var(--c-text3); }

.radius-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  flex-shrink: 0;
  color: var(--c-text2);
}
.radius-input {
  width: 80px;
  accent-color: var(--c-accent);
  cursor: pointer;
}
.radius-label { font-size: 0.72rem; font-weight: 500; color: var(--c-text2); min-width: 32px; }

/* Mapa */
.leaflet-container {
  flex: 1;
  position: relative;
  min-height: 0;
}
.mode-toque { cursor: crosshair; }

.toque-hint {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.75);
  color: #fff;
  font-size: 0.78rem;
  padding: 7px 14px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 7px;
  z-index: 500;
  white-space: nowrap;
  backdrop-filter: blur(4px);
}
.toque-cancel {
  background: rgba(255,255,255,0.2);
  border: none;
  color: #fff;
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: 10px;
  cursor: pointer;
  margin-left: 4px;
}

/* Bottom sheet resultados */
.results-sheet {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  background: var(--c-surface);
  border-top: 1px solid var(--c-border);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  z-index: 400;
  max-height: 50%;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
  transition: max-height 0.3s ease;
}
.results-sheet.sheet--expanded { max-height: 65%; }

.sheet-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px 16px 6px;
  width: 100%;
  text-align: left;
  flex-shrink: 0;
}
.sheet-summary {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--c-text);
}
.sheet-empty-label { color: var(--c-text3); font-weight: 400; }

.results-list {
  overflow-y: auto;
  padding: 4px 0 16px;
  flex: 1;
}

.empty-state {
  text-align: center;
  padding: 24px 16px;
}
.empty-icon {
  color: var(--c-text3);
  width: 40px; height: 40px;
  margin: 0 auto 10px;
}
.empty-icon svg { width: 100%; height: 100%; }
.empty-text { font-size: 0.82rem; color: var(--c-text2); margin: 0 0 12px; }
.btn-ampliar {
  padding: 7px 16px;
  border-radius: 20px;
  border: 1px solid var(--c-accent);
  color: var(--c-accent);
  background: transparent;
  font-size: 0.78rem;
  font-family: var(--font-body);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.15s ease;
}
.btn-ampliar:hover { background: var(--c-accent); color: #fff; }

.result-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  cursor: pointer;
  transition: background 0.12s ease;
  border-left: 3px solid transparent;
}
.result-item:hover { background: var(--c-surface2); }
.item--evento:hover  { border-left-color: var(--c-evento); }
.item--sitio:hover   { border-left-color: var(--c-sitio); }
.item--negocio:hover { border-left-color: var(--c-negocio); }

.result-icon {
  width: 32px; height: 32px;
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.result-icon svg { width: 15px; height: 15px; }
.icon--evento  { background: var(--c-evento-bg);  color: var(--c-evento);  }
.icon--sitio   { background: var(--c-sitio-bg);   color: var(--c-sitio);   }
.icon--negocio { background: var(--c-negocio-bg); color: var(--c-negocio); }

.result-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.result-title {
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--c-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.result-meta { font-size: 0.72rem; color: var(--c-text3); }

.result-dist-badge {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--c-text3);
  flex-shrink: 0;
}
.results-more {
  text-align: center;
  font-size: 0.75rem;
  color: var(--c-text3);
  padding: 8px;
}

/* Popup flotante */
.popup-detail {
  position: absolute;
  bottom: 110px;
  left: 12px;
  right: 12px;
  background: var(--c-surface);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--c-border);
  z-index: 450;
}
.popup-close {
  position: absolute;
  top: 10px; right: 10px;
  width: 24px; height: 24px;
  border-radius: 50%;
  border: 1px solid var(--c-border);
  background: var(--c-surface2);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--c-text2);
}
.popup-close svg { width: 10px; height: 10px; }
.popup-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.tag--evento  { background: var(--c-evento-bg);  color: var(--c-evento);  }
.tag--sitio   { background: var(--c-sitio-bg);   color: var(--c-sitio);   }
.tag--negocio { background: var(--c-negocio-bg); color: var(--c-negocio); }
.popup-title {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--c-text);
  margin: 0 0 3px;
}
.popup-meta { font-size: 0.78rem; color: var(--c-text2); margin: 0 0 5px; }
.popup-dist {
  display: flex; align-items: center; gap: 4px;
  font-size: 0.75rem; color: var(--c-text3); margin: 0 0 12px;
}
.popup-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 8px;
  border-radius: var(--radius-sm);
  background: var(--c-text);
  color: var(--c-surface);
  border: none;
  font-size: 0.8rem;
  font-weight: 500;
  font-family: var(--font-body);
  cursor: pointer;
  transition: opacity 0.15s ease;
}
.popup-cta:hover { opacity: 0.85; }

/* ─── DRAWER FILTROS ──────────────────────────────────── */
.filtros-drawer :deep(.q-drawer) {
  background: var(--c-surface);
}
.drawer-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px 18px;
  gap: 0;
  overflow-y: auto;
}
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.drawer-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--c-text);
  margin: 0;
}
.drawer-close {
  width: 28px; height: 28px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--c-border);
  background: var(--c-surface2);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--c-text2);
}
.drawer-close svg { width: 14px; height: 14px; }

.drawer-section { margin-bottom: 20px; }
.drawer-section-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--c-text3);
  margin: 0 0 10px;
}

.drawer-tipos { display: flex; flex-direction: column; gap: 8px; }
.tipo-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
.tipo-check { display: none; }
.toggle-track {
  width: 36px; height: 20px;
  border-radius: 10px;
  background: var(--c-surface2);
  border: 1px solid var(--c-border);
  position: relative;
  transition: background 0.2s ease;
  flex-shrink: 0;
}
.toggle-track::after {
  content: '';
  position: absolute;
  width: 14px; height: 14px;
  border-radius: 50%;
  background: var(--c-text3);
  top: 2px; left: 2px;
  transition: transform 0.2s ease, background 0.2s ease;
}
.tipo-check:checked + .track--evento  { background: var(--c-evento-bg);  border-color: var(--c-evento); }
.tipo-check:checked + .track--sitio   { background: var(--c-sitio-bg);   border-color: var(--c-sitio); }
.tipo-check:checked + .track--negocio { background: var(--c-negocio-bg); border-color: var(--c-negocio); }
.tipo-check:checked + .track--evento::after  { transform: translateX(16px); background: var(--c-evento); }
.tipo-check:checked + .track--sitio::after   { transform: translateX(16px); background: var(--c-sitio); }
.tipo-check:checked + .track--negocio::after { transform: translateX(16px); background: var(--c-negocio); }
.toggle-label { font-size: 0.85rem; color: var(--c-text); flex: 1; font-weight: 500; }
.toggle-count { font-size: 0.75rem; color: var(--c-text3); }

.radius-control { display: flex; flex-direction: column; gap: 4px; }
.radius-full { width: 100%; accent-color: var(--c-accent); cursor: pointer; }
.radius-marks {
  display: flex; justify-content: space-between;
  font-size: 0.7rem; color: var(--c-text3);
}
.radius-current { font-weight: 600; color: var(--c-accent); }

.cat-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.cat-chip {
  padding: 5px 11px;
  border-radius: 20px;
  border: 1px solid var(--c-border);
  background: var(--c-surface2);
  color: var(--c-text2);
  font-size: 0.75rem;
  font-family: var(--font-body);
  cursor: pointer;
  transition: all 0.15s ease;
}
.cat-active {
  background: var(--c-evento-bg);
  border-color: var(--c-evento);
  color: var(--c-evento);
  font-weight: 500;
}

.drawer-footer {
  margin-top: auto;
  padding-top: 16px;
  display: flex;
  gap: 8px;
}
.btn-reset {
  flex: 1;
  padding: 9px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--c-border);
  background: transparent;
  color: var(--c-text2);
  font-size: 0.82rem;
  font-family: var(--font-body);
  cursor: pointer;
}
.btn-apply {
  flex: 2;
  padding: 9px;
  border-radius: var(--radius-sm);
  border: none;
  background: var(--c-text);
  color: var(--c-surface);
  font-size: 0.82rem;
  font-weight: 600;
  font-family: var(--font-body);
  cursor: pointer;
  transition: opacity 0.15s ease;
}
.btn-apply:hover { opacity: 0.85; }

/* ─── TRANSICIONES ───────────────────────────────────── */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-slide-enter-from { opacity: 0; transform: translateY(10px); }
.fade-slide-leave-to   { opacity: 0; transform: translateY(-10px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }

.sheet-up-enter-active, .sheet-up-leave-active { transition: opacity 0.25s ease; }
.sheet-up-enter-active .dept-sheet,
.sheet-up-leave-active .dept-sheet  { transition: transform 0.25s ease; }
.sheet-up-enter-from .dept-sheet    { transform: translateY(100%); }
.sheet-up-leave-to .dept-sheet      { transform: translateY(100%); }
.sheet-up-enter-from, .sheet-up-leave-to { opacity: 0; }

.popup-up-enter-active, .popup-up-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.popup-up-enter-from { opacity: 0; transform: translateY(12px); }
.popup-up-leave-to   { opacity: 0; transform: translateY(12px); }

/* ─── RESPONSIVE ─────────────────────────────────────── */
@media (max-width: 480px) {
  .mapa-wrapper { height: 100dvh; border-radius: 0; }
  .welcome-content { padding: 20px 16px; }
  .welcome-title { font-size: 1.7rem; }
  .radius-input { width: 60px; }
  .popup-detail { bottom: 95px; }
}
</style>
