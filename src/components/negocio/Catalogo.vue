<template>
  <q-page padding>

    <!-- HEADER -->
    <div class="catalogs-container">
      <div class="header">
        <div class="title">
          <q-icon name="menu_book" size="24px" />
          <span>Catálogos Publicados</span>
        </div>

        <q-btn
          outline
          icon="add"
          label="Nuevo Producto"
          @click="nuevoProducto"
        />
      </div>

      <!-- HORIZONTAL SLIDE -->
      <div v-if="negocio && negocio.catalogo?.length" class="catalog-slide-container">
        <div class="catalog-slide-track">
          <div
            v-for="(item, idx) in negocio.catalogo"
            :key="item.catalogKey || idx"
            class="catalog-slide-item"
          >
          <!-- Imágenes con Carrusel -->
          <div class="image-wrapper">
            <q-carousel
              v-if="item.imagenes?.length > 1"
              :model-value="activeSlides[idx] ?? 0"
              @update:model-value="val => { activeSlides[idx] = val }"
              animated
              arrows
              height="170px"
              class="carousel"
            >
              <q-carousel-slide
                v-for="(imagen, imgIdx) in item.imagenes"
                :key="imgIdx"
                :name="imgIdx"
                class="carousel-slide"
              >
                <q-img
                  :src="getImagenProducto(imagen)"
                  :ratio="16/9"
                  class="image"
                  fit="cover"
                />
              </q-carousel-slide>
            </q-carousel>
            <q-img
              v-else-if="item.imagenes?.length === 1"
              :src="getImagenProducto(item.imagenes[0])"
              :ratio="16/9"
              class="image"
              fit="cover"
            />
            <q-img
              v-else
              :src="getImagenProducto(item.imagen)"
              :ratio="16/9"
              class="image"
              fit="cover"
            />
          </div>

          <!-- CONTENIDO -->
          <div class="content">

            <!-- HEADER -->
            <div class="card-header">
              <div class="title">
                <q-icon
                  :name="getMeta(item.tipo).icon"
                  :color="getMeta(item.tipo).color"
                  size="16px"
                />
                <span>{{ item.nombre }}</span>
              </div>

              <q-badge
                rounded
                color="blue-2"
                text-color="blue-8"
              >
                {{ item.activo ? 'Activo' : 'Borrador' }}
              </q-badge>
            </div>

            <!-- TIPO -->
            <q-badge
              :color="getMeta(item.tipo).color + '-2'"
              :text-color="getMeta(item.tipo).color + '-8'"
              class="q-mt-xs"
            >
              {{ getMeta(item.tipo).label }}
            </q-badge>

            <!-- INFO -->
            <div class="date">
              <q-icon name="event" size="14px" />
              {{ formatDate(new Date()) }}
            </div>

            <div class="desc">
              {{ item.descripcion }}
            </div>

            <!-- ACCIONES -->
            <div class="actions">
              <q-btn flat icon="edit" label="Editar" @click="editarItem(idx)" />
              <q-btn
                unelevated
                color="primary"
                icon="delete"
                label="Eliminar"
                @click="confirmarEliminar(idx)"
              />
            </div>

          </div>
          </div>
        </div>
      </div>

      <!-- EMPTY -->
      <div v-else class="empty-state">
        <q-icon name="inbox" size="60px" />
        <p>No hay productos</p>
        <q-btn label="Crear primero" color="primary" @click="nuevoProducto" />
      </div>
    </div>

    <!-- DIALOG -->
    <q-dialog v-model="dialogo" @hide="resetDialog">
      <q-card class="dialog-card">
        <q-card-section class="dialog-header">
          <h6>{{ editando !== null ? 'Editar' : 'Nuevo' }} producto</h6>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section>

          <q-input v-model="prod.nombre" label="Nombre" outlined dense class="q-mb-md" />

          <q-input
            v-model="prod.descripcion"
            label="Descripción"
            outlined
            type="textarea"
            rows="3"
            class="q-mb-md"
          />

          <q-input
            v-model.number="prod.precio"
            label="Precio"
            type="number"
            outlined
            dense
            class="q-mb-md"
          />

          <!-- NUEVO: TIPO -->
          <q-select
            v-model="prod.tipo"
            :options="typeOptions"
            label="Tipo de producto"
            outlined
            dense
            emit-value
            map-options
            class="q-mb-md"
          >
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section avatar>
                  <q-icon :name="scope.opt.icon" :color="scope.opt.color" />
                </q-item-section>
                <q-item-section>
                  {{ scope.opt.label }}
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <div v-if="editando !== null && currentEditImages.length" class="q-mb-lg">
            <div class="text-subtitle2 q-mb-sm">Imágenes actuales</div>
            <q-carousel
              v-model="editImageSlide"
              animated
              arrows
              height="190px"
              class="edit-carousel q-mb-sm"
            >
              <q-carousel-slide
                v-for="(imagen, imgIdx) in currentEditImages"
                :key="imgIdx"
                :name="imgIdx"
                class="carousel-slide"
              >
                <q-img
                  :src="getImagenProducto(imagen)"
                  :ratio="16/9"
                  class="image"
                  fit="cover"
                />
              </q-carousel-slide>
            </q-carousel>

            <div class="row q-gutter-sm q-mt-sm">
              <q-btn
                outline
                color="negative"
                icon="delete"
                label="Eliminar actual"
                @click="toggleDeleteCurrentImage"
              />
              <q-btn
                outline
                color="primary"
                icon="published_with_changes"
                label="Reemplazar actual"
                @click="startReplaceCurrentImage"
              />
            </div>

            <div v-if="pendingDeleteImages.length" class="text-caption text-negative q-mt-sm">
              Marcadas para borrar: {{ pendingDeleteImages.length }}
            </div>

            <div v-if="hasPendingReplacements" class="text-caption text-primary q-mt-xs">
              Hay reemplazos pendientes.
            </div>

            <q-file
              v-if="replaceTargetIndex !== null"
              v-model="replaceFile"
              class="q-mt-md"
              label="Selecciona la nueva imagen"
              outlined
              dense
              accept="image/*"
              @update:model-value="queueReplacementFile"
            />
          </div>

          <div class="q-mb-md">
            <template v-if="remainingNewImageSlots > 0">
              <label class="block q-mb-sm">
                Agregar nuevas imágenes (faltan {{ remainingNewImageSlots }})
              </label>
              <q-file
                v-model="prod.files"
                label="Seleccionar imágenes"
                outlined
                dense
                accept="image/*"
                @rejected="onFilesRejected"
                multiple
                max-file-size="5242880"
                :max-files="remainingNewImageSlots"
              />
              <div v-if="prod.files.length" class="q-mt-md">
                <p class="text-caption text-weight-bold">
                  Imágenes seleccionadas ({{ prod.files.length }}/{{ remainingNewImageSlots }})
                </p>
                <div class="file-list">
                  <div v-for="(file, idx) in prod.files" :key="idx" class="file-item">
                    <q-icon name="image" color="primary" />
                    <span>{{ file.name }} ({{ formatFileSize(file.size) }})</span>
                    <q-btn
                      flat
                      round
                      dense
                      icon="close"
                      size="sm"
                      @click="removeFile(idx)"
                    />
                  </div>
                </div>
              </div>
            </template>

            <div v-else class="text-caption text-positive q-mt-sm">
              Ya están completas las 3 imágenes permitidas.
            </div>
          </div>

        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            unelevated
            label="Guardar"
            color="primary"
            @click="guardarProducto"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- CONFIRM -->
    <q-dialog v-model="confirmaEliminar">
      <q-card>
        <q-card-section>
          ¿Eliminar producto?
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="negative" label="Eliminar" @click="eliminarItem" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
defineOptions({ name: 'CatalogoNegocio' })
import { ref, reactive, onMounted, computed } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { negocioAPI } from 'src/api/negocio'
import { couch } from 'src/api/index'

