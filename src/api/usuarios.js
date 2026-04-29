import { couch } from './index'
const DB = import.meta.env.VITE_DB_DATA

export const usuariosAPI = {
  // Actualizar campos del perfil (nombres, apellidos, etc.)
  async updateProfile(userId, updates) {
    const doc = await couch.get(DB, userId)
    Object.assign(doc, updates)
    return couch.put(DB, doc)
  },

  // Agregar un favorito (evento, sitio o negocio)
  async addFavorito(userId, tipo, item) {
    const doc = await couch.get(DB, userId)
    const detalle = doc.detalles?.detalle_usuario
    if (!detalle) throw new Error('No es usuario final')
    const campo =
      tipo === 'evento'
        ? 'eventos_guardados'
        : tipo === 'sitio'
          ? 'sitios_guardados'
          : 'negocios_guardados'
    const array = detalle[campo] || []
    if (!array.find(i => i._id === item._id)) {
      array.push(item)
      detalle[campo] = array
      await couch.put(DB, doc)
    }
  },

  // Eliminar un favorito por su ID
  async removeFavorito(userId, tipo, itemId) {
    const doc = await couch.get(DB, userId)
    const detalle = doc.detalles?.detalle_usuario
    if (!detalle) return
    const campo =
      tipo === 'evento'
        ? 'eventos_guardados'
        : tipo === 'sitio'
          ? 'sitios_guardados'
          : 'negocios_guardados'
    detalle[campo] = (detalle[campo] || []).filter(i => i._id !== itemId)
    await couch.put(DB, doc)
  },

  // Agregar al historial de viajes
  async addHistorial(userId, visita) {
    const doc = await couch.get(DB, userId)
    const detalle = doc.detalles?.detalle_usuario
    if (detalle) {
      detalle.historial_viajes = detalle.historial_viajes || []
      detalle.historial_viajes.push(visita)
      await couch.put(DB, doc)
    }
  }
}
