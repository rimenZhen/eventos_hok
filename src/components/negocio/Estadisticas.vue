<template>
  <div>
    <!-- Tabs para cambiar entre vistas -->
    <q-tabs v-model="tab" dense class="text-grey q-mb-lg">
      <q-tab name="perfil" label="Visitas al Perfil" icon="visibility" />
      <q-tab name="catalogo" label="Clicks de Catálogo" icon="shopping_bag" />
      <q-tab name="favoritos" label="Favoritos Añadidos" icon="favorite" />
    </q-tabs>

    <!-- VISTA: Estadísticas de Visitas al Perfil -->
    <div v-show="tab === 'perfil'" class="estadisticas-card card-adaptable q-pa-md">
      <!-- Controles de período -->
      <div class="row items-center justify-between q-mb-lg">
        <div class="text-subtitle1 text-weight-bold row items-center">
          <q-icon name="bar_chart" size="20px" class="q-mr-sm" />
          Estadísticas de Visitas al Perfil
        </div>
        <div class="row q-gutter-sm">
          <q-btn
            v-for="period in periods"
            :key="period.value"
            :label="period.label"
            :flat="selectedPeriod !== period.value"
            :color="selectedPeriod === period.value ? 'primary' : 'grey-7'"
            size="sm"
            @click="selectedPeriod = period.value"
          />
        </div>
      </div>

      <!-- Gráfico de línea -->
      <div class="q-mb-lg" style="position: relative; height: 300px;">
        <canvas ref="chartCanvas"></canvas>
      </div>

      <!-- Grid de estadísticas clave -->
      <div class="stats-grid q-gutter-md">
        <div class="stat-item">
          <div class="label">Visitas Totales</div>
          <div class="value">{{ totalVisitas }}</div>
          <div class="change positive" v-if="changePercent >= 0">
            <q-icon name="arrow_upward" size="xs" />
            {{ Math.abs(changePercent) }}%
          </div>
          <div class="change negative" v-else>
            <q-icon name="arrow_downward" size="xs" />
            {{ Math.abs(changePercent) }}%
          </div>
        </div>
        <div class="stat-item">
          <div class="label">Promedio por Día</div>
          <div class="value">{{ promedioDia }}</div>
          <div class="change">Período {{ selectedPeriodLabel }}</div>
        </div>
        <div class="stat-item">
          <div class="label">Máximo en un Día</div>
          <div class="value">{{ maxDia }}</div>
          <div class="change">Pico más alto</div>
        </div>
        <div class="stat-item">
          <div class="label">Mínimo en un Día</div>
          <div class="value">{{ minDia }}</div>
          <div class="change">Pico más bajo</div>
        </div>
      </div>
    </div>

    <!-- VISTA: Top Catálogos más Clickeados -->
    <div v-show="tab === 'catalogo'" class="estadisticas-card card-adaptable q-pa-md">
      <div class="row items-center justify-between q-mb-lg">
        <div class="text-subtitle1 text-weight-bold row items-center">
          <q-icon name="shopping_bag" size="20px" class="q-mr-sm" />
          Clicks de Catálogo
        </div>
        <div class="row q-gutter-sm">
          <q-btn
            v-for="period in periods"
            :key="'catalog-' + period.value"
            :label="period.label"
            :flat="selectedPeriod !== period.value"
            :color="selectedPeriod === period.value ? 'primary' : 'grey-7'"
            size="sm"
            @click="selectedPeriod = period.value"
          />
        </div>
      </div>

      <div v-if="!negocio">Cargando...</div>
      <div v-else>
        <div class="q-mb-lg" style="position: relative; height: 320px;">
          <canvas ref="catalogChartCanvas"></canvas>
        </div>

        <div v-if="topCatalogo.length === 0" class="text-grey q-mt-md">No hay datos de interacción aún.</div>

        <div v-for="entry in topCatalogo" :key="entry.index" class="stat-row q-pa-sm q-mb-sm">
          <div class="row items-center justify-between">
            <div>
              <div class="text-subtitle2 text-weight-bold">{{ entry.nombre || ('Producto ' + entry.index) }}</div>
              <div class="text-caption text-grey">Clicks totales: {{ entry.count }}</div>
            </div>
            <div class="text-caption text-grey">Último: {{ entry.last ? formatDate(entry.last) : '—' }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- VISTA: Usuarios que agregaron a Favoritos -->
    <div v-show="tab === 'favoritos'" class="estadisticas-card card-adaptable q-pa-md">
      <div class="row items-center justify-between q-mb-lg">
        <div class="text-subtitle1 text-weight-bold row items-center">
          <q-icon name="favorite" size="20px" class="q-mr-sm" />
          Usuarios que Agregaron a Favoritos
        </div>
        <div class="text-subtitle2 text-weight-bold text-primary">{{ totalFavoritos }}</div>
      </div>

      <div v-if="!negocio">Cargando...</div>
      <div v-else>
        <!-- Grid de estadísticas clave de favoritos -->
        <div class="stats-grid q-gutter-md q-mb-lg">
          <div class="stat-item">
            <div class="label">Total de Favoritos</div>
            <div class="value">{{ totalFavoritos }}</div>
            <div class="change">Usuarios</div>
          </div>
          <div class="stat-item">
            <div class="label">Favoritos Esta Semana</div>
            <div class="value">{{ favoritosEstaSemana }}</div>
            <div class="change">Últimos 7 días</div>
          </div>
          <div class="stat-item">
            <div class="label">Favoritos Este Mes</div>
            <div class="value">{{ favoritosEsteMes }}</div>
            <div class="change">Últimos 30 días</div>
          </div>
        </div>

        <div v-if="listaFavoritos.length === 0" class="text-grey q-mt-md">Aún no hay usuarios que hayan agregado a favoritos.</div>

        <div v-else>
          <div class="text-subtitle2 text-weight-bold q-mb-md">Usuarios Recientes</div>
          <div v-for="(fav, idx) in listaFavoritos" :key="idx" class="stat-row q-pa-md q-mb-sm">
            <div class="row items-center justify-between">
              <div class="col">
                <div class="text-subtitle2 text-weight-bold">{{ fav.userName || 'Usuario' }}</div>
                <div class="text-caption text-grey">{{ fav.email || 'Sin email' }}</div>
              </div>
              <div class="text-caption text-grey">{{ formatDate(fav.at) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'

defineOptions({ name: 'NegocioEstadisticas' })

Chart.register(...registerables)

const props = defineProps({ negocio: Object })

const tab = ref('perfil')
const selectedPeriod = ref('30')
const chartCanvas = ref(null)
const catalogChartCanvas = ref(null)
let chartInstance = null
let catalogChartInstance = null

const periods = [
  { label: '7 días', value: '7' },
  { label: '30 días', value: '30' },
  { label: '90 días', value: '90' },
  { label: 'Año', value: 'year' }
]

const selectedPeriodLabel = computed(() => {
  const found = periods.find(p => p.value === selectedPeriod.value)
  return found?.label || ''
})

function getCatalogItemByKey(key) {
  return props.negocio?.catalogo?.find(producto => String(producto?.catalogKey) === String(key)) || null
}

// Procesa datos de visitas según el período seleccionado
const visitasData = computed(() => {
  if (!props.negocio?.estadisticas?.profileViews) return { labels: [], data: [] }

  const views = props.negocio.estadisticas.profileViews || []
  const now = new Date()
  let days = 30

  if (selectedPeriod.value === '7') days = 7
  else if (selectedPeriod.value === '30') days = 30
  else if (selectedPeriod.value === '90') days = 90
  else if (selectedPeriod.value === 'year') days = 365

  // Crear array de dias
  const dateMap = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    dateMap[key] = 0
  }

  // Contar visitas por día
  views.forEach(view => {
    const key = view.at.split('T')[0]
    if (key in dateMap) dateMap[key]++
  })

  // Formatear para gráfico
  const labels = Object.keys(dateMap).map(k => {
    const d = new Date(k)
    if (days === 7) return d.toLocaleDateString('es-SV', { weekday: 'short' })
    if (days === 30) return d.toLocaleDateString('es-SV', { month: 'short', day: 'numeric' })
    if (days === 90) return d.toLocaleDateString('es-SV', { month: 'short', day: 'numeric' })
    return d.toLocaleDateString('es-SV', { month: 'short' })
  })

  const data = Object.values(dateMap)

  return { labels, data }
})

// Estadísticas calculadas
const totalVisitas = computed(() => {
  return props.negocio?.estadisticas?.profileViews?.length || 0
})

const promedioDia = computed(() => {
  if (totalVisitas.value === 0) return 0
  const days = selectedPeriod.value === '7' ? 7 : selectedPeriod.value === '30' ? 30 : selectedPeriod.value === '90' ? 90 : 365
  return (totalVisitas.value / days).toFixed(1)
})

const maxDia = computed(() => {
  return visitasData.value.data.length ? Math.max(...visitasData.value.data) : 0
})

const minDia = computed(() => {
  return visitasData.value.data.length ? Math.min(...visitasData.value.data) : 0
})

const changePercent = computed(() => {
  // Comparar con período anterior
  if (!props.negocio?.estadisticas?.profileViews) return 0
  const views = props.negocio.estadisticas.profileViews
  const now = new Date()
  let days = 30

  if (selectedPeriod.value === '7') days = 7
  else if (selectedPeriod.value === '30') days = 30
  else if (selectedPeriod.value === '90') days = 90
  else if (selectedPeriod.value === 'year') days = 365

  // Visitas en periodo actual
  const currentCount = views.filter(v => {
    const vDate = new Date(v.at)
    return (now - vDate) / (1000 * 60 * 60 * 24) <= days
  }).length

  // Visitas en período anterior
  const prevDate = new Date(now)
  prevDate.setDate(prevDate.getDate() - days)
  const prevCount = views.filter(v => {
    const vDate = new Date(v.at)
    return vDate < prevDate
  }).length

  if (prevCount === 0) return currentCount > 0 ? 100 : 0
  return ((currentCount - prevCount) / prevCount * 100).toFixed(1)
})

// Top de catálogs más clickeados
const topCatalogo = computed(() => {
  if (!props.negocio) return []
  const clicks = (props.negocio.estadisticas && props.negocio.estadisticas.catalogoClicks) || {}
  const result = Object.keys(clicks).map(key => {
    const arr = clicks[key] || []
    const dates = arr.map(r => r.at).filter(Boolean).sort()
    const item = getCatalogItemByKey(key)
    if (!item) return null
    return {
      key,
      count: arr.length,
      last: dates.length ? dates[dates.length - 1] : null,
      nombre: item.nombre || `Producto ${key}`
    }
  })
  return result.filter(Boolean).sort((a, b) => b.count - a.count)
})

const catalogoChartData = computed(() => {
  if (!props.negocio) return { labels: [], data: [] }

  const clicks = props.negocio.estadisticas?.catalogoClicks || {}
  const now = new Date()
  let days = 30

  if (selectedPeriod.value === '7') days = 7
  else if (selectedPeriod.value === '30') days = 30
  else if (selectedPeriod.value === '90') days = 90
  else if (selectedPeriod.value === 'year') days = 365

  const items = Object.keys(clicks)
    .map(key => {
      const registros = clicks[key] || []
      const filtrados = registros.filter(registro => {
        const fecha = new Date(registro.at)
        return (now - fecha) / (1000 * 60 * 60 * 24) <= days
      })

      const producto = getCatalogItemByKey(key)
      if (!producto) return null
      return {
        nombre: producto.nombre || `Producto ${key}`,
        count: filtrados.length
      }
    })
    .filter(item => item && item.count > 0)
    .sort((a, b) => b.count - a.count)

  return {
    labels: items.map(item => item.nombre),
    data: items.map(item => item.count)
  }
})

// Estadísticas de favoritos
const totalFavoritos = computed(() => {
  return props.negocio?.estadisticas?.favoritosAñadidos?.length || 0
})

const favoritosEstaSemana = computed(() => {
  const favoritos = props.negocio?.estadisticas?.favoritosAñadidos || []
  const now = new Date()
  return favoritos.filter(fav => {
    const fecha = new Date(fav.at)
    return (now - fecha) / (1000 * 60 * 60 * 24) <= 7
  }).length
})

const favoritosEsteMes = computed(() => {
  const favoritos = props.negocio?.estadisticas?.favoritosAñadidos || []
  const now = new Date()
  return favoritos.filter(fav => {
    const fecha = new Date(fav.at)
    return (now - fecha) / (1000 * 60 * 60 * 24) <= 30
  }).length
})

const listaFavoritos = computed(() => {
  const favoritos = props.negocio?.estadisticas?.favoritosAñadidos || []
  return [...favoritos]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 5)
})

function formatDate(iso) {
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  } catch {
    return iso
  }
}

