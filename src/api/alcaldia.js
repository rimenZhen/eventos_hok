import { couch } from './index'
const DB = import.meta.env.VITE_DB_DATA

export const alcaldiaAPI = {
  async getEventos(alcaldiaId) {
    const result = await couch.find(DB, {
      type: 'evento',
      'alcaldia._id': alcaldiaId
    })
    return result.docs
  },

  async getSitios(alcaldiaId) {
    const result = await couch.find(DB, {
      type: 'sitio',
      'alcaldia._id': alcaldiaId
    })
    return result.docs
  },

  async getSolicitudesNegocios(distritoClave = null) {
    const selector = {
      type: 'usuario',
      rol: 'negocio',
      'detalles.detalle_negocio.estado_solicitud': { $in: ['pendiente', 'observacion'] }
    }

    if (distritoClave) {
      selector['detalles.detalle_negocio.distrito'] = distritoClave
    }

    const result = await couch.find(DB, selector)
    return result.docs
  },

  async getNegociosActivos() {
    const result = await couch.find(DB, {
      type: 'negocio',
      estado: 'activo'
    })
    return result.docs
  },

  async cambiarEstadoSolicitud(userId, nuevoEstado, alcaldiaData) {
    const userDoc = await couch.get(DB, userId)
    userDoc.detalles.detalle_negocio.estado_solicitud = nuevoEstado

    const negocioDistrito = userDoc.detalles.detalle_negocio.distrito || ''
    if (alcaldiaData.distrito && negocioDistrito && alcaldiaData.distrito !== negocioDistrito) {
      throw new Error('La solicitud no pertenece al distrito de esta alcaldía')
    }

    // Si se rechaza la solicitud (vuelve a sin_solicitud), marcar como rechazado
    if (nuevoEstado === 'sin_solicitud') {
      userDoc.detalles.detalle_negocio.fue_rechazado = true
    }

    await couch.put(DB, userDoc)

    if (nuevoEstado === 'aprobado') {
      const negocioDoc = {
        type: 'negocio',
        nombre_comercial: userDoc.detalles.detalle_negocio.nombre_comercial,
        descripcion: '',
        categoria: '',
        horario: userDoc.detalles.detalle_negocio.horario || {},
        departamento: alcaldiaData.departamento || '',
        distrito: negocioDistrito,
        municipio: alcaldiaData.municipio || '',
        localizacion: userDoc.detalles.detalle_negocio.localizacion || { lat: 0, lng: 0, direccion: '' },
        nit_registro: userDoc.detalles.detalle_negocio.nit_registro,
        telefono: userDoc.detalles.detalle_negocio.contacto,
        estado: 'activo',
        estado_solicitud: 'aprobado',
        usuario_propietario: {
          _id: userDoc._id,
          nombres: userDoc.nombres,
          apellidos: userDoc.apellidos,
          correo: userDoc.login.correo
        },
        alcaldia_aprobadora: {
          _id: alcaldiaData._id,
          nombre_institucional: alcaldiaData.nombre_institucional,
          departamento: alcaldiaData.departamento,
          distrito: alcaldiaData.distrito || '',
          municipio: alcaldiaData.municipio
        },
        fecha_creacion: new Date().toISOString()
      }
      await couch.post(DB, negocioDoc)
    }
  },

  async createEvento(eventoData) {
    const response = await couch.post(DB, eventoData)
    return { id: response.id, rev: response.rev }
  },

  async updateEvento(id, rev, updates) {
    const doc = await couch.get(DB, id)
    Object.assign(doc, updates)
    return couch.put(DB, doc)
  },

  async updateSitio(id, rev, updates) {
    const doc = await couch.get(DB, id)
    Object.assign(doc, updates)
    return couch.put(DB, doc)
  }
}
