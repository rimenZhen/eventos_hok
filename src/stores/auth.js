// src/stores/auth.js
import { defineStore } from 'pinia'
import { authAPI } from 'src/api/auth'

function sanitizeRol(rol) {
    if (typeof rol === 'object' && rol !== null) {
      return rol.value || rol.label || 'usuario_final'
    }
    return rol
}

export const useAuthStore = defineStore('auth', {
  state: () => {
    let stored = null
    try {
      stored = JSON.parse(localStorage.getItem('user'))
      if (stored) stored.rol = sanitizeRol(stored.rol)
    } catch {
      stored = null
    }
    return { user: stored, loading: false, error: null }
  },

  getters: {
    isLoggedIn: (state) => !!state.user,
    rol: (state) => state.user?.rol || null,
    userId: (state) => state.user?._id || null,
    userName: (state) =>
      state.user ? `${state.user.nombres} ${state.user.apellidos}` : ''
  },

  actions: {
    async login(correo, password) {
      this.loading = true; this.error = null
      try {
        const user = await authAPI.login(correo, password)
        user.rol = sanitizeRol(user.rol)   // ← sanitizar
        this.user = user
        localStorage.setItem('user', JSON.stringify(user))
      } catch (err) { this.error = err.message; throw err }
      finally { this.loading = false }
    },

    async registro(datos) {
      this.loading = true; this.error = null
      try {
        const user = await authAPI.registro(datos)
        user.rol = sanitizeRol(user.rol)   // ← sanitizar
        this.user = user
        localStorage.setItem('user', JSON.stringify(user))
      } catch (err) { this.error = err.message; throw err }
      finally { this.loading = false }
    },

    async refreshUser() {
      try {
        const fresh = await authAPI.getProfile(this.user._id)
        fresh.rol = sanitizeRol(fresh.rol) // ← sanitizar
        this.user = fresh
        localStorage.setItem('user', JSON.stringify(fresh))
      } catch { this.logout() }
    },

    logout() {
      this.user = null
      localStorage.removeItem('user')
      // Si quieres, puedes navegar al inicio
      // pero mejor hacerlo desde el componente que llama

    }
  }
})
