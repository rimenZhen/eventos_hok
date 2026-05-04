<template>
  <q-card flat bordered class="card-adaptable">
    <q-card-section>
      <div class="text-subtitle1 text-weight-bold q-mb-md">Deja tu reseña</div>
      <q-form @submit="emitir" ref="formRef">
        <div class="q-mb-md">
          <div class="text-caption text-grey q-mb-xs">¿Qué te pareció?</div>
          <q-rating v-model="calificacion" size="2em" color="amber" />
        </div>
        
        <q-input 
          v-model="comentario" 
          type="textarea" 
          label="Tu comentario" 
          outlined
          rows="4"
          counter
          maxlength="500"
          :rules="[val => val && val.trim().length > 0 || 'El comentario es requerido', val => val && val.length >= 10 || 'Mínimo 10 caracteres']"
          class="q-mb-md"
        />
        
        <div class="row q-gutter-sm">
          <q-btn 
            type="submit" 
            label="Publicar reseña" 
            color="primary" 
            icon="send"
            :loading="loading"
            :disable="!comentario.trim().length"
          />
          <q-btn 
            label="Cancelar" 
            flat
            @click="resetForm"
          />
        </div>
      </q-form>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['submit'])
const formRef = ref(null)
const calificacion = ref(3)
const comentario = ref('')
const loading = ref(false)

async function emitir() {
  if (!formRef.value) return
  
  const isValid = await formRef.value.validate()
  if (!isValid) return
  
  loading.value = true
  try {
    emit('submit', { calificacion: calificacion.value, comentario: comentario.value })
    resetForm()
  } finally {
    loading.value = false
  }
}

function resetForm() {
  calificacion.value = 3
  comentario.value = ''
  if (formRef.value) {
    formRef.value.resetValidation()
  }
}

defineExpose({ resetForm })
</script>

<style scoped>
.card-adaptable {
  background-color: white;
  color: #1d1d1d;
}

.body--dark .card-adaptable {
  background-color: #1d1d1d;
  color: white;
}
</style>
