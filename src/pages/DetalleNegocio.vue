<template>
  <q-page padding class="detalle-negocio-page">
    <div v-if="negocio" class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8">

        <q-card flat bordered class="q-mb-md overflow-hidden card-adaptable">
          <div class="relative-position">
            <q-img
              v-if="!imgError"
              :src="imagenPortada"
              :ratio="16/9"
              style="max-height: 450px;"
              class="shadow-4"
              fit="cover"
              @error="imgError = true"
            >
              <div
                v-if="auth.isLoggedIn && auth.rol === 'usuario_final'"
                class="absolute-bottom-right q-ma-md q-pa-xs glass-container"
              >
                <div class="row q-gutter-xs">
                  <BotonFavorito tipo="negocio" :item="negocio" />
                  <!-- <BotonVisita tipo="negocio" :item="negocio" /> -->
                </div>
              </div>
            </q-img>

            <div v-else class="flex flex-center bg-grey-4 text-grey-8" style="height: 400px; width: 100%;">
              <div class="text-center">
                <q-icon name="image_not_supported" size="80px" />
                <div class="text-h6">Imagen no disponible</div>
              </div>
            </div>
          </div>

          <q-card-section>
            <div class="row q-col-gutter-lg">

              <div class="col-12 col-md-8">
                <div class="row items-center q-mb-sm">
                  <div class="text-h4 text-weight-bold">{{ negocio.nombre_comercial }}</div>
                  <q-space />
                  <div class="row items-center">
                    <q-rating
                      :model-value="Math.round(negocio.calificacion_promedio || 0)"
                      readonly
                      size="1.5em"
                      color="amber"
                    />
                    <span class="q-ml-xs text-grey-7">({{ negocio.reseñas?.length || 0 }})</span>
                  </div>
                </div>

                <div class="q-mb-lg">
                  <q-chip
                    outline
                    color="primary"
                    icon="storefront"
                    :label="extraerLabel(negocio.categoria) || 'Negocio'"
                  />
                  <p class="text-body1 q-mt-md text-justify text-color-adaptable">
                    {{ negocio.descripcion }}
                  </p>
                </div>

                <div v-if="negocio.catalogo?.length" class="q-mt-xl">
                  <div class="row items-center q-mb-md">
                    <q-icon name="shopping_bag" size="24px" color="primary" class="q-mr-sm" />
                    <div class="text-h6 text-weight-bold">Nuestro Catálogo</div>
                  </div>

                  <div class="row q-col-gutter-md">
                    <div v-for="(item, idx) in negocio.catalogo" :key="idx" class="col-6 col-sm-4 flex">
                      <q-card flat bordered class="product-card full-height column card-adaptable">
                        <q-img :src="getImagenCatalogo(item.imagen)" :ratio="1" class="rounded-borders">
                          <template v-slot:error>
                            <div class="absolute-full flex flex-center bg-grey-3 text-grey-7 text-caption text-center">
                              Sin foto
                            </div>
                          </template>
                        </q-img>
                        <q-card-section class="q-pa-sm col flex column justify-between">
                          <div>
                            <div class="text-subtitle2 text-weight-bold">{{ item.nombre }}</div>
                            <div class="text-caption text-grey-7 q-mt-xs">{{ item.description || item.descripcion }}</div>
                          </div>
                          <div class="text-h6 text-primary q-mt-sm">${{ item.precio }}</div>
                        </q-card-section>
                      </q-card>
                    </div>
                  </div>
                </div>

                <div class="q-mt-xl">
                  <div class="text-h6 text-weight-bold q-mb-md">Opiniones de clientes</div>
                  <div v-if="negocio.reseñas?.length">
                    <div v-for="(res, idx) in negocio.reseñas" :key="idx" class="q-mb-sm">
                      <q-card flat bordered class="resena-card">
                        <q-card-section>
                          <div class="row items-center">
                            <q-rating :model-value="res.calificacion" readonly size="1.2em" color="amber" />
                            <span class="q-ml-sm text-weight-bold">{{ res.usuario_nombres }}</span>
                          </div>
                          <div class="text-caption text-grey">{{ formatDate(res.fecha) }}</div>
                          <div class="q-mt-xs">{{ res.comentario }}</div>
                        </q-card-section>
                      </q-card>
                    </div>
                  </div>
                  <div v-else class="text-grey q-pa-md text-center border-dashed rounded-borders">
                    Aún no hay reseñas.
                  </div>

                  <div v-if="auth.isLoggedIn && auth.rol === 'usuario_final'" class="q-mt-md">
                    <FormularioResena @submit="agregarResena" />
                  </div>
                </div>
              </div>

              <div class="col-12 col-md-4">
                <q-card flat bordered class="q-mb-md card-adaptable">
                  <q-list>
                    <q-item-label header class="text-weight-bold text-uppercase">Contacto</q-item-label>
                    <q-item>
                      <q-item-section avatar>
                        <q-icon color="primary" name="phone" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label caption>Teléfono</q-item-label>
                        <q-item-label class="text-weight-medium">{{ negocio.telefono || '7777-7777' }}</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item>
                      <q-item-section avatar>
                        <q-icon color="orange" name="place" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label caption>Ubicación</q-item-label>
                        <q-item-label>
                          {{ extraerLabel(negocio.municipio) }}, {{ extraerLabel(negocio.departamento) }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card>

                <q-card flat bordered class="q-mb-md card-adaptable" v-if="horarioFiltrado.length">
                  <q-card-section class="q-pb-none">
                    <div class="text-subtitle2 text-weight-bold text-uppercase text-grey-7">Horarios</div>
                  </q-card-section>
                  <q-list dense separator class="q-pa-sm">
                    <q-item v-for="dia in horarioFiltrado" :key="dia.nombre" class="q-py-xs">
                      <q-item-section>{{ dia.nombre }}</q-item-section>
                      <q-item-section side>
                        <q-badge :color="dia.datos.abierto ? 'positive' : 'negative'" outline>
                          {{ dia.datos.abierto ? `${dia.datos.apertura} - ${dia.datos.cierre}` : 'Cerrado' }}
                        </q-badge>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card>

                <div v-if="negocio.localizacion?.lat" class="q-mb-md">
                  <div class="text-subtitle2 text-weight-bold q-mb-sm text-grey-7 text-uppercase">Mapa</div>
                  <MapaMini
                    :lat="Number(negocio.localizacion.lat)"
                    :lng="Number(negocio.localizacion.lng)"
                    style="height: 250px; border-radius: 8px;"
                  />
                  <q-btn
                    unelevated
                    color="primary"
                    icon="directions"
                    label="Cómo llegar"
                    class="full-width q-mt-sm"
                    @click="comoLlegar"
                  />
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div v-else-if="error" class="flex flex-center full-height">
      <div class="text-negative text-center">
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
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { couch } from 'src/api/index'
import { useAuthStore } from 'src/stores/auth'

import FormularioResena from 'src/components/FormularioResena.vue'
import BotonFavorito from 'src/components/BotonFavorito.vue'
/** import BotonVisita from 'src/components/BotonVisita.vue'**/
import MapaMini from 'src/components/MapaMini.vue'

const $q = useQuasar()
const route = useRoute()
const auth = useAuthStore()
const docImagenes = ref(null)
const negocio = ref(null)
const error = ref(null)
const imgError = ref(false)

// Función para extraer texto de objetos de Quasar (QSelect)
const extraerLabel = (valor) => {
  if (!valor) return ''
  if (typeof valor === 'string') return valor
  return valor.label || valor.nombre || ''
}

const imgDocId = computed(() => 'neg_' + negocio.value?._id)

const imagenPortada = computed(() => {
  if (imgError.value || !negocio.value) return null

  // 1. Si el negocio tiene una imagen definida explícitamente en su data
  if (negocio.value.imagen_portada) {
    return couch.getImageUrl(imgDocId.value, negocio.value.imagen_portada)
  }

  // 2. Si no, extraemos la ULTIMA imagen de los attachments
  if (docImagenes.value && docImagenes.value._attachments) {
    const nombresArchivos = Object.keys(docImagenes.value._attachments)

    if (nombresArchivos.length > 0) {
      // Usamos .at(-1) para obtener el último elemento del array de forma limpia
      const ultimaImagen = nombresArchivos.at(-1)
      return couch.getImageUrl(imgDocId.value, ultimaImagen)
    }
  }

  // Si no hay imágenes, retornamos null para que el template muestre el fallback
  return null
})

const getImagenCatalogo = (nombre) => {
  if (!nombre) return ''
  return couch.getImageUrl(imgDocId.value, nombre)
}

const horarioFiltrado = computed(() => {
  if (!negocio.value?.horario) return []
  const diasSemana = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
  return Object.entries(negocio.value.horario)
    .filter(([key]) => diasSemana.includes(key.toLowerCase()))
    .map(([nombre, datos]) => ({
      nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1),
      datos
    }))
})