function renderChart() {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }

  const ctx = chartCanvas.value?.getContext('2d')
  if (!ctx) return

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  const gridColor = isDark ? '#2d2d44' : '#e2e8f0'
  const textColor = isDark ? '#a0aec0' : '#718096'
  const lineColor = '#6dd5b8'
  const bgGradient = ctx.createLinearGradient(0, 0, 0, 300)
  bgGradient.addColorStop(0, 'rgba(109, 213, 184, 0.3)')
  bgGradient.addColorStop(1, 'rgba(109, 213, 184, 0.05)')

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: visitasData.value.labels,
      datasets: [{
        label: 'Visitas al Perfil',
        data: visitasData.value.data,
        borderColor: lineColor,
        backgroundColor: bgGradient,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: lineColor,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: textColor } },
        tooltip: { backgroundColor: isDark ? '#1a1a2e' : '#1a202c' }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: gridColor },
          ticks: { color: textColor }
        },
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor }
        }
      }
    }
  })
}

function renderCatalogChart() {
  if (catalogChartInstance) {
    catalogChartInstance.destroy()
    catalogChartInstance = null
  }

  const ctx = catalogChartCanvas.value?.getContext('2d')
  if (!ctx) return

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  const gridColor = isDark ? '#2d2d44' : '#e2e8f0'
  const textColor = isDark ? '#a0aec0' : '#718096'
  const barColor = '#4fd1a8'

  catalogChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: catalogoChartData.value.labels,
      datasets: [{
        label: 'Clicks',
        data: catalogoChartData.value.data,
        backgroundColor: barColor,
        borderRadius: 8,
        barThickness: 18
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: isDark ? '#1a1a2e' : '#1a202c' }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: gridColor },
          ticks: { color: textColor, precision: 0 }
        },
        y: {
          grid: { color: 'transparent' },
          ticks: { color: textColor }
        }
      }
    }
  })
}

watch([() => props.negocio, selectedPeriod], () => {
  renderChart()
  renderCatalogChart()
}, { deep: true })

watch(tab, async value => {
  if (value !== 'catalogo') return
  await nextTick()
  renderCatalogChart()
})

onMounted(() => {
  renderChart()
  renderCatalogChart()
})
</script>

<style scoped>
.estadisticas-card {
  border-radius: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-item {
  background: #fafafa;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.body--dark .stat-item {
  background: #2c2c2c;
}

.stat-item .label {
  font-size: 0.875rem;
  color: #718096;
  margin-bottom: 0.5rem;
}

.body--dark .stat-item .label {
  color: #a0aec0;
}

.stat-item .value {
  font-size: 1.875rem;
  font-weight: bold;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.body--dark .stat-item .value {
  color: white;
}

.stat-item .change {
  font-size: 0.75rem;
  color: #718096;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.stat-item .change.positive {
  color: #48bb78;
}

.stat-item .change.negative {
  color: #f56565;
}

.stat-row {
  background: #fafafa;
  border-radius: 8px;
}

.body--dark .stat-row {
  background: #2c2c2c;
}
</style>
