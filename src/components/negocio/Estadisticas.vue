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
          <div class="label">Promedio por {{ periodUnitLabel }}</div>
          <div class="value">{{ promedioDia }}</div>
          <div class="change">Período {{ selectedPeriodLabel }}</div>
        </div>
        <div class="stat-item">
          <div class="label">Máximo por {{ periodUnitLabel }}</div>
          <div class="value">{{ maxDia }}</div>
          <div class="change">Registro más alto del periodo</div>
        </div>
        <div class="stat-item">
          <div class="label">Mínimo por {{ periodUnitLabel }}</div>
          <div class="value">{{ minDia }}</div>
          <div class="change">Registro más bajo del periodo</div>
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

        <div v-for="entry in topCatalogo" :key="entry.key || entry.index" class="stat-row q-pa-sm q-mb-sm">
          <div class="row items-center justify-between">
            <div>
              <div class="text-subtitle2 text-weight-bold">{{ entry.nombre || ('Producto ' + (entry.key || entry.index)) }}</div>
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
import { ref, computed, watch, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import { negocioAPI } from 'src/api/negocio'

defineOptions({ name: 'NegocioEstadisticas' })

Chart.register(...registerables)

const props = defineProps({ negocio: Object })

const tab = ref('perfil')
const selectedPeriod = ref('30')
const chartCanvas = ref(null)
const catalogChartCanvas = ref(null)
const analytics = ref({ profile: null, catalogo: [] })
const previousProfile = ref(null)
let chartInstance = null
let catalogChartInstance = null

const periods = [
  { label: '7 días', value: '7' },
  { label: '30 días', value: '30' },
  { label: 'Semanas del año', value: 'weeks' },
  { label: 'Últimos 10 años', value: '10y' }
]

const selectedPeriodLabel = computed(() => {
  const found = periods.find(p => p.value === selectedPeriod.value)
  return found?.label || ''
})

function periodToDays(period) {
  if (period === '7') return 7
  if (period === '30') return 30
  return 30
}

function pad2(value) {
  return String(value).padStart(2, '0')
}

function getIsoWeekInfo(date) {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const dayNumber = utcDate.getUTCDay() || 7
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNumber)
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((utcDate - yearStart) / 86400000) + 1) / 7)
  return { year: utcDate.getUTCFullYear(), week }
}

function getWeeksInIsoYear(year) {
  return getIsoWeekInfo(new Date(Date.UTC(year, 11, 28))).week
}

function getPeriodUnitLabel(period) {
  if (period === 'weeks') return 'Semana'
  if (period === '10y') return 'Año'
  return 'Día'
}

function buildWeeklyProfileSummary(yearSummary, referenceDate = new Date()) {
  const weekInfo = getIsoWeekInfo(referenceDate)
  const totalWeeks = getWeeksInIsoYear(weekInfo.year)
  const weeklyMap = {}

  for (const doc of yearSummary?.docs || []) {
    for (const [weekKey, value] of Object.entries(doc.weekly || {})) {
      weeklyMap[weekKey] = Number(weeklyMap[weekKey] || 0) + Number(value || 0)
    }
  }

  const labels = []
  const data = []
  for (let week = 1; week <= Math.min(weekInfo.week, totalWeeks); week += 1) {
    const weekKey = `${weekInfo.year}-W${pad2(week)}`
    labels.push(`Sem ${week}`)
    data.push(Number(weeklyMap[weekKey] || 0))
  }

  const total = data.reduce((sum, value) => sum + value, 0)
  return {
    period: 'weeks',
    timeline: { labels, data },
    total,
    monthTotal: total,
    weekTotal: total,
    quarterTotal: total,
    yearTotal: total,
    updatedAt: yearSummary?.updatedAt || null,
    docs: yearSummary?.docs || []
  }
}

