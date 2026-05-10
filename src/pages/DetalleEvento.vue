<template>
  <q-page padding class="detalle-evento-page">
    <div v-if="evento" class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8">
        <!-- Tarjeta principal -->
        <q-card flat bordered class="q-mb-md">
          <div @click="abrirImagen(imagenPortada)" style="cursor: pointer;">
            <q-img
              :src="imagenPortada"
              :ratio="16/9"
              style="width: 100%; max-height: 400px;"
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

                <!-- Categoría con chip mejorado -->
                <q-chip
                  :style="{ backgroundColor: categoriaData.color }"
                  text-color="white"
                  :label="categoriaData.nombre"
                  class="q-mt-sm"
                />

                <div class="column q-mt-md q-gutter-y-xs">
                  <div class="flex items-center">
                    <q-icon name="event" size="20px" class="q-mr-xs text-primary" />
                    <span class="text-body1">{{ displayFecha }}</span>
                  </div>
                  <div class="flex items-center">
                    <q-icon name="schedule" size="20px" class="q-mr-xs text-primary" />
                    <span class="text-body1">{{ displayHora }}</span>
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
                      <q-img :src="getImagenUrl(img)" :ratio="4/3" class="rounded-borders cursor-pointer" @click="abrirImagen(getImagenUrl(img))" />
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

                <!-- Negocios cercanos -->
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

                <!-- Botones adicionales: favorito y visita -->
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

  <!-- Diálogo para imagen ampliada -->
  <q-dialog v-model="dialogImagen" maximized>
    <div class="flex flex-center" style="height: 100%; background: rgba(0,0,0,0.9);" @click="dialogImagen = false">
      <q-img :src="imagenDialogUrl" fit="contain" style="max-height: 90vh; max-width: 90vw;" />
    </div>
  </q-dialog>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { couch } from 'src/api/index'
import { negocioAPI } from 'src/api/negocio'
import { useAuthStore } from 'src/stores/auth'
import { useConfiguracionStore } from 'src/stores/configuracion'
import FormularioResena from 'src/components/FormularioResena.vue'
import MapaMini from 'src/components/MapaMini.vue'
import BotonFavorito from 'src/components/BotonFavorito.vue'
import BotonVisita from 'src/components/BotonVisita.vue'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const configStore = useConfiguracionStore()

const evento = ref(null)
const error = ref(null)
const orgLogoError = ref(false)
const dialogImagen = ref(false)
const imagenDialogUrl = ref('')

// Helper para formatear fechas
const formatDate = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleDateString('es-SV', { year: 'numeric', month: 'short', day: 'numeric' })
}

// Abrir imagen en diálogo
const abrirImagen = (url) => {
  imagenDialogUrl.value = url
  dialogImagen.value = true
}

// ---- CATEGORÍA DESDE CONFIGURACIÓN ----
function extractCategoryKey(cat) {
  if (!cat) return ''
  if (typeof cat === 'string') return cat
  return cat.value || cat.clave || cat.label || ''
}

const categoriaKey = computed(() => extractCategoryKey(evento.value?.categoria).toLowerCase().trim())

const categoriaData = computed(() => {
  const key = categoriaKey.value
  const items = configStore.categoriasEventos
  const found = items.find(item => item.clave.toLowerCase() === key || item.nombre.toLowerCase() === key)
  return found
    ? { nombre: found.nombre, color: found.color }
    : { nombre: 'Evento', color: '#9E9E9E' }
})
// ------------------------------------

// --- NOMBRE DEL DEPARTAMENTO ---
const departamentoNombre = computed(() => {
  const dep = evento.value?.departamento
  if (!dep) return ''
  if (typeof dep === 'string') {
    const found = configStore.departamentos.find(d => d.clave === dep)
    return found?.nombre || dep
  } else {
    return dep.nombre || dep.clave || ''
  }
})

// --- NOMBRE DEL DISTRITO (con fallback a alcaldía) ---
const distritoNombre = computed(() => {
  // 1. Si el evento tiene el objeto distrito con nombre, usarlo directamente
  if (evento.value?.distrito?.nombre) {
    return evento.value.distrito.nombre
  }

  // 2. Si no, buscar a partir de municipio (que puede ser objeto o string)
  const mun = evento.value?.municipio
  if (!mun) return ''

  let clave = ''
  if (typeof mun === 'string') clave = mun
  else if (mun.clave) clave = mun.clave
  else if (mun.value) clave = mun.value
  else return mun.nombre || ''

  // 3. Buscar en catálogo de distritos por clave
  const distrito = configStore.distritos.find(d => d.clave === clave)
  if (distrito) return distrito.nombre

  // 4. Si no se encuentra, podría ser una alcaldía; extraer el distrito principal
  const alcaldiaEncontrada = configStore.alcaldias.find(a => a.clave === clave)
  if (alcaldiaEncontrada) {
    const distritosAlc = configStore.distritos.filter(d => d.alcaldia === clave)
    if (distritosAlc.length > 0) {
      const base = alcaldiaEncontrada.nombre.replace(/\s+(Norte|Sur|Este|Oeste|Centro)$/i, '').trim()
      const match = distritosAlc.find(d => d.nombre.toLowerCase() === base.toLowerCase())
      if (match) return match.nombre
      return distritosAlc[0].nombre
    }
    return alcaldiaEncontrada.nombre
  }

  // 5. Si todo falla, devolver la clave original
  return clave
})

// Ubicación completa
const ubicacion = computed(() => {
  const distrito = distritoNombre.value
  const departamento = departamentoNombre.value
  if (distrito && departamento) return `${distrito}, ${departamento}`
  if (distrito) return distrito
  if (departamento) return departamento
  return 'Ubicación no especificada'
})

// --- LÓGICA DE FECHA Y HORA (Línea de Tiempo) ---

