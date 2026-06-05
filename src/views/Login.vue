<template>
  <div class="login-scene">
    <!-- Animated background orbs -->
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>

    <div class="login-card">
      <!-- Logo -->
      <div class="login-logo">
        <div class="llogo-icon">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="10" fill="url(#lgrad)"/>
            <path d="M10 22L16 10L22 22" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="16" cy="17" r="2.5" fill="white"/>
            <defs>
              <linearGradient id="lgrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stop-color="#3b82f6"/>
                <stop offset="1" stop-color="#8b5cf6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div>
          <h1>PlayerokSeller</h1>
          <p>Система управления поставщиками</p>
        </div>
      </div>

      <!-- Form -->
      <div class="login-form">
        <div class="field">
          <label>Логин</label>
          <div class="input-wrap">
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <input
              v-model="form.username"
              type="text"
              placeholder="Введите логин"
              @keyup.enter="handleLogin"
              class="text-input"
              :class="{ 'input-error': error }"
            />
          </div>
        </div>

        <div class="field">
          <label>Пароль</label>
          <div class="input-wrap">
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <input
              v-model="form.password"
              :type="showPwd ? 'text' : 'password'"
              placeholder="Введите пароль"
              @keyup.enter="handleLogin"
              class="text-input"
              :class="{ 'input-error': error }"
            />
            <button class="eye-btn" @click="showPwd = !showPwd" type="button">
              <svg v-if="!showPwd" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </button>
          </div>
        </div>

        <div v-if="error" class="error-msg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {{ error }}
        </div>

        <button class="btn-login" @click="handleLogin" :disabled="loading">
          <span v-if="loading" class="spin">⟳</span>
          <span v-else>Войти</span>
        </button>
      </div>

      <!-- Divider -->
      <div class="or-divider"><span>или</span></div>

      <!-- Guest -->
      <button class="btn-guest" @click="enterAsGuest">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
        Продолжить как гость
      </button>
      <p class="guest-note">Гостевой доступ — только просмотр без возможности изменений</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const showPwd = ref(false)
const error = ref('')

const form = reactive({ username: '', password: '' })

const handleLogin = async () => {
  if (!form.username.trim() || !form.password.trim()) {
    error.value = 'Пожалуйста, заполните все поля'
    return
  }
  error.value = ''
  loading.value = true

  try {
    const success = await authStore.login(form.username, form.password)
    if (success) {
      ElMessage.success('Добро пожаловать!')
      router.push('/')
    } else {
      error.value = 'Неверный логин или пароль'
    }
  } catch {
    error.value = 'Ошибка подключения к серверу'
  } finally {
    loading.value = false
  }
}

const enterAsGuest = () => {
  authStore.setGuestMode()
  ElMessage.info('Вы вошли как гость — только просмотр')
  router.push('/')
}

onMounted(() => {
  if (authStore.isAuthenticated) router.push('/')
})
</script>

<style scoped>
.login-scene {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-deep, #060b14);
  position: relative;
  overflow: hidden;
  padding: 20px;
}

/* Animated background orbs */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  animation: floatOrb 8s ease-in-out infinite;
}
.orb-1 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(59,130,246,0.4), transparent 70%);
  top: -100px; left: -100px;
  animation-duration: 10s;
}
.orb-2 {
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(139,92,246,0.35), transparent 70%);
  bottom: -80px; right: -80px;
  animation-duration: 12s;
  animation-delay: -3s;
}
.orb-3 {
  width: 200px; height: 200px;
  background: radial-gradient(circle, rgba(16,185,129,0.25), transparent 70%);
  top: 60%; left: 60%;
  animation-duration: 9s;
  animation-delay: -6s;
}

@keyframes floatOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(20px, -20px) scale(1.05); }
  66% { transform: translate(-10px, 10px) scale(0.95); }
}

/* Card */
.login-card {
  width: 100%;
  max-width: 420px;
  background: rgba(17, 24, 39, 0.75);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
  padding: 40px 36px;
  box-shadow:
    0 25px 50px rgba(0,0,0,0.6),
    0 0 0 1px rgba(255,255,255,0.03) inset;
  animation: fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  z-index: 1;
}
.login-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
  border-radius: 20px 20px 0 0;
}

/* Logo */
.login-logo {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 32px;
}
.llogo-icon svg { width: 44px; height: 44px; }
.login-logo h1 { margin: 0; font-size: 20px; font-weight: 700; color: var(--text-primary); }
.login-logo p { margin: 3px 0 0; font-size: 12px; color: var(--text-muted); }

/* Form */
.login-form { display: flex; flex-direction: column; gap: 18px; }

.field { display: flex; flex-direction: column; gap: 7px; }
.field label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }

.input-wrap { position: relative; display: flex; align-items: center; }

.input-icon {
  position: absolute;
  left: 12px;
  width: 16px; height: 16px;
  color: var(--text-muted);
  pointer-events: none;
}

.text-input {
  width: 100%;
  padding: 11px 40px 11px 38px;
  background: rgba(11,17,32,0.7);
  border: 1px solid rgba(148,163,184,0.12);
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 14px;
  font-family: var(--font);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.text-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(59,130,246,0.2);
}
.text-input.input-error { border-color: var(--danger); }
.text-input.input-error:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.2); }

.eye-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 4px;
  display: flex;
  align-items: center;
}
.eye-btn svg { width: 16px; height: 16px; }
.eye-btn:hover { color: var(--text-secondary); }

.error-msg {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  color: var(--danger);
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.2);
  border-radius: 8px;
  padding: 9px 12px;
}
.error-msg svg { width: 15px; height: 15px; flex-shrink: 0; }

.btn-login {
  width: 100%;
  padding: 13px;
  background: linear-gradient(135deg, var(--accent) 0%, var(--purple) 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s;
  font-family: var(--font);
  margin-top: 2px;
}
.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(59,130,246,0.4);
}
.btn-login:disabled { opacity: 0.6; cursor: not-allowed; }

.spin { display: inline-block; animation: spin 0.7s linear infinite; font-size: 18px; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Divider */
.or-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 22px 0 16px;
  color: var(--text-muted);
  font-size: 12px;
}
.or-divider::before, .or-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255,255,255,0.06);
}

.btn-guest {
  width: 100%;
  padding: 11px;
  background: rgba(255,255,255,0.05);
  color: var(--text-secondary);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: var(--font);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn-guest:hover { background: rgba(255,255,255,0.09); color: var(--text-primary); }

.guest-note {
  margin: 12px 0 0;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.5;
}
</style>