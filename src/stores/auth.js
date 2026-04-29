// src/stores/auth.js
import { defineStore } from 'pinia'
import { authAPI } from 'src/api/auth'

export const useAuthStore = defineStore('auth', {
  state: () => {
  let stored = null
  try {
    stored = JSON.parse(localStorage.getItem('user'))
    // Sanitizar rol si es un objeto (legado)
    if (stored && typeof stored.rol === 'object' && stored.rol !== null) {
      stored.rol = stored.rol.value || stored.rol.label || 'usuario_final'
    }
  } catch {
    stored = null
  }
  return {
    user: stored,
    loading: false,
    error: null
  }
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
      this.loading = true
      this.error = null
      try {
        const user = await authAPI.login(correo, password)
        this.user = user
        // Guardar en localStorage para persistir sesión
        localStorage.setItem('user', JSON.stringify(user))
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    async registro(datos) {
      this.loading = true
      this.error = null
      try {
        const user = await authAPI.registro(datos)
        this.user = user
        localStorage.setItem('user', JSON.stringify(user))
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    async refreshUser() {
      try {
        const fresh = await authAPI.getProfile(this.user._id)
        this.user = fresh
        localStorage.setItem('user', JSON.stringify(fresh))
      } catch {
        this.logout()
      }
    },

    logout() {
      this.user = null
      localStorage.removeItem('user')
      // Si quieres, puedes navegar al inicio
      // pero mejor hacerlo desde el componente que llama

    }
  }
})
