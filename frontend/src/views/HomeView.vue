<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTripsStore } from '../stores/trips'
import { supabase } from '../lib/supabase'
import type { Trip } from '../lib/api'

type Tab = 'planned' | 'history' | 'trash'
const router = useRouter()
const route = useRoute()
const store = useTripsStore()

const tab = ref<Tab>('planned')
const search = ref('')
const toast = ref<{ message: string; type: 'success' | 'danger' } | null>(null)
const userEmail = ref('')
const DEMO_EMAIL = 'tracer@demo.cz'
const DEMO_TRIP_LIMIT = 50

const isDemo = computed(() => userEmail.value === DEMO_EMAIL)
const demoLimitReached = computed(() => isDemo.value && store.trips.length >= DEMO_TRIP_LIMIT)
let toastTimer: ReturnType<typeof setTimeout>

function showToast(message: string, type: 'success' | 'danger') {
  clearTimeout(toastTimer)
  toast.value = { message, type }
  toastTimer = setTimeout(() => { toast.value = null }, 3000)
}

onMounted(async () => {
  const { data } = await supabase.auth.getUser()
  userEmail.value = data.user?.email ?? ''

  if (route.query.tab === 'history') tab.value = 'history'
  if (route.query.tab === 'trash') tab.value = 'trash'
  if (route.query.created === '1') {
    showToast('Výlet byl uložen.', 'success')
    router.replace({ query: { tab: route.query.tab } })
  }
  if (route.query.deleted === '1') {
    showToast('Výlet byl smazán.', 'danger')
    router.replace({ query: { tab: route.query.tab } })
  }
  store.fetchAll()
  store.fetchTrash()
})

const filtered = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  const isPlanned = tab.value === 'planned'
  return store.trips
    .filter((t: Trip) => {
      const matchesTab = isPlanned ? (!t.date || t.date > today) : (!!t.date && t.date <= today)
      const q = search.value.trim().toLowerCase()
      const matchesSearch = !q || t.name.toLowerCase().includes(q)
      return matchesTab && matchesSearch
    })
    .sort((a: Trip, b: Trip) => {
      if (!a.date && !b.date) return a.name.localeCompare(b.name, 'cs')
      if (!a.date) return 1
      if (!b.date) return -1
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
      return dateDiff !== 0 ? dateDiff : a.name.localeCompare(b.name, 'cs')
    })
})

const groupedByYear = computed(() => {
  if (tab.value !== 'history') return []
  const groups: { year: number; trips: Trip[] }[] = []
  for (const trip of filtered.value) {
    const year = new Date(trip.date!).getFullYear()
    const group = groups.find((g) => g.year === year)
    if (group) group.trips.push(trip)
    else groups.push({ year, trips: [trip] })
  }
  return groups
})

async function removeTrip(trip: Trip) {
  await store.remove(trip.id)
  showToast('Výlet byl smazán.', 'danger')
}

async function restoreTrip(trip: Trip) {
  await store.restore(trip.id)
  showToast('Výlet byl obnoven.', 'success')
}

async function permanentDeleteTrip(trip: Trip) {
  await store.permanentDelete(trip.id)
  showToast('Výlet byl trvale smazán.', 'danger')
}

function daysLeft(deletedAt: string): number {
  const diff = 30 * 24 * 60 * 60 * 1000 - (Date.now() - new Date(deletedAt).getTime())
  return Math.max(1, Math.ceil(diff / (24 * 60 * 60 * 1000)))
}

async function duplicateTrip(trip: Trip) {
  await store.duplicate(trip.id)
}

function openInMapy(trip: Trip) {
  window.open(trip.mapy_link!, '_blank')
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
}

async function signOut() {
  await supabase.auth.signOut()
  router.push('/login')
}
</script>

