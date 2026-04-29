import { defineStore } from 'pinia'
import { couch } from 'src/api/index'
const DB = import.meta.env.VITE_DB_DATA

export const useSitiosStore = defineStore('sitios', {
  state: () => ({
    sitios: [],
    loading: false,
    error: null
  }),
  actions: {
    async fetchDestacados() {
      this.loading = true
      try {
        const result = await couch.find(DB, {
          type: 'sitio',
          estado: 'activo',
          destacado: true
        }, { limit: 10 })
        this.sitios = result.docs
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
          type: 'sitio',
          estado: 'activo'
        }
        if (filtros.categoria) selector.categoria = filtros.categoria
        if (filtros.departamento) selector.departamento = filtros.departamento
        if (filtros.texto) {
          selector.nombre = { $regex: `(?i)${filtros.texto}` }
        }
        const result = await couch.find(DB, selector, { limit: 50 })
        this.sitios = result.docs
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    }
  }
})
