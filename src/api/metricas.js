import { couch } from './index'

const DB = import.meta.env.VITE_DB_METRICS || import.meta.env.VITE_DB_DATA
const DAY_MS = 24 * 60 * 60 * 1000

function pad2(value) {
  return String(value).padStart(2, '0')
}

function sanitizeSegment(value) {
  return String(value).replaceAll(':', '_').replaceAll('/', '_')
}

function toDate(value = new Date()) {
  return value instanceof Date ? new Date(value.getTime()) : new Date(value)
}

function getUtcParts(value = new Date()) {
  const date = toDate(value)
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate()
  }
}

function getDayKey(value = new Date()) {
  const parts = getUtcParts(value)
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`
}

function getMonthKey(value = new Date()) {
  const parts = getUtcParts(value)
  return `${parts.year}-${pad2(parts.month)}`
}

function getQuarter(value = new Date()) {
  const parts = getUtcParts(value)
  return `Q${Math.floor((parts.month - 1) / 3) + 1}`
}

function getIsoWeekKey(value = new Date()) {
  const date = toDate(value)
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = utcDate.getUTCDay() || 7
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1))
  const weekNumber = Math.ceil((((utcDate - yearStart) / DAY_MS) + 1) / 7)
  return `${utcDate.getUTCFullYear()}-W${pad2(weekNumber)}`
}

function getMonthDocId(scope, entityId, value = new Date()) {
  const parts = getUtcParts(value)
  return `metrics:${scope}:${sanitizeSegment(entityId)}:${parts.year}:${pad2(parts.month)}`
}

function getYearDocId(scope, entityId, value = new Date()) {
  const parts = getUtcParts(value)
  return `metrics:${scope}:${sanitizeSegment(entityId)}:${parts.year}`
}

function createMonthDoc(scope, entityId, value = new Date()) {
  const parts = getUtcParts(value)
  return {
    _id: getMonthDocId(scope, entityId, value),
    type: `${scope}_metrics_month`,
    entityType: scope,
    entityId: String(entityId),
    ...(scope === 'business' ? { businessId: String(entityId) } : { productId: String(entityId) }),
    year: parts.year,
    month: parts.month,
    quarter: getQuarter(value),
    daily: {},
    weekly: {},
    monthlyTotal: 0,
    updatedAt: new Date().toISOString()
  }
}

function createYearDoc(scope, entityId, value = new Date()) {
  const parts = getUtcParts(value)
  return {
    _id: getYearDocId(scope, entityId, value),
    type: `${scope}_metrics_year`,
    entityType: scope,
    entityId: String(entityId),
    ...(scope === 'business' ? { businessId: String(entityId) } : { productId: String(entityId) }),
    year: parts.year,
    yearlyTotal: 0,
    monthlyTotals: {},
    quarterlyTotals: {},
    weeklyTotals: {},
    updatedAt: new Date().toISOString()
  }
}

function ensureMonthShape(doc, scope, entityId, value = new Date()) {
  const base = doc && typeof doc === 'object' ? doc : createMonthDoc(scope, entityId, value)
  base.type = base.type || `${scope}_metrics_month`
  base.entityType = base.entityType || scope
  base.entityId = base.entityId || String(entityId)
  if (scope === 'business') base.businessId = base.businessId || String(entityId)
  else base.productId = base.productId || String(entityId)
  base.year = base.year || getUtcParts(value).year
  base.month = base.month || getUtcParts(value).month
  base.quarter = base.quarter || getQuarter(value)
  base.daily = base.daily || {}
  base.weekly = base.weekly || {}
  base.monthlyTotal = Number(base.monthlyTotal || 0)
  return base
}

function ensureYearShape(doc, scope, entityId, value = new Date()) {
  const base = doc && typeof doc === 'object' ? doc : createYearDoc(scope, entityId, value)
  base.type = base.type || `${scope}_metrics_year`
  base.entityType = base.entityType || scope
  base.entityId = base.entityId || String(entityId)
  if (scope === 'business') base.businessId = base.businessId || String(entityId)
  else base.productId = base.productId || String(entityId)
  base.year = base.year || getUtcParts(value).year
  base.yearlyTotal = Number(base.yearlyTotal || 0)
  base.monthlyTotals = base.monthlyTotals || {}
  base.quarterlyTotals = base.quarterlyTotals || {}
  base.weeklyTotals = base.weeklyTotals || {}
  return base
}

function incrementMonthDoc(doc, value = new Date(), amount = 1) {
  const dayKey = getDayKey(value)
  const weekKey = getIsoWeekKey(value)
  doc.daily[dayKey] = Number(doc.daily[dayKey] || 0) + amount
  doc.weekly[weekKey] = Number(doc.weekly[weekKey] || 0) + amount
  doc.monthlyTotal = Number(doc.monthlyTotal || 0) + amount
  doc.updatedAt = new Date().toISOString()
  return doc
}

function incrementYearDoc(doc, value = new Date(), amount = 1) {
  const monthKey = getMonthKey(value)
  const weekKey = getIsoWeekKey(value)
  const quarterKey = getQuarter(value)
  doc.yearlyTotal = Number(doc.yearlyTotal || 0) + amount
  doc.monthlyTotals[monthKey] = Number(doc.monthlyTotals[monthKey] || 0) + amount
  doc.quarterlyTotals[quarterKey] = Number(doc.quarterlyTotals[quarterKey] || 0) + amount
  doc.weeklyTotals[weekKey] = Number(doc.weeklyTotals[weekKey] || 0) + amount
  doc.updatedAt = new Date().toISOString()
  return doc
}

function isConflictError(error) {
  return error?.status === 409 || /409/.test(String(error?.message || ''))
}

async function putWithRetry(db, createDoc, mutateDoc, { retries = 5 } = {}) {
  let lastError = null

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const doc = await getMetricDocById(db, createDoc._id)

      const nextDoc = mutateDoc(doc ? { ...doc } : { ...createDoc })
      if (!nextDoc._id) nextDoc._id = createDoc._id
      if (doc && !nextDoc._rev) nextDoc._rev = doc._rev
      return await saveMetricDoc(db, nextDoc)
    } catch (error) {
      lastError = error
      if (!isConflictError(error) || attempt === retries) throw error
    }
  }

  throw lastError || new Error('No se pudo actualizar la métrica')
}

async function recordMetric(scope, entityId, value = new Date(), amount = 1) {
  const monthDoc = createMonthDoc(scope, entityId, value)
  const yearDoc = createYearDoc(scope, entityId, value)

  await putWithRetry(DB, monthDoc, currentDoc => incrementMonthDoc(ensureMonthShape(currentDoc, scope, entityId, value), value, amount))
  await putWithRetry(DB, yearDoc, currentDoc => incrementYearDoc(ensureYearShape(currentDoc, scope, entityId, value), value, amount))
}

function getRangeMonths(startDate, endDate) {
  const months = []
  const cursor = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1))
  const limit = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), 1))

  while (cursor <= limit) {
    months.push({ year: cursor.getUTCFullYear(), month: cursor.getUTCMonth() + 1 })
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  }

  return months
}

async function getMetricDocsByIds(db, ids) {
  if (!ids.length) return []
  const response = await couch.allDocsByKeys(db, ids)
  return (response.rows || [])
    .map(row => row?.doc || null)
    .filter(Boolean)
}

async function getMetricDocById(db, id) {
  const docs = await getMetricDocsByIds(db, [id])
  return docs[0] || null
}

async function saveMetricDoc(db, doc) {
  if (doc?._rev) {
    return couch.put(db, doc)
  }
  return couch.putById(db, doc)
}

async function getRangeMetricDocs(scope, entityId, startDate, endDate) {
  const months = getRangeMonths(startDate, endDate)
  const ids = months.map(({ year, month }) => `metrics:${scope}:${sanitizeSegment(entityId)}:${year}:${pad2(month)}`)
  return getMetricDocsByIds(DB, ids)
}

function mergeDailySeries(docs, startDate, endDate) {
  const daily = {}
  for (const doc of docs) {
    const entries = Object.entries(doc.daily || {})
    for (const [dayKey, value] of entries) {
      const dayDate = new Date(`${dayKey}T00:00:00Z`)
      if (Number.isNaN(dayDate.getTime())) continue
      if (dayDate < startDate || dayDate > endDate) continue
      daily[dayKey] = Number(daily[dayKey] || 0) + Number(value || 0)
    }
  }
  return daily
}

function buildLabelsForRange(startDate, endDate) {
  const labels = []
  const cursor = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()))
  while (cursor <= endDate) {
    labels.push(cursor.toISOString().split('T')[0])
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return labels
}

function getRangeStartEnd(period, value = new Date()) {
  const end = new Date(value)
  const start = new Date(value)

  if (period === '7') start.setUTCDate(start.getUTCDate() - 6)
  else if (period === '30') start.setUTCDate(start.getUTCDate() - 29)
  else if (period === '90') start.setUTCDate(start.getUTCDate() - 89)
  else {
    start.setUTCMonth(0)
    start.setUTCDate(1)
  }

  start.setUTCHours(0, 0, 0, 0)
  end.setUTCHours(23, 59, 59, 999)
  return { startDate: start, endDate: end }
}

function buildTimelineFromDaily(daily, startDate, endDate, period) {
  if (period === 'year') {
    const monthMap = {}
    const cursor = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1))
    while (cursor <= endDate) {
      const key = `${cursor.getUTCFullYear()}-${pad2(cursor.getUTCMonth() + 1)}`
      monthMap[key] = 0
      cursor.setUTCMonth(cursor.getUTCMonth() + 1)
    }

    for (const [dayKey, value] of Object.entries(daily)) {
      const dayDate = new Date(`${dayKey}T00:00:00Z`)
      if (Number.isNaN(dayDate.getTime())) continue
      const key = `${dayDate.getUTCFullYear()}-${pad2(dayDate.getUTCMonth() + 1)}`
      if (key in monthMap) monthMap[key] += Number(value || 0)
    }

    return {
      labels: Object.keys(monthMap).map(key => new Date(`${key}-01T00:00:00Z`).toLocaleDateString('es-SV', { month: 'short', timeZone: 'UTC' })),
      data: Object.values(monthMap)
    }
  }

  const labels = buildLabelsForRange(startDate, endDate)
  const data = labels.map(label => Number(daily[label] || 0))

  if (period === '7') {
    return {
      labels: labels.map(label => new Date(`${label}T00:00:00Z`).toLocaleDateString('es-SV', { weekday: 'short', timeZone: 'UTC' })),
      data
    }
  }

  if (period === '30' || period === '90') {
    return {
      labels: labels.map(label => new Date(`${label}T00:00:00Z`).toLocaleDateString('es-SV', { month: 'short', day: 'numeric', timeZone: 'UTC' })),
      data
    }
  }

  return {
    labels: labels.map(label => new Date(`${label}T00:00:00Z`).toLocaleDateString('es-SV', { month: 'short', timeZone: 'UTC' })),
    data
  }
}

function computeRangeTotal(daily, startDate, endDate) {
  let total = 0
  for (const [dayKey, value] of Object.entries(daily)) {
    const dayDate = new Date(`${dayKey}T00:00:00Z`)
    if (Number.isNaN(dayDate.getTime())) continue
    if (dayDate < startDate || dayDate > endDate) continue
    total += Number(value || 0)
  }
  return total
}

function getLegacyEventDate(record) {
  const value = record?.at || record?.fecha || record?.date
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return null
  return date
}

function collectLegacyMetricEvents(doc) {
  const businessEvents = []
  const productEvents = []

  const profileViews = Array.isArray(doc?.estadisticas?.profileViews) ? doc.estadisticas.profileViews : []
  for (const record of profileViews) {
    const date = getLegacyEventDate(record)
    if (!date) continue
    businessEvents.push(date)
  }

  const topLevelClicks = Array.isArray(doc?.clicks) ? doc.clicks : []
  for (const record of topLevelClicks) {
    const date = getLegacyEventDate(record)
    if (!date) continue
    businessEvents.push(date)
  }

  const catalogClicks = doc?.estadisticas?.catalogoClicks || {}
  for (const [productKey, records] of Object.entries(catalogClicks)) {
    if (!Array.isArray(records)) continue
    for (const record of records) {
      const date = getLegacyEventDate(record)
      if (!date) continue
      productEvents.push({ productKey, date })
    }
  }

  return { businessEvents, productEvents }
}

function bucketLegacyEventsByMonth(events) {
  const buckets = new Map()

  for (const event of events) {
    const key = getMonthKey(event.date || event)
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key).push(event)
  }

  return buckets
}

function createAggregationContext(scope, entityId, date) {
  return {
    scope,
    entityId: String(entityId),
    monthId: getMonthDocId(scope, entityId, date),
    yearId: getYearDocId(scope, entityId, date),
    monthKey: getMonthKey(date),
    weekKey: getIsoWeekKey(date),
    dayKey: getDayKey(date),
    quarterKey: getQuarter(date),
    date
  }
}

async function getEntityMetricsSummary(scope, entityId, { period = '30', now = new Date() } = {}) {
  const { startDate, endDate } = getRangeStartEnd(period, now)
  const monthDocs = await getRangeMetricDocs(scope, entityId, startDate, endDate)
  const yearlyDoc = await getMetricDocById(DB, getYearDocId(scope, entityId, now))

  const daily = mergeDailySeries(monthDocs, startDate, endDate)
  const timeline = buildTimelineFromDaily(daily, startDate, endDate, period)
  const total = computeRangeTotal(daily, startDate, endDate)

  const yearTotal = yearlyDoc?.yearlyTotal ?? total
  const monthKey = getMonthKey(now)
  const weekKey = getIsoWeekKey(now)
  const quarterKey = getQuarter(now)

  const currentMonthTotal = monthlyDocValue(monthDocs, 'monthlyTotal', monthKey)
  const currentWeekTotal = yearlyDoc?.weeklyTotals?.[weekKey] ?? 0
  const currentQuarterTotal = yearlyDoc?.quarterlyTotals?.[quarterKey] ?? 0

  return {
    period,
    timeline,
    total,
    monthTotal: currentMonthTotal,
    weekTotal: currentWeekTotal,
    quarterTotal: currentQuarterTotal,
    yearTotal,
    updatedAt: yearlyDoc?.updatedAt || monthDocs.at(-1)?.updatedAt || null,
    docs: monthDocs
  }
}

function monthlyDocValue(monthDocs, field, monthKey) {
  const doc = monthDocs.find(item => `${item.year}-${pad2(item.month)}` === monthKey)
  return Number(doc?.[field] || 0)
}

async function getProductMetricsSummary(scope, namespaceId, catalogo = [], { period = '30', now = new Date() } = {}) {
  const { startDate, endDate } = getRangeStartEnd(period, now)
  const productEntries = []

  await Promise.all(catalogo.map(async (producto, index) => {
    const productId = `${namespaceId}:${producto?.catalogKey || producto?._id || String(index)}`
    const docs = await getRangeMetricDocs(scope, productId, startDate, endDate)
    const daily = mergeDailySeries(docs, startDate, endDate)
    const total = computeRangeTotal(daily, startDate, endDate)
    const lastDoc = docs.at(-1)
    const dateSeries = Object.keys(daily).sort()
    const last = dateSeries.at(-1) || lastDoc?.updatedAt || null

    productEntries.push({
      key: String(productId),
      index,
      nombre: producto?.nombre || `Producto ${producto?.catalogKey || producto?._id || String(index)}`,
      count: total,
      last
    })
  }))

  return productEntries
    .filter(entry => entry.count > 0)
    .sort((a, b) => b.count - a.count)
}

async function migrateLegacyMetricsForDoc(doc) {
  const { businessEvents, productEvents } = collectLegacyMetricEvents(doc)
  const tasks = []

  for (const date of businessEvents) {
    tasks.push(recordMetric('business', doc._id, date))
  }

  for (const event of productEvents) {
    tasks.push(recordMetric('product', `${doc._id}:${event.productKey}`, event.date))
  }

  await Promise.all(tasks)
}

export {
  bucketLegacyEventsByMonth,
  collectLegacyMetricEvents,
  computeRangeTotal,
  createAggregationContext,
  createMonthDoc,
  createYearDoc,
  getDayKey,
  getEntityMetricsSummary,
  getIsoWeekKey,
  getMonthDocId,
  getMonthKey,
  getProductMetricsSummary,
  getQuarter,
  getRangeMetricDocs,
  getRangeMonths,
  getRangeStartEnd,
  getYearDocId,
  incrementMonthDoc,
  incrementYearDoc,
  migrateLegacyMetricsForDoc,
  putWithRetry,
  recordMetric,
  sanitizeSegment
}