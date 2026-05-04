import fs from 'node:fs'
import path from 'node:path'

const TYPE_PREFIX = {
  evento: 'evt_',
  sitio: 'sit_',
  negocio: 'neg_',
  usuario: 'usr_'
}

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (!token.startsWith('--')) continue
    const [key, inlineValue] = token.slice(2).split('=')
    if (inlineValue !== undefined) {
      args[key] = inlineValue
      continue
    }
    const next = argv[i + 1]
    if (!next || next.startsWith('--')) {
      args[key] = true
      continue
    }
    args[key] = next
    i += 1
  }
  return args
}

function loadDotEnv(dotEnvPath) {
  if (!fs.existsSync(dotEnvPath)) return
  const content = fs.readFileSync(dotEnvPath, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim()
    if (!(key in process.env)) process.env[key] = value
  }
}

function getConfig() {
  const cwd = process.cwd()
  loadDotEnv(path.join(cwd, '.env'))

  const couchUrl = process.env.VITE_COUCHDB_URL
  const dbData = process.env.VITE_DB_DATA
  const dbImages = process.env.VITE_DB_IMAGES
  const user = process.env.VITE_COUCHDB_USER
  const pass = process.env.VITE_COUCHDB_PASS

  if (!couchUrl || !dbData || !dbImages) {
    throw new Error('Faltan variables .env: VITE_COUCHDB_URL, VITE_DB_DATA o VITE_DB_IMAGES')
  }

  const authHeader = user && pass
    ? `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`
    : null

  return {
    couchUrl: couchUrl.replace(/\/$/, ''),
    dbData,
    dbImages,
    authHeader
  }
}

async function requestJson(url, options = {}, authHeader = null) {
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(authHeader ? { Authorization: authHeader } : {}),
    ...(options.headers || {})
  }

  const res = await fetch(url, { ...options, headers })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} ${res.statusText} -> ${url}`)
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}

async function getImageDoc(config, imgDocId) {
  const url = `${config.couchUrl}/${config.dbImages}/${encodeURIComponent(imgDocId)}`
  try {
    return await requestJson(url, {}, config.authHeader)
  } catch (err) {
    if (err.status === 404) return null
    throw err
  }
}

async function getDataDoc(config, docId) {
  const url = `${config.couchUrl}/${config.dbData}/${encodeURIComponent(docId)}`
  return requestJson(url, {}, config.authHeader)
}

async function putDataDoc(config, doc) {
  const url = `${config.couchUrl}/${config.dbData}/${encodeURIComponent(doc._id)}`
  return requestJson(url, {
    method: 'PUT',
    body: JSON.stringify(doc)
  }, config.authHeader)
}

async function scanBrokenPortadas(config, limit) {
  const findUrl = `${config.couchUrl}/${config.dbData}/_find`
  const payload = {
    selector: {
      imagen_portada: { $exists: true }
    },
    fields: ['_id', '_rev', 'type', 'nombre', 'imagen_portada'],
    limit
  }

  const result = await requestJson(findUrl, {
    method: 'POST',
    body: JSON.stringify(payload)
  }, config.authHeader)

  const docs = result.docs || []
  const issues = []
  const skippedUnknownType = []

  for (const doc of docs) {
    const prefix = TYPE_PREFIX[doc.type]
    if (!prefix) {
      skippedUnknownType.push(doc)
      continue
    }

    const imgDocId = `${prefix}${doc._id}`
    const imgDoc = await getImageDoc(config, imgDocId)

    if (!imgDoc) {
      issues.push({
        kind: 'img_doc_missing',
        docId: doc._id,
        type: doc.type,
        nombre: doc.nombre || '',
        imagenPortada: doc.imagen_portada,
        imgDocId
      })
      continue
    }

    const attachments = Object.keys(imgDoc._attachments || {})
    if (!attachments.includes(doc.imagen_portada)) {
      issues.push({
        kind: 'attachment_missing',
        docId: doc._id,
        type: doc.type,
        nombre: doc.nombre || '',
        imagenPortada: doc.imagen_portada,
        imgDocId
      })
    }
  }

  return {
    analyzed: docs.length,
    issues,
    skippedUnknownType
  }
}

async function clearBrokenPortadas(config, issues) {
  const results = []

  for (const issue of issues) {
    const fullDoc = await getDataDoc(config, issue.docId)

    if (!Object.prototype.hasOwnProperty.call(fullDoc, 'imagen_portada')) {
      results.push({ id: issue.docId, action: 'skipped_no_field' })
      continue
    }

    delete fullDoc.imagen_portada
    await putDataDoc(config, fullDoc)
    results.push({ id: issue.docId, action: 'cleared' })
  }

  return results
}

function printSummary(scanResult) {
  const byKind = scanResult.issues.reduce((acc, issue) => {
    acc[issue.kind] = (acc[issue.kind] || 0) + 1
    return acc
  }, {})

  console.log(`Analizados: ${scanResult.analyzed}`)
  console.log(`Problemas: ${scanResult.issues.length}`)
  console.log(`Tipos desconocidos omitidos: ${scanResult.skippedUnknownType.length}`)
  console.log(`- img_doc_missing: ${byKind.img_doc_missing || 0}`)
  console.log(`- attachment_missing: ${byKind.attachment_missing || 0}`)

  if (!scanResult.issues.length) return

  console.log('\nPrimeros problemas detectados:')
  for (const issue of scanResult.issues.slice(0, 20)) {
    console.log(
      `- [${issue.kind}] ${issue.type} ${issue.docId} -> portada="${issue.imagenPortada}" (docImagen=${issue.imgDocId})`
    )
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const mode = args.mode || 'report'
  const limit = Number(args.limit || 5000)

  if (!['report', 'clear'].includes(mode)) {
    throw new Error('Modo inválido. Usa --mode report o --mode clear')
  }

  if (!Number.isFinite(limit) || limit <= 0) {
    throw new Error('El parámetro --limit debe ser un número positivo')
  }

  const config = getConfig()
  const scanResult = await scanBrokenPortadas(config, limit)
  printSummary(scanResult)

  if (mode === 'report') {
    console.log('\nModo reporte: no se aplicaron cambios.')
    return
  }

  if (!scanResult.issues.length) {
    console.log('\nModo clear: no hay nada que corregir.')
    return
  }

  console.log(`\nModo clear: limpiando imagen_portada en ${scanResult.issues.length} documentos...`)
  const updates = await clearBrokenPortadas(config, scanResult.issues)
  const cleared = updates.filter(item => item.action === 'cleared').length
  const skipped = updates.filter(item => item.action !== 'cleared').length

  console.log(`Listo. limpiados=${cleared}, omitidos=${skipped}`)
}

main().catch((err) => {
  console.error('\nError ejecutando repair-portadas:')
  console.error(err.message)
  if (err.data) console.error(JSON.stringify(err.data, null, 2))
  process.exit(1)
})
