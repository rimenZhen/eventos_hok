const couchUrl = process.env.VITE_COUCHDB_URL
const couchUser = process.env.VITE_COUCHDB_USER
const couchPass = process.env.VITE_COUCHDB_PASS
const dbData = process.env.VITE_DB_DATA
const dryRun = process.argv.includes('--dry-run')

if (!couchUrl || !couchUser || !couchPass || !dbData) {
  console.error('Faltan variables de entorno: VITE_COUCHDB_URL, VITE_COUCHDB_USER, VITE_COUCHDB_PASS, VITE_DB_DATA')
  process.exit(1)
}

const authHeader = `Basic ${Buffer.from(`${couchUser}:${couchPass}`).toString('base64')}`

function getHeaders() {
  return {
    Authorization: authHeader,
    'Content-Type': 'application/json'
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${couchUrl}/${path}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {})
    }
  })

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status} - ${response.statusText}`)
    error.status = response.status
    try {
      error.details = await response.json()
    } catch {
      error.details = null
    }
    throw error
  }

  if (response.status === 204) return null
  return response.json()
}

function pad2(value) {
  return String(value).padStart(2, '0')
}

function sanitizeSegment(value) {
  return String(value).replaceAll(':', '_').replaceAll('/', '_')
}

function toDate(value) {
  return new Date(value)
}

function getUtcParts(value) {
  const date = toDate(value)
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate()
  }
}

function getDayKey(value) {
  const parts = getUtcParts(value)
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`
}

function getMonthKey(value) {
  const parts = getUtcParts(value)
  return `${parts.year}-${pad2(parts.month)}`
}

function getQuarter(value) {
  const parts = getUtcParts(value)
  return `Q${Math.floor((parts.month - 1) / 3) + 1}`
}

function getIsoWeekKey(value) {
  const date = toDate(value)
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = utcDate.getUTCDay() || 7
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1))
  const weekNumber = Math.ceil((((utcDate - yearStart) / (24 * 60 * 60 * 1000)) + 1) / 7)
  return `${utcDate.getUTCFullYear()}-W${pad2(weekNumber)}`
}

function getMonthDocId(scope, entityId, value) {
  const parts = getUtcParts(value)
  return `metrics:${scope}:${sanitizeSegment(entityId)}:${parts.year}:${pad2(parts.month)}`
}

function getYearDocId(scope, entityId, value) {
  const parts = getUtcParts(value)
  return `metrics:${scope}:${sanitizeSegment(entityId)}:${parts.year}`
}

function createMonthAggregate(scope, entityId, value) {
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
    updatedAt: new Date().toISOString(),
    migratedFrom: 'legacy_click_arrays'
  }
}

function createYearAggregate(scope, entityId, value) {
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
    updatedAt: new Date().toISOString(),
    migratedFrom: 'legacy_click_arrays'
  }
}

function incrementMonthAggregate(doc, value) {
  const dayKey = getDayKey(value)
  const weekKey = getIsoWeekKey(value)
  doc.daily[dayKey] = Number(doc.daily[dayKey] || 0) + 1
  doc.weekly[weekKey] = Number(doc.weekly[weekKey] || 0) + 1
  doc.monthlyTotal += 1
}

function incrementYearAggregate(doc, value) {
  const monthKey = getMonthKey(value)
  const weekKey = getIsoWeekKey(value)
  const quarterKey = getQuarter(value)
  doc.yearlyTotal += 1
  doc.monthlyTotals[monthKey] = Number(doc.monthlyTotals[monthKey] || 0) + 1
  doc.quarterlyTotals[quarterKey] = Number(doc.quarterlyTotals[quarterKey] || 0) + 1
  doc.weeklyTotals[weekKey] = Number(doc.weeklyTotals[weekKey] || 0) + 1
}

function collectLegacyEvents(doc) {
  const businessEvents = []
  const productEvents = []

  for (const record of doc?.clicks || []) {
    const rawDate = record?.fecha || record?.at || record?.date
    if (!rawDate) continue
    const date = new Date(rawDate)
    if (Number.isNaN(date.getTime())) continue
    businessEvents.push(date)
  }

  for (const record of doc?.estadisticas?.profileViews || []) {
    const rawDate = record?.fecha || record?.at || record?.date
    if (!rawDate) continue
    const date = new Date(rawDate)
    if (Number.isNaN(date.getTime())) continue
    businessEvents.push(date)
  }

  for (const [productKey, records] of Object.entries(doc?.estadisticas?.catalogoClicks || {})) {
    if (!Array.isArray(records)) continue
    for (const record of records) {
      const rawDate = record?.fecha || record?.at || record?.date
      if (!rawDate) continue
      const date = new Date(rawDate)
      if (Number.isNaN(date.getTime())) continue
      productEvents.push({ productKey, date })
    }
  }

  return { businessEvents, productEvents }
}