// META TIPOS
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

const typeOptions = Object.entries(PRODUCT_TYPE_META).map(([key, val]) => ({
  label: val.label,
  value: key,
  icon: val.icon,
  color: val.color
}))

const auth = useAuthStore()

const negocio = ref(null)
const dialogo = ref(false)
const confirmaEliminar = ref(false)
const editando = ref(null)
const idxAEliminar = ref(null)
const activeSlides = reactive({})
const editImageSlide = ref(0)
const replaceTargetIndex = ref(null)
const replaceFile = ref(null)
const pendingDeleteImages = ref([])
const pendingReplacementFiles = reactive({})

const prod = reactive({
  nombre: '',
  descripcion: '',
  precio: 0,
  tipo: '',
  files: []
})

onMounted(async () => {
  negocio.value = await negocioAPI.getMiNegocio(auth.user._id)
})

const currentEditImages = computed(() => {
  if (editando.value === null || !negocio.value?.catalogo?.[editando.value]) return []
  const item = negocio.value.catalogo[editando.value]
  return item.imagenes?.length ? item.imagenes : item.imagen ? [item.imagen] : []
})

const hasPendingReplacements = computed(() => Object.keys(pendingReplacementFiles).length > 0)

const remainingNewImageSlots = computed(() => {
  const currentImages = currentEditImages.value.length
  const pendingDeletes = pendingDeleteImages.value.length
  const pendingNewFiles = prod.files.length
  const usedSlots = Math.max(currentImages - pendingDeletes, 0) + pendingNewFiles
  return Math.max(3 - usedSlots, 0)
})

