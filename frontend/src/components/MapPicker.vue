<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import type { Waypoint } from '../lib/api'

const props = defineProps<{ waypoints: Waypoint[] }>()
const emit = defineEmits<{ add: [wp: Omit<Waypoint, 'id' | 'trip_id' | 'order'>] }>()

const mapEl = ref<HTMLElement | null>(null)
const apiKey = import.meta.env.VITE_MAPY_API_KEY as string

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let map: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const markers: any[] = []

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Loader: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SMap: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    JAK: any
  }
}

onMounted(async () => {
  await new Promise<void>((resolve) => {
    window.Loader.async = true
    window.Loader.load(apiKey, { suggest: true }, resolve)
  })

  const SMap = window.SMap
  const JAK = window.JAK

  // Center on Czech Republic
  const center = SMap.Coords.fromWGS84(15.3, 49.8)
  map = new SMap(mapEl.value, center, 7)
  map.addDefaultLayer(SMap.DEF_TURIST).enable()
  map.addDefaultControls()

  // Suggest (search bar)
  const suggest = new SMap.Suggest(document.getElementById('map-search') as HTMLInputElement, {
    provider: new SMap.SuggestProvider({ apiKey }),
  })
  suggest.addListener('suggest', (e: { data: { longitude: number; latitude: number; title: string; id?: string } }) => {
    const { longitude, latitude, title, id } = e.data
    const coords = SMap.Coords.fromWGS84(longitude, latitude)
    map.setCenter(coords, true)
    map.setZoom(15)
    emit('add', { name: title, lat: latitude, lng: longitude, mapy_place_id: id ?? null })
    addMarker(longitude, latitude, title)
  })

  // Click on map to add waypoint
  const signals = map.getSignals()
  signals.addListener(window, 'map-click', (e: { data: { coords: { x: number; y: number } } }) => {
    const coords = e.data.coords
    const wgs = SMap.Coords.fromWGS84(coords.x, coords.y).toWGS84()
    const lat = wgs[1]
    const lng = wgs[0]
    const name = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    emit('add', { name, lat, lng, mapy_place_id: null })
    addMarker(lng, lat, name)
  })

  // Render existing waypoints
  props.waypoints.forEach((w) => addMarker(w.lng, w.lat, w.name))

  function addMarker(lng: number, lat: number, title: string) {
    const coords = SMap.Coords.fromWGS84(lng, lat)
    const marker = new SMap.Marker(coords, null, { title })
    const layer = new SMap.Layer.Marker()
    map.addLayer(layer)
    layer.enable()
    layer.addMarker(marker)
    markers.push({ marker, layer })
  }
})

onUnmounted(() => {
  markers.forEach(({ layer }) => map?.removeLayer(layer))
})
</script>

<template>
  <div class="map-wrapper">
    <input
      id="map-search"
      class="map-search"
      type="text"
      placeholder="Hledat místo na mapě…"
      autocomplete="off"
    />
    <div ref="mapEl" class="map-canvas" />
  </div>
</template>

<style scoped>
.map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.map-search {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  width: min(360px, calc(100% - 32px));
  padding: 10px 14px;
  border: none;
  border-radius: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.18);
  font-size: 14px;
  outline: none;
}

.map-canvas {
  width: 100%;
  height: 100%;
}
</style>
