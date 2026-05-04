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
    field: row => configStore.getDistritoNombre(row.municipio) // row.municipio guarda la clave del distrito
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

    // 3. Clave de la alcaldía actual
    const miAlcaldia = auth.user.detalles?.detalle_alcaldia?.municipio

    // 4. Construir mapa distrito -> alcaldia
    const distritoAlcaldiaMap = new Map()
    configStore.distritos.forEach(d => {
      if (d.alcaldia) distritoAlcaldiaMap.set(d.clave, d.alcaldia)
    })

    // 5. Filtrar solo los que pertenecen a mi alcaldía
    if (miAlcaldia) {
      negocios.value = todos.filter(neg => {
        const distritoClave = neg.municipio // asumimos que es la clave del distrito
        return distritoClave && distritoAlcaldiaMap.get(distritoClave) === miAlcaldia
      })
    } else {
      negocios.value = []
    }
  } catch (e) {
    console.error('Error cargando administración de negocios:', e)
    negocios.value = []
  } finally {
    loading.value = false
  }
})
</script>
