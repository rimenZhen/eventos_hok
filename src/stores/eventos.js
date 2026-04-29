import { defineStore } from 'pinia'
import { couch } from 'src/api/index'
const DB = import.meta.env.VITE_DB_DATA

export const useEventosStore = defineStore('eventos', {
  state: () => ({
    eventos: [],
    loading: false,
    error: null
  }),
  actions: {
    async fetchDestacados() {
      this.loading = true
      try {
        const result = await couch.find(DB, {
          type: 'evento',
          estado: 'activo',
          destacado: true
        }, { limit: 10 })
        this.eventos = result.docs
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },

    async fetchFiltered(filtros = {}) {
      this.loading = true
      this.error = null
      try {
        const selector = {
          type: 'evento',
          estado: 'activo'
        }
        if (filtros.categoria) selector.categoria = filtros.categoria
        if (filtros.departamento) selector.departamento = filtros.departamento
        if (filtros.texto) {
          // Búsqueda insensible a mayúsculas/minúsculas usando expresión regular
          selector.titulo = { $regex: `(?i)${filtros.texto}` }
        }
        const result = await couch.find(DB, selector, { limit: 50 })
        this.eventos = result.docs
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    }

  }
})
