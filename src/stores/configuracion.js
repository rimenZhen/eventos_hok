import { defineStore } from 'pinia'
import { couch } from 'src/api/index'

const DB = import.meta.env.VITE_DB_DATA

export const useConfiguracionStore = defineStore('configuracion', {
  state: () => ({
    departamentos: [],
    categorias: [],
    loading: false,
    error: null
  }),
  actions: {
    async fetchCatalogos() {
      this.loading = true
      try {
        // Obtenemos todos los documentos de configuración
        const result = await couch.find(DB, { type: 'configuracion' })
        if (result.docs) {
          for (const doc of result.docs) {
            if (doc.descripcion.includes('departamento')) {
              this.departamentos = doc.items.filter(i => i.activo)
            } else if (doc.descripcion.includes('categoría')) {
              this.categorias = doc.items.filter(i => i.activo)
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
