<template>
  <div style="height: 400px">
    <l-map :zoom="8" :center="[13.7, -89.2]" :use-global-leaflet="false">
      <l-tile-layer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"></l-tile-layer>
      <l-marker v-for="item in markers" :key="item.id" :lat-lng="[item.lat, item.lng]">
        <l-popup>
          <div>
            <strong>{{ item.titulo }}</strong><br>
            {{ item.departamento }}
          </div>
        </l-popup>
      </l-marker>
    </l-map>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { LMap, LTileLayer, LMarker, LPopup } from '@vue-leaflet/vue-leaflet'

const props = defineProps({ eventos: Array, sitios: Array })
const markers = computed(() => {
  const marcadores = []
  props.eventos?.forEach(ev => {
    if (ev.localizacion?.lat && ev.localizacion?.lng) {
      marcadores.push({ id: ev._id, lat: ev.localizacion.lat, lng: ev.localizacion.lng, titulo: ev.titulo, departamento: ev.departamento })
    }
  })
  props.sitios?.forEach(st => {
    if (st.localizacion?.lat && st.localizacion?.lng) {
      marcadores.push({ id: st._id, lat: st.localizacion.lat, lng: st.localizacion.lng, titulo: st.nombre, departamento: st.departamento })
    }
  })
  return marcadores
})
</script>
