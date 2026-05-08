import { couch } from './index'
import {
  getEntityMetricsSummary,
  getProductMetricsSummary,
  recordMetric
} from './metricas'
// DB donde se almacenan los perfiles de usuario (eventos_data)
const DB_USERS = import.meta.env.VITE_DB_DATA
// DB para documentos de negocio (nueva colección). Si no está configurada, cae a VITE_DB_DATA
const DB_NEGOCIOS = import.meta.env.VITE_DB_NEGOCIOS || import.meta.env.VITE_DB_DATA
const DB_LEGACY = import.meta.env.VITE_DB_DATA

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

function construirNegocioDesdeUsuario(userDoc) {
  const detalleNegocio = userDoc?.detalles?.detalle_negocio || {}
  const propietario = {
    _id: userDoc._id,
    nombres: userDoc.nombres || '',
    apellidos: userDoc.apellidos || '',
    correo: userDoc.login?.correo || ''
  }

  return {
    type: 'negocio',
    nombre_comercial: detalleNegocio.nombre_comercial || '',
    descripcion: detalleNegocio.descripcion || '',
    categoria: detalleNegocio.categoria || null,
    horario: detalleNegocio.horario || {},
    departamento: detalleNegocio.departamento || null,
    distrito: detalleNegocio.distrito || null,
    municipio: detalleNegocio.municipio || detalleNegocio.distrito || null,
    localizacion: detalleNegocio.localizacion || { lat: null, lng: null, direccion: '' },
    nit_registro: detalleNegocio.nit_registro || '',
    telefono: detalleNegocio.contacto || detalleNegocio.telefono || '',
    estado: detalleNegocio.estado || 'activo',
    estado_solicitud: detalleNegocio.estado_solicitud || 'pendiente',
    fue_rechazado: detalleNegocio.fue_rechazado || false,
    usuario_propietario: propietario,
    fecha_creacion: new Date().toISOString()
  }
}

async function findNegocioByIdFromDb(dbName, negocioId) {
  try {
    return await couch.get(dbName, negocioId)
  } catch {
    return null
  }
}

async function listNegocios(dbName, selector, options = {}) {
  try {
    const result = await couch.find(dbName, selector, options)
    return result.docs || []
  } catch {
    return []
  }
}

