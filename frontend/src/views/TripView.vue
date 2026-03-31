<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { tripsApi, type Trip } from '../lib/api'
import { useTripsStore } from '../stores/trips'

const route = useRoute()
const router = useRouter()
const store = useTripsStore()

const trip = ref<Trip | null>(null)
const editingName = ref(false)
const nameInput = ref('')
const saving = ref(false)
const deleting = ref(false)

onMounted(async () => {
  trip.value = await tripsApi.getById(route.params.id as string)
  nameInput.value = trip.value.name
})

async function saveName() {
  if (!trip.value || !nameInput.value.trim()) return
  await tripsApi.update(trip.value.id, { name: nameInput.value.trim() })
  trip.value.name = nameInput.value.trim()
  editingName.value = false
}

async function setDate(date: string | null) {
  if (!trip.value) return
  saving.value = true
  await tripsApi.update(trip.value.id, { date })
  trip.value.date = date
  saving.value = false
}

async function duplicate() {
  if (!trip.value) return
  await store.duplicate(trip.value.id)
  router.push('/')
}

async function deleteTrip() {
  if (!trip.value) return
  if (!confirm(`Smazat výlet "${trip.value.name}"?`)) return
  deleting.value = true
  await store.remove(trip.value.id)
  router.push('/')
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <div v-if="!trip" class="loading">Načítám…</div>

  <div v-else class="page">
    <header class="top-bar">
      <button class="back" @click="router.push('/')">← Zpět</button>
      <div class="trip-title">
        <template v-if="editingName">
          <input
            v-model="nameInput"
            class="name-input"
            @keyup.enter="saveName"
            @keyup.escape="editingName = false"
            autofocus
          />
          <button class="btn-small" @click="saveName">Uložit</button>
          <button class="btn-small muted" @click="editingName = false">Zrušit</button>
        </template>
        <template v-else>
          <h1 class="trip-name">{{ trip.name }}</h1>
          <button class="btn-small muted" @click="editingName = true">Přejmenovat</button>
        </template>
      </div>
      <div class="header-actions">
        <button class="btn-small" @click="duplicate">Kopírovat výlet</button>
        <button class="btn-small danger" :disabled="deleting" @click="deleteTrip">Smazat</button>
      </div>
    </header>

    <div class="content">
      <div class="meta-card">
        <div class="meta-row">
          <span class="meta-label">Datum výletu</span>
          <div class="meta-value">
            <input
              type="date"
              :value="trip.date ?? ''"
              class="date-input"
              @change="setDate(($event.target as HTMLInputElement).value || null)"
            />
            <span v-if="trip.date" class="date-text">{{ formatDate(trip.date) }}</span>
            <span v-else class="muted">plánovaný</span>
          </div>
        </div>
        <div class="meta-row" v-if="trip.total_distance_km">
          <span class="meta-label">Celkem</span>
          <span class="meta-value">{{ trip.total_distance_km }} km</span>
        </div>
        <div class="meta-row" v-if="trip.total_duration_min">
          <span class="meta-label">Odhadovaný čas</span>
          <span class="meta-value">{{ Math.floor(trip.total_duration_min / 60) }}h {{ trip.total_duration_min % 60 }}min</span>
        </div>
        <div class="meta-row" v-if="trip.description">
          <span class="meta-label">Popis</span>
          <span class="meta-value">{{ trip.description }}</span>
        </div>
      </div>

      <h2 class="section-title">Trasa ({{ trip.waypoints.length }} míst)</h2>

      <ol class="waypoint-list">
        <li v-for="(wp, i) in trip.waypoints.sort((a, b) => a.order - b.order)" :key="wp.id" class="waypoint-item">
          <div class="wp-order">{{ i + 1 }}</div>
          <div class="wp-info">
            <span class="wp-name">{{ wp.name }}</span>
            <span v-if="wp.notes" class="wp-notes">{{ wp.notes }}</span>
          </div>
          <span v-if="wp.distance_to_next_km && i < trip.waypoints.length - 1" class="wp-dist">
            {{ wp.distance_to_next_km }} km →
          </span>
        </li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.loading {
  text-align: center;
  padding: 64px;
  color: var(--color-text-muted);
}

.page {
  max-width: 700px;
  margin: 0 auto;
  padding: 24px 16px;
}

.top-bar {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.back {
  color: var(--color-text-muted);
  font-size: 13px;
  padding-top: 4px;
}
.back:hover { color: var(--color-text); }

.trip-title {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.trip-name {
  font-size: 20px;
  font-weight: 700;
}

.name-input {
  font-size: 18px;
  font-weight: 600;
  border: none;
  border-bottom: 2px solid var(--color-primary);
  outline: none;
  background: transparent;
  padding-bottom: 2px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.btn-small {
  font-size: 13px;
  padding: 5px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}
.btn-small:hover { background: var(--color-bg); }
.btn-small.muted { color: var(--color-text-muted); }
.btn-small.danger { color: var(--color-danger); border-color: var(--color-danger); }
.btn-small.danger:hover { background: #fdf2f2; }
.btn-small:disabled { opacity: 0.5; cursor: default; }

.content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.meta-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta-label {
  font-size: 13px;
  color: var(--color-text-muted);
  width: 140px;
  flex-shrink: 0;
}

.meta-value {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}

.date-input {
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 4px 8px;
  font-size: 13px;
  outline: none;
  cursor: pointer;
}
.date-input:focus { border-color: var(--color-primary); }

.date-text {
  font-size: 14px;
  color: var(--color-text);
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-muted);
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
  gap: 10px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 10px 14px;
}

.wp-order {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.wp-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.wp-name { font-size: 14px; }

.wp-notes {
  font-size: 12px;
  color: var(--color-text-muted);
}

.wp-dist {
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.muted { color: var(--color-text-muted); }
</style>
