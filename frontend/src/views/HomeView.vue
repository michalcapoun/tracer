<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTripsStore } from '../stores/trips'
import type { Trip } from '../lib/api'

type Tab = 'planned' | 'history'
type SortKey = 'date' | 'name' | 'distance'

const router = useRouter()
const store = useTripsStore()

const tab = ref<Tab>('planned')
const search = ref('')
const sortKey = ref<SortKey>('date')

onMounted(() => store.fetchAll())

const filtered = computed(() => {
  const isPlanned = tab.value === 'planned'
  return store.trips
    .filter((t: Trip) => {
      const matchesTab = isPlanned ? !t.date : !!t.date
      const q = search.value.trim().toLowerCase()
      const matchesSearch = !q || t.name.toLowerCase().includes(q)
      return matchesTab && matchesSearch
    })
    .sort((a: Trip, b: Trip) => {
      if (sortKey.value === 'name') return a.name.localeCompare(b.name, 'cs')
      if (sortKey.value === 'distance') return (b.total_distance_km ?? 0) - (a.total_distance_km ?? 0)
      if (!a.date && !b.date) return 0
      if (!a.date) return 1
      if (!b.date) return -1
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
})

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <div class="page">
    <header class="top-bar">
      <h1 class="logo">Tracer</h1>
      <button class="btn-primary" @click="router.push('/trip/new')">+ Nový výlet</button>
    </header>

    <div class="controls">
      <div class="tabs">
        <button :class="['tab', { active: tab === 'planned' }]" @click="tab = 'planned'">Plánované</button>
        <button :class="['tab', { active: tab === 'history' }]" @click="tab = 'history'">Historie</button>
      </div>
      <div class="filters">
        <input v-model="search" class="search" type="search" placeholder="Hledat výlet…" />
        <select v-model="sortKey" class="sort">
          <option value="date">Datum</option>
          <option value="name">Název</option>
          <option value="distance">Vzdálenost</option>
        </select>
      </div>
    </div>

    <div v-if="store.loading" class="empty">Načítám…</div>

    <div v-else-if="filtered.length === 0" class="empty">
      {{ tab === 'planned' ? 'Žádné plánované výlety.' : 'Žádná historie výletů.' }}
    </div>

    <ul v-else class="trip-list">
      <li v-for="trip in filtered" :key="trip.id" class="trip-card" @click="router.push(`/trip/${trip.id}`)">
        <div class="trip-info">
          <span class="trip-name">{{ trip.name }}</span>
          <span v-if="trip.date" class="trip-date">{{ formatDate(trip.date) }}</span>
          <span v-else class="trip-date muted">bez data</span>
        </div>
        <div class="trip-meta">
          <span v-if="trip.total_distance_km" class="badge">{{ trip.total_distance_km.toFixed(1) }} km</span>
          <span class="waypoint-count muted">{{ trip.waypoints?.length ?? 0 }} míst</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.page {
  max-width: 700px;
  margin: 0 auto;
  padding: 24px 16px;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.logo {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--color-primary);
}

.btn-primary {
  background: var(--color-primary);
  color: #fff;
  padding: 8px 16px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 500;
}
.btn-primary:hover { background: var(--color-primary-hover); }

.controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.tabs {
  display: flex;
  gap: 4px;
  background: var(--color-border);
  border-radius: var(--radius);
  padding: 3px;
  width: fit-content;
}

.tab {
  padding: 6px 18px;
  border-radius: calc(var(--radius) - 2px);
  font-size: 14px;
  color: var(--color-text-muted);
  transition: all 0.15s;
}
.tab.active {
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 500;
  box-shadow: var(--shadow);
}

.filters {
  display: flex;
  gap: 8px;
}

.search {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  outline: none;
}
.search:focus { border-color: var(--color-primary); }

.sort {
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  outline: none;
  cursor: pointer;
}

.empty {
  text-align: center;
  color: var(--color-text-muted);
  padding: 48px 0;
}

.trip-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.trip-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 14px 16px;
  cursor: pointer;
  transition: box-shadow 0.15s;
}
.trip-card:hover { box-shadow: var(--shadow); }

.trip-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.trip-name { font-weight: 500; }

.trip-date {
  font-size: 13px;
  color: var(--color-text-muted);
}

.trip-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.badge {
  background: #e8f5e9;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 20px;
}

.waypoint-count { font-size: 13px; }
.muted { color: var(--color-text-muted); }
</style>
