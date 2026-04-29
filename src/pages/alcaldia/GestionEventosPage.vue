<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5">Gestión de Eventos</div>
      <q-btn label="Crear Evento" color="primary" icon="add" to="/alcaldia/eventos/crear" />
    </div>
    <q-table :rows="eventos" :columns="columns" row-key="_id" :loading="loading">
      <template v-slot:body-cell-acciones="props">
        <q-td>
          <q-btn flat round icon="edit" @click="$router.push(`/alcaldia/eventos/editar/${props.row._id}`)" />
          <q-btn flat round icon="archive" color="negative" @click="archivar(props.row)" />
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
const eventos = ref([])
const loading = ref(false)
const columns = [
  { name: 'titulo', label: 'Título', field: 'titulo', align: 'left' },
  { name: 'municipio', label: 'Municipio', field: 'municipio' },
  { name: 'estado', label: 'Estado', field: 'estado' },
  { name: 'acciones', label: 'Acciones', align: 'center' }
]

onMounted(async () => {
  loading.value = true
  eventos.value = await alcaldiaAPI.getEventos(auth.user._id)
  loading.value = false
})

async function archivar(evento) {
  await alcaldiaAPI.updateEvento(evento._id, evento._rev, { estado: 'archivado' })
  eventos.value = eventos.value.filter(e => e._id !== evento._id)
}
</script>
