<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Historial de Viajes</div>
    <q-list separator v-if="historial.length">
      <q-item v-for="(item, idx) in historial" :key="idx">
        <q-item-section>
          <q-item-label>{{ item.titulo }}</q-item-label>
          <q-item-label caption>
            {{ item.departamento }}, {{ item.municipio }} – {{ item.fecha_visita }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-badge>{{ item.tipo }}</q-badge>
        </q-item-section>
      </q-item>
    </q-list>
    <div v-else class="text-grey q-pa-xl text-center">
      No has visitado ningún lugar aún.
    </div>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from 'src/stores/auth'

const auth = useAuthStore()
const historial = computed(
  () => auth.user?.detalles?.detalle_usuario?.historial_viajes || []
)
</script>
