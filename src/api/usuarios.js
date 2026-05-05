import { couch } from './index'
import bcrypt from 'bcryptjs'
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
  },

  // Enviar/Reenenviar solicitud de aprobación del negocio a la alcaldía
  async submitNegocioApprovalRequest(userId) {
    const doc = await couch.get(DB, userId)
    if (!doc.detalles?.detalle_negocio) {
      throw new Error('No se encontraron detalles del negocio')
    }

    const distritoClave = doc.detalles.detalle_negocio.distrito
    if (!distritoClave) {
      throw new Error('El negocio debe tener un distrito seleccionado antes de enviar la solicitud')
    }

    const alcaldiaResult = await couch.find(DB, {
      type: 'usuario',
      rol: 'alcaldia',
      'detalles.detalle_alcaldia.distrito': distritoClave
    })

    if (alcaldiaResult.docs.length === 0) {
      throw new Error('No se encontró una alcaldía asociada a ese distrito')
    }

    const alcaldiaDestino = alcaldiaResult.docs[0]

    doc.detalles.detalle_negocio.estado_solicitud = 'pendiente'
    doc.detalles.detalle_negocio.fecha_solicitud = new Date().toISOString()
    doc.detalles.detalle_negocio.fue_rechazado = false
    doc.detalles.detalle_negocio.alcaldia_destino = {
      _id: alcaldiaDestino._id,
      nombre_institucional: alcaldiaDestino.detalles?.detalle_alcaldia?.nombre_institucional || '',
      departamento: alcaldiaDestino.detalles?.detalle_alcaldia?.departamento || '',
      distrito: alcaldiaDestino.detalles?.detalle_alcaldia?.distrito || '',
      municipio: alcaldiaDestino.detalles?.detalle_alcaldia?.municipio || ''
    }
    return couch.put(DB, doc)
  },

  // Actualizar contraseña
  async updatePassword(userId, { oldPassword, newPassword }) {
    const doc = await couch.get(DB, userId)
    // Verificar contraseña anterior
    const valid = await bcrypt.compare(oldPassword, doc.login.contrasena_hash)
    if (!valid) {
      throw new Error('Contraseña anterior incorrecta')
    }
    // Hashear nueva contraseña
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(newPassword, salt)
    doc.login.contrasena_hash = hash
    return couch.put(DB, doc)
  }
}
