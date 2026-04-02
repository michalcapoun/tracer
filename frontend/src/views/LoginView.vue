<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const emailError = ref('')
const passwordError = ref('')
const demoLoading = ref(false)

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

async function signIn() {
  emailError.value = !email.value.trim()
    ? 'Email je povinný.'
    : !isValidEmail(email.value) ? 'Zadej platnou emailovou adresu.' : ''
  passwordError.value = password.value ? '' : 'Heslo je povinné.'
  if (emailError.value || passwordError.value) return

  loading.value = true
  const { error: err } = await supabase.auth.signInWithPassword({
    email: email.value.trim(),
    password: password.value,
  })
  if (err) passwordError.value = 'Nesprávný email nebo heslo.'
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
      <h1 class="logo">TRACER</h1>

      <form @submit.prevent="signIn">
        <div class="field">
          <input
            v-model="email"
            type="text"
            placeholder="email@example.com"
            class="input"
            autocomplete="email"
            :class="{ 'input-error': emailError }"
            @input="emailError = ''"
          />
          <span v-if="emailError" class="error">{{ emailError }}</span>
        </div>
        <div class="field">
          <input
            v-model="password"
            type="password"
            placeholder="Heslo"
            class="input"
            autocomplete="current-password"
            :class="{ 'input-error': passwordError }"
            @input="passwordError = ''"
          />
          <span v-if="passwordError" class="error">{{ passwordError }}</span>
        </div>
        <button type="submit" class="btn-primary" :disabled="loading">
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

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
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
.input-error { border-color: var(--color-danger) !important; }

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
