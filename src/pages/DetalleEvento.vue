<template>
  <q-page v-if="evento" padding>
    <q-img :src="imagenPortada" class="rounded-borders" style="max-height: 400px" />
    <div class="row items-center q-mt-md">
      <div class="text-h4">{{ evento.titulo }}</div>
      <q-space />
      <BotonFavorito v-if="auth.isLoggedIn && auth.rol === 'usuario_final'" tipo="evento" :item="evento" />
      <BotonVisita v-if="auth.isLoggedIn && auth.rol === 'usuario_final'" tipo="evento" :item="evento" />
    </div>
    <div class="text-subtitle1 text-grey">
      {{ evento.municipio }}, {{ evento.departamento }}
    </div>
    <div class="text-subtitle2">
      {{ evento.fecha_inicio?.substring(0,10) }} - {{ evento.fecha_fin?.substring(0,10) }}
    </div>
    <p class="q-mt-sm">{{ evento.descripcion }}</p>

    <!-- Galería de imágenes extra -->
    <div v-if="evento.imagenes_extra?.length" class="row q-col-gutter-sm q-mt-md">
      <div v-for="(img, idx) in evento.imagenes_extra" :key="idx" class="col-6 col-md-3">
        <q-img :src="getImagenUrl(img)" :ratio="4/3" class="rounded-borders cursor-pointer" @click="verImagen(img)" />
      </div>
    </div>

    <!-- Mapa pequeño -->
    <div v-if="evento.localizacion?.lat" class="q-mt-md">
      <div class="text-h6">Ubicación</div>
      <MapaMini :lat="evento.localizacion.lat" :lng="evento.localizacion.lng" />
    </div>

    <!-- Reseñas -->
    <div class="q-mt-lg">
      <div class="text-h6">Reseñas</div>
      <div v-if="evento.reseñas?.length">
        <div v-for="(res, idx) in evento.reseñas" :key="idx" class="q-mb-sm">
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
const evento = ref(null)
const error = ref(null)

const imgDocId = computed(() => 'evt_' + evento.value?._id)
const imagenPortada = computed(() => {
  if (evento.value?.imagen_portada) {
    return couch.getImageUrl(imgDocId.value, evento.value.imagen_portada)
  }
  return 'https://via.placeholder.com/800x400?text=Evento'
})

function getImagenUrl(nombre) {
  if (!nombre) return ''
  return couch.getImageUrl(imgDocId.value, nombre)
}

async function cargarEvento() {
  try {
    const id = route.params.id
    evento.value = await couch.get(import.meta.env.VITE_DB_DATA, id)
  } catch{
    error.value = 'Evento no encontrado'
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

    // Actualizar el evento
    evento.value.reseñas = evento.value.reseñas || []
    evento.value.reseñas.push(nuevaResena)
    await couch.put(import.meta.env.VITE_DB_DATA, evento.value)

    // Actualizar el perfil del usuario (reseñas personales)
    const userDoc = await couch.get(import.meta.env.VITE_DB_DATA, auth.user._id)
    const detalle = userDoc.detalles?.detalle_usuario
    if (detalle) {
      detalle.reseñas = detalle.reseñas || []
      detalle.reseñas.push({
        tipo_destino: 'evento',
        destino_nombre: evento.value.titulo,
        destino_departamento: evento.value.departamento,
        calificacion,
        comentario,
        fecha: new Date().toISOString()
      })
      await couch.put(import.meta.env.VITE_DB_DATA, userDoc)
    }

    await auth.refreshUser()
    await cargarEvento()
  } catch (e) {
    console.error(e)
  }
}

onMounted(cargarEvento)
</script>
