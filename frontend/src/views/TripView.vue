<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { tripsApi, type Trip } from '../lib/api'
import { useTripsStore } from '../stores/trips'

const route = useRoute()
const router = useRouter()
const store = useTripsStore()

const trip = ref<Trip | null>(null)
const notFound = ref(false)
const saving = ref(false)
const deleting = ref(false)
const nameError = ref('')
const distanceError = ref('')
const mapyLinkError = ref(false)

function validateMapyLink(value: string): boolean {
  if (!value.trim()) return true
  try {
    const host = new URL(value.trim()).hostname
    return host.endsWith('mapy.cz') || host.endsWith('mapy.com')
  } catch {
    return false
  }
}

const form = ref({
  name: '',
  date: '',
  total_distance_km: '' as number | '',
  mapy_link: '',
})

async function loadTrip(id: string) {
  trip.value = null
  notFound.value = false
  try {
    trip.value = await tripsApi.getById(id)
  } catch {
    notFound.value = true
    return
  }
  form.value = {
    name: trip.value.name,
    date: trip.value.date ?? '',
    total_distance_km: trip.value.total_distance_km ?? '',
    mapy_link: trip.value.mapy_link ?? '',
  }
}

onMounted(() => loadTrip(route.params.id as string))
watch(() => route.params.id, (id) => { if (id) loadTrip(id as string) })

async function save() {
  if (!trip.value) return
  nameError.value = form.value.name.trim() ? '' : 'Název výletu je povinný.'
  distanceError.value = form.value.total_distance_km !== '' && +form.value.total_distance_km <= 0
    ? 'Vzdálenost musí být kladné číslo.'
    : ''
  mapyLinkError.value = !validateMapyLink(form.value.mapy_link)
  if (nameError.value || distanceError.value || mapyLinkError.value) return
  saving.value = true
  try {
    const updates = {
      name: form.value.name.trim(),
      date: form.value.date || null,
      total_distance_km: form.value.total_distance_km !== '' ? +form.value.total_distance_km : null,
      mapy_link: form.value.mapy_link.trim() || null,
    }
    await tripsApi.update(trip.value.id, updates)
    const today = new Date().toISOString().slice(0, 10)
    const isHistory = !!updates.date && updates.date <= today
    router.push(isHistory ? '/?tab=history' : '/?tab=planned')
  } finally {
    saving.value = false
  }
}

async function duplicate() {
  if (!trip.value) return
  const newId = await store.duplicate(trip.value.id)
  router.push(newId ? `/trip/${newId}` : '/')
}

async function deleteTrip() {
  if (!trip.value) return
  deleting.value = true
  const wasHistory = trip.value.date && trip.value.date <= new Date().toISOString().slice(0, 10)
  try {
    await store.remove(trip.value.id)
    router.push(wasHistory ? '/?tab=history&deleted=1' : '/?tab=planned&deleted=1')
  } finally {
    deleting.value = false
  }
}

function openInMapy() {
  if (!trip.value?.mapy_link) return
  window.open(trip.value.mapy_link, '_blank')
}
</script>

<template>
  <div v-if="notFound" class="loading">Výlet nebyl nalezen. <button class="back" @click="router.push('/')">← Zpět na seznam</button></div>
  <div v-else-if="!trip" class="loading">Načítám…</div>

  <div v-else class="page">
    <header class="top-bar">
      <button class="back" @click="router.push(trip.date && trip.date <= new Date().toISOString().slice(0, 10) ? '/?tab=history' : '/?tab=planned')">← Zpět</button>
      <div class="header-actions">
        <button class="btn-small" @click="duplicate">Kopírovat</button>
        <button class="btn-small danger" :disabled="deleting" @click="deleteTrip">Smazat</button>
      </div>
    </header>

    <div class="content">
      <div class="meta-card">
        <div class="field">
          <label>Název výletu</label>
          <input v-model="form.name" type="text" class="input" maxlength="50" :class="{ 'input-error': nameError }" @input="nameError = ''" />
          <span v-if="nameError" class="error">{{ nameError }}</span>
        </div>
        <div class="field-row">
          <div class="field">
            <label>Datum výletu</label>
            <input v-model="form.date" type="date" class="input" />
            <span class="hint">Bez data = plánovaný výlet</span>
          </div>
          <div class="field">
            <label>Vzdálenost</label>
            <div class="input-with-unit" :class="{ 'input-error': distanceError }">
              <input v-model="form.total_distance_km" type="number" step="0.1" min="0" max="9999" placeholder="—" class="input" @input="distanceError = ''" />
              <span class="unit">km</span>
            </div>
            <span v-if="distanceError" class="error">{{ distanceError }}</span>
          </div>
        </div>
        <div class="field">
          <label>Link Mapy.com</label>
          <input v-model="form.mapy_link" type="text" placeholder="https://mapy.cz/s/..." class="input" :class="{ 'input-error': mapyLinkError }" @input="mapyLinkError = false" />
          <span v-if="mapyLinkError" class="error">Zadej platný odkaz z mapy.cz nebo mapy.com.</span>
        </div>
      </div>

      <div class="actions">
        <button class="btn-primary" :disabled="saving" @click="save">
          {{ saving ? 'Ukládám…' : 'Uložit změny' }}
        </button>
        <button v-if="trip.mapy_link" class="btn-mapy" @click="openInMapy">
          Přeplánovat v Mapy.com →
        </button>
      </div>
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
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.back {
  color: var(--color-text-muted);
  font-size: 13px;
}
.back:hover { color: var(--color-text); }

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
.btn-small.danger { color: var(--color-danger); border-color: var(--color-danger); }
.btn-small.danger:hover { background: #fdf2f2; }
.btn-small:disabled { opacity: 0.5; cursor: default; }

.content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.meta-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.field-row {
  display: flex;
  gap: 16px;
}

label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted);
}

.hint {
  font-size: 11px;
  color: var(--color-text-muted);
}

.input {
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);
  font-size: 14px;
  outline: none;
  width: 100%;
}
.input:focus { border-color: var(--color-primary); }
.input-error { border-color: var(--color-danger) !important; }
.error { font-size: 12px; color: var(--color-danger); }

.input-with-unit {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);
  overflow: hidden;
}
.input-with-unit:focus-within { border-color: var(--color-primary); }
.input-with-unit .input {
  border: none;
  border-radius: 0;
  flex: 1;
}
.input-with-unit .input:focus { border-color: transparent; }

.unit {
  padding: 0 10px;
  font-size: 13px;
  color: var(--color-text-muted);
  border-left: 1px solid var(--color-border);
  background: var(--color-surface);
  line-height: 36px;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn-primary {
  background: var(--color-primary);
  color: #fff;
  padding: 10px 20px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 500;
}
.btn-primary:hover:not(:disabled) { background: var(--color-primary-hover); }
.btn-primary:disabled { opacity: 0.5; cursor: default; }


.btn-mapy {
  background: var(--color-surface);
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  padding: 12px 16px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}
.btn-mapy:hover { background: #f0faf4; }
</style>