async function buildLast10YearsSeries(entityId, now = new Date()) {
  const currentYear = now.getUTCFullYear()
  const years = []
  for (let year = currentYear - 9; year <= currentYear; year += 1) {
    years.push(year)
  }

  const summaries = await Promise.all(years.map(async year => {
    try {
      const endOfYear = year === currentYear
        ? now
        : new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))
      const summary = await negocioAPI.getBusinessMetricsSummary(entityId, { period: 'year', now: endOfYear })
      return Number(summary?.yearTotal ?? summary?.total ?? 0)
    } catch {
      return 0
    }
  }))

  const total = summaries.reduce((sum, value) => sum + value, 0)
  return {
    period: '10y',
    timeline: {
      labels: years.map(String),
      data: summaries
    },
    total,
    monthTotal: total,
    weekTotal: total,
    quarterTotal: total,
    yearTotal: summaries.at(-1) || 0,
    updatedAt: null,
    docs: []
  }
}

function buildLegacyCatalogSummary(catalogoClicks = {}, catalogo = [], period = '30', referenceDate = new Date()) {
  const days = periodToDays(period)
  const now = new Date(referenceDate)
  return Object.keys(catalogoClicks)
    .map(key => {
      const records = Array.isArray(catalogoClicks[key]) ? catalogoClicks[key] : []
      const filtered = records.filter(record => {
        const rawDate = record?.at || record?.fecha || record?.date
        const date = rawDate ? new Date(rawDate) : null
        if (!date || Number.isNaN(date.getTime())) return false
        return (now - date) / (1000 * 60 * 60 * 24) <= days
      })

      const dates = filtered.map(record => record?.at || record?.fecha).filter(Boolean).sort()
      const catalogItem = getCatalogItemByKey(key, catalogo)
      return {
        key: String(key),
        index: Number.parseInt(key, 10),
        nombre: catalogItem?.nombre || `Producto ${key}`,
        count: filtered.length,
        last: dates.length ? dates[dates.length - 1] : null
      }
    })
    .filter(entry => entry.count > 0)
    .sort((a, b) => b.count - a.count)
}

function getCatalogItemByKey(key, catalogo = props.negocio?.catalogo || []) {
  if (!catalogo.length) return null

  const stringKey = String(key)
  const byCatalogKey = catalogo.find(producto => String(producto?.catalogKey) === stringKey)
  if (byCatalogKey) return byCatalogKey

  const index = Number.parseInt(stringKey, 10)
  if (Number.isInteger(index) && index >= 0 && index < catalogo.length) {
    return catalogo[index]
  }

  return null
}

