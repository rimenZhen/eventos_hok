<template>
  <q-page padding class="resenas-page">
    <!-- Encabezado -->
    <div class="row q-col-gutter-md items-start q-mb-xl">
      <div class="col-12 col-md-8">
        <div class="text-overline text-cyan text-weight-bold">COMUNIDAD & FEEDBACK</div>
        <div class="text-h2 text-weight-bolder q-mt-sm">Mis Reseñas</div>
        <p class="text-grey-5 q-mt-md text-subtitle1" style="max-width: 600px;">
          Comparte tus experiencias y ayuda a otros viajeros a descubrir la magia oculta de El Salvador. 
          Tus memorias son el mapa para el próximo explorador.
        </p>
        
        <!-- BOTONES DE ACCIÓN PRINCIPALES -->
        <div class="row q-gutter-sm q-mt-sm">
          <q-btn 
            v-if="!modoEdicion" 
            color="cyan" 
            icon="add" 
            label="Escribir Reseña" 
            class="text-weight-bold" 
            @click="mostrarDialogo = true" 
          />
          <q-btn 
            v-if="!modoEdicion && resenas.length > 0" 
            outline 
            color="cyan" 
            icon="checklist" 
            label="Modificar / Eliminar" 
            class="text-weight-bold" 
            @click="toggleModoEdicion" 
          />

          <!-- Modo Edición activo -->
          <q-btn 
            v-if="modoEdicion" 
            color="negative" 
            icon="delete" 
            :label="`Eliminar (${seleccionadas.length})`" 
            class="text-weight-bold" 
            :disable="seleccionadas.length === 0" 
            @click="eliminarSeleccionadas" 
          />
          <q-btn 
            v-if="modoEdicion" 
            flat 
            color="white" 
            label="Cancelar" 
            @click="toggleModoEdicion" 
          />
        </div>
      </div>
      
      <!-- Contador de Reseñas -->
      <div class="col-12 col-md-4 flex justify-end">
        <q-card flat class="count-card q-pa-md bg-grey-10 text-white">
          <div class="row items-center no-wrap">
            <div class="text-h3 text-weight-bolder text-cyan q-mr-md">{{ totalResenas }}</div>
            <div class="text-caption text-uppercase text-grey-5" style="line-height: 1.1">
              Reseñas<br>Publicadas
            </div>
          </div>
        </q-card>
      </div>
    </div>

    <!-- Estado Vacío -->
    <div v-if="resenas.length === 0" class="empty-state text-center q-my-xl q-pa-xl">
      <q-icon name="rate_review" size="80px" color="grey-9" />
      <div class="text-h5 text-grey-5 q-mt-md">Aún no has publicado ninguna reseña</div>
      <div class="text-subtitle1 text-grey-7">Haz clic en "Escribir Reseña" para empezar.</div>
    </div>

    <!-- Listado de Reseñas -->
    <div v-else class="row q-col-gutter-lg">
      <!-- Columna Izquierda: Reseña Principal (La más reciente) -->
      <div class="col-12 col-md-7">
        <q-card 
          flat 
          class="main-review-card q-pa-lg" 
          :class="{'border-negative': seleccionadas.includes(resenas[0].id)}"
        >
          <div class="row items-center q-mb-md">
            <q-avatar size="80px" class="q-mr-md border-cyan">
              <q-img :src="resenas[0].imagen || 'https://cdn.quasar.dev/img/parallax2.jpg'" />
            </q-avatar>
            <div class="col">
              <div class="text-h4 text-weight-bold">{{ resenas[0].lugar }}</div>
              <div class="row items-center">
                <q-rating v-model="resenas[0].puntos" readonly size="18px" color="cyan" />
                <span class="text-grey-5 q-ml-sm">Reciente</span>
              </div>
            </div>
            
            <!-- Checkbox solo en modo edición -->
            <q-checkbox v-if="modoEdicion" v-model="seleccionadas" :val="resenas[0].id" color="negative" size="lg" />
          </div>

          <div class="review-content q-my-lg">
            <p class="text-italic text-h5 text-grey-4 text-weight-light">
              "{{ resenas[0].comentario }}"
            </p>
          </div>

          <div class="text-caption text-grey-5 q-mt-xl">Publicado el: {{ resenas[0].fecha }}</div>
        </q-card>
      </div>

      <!-- Columna Derecha: Reseñas Secundarias -->
      <div class="col-12 col-md-5">
        <div class="column q-gutter-y-md">
          <q-card 
            v-for="resena in resenas.slice(1)" 
            :key="resena.id" 
            flat 
            class="secondary-review-card q-pa-md"
            :class="{'border-negative': seleccionadas.includes(resena.id)}"
          >
            <div class="row justify-between items-start no-wrap">
              <div>
                <div class="text-h6 text-weight-bold">{{ resena.lugar }}</div>
                <q-rating v-model="resena.puntos" readonly size="14px" color="cyan" />
              </div>
              
              <!-- Checkbox solo en modo edición -->
              <q-checkbox v-if="modoEdicion" v-model="seleccionadas" :val="resena.id" color="negative" />
            </div>
            
            <p class="text-grey-4 q-mt-md ellipsis-3-lines">
              {{ resena.comentario }}
            </p>
            
            <div class="text-overline text-grey-6 q-mt-sm">
              PUBLICADO: {{ resena.fecha }}
            </div>
          </q-card>
        </div>
      </div>
    </div>

    <!-- DIÁLOGO PARA AGREGAR NUEVA RESEÑA -->
    <q-dialog v-model="mostrarDialogo" persistent>
      <q-card style="min-width: 400px; border-radius: 15px;" class="bg-grey-10 text-white">
        <q-card-section>
          <div class="text-h6 text-cyan text-weight-bold">Nueva Reseña</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input 
            v-model="formularioResena.lugar" 
            label="Lugar o Establecimiento" 
            dark color="cyan" filled
          />
          <div class="q-mt-md text-grey-5">
            Calificación: 
            <q-rating v-model="formularioResena.puntos" size="2em" color="cyan" class="q-ml-sm" />
          </div>
          <q-input 
            v-model="formularioResena.comentario" 
            type="textarea" 
            label="¿Qué te pareció el lugar?" 
            dark color="cyan" filled class="q-mt-md" 
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cerrar" v-close-popup color="white" />
          <q-btn unelevated label="Publicar" color="cyan" @click="guardarResena" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'