async function fetchAllBusinessDocs() {
  const docs = []
  let bookmark = null

  do {
    const payload = {
      selector: { type: 'negocio' },
      limit: 100
    }

    if (bookmark) payload.bookmark = bookmark

    const result = await request(`${dbData}/_find`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    docs.push(...(result.docs || []))
    bookmark = result.bookmark
  } while (bookmark)

  return docs
}

async function docExists(id) {
  try {
    await request(`${dbData}/${encodeURIComponent(id)}`)
    return true
  } catch (error) {
    if (error?.status === 404) return false
    throw error
  }
}

async function putDoc(doc) {
  if (dryRun) return { ok: true, id: doc._id, rev: 'dry-run' }
  return request(`${dbData}/${encodeURIComponent(doc._id)}`, {
    method: 'PUT',
    body: JSON.stringify(doc)
  })
}

async function migrateBusinessDoc(doc) {
  const { businessEvents, productEvents } = collectLegacyEvents(doc)
  const businessMonthAggregates = new Map()
  const businessYearAggregates = new Map()
  const productMonthAggregates = new Map()
  const productYearAggregates = new Map()

  for (const date of businessEvents) {
    const monthKey = getMonthKey(date)
    const yearKey = String(getUtcParts(date).year)

    if (!businessMonthAggregates.has(monthKey)) {
      const [year, month] = monthKey.split('-').map(Number)
      businessMonthAggregates.set(monthKey, createMonthAggregate('business', doc._id, new Date(Date.UTC(year, month - 1, 1))))
    }
    if (!businessYearAggregates.has(yearKey)) {
      businessYearAggregates.set(yearKey, createYearAggregate('business', doc._id, new Date(Date.UTC(Number(yearKey), 0, 1))))
    }

    incrementMonthAggregate(businessMonthAggregates.get(monthKey), date)
    incrementYearAggregate(businessYearAggregates.get(yearKey), date)
  }

  for (const event of productEvents) {
    const entityId = `${doc._id}:${event.productKey}`
    const monthKey = getMonthKey(event.date)
    const yearKey = String(getUtcParts(event.date).year)

    if (!productMonthAggregates.has(`${entityId}:${monthKey}`)) {
      const [year, month] = monthKey.split('-').map(Number)
      productMonthAggregates.set(`${entityId}:${monthKey}`, createMonthAggregate('product', entityId, new Date(Date.UTC(year, month - 1, 1))))
    }
    if (!productYearAggregates.has(`${entityId}:${yearKey}`)) {
      productYearAggregates.set(`${entityId}:${yearKey}`, createYearAggregate('product', entityId, new Date(Date.UTC(Number(yearKey), 0, 1))))
    }

    incrementMonthAggregate(productMonthAggregates.get(`${entityId}:${monthKey}`), event.date)
    incrementYearAggregate(productYearAggregates.get(`${entityId}:${yearKey}`), event.date)
  }

  const docsToWrite = [
    ...businessMonthAggregates.values(),
    ...businessYearAggregates.values(),
    ...productMonthAggregates.values(),
    ...productYearAggregates.values()
  ]

  for (const metricDoc of docsToWrite) {
    const exists = await docExists(metricDoc._id)
    if (exists) continue
    await putDoc(metricDoc)
  }

  return {
    businessEvents: businessEvents.length,
    productEvents: productEvents.length,
    docsCreated: docsToWrite.length
  }
}

async function main() {
  const businessDocs = await fetchAllBusinessDocs()
  let processed = 0
  let created = 0

  for (const doc of businessDocs) {
    const result = await migrateBusinessDoc(doc)
    processed += 1
    created += result.docsCreated
    console.log(`Procesado ${doc._id}: ${result.businessEvents} eventos de negocio, ${result.productEvents} eventos de producto`)
  }

  console.log(`Listo. Negocios procesados: ${processed}. Docs candidatos creados: ${created}.`)
}

main().catch(error => {
  console.error('Error migrando métricas:', error)
  process.exit(1)
})