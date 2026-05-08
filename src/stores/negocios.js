import { defineStore } from 'pinia'
import { negocioAPI } from 'src/api/negocio'

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
        this.negocios = await negocioAPI.listNegociosActivos({}, { limit: 10 })
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
          const selector = {}
          if (filtros.categoria) selector.categoria = filtros.categoria
          if (filtros.departamento) selector.departamento = filtros.departamento
          if (filtros.texto) selector.nombre_comercial = { $regex: `(?i)${filtros.texto}` }

          this.negocios = await negocioAPI.listNegociosActivos(selector, { limit: 50 })
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    }
  }
})
