<template>
  <q-btn
    flat
    color="primary"
    icon="check_circle"
    label="Marcar como visitado"
    @click="marcarVisitado"
    :disable="yaVisitado"
  >
    <q-tooltip v-if="yaVisitado">Ya marcado como visitado</q-tooltip>
  </q-btn>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { usuariosAPI } from 'src/api/usuarios'

const props = defineProps({
  tipo: { type: String, required: true },
  item: { type: Object, required: true }
})

const auth = useAuthStore()

const yaVisitado = computed(() => {
  const historial = auth.user?.detalles?.detalle_usuario?.historial_viajes || []
  return historial.some(v =>
    v.titulo === (props.item.titulo || props.item.nombre || props.item.nombre_comercial)
  )
})

async function marcarVisitado() {
  if (!auth.isLoggedIn) return
  try {
    const visita = {
      tipo: props.tipo,
      titulo: props.item.titulo || props.item.nombre || props.item.nombre_comercial,
      departamento: props.item.departamento,
      municipio: props.item.municipio,
      fecha_visita: new Date().toISOString().substring(0, 10)
    }
    await usuariosAPI.addHistorial(auth.user._id, visita)
    await auth.refreshUser()
  } catch (e) {
    console.error(e)
  }
}
</script>
