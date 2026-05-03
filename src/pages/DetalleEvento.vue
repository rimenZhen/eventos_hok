<template>
  <q-page padding class="detalle-evento-page">
    <div v-if="evento" class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8">
        <!-- Tarjeta principal -->
        <q-card flat bordered class="q-mb-md">
          <!-- Imagen con tamaño fijo -->
          <div class="row justify-center q-pt-md">
            <q-img
              :src="imagenPortada"
              :ratio="16/9"
              style="max-width: 100%; max-height: 400px;"
              class="rounded-borders shadow-4"
              fit="cover"
              @error="imgError = true"
            >
              <template v-slot:error>
                <div class="absolute-full flex flex-center bg-negative text-white">
                  Error al cargar la imagen
                </div>
              </template>
            </q-img>
          </div>

          <q-card-section>
            <div class="row q-col-gutter-md">
              <!-- COLUMNA IZQUIERDA: información principal -->
              <div class="col-12 col-md-8">
                <!-- Título y calificación -->
                <div class="row items-center">
                  <div class="text-h4 text-weight-bold">{{ evento.titulo }}</div>
                  <q-space />
                  <div class="row items-center">
                    <q-rating :model-value="Math.round(evento.calificacion_promedio || 0)" readonly size="1.5em" color="amber" />
                    <span class="q-ml-xs text-grey-7">({{ evento.reseñas?.length || 0 }} reseñas)</span>
                  </div>
                </div>

                <!-- Categoría con chip -->
                <q-chip :color="categoriaInfo.color" text-color="white" :label="categoriaInfo.nombre" class="q-mt-sm" />

                <!-- Fecha y hora con iconos -->
                <div class="row items-center q-mt-md q-gutter-x-md">
                  <div class="flex items-center">
                    <q-icon name="event" size="20px" class="q-mr-xs text-primary" />
                    <span>{{ fechaFormateada }}</span>
                  </div>
                  <div class="flex items-center">
                    <q-icon name="schedule" size="20px" class="q-mr-xs text-primary" />
                    <span>{{ horaInicio }} - {{ horaFin }}</span>
                  </div>
                </div>

                <!-- Ubicación con icono y enlaces -->
                <div class="flex items-center q-mt-sm">
                  <q-icon name="place" size="20px" class="q-mr-xs text-orange" />
                  <span>{{ ubicacion }}</span>
                  <q-btn flat dense label="Ver en mapa" @click="verMapa" class="q-ml-md" />
                  <q-btn flat dense label="Cómo llegar" @click="comoLlegar" />
                </div>

                <!-- Descripción -->
                <div class="q-mt-md">
                  <div class="text-subtitle1 text-weight-bold">Descripción</div>
                  <p class="text-body1">{{ evento.descripcion }}</p>
                </div>

                <!-- Mapa pequeño -->
                <div v-if="evento.localizacion?.lat" class="q-mt-md">
                  <div class="text-subtitle1 text-weight-bold">Ubicación en mapa</div>
                  <MapaMini :lat="Number(evento.localizacion.lat)" :lng="Number(evento.localizacion.lng)" />
                </div>

                <!-- Galería de imágenes extra (si existe) -->
                <div v-if="evento.imagenes_extra?.length" class="q-mt-md">
                  <div class="text-subtitle1 text-weight-bold">Galería</div>
                  <div class="row q-col-gutter-sm">
                    <div v-for="(img, idx) in evento.imagenes_extra" :key="idx" class="col-6 col-sm-4 col-md-3">
                      <q-img :src="getImagenUrl(img)" :ratio="4/3" class="rounded-borders cursor-pointer" @click="verImagen(img)" />
                    </div>
                  </div>
                </div>

                <!-- Reseñas -->
                <div class="q-mt-lg">
                  <div class="text-subtitle1 text-weight-bold">Reseñas</div>
                  <div v-if="evento.reseñas?.length">
                    <div v-for="(res, idx) in evento.reseñas" :key="idx" class="q-mb-sm">
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
                  <div v-else class="text-grey q-pa-md">No hay reseñas aún. Sé el primero en comentar.</div>

                  <div v-if="auth.isLoggedIn && auth.rol === 'usuario_final'" class="q-mt-md">
                    <FormularioResena @submit="agregarResena" />
                  </div>
                  <div v-else-if="!auth.isLoggedIn" class="text-caption text-grey">
                    <q-btn flat label="Inicia sesión" to="/login" size="sm" /> para dejar una reseña.
                  </div>
                </div>
              </div>

              <!-- COLUMNA DERECHA: organizador, negocios cercanos, acciones -->
              <div class="col-12 col-md-4">
                <!-- Organizador -->
                <q-card flat bordered class="q-mb-md">
                  <q-card-section>
                    <div class="text-subtitle1 text-weight-bold">Organizador</div>
                    <div class="row items-center q-mt-sm">
                      <q-avatar size="40px" class="q-mr-md">
                        <img :src="organizadorLogo" @error="onOrgLogoError" />
                      </q-avatar>
                      <div>
                        <div class="text-weight-bold">{{ nombreOrganizador }}</div>
                        <div class="text-caption text-grey">{{ departamentoOrganizador }}</div>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>

                <!-- Botones de acción: guardar, recordatorio -->
                <q-card flat bordered class="q-mb-md">
                  <q-card-section>
                    <div class="row q-col-gutter-sm">
                      <div class="col-6">
                        <q-btn
                          outline
                          color="primary"
                          icon="bookmark"
                          label="Guardar en calendario"
                          class="full-width"
                          @click="guardarCalendario"
                        />
                      </div>
                      <div class="col-6">
                        <q-btn
                          outline
                          color="secondary"
                          icon="notifications"
                          label="Establecer recordatorio"
                          class="full-width"
                          @click="setRecordatorio"
                        />
                      </div>
                    </div>
                  </q-card-section>
                </q-card>

                <!-- Negocios cercanos (simulados o desde datos) -->
                <q-card flat bordered>
                  <q-card-section>
                    <div class="text-subtitle1 text-weight-bold">Negocios Cercanos</div>
                    <q-list dense separator>
                      <q-item v-for="negocio in negociosCercanos" :key="negocio.nombre" clickable v-ripple @click="negocio.id ? irANegocio(negocio.id) : null">
                        <q-item-section avatar>
                          <q-icon name="store" color="grey" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>{{ negocio.nombre }}</q-item-label>
                          <q-item-label caption lines="1">{{ negocio.descripcion }}</q-item-label>
                        </q-item-section>
                        <q-item-section side>
                          <q-rating :model-value="negocio.rating" readonly size="1em" color="amber" />
                          <span class="text-caption text-grey">{{ negocio.rating }}</span>
                        </q-item-section>
                      </q-item>
                    </q-list>
                    <div v-if="!negociosCercanos.length" class="text-grey text-center q-pa-md">
                      No hay negocios cercanos registrados.
                    </div>
                  </q-card-section>
                </q-card>

                <!-- Botones adicionales: favorito y visita (del usuario) -->
                <div v-if="auth.isLoggedIn && auth.rol === 'usuario_final'" class="row q-gutter-sm q-mt-md">
                  <BotonFavorito tipo="evento" :item="evento" />
                  <BotonVisita tipo="evento" :item="evento" />
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Estados de carga y error -->
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { couch } from 'src/api/index'
import { useAuthStore } from 'src/stores/auth'
import FormularioResena from 'src/components/FormularioResena.vue'
import MapaMini from 'src/components/MapaMini.vue'
import BotonFavorito from 'src/components/BotonFavorito.vue'
import BotonVisita from 'src/components/BotonVisita.vue'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const evento = ref(null)
const error = ref(null)
const orgLogoError = ref(false)

