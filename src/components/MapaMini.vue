<template>
  <div style="height: 200px">
    <l-map :zoom="14" :center="[lat, lng]" :use-global-leaflet="false">
      <l-tile-layer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <l-marker :lat-lng="[lat, lng]" />
    </l-map>
  </div>
</template>
<script setup>
import { LMap, LTileLayer, LMarker } from '@vue-leaflet/vue-leaflet'
defineProps({ lat: Number, lng: Number })
</script>