const comoLlegar = () => {
  if (negocio.value?.localizacion?.lat) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${negocio.value.localizacion.lat},${negocio.value.localizacion.lng}`)
  }
}

const formatDate = (isoString) => {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString('es-SV', { year: 'numeric', month: 'short', day: 'numeric' })
}

async function cargarNegocio() {
  try {
    const id = route.params.id

    // 1. Cargar los datos del negocio
    negocio.value = await couch.get(import.meta.env.VITE_DB_DATA, id)

    // 2. Cargar el documento de imágenes para poblar docImagenes
    try {
      // Nota: Si usas una variable de entorno para 'eventos_imagenes', cámbiala aquí
      // (ej. import.meta.env.VITE_DB_IMAGES)
      docImagenes.value = await couch.get('eventos_imagenes', `neg_${id}`)
    } catch (imgErr) {
      console.warn('El negocio no tiene documento de imágenes asociado aún.', imgErr)
    }

  } catch {
    error.value = 'Negocio no encontrado'
  }
}

async function agregarResena({ calificacion, comentario }) {
  if (!auth.user) return
  $q.loading.show()
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

    const total = negocio.value.reseñas.reduce((sum, r) => sum + r.calificacion, 0)
    negocio.value.calificacion_promedio = total / negocio.value.reseñas.length

    await couch.put(import.meta.env.VITE_DB_DATA, negocio.value)
    $q.notify({ type: 'positive', message: '¡Gracias por tu opinión!' })
    await cargarNegocio()
  } catch {
    $q.notify({ type: 'negative', message: 'Error al guardar reseña' })
  } finally {
    $q.loading.hide()
  }
}

onMounted(cargarNegocio)
</script>

<style scoped>
/* Fondo general de la página - Se adapta automáticamente */
.detalle-negocio-page {
  background-color: var(--q-color-grey-1);
  min-height: 100vh;
}

/* CORRECCIÓN MODO OSCURO: Quitamos fondos fijos blancos */
.card-adaptable {
  background-color: white; /* Por defecto en modo claro */
  color: #1d1d1d;
}

/* Ajustes cuando el body tiene la clase oscura de Quasar */
.body--dark .detalle-negocio-page {
  background-color: #121212;
}

.body--dark .card-adaptable {
  background-color: #1d1d1d !important;
  color: white !important;
}

.body--dark .resena-card {
  background-color: #2c2c2c;
}

/* Estilos de catálogo y cristal */
.glass-container {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.product-card {
  transition: transform 0.2s;
  border-radius: 12px;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.resena-card {
  background-color: #f9f9f9;
}
</style>
