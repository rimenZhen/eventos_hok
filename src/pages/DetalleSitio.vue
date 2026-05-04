<template>
  <q-page padding class="detalle-sitio-page">
    <div v-if="sitio" class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8">
        <q-card flat bordered class="q-mb-md overflow-hidden">
          <div class="relative-position">
            <q-img
              :src="imagenPortada"
              :ratio="16/9"
              style="max-width: 100%; max-height: 450px;"
              class="shadow-4"
              fit="cover"
              @error="imgError = true"
            >
              <template v-slot:error>
                <div class="absolute-full flex flex-center bg-negative text-white">
                  Error al cargar la imagen
                </div>
              </template>

              <div
                v-if="auth.isLoggedIn && auth.rol === 'usuario_final'"
                class="absolute-bottom-right q-ma-md q-pa-xs glass-container"
              >
                <div class="row q-gutter-xs">
                  <BotonFavorito tipo="sitio" :item="sitio" />
                  <!-- <BotonVisita tipo="sitio" :item="sitio" /> -->
                </div>
              </div>
            </q-img>
          </div>

          <q-card-section>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-8">
                <div class="text-h4 text-weight-bold q-mb-sm">{{ sitio.nombre }}</div>

                <div class="row items-center q-mb-md">
                  <!-- Chip de categoría actualizado -->
                  <q-chip
                    :style="{ backgroundColor: categoriaData.color }"
                    text-color="white"
                    :label="categoriaData.nombre"
                  />
                  <q-space />
                  <div class="row items-center">
                    <q-rating
                      :model-value="Math.round(sitio.calificacion_promedio || 0)"
                      readonly
                      size="1.5em"
                      color="amber"
                    />
                    <span class="q-ml-xs text-grey-7">({{ sitio.reseñas?.length || 0 }} reseñas)</span>
                  </div>
                </div>

                <div class="flex items-center q-mb-md">
                  <q-icon name="place" size="20px" class="q-mr-xs text-orange" />
                  <span>{{ ubicacion }}</span>
                  <q-btn flat dense color="primary" label="Cómo llegar" @click="comoLlegar" class="q-ml-sm" />
                </div>

                <div class="q-mb-md">
                  <div class="text-subtitle1 text-weight-bold">Descripción</div>
                  <p class="text-body1">{{ sitio.descripcion }}</p>
                </div>

                <div v-if="sitio.localizacion?.lat" class="q-mb-md">
                  <div class="text-subtitle1 text-weight-bold">Ubicación en mapa</div>
                  <MapaMini :lat="Number(sitio.localizacion.lat)" :lng="Number(sitio.localizacion.lng)" />
                </div>

                <div v-if="sitio.imagenes_extra?.length" class="q-mb-md">
                  <div class="text-subtitle1 text-weight-bold">Galería</div>
                  <div class="row q-col-gutter-sm">
                    <div v-for="(img, idx) in sitio.imagenes_extra" :key="idx" class="col-6 col-sm-4 col-md-3">
                      <q-img
                        :src="getImagenUrl(img)"
                        :ratio="4/3"
                        class="rounded-borders cursor-pointer"
                        @click="verImagen(img)"
                      />
                    </div>
                  </div>
                </div>

                <div class="q-mt-lg">
                  <div class="text-subtitle1 text-weight-bold">Reseñas</div>
                  <div v-if="sitio.reseñas?.length">
                    <div v-for="(res, idx) in sitio.reseñas" :key="idx" class="q-mb-sm">
                      <q-card flat bordered>
                        <q-card-section>
                          <div class="row items-center">
                            <q-rating :model-value="res.calificacion" readonly size="1.2em" color="amber" />
                            <span class="q-ml-sm text-weight-bold">{{ res.usuario_nombres }} {{ res.usuario_apellidos }}</span>
                          </div>
                          <div class="text-caption text-grey">{{ formatDate(res.fecha) }}</div>
                          <div>{{ res.comentario }}</div>
                        </q-card-section>
                      </q-card>
                    </div>
                  </div>
                  <div v-else class="text-grey q-pa-md">No hay reseñas aún.</div>
                  <div v-if="auth.isLoggedIn && auth.rol === 'usuario_final'" class="q-mt-md">
                    <FormularioResena @submit="agregarResena" />
                  </div>
                </div>
              </div>

              <div class="col-12 col-md-4">
                <div v-if="horarioFiltrado.length > 0" class="q-mb-md">
                  <div class="text-subtitle1 text-weight-bold">Horario</div>
                  <q-list dense separator>
                    <q-item v-for="dia in horarioFiltrado" :key="dia.nombre" class="q-py-sm">
                      <q-item-section>
                        <q-item-label class="text-weight-medium">{{ dia.nombre }}</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-item-label>
                          <template v-if="dia.datos.abierto">
                            {{ dia.datos.apertura }} - {{ dia.datos.cierre }}
                          </template>
                          <template v-else>Cerrado</template>
                        </q-item-label>
                        <q-item-label v-if="dia.datos.cerrado_festivos" caption class="text-negative text-italic">
                          Cerrado en festivos
                        </q-item-label>
                        <q-item-label v-if="dia.datos.nota?.trim()" caption class="text-grey">
                          {{ dia.datos.nota }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </div>

                <q-card flat bordered>
                  <q-card-section>
                    <div class="text-subtitle1 text-weight-bold">Negocios Cercanos</div>
                    <q-list dense separator>
                      <q-item
                        v-for="negocio in negociosCercanos"
                        :key="negocio.id"
                        clickable
                        v-ripple
                        @click="irANegocio(negocio.id)"
                      >
                        <q-item-section avatar>
                          <q-icon name="store" color="primary" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label class="text-weight-bold">{{ negocio.nombre }}</q-item-label>
                          <q-item-label caption lines="1">{{ negocio.descripcion }}</q-item-label>
                        </q-item-section>
                        <q-item-section side>
                          <div class="row items-center">
                            <q-rating :model-value="negocio.rating" readonly size="1em" color="amber" />
                            <q-icon name="chevron_right" color="grey-6" />
                          </div>
                        </q-item-section>
                      </q-item>
                    </q-list>
                    <div v-if="!negociosCercanos.length" class="text-grey text-center q-pa-md">
                      No hay negocios cercanos.
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div v-else-if="error" class="flex flex-center full-height">
      <div class="text-red text-center">
        <q-icon name="error_outline" size="64px" />
        <div class="text-h6">{{ error }}</div>
      </div>
    </div>
    <div v-else class="flex flex-center full-height">
      <q-spinner-dots color="primary" size="50px" />
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { couch } from 'src/api/index'
import { useAuthStore } from 'src/stores/auth'
import { useConfiguracionStore } from 'src/stores/configuracion' // nueva importación
import FormularioResena from 'src/components/FormularioResena.vue'
import MapaMini from 'src/components/MapaMini.vue'
import BotonFavorito from 'src/components/BotonFavorito.vue'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const configStore = useConfiguracionStore() // instancia del store

const sitio = ref(null)
const error = ref(null)
const imgError = ref(false)
const negociosCercanos = ref([])

const extraerLabel = (valor) => {
  if (!valor) return ''
  if (typeof valor === 'string') return valor
  return valor.label || valor.nombre || valor.clave || ''
}

const horarioFiltrado = computed(() => {
  if (!sitio.value?.horario) return []
  const diasSemana = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
  return Object.entries(sitio.value.horario)
    .filter(([key]) => diasSemana.includes(key.toLowerCase()))
    .map(([nombre, datos]) => ({ nombre, datos }))
})

// ---- CATEGORÍA DESDE CONFIGURACIÓN (reemplaza categoriaInfo anterior) ----
function extractCategoryKey(cat) {
  if (!cat) return ''
  if (typeof cat === 'string') return cat
  return cat.value || cat.clave || cat.label || ''
}

const categoriaKey = computed(() => extractCategoryKey(sitio.value?.categoria).toLowerCase().trim())

const categoriaData = computed(() => {
  const key = categoriaKey.value
  const items = configStore.categoriasSitios
  const found = items.find(item => item.clave.toLowerCase() === key || item.nombre.toLowerCase() === key)
  return found
    ? { nombre: found.nombre, color: found.color }
    : { nombre: 'Sitio', color: '#9E9E9E' }
})
// ------------------------------------

const ubicacion = computed(() => {
  const mun = extraerLabel(sitio.value?.municipio)
  const dep = extraerLabel(sitio.value?.departamento)
  return mun && dep ? `${mun}, ${dep}` : (mun || dep || 'Ubicación no especificada')
})

const imagenPortada = computed(() => {
  if (imgError.value || !sitio.value?.imagen_portada) {
    return 'https://via.placeholder.com/800x450?text=Sin+Imagen'
  }
  return couch.getImageUrl(`sit_${sitio.value._id}`, sitio.value.imagen_portada)
})

const cargarNegociosCercanos = async () => {
  const mun = extraerLabel(sitio.value?.municipio)
  if (!mun) return
  try {
    const result = await couch.find(import.meta.env.VITE_DB_DATA, {
      type: 'negocio',
      estado: 'activo',
      municipio: mun
    }, { limit: 3 })
    negociosCercanos.value = result.docs.map(neg => ({
      id: neg._id,
      nombre: neg.nombre_comercial,
      descripcion: neg.descripcion?.substring(0, 50) + '...',
      rating: neg.calificacion_promedio || 4.0
    }))
  } catch (e) {
    console.error('Error cargando negocios:', e)
  }
}

const irANegocio = (id) => {
  router.push(`/negocio/${id}`)
}

async function cargarSitio() {
  try {
    const id = route.params.id
    sitio.value = await couch.get(import.meta.env.VITE_DB_DATA, id)
    await cargarNegociosCercanos()
  } catch {
    error.value = 'Sitio no encontrado'
  }
}

const comoLlegar = () => {
  if (sitio.value?.localizacion?.lat) {
    window.open(`https://www.google.com/maps?q=${sitio.value.localizacion.lat},${sitio.value.localizacion.lng}`)
  }
}

const verImagen = (nombre) => {
  window.open(couch.getImageUrl(`sit_${sitio.value._id}`, nombre), '_blank')
}

const getImagenUrl = (nombre) => couch.getImageUrl(`sit_${sitio.value._id}`, nombre)

const formatDate = (isoString) => {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString('es-SV', { year: 'numeric', month: 'short', day: 'numeric' })
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
    const total = sitio.value.reseñas.reduce((sum, r) => sum + r.calificacion, 0)
    sitio.value.calificacion_promedio = total / sitio.value.reseñas.length
    await couch.put(import.meta.env.VITE_DB_DATA, sitio.value)
    $q.notify({ type: 'positive', message: 'Reseña enviada con éxito' })
  } catch{
    $q.notify({ type: 'negative', message: 'Error al guardar la reseña' })
  }
}

onMounted(async () => {
  await configStore.fetchCatalogos() // cargar catálogos antes
  await cargarSitio()
})
</script>

<style scoped>
.detalle-sitio-page {
  background: var(--q-color-grey-1);
  min-height: 100vh;
}

.glass-container {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

@media (prefers-color-scheme: dark) {
  .detalle-sitio-page {
    background: var(--q-color-dark);
  }
  .glass-container {
    background: rgba(0, 0, 0, 0.5);
  }
}
</style>