export const negocioAPI = {
  /**
   * Obtiene el documento de negocio asociado al usuario actual.
   */
  async getMiNegocio(userId) {
    const result = await couch.find(DB_NEGOCIOS, {
      type: 'negocio',
      'usuario_propietario._id': userId
    })
    if (result.docs.length === 0) {
      const userDoc = await couch.get(DB_USERS, userId)
      const negocioBase = userDoc?.rol === 'negocio' ? construirNegocioDesdeUsuario(userDoc) : null
      if (!negocioBase) throw new Error('No se encontró el negocio asociado a este usuario')

      const response = await couch.post(DB_NEGOCIOS, negocioBase)
      return { ...negocioBase, _id: response.id, _rev: response.rev }
    }

    const doc = result.docs[0]
    if (normalizarCatalogo(doc)) {
      await couch.put(DB_NEGOCIOS, doc)
    }
    return doc
  },

  /**
   * Obtiene un negocio por id y asegura claves estables en el catálogo.
   */
  async getNegocioById(negocioId) {
    const primary = await findNegocioByIdFromDb(DB_NEGOCIOS, negocioId)
    if (primary) {
      if (normalizarCatalogo(primary)) {
        await couch.put(DB_NEGOCIOS, primary)
      }
      return primary
    }

    const legacy = await findNegocioByIdFromDb(DB_LEGACY, negocioId)
    if (legacy) {
      return legacy
    }

    throw new Error('Negocio no encontrado')
  },

  async listNegociosActivos(selectorExtra = {}, options = {}) {
    const selector = { type: 'negocio', estado: 'activo', ...selectorExtra }
    const primary = await listNegocios(DB_NEGOCIOS, selector, options)
    const legacy = await listNegocios(DB_LEGACY, selector, options)
    const seen = new Set(primary.map(item => item._id))
    return [...primary, ...legacy.filter(item => !seen.has(item._id))]
  },

  /**
   * Actualiza campos del negocio.
   */
  async updateNegocio(negocioId, rev, updates) {
    const doc = await couch.get(DB_NEGOCIOS, negocioId)
    Object.assign(doc, updates, {
      updated_at: new Date().toISOString()
    })
    return couch.put(DB_NEGOCIOS, doc)
  },

  /**
   * Agrega un producto al catálogo.
   */
  async addProducto(negocioId, rev, producto) {
    const doc = await couch.get(DB_NEGOCIOS, negocioId)
    doc.catalogo = doc.catalogo || []
    doc.catalogo.push({
      ...producto,
      catalogKey: producto.catalogKey || crearCatalogKey()
    })
    return couch.put(DB_NEGOCIOS, doc)
  },

  /**
   * Actualiza un producto del catálogo por índice.
   */
  async updateProducto(negocioId, rev, index, producto) {
    const doc = await couch.get(DB_NEGOCIOS, negocioId)
    if (doc.catalogo && doc.catalogo[index]) {
      const catalogKey = doc.catalogo[index].catalogKey || producto.catalogKey || crearCatalogKey()
      doc.catalogo[index] = { ...doc.catalogo[index], ...producto, catalogKey }
      return couch.put(DB_NEGOCIOS, doc)
    }
    throw new Error('Producto no encontrado')
  },

  /**
   * Elimina un producto del catálogo por índice.
   */
  async deleteProducto(negocioId, rev, index) {
    const doc = await couch.get(DB_NEGOCIOS, negocioId)
    if (doc.catalogo && doc.catalogo[index] !== undefined) {
      doc.catalogo.splice(index, 1)

      return couch.put(DB_NEGOCIOS, doc)
    }
    throw new Error('Producto no encontrado')
  },

  /**
   * Registra un click en un producto del catálogo para estadísticas.
   * Guarda un arreglo de timestamps por clave estable del producto.
   */
  async recordCatalogClick(negocioId, productKey) {
    const entityKey = `${negocioId}:${String(productKey)}`
    await recordMetric('product', entityKey)
    return { ok: true, entityKey }
  },

  /**
   * Registra una visita al perfil del negocio.
   * Almacena timestamps de cada visita al perfil.
   */
  async recordProfileView(negocioId) {
    await recordMetric('business', negocioId)
    return { ok: true, entityKey: negocioId }
  },

  /**
   * Devuelve un resumen agregado de métricas para el negocio.
   */
  async getBusinessMetricsSummary(negocioId, options = {}) {
    return getEntityMetricsSummary('business', negocioId, options)
  },

  /**
   * Devuelve un resumen agregado de clicks de catálogo por producto.
   */
  async getCatalogMetricsSummary(negocioId, catalogo = [], options = {}) {
    return getProductMetricsSummary('product', negocioId, catalogo, options)
  },

  /**
   * Registra cuando un usuario agrega el negocio a favoritos.
   * Almacena información del usuario y timestamp.
   */
  async recordFavoritoAñadido(negocioId, meta = {}) {
    const doc = await couch.get(DB_NEGOCIOS, negocioId)
    doc.estadisticas = doc.estadisticas || {}
    doc.estadisticas.favoritosAñadidos = doc.estadisticas.favoritosAñadidos || []
    doc.estadisticas.favoritosAñadidos.push({
      at: new Date().toISOString(),
      userId: meta.userId || null,
      userName: meta.userName || null,
      email: meta.email || null
    })
    await couch.put(DB_NEGOCIOS, doc)
    return doc
  },

  /**
   * Registra cuando un usuario quita el negocio de favoritos.
   * Remueve el registro del usuario de la estadística.
   */
  async removeFavoritoAñadido(negocioId, userId) {
    const doc = await couch.get(DB_NEGOCIOS, negocioId)
    if (doc.estadisticas?.favoritosAñadidos) {
      doc.estadisticas.favoritosAñadidos = doc.estadisticas.favoritosAñadidos.filter(
        fav => fav.userId !== userId
      )
    }
    await couch.put(DB_NEGOCIOS, doc)
    return doc
  }
  ,
  /**
   * Crea un nuevo documento de negocio en la colección de negocios
   * y liga el propietario desde la colección de usuarios (`DB_USERS`).
   */
  async crearNegocio(userId, data = {}) {
    const userDoc = await couch.get(DB_USERS, userId)
    const negocioDoc = {
      ...construirNegocioDesdeUsuario(userDoc),
      ...data,
      usuario_propietario: {
        _id: userId,
        nombres: userDoc.nombres,
        apellidos: userDoc.apellidos,
        correo: userDoc.login?.correo || null
      }
    }
    delete negocioDoc.fecha_creacion
    negocioDoc.fecha_creacion = new Date().toISOString()
    const response = await couch.post(DB_NEGOCIOS, negocioDoc)
    return { ...negocioDoc, _id: response.id, _rev: response.rev }
  },

  /**
   * Agrega una reseña al negocio (almacenado en DB_NEGOCIOS).
   */
  async addResena(negocioId, reseña) {
    const doc = await couch.get(DB_NEGOCIOS, negocioId)
    doc.reseñas = doc.reseñas || []
    doc.reseñas.push(reseña)
    const total = doc.reseñas.reduce((sum, r) => sum + (r.calificacion || 0), 0)
    doc.calificacion_promedio = doc.reseñas.length ? (total / doc.reseñas.length) : 0
    await couch.put(DB_NEGOCIOS, doc)
    return doc
  }
}
