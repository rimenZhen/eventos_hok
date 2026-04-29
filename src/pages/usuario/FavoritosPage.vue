<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Mis Favoritos</div>
    <q-tabs
      v-model="tab"
      dense
      class="text-grey"
      active-color="primary"
      indicator-color="primary"
    >
      <q-tab name="eventos" label="Eventos" />
      <q-tab name="sitios" label="Sitios" />
      <q-tab name="negocios" label="Negocios" />
    </q-tabs>
    <q-separator />
    <div
      v-if="favoritos.length === 0"
      class="text-center text-grey q-pa-xl"
    >
      No tienes favoritos guardados.
    </div>
    <div v-else class="row q-col-gutter-md q-mt-md">
      <div
        v-for="fav in favoritos"
        :key="fav._id"
        class="col-12 col-sm-6 col-md-4"
      >
        <q-card>
          <q-card-section>
            <div class="text-subtitle1">{{ fav.titulo || fav.nombre || fav.nombre_comercial }}</div>
            <div class="text-caption">{{ fav.departamento }}, {{ fav.municipio }}</div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn
              flat
              round
              icon="delete"
              color="negative"
              @click="eliminarFavorito(tab, fav._id)"
            />
            <q-btn flat :to="detalleUrl(fav)" label="Ver" />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { usuariosAPI } from 'src/api/usuarios'

const auth = useAuthStore()
const tab = ref('eventos')

const favoritos = computed(() => {
  const detalle = auth.user?.detalles?.detalle_usuario
  if (!detalle) return []
  if (tab.value === 'eventos') return detalle.eventos_guardados || []
  if (tab.value === 'sitios') return detalle.sitios_guardados || []
  return detalle.negocios_guardados || []
})

function detalleUrl(item) {
  const tipo =
    tab.value === 'eventos' ? 'evento' : tab.value === 'sitios' ? 'sitio' : 'negocio'
  return `/${tipo}/${item._id}`
}

async function eliminarFavorito(tipo, id) {
  // Mapear 'eventos' -> 'evento', 'sitios' -> 'sitio', 'negocios' -> 'negocio'
  const tipoSingular = tipo.slice(0, -1)
  try {
    await usuariosAPI.removeFavorito(auth.user._id, tipoSingular, id)
    await auth.refreshUser()
  } catch (e) {
    console.error(e)
  }
}
</script>
