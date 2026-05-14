import { couch } from './index'
const DB_USERS = import.meta.env.VITE_DB_DATA
const DB_NEGOCIOS = import.meta.env.VITE_DB_NEGOCIOS || import.meta.env.VITE_DB_DATA

export const alcaldiaAPI = {
  async getEventos(alcaldiaId) {
    const result = await couch.find(DB_USERS, {
      type: 'evento',
      'alcaldia._id': alcaldiaId
    })
    return result.docs
  },

  async getSitios(alcaldiaId) {
    const result = await couch.find(DB_USERS, {
      type: 'sitio',
      'alcaldia._id': alcaldiaId
    })
    return result.docs
  },

  async getSolicitudesNegocios(distritoClave = null) {
    const selector = {
      type: 'negocio',
      estado_solicitud: { $in: ['pendiente', 'observacion'] }
    }

    if (distritoClave) {
      selector.distrito = distritoClave
    }

    const result = await couch.find(DB_NEGOCIOS, selector)
    return result.docs
  },

  async getNegociosActivos() {
    const result = await couch.find(DB_NEGOCIOS, {
      type: 'negocio',
      estado: 'activo'
    })
    return result.docs
  },

  // Renombrar o corregir getNegociosActivos para exigir aprobación real
  async getNegociosAprobados() {
    const result = await couch.find(DB_NEGOCIOS, {
      type: 'negocio',
      estado_solicitud: 'aprobado'
    })
    return result.docs
  },

  async cambiarEstadoSolicitud(negocioId, nuevoEstado, alcaldiaData, opciones = {}) {
    const negocioDoc = await couch.get(DB_NEGOCIOS, negocioId)
    const estadoNormalizado = nuevoEstado === 'rechazado' ? 'sin_solicitud' : nuevoEstado
    negocioDoc.estado_solicitud = estadoNormalizado
    negocioDoc.fue_rechazado = estadoNormalizado === 'sin_solicitud'

    // 🔥 Guardar el motivo si existe
    if (opciones.motivo) {
      negocioDoc.motivo = opciones.motivo
    } else if (nuevoEstado === 'observacion' || nuevoEstado === 'rechazado') {
      // Si no se envió motivo, se puede dejar vacío o requerirlo
      negocioDoc.motivo = opciones.observacion || null
    }

    if (estadoNormalizado === 'aprobado') {
      negocioDoc.estado = 'activo'
      negocioDoc.alcaldia_aprobadora = {
        _id: alcaldiaData._id,
        nombre_institucional: alcaldiaData.nombre_institucional,
        departamento: alcaldiaData.departamento || '',
        distrito: alcaldiaData.distrito || '',
        municipio: alcaldiaData.municipio || ''
      }
    }

    await couch.put(DB_NEGOCIOS, negocioDoc)

    // Sincronizar con el usuario (también guardar el motivo)
    const userId = negocioDoc.usuario_propietario?._id
    if (userId) {
      const userDoc = await couch.get(DB_USERS, userId)
      userDoc.detalles = userDoc.detalles || {}
      userDoc.detalles.detalle_negocio = userDoc.detalles.detalle_negocio || {}
      userDoc.detalles.detalle_negocio.estado_solicitud = estadoNormalizado
      userDoc.detalles.detalle_negocio.fue_rechazado = estadoNormalizado === 'sin_solicitud'
      if (negocioDoc.motivo) {
        userDoc.detalles.detalle_negocio.motivo = negocioDoc.motivo
      }
      await couch.put(DB_USERS, userDoc)
    }
  },

  async createEvento(eventoData) {
    const response = await couch.post(DB_USERS, eventoData)
    return { id: response.id, rev: response.rev }
  },

  async updateEvento(id, rev, updates) {
    const doc = await couch.get(DB_USERS, id)
    Object.assign(doc, updates)
    return couch.put(DB_USERS, doc)
  },

  async updateSitio(id, rev, updates) {
    const doc = await couch.get(DB_USERS, id)
    Object.assign(doc, updates)
    return couch.put(DB_USERS, doc)
  }
}
