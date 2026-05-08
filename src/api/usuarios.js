import { couch } from './index'
import bcrypt from 'bcryptjs'
import { negocioAPI } from './negocio'
const DB = import.meta.env.VITE_DB_DATA

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function findDistrictInConfiguracionDocs(docs, distritoClave) {
  const target = normalizeText(distritoClave)

  for (const doc of docs || []) {
    for (const item of doc.items || []) {
      if (Array.isArray(item.distritos)) {
        for (const distrito of item.distritos) {
          const clave = normalizeText(distrito.clave)
          const nombre = normalizeText(distrito.nombre)
          if (clave === target || nombre === target) {
            return distrito
          }
        }
      }
    }
  }

  return null
}

async function resolveAlcaldiaForDistrict(distritoClave) {
  const configuracionDocs = (await couch.find(DB, { type: 'configuracion' })).docs || []
  const distrito = findDistrictInConfiguracionDocs(configuracionDocs, distritoClave)
  if (!distrito?.alcaldia) return null

  const alcaldiaMeta = distrito.alcaldia
  const nombreInstitucional = normalizeText(alcaldiaMeta.nombre_institucional)

  const alcaldias = await couch.find(DB, {
    type: 'usuario',
    rol: 'alcaldia'
  })

  const match = (alcaldias.docs || []).find(doc => {
    const detalle = doc.detalles?.detalle_alcaldia || {}
    return normalizeText(detalle.nombre_institucional) === nombreInstitucional
  })

  if (match) return { ...match, meta: alcaldiaMeta }

  return { meta: alcaldiaMeta }
}

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
    let detalleNegocio = doc.detalles?.detalle_negocio || null

    if (!detalleNegocio) {
      try {
        const negocioDoc = await negocioAPI.getMiNegocio(userId)
        detalleNegocio = {
          nombre_comercial: negocioDoc.nombre_comercial || '',
          nit_registro: negocioDoc.nit_registro || '',
          contacto: negocioDoc.telefono || '',
          departamento: negocioDoc.departamento || null,
          distrito: negocioDoc.distrito || negocioDoc.municipio || null,
          localizacion: negocioDoc.localizacion || { lat: null, lng: null, direccion: '' },
          estado_solicitud: negocioDoc.estado_solicitud || 'sin_solicitud'
        }
        doc.detalles = doc.detalles || {}
        doc.detalles.detalle_negocio = detalleNegocio
        await couch.put(DB, doc)
      } catch {
        throw new Error('No se encontraron detalles del negocio')
      }
    }

    const distritoClave = detalleNegocio.distrito
    if (!distritoClave) {
      throw new Error('El negocio debe tener un distrito seleccionado antes de enviar la solicitud')
    }

    const alcaldiaDestino = await resolveAlcaldiaForDistrict(distritoClave)
    if (!alcaldiaDestino?.meta) {
      throw new Error('No se encontró una alcaldía asociada a ese distrito')
    }

    doc.detalles = doc.detalles || {}
    doc.detalles.detalle_negocio = doc.detalles.detalle_negocio || detalleNegocio
    doc.detalles.detalle_negocio.estado_solicitud = 'pendiente'
    doc.detalles.detalle_negocio.fecha_solicitud = new Date().toISOString()
    doc.detalles.detalle_negocio.fue_rechazado = false
    doc.detalles.detalle_negocio.alcaldia_destino = {
      _id: alcaldiaDestino._id || alcaldiaDestino.meta._id || '',
      nombre_institucional: alcaldiaDestino.meta.nombre_institucional || alcaldiaDestino.detalles?.detalle_alcaldia?.nombre_institucional || '',
      departamento: alcaldiaDestino.meta.departamento || alcaldiaDestino.detalles?.detalle_alcaldia?.departamento || '',
      distrito: alcaldiaDestino.meta.distrito || alcaldiaDestino.detalles?.detalle_alcaldia?.distrito || '',
      municipio: alcaldiaDestino.meta.municipio || alcaldiaDestino.detalles?.detalle_alcaldia?.municipio || ''
    }
    await couch.put(DB, doc)

    // Sincroniza también el estado pendiente en el documento de negocio
    try {
      const negocioDoc = await negocioAPI.getMiNegocio(userId)
      await negocioAPI.updateNegocio(negocioDoc._id, negocioDoc._rev, {
        estado_solicitud: 'pendiente',
        fue_rechazado: false
      })
    } catch (e) {
      console.warn('No se pudo sincronizar estado de solicitud en eventos_negocios', e)
    }

    return { ok: true }
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