<template>
  <div class="page">
    <header class="top-bar">
      <h1 class="logo">TRACER</h1>
      <div class="top-actions">
        <span v-if="userEmail" class="user-email">{{ userEmail }}</span>
        <button class="btn-primary" :disabled="demoLimitReached" :data-tooltip="demoLimitReached ? `Demo účet: limit ${DEMO_TRIP_LIMIT} výletů` : undefined" @click="!demoLimitReached && router.push('/trip/new')">+ Nový výlet</button>
        <button class="btn-signout" @click="signOut">Odhlásit</button>
      </div>
    </header>

    <div class="controls">
      <div class="controls-top">
        <div class="tabs">
          <button :class="['tab', { active: tab === 'planned' }]" @click="tab = 'planned'; search = ''">Plánované</button>
          <button :class="['tab', { active: tab === 'history' }]" @click="tab = 'history'; search = ''">Historie</button>
          <button :class="['tab', { active: tab === 'trash' }]" @click="tab = 'trash'; search = ''; store.fetchTrash()">Smazané</button>
        </div>
      </div>
      <div class="filters">
        <div class="search-wrap">
          <input v-model="search" class="search" type="text" placeholder="Hledat výlet…" />
          <button v-if="search" class="search-clear" @click="search = ''">Smazat</button>
        </div>
      </div>
    </div>

    <div v-if="store.loading" class="empty">Načítám…</div>

    <!-- Smazané -->
    <template v-else-if="tab === 'trash'">
      <div v-if="store.trash.length === 0" class="empty">Koš je prázdný.</div>
      <ul v-else class="trip-list">
        <li v-for="trip in store.trash" :key="trip.id" class="trip-card trash-card">
          <div class="trip-info">
            <div class="trip-text">
              <span class="trip-name">{{ trip.name }}</span>
              <span class="trip-date">Smaže se za {{ daysLeft(trip.deleted_at!) }} dní</span>
            </div>
          </div>
          <div class="card-actions trash-actions">
            <button class="card-btn" data-tooltip="Obnovit" @click="restoreTrip(trip)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </button>
            <button class="card-btn danger" data-tooltip="Trvale smazat" @click="permanentDeleteTrip(trip)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        </li>
      </ul>
    </template>

    <div v-else-if="filtered.length === 0" class="empty">
      {{ search.trim() ? 'Žádný výlet neodpovídá vyhledávání.' : tab === 'planned' ? 'Žádné plánované výlety.' : 'Žádná historie výletů.' }}
    </div>

    <!-- Plánované: flat list -->
    <ul v-else-if="tab === 'planned'" class="trip-list">
      <li v-for="trip in filtered" :key="trip.id" class="trip-card" @click="router.push(`/trip/${trip.id}`)">
        <div class="trip-info">
          <div class="trip-text">
            <span class="trip-name">{{ trip.name }}</span>
            <span v-if="trip.date" class="trip-date">{{ formatDate(trip.date) }}</span>
          </div>
          <span v-if="trip.total_distance_km" class="badge">{{ trip.total_distance_km.toFixed(1) }} km</span>
        </div>
        <div class="card-actions" @click.stop>
          <button v-if="trip.mapy_link" class="card-btn" data-tooltip="Přeplánovat" @click="openInMapy(trip)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </button>
          <button class="card-btn" :disabled="demoLimitReached" data-tooltip="Kopírovat" @click="duplicateTrip(trip)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <button class="card-btn danger" data-tooltip="Smazat" @click="removeTrip(trip)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </li>
    </ul>

    <!-- Historie: skupiny po letech -->
    <div v-else class="year-groups">
      <div v-for="group in groupedByYear" :key="group.year" class="year-group">
        <div class="year-label">{{ group.year }}</div>
        <ul class="trip-list">
          <li v-for="trip in group.trips" :key="trip.id" class="trip-card" @click="router.push(`/trip/${trip.id}`)">
            <div class="trip-info">
              <div class="trip-text">
                <span class="trip-name">{{ trip.name }}</span>
                <span class="trip-date">{{ formatDate(trip.date!) }}</span>
              </div>
              <span v-if="trip.total_distance_km" class="badge">{{ trip.total_distance_km.toFixed(1) }} km</span>
            </div>
            <div class="card-actions" @click.stop>
              <button v-if="trip.mapy_link" class="card-btn" data-tooltip="Přeplánovat" @click="openInMapy(trip)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </button>
              <button class="card-btn" :disabled="demoLimitReached" data-tooltip="Kopírovat" @click="duplicateTrip(trip)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
              <button class="card-btn danger" data-tooltip="Smazat" @click="removeTrip(trip)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>

  <Transition name="toast">
    <div v-if="toast" :class="['toast', toast.type]">{{ toast.message }}</div>
  </Transition>
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

.top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-email {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-right: 4px;
}

.btn-signout {
  font-size: 13px;
  color: var(--color-text-muted);
  padding: 8px 12px;
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
}
.btn-signout:hover { background: var(--color-bg); color: var(--color-text); }

.btn-primary {
  background: var(--color-primary);
  color: #fff;
  padding: 8px 16px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 500;
}
.btn-primary:hover { background: var(--color-primary-hover); }
.btn-primary:disabled { opacity: 0.45; cursor: not-allowed; background: var(--color-primary); }

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

.search-wrap {
  position: relative;
  flex: 1;
}

.search {
  width: 100%;
  padding: 8px 64px 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  outline: none;
}
.search:focus { border-color: var(--color-primary); }

.search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  font-size: 16px;
  line-height: 1;
  padding: 2px 4px;
}
.search-clear:hover { color: var(--color-text); }

.controls-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 20px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  z-index: 100;
}
.toast.success { background: #1a7f3c; color: #fff; }
.toast.danger  { background: #c0392b; color: #fff; }

.toast-enter-active, .toast-leave-active { transition: opacity 0.2s, transform 0.2s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(8px); }

.empty {
  text-align: center;
  color: var(--color-text-muted);
  padding: 48px 0;
}

.year-groups {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.year-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.year-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  letter-spacing: 0.8px;
  text-transform: uppercase;
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
  padding: 12px 16px;
  cursor: pointer;
  transition: box-shadow 0.15s;
}
.trip-card:hover { box-shadow: var(--shadow); }

.trip-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.trip-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  flex-shrink: 1;
}

.trip-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trip-date {
  font-size: 13px;
  color: var(--color-text-muted);
}

.card-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.1s;
  flex-shrink: 0;
  min-width: 92px;
  justify-content: flex-end;
}
.trip-card:hover .card-actions { opacity: 1; }
.trash-actions { opacity: 1; }
.trash-card { cursor: default; }
.trash-card:hover { box-shadow: none; }

.card-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  border-radius: 6px;
  border: 1px solid transparent;
  flex-shrink: 0;
}
.card-btn:hover { background: var(--color-bg); color: var(--color-text); border-color: var(--color-border); }
.card-btn.danger:hover { color: var(--color-danger); border-color: var(--color-danger); background: #fdf2f2; }

.card-btn[data-tooltip] { position: relative; }
.card-btn[data-tooltip]:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: #1a1a1a;
  color: #fff;
  font-size: 11px;
  white-space: nowrap;
  padding: 3px 7px;
  border-radius: 4px;
  pointer-events: none;
  z-index: 10;
}

.badge {
  background: #e8f5e9;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 20px;
}

</style>
