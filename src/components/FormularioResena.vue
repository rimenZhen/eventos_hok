<template>
  <q-card flat bordered>
    <q-card-section>
      <div class="text-subtitle1">Deja tu reseña</div>
      <q-form @submit="emitir">
        <div class="row items-center q-mb-sm">
          <q-rating v-model="calificacion" size="2em" color="amber" />
        </div>
        <q-input v-model="comentario" type="textarea" label="Tu comentario" rows="3" outlined />
        <q-btn type="submit" label="Publicar" color="primary" class="q-mt-sm" />
      </q-form>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['submit'])
const calificacion = ref(3)
const comentario = ref('')

function emitir() {
  emit('submit', { calificacion: calificacion.value, comentario: comentario.value })
  // Limpiar campos después de enviar
  calificacion.value = 3
  comentario.value = ''
}
</script>
