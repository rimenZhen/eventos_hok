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
import { ref, onMounted } from 'vue'
import { alcaldiaAPI } from 'src/api/alcaldia'

const negocios = ref([])
const loading = ref(false)
const columns = [
  { name: 'nombre', label: 'Nombre', field: 'nombre_comercial', align: 'left' },
  { name: 'municipio', label: 'Municipio', field: 'municipio' },
  { name: 'acciones', label: 'Acciones', align: 'center' }
]

onMounted(async () => {
  loading.value = true
  negocios.value = await alcaldiaAPI.getNegociosActivos()
  loading.value = false
})
</script>
