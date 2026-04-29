import { couch } from './index'
const DB = import.meta.env.VITE_DB_DATA

export const usuariosAPI = {
  // Actualizar campos del perfil (nombres, apellidos, etc.)
  async updateProfile(userId, updates) {
    const doc = await couch.get(DB, userId)
    Object.assign(doc, updates)
    return couch.put(DB, doc)
  },

  async addFavorito(userId, tipo, item) {
  const doc = await couch.get(DB, userId)

  // Asegurar que el documento tenga la estructura mínima para usuario_final
  if (!doc.detalles) {
    doc.detalles = {}
  }
  if (!doc.detalles.detalle_usuario) {
    // Si no existe detalle_usuario, lo creamos vacío
    doc.detalles.detalle_usuario = {
      foto_perfil: '',
      departamento_interes: '',
      categorias_favoritas: [],
      eventos_guardados: [],
      sitios_guardados: [],
      negocios_guardados: [],
      historial_viajes: [],
      reseñas: []
    }
  }

  const detalle = doc.detalles.detalle_usuario

  const campo =
    tipo === 'evento'
      ? 'eventos_guardados'
      : tipo === 'sitio'
        ? 'sitios_guardados'
        : 'negocios_guardados'

  // Inicializar el array si no existe
  if (!detalle[campo]) {
    detalle[campo] = []
  }

  // Verificar si ya está en favoritos
  if (!detalle[campo].some(i => i._id === item._id)) {
    detalle[campo].push(item)
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
