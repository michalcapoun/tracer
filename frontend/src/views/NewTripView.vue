<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { tripsApi } from '../lib/api'

const router = useRouter()

const form = ref({
  mapy_link: '',
  name: '',
  date: '',
  total_distance_km: '' as number | '',
})
const saving = ref(false)
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

async function save() {
  if (!form.value.name.trim()) return
  mapyLinkError.value = !validateMapyLink(form.value.mapy_link)
  if (mapyLinkError.value) return
  saving.value = true
  try {
    await tripsApi.create({
      name: form.value.name.trim(),
      mapy_link: form.value.mapy_link.trim() || null,
      date: form.value.date || null,
      total_distance_km: form.value.total_distance_km !== '' ? +form.value.total_distance_km : null,
    })
    const today = new Date().toISOString().slice(0, 10)
    const isHistory = !!form.value.date && form.value.date <= today
    router.push(isHistory ? '/?tab=history&created=1' : '/?tab=planned&created=1')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="page">
    <header class="top-bar">
      <button class="back" @click="router.push('/')">← Zpět</button>
      <h1 class="title">Nový výlet</h1>
    </header>

    <form class="form" @submit.prevent="save">
      <div class="field">
        <label>Link z Mapy.com</label>
        <input
          v-model="form.mapy_link"
          type="text"
          placeholder="https://mapy.cz/s/..."
          autocomplete="off"
          :class="{ 'input-error': mapyLinkError }"
          @input="mapyLinkError = false"
        />
        <span v-if="mapyLinkError" class="error">Zadej platný odkaz z mapy.cz nebo mapy.com.</span>
      </div>

      <div class="field">
        <label>Název výletu <span class="required">*</span></label>
        <input
          v-model="form.name"
          type="text"
          placeholder="Název výletu"
          required
          maxlength="50"
          autocomplete="off"
        />
      </div>

      <div class="field-row">
        <div class="field">
          <label>Datum výletu</label>
          <input v-model="form.date" type="date" />
          <span class="hint">Bez data = plánovaný výlet</span>
        </div>
        <div class="field">
          <label>Vzdálenost</label>
          <div class="input-with-unit">
            <input
              v-model="form.total_distance_km"
              type="number"
              step="0.1"
              min="0"
              placeholder="0.0"
              max="9999"
            />
            <span class="unit">km</span>
          </div>
        </div>
      </div>

      <button type="submit" class="btn-primary" :disabled="saving || !form.name.trim()">
        {{ saving ? 'Ukládám…' : 'Uložit výlet' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.page {
  max-width: 560px;
  margin: 0 auto;
  padding: 24px 16px;
}

.top-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
}

.back {
  color: var(--color-text-muted);
  font-size: 13px;
}
.back:hover { color: var(--color-text); }

.title {
  font-size: 20px;
  font-weight: 700;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.required {
  color: var(--color-primary);
}

input[type="text"],
input[type="url"],
input[type="date"],
input[type="number"] {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  font-size: 14px;
  outline: none;
  width: 100%;
}
input:focus { border-color: var(--color-primary); }
.input-error { border-color: var(--color-danger) !important; }
.error { font-size: 12px; color: var(--color-danger); }

.input-with-unit {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  overflow: hidden;
}
.input-with-unit:focus-within { border-color: var(--color-primary); }
.input-with-unit input {
  border: none;
  border-radius: 0;
  flex: 1;
}
.input-with-unit input:focus { border-color: transparent; }

.unit {
  padding: 0 12px;
  font-size: 13px;
  color: var(--color-text-muted);
  border-left: 1px solid var(--color-border);
  background: var(--color-bg);
  height: 100%;
  display: flex;
  align-items: center;
}

.hint {
  font-size: 11px;
  color: var(--color-text-muted);
}

.btn-primary {
  background: var(--color-primary);
  color: #fff;
  padding: 11px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  margin-top: 4px;
}
.btn-primary:hover:not(:disabled) { background: var(--color-primary-hover); }
.btn-primary:disabled { opacity: 0.5; cursor: default; }
</style>
