<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">Catálogo</div>
    <div v-if="negocio" class="row q-col-gutter-sm">
      <div v-for="(item, idx) in negocio.catalogo" :key="idx" class="col-12 col-sm-6 col-md-4">
        <q-card>
          <q-img :src="getImagenProducto(item.imagenes?.[0] || item.imagen)" :ratio="1" />
          <q-card-section>
            <div class="text-subtitle2">{{ item.nombre }}</div>
            <div class="text-caption">{{ item.descripcion }}</div>
            <div class="text-weight-bold">${{ item.precio }}</div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat round icon="edit" @click="editarItem(idx)" />
            <q-btn flat round icon="delete" color="negative" @click="eliminarItem(idx)" />
          </q-card-actions>
        </q-card>
      </div>
    </div>
    <q-btn label="Añadir producto" color="primary" icon="add" class="q-mt-md" @click="nuevoProducto" />

    <!-- Diálogo para añadir/editar producto -->
    <q-dialog v-model="dialogo">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ editando !== null ? 'Editar' : 'Nuevo' }} producto</div>
        </q-card-section>
        <q-card-section>
          <q-input v-model="prod.nombre" label="Nombre" outlined />
          <q-input v-model="prod.descripcion" label="Descripción" outlined class="q-mt-sm" />
          <q-input v-model="prod.precio" label="Precio" type="number" step="0.01" outlined class="q-mt-sm" />
          <q-file v-model="prod.file" label="Imagen" outlined class="q-mt-sm" accept="image/*" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn flat label="Guardar" color="primary" @click="guardarProducto" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted, watch, onBeforeUnmount } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { negocioAPI } from 'src/api/negocio'
import { couch } from 'src/api/index'

const auth = useAuthStore()
const negocio = ref(null)
const dialogo = ref(false)
const editando = ref(null)
const imageSources = reactive({})
const placeholderImage = 'https://via.placeholder.com/200'
const prod = reactive({
  nombre: '',
  descripcion: '',
  precio: 0,
  file: null
})

onMounted(async () => {
  try {
    negocio.value = await negocioAPI.getMiNegocio(auth.user._id)
  } catch (e) {
    console.error(e)
  }
})

watch(
  () => negocio.value?.catalogo,
  () => { precargarImagenesCatalogo() },
  { deep: true, immediate: true }
)

onBeforeUnmount(() => {
  Object.values(imageSources).forEach(src => {
    if (typeof src === 'string' && src.startsWith('blob:')) URL.revokeObjectURL(src)
  })
})

function getImagenProducto(nombreArchivo) {
  if (!nombreArchivo) return placeholderImage
  const key = `neg_${negocio.value?._id || ''}/${nombreArchivo}`
  return imageSources[key] || placeholderImage
}

async function cargarImagenProducto(nombreArchivo) {
  if (!nombreArchivo || !negocio.value?._id) return
  const key = `neg_${negocio.value._id}/${nombreArchivo}`
  if (imageSources[key] && !imageSources[key].startsWith('blob:')) return

  try {
    const blob = await couch.fetchImageBlob(`neg_${negocio.value._id}`, nombreArchivo)
    const objectUrl = URL.createObjectURL(blob)
    const previous = imageSources[key]
    if (previous?.startsWith('blob:')) URL.revokeObjectURL(previous)
    imageSources[key] = objectUrl
  } catch {
    imageSources[key] = placeholderImage
  }
}

async function precargarImagenesCatalogo() {
  if (!negocio.value?._id) return
  const archivos = new Set()

  for (const item of negocio.value.catalogo || []) {
    const nombres = item.imagenes?.length ? item.imagenes : item.imagen ? [item.imagen] : []
    for (const nombre of nombres) {
      if (nombre) archivos.add(nombre)
    }
  }

  await Promise.all([...archivos].map(nombre => cargarImagenProducto(nombre)))
}

function nuevoProducto() {
  editando.value = null
  prod.nombre = ''
  prod.descripcion = ''
  prod.precio = 0
  prod.file = null
  dialogo.value = true
}

function editarItem(idx) {
  const item = negocio.value.catalogo[idx]
  if (item) {
    editando.value = idx
    prod.nombre = item.nombre
    prod.descripcion = item.descripcion || ''
    prod.precio = item.precio
    prod.file = null
    dialogo.value = true
  }
}

async function guardarProducto() {
  try {
    const nuevoItem = {
      nombre: prod.nombre,
      descripcion: prod.descripcion,
      precio: prod.precio,
      imagenes: []
    }

    // Si hay archivo, lo subimos primero (usando un nombre único)
    if (prod.file) {
      const imgDocId = 'neg_' + negocio.value._id
      let imgDoc
      try { imgDoc = await couch.get(import.meta.env.VITE_DB_IMAGES, imgDocId) }
      catch { imgDoc = await couch.createImageDoc(imgDocId, 'negocio', negocio.value._id) }
      // Subimos con nombre original o genérico
      await couch.uploadImage(imgDocId, imgDoc._rev, prod.file)
      nuevoItem.imagenes = [prod.file.name]
      // Actualizamos rev del imgDoc para siguientes subidas (si hace falta)
    }

    if (editando.value !== null) {
      await negocioAPI.updateProducto(negocio.value._id, negocio.value._rev, editando.value, nuevoItem)
    } else {
      await negocioAPI.addProducto(negocio.value._id, negocio.value._rev, nuevoItem)
    }

    // Refrescar negocio
    negocio.value = await negocioAPI.getMiNegocio(auth.user._id)
    dialogo.value = false
  } catch (e) {
    console.error(e)
  }
}

async function eliminarItem(idx) {
  try {
    await negocioAPI.deleteProducto(negocio.value._id, negocio.value._rev, idx)
    negocio.value = await negocioAPI.getMiNegocio(auth.user._id)
  } catch (e) {
    console.error(e)
  }
}
</script>
