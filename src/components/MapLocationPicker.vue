<template>
  <div class="map-picker">
    <div ref="mapContainer" class="map-container" :style="{ height }"></div>
    <div class="q-mt-sm row justify-between items-center">
      <div class="text-caption" v-if="latitude !== null && longitude !== null">
        📍 {{ latitude.toFixed(6) }}, {{ longitude.toFixed(6) }}
      </div>
      <q-btn flat dense icon="my_location" label="Mi ubicación" @click="locateMe" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  height: { type: String, default: '300px' },
})

const emit = defineEmits(['update:location'])

const mapContainer = ref(null)
let map = null
let marker = null

const defaultLat = 13.7942
const defaultLng = -88.8965 // Centro de El Salvador

const initMap = () => {
  if (!mapContainer.value) return
  const centerLat = props.latitude ?? defaultLat
  const centerLng = props.longitude ?? defaultLng

  map = L.map(mapContainer.value).setView([centerLat, centerLng], 13)

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
  }).addTo(map)

  if (props.latitude && props.longitude) {
    marker = L.marker([props.latitude, props.longitude], { draggable: true }).addTo(map)
    marker.on('dragend', onMarkerDrag)
  }

  map.on('click', onMapClick)
}

const onMapClick = (e) => {
  const { lat, lng } = e.latlng
  updateMarker(lat, lng)
}

const onMarkerDrag = (e) => {
  const { lat, lng } = e.target.getLatLng()
  updateMarker(lat, lng)
}

const updateMarker = (lat, lng) => {
  if (marker) {
    marker.setLatLng([lat, lng])
  } else {
    marker = L.marker([lat, lng], { draggable: true }).addTo(map)
    marker.on('dragend', onMarkerDrag)
  }
  emit('update:location', { lat, lng })
}

const locateMe = () => {
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords
      map.setView([latitude, longitude], 15)
      updateMarker(latitude, longitude)
    },
    (err) => {
      console.warn('Geolocation error:', err)
    },
  )
}

onMounted(() => {
  initMap()
})

watch(
  () => [props.latitude, props.longitude],
  ([newLat, newLng]) => {
    if (newLat && newLng && map) {
      if (!marker) {
        marker = L.marker([newLat, newLng], { draggable: true }).addTo(map)
        marker.on('dragend', onMarkerDrag)
      } else {
        marker.setLatLng([newLat, newLng])
      }
      map.setView([newLat, newLng], map.getZoom())
    }
  },
)
</script>

<style scoped>
.map-container {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #ccc;
}
</style>
