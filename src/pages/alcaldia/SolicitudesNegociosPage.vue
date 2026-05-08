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

const columns = [
  { name: 'nombre', label: 'Propietario', field: row => (row.usuario_propietario?.nombres || '') + ' ' + (row.usuario_propietario?.apellidos || ''), align: 'left' },
  { name: 'comercial', label: 'Comercial', field: row => row.nombre_comercial },
  { name: 'departamento', label: 'Departamento', field: row => getNombreDepartamento(row.departamento) },
  { name: 'distrito', label: 'Distrito', field: row => getNombreDistrito(row.distrito) },
  { name: 'estado', label: 'Estado', field: row => row.estado_solicitud },
  { name: 'acciones', label: 'Acciones', align: 'center' }
]

onMounted(async () => {
  loading.value = true
  if (configStore.departamentos.length === 0) {
    await configStore.fetchCatalogos()
  }

  const miAlcaldiaId = auth.user._id
  const miAlcaldiaNombre = auth.user.detalles?.detalle_alcaldia?.nombre_institucional || ''

  // Obtener todas las solicitudes desde BD de negocios
  const todas = await alcaldiaAPI.getSolicitudesNegocios()

  const normalize = value => String(value || '').trim().toLowerCase()
  solicitudes.value = todas.filter(sol => {
    const destinoId = sol.alcaldia_destino?._id || sol.alcaldia_aprobadora?._id
    if (destinoId) return destinoId === miAlcaldiaId

    const destinoNombre = sol.alcaldia_destino?.nombre_institucional || sol.alcaldia_aprobadora?.nombre_institucional || ''
    if (destinoNombre) return normalize(destinoNombre) === normalize(miAlcaldiaNombre)

    return false
  })

  loading.value = false
})

async function cambiarEstado(row, nuevoEstado) {
  const alcaldiaData = {
    _id: auth.user._id,
    nombre_institucional: auth.user.detalles?.detalle_alcaldia?.nombre_institucional || '',
    departamento: auth.user.detalles?.detalle_alcaldia?.departamento || '',
    municipio: auth.user.detalles?.detalle_alcaldia?.municipio || ''
  }
  // row es el negocio document, row._id es el negocioId
  await alcaldiaAPI.cambiarEstadoSolicitud(row._id, nuevoEstado, alcaldiaData)
  solicitudes.value = solicitudes.value.filter(s => s._id !== row._id)
}
</script>
