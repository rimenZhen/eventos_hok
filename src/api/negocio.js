import { couch } from './index'
const DB = import.meta.env.VITE_DB_DATA

function crearCatalogKey() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `catalog-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizarCatalogo(doc) {
  let cambio = false

  if (!Array.isArray(doc.catalogo)) return cambio

  doc.catalogo = doc.catalogo.map(item => {
    if (!item) return item
    if (item.catalogKey) return item
    cambio = true
    return { ...item, catalogKey: crearCatalogKey() }
  })

  return cambio
}

export const negocioAPI = {
  /**
   * Obtiene el documento de negocio asociado al usuario actual.
   */
  async getMiNegocio(userId) {
    const result = await couch.find(DB, {
      type: 'negocio',
      'usuario_propietario._id': userId
    })
    if (result.docs.length === 0) throw new Error('No se encontró el negocio asociado a este usuario')

    const doc = result.docs[0]
    if (normalizarCatalogo(doc)) {
      await couch.put(DB, doc)
    }
    return doc
  },

  /**
   * Obtiene un negocio por id y asegura claves estables en el catálogo.
   */
  async getNegocioById(negocioId) {
    const doc = await couch.get(DB, negocioId)
    if (normalizarCatalogo(doc)) {
      await couch.put(DB, doc)
    }
    return doc
  },

  /**
   * Actualiza campos del negocio.
   */
  async updateNegocio(negocioId, rev, updates) {
    const doc = await couch.get(DB, negocioId)
    Object.assign(doc, updates, {
      updated_at: new Date().toISOString()
    })
    return couch.put(DB, doc)
  },

  /**
   * Agrega un producto al catálogo.
   */
  async addProducto(negocioId, rev, producto) {
    const doc = await couch.get(DB, negocioId)
    doc.catalogo = doc.catalogo || []
    doc.catalogo.push({
      ...producto,
      catalogKey: producto.catalogKey || crearCatalogKey()
    })
    return couch.put(DB, doc)
  },

  /**
   * Actualiza un producto del catálogo por índice.
   */
  async updateProducto(negocioId, rev, index, producto) {
    const doc = await couch.get(DB, negocioId)
    if (doc.catalogo && doc.catalogo[index]) {
      const catalogKey = doc.catalogo[index].catalogKey || producto.catalogKey || crearCatalogKey()
      doc.catalogo[index] = { ...doc.catalogo[index], ...producto, catalogKey }
      return couch.put(DB, doc)
    }
    throw new Error('Producto no encontrado')
  },

  /**
   * Elimina un producto del catálogo por índice.
   */
  async deleteProducto(negocioId, rev, index) {
    const doc = await couch.get(DB, negocioId)
    if (doc.catalogo && doc.catalogo[index] !== undefined) {
      const removedItem = doc.catalogo[index]
      const removedKey = removedItem?.catalogKey || String(index)
      doc.catalogo.splice(index, 1)

      if (doc.estadisticas?.catalogoClicks) {
        delete doc.estadisticas.catalogoClicks[removedKey]
      }

      return couch.put(DB, doc)
    }
    throw new Error('Producto no encontrado')
  },

  /**
   * Registra un click en un producto del catálogo para estadísticas.
   * Guarda un arreglo de timestamps por clave estable del producto.
   */
  async recordCatalogClick(negocioId, productKey, meta = {}) {
    const doc = await couch.get(DB, negocioId)
    doc.estadisticas = doc.estadisticas || {}
    doc.estadisticas.catalogoClicks = doc.estadisticas.catalogoClicks || {}
    const key = String(productKey)
    doc.estadisticas.catalogoClicks[key] = doc.estadisticas.catalogoClicks[key] || []
    doc.estadisticas.catalogoClicks[key].push({ at: new Date().toISOString(), user: meta.userId || null })
    await couch.put(DB, doc)
    return doc
  },

  /**
   * Registra una visita al perfil del negocio.
   * Almacena timestamps de cada visita al perfil.
   */
  async recordProfileView(negocioId, meta = {}) {
    const doc = await couch.get(DB, negocioId)
    doc.estadisticas = doc.estadisticas || {}
    doc.estadisticas.profileViews = doc.estadisticas.profileViews || []
    doc.estadisticas.profileViews.push({ at: new Date().toISOString(), user: meta.userId || null })
    await couch.put(DB, doc)
    return doc
  },

  /**
   * Registra cuando un usuario agrega el negocio a favoritos.
   * Almacena información del usuario y timestamp.
   */
  async recordFavoritoAñadido(negocioId, meta = {}) {
    const doc = await couch.get(DB, negocioId)
    doc.estadisticas = doc.estadisticas || {}
    doc.estadisticas.favoritosAñadidos = doc.estadisticas.favoritosAñadidos || []
    doc.estadisticas.favoritosAñadidos.push({
      at: new Date().toISOString(),
      userId: meta.userId || null,
      userName: meta.userName || null,
      email: meta.email || null
    })
    await couch.put(DB, doc)
    return doc
  },

  /**
   * Registra cuando un usuario quita el negocio de favoritos.
   * Remueve el registro del usuario de la estadística.
   */
  async removeFavoritoAñadido(negocioId, userId) {
    const doc = await couch.get(DB, negocioId)
    if (doc.estadisticas?.favoritosAñadidos) {
      doc.estadisticas.favoritosAñadidos = doc.estadisticas.favoritosAñadidos.filter(
        fav => fav.userId !== userId
      )
    }
    await couch.put(DB, doc)
    return doc
  }
}