async function cargarAnaliticas() {
  if (!props.negocio?._id) {
    analytics.value = { profile: null, catalogo: [] }
    previousProfile.value = null
    return
  }

  try {
    const negocioId = props.negocio._id
    const catalogPeriod = selectedPeriod.value === 'weeks' || selectedPeriod.value === '10y'
      ? '30'
      : selectedPeriod.value

    let profileSummary = null
    let previousSummary = null

    if (selectedPeriod.value === '7' || selectedPeriod.value === '30') {
      const days = periodToDays(selectedPeriod.value)
      const previousEnd = new Date()
      previousEnd.setUTCDate(previousEnd.getUTCDate() - days)

      const [currentSummary, prevSummary, catalogoSummary] = await Promise.all([
        negocioAPI.getBusinessMetricsSummary(negocioId, { period: selectedPeriod.value }),
        negocioAPI.getBusinessMetricsSummary(negocioId, { period: selectedPeriod.value, now: previousEnd }),
        negocioAPI.getCatalogMetricsSummary(negocioId, props.negocio.catalogo || [], { period: catalogPeriod })
      ])

      profileSummary = currentSummary
      previousSummary = prevSummary
      analytics.value = {
        profile: profileSummary,
        catalogo: catalogoSummary.length > 0
          ? catalogoSummary
          : buildLegacyCatalogSummary(props.negocio?.estadisticas?.catalogoClicks || {}, props.negocio.catalogo || [], catalogPeriod)
      }
    } else if (selectedPeriod.value === 'weeks') {
      const currentDate = new Date()
      const previousDate = new Date(currentDate)
      previousDate.setUTCFullYear(previousDate.getUTCFullYear() - 1)

      const [currentYearSummary, previousYearSummary, catalogoSummary] = await Promise.all([
        negocioAPI.getBusinessMetricsSummary(negocioId, { period: 'year' }),
        negocioAPI.getBusinessMetricsSummary(negocioId, { period: 'year', now: previousDate }),
        negocioAPI.getCatalogMetricsSummary(negocioId, props.negocio.catalogo || [], { period: catalogPeriod })
      ])

      profileSummary = buildWeeklyProfileSummary(currentYearSummary, currentDate)
      previousSummary = buildWeeklyProfileSummary(previousYearSummary, previousDate)
      analytics.value = {
        profile: profileSummary,
        catalogo: catalogoSummary.length > 0
          ? catalogoSummary
          : buildLegacyCatalogSummary(props.negocio?.estadisticas?.catalogoClicks || {}, props.negocio.catalogo || [], catalogPeriod)
      }
    } else {
      const currentDate = new Date()
      const previousDate = new Date(currentDate)
      previousDate.setUTCFullYear(previousDate.getUTCFullYear() - 1)

      const [profileYearSeries, previousYearSummary, catalogoSummary] = await Promise.all([
        buildLast10YearsSeries(negocioId, currentDate),
        negocioAPI.getBusinessMetricsSummary(negocioId, { period: 'year', now: previousDate }),
        negocioAPI.getCatalogMetricsSummary(negocioId, props.negocio.catalogo || [], { period: catalogPeriod })
      ])

      profileSummary = profileYearSeries
      previousSummary = {
        total: Number(previousYearSummary?.yearTotal ?? previousYearSummary?.total ?? 0)
      }
      analytics.value = {
        profile: profileSummary,
        catalogo: catalogoSummary.length > 0
          ? catalogoSummary
          : buildLegacyCatalogSummary(props.negocio?.estadisticas?.catalogoClicks || {}, props.negocio.catalogo || [], catalogPeriod)
      }
    }

    previousProfile.value = previousSummary
  } catch (error) {
    console.warn('No se pudieron cargar las métricas agregadas', error)
    analytics.value = {
      profile: selectedPeriod.value === 'weeks'
        ? buildWeeklyProfileSummary({ docs: [] }, new Date())
        : selectedPeriod.value === '10y'
          ? await buildLast10YearsSeries(props.negocio._id)
          : { period: selectedPeriod.value, timeline: { labels: [], data: [] }, total: 0, docs: [] },
      catalogo: buildLegacyCatalogSummary(props.negocio?.estadisticas?.catalogoClicks || {}, props.negocio.catalogo || [], selectedPeriod.value)
    }
    previousProfile.value = { total: 0 }
  }

  await nextTick()
  renderChart()
  renderCatalogChart()
}

const visitasData = computed(() => analytics.value.profile?.timeline || { labels: [], data: [] })

// Estadísticas calculadas
const totalVisitas = computed(() => {
  return analytics.value.profile?.total || 0
})

const periodUnitLabel = computed(() => getPeriodUnitLabel(selectedPeriod.value))

const promedioDia = computed(() => {
  const values = visitasData.value.data || []
  if (values.length === 0) return 0
  return (totalVisitas.value / values.length).toFixed(1)
})

const maxDia = computed(() => {
  return visitasData.value.data.length ? Math.max(...visitasData.value.data) : 0
})

const minDia = computed(() => {
  return visitasData.value.data.length ? Math.min(...visitasData.value.data) : 0
})

const changePercent = computed(() => {
  if (selectedPeriod.value === '10y') return 0
  const currentCount = analytics.value.profile?.total || 0
  const previousCount = previousProfile.value?.total || 0

  if (previousCount === 0) return currentCount > 0 ? 100 : 0
  return ((currentCount - previousCount) / previousCount * 100).toFixed(1)
})

// Top de catálogs más clickeados
const topCatalogo = computed(() => {
  return analytics.value.catalogo || []
})

const catalogoChartData = computed(() => {
  const items = topCatalogo.value || []
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
  cargarAnaliticas()
}, { deep: true, immediate: true })

watch(tab, async value => {
  if (value !== 'catalogo') return
  await nextTick()
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
