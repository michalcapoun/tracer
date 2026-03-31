<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import MapPicker from '../components/MapPicker.vue'
import { tripsApi, routeApi, type Waypoint } from '../lib/api'

const router = useRouter()

const tripName = ref('Nový výlet')
const waypoints = ref<Omit<Waypoint, 'id' | 'trip_id'>[]>([])
const saving = ref(false)
const optimizing = ref(false)

function addWaypoint(wp: Omit<Waypoint, 'id' | 'trip_id' | 'order'>) {
  waypoints.value.push({ ...wp, order: waypoints.value.length + 1 })
}

function removeWaypoint(index: number) {
  waypoints.value.splice(index, 1)
  waypoints.value.forEach((w, i) => { w.order = i + 1 })
}

function moveUp(index: number) {
  if (index === 0) return
  const arr = waypoints.value
  ;[arr[index - 1], arr[index]] = [arr[index], arr[index - 1]]
  arr.forEach((w, i) => { w.order = i + 1 })
}

function moveDown(index: number) {
  const arr = waypoints.value
  if (index === arr.length - 1) return
  ;[arr[index], arr[index + 1]] = [arr[index + 1], arr[index]]
  arr.forEach((w, i) => { w.order = i + 1 })
}

async function optimizeRoute() {
  if (waypoints.value.length < 2) return
  optimizing.value = true
  try {
    const result = await routeApi.optimize(waypoints.value.map((w) => ({ lat: w.lat, lng: w.lng, name: w.name })))
    // Extract distances from mapy.com response and update waypoints
    const legs = result?.geometry?.features ?? []
    let total = 0
    waypoints.value.forEach((w, i) => {
      const leg = legs[i]
      const dist = leg?.properties?.distance ? +(leg.properties.distance / 1000).toFixed(2) : null
      w.distance_to_next_km = dist
      if (dist) total += dist
    })
  } finally {
    optimizing.value = false
  }
}

async function save(date?: string) {
  if (!tripName.value.trim() || waypoints.value.length === 0) return
  saving.value = true
  try {
    const totalDist = waypoints.value.reduce((s, w) => s + (w.distance_to_next_km ?? 0), 0)
    const trip = await tripsApi.create({
      name: tripName.value.trim(),
      date: date ?? null,
      total_distance_km: totalDist > 0 ? +totalDist.toFixed(2) : null,
      waypoints: waypoints.value,
    })
    router.push(`/trip/${trip.id}`)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <button class="back" @click="router.push('/')">← Zpět</button>
        <input v-model="tripName" class="trip-name-input" type="text" />
      </div>

      <div class="waypoints">
        <p v-if="waypoints.length === 0" class="hint">Klikni na mapu nebo vyhledej místo…</p>

        <ul v-else class="waypoint-list">
          <li v-for="(wp, i) in waypoints" :key="i" class="waypoint-item">
            <div class="wp-order">{{ i + 1 }}</div>
            <div class="wp-info">
              <span class="wp-name">{{ wp.name }}</span>
              <span v-if="wp.distance_to_next_km && i < waypoints.length - 1" class="wp-dist">
                → {{ wp.distance_to_next_km }} km
              </span>
            </div>
            <div class="wp-actions">
              <button @click="moveUp(i)" :disabled="i === 0" title="Nahoru">↑</button>
              <button @click="moveDown(i)" :disabled="i === waypoints.length - 1" title="Dolů">↓</button>
              <button @click="removeWaypoint(i)" class="remove" title="Odebrat">✕</button>
            </div>
          </li>
        </ul>
      </div>

      <div class="sidebar-footer">
        <button
          v-if="waypoints.length >= 2"
          class="btn-secondary"
          :disabled="optimizing"
          @click="optimizeRoute"
        >
          {{ optimizing ? 'Počítám…' : 'Spočítat trasu' }}
        </button>
        <button
          class="btn-primary"
          :disabled="saving || waypoints.length === 0"
          @click="save()"
        >
          {{ saving ? 'Ukládám…' : 'Uložit jako plánovaný' }}
        </button>
      </div>
    </aside>

    <main class="map-area">
      <MapPicker :waypoints="waypoints" @add="addWaypoint" />
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 320px;
  flex-shrink: 0;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.back {
  color: var(--color-text-muted);
  font-size: 13px;
  text-align: left;
}
.back:hover { color: var(--color-text); }

.trip-name-input {
  font-size: 17px;
  font-weight: 600;
  border: none;
  outline: none;
  width: 100%;
  border-bottom: 2px solid var(--color-primary);
  padding-bottom: 4px;
  background: transparent;
}

.waypoints {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}

.hint {
  color: var(--color-text-muted);
  font-size: 13px;
  text-align: center;
  margin-top: 24px;
}

.waypoint-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.waypoint-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 13px;
}

.wp-order {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.wp-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.wp-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wp-dist {
  font-size: 11px;
  color: var(--color-text-muted);
}

.wp-actions {
  display: flex;
  gap: 2px;
}

.wp-actions button {
  padding: 2px 5px;
  font-size: 12px;
  color: var(--color-text-muted);
  border-radius: 4px;
}
.wp-actions button:hover:not(:disabled) { background: var(--color-bg); color: var(--color-text); }
.wp-actions button:disabled { opacity: 0.3; cursor: default; }
.wp-actions .remove:hover:not(:disabled) { color: var(--color-danger); }

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-primary {
  background: var(--color-primary);
  color: #fff;
  padding: 10px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}
.btn-primary:hover:not(:disabled) { background: var(--color-primary-hover); }
.btn-primary:disabled { opacity: 0.5; cursor: default; }

.btn-secondary {
  border: 1px solid var(--color-border);
  padding: 9px;
  border-radius: var(--radius);
  font-size: 14px;
  text-align: center;
}
.btn-secondary:hover:not(:disabled) { background: var(--color-bg); }
.btn-secondary:disabled { opacity: 0.5; cursor: default; }

.map-area {
  flex: 1;
  position: relative;
}
</style>
