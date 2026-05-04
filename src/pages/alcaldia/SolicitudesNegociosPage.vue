<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Solicitudes de Negocios</div>
    <q-table :rows="solicitudes" :columns="columns" row-key="_id" :loading="loading">
      <template v-slot:body-cell-acciones="props">
        <q-td>
          <q-btn flat color="positive" icon="check" @click="cambiarEstado(props.row, 'aprobado')" />
          <q-btn flat color="negative" icon="close" @click="cambiarEstado(props.row, 'rechazado')" />
          <q-btn flat color="warning" icon="info" @click="cambiarEstado(props.row, 'observacion')" />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { useConfiguracionStore } from 'src/stores/configuracion'
import { alcaldiaAPI } from 'src/api/alcaldia'

const auth = useAuthStore()
const configStore = useConfiguracionStore()
const solicitudes = ref([])
const loading = ref(false)

const getNombreDepartamento = (valor) => configStore.getDepartamentoNombre(valor)
const getNombreDistrito = (valor) => configStore.getDistritoNombre(valor)
const getNombreMunicipio = (distrito, municipio) => configStore.getMunicipioNombre(distrito, municipio)

const columns = [
  { name: 'nombre', label: 'Nombre', field: row => row.nombres + ' ' + row.apellidos, align: 'left' },
  { name: 'comercial', label: 'Comercial', field: row => row.detalles?.detalle_negocio?.nombre_comercial },
  { name: 'departamento', label: 'Departamento', field: row => getNombreDepartamento(row.detalles?.detalle_negocio?.departamento) },
  { name: 'distrito', label: 'Distrito', field: row => getNombreDistrito(row.detalles?.detalle_negocio?.distrito) },
  { name: 'municipio', label: 'Municipio', field: row => getNombreMunicipio(row.detalles?.detalle_negocio?.distrito, row.detalles?.detalle_negocio?.municipio) },
  { name: 'estado', label: 'Estado', field: row => row.detalles?.detalle_negocio?.estado_solicitud },
  { name: 'acciones', label: 'Acciones', align: 'center' }
]

onMounted(async () => {
  loading.value = true
  if (configStore.departamentos.length === 0) {
    await configStore.fetchCatalogos()
  }
  solicitudes.value = await alcaldiaAPI.getSolicitudesNegocios(auth.user.detalles?.detalle_alcaldia?.distrito || null)
  loading.value = false
})

async function cambiarEstado(row, nuevoEstado) {
  const alcaldiaData = {
    _id: auth.user._id,
    nombre_institucional: auth.user.detalles?.detalle_alcaldia?.nombre_institucional || '',
    departamento: auth.user.detalles?.detalle_alcaldia?.departamento || '',
    distrito: auth.user.detalles?.detalle_alcaldia?.distrito || '',
    municipio: auth.user.detalles?.detalle_alcaldia?.municipio || ''
  }
  await alcaldiaAPI.cambiarEstadoSolicitud(row._id, nuevoEstado, alcaldiaData)
  solicitudes.value = solicitudes.value.filter(s => s._id !== row._id)
}
</script>