// Helper para formatear fechas
const formatDate = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleDateString('es-SV', { year: 'numeric', month: 'short', day: 'numeric' })
}

// Categoría (soporta string u objeto)
const categoriaRaw = computed(() => {
  const cat = evento.value?.categoria
  if (!cat) return ''
  if (typeof cat === 'string') return cat
  return cat.nombre || cat.clave || ''
})

const categoriaInfo = computed(() => {
  const clave = categoriaRaw.value.toLowerCase()
  const map = {
    deportes: { nombre: 'Deportes', color: 'blue' },
    gastronomia: { nombre: 'Gastronomía', color: 'green' },
    musica: { nombre: 'Música', color: 'purple' },
    cultura: { nombre: 'Cultura', color: 'teal' },
    naturaleza: { nombre: 'Naturaleza', color: 'lime' },
    feria: { nombre: 'Feria', color: 'orange' }
  }
  return map[clave] || { nombre: categoriaRaw.value || 'Evento', color: 'grey' }
})

// Departamento (soporta string u objeto)
const nombreDepartamento = computed(() => {
  const dep = evento.value?.departamento
  if (!dep) return ''
  if (typeof dep === 'string') return dep
  return dep.nombre || dep.clave || ''
})

const ubicacion = computed(() => {
  const municipio = evento.value?.municipio || ''
  const departamento = nombreDepartamento.value
  if (municipio && departamento) return `${municipio}, ${departamento}`
  if (municipio) return municipio
  if (departamento) return departamento
  return 'Ubicación no especificada'
})