function getMeta(tipo) {
  return PRODUCT_TYPE_META[tipo] || {
    icon: 'category',
    color: 'grey',
    label: tipo || 'Sin tipo'
  }
}

function getImagenProducto(nombreArchivo) {
  try {
    if (!nombreArchivo || !negocio?.value?._id) return 'https://via.placeholder.com/400x300'
    // asegurar que los valores estén codificados correctamente
    return couch.getImageUrl('neg_' + negocio.value._id, nombreArchivo)
  } catch (err) {
    // fallback visual y log para depuración
    console.warn('getImagenProducto error:', err)
    return 'https://via.placeholder.com/400x300'
  }
}

function formatDate(date) {
  return date.toLocaleDateString()
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function removeFile(idx) {
  prod.files.splice(idx, 1)
}

function onFilesRejected(rejectedEntries) {
  console.warn('Archivos rechazados:', rejectedEntries)
}

function resetImageEditState() {
  editImageSlide.value = 0
  replaceTargetIndex.value = null
  replaceFile.value = null
  pendingDeleteImages.value = []
  Object.keys(pendingReplacementFiles).forEach(key => {
    delete pendingReplacementFiles[key]
  })
}

function resetDialog() {
  resetImageEditState()
  prod.files = []
}

function nuevoProducto() {
  editando.value = null
  Object.assign(prod, { nombre:'', descripcion:'', precio:0, tipo:'', files:[], catalogKey: '' })
  resetImageEditState()
  dialogo.value = true
}

function editarItem(idx) {
  const item = negocio.value.catalogo[idx]
  editando.value = idx
  Object.assign(prod, item)
  prod.files = [] // Limpiar archivos nuevos para evitar sobrescribir
  resetImageEditState()
  dialogo.value = true
}

function startReplaceCurrentImage() {
  if (!currentEditImages.value.length) return
  replaceTargetIndex.value = editImageSlide.value
  replaceFile.value = null
}

function queueReplacementFile(file) {
  if (replaceTargetIndex.value === null || !file) return
  pendingReplacementFiles[replaceTargetIndex.value] = file
  replaceTargetIndex.value = null
  replaceFile.value = null
}

function toggleDeleteCurrentImage() {
  if (!currentEditImages.value.length) return
  const idx = editImageSlide.value
  const exists = pendingDeleteImages.value.includes(idx)
  pendingDeleteImages.value = exists
    ? pendingDeleteImages.value.filter(item => item !== idx)
    : [...pendingDeleteImages.value, idx]
}

async function syncImageDoc() {
  const imgDocId = 'neg_' + negocio.value._id
  try {
    return await couch.get(import.meta.env.VITE_DB_IMAGES, imgDocId)
  } catch {
    return await couch.createImageDoc(imgDocId, 'negocio', negocio.value._id)
  }
}

async function uploadSingleImage(imgDocId, imgDoc, file) {
  await couch.uploadImage(imgDocId, imgDoc._rev, file)
  return await couch.get(import.meta.env.VITE_DB_IMAGES, imgDocId)
}

function confirmarEliminar(idx) {
  idxAEliminar.value = idx
  confirmaEliminar.value = true
}

async function guardarProducto() {
  const isEditing = editando.value !== null
  const existingItem = isEditing && negocio.value?.catalogo?.[editando.value]
    ? negocio.value.catalogo[editando.value]
    : null

  const baseImages = existingItem
    ? (existingItem.imagenes?.length ? [...existingItem.imagenes] : existingItem.imagen ? [existingItem.imagen] : [])
    : []

  let workingImages = [...baseImages]
  const nuevoItem = {
    nombre: prod.nombre,
    descripcion: prod.descripcion,
    precio: prod.precio,
    tipo: prod.tipo,
    catalogKey: existingItem?.catalogKey || prod.catalogKey || '',
    imagenes: [],
    imagen: ''
  }

  const hasImageChanges =
    prod.files.length > 0 ||
    pendingDeleteImages.value.length > 0 ||
    Object.keys(pendingReplacementFiles).length > 0

  if (hasImageChanges) {
    try {
      const imgDocId = 'neg_' + negocio.value._id
      let imgDoc = await syncImageDoc()

      const deleteIndexes = [...pendingDeleteImages.value].sort((a, b) => b - a)
      for (const deleteIdx of deleteIndexes) {
        const attachmentName = workingImages[deleteIdx]
        if (!attachmentName) continue
        try {
          imgDoc = await couch.deleteAttachment(imgDocId, imgDoc._rev, attachmentName)
          workingImages.splice(deleteIdx, 1)
        } catch (err) {
          console.error('Error al eliminar imagen:', attachmentName, err)
        }
      }

      const replacementIndexes = Object.keys(pendingReplacementFiles)
        .map(Number)
        .sort((a, b) => a - b)

      for (const replaceIdx of replacementIndexes) {
        const newFile = pendingReplacementFiles[replaceIdx]
        const oldName = workingImages[replaceIdx]
        if (!newFile || !oldName) continue

        try {
          imgDoc = await couch.deleteAttachment(imgDocId, imgDoc._rev, oldName)
          imgDoc = await uploadSingleImage(imgDocId, imgDoc, newFile)
          workingImages[replaceIdx] = newFile.name
        } catch (err) {
          console.error('Error al reemplazar imagen:', oldName, err)
        }
      }

      for (const file of prod.files) {
        try {
          imgDoc = await uploadSingleImage(imgDocId, imgDoc, file)
          workingImages.push(file.name)
        } catch (err) {
          console.error('Error al subir imagen:', file.name, err)
        }
      }

      nuevoItem.imagenes = workingImages
      nuevoItem.imagen = workingImages[0] || ''
    } catch (err) {
      console.error('Error en proceso de imágenes:', err)
    }
  } else if (existingItem) {
    nuevoItem.imagenes = baseImages
    nuevoItem.imagen = baseImages[0] || ''
  }

  if (isEditing) {
    await negocioAPI.updateProducto(
      negocio.value._id,
      negocio.value._rev,
      editando.value,
      nuevoItem
    )
  } else {
    await negocioAPI.addProducto(
      negocio.value._id,
      negocio.value._rev,
      nuevoItem
    )
  }

  negocio.value = await negocioAPI.getMiNegocio(auth.user._id)
  dialogo.value = false
  resetDialog()
}

async function eliminarItem() {
  await negocioAPI.deleteProducto(
    negocio.value._id,
    negocio.value._rev,
    idxAEliminar.value
  )
  negocio.value = await negocioAPI.getMiNegocio(auth.user._id)
  confirmaEliminar.value = false
}
</script>

<style scoped lang="scss">
.catalogs-container {
  background: #f7f8fa;
  padding: 1.5rem;
  border-radius: 16px;
}

.body--dark .catalogs-container {
  background: #1d1d1d;
}

.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.body--dark .header {
  color: #ffffff;
}

.body--dark .header :deep(.q-btn) {
  color: #ffffff;
}

.body--dark .header :deep(.q-btn--outline) {
  border-color: rgba(255, 255, 255, 0.35);
}

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.8rem;
}

