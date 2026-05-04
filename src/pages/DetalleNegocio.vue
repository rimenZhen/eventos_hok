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
                    :style="{ backgroundColor: categoriaData.color }"
                    text-color="white"
                    :label="categoriaData.nombre"
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

                  <div class="catalog-slide-container q-mt-sm">
                    <div class="catalog-slide-track">
                      <div v-for="(item, idx) in negocio.catalogo" :key="idx" class="catalog-slide-item">
                        <q-card flat bordered class="product-card card-adaptable cursor-pointer" @click="abrirDetalleProducto(idx)">
                        <!-- Carrusel o imagen única -->
                        <div class="image-wrapper">
                          <q-carousel
                            v-if="item.imagenes?.length > 1"
                            :model-value="activeProductSlides[idx] ?? 0"
                            @update:model-value="val => { activeProductSlides[idx] = val }"
                            animated
                            arrows
                            height="160px"
                            class="carousel"
                          >
                            <q-carousel-slide
                              v-for="(imagen, imgIdx) in item.imagenes"
                              :key="imgIdx"
                              :name="imgIdx"
                            >
                              <q-img
                                :src="getImagenCatalogo(imagen)"
                                :ratio="1"
                                fit="cover"
                              >
                                <template v-slot:error>
                                  <div class="absolute-full flex flex-center bg-grey-3 text-grey-7 text-caption text-center">
                                    Sin foto
                                  </div>
                                </template>
                              </q-img>
                            </q-carousel-slide>
                          </q-carousel>
                          <q-img
                            v-else
                            :src="getImagenCatalogo(item.imagenes?.[0] || item.imagen)"
                            :ratio="1"
                            fit="cover"
                            class="rounded-borders"
                          >
                            <template v-slot:error>
                              <div class="absolute-full flex flex-center bg-grey-3 text-grey-7 text-caption text-center">
                                Sin foto
                              </div>
                            </template>
                          </q-img>
                        </div>

                        <q-card-section class="q-pa-sm product-content">
                          <!-- Nombre con icono de tipo -->
                          <div class="product-info">
                            <div class="row items-center q-mb-xs">
                              <q-icon
                                :name="getMeta(item.tipo).icon"
                                :color="getMeta(item.tipo).color"
                                size="16px"
                                class="q-mr-xs"
                              />
                              <span class="text-subtitle2 text-weight-bold">{{ item.nombre }}</span>
                            </div>

                            <!-- Tipo como badge -->
                            <q-badge
                              v-if="item.tipo"
                              :color="getMeta(item.tipo).color + '-2'"
                              :text-color="getMeta(item.tipo).color + '-8'"
                              size="sm"
                              class="q-mt-xs"
                            >
                              {{ getMeta(item.tipo).label }}
                            </q-badge>

                            <!-- Descripción con truncado -->
                            <div class="product-description text-caption text-grey-7 q-mt-sm">{{ item.descripcion || item.description }}</div>
                          </div>

                          <!-- Precio al final -->
                          <div class="product-price text-h6 text-primary q-mt-auto">${{ item.precio }}</div>
                        </q-card-section>
                        </q-card>
                      </div>
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

    <!-- DIALOG DETALLE PRODUCTO -->
    <q-dialog v-model="mostrarDetalleProducto">
      <q-card v-if="productoSeleccionado" class="product-detail-dialog card-adaptable">
        <q-card-section class="dialog-header row items-center justify-between q-pa-md">
          <h6 class="q-my-none">{{ productoSeleccionado.nombre }}</h6>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-md">
          <!-- Carrusel de imágenes -->
          <div v-if="productoSeleccionado.imagenes?.length > 1" class="q-mb-md">
            <q-carousel
              v-model="slideActualDetalle"
              animated
              arrows
              height="300px"
              class="carousel-grande rounded-borders bg-dark"
            >
              <q-carousel-slide
                v-for="(imagen, imgIdx) in productoSeleccionado.imagenes"
                :key="imgIdx"
                :name="imgIdx"
              >
                <q-img
                  :src="getImagenCatalogo(imagen)"
                  :ratio="16/9"
                  fit="contain"
                />
              </q-carousel-slide>
            </q-carousel>
          </div>
          <div v-else class="q-mb-md">
            <q-img
              :src="getImagenCatalogo(productoSeleccionado.imagenes?.[0] || productoSeleccionado.imagen)"
              :ratio="16/9"
              fit="contain"
              class="bg-dark rounded-borders"
            />
          </div>

          <!-- Información del producto -->
          <div>
            <!-- Tipo con icono -->
            <div class="row items-center q-mb-md">
              <q-icon
                :name="getMeta(productoSeleccionado.tipo).icon"
                :color="getMeta(productoSeleccionado.tipo).color"
                size="24px"
                class="q-mr-sm"
              />
              <q-badge
                v-if="productoSeleccionado.tipo"
                :color="getMeta(productoSeleccionado.tipo).color + '-2'"
                :text-color="getMeta(productoSeleccionado.tipo).color + '-8'"
              >
                {{ getMeta(productoSeleccionado.tipo).label }}
              </q-badge>
            </div>

            <!-- Descripción -->
            <div class="q-mb-md">
              <p class="text-body2 text-justify text-color-adaptable q-my-none">
                {{ productoSeleccionado.descripcion || productoSeleccionado.description }}
              </p>
            </div>

            <!-- Precio -->
            <div class="text-h5 text-primary text-weight-bold">
              ${{ productoSeleccionado.precio }}
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { couch } from 'src/api/index'
import { negocioAPI } from 'src/api/negocio'
import { useAuthStore } from 'src/stores/auth'
import { useConfiguracionStore } from 'src/stores/configuracion'

import FormularioResena from 'src/components/FormularioResena.vue'
import BotonFavorito from 'src/components/BotonFavorito.vue'
/** import BotonVisita from 'src/components/BotonVisita.vue'**/
import MapaMini from 'src/components/MapaMini.vue'

// META TIPOS DE PRODUCTO
const PRODUCT_TYPE_META = {
  almuerzos: { color: 'orange', icon: 'lunch_dining', label: 'Almuerzos' },
  desayunos: { color: 'amber', icon: 'free_breakfast', label: 'Desayunos' },
  cenas: { color: 'deep-orange', icon: 'dinner_dining', label: 'Cenas' },
  comidas_rapidas: { color: 'red', icon: 'fastfood', label: 'Comidas Rápidas' },
  bebidas: { color: 'blue', icon: 'local_drink', label: 'Bebidas' },
  viajes: { color: 'indigo', icon: 'flight', label: 'Viajes' },
  senderismo: { color: 'green', icon: 'hiking', label: 'Senderismo' },
  artesanias: { color: 'brown', icon: 'palette', label: 'Artesanías' }
}

const route = useRoute()
const auth = useAuthStore()
const configStore = useConfiguracionStore()
const docImagenes = ref(null)
const negocio = ref(null)
const error = ref(null)
const imgError = ref(false)
const mostrarDetalleProducto = ref(false)
const activeProductSlides = reactive({})
const slideActualDetalle = ref(0)
const productoSeleccionado = ref(null)

// Función para extraer texto de objetos de Quasar (QSelect)
const extraerLabel = (valor) => {
  if (!valor) return ''
  if (typeof valor === 'string') return valor
  return valor.label || valor.nombre || ''
}

const imgDocId = computed(() => 'neg_' + negocio.value?._id)

const imagenPortada = computed(() => {
  if (imgError.value || !negocio.value) return null

  if (negocio.value.imagen_portada) {
    return couch.getImageUrl(imgDocId.value, negocio.value.imagen_portada)

// Nueva función para obtener la clave de categoría (soporta string u objeto {label, value})
  }

  if (docImagenes.value && docImagenes.value._attachments) {
    const nombresArchivos = Object.keys(docImagenes.value._attachments)
    if (nombresArchivos.length > 0) {
      return couch.getImageUrl(imgDocId.value, nombresArchivos.at(-1))
    }
  }
  return null
})

const getImagenCatalogo = (nombre) => {
  if (!nombre) return ''
  return couch.getImageUrl(imgDocId.value, nombre)
}

