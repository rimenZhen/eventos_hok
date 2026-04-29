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

  async getSolicitudesNegocios() {
    const result = await couch.find(DB, {
      type: 'usuario',
      rol: 'negocio',
      'detalles.detalle_negocio.estado_solicitud': { $in: ['pendiente', 'observacion'] }
    })
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
    await couch.put(DB, userDoc)

    if (nuevoEstado === 'aprobado') {
      const negocioDoc = {
        type: 'negocio',
        nombre_comercial: userDoc.detalles.detalle_negocio.nombre_comercial,
        descripcion: '',
        categoria: '',
        departamento: alcaldiaData.departamento || '',
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
