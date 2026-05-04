<!-- src/components/HorarioSemanal.vue -->
<template>
  <div>
    <div
      v-for="dia in dias"
      :key="dia.nombre"
      class="row items-center q-mb-sm q-col-gutter-sm"
    >
      <div class="col-3">{{ dia.nombre }}</div>
      <div class="col-2">
        <q-toggle v-model="dia.abierto" color="positive" :disable="props.readonly" />
      </div>
      <div v-if="dia.abierto" class="col-7 row q-col-gutter-sm">
        <q-input
          v-model="dia.apertura"
          mask="##:##"
          label="Apertura"
          dense
          outlined
          :disable="props.readonly"
          class="col"
        />
        <q-input
          v-model="dia.cierre"
          mask="##:##"
          label="Cierre"
          dense
          outlined
          :disable="props.readonly"
          class="col"
        />
      </div>
      <div v-else class="col-7 text-grey q-pl-md">Cerrado</div>
    </div>
    <div class="row q-mt-sm">
      <q-checkbox v-model="cerradoFestivos" label="Cerrado en festivos" :disable="props.readonly" />
    </div>
    <q-input
      v-model="nota"
      label="Nota adicional"
      outlined
      class="q-mt-sm"
    />
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  readonly: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])

const dias = reactive([
  { nombre: 'Lunes', abierto: true, apertura: '08:00', cierre: '17:00' },
  { nombre: 'Martes', abierto: true, apertura: '08:00', cierre: '17:00' },
  { nombre: 'Miércoles', abierto: true, apertura: '08:00', cierre: '17:00' },
  { nombre: 'Jueves', abierto: true, apertura: '08:00', cierre: '17:00' },
  { nombre: 'Viernes', abierto: true, apertura: '08:00', cierre: '17:00' },
  { nombre: 'Sábado', abierto: true, apertura: '08:00', cierre: '17:00' },
  { nombre: 'Domingo', abierto: false, apertura: '', cierre: '' }
])
const cerradoFestivos = ref(false)
const nota = ref('')

// Inicializar con los valores existentes si se pasan
watch(
  () => props.modelValue,
  (val) => {
    if (val && Object.keys(val).length > 0) {
      Object.entries(val).forEach(([dia, datos]) => {
        if (dia === 'cerrado_festivos') {
          cerradoFestivos.value = datos
        } else if (dia === 'nota') {
          nota.value = datos || ''
        } else {
          const idx = dias.findIndex(d => d.nombre.toLowerCase() === dia.toLowerCase())
          if (idx !== -1) {
            dias[idx].abierto = datos.abierto ?? true
            dias[idx].apertura = datos.apertura || '08:00'
            dias[idx].cierre = datos.cierre || '17:00'
          }
        }
      })
    }
    // Si no hay datos, se mantienen los valores por defecto
  },
  { immediate: true }
)

// Emitir el objeto horario cuando cambia cualquier parte
const emitirHorario = () => {
  const horario = {}
  dias.forEach(d => {
    const nombre = d.nombre.toLowerCase()
    horario[nombre] = {
      abierto: d.abierto,
      apertura: d.abierto ? d.apertura : null,
      cierre: d.abierto ? d.cierre : null
    }
  })
  horario.cerrado_festivos = cerradoFestivos.value
  horario.nota = nota.value
  emit('update:modelValue', horario)
}

// Observar cambios en los días
dias.forEach(d => {
  watch(() => d.abierto, emitirHorario)
  watch(() => d.apertura, emitirHorario)
  watch(() => d.cierre, emitirHorario)
})
watch(cerradoFestivos, emitirHorario)
watch(nota, emitirHorario)
</script>
