import { defineStore } from 'pinia'
import { couch } from 'src/api/index'
const DB = import.meta.env.VITE_DB_DATA

export const useNegociosStore = defineStore('negocios', {
  state: () => ({
    negocios: [],
    loading: false,
    error: null
  }),
  actions: {
    async fetchActivos() {
      this.loading = true
      try {
        const result = await couch.find(DB, {
          type: 'negocio',
          estado: 'activo'
        }, { limit: 10 })
        this.negocios = result.docs
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
          type: 'negocio',
          estado: 'activo'
        }
        if (filtros.categoria) selector.categoria = filtros.categoria
        if (filtros.departamento) selector.departamento = filtros.departamento
        if (filtros.texto) {
          selector.nombre_comercial = { $regex: `(?i)${filtros.texto}` }
        }
        const result = await couch.find(DB, selector, { limit: 50 })
        this.negocios = result.docs
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    }
  }
})
