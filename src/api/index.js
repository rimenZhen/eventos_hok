// src/api/index.js

const couchUrl = import.meta.env.VITE_COUCHDB_URL
const user = import.meta.env.VITE_COUCHDB_USER
const pass = import.meta.env.VITE_COUCHDB_PASS
const dbImages = import.meta.env.VITE_DB_IMAGES
const authHeader = 'Basic ' + btoa(`${user}:${pass}`)

function getHeaders(db, method = 'GET') {
  if (db === dbImages && method === 'GET') {
    return {}
  }
  return {
    Authorization: authHeader,
    'Content-Type': 'application/json'
  }
}

async function request(url, options = {}) {
  const response = await fetch(url, options)
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status} - ${response.statusText}`)
    try { error.details = await response.json() } catch { /* */ }
    throw error
  }
  if (response.status === 204) return null
  return response.json()
}

export const couch = {
  get: (db, id) =>
    request(`${couchUrl}/${db}/${encodeURIComponent(id)}`, {
      headers: getHeaders(db, 'GET')
    }),
  post: (db, doc) =>
    request(`${couchUrl}/${db}`, {
      method: 'POST',
      headers: getHeaders(db, 'POST'),
      body: JSON.stringify(doc)
    }),
  put: (db, doc) => {
    if (!doc._id || !doc._rev) throw new Error('PUT requiere _id y _rev')
    return request(`${couchUrl}/${db}/${encodeURIComponent(doc._id)}`, {
      method: 'PUT',
      headers: getHeaders(db, 'PUT'),
      body: JSON.stringify(doc)
    })
  },
  remove: (db, doc) => {
    if (!doc._id || !doc._rev) throw new Error('DELETE requiere _id y _rev')
    return request(`${couchUrl}/${db}/${encodeURIComponent(doc._id)}?rev=${doc._rev}`, {
      method: 'DELETE',
      headers: getHeaders(db, 'DELETE')
    })
  },
  find: (db, selector, options = {}) => {
    const { fields, limit = 50, skip = 0 } = options
    return request(`${couchUrl}/${db}/_find`, {
      method: 'POST',
      headers: getHeaders(db, 'POST'),
      body: JSON.stringify({ selector, fields, limit, skip })
    })
  },
  allDocs: (db, options = {}) => {
    const params = new URLSearchParams(options).toString()
    const url = `${couchUrl}/${db}/_all_docs${params ? '?' + params : ''}`
    return request(url, { headers: getHeaders(db, 'GET') })
  },
  // Imágenes
  getImageUrl: (imgDocId, attachmentName) =>
    `${couchUrl}/${dbImages}/${encodeURIComponent(imgDocId)}/${encodeURIComponent(attachmentName)}`,

  createImageDoc: (imgDocId, entidadTipo, entidadId) =>
    couch.post(dbImages, {
      _id: imgDocId,
      type: 'imagen',
      entidad_tipo: entidadTipo,
      entidad_id: entidadId,
      attachments_meta: []
    }),

  uploadImage: async (imgDocId, rev, file) => {
    const url = `${couchUrl}/${dbImages}/${encodeURIComponent(imgDocId)}/${encodeURIComponent(file.name)}?rev=${rev}`
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: authHeader,
        'Content-Type': file.type || 'application/octet-stream'
      },
      body: file
    })
    if (!res.ok) {
      const error = new Error(`Error al subir imagen: ${res.status}`)
      try { error.details = await res.json() } catch { /* */ }
      throw error
    }
    return res.json()
  }
}