/* Horizontal sliding track for catalog (alternative layout) */
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
  flex: 0 0 260px; /* fixed item width, adjust as needed */
  scroll-snap-align: start;
}

.catalog-slide-item .catalog-card {
  height: 100%;
}

@media (max-width: 600px) {
  .catalog-slide-item { flex: 0 0 200px; }
}

.catalog-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #eee;
  transition: 0.25s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.08);
  }
}

.body--dark .catalog-card {
  background: #1d1d1d;
  border-color: #2c2c2c;
}

.image-wrapper {
  padding: 4px;
  width: 100%;
  overflow: hidden;
  background: #f5f5f5;
  min-height: 108px;
  border-radius: 18px;
}

.body--dark .image-wrapper {
  background: #1d1d1d;
}

.image {
  border-radius: 12px;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.content {
  padding: 0 10px 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
}

.title {
  display: flex;
  gap: 6px;
  font-weight: 600;
}

.date {
  margin-top: 8px;
  font-size: 13px;
  color: #777;
}

.desc {
  margin-top: 6px;
  font-size: 13px;
  color: #555;
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
}

.empty-state {
  text-align: center;
  padding: 2rem;
}

.carousel {
  border-radius: 18px;
  overflow: hidden;
  height: 100%;
  background: #f5f5f5;
  :deep(.q-carousel__slide) {
    padding: 0;
  }
}

.body--dark .carousel {
  background: #1d1d1d;
}

.edit-carousel {
  border-radius: 18px;
  overflow: hidden;
  background: #f5f5f5;
}

.body--dark .edit-carousel {
  background: #1d1d1d;
}

.carousel-slide {
  padding: 0;
}

.image-editor-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.image-editor-note {
  margin-top: 0.5rem;
  font-size: 12px;
  color: #666;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f0f0f0;
  border-radius: 6px;
  font-size: 12px;

  span {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.block {
  display: block;
}
</style>