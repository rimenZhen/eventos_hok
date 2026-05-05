<template>
  <q-page padding class="favoritos-page">
    <div class="row items-center justify-between q-col-gutter-md q-mb-lg">
      <div class="col">
        <div class="text-h5 q-mb-xs">Tus favoritos</div>
        <div class="text-subtitle2 text-grey">Lo que más te gustó de lo que viste</div>
      </div>
      <div class="col-auto row items-center q-col-gutter-sm">
        <!-- Color dinámico basado en isDark -->
        <q-btn 
          dense 
          outline 
          :color="isDark ? 'white' : 'black'" 
          label="Ordenar"
        >
          <q-menu anchor="bottom right" self="top right">
            <q-list>
              <q-item clickable v-ripple @click="changeSort('recientes')">
                <q-item-section>Más recientes</q-item-section>
              </q-item>
              <q-item clickable v-ripple @click="changeSort('departamento')">
                <q-item-section>Por departamento</q-item-section>
              </q-item>
              <q-item clickable v-ripple @click="changeSort('resenas')">
                <q-item-section>Reseñas</q-item-section>
              </q-item>
              <q-item clickable v-ripple @click="changeSort('fecha')">
                <q-item-section>Fecha</q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-ripple @click="goToMisResenas">
                <q-item-section>Mis reseñas</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
    </div>

    <div class="row items-center q-col-gutter-sm q-mb-md">
      <div class="col-12 col-sm-auto">
        <q-btn-toggle
          v-model="tab"
          :options="tabOptions"
          unelevated
          glossy
          toggle-color="primary"
          class="shadow-1"
        />
      </div>
      <div class="col" v-if="selectionMode">
        <div class="row favorite-actions items-center q-col-gutter-sm justify-end">
          <q-btn color="negative" label="Eliminar seleccionados" :disable="selectedIds.length === 0" @click="eliminarSeleccionados" />
          <q-btn flat label="Cancelar" @click="cancelSelectionMode" />
        </div>
      </div>
    </div>

    <div
      v-if="sortedFavoritos.length === 0"
      class="text-center text-grey q-pa-xl"
    >
      No tienes favoritos guardados.
    </div>

    <div v-else class="row q-col-gutter-md q-mt-md">
      <div
        v-for="fav in sortedFavoritos"
        :key="fav._id"
        class="col-12 col-sm-6 col-md-4"
      >
        <q-card
          :bordered="selectionMode"
          :class="selectionMode && selectedIds.includes(fav._id) ? 'border-primary' : ''"
          class="cursor-pointer"
          @click="selectionMode ? toggleSelection(fav._id) : null"
        >
          <q-card-section>
            <div class="row items-center q-col-gutter-sm">
              <div class="col">
                <div class="text-subtitle1">{{ fav.titulo || fav.nombre || fav.nombre_comercial }}</div>
                <div class="text-caption">{{ fav.departamento }}, {{ fav.municipio }}</div>
              </div>
              <q-checkbox
                v-if="selectionMode"
                v-model="selectedIds"
                :val="fav._id"
                color="primary"
                dense
              />
            </div>
          </q-card-section>
          <q-card-actions align="right" v-if="!selectionMode">
            <q-btn
              flat
              round
              icon="delete"
              color="negative"
              @click.stop="eliminarFavorito(fav)"
            />
            <q-btn flat :to="detalleUrl(fav)" label="Ver" />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { usuariosAPI } from 'src/api/usuarios'
import { useQuasar } from 'quasar'

const $q = useQuasar() 
const router = useRouter()
const auth = useAuthStore()
const tab = ref('todos')
const sortOption = ref('recientes')
const selectionMode = ref(false)
const selectedIds = ref([])

const isDark = computed(() => $q.dark.isActive)

const tabOptions = [
  { label: 'Todos', value: 'todos' },
  { label: 'Eventos', value: 'eventos' },
  { label: 'Sitios', value: 'sitios' },
  { label: 'Negocios', value: 'negocios' }
]

const favoritos = computed(() => {
  const detalle = auth.user?.detalles?.detalle_usuario
  if (!detalle) return []
  const eventos = (detalle.eventos_guardados || []).map(item => ({ ...item, type: 'evento' }))
  const sitios = (detalle.sitios_guardados || []).map(item => ({ ...item, type: 'sitio' }))
  const negocios = (detalle.negocios_guardados || []).map(item => ({ ...item, type: 'negocio' }))

  if (tab.value === 'eventos') return eventos
  if (tab.value === 'sitios') return sitios
  if (tab.value === 'negocios') return negocios
  return [...eventos, ...sitios, ...negocios]
})

const sortedFavoritos = computed(() => {
  const items = [...favoritos.value]
  
  if (sortOption.value === 'departamento') {
    return items.sort((a, b) => {
      const aDep = (a.departamento || '').toString().toLowerCase()
      const bDep = (b.departamento || '').toString().toLowerCase()
      return aDep.localeCompare(bDep)
    })
  }
  
  if (sortOption.value === 'resenas') {
    return items.sort((a, b) => {
      const aResenas = (a.resenas?.length || 0) + (a.promedio_resenas || 0)
      const bResenas = (b.resenas?.length || 0) + (b.promedio_resenas || 0)
      return bResenas - aResenas
    })
  }
  
  if (sortOption.value === 'fecha') {
    return items.sort((a, b) => {
      const aFecha = new Date(a.fecha_inicio || a.fecha || '9999-12-31')
      const bFecha = new Date(b.fecha_inicio || b.fecha || '9999-12-31')
      return aFecha - bFecha
    })
  }
  
  return items.reverse()
})

function changeSort(option) {
  sortOption.value = option
}

function goToMisResenas() {
  router.push('/usuario/resenas')
}

function cancelSelectionMode() {
  selectionMode.value = false
  selectedIds.value = []
}

function toggleSelection(id) {
  if (!selectionMode.value) return
  const index = selectedIds.value.indexOf(id)
  if (index === -1) {
    selectedIds.value.push(id)
  } else {
    selectedIds.value.splice(index, 1)
  }
}

function getItemType(item) {
  if (item.type) return item.type
  if (tab.value === 'eventos') return 'evento'
  if (tab.value === 'sitios') return 'sitio'
  if (tab.value === 'negocios') return 'negocio'
  if (item.nombre_comercial) return 'negocio'
  if (item.titulo) return 'evento'
  return 'sitio'
}

async function eliminarSeleccionados() {
  if (selectedIds.value.length === 0) return
  const items = favoritos.value.filter(item => selectedIds.value.includes(item._id))
  try {
    await Promise.all(items.map(item => {
      const tipoItem = getItemType(item)
      return usuariosAPI.removeFavorito(auth.user._id, tipoItem, item._id)
    }))
    
    const detalle = auth.user.detalles.detalle_usuario
    items.forEach(item => {
      const tipoItem = getItemType(item)
      const campo = tipoItem === 'evento' ? 'eventos_guardados' : tipoItem === 'sitio' ? 'sitios_guardados' : 'negocios_guardados'
      detalle[campo] = (detalle[campo] || []).filter(i => i._id !== item._id)
    })
    
    selectedIds.value = []
    selectionMode.value = false
  } catch (e) {
    console.error(e)
  }
}

function detalleUrl(item) {
  const tipo =
    tab.value === 'eventos'
      ? 'evento'
      : tab.value === 'sitios'
        ? 'sitio'
        : tab.value === 'negocios'
          ? 'negocio'
          : getItemType(item)
  return `/${tipo}/${item._id}`
}

async function eliminarFavorito(item) {
  try {
    const tipoItem = getItemType(item)
    await usuariosAPI.removeFavorito(auth.user._id, tipoItem, item._id)
    
    const detalle = auth.user.detalles.detalle_usuario
    const campo = tipoItem === 'evento' ? 'eventos_guardados' : tipoItem === 'sitio' ? 'sitios_guardados' : 'negocios_guardados'
    detalle[campo] = (detalle[campo] || []).filter(i => i._id !== item._id)
  } catch (e) {
    console.error('Error al eliminar favorito:', e)
  }
}
</script>

<style scoped>
.favoritos-page {
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 3rem;
}

.favorite-actions {
  align-items: center;
}

.favorite-actions .q-btn {
  min-width: 140px;
}

.q-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.q-card:hover {
  transform: translateY(-2px);
}

@media (max-width: 959px) {
  .favoritos-page {
    padding: 0 1rem;
  }

  .favorite-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .favorite-actions .q-btn {
    width: 100%;
  }
}

@media (max-width: 599px) {
  .q-card {
    min-height: auto;
  }
}
</style>