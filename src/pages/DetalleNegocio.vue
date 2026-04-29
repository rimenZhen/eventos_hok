<template>
  <q-page v-if="negocio" padding>
    <q-img :src="imagenPortada" class="rounded-borders" style="max-height: 400px" />
    <div class="q-mt-md">
      <div class="text-h4">{{ negocio.nombre_comercial }}</div>
      <div class="text-subtitle1 text-grey">{{ negocio.municipio }}, {{ negocio.departamento }}</div>
      <p>{{ negocio.descripcion }}</p>
      <div><strong>Teléfono:</strong> {{ negocio.telefono }}</div>
      <div><strong>NIT:</strong> {{ negocio.nit_registro }}</div>

      <!-- Horario (similar a sitios) -->
      <!-- Catálogo -->
      <div v-if="negocio.catalogo?.length" class="q-mt-md">
        <div class="text-h6">Catálogo</div>
        <div class="row q-col-gutter-sm">
          <div v-for="(item, idx) in negocio.catalogo" :key="idx" class="col-6 col-md-4">
            <q-card>
              <q-img :src="getImagenCatalogo(item.imagen)" :ratio="1" />
              <q-card-section>
                <div class="text-subtitle2">{{ item.nombre }}</div>
                <div class="text-caption">{{ item.descripcion }}</div>
                <div class="text-weight-bold">${{ item.precio }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Reseñas (igual que en eventos) -->
      <!-- ... (copiar bloque de reseñas y formulario) ... -->
      <div class="q-mt-lg">
        <div class="text-h6">Reseñas</div>
        <div v-if="negocio.reseñas?.length">
          <div v-for="(res, idx) in negocio.reseñas" :key="idx" class="q-mb-sm">
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

const route = useRoute()
const auth = useAuthStore()
const negocio = ref(null)
const error = ref(null)

const imgDocId = computed(() => 'neg_' + negocio.value?._id)
const imagenPortada = computed(() => {
  if (negocio.value?.imagen_portada) {
    return couch.getImageUrl(imgDocId.value, negocio.value.imagen_portada)
  }
  return 'https://via.placeholder.com/800x400?text=Negocio'
})

function getImagenCatalogo(nombre) {
  if (!nombre) return ''
  return couch.getImageUrl(imgDocId.value, nombre)
}

async function cargarNegocio() {
  try {
    const id = route.params.id
    negocio.value = await couch.get(import.meta.env.VITE_DB_DATA, id)
  } catch{
    error.value = 'Negocio no encontrado'
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
    negocio.value.reseñas = negocio.value.reseñas || []
    negocio.value.reseñas.push(nuevaResena)
    await couch.put(import.meta.env.VITE_DB_DATA, negocio.value)
    await cargarNegocio()
  } catch (e) {
    console.error(e)
  }
}

onMounted(cargarNegocio)
</script>