// Fechas y horas
const fechaFormateada = computed(() => {
  if (!evento.value?.fecha_inicio) return 'Fecha no definida'
  const date = new Date(evento.value.fecha_inicio)
  if (isNaN(date.getTime())) return 'Fecha inválida'
  return date.toLocaleDateString('es-SV', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
})

const horaInicio = computed(() => {
  if (!evento.value?.fecha_inicio) return '--:--'
  const date = new Date(evento.value.fecha_inicio)
  if (isNaN(date.getTime())) return '--:--'
  return date.toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit', timeZone: 'America/El_Salvador' })
})

const horaFin = computed(() => {
  if (!evento.value?.fecha_fin) return '--:--'
  const date = new Date(evento.value.fecha_fin)
  if (isNaN(date.getTime())) return '--:--'
  return date.toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit', timeZone: 'America/El_Salvador' })
})

// Organizador (de evento.alcaldia)
const nombreOrganizador = computed(() => {
  return evento.value?.alcaldia?.nombre_institucional || 'Organizador no disponible'
})

const departamentoOrganizador = computed(() => {
  const alcaldia = evento.value?.alcaldia
  if (!alcaldia) return ''
  return `${alcaldia.municipio || ''}, ${alcaldia.departamento || ''}`
})

const organizadorLogo = computed(() => {
  if (orgLogoError.value) return 'https://via.placeholder.com/40?text=Logo'
  // Intentar acceder al logo de la alcaldía
  const alcId = evento.value?.alcaldia?._id
  if (alcId) {
    return couch.getImageUrl(`alc_${alcId}`, 'alc_logo.png')
  }
  return 'https://via.placeholder.com/40?text=Logo'
})

const onOrgLogoError = () => {
  orgLogoError.value = true
}

// Imagen del evento
const imgError = ref(false)

const imagenPortada = computed(() => {
  if (imgError.value || !evento.value || !evento.value.imagen_portada) {
    return 'https://via.placeholder.com/800x350?text=Evento'
  }
  const docId = `evt_${evento.value._id}`
  return couch.getImageUrl(docId, evento.value.imagen_portada)
})

// Negocios cercanos (mock mientras se implementa búsqueda real)
const negociosCercanos = ref([])
const cargarNegociosCercanos = async () => {
  if (!evento.value?.localizacion) return
  // Ejemplo: buscar negocios en el mismo departamento/municipio
  try {
    const result = await couch.find(import.meta.env.VITE_DB_DATA, {
      type: 'negocio',
      estado: 'activo',
      municipio: evento.value.municipio
    }, { limit: 5 })
    negociosCercanos.value = result.docs.map(neg => ({
      id: neg._id,
      nombre: neg.nombre_comercial,
      descripcion: neg.descripcion?.substring(0, 50),
      rating: neg.calificacion_promedio || 4.0
    }))
  } catch (e) {
    console.error('Error cargando negocios cercanos', e)
    // Datos de ejemplo basados en la imagen
    negociosCercanos.value = [
      { nombre: 'Pupusa El Surfista', descripcion: 'Las mejores pupusas de la costa', rating: 4.9 },
      { nombre: 'Café del Mar', descripcion: 'Café y postres con vista al mar', rating: 4.7 },
      { nombre: 'Artesanías Playeras', descripcion: 'Recreaciones y artesanías locales', rating: 4.5 }
    ]
  }
}

// Función para navegar al detalle del negocio
const irANegocio = (id) => {
  if (id) {
    router.push(`/negocio/${id}`)
  }
}

// Acciones
const verMapa = () => {
  if (evento.value?.localizacion?.lat) {
    window.open(`https://www.openstreetmap.org/?mlat=${evento.value.localizacion.lat}&mlon=${evento.value.localizacion.lng}#map=16/${evento.value.localizacion.lat}/${evento.value.localizacion.lng}`)
  }
}

const comoLlegar = () => {
  if (evento.value?.localizacion?.lat) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${evento.value.localizacion.lat},${evento.value.localizacion.lng}`)
  }
}

const guardarCalendario = () => {
  // Descargar archivo .ics o usar API del calendario nativo
  $q.notify({ type: 'info', message: 'Funcionalidad en desarrollo: guardar en calendario' })
}

const setRecordatorio = () => {
  $q.notify({ type: 'info', message: 'Funcionalidad en desarrollo: establecer recordatorio' })
}

const verImagen = (nombre) => {
  const url = getImagenUrl(nombre)
  window.open(url, '_blank')
}

// Cargar evento
async function cargarEvento() {
  try {
    const id = route.params.id
    evento.value = await couch.get(import.meta.env.VITE_DB_DATA, id)
    await cargarNegociosCercanos()
  } catch (err) {
    error.value = 'Evento no encontrado o error de conexión'
    console.error(err)
  }
}

// Agregar reseña (misma lógica original, adaptada)
async function agregarResena({ calificacion, comentario }) {
  if (!auth.user || auth.rol !== 'usuario_final') return
  try {
    const nuevaResena = {
      usuario_nombres: auth.user.nombres,
      usuario_apellidos: auth.user.apellidos,
      calificacion,
      comentario,
      fecha: new Date().toISOString()
    }

    evento.value.reseñas = evento.value.reseñas || []
    evento.value.reseñas.push(nuevaResena)
    // Recalcular promedio
    const total = evento.value.reseñas.reduce((sum, r) => sum + r.calificacion, 0)
    evento.value.calificacion_promedio = total / evento.value.reseñas.length

    await couch.put(import.meta.env.VITE_DB_DATA, evento.value)

    // Actualizar perfil del usuario
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
    $q.notify({ type: 'positive', message: 'Reseña agregada correctamente' })
  } catch (e) {
    console.error(e)
    $q.notify({ type: 'negative', message: 'Error al guardar la reseña' })
  }
}
onMounted(async () => {
  await cargarEvento()

})

const getImagenUrl = (nombre) => {
  if (!nombre || !evento.value) return ''
  const docId = `evt_${evento.value._id}`
  return couch.getImageUrl(docId, nombre)
}

// Además, vigila cambios en evento
watch(() => route.params.id, () => {
  imgError.value = false
})
</script>

<style scoped>
.detalle-evento-page {
  background: var(--q-color-grey-1);
  min-height: 100vh;
}
@media (prefers-color-scheme: dark) {
  .detalle-evento-page {
    background: var(--q-color-dark);
  }
}
</style>