// 1. Array vacío (Sin ejemplos de prueba)
const resenas = ref([])

// 2. Estado del Modo Edición
const modoEdicion = ref(false)
const seleccionadas = ref([])

function toggleModoEdicion() {
  modoEdicion.value = !modoEdicion.value
  seleccionadas.value = []
}

function eliminarSeleccionadas() {
  resenas.value = resenas.value.filter(resena => !seleccionadas.value.includes(resena.id))
  seleccionadas.value = []
  if (resenas.value.length === 0) modoEdicion.value = false
}

// 3. Agregar Reseña
const mostrarDialogo = ref(false)
const formularioResena = ref({ lugar: '', puntos: 3, comentario: '' })

function guardarResena() {
  if (!formularioResena.value.lugar || !formularioResena.value.comentario) return;

  const fechaActual = new Date().toLocaleDateString('es-ES', { 
    day: '2-digit', month: 'short', year: 'numeric' 
  }).toUpperCase()

  resenas.value.unshift({
    id: Date.now(), // ID único basado en timestamp
    lugar: formularioResena.value.lugar,
    puntos: formularioResena.value.puntos,
    comentario: formularioResena.value.comentario,
    fecha: fechaActual,
    imagen: ''
  })

  // Reset del form
  formularioResena.value = { lugar: '', puntos: 3, comentario: '' }
}

const totalResenas = computed(() => resenas.value.length)
</script>

<style lang="scss" scoped>
.resenas-page {
  background-color: #000000;
  color: white;
  min-height: 100vh;
}

.empty-state {
  background: #0a0a0a;
  border: 1px dashed #222;
  border-radius: 24px;
}

.count-card {
  border-radius: 12px;
  border: 1px solid #333;
}

.main-review-card {
  background: linear-gradient(145deg, #121212, #080808);
  border-radius: 28px;
  border: 1px solid #1a1a1a;
  transition: border 0.3s;
  
  .border-cyan {
    border: 2px solid #00bcd4;
  }
}

.secondary-review-card {
  background: #111;
  border-radius: 20px;
  border: 1px solid #222;
  transition: all 0.3s;
}

.border-negative {
  border-color: #C10015 !important;
  background: rgba(193, 0, 21, 0.05) !important;
}

.review-content {
  line-height: 1.6;
}

@media (max-width: 959px) {
  .resenas-page {
    padding: 1rem;
  }

  .main-review-card,
  .secondary-review-card,
  .count-card {
    width: 100%;
  }

  .count-card {
    margin-top: 1rem;
  }
}

@media (max-width: 599px) {
  .main-review-card,
  .secondary-review-card {
    border-radius: 20px;
  }

  .review-content p {
    font-size: 0.95rem;
  }
}
</style>