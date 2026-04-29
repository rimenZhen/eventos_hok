<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Mis Reseñas</div>
    <div
      v-if="resenas.length === 0"
      class="text-grey q-pa-xl text-center"
    >
      No has escrito reseñas aún.
    </div>
    <q-list separator v-else>
      <q-item v-for="(r, idx) in resenas" :key="idx">
        <q-item-section>
          <q-item-label>{{ r.destino_nombre }} ({{ r.tipo_destino }})</q-item-label>
          <q-item-label caption>{{ r.comentario }}</q-item-label>
          <q-rating
            :model-value="r.calificacion"
            readonly
            size="1em"
            color="amber"
          />
        </q-item-section>
        <q-item-section side>{{ r.fecha?.substring(0, 10) }}</q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from 'src/stores/auth'

const auth = useAuthStore()
const resenas = computed(
  () => auth.user?.detalles?.detalle_usuario?.reseñas || []
)
</script>
