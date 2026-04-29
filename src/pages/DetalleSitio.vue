<template>
  <q-page v-if="sitio" padding>
    <q-img :src="imagenPortada" class="rounded-borders" style="max-height: 400px" />
    <div class="row items-center q-mt-md">
      <div class="text-h4">{{ sitio.titulo }}</div>
      <q-space />
      <BotonFavorito v-if="auth.isLoggedIn && auth.rol === 'usuario_final'" tipo="sitio" :item="sitio" />
      <BotonVisita v-if="auth.isLoggedIn && auth.rol === 'usuario_final'" tipo="sitio" :item="sitio" />
    </div>
    <div class="q-mt-md">
      <div class="text-subtitle1 text-grey">{{ sitio.municipio }}, {{ sitio.departamento }}</div>
      <p class="q-mt-sm">{{ sitio.descripcion }}</p>
      <!-- Galería de imágenes extra -->
      <div v-if="sitio.imagenes_extra?.length" class="row q-col-gutter-sm q-mt-md">
        <div v-for="(img, idx) in sitio.imagenes_extra" :key="idx" class="col-6 col-md-3">
          <q-img :src="getImagenUrl(img)" :ratio="4/3" class="rounded-borders cursor-pointer" />
        </div>
      </div>
      <!-- Horario -->
      <div v-if="sitio.horario" class="q-mt-md">
        <div class="text-h6">Horario</div>
        <q-list dense>
          <q-item v-for="(dia, nombre) in sitio.horario" :key="nombre">
            <q-item-section>{{ nombre }}</q-item-section>
            <q-item-section side>
              <template v-if="dia.abierto">{{ dia.apertura }} - {{ dia.cierre }}</template>
              <template v-else>Cerrado</template>
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div v-if="sitio.localizacion?.lat" class="q-mt-md">
        <div class="text-h6">Ubicación</div>
        <MapaMini :lat="sitio.localizacion.lat" :lng="sitio.localizacion.lng" />
      </div>

      <!-- Reseñas (igual que en eventos) -->
      <!-- ... (copiar bloque de reseñas y formulario) ... -->
      <div class="q-mt-lg">
        <div class="text-h6">Reseñas</div>
        <div v-if="sitio.reseñas?.length">
          <div v-for="(res, idx) in sitio.reseñas" :key="idx" class="q-mb-sm">
            <q-card flat bordered>
              <q-card-section>
                <div class="row items-center">
                  <q-rating :model-value="res.calificacion" readonly size="1.5em" color="amber" />
                  <span class="q-ml-sm text-weight-bold">{{ res.usuario_nombres }} {{ res.usuario_apellidos }}</span>
                </div>
                <div class="text-caption text-grey">{{ res.fecha?.substring(0,10) }}</div>
                <div>{{ res.comentario }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
        <div v-else class="text-grey q-pa-md">No hay reseñas aún.</div>
        <div v-if="auth.isLoggedIn" class="q-mt-md">
          <FormularioResena @submit="agregarResena" />
        </div>
      </div>
    </div>
  </q-page>
  <q-page v-else-if="error" class="flex flex-center">
    <div class="text-red">{{ error }}</div>
  </q-page>
  <q-page v-else class="flex flex-center">
    <q-spinner-dots color="primary" size="50px" />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { couch } from 'src/api/index'
import { useAuthStore } from 'src/stores/auth'
import FormularioResena from 'src/components/FormularioResena.vue'
import MapaMini from 'src/components/MapaMini.vue'
import BotonFavorito from 'src/components/BotonFavorito.vue'
import BotonVisita from 'src/components/BotonVisita.vue'
const route = useRoute()
const auth = useAuthStore()
const sitio = ref(null)
const error = ref(null)

const imgDocId = computed(() => 'sit_' + sitio.value?._id)
const imagenPortada = computed(() => {
  if (sitio.value?.imagen_portada) {
    return couch.getImageUrl(imgDocId.value, sitio.value.imagen_portada)
  }
  return 'https://via.placeholder.com/800x400?text=Sitio'
})

function getImagenUrl(nombre) {
  if (!nombre) return ''
  return couch.getImageUrl(imgDocId.value, nombre)
}

async function cargarSitio() {
  try {
    const id = route.params.id
    sitio.value = await couch.get(import.meta.env.VITE_DB_DATA, id)
  } catch {
    error.value = 'Sitio no encontrado'
  }
}

async function agregarResena({ calificacion, comentario }) {
  if (!auth.user) return
  try {
    const nuevaResena = {
      usuario_nombres: auth.user.nombres,
      usuario_apellidos: auth.user.apellidos,
      calificacion,
      comentario,
      fecha: new Date().toISOString()
    }
    sitio.value.reseñas = sitio.value.reseñas || []
    sitio.value.reseñas.push(nuevaResena)
    await couch.put(import.meta.env.VITE_DB_DATA, sitio.value)
    await cargarSitio()
  } catch (e) {
    console.error(e)
  }
}

onMounted(cargarSitio)
</script>