// Helper para formatear AM/PM a a. m. / p. m.
const formatAMPM = (date) => {
  return date.toLocaleTimeString('es-SV', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/El_Salvador'
  }).replace('AM', 'a. m.').replace('PM', 'p. m.');
}

// Helper para abreviatura de día (Jue, Sáb, etc)
const getDiaSemanaAbbr = (date) => {
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return dias[date.getDay()];
}

const displayFecha = computed(() => {
  if (!evento.value?.fecha_inicio) return 'Fecha no definida';

  const inicio = new Date(evento.value.fecha_inicio);
  const fin = evento.value.fecha_fin ? new Date(evento.value.fecha_fin) : null;

  if (isNaN(inicio.getTime())) return 'Fecha inválida';

  const opcionesMes = { day: 'numeric', month: 'long' };
  const anio = inicio.getFullYear();

  // Caso: Mismo día o no hay fecha de fin
  if (!fin || inicio.toDateString() === fin.toDateString()) {
    return `${inicio.toLocaleDateString('es-SV', opcionesMes)} de ${anio}`;
  }

  // Caso: Diferentes días
  const inicioStr = inicio.toLocaleDateString('es-SV', opcionesMes);
  const finStr = fin.toLocaleDateString('es-SV', opcionesMes);
  return `${inicioStr} — ${finStr}, ${anio}`;
});

const displayHora = computed(() => {
  if (!evento.value?.fecha_inicio) return '--:--';

  const inicio = new Date(evento.value.fecha_inicio);
  const fin = evento.value.fecha_fin ? new Date(evento.value.fecha_fin) : null;

  if (isNaN(inicio.getTime())) return '--:--';

  const horaInicioStr = formatAMPM(inicio);

  // Caso: Mismo día
  if (!fin || inicio.toDateString() === fin.toDateString()) {
    const horaFinStr = fin ? formatAMPM(fin) : '';
    return horaFinStr ? `${horaInicioStr} — ${horaFinStr}` : horaInicioStr;
  }

  // Caso: Diferentes días (con abreviatura de día)
  const horaFinStr = formatAMPM(fin);
  return `${horaInicioStr} (${getDiaSemanaAbbr(inicio)}) — ${horaFinStr} (${getDiaSemanaAbbr(fin)})`;
});

// --- ORGANIZADOR ---
const nombreOrganizador = computed(() => {
  const alc = evento.value?.alcaldia
  if (!alc) return 'Organizador no disponible'

  // Si es un objeto, tomar nombre_institucional o nombre
  if (typeof alc === 'object') {
    return alc.nombre_institucional || alc.nombre || 'Organizador no disponible'
  }

  // Si es string, buscar en el catálogo de alcaldías
  const found = configStore.alcaldias.find(a => a.clave === alc)
  return found?.nombre || alc
})

const organizadorMunicipioNombre = computed(() => {
  const clave = evento.value?.alcaldia?.municipio || (typeof evento.value?.alcaldia === 'string' ? evento.value.alcaldia : '')
  if (!clave) return ''
  const alc = configStore.alcaldias.find(a => a.clave === clave)
  return alc?.nombre || clave
})

const organizadorDepartamentoNombre = computed(() => {
  const clave = evento.value?.alcaldia?.departamento
  if (!clave) return ''
  const dep = configStore.departamentos.find(d => d.clave === clave)
  return dep?.nombre || clave
})

const departamentoOrganizador = computed(() => {
  const mun = organizadorMunicipioNombre.value
  const dep = organizadorDepartamentoNombre.value
  return `${mun || ''}${mun && dep ? ', ' : ''}${dep || ''}`
})

const organizadorLogo = computed(() => {
  // Placeholder por defecto si hay error o no hay logo
  if (orgLogoError.value) return 'https://via.placeholder.com/40?text=Logo'
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

// Negocios cercanos
const negociosCercanos = ref([])
const cargarNegociosCercanos = async () => {
  if (!evento.value?.localizacion) return
  try {
    const result = await negocioAPI.listNegociosActivos({ municipio: evento.value.municipio }, { limit: 5 })
    negociosCercanos.value = result.map(neg => ({
      id: neg._id,
      nombre: neg.nombre_comercial,
      descripcion: neg.descripcion?.substring(0, 50),
      rating: neg.calificacion_promedio || 4.0
    }))
  } catch (e) {
    console.error('Error cargando negocios cercanos', e)
    negociosCercanos.value = [
      { nombre: 'Pupusa El Surfista', descripcion: 'Las mejores pupusas de la costa', rating: 4.9 },
      { nombre: 'Café del Mar', descripcion: 'Café y postres con vista al mar', rating: 4.7 },
      { nombre: 'Artesanías Playeras', descripcion: 'Recreaciones y artesanías locales', rating: 4.5 }
    ]
  }
}

const irANegocio = (id) => {
  if (id) {
    router.push(`/negocio/${id}`)
  }
}

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
  $q.notify({ type: 'info', message: 'Funcionalidad en desarrollo: guardar en calendario' })
}

const setRecordatorio = () => {
  $q.notify({ type: 'info', message: 'Funcionalidad en desarrollo: establecer recordatorio' })
}

// Agregar reseña
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
    const total = evento.value.reseñas.reduce((sum, r) => sum + r.calificacion, 0)
    evento.value.calificacion_promedio = total / evento.value.reseñas.length

    await couch.put(import.meta.env.VITE_DB_DATA, evento.value)

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

const getImagenUrl = (nombre) => {
  if (!nombre || !evento.value) return ''
  const docId = `evt_${evento.value._id}`
  return couch.getImageUrl(docId, nombre)
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

onMounted(async () => {
  await configStore.fetchCatalogos()
  await cargarEvento()
})

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
