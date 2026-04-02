<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const demoLoading = ref(false)

async function signIn() {
  if (!email.value.trim() || !password.value) return
  loading.value = true
  error.value = ''
  const { error: err } = await supabase.auth.signInWithPassword({
    email: email.value.trim(),
    password: password.value,
  })
  if (err) error.value = 'Nesprávný email nebo heslo.'
  loading.value = false
}

async function signInDemo() {
  demoLoading.value = true
  await supabase.auth.signInWithPassword({
    email: import.meta.env.VITE_DEMO_EMAIL,
    password: import.meta.env.VITE_DEMO_PASSWORD,
  })
  demoLoading.value = false
}

supabase.auth.onAuthStateChange((event, session) => {
  if (session) router.push('/')
})
</script>

<template>
  <div class="page">
    <div class="card">
      <h1 class="logo">Tracer</h1>

      <form @submit.prevent="signIn">
        <input
          v-model="email"
          type="email"
          placeholder="email@example.com"
          class="input"
          autocomplete="email"
          required
        />
        <input
          v-model="password"
          type="password"
          placeholder="Heslo"
          class="input"
          autocomplete="current-password"
          required
        />
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" class="btn-primary" :disabled="loading || !email.trim() || !password">
          {{ loading ? 'Přihlašuji…' : 'Přihlásit se' }}
        </button>
      </form>

      <div class="divider">nebo</div>

      <button class="btn-demo" :disabled="demoLoading" @click="signInDemo">
        {{ demoLoading ? 'Přihlašuji…' : 'Vyzkoušet demo' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: var(--color-bg);
}

.card {
  width: 100%;
  max-width: 380px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.logo {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--color-primary);
}

form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);
  font-size: 14px;
  outline: none;
  width: 100%;
}
.input:focus { border-color: var(--color-primary); }

.error {
  font-size: 12px;
  color: var(--color-danger);
}

.btn-primary {
  background: var(--color-primary);
  color: #fff;
  padding: 11px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}
.btn-primary:hover:not(:disabled) { background: var(--color-primary-hover); }
.btn-primary:disabled { opacity: 0.5; cursor: default; }

.divider {
  text-align: center;
  font-size: 12px;
  color: var(--color-text-muted);
  position: relative;
}
.divider::before, .divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 42%;
  height: 1px;
  background: var(--color-border);
}
.divider::before { left: 0; }
.divider::after { right: 0; }

.btn-demo {
  width: 100%;
  padding: 11px;
  border-radius: var(--radius);
  font-size: 14px;
  border: 1px solid var(--color-border);
  color: var(--color-text);
  background: var(--color-surface);
}
.btn-demo:hover:not(:disabled) { background: var(--color-bg); }
.btn-demo:disabled { opacity: 0.5; cursor: default; }
</style>
