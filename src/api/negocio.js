import { couch } from './index'
const DB = import.meta.env.VITE_DB_DATA

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
    return result.docs[0]
  },

  /**
   * Actualiza campos del negocio.
   */
  async updateNegocio(negocioId, rev, updates) {
    const doc = await couch.get(DB, negocioId)
    Object.assign(doc, updates)
    return couch.put(DB, doc)
  },

  /**
   * Agrega un producto al catálogo.
   */
  async addProducto(negocioId, rev, producto) {
    const doc = await couch.get(DB, negocioId)
    doc.catalogo = doc.catalogo || []
    doc.catalogo.push(producto)
    return couch.put(DB, doc)
  },

  /**
   * Actualiza un producto del catálogo por índice.
   */
  async updateProducto(negocioId, rev, index, producto) {
    const doc = await couch.get(DB, negocioId)
    if (doc.catalogo && doc.catalogo[index]) {
      doc.catalogo[index] = { ...doc.catalogo[index], ...producto }
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
      doc.catalogo.splice(index, 1)
      return couch.put(DB, doc)
    }
    throw new Error('Producto no encontrado')
  }
}