function getMeta(tipo) {
  return PRODUCT_TYPE_META[tipo] || {
    icon: 'category',
    color: 'grey',
    label: tipo || 'Sin tipo'
  }
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

const categoriaKey = computed(() => {
  if (!negocio.value) return null
  const c = negocio.value.categoria || negocio.value.categoría || null
  if (!c) return null
  if (typeof c === 'string') return c
  return c.value || c.clave || c.label || null
})

const categoriaData = computed(() => {
  const key = categoriaKey.value
  if (!key) return { nombre: 'Sin categoría', color: 'grey' }
  const found = configStore.categoriasNegocios?.find(cat => cat.clave === key || cat.value === key || cat.label === key)
  if (found) return { nombre: found.nombre || found.label || key, color: found.color || 'grey' }
  return { nombre: key, color: 'grey' }
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

    // 1. Cargar los datos del negocio usando la API (asegura normalización)
    negocio.value = await negocioAPI.getNegocioById(id)

    // 2. Cargar el documento de imágenes para poblar docImagenes (si existe)
    try {
      docImagenes.value = await couch.get(import.meta.env.VITE_DB_IMAGES, `neg_${id}`)
    } catch (imgErr) {
      docImagenes.value = null
      console.warn('El negocio no tiene documento de imágenes asociado aún.', imgErr)
    }

    // 3. Registrar visita al perfil del negocio y refrescar el documento para mostrar estadísticas
    try {
      const userId = auth.user?._id || null
      await negocioAPI.recordProfileView(id, { userId })
      negocio.value = await negocioAPI.getNegocioById(id)
    } catch (err) {
      console.warn('Error registrando visita al perfil', err)
    }
  } catch (err) {
    console.error('cargarNegocio error:', err)
    error.value = 'Negocio no encontrado'
  }
}

async function agregarResena({ calificacion, comentario }) {
  if (!auth.user) return
  try {
    // Recargar el documento más reciente para evitar conflictos de versión
    const docFresco = await couch.get(import.meta.env.VITE_DB_DATA, negocio.value._id)
    
    const nuevaResena = {
      usuario_nombres: auth.user.nombres,
      usuario_apellidos: auth.user.apellidos,
      calificacion,
      comentario,
      fecha: new Date().toISOString()
    }
    
    docFresco.reseñas = docFresco.reseñas || []
    docFresco.reseñas.push(nuevaResena)

    const total = docFresco.reseñas.reduce((sum, r) => sum + r.calificacion, 0)
    docFresco.calificacion_promedio = total / docFresco.reseñas.length

    await couch.put(import.meta.env.VITE_DB_DATA, docFresco)
    
    // Recargar para mostrar la nueva reseña
    await cargarNegocio()
  } catch (err) {
    console.error('Error al guardar reseña:', err)
  }
}

async function abrirDetalleProducto(index) {
  try {
    const prod = negocio.value?.catalogo?.[index]
    if (!prod) return
    productoSeleccionado.value = prod
    slideActualDetalle.value = 0
    mostrarDetalleProducto.value = true

    // Registrar click en el catálogo para estadísticas (si hay usuario)
    try {
      const userId = auth.user?._id || null
      await negocioAPI.recordCatalogClick(negocio.value._id, prod.catalogKey || index, { userId })
      // refrescar el documento para que la UI muestre estadísticas actualizadas
      try {
        negocio.value = await negocioAPI.getNegocioById(negocio.value._id)
      } catch (err) {
        console.warn('No se pudo refrescar negocio tras registrar click', err)
      }
    } catch (err) {
      console.warn('Error registrando click de catálogo', err)
    }
  } catch (err) {
    console.error('abrirDetalleProducto error:', err)
  }
}

onMounted(async () => {
  await configStore.fetchCatalogos()
  await cargarNegocio()
})
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
  transition: transform 0.2s, box-shadow 0.2s;
  border-radius: 12px;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

/* Contenedor de tarjetas uniforme */
.product-col {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 380px;
}

.resena-card {
  background-color: #f9f9f9;
}

/* Estilos para el carrusel en tarjetas de catálogo */
.image-wrapper {
  padding: 6px;
  height: 160px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 12px;
}

.carousel {
  border-radius: 8px;
  height: 160px;
}

/* Horizontal sliding track for catalog */
.catalog-slide-container {
  width: 100%;
  overflow: hidden;
}

.catalog-slide-track {
  display: flex;
  gap: 0.8rem;
  padding: 6px 4px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
}

.catalog-slide-track::-webkit-scrollbar {
  height: 8px;
}
.catalog-slide-track::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.12);
  border-radius: 4px;
}

.catalog-slide-item {
  flex: 0 0 260px; /* fixed item width, adjust for responsiveness */
  scroll-snap-align: start;
}

.catalog-slide-item .product-card {
  height: 100%;
}

@media (max-width: 600px) {
  .catalog-slide-item { flex: 0 0 200px; }
}

/* Contenido de la tarjeta con layout flexible */
.product-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
}

.product-info {
  flex: 0 1 auto;
  min-width: 0;
}

/* Descripción con truncado a 2 líneas */
.product-description {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  max-height: 2.8em;
  word-break: break-word;
}

.product-price {
  flex-shrink: 0;
  margin-top: auto;
  padding-top: 0.5rem;
}

/* Estilos para el dialog de detalle del producto */
.product-detail-dialog {
  width: 100%;
  max-width: 500px;
  border-radius: 12px;
}

.dialog-header {
  padding: 16px;
  background-color: rgba(33, 150, 243, 0.08);
}

.carousel-grande {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Modo oscuro para texto en diálogo */
.body--dark .product-detail-dialog {
  background-color: #1d1d1d;
}

.body--dark .dialog-header {
  background-color: rgba(33, 150, 243, 0.15);
}
</style>
