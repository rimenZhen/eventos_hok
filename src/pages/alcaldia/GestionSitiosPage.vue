<!-- src/pages/alcaldia/GestionSitiosPage.vue -->
<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Gestión de Sitios Turísticos</div>
      <q-btn
        label="Crear Sitio"
        color="primary"
        icon="add"
        to="/alcaldia/sitios/crear"
      />
    </div>
    <q-table
      :rows="sitios"
      :columns="columns"
      row-key="_id"
      :loading="loading"
    >
      <template v-slot:body-cell-acciones="props">
        <q-td>
          <q-btn
            flat
            round
            icon="edit"
            @click="$router.push(`/alcaldia/sitios/editar/${props.row._id}`)"
          />
          <q-btn
            flat
            round
            icon="archive"
            color="negative"
            @click="archivar(props.row)"
          />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { alcaldiaAPI } from 'src/api/alcaldia'

const auth = useAuthStore()
const sitios = ref([])
const loading = ref(false)

const columns = [
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left' },
  { name: 'municipio', label: 'Municipio', field: 'municipio' },
  { name: 'estado', label: 'Estado', field: 'estado' },
  { name: 'acciones', label: 'Acciones', align: 'center' }
]

onMounted(async () => {
  loading.value = true
  try {
    sitios.value = await alcaldiaAPI.getSitios(auth.user._id)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})

async function archivar(sitio) {
  try {
    await alcaldiaAPI.updateSitio(sitio._id, sitio._rev, { estado: 'archivado' })
    sitios.value = sitios.value.filter(s => s._id !== sitio._id)
  } catch (e) {
    console.error(e)
  }
}
</script>
