<template>
  <q-btn
    flat
    round
    :icon="esFavorito ? 'favorite' : 'favorite_border'"
    :color="esFavorito ? 'red' : 'grey'"
    @click="toggleFavorito"
  >
    <q-tooltip>{{ esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos' }}</q-tooltip>
  </q-btn>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { usuariosAPI } from 'src/api/usuarios'
import { negocioAPI } from 'src/api/negocio'

const props = defineProps({
  tipo: { type: String, required: true },  // 'evento', 'sitio', 'negocio'
  item: { type: Object, required: true }
})

const auth = useAuthStore()

const campoFavorito = computed(() => {
  const map = {
    evento: 'eventos_guardados',
    sitio: 'sitios_guardados',
    negocio: 'negocios_guardados'
  }
  return map[props.tipo] || ''
})

const favoritos = computed(() =>
  auth.user?.detalles?.detalle_usuario?.[campoFavorito.value] || []
)

const esFavorito = computed(() =>
  favoritos.value.some(f => f._id === props.item._id)
)

async function toggleFavorito() {
  if (!auth.isLoggedIn) return
  try {
    if (esFavorito.value) {
      await usuariosAPI.removeFavorito(auth.user._id, props.tipo, props.item._id)
      // Registrar en estadísticas del negocio si es tipo 'negocio'
      if (props.tipo === 'negocio') {
        await negocioAPI.removeFavoritoAñadido(props.item._id, auth.user._id)
      }
    } else {
      const snapshot = {
        _id: props.item._id,
        titulo: props.item.titulo || props.item.nombre || props.item.nombre_comercial,
        departamento: props.item.departamento,
        municipio: props.item.municipio
      }
      await usuariosAPI.addFavorito(auth.user._id, props.tipo, snapshot)
      // Registrar en estadísticas del negocio si es tipo 'negocio'
      if (props.tipo === 'negocio') {
        await negocioAPI.recordFavoritoAñadido(props.item._id, {
          userId: auth.user._id,
          userName: auth.user.nombre || 'Usuario',
          email: auth.user.email || null
        })
      }
    }
    await auth.refreshUser()
  } catch (e) {
    console.error(e)
  }
}
</script>
