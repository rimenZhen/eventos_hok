// src/api/auth.js
import bcrypt from 'bcryptjs'
import { couch } from './index'

const DB = import.meta.env.VITE_DB_DATA // eventos_data

export const authAPI = {
  /**
   * Login: busca usuario por correo y verifica contraseña.
   * Retorna el documento de usuario (sin la contraseña) si es exitoso.
   */
  async login(correo, password) {
    // Buscar usuario por correo usando Mango
    const result = await couch.find(DB, {
      type: 'usuario',
      'login.correo': correo
    })

    if (result.docs.length === 0) {
      throw new Error('Correo no registrado')
    }

    const usuario = result.docs[0]

    // Verificar contraseña (comparar hash bcrypt)
    const valid = await bcrypt.compare(password, usuario.login.contrasena_hash)
    if (!valid) {
      // Incrementar intentos fallidos
      await this._incrementarIntentos(usuario)
      throw new Error('Contraseña incorrecta')
    }

    // Actualizar último acceso y reiniciar intentos
    await this._actualizarUltimoAcceso(usuario)

    // Retornar usuario sin hash de contraseña
    const { contrasena_hash, ...restoLogin } = usuario.login
    void contrasena_hash
    return {
      ...usuario,
      login: restoLogin
    }
  },

  /**
   * Registro de nuevo usuario.
   * @param {Object} datos - campos: nombres, apellidos, correo, password, rol, detalles
   */
  async registro({ nombres, apellidos, correo, password, rol, detalles }) {
    // Verificar que no exista otro usuario con ese correo
    const existente = await couch.find(DB, {
      type: 'usuario',
      'login.correo': correo
    })
    if (existente.docs.length > 0) {
      throw new Error('El correo ya está registrado')
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    const nuevoUsuario = {
      type: 'usuario',
      fecha_registro: new Date().toISOString(),
      nombres,
      apellidos,
      rol,
      activo: true,
      login: {
        correo,
        contrasena_hash: hash,
        ultimo_acceso: null,
        intentos_fallidos: 0
      },
      detalles: detalles || {}
    }

    // Si es usuario_final, inicializar arrays vacíos
    if (rol === 'usuario_final') {
      nuevoUsuario.detalles.detalle_usuario = {
        ...nuevoUsuario.detalles.detalle_usuario,
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

    const response = await couch.post(DB, nuevoUsuario)
    return { ...nuevoUsuario, _id: response.id, _rev: response.rev }
  },

    // Obtener perfil fresco del usuario
  async getProfile(userId) {
    const result = await couch.find(DB, {
      type: 'usuario',
      _id: userId
    })
    if (result.docs.length === 0) throw new Error('Usuario no encontrado')
    const usuario = result.docs[0]
    // eslint-disable-next-line no-unused-vars
    const { contrasena_hash, ...restoLogin } = usuario.login
    return { ...usuario, login: restoLogin }
  },
  // ---------- Helpers internos ----------

  async _incrementarIntentos(usuario) {
    usuario.login.intentos_fallidos = (usuario.login.intentos_fallidos || 0) + 1
    await couch.put(DB, usuario)
  },

  async _actualizarUltimoAcceso(usuario) {
    usuario.login.ultimo_acceso = new Date().toISOString()
    usuario.login.intentos_fallidos = 0
    await couch.put(DB, usuario)
  }
}
