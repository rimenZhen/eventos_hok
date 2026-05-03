import { defineStore } from 'pinia'
import { couch } from 'src/api/index'

const DB = import.meta.env.VITE_DB_DATA

export const useConfiguracionStore = defineStore('configuracion', {
  state: () => ({
    departamentos: [],
    categoriasEventos: [],
    categoriasSitios: [],
    categoriasNegocios: [],
    loading: false,
    error: null
  }),
  actions: {
    async fetchCatalogos() {
      this.loading = true
      try {
        const result = await couch.find(DB, { type: 'configuracion' })
        if (result.docs) {
          for (const doc of result.docs) {
            const desc = doc.descripcion?.toLowerCase() || ''
            const itemsActivos = doc.items?.filter(i => i.activo) || []

            if (desc.includes('departamento')) {
              this.departamentos = itemsActivos
            } else if (desc.includes('categorías de eventos') || desc.includes('categorias de eventos')) {
              this.categoriasEventos = itemsActivos
            } else if (desc.includes('categorías de sitios') || desc.includes('categorias de sitios')) {
              this.categoriasSitios = itemsActivos
            } else if (desc.includes('categorías de negocios') || desc.includes('categorias de negocios')) {
              this.categoriasNegocios = itemsActivos
            }
          }
        }
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    }
  }
})
