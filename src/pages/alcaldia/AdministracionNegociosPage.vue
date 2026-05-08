<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Administración de Negocios</div>
    <q-table :rows="negocios" :columns="columns" row-key="_id" :loading="loading">
      <template v-slot:body-cell-acciones="props">
        <q-td>
          <q-btn flat icon="visibility" @click="$router.push('/negocio/' + props.row._id)" />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { useConfiguracionStore } from 'src/stores/configuracion'
import { alcaldiaAPI } from 'src/api/alcaldia'

const auth = useAuthStore()
const configStore = useConfiguracionStore()
const negocios = ref([])
const loading = ref(false)

const columns = computed(() => [
  { name: 'nombre', label: 'Nombre', field: 'nombre_comercial', align: 'left' },
  {
    name: 'municipio',
    label: 'Municipio',
    field: row => configStore.getDistritoNombre(row.distrito || row.municipio)
  },
  { name: 'acciones', label: 'Acciones', align: 'center' }
])

onMounted(async () => {
  loading.value = true
  try {
    // 1. Asegurar catálogos cargados
    if (configStore.departamentos.length === 0) {
      await configStore.fetchCatalogos()
    }

    // 2. Obtener todos los negocios activos (la API actual no filtra)
    const todos = await alcaldiaAPI.getNegociosActivos()

    // 3. Identidad de la alcaldía actual
    const miAlcaldiaId = auth.user._id
    const miAlcaldiaNombre = auth.user.detalles?.detalle_alcaldia?.nombre_institucional || ''

    // 4. Construir mapa distrito -> alcaldia
    const distritoAlcaldiaMap = new Map()
    configStore.distritos.forEach(d => {
      if (d.alcaldia) distritoAlcaldiaMap.set(d.clave, d.alcaldia)
    })

    const normalize = value => String(value || '').trim().toLowerCase()

    // 5. Filtrar solo los que pertenecen a mi alcaldía
    negocios.value = todos.filter(neg => {
      const aprobadoraId = neg.alcaldia_aprobadora?._id
      if (aprobadoraId) return aprobadoraId === miAlcaldiaId

      const aprobadoraNombre = neg.alcaldia_aprobadora?.nombre_institucional || ''
      if (aprobadoraNombre) return normalize(aprobadoraNombre) === normalize(miAlcaldiaNombre)

      const distritoClave = neg.distrito || neg.municipio
      return distritoClave && distritoAlcaldiaMap.get(distritoClave) === auth.user.detalles?.detalle_alcaldia?.municipio
    })
  } catch (e) {
    console.error('Error cargando administración de negocios:', e)
    negocios.value = []
  } finally {
    loading.value = false
  }
})
</script>
