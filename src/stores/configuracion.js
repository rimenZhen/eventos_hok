import { defineStore } from 'pinia'
import { couch } from 'src/api/index'

const DB = import.meta.env.VITE_DB_DATA

export const useConfiguracionStore = defineStore('configuracion', {
  state: () => ({
    departamentos: [],
    categoriasEventos: [],
    categoriasSitios: [],
    categoriasNegocios: [],
    alcaldias: [],
    distritos: [],
    loading: false,
    error: null
  }),
  actions: {
    async fetchCatalogos() {
      this.loading = true
      try {
        const result = await couch.find(DB, { type: 'configuracion' })
        this.departamentos = []
        this.categoriasEventos = []
        this.categoriasSitios = []
        this.categoriasNegocios = []
        this.alcaldias = []
        this.distritos = []

        if (result.docs) {
          for (const doc of result.docs) {
            const desc = doc.descripcion?.toLowerCase() || ''
            const itemsActivos = doc.items?.filter(i => i.activo) || []

            if (desc.includes('departamento')) {
              this.departamentos = itemsActivos
              // Extraer distritos anidados y añadirlos al array sin sobrescribir lo que ya exista
              const departamentoDistritos = itemsActivos.flatMap(departamento => {
                return (departamento.distritos || [])
                  .filter(distrito => distrito.activo)
                  .map(distrito => ({
                    ...distrito,
                    departamento_clave: departamento.clave,
                    departamento_nombre: departamento.nombre
                  }))
              })
              // Unir sin duplicados por clave
              for (const d of departamentoDistritos) {
                if (!this.distritos.some(ex => ex.clave === d.clave)) {
                  this.distritos.push(d)
                }
              }

            } else if (desc.includes('categorías de eventos') || desc.includes('categorias de eventos')) {
              this.categoriasEventos = itemsActivos
            } else if (desc.includes('categorías de sitios') || desc.includes('categorias de sitios')) {
              this.categoriasSitios = itemsActivos
            } else if (desc.includes('categorías de negocios') || desc.includes('categorias de negocios')) {
              this.categoriasNegocios = itemsActivos
            } else if (desc.includes('alcaldía') || desc.includes('alcaldias')) {
              this.alcaldias = itemsActivos
            } else if (desc.includes('distrito') || desc.includes('distritos')) {
              this.distritos = [...this.distritos, ...itemsActivos]
            }
          }
        }
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },

    getDepartamentosOptions() {
      return this.departamentos.map(departamento => ({
        label: departamento.nombre,
        value: departamento.clave
      }))
    },

    getDistritosByDepartamento(departamentoClave) {
  if (!departamentoClave) return []

  // 1. Distritos que ya tienen departamento_clave (anidados en departamentos)
  const directos = this.distritos.filter(d => d.departamento_clave === departamentoClave)

  // 2. Mapa rápido: clave de alcaldía -> departamento
  const alcaldiaDeptoMap = new Map()
  this.alcaldias.forEach(a => {
    if (a.departamento) alcaldiaDeptoMap.set(a.clave, a.departamento)
  })

  // 3. Distritos que vienen del catálogo separado (tienen propiedad "alcaldia")
  const viaAlcaldia = this.distritos.filter(d => {
    if (d.departamento_clave) return false // ya los tenemos
    return d.alcaldia && alcaldiaDeptoMap.get(d.alcaldia) === departamentoClave
  })

  // 4. Unir, eliminar duplicados por clave y mapear a opciones
  const todos = [...directos, ...viaAlcaldia]
  const unique = new Map()
  todos.forEach(d => {
    if (!unique.has(d.clave)) {
      unique.set(d.clave, { label: d.nombre, value: d.clave })
    }
  })
  return Array.from(unique.values())
},

    getMunicipiosByDistrito(distritoClave) {
      if (!distritoClave) return []

      const distrito = this.distritos.find(item => item.clave === distritoClave)
      return (distrito?.municipios || []).map(municipio => ({
        label: municipio.nombre,
        value: municipio.clave
      }))
    },

    getDistritoByClave(distritoClave) {
      return this.distritos.find(distrito => distrito.clave === distritoClave) || null
    },

    getDepartamentoNombre(departamentoClave) {
      const departamento = this.departamentos.find(item => item.clave === departamentoClave)
      return departamento?.nombre || departamentoClave || ''
    },

    getDistritoNombre(distritoClave) {
      const distrito = this.getDistritoByClave(distritoClave)
      return distrito?.nombre || distritoClave || ''
    },

    getMunicipioNombre(distritoClave, municipioClave) {
      const distrito = this.getDistritoByClave(distritoClave)
      const municipio = distrito?.municipios?.find(item => item.clave === municipioClave)
      return municipio?.nombre || municipioClave || ''
    }
  }
})
