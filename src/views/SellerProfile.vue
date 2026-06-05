<template>
  <div class="seller-profile animate-in">
    <!-- Backend status indicator -->
    <div v-if="backendStatus !== 'unknown'" class="backend-status" :class="backendStatus">
      <span class="status-dot"></span>
      <span v-if="backendStatus === 'connected'">
        🟢 Playerok API подключён — данные синхронизированы
      </span>
      <span v-else-if="backendStatus === 'no-cookies'">
        ⚠️ Python backend запущен, но
        <strong>cookies.json</strong> не настроен.
        <a href="#" @click.prevent="openReadme">
          Инструкция по настройке →
        </a>
      </span>
      <span v-else>
        🔴 Python backend недоступен — работаем офлайн
        <code style="font-size:11px;margin-left:6px;">uvicorn main:app --port 8080</code>
      </span>
    </div>
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="gradient-text">Мой профиль</h1>
        <p>Управление учётной записью и данными продавца</p>
      </div>
      <div class="header-actions" v-if="!isEditingProfile">
        <button class="btn-primary" @click="startEdit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Редактировать
        </button>
        <button class="btn-ghost" @click="exportData">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Экспорт
        </button>
      </div>
      <div class="header-actions" v-else>
        <button class="btn-primary" @click="saveProfile" :disabled="saving">
          <svg v-if="!saving" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span v-else class="spin-icon">⟳</span>
          {{ saving ? 'Сохранение...' : 'Сохранить' }}
        </button>
        <button class="btn-ghost" @click="cancelEdit">Отменить</button>
      </div>
    </div>

    <!-- Guest Warning -->
    <div v-if="isGuest" class="alert-banner">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>Профиль доступен только авторизованным продавцам. <a @click="$router.push('/login')"
          style="color:var(--accent-light);cursor:pointer;">Войти</a></span>
    </div>

    <div v-else class="profile-grid">
      <!-- Left Column -->
      <div class="profile-left">

        <!-- Avatar + Main Info Card -->
        <div class="glass-card avatar-card card-3d">
          <div class="avatar-section">
            <div class="avatar-wrap">
              <div class="avatar" :style="avatarStyle" @click="triggerAvatarUpload">
                <span v-if="!localProfile.avatar" class="avatar-initials">{{ initials }}</span>
                <img v-else :src="localProfile.avatar" alt="Avatar" class="avatar-img" />
                <div class="avatar-overlay">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:22px;">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
              </div>
              <input ref="avatarInput" type="file" accept="image/*" style="display:none" @change="handleAvatarChange" />
              <div class="avatar-glow"></div>
            </div>
            <div class="avatar-info">
              <h2 v-if="!isEditingProfile">{{ localProfile.name }}</h2>
              <input v-else v-model="localProfile.name" class="profile-input name-input" placeholder="Имя продавца" />
              <p class="nickname">{{ localProfile.gameNickname }}</p>
              <div class="online-badge">
                <span class="online-dot"></span>
                Онлайн
              </div>
            </div>
          </div>

          <!-- Info Fields -->
          <div class="info-list">
            <div class="info-row">
              <span class="info-label">🆔 ID</span>
              <span class="info-value mono">{{ localProfile.id }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">🎮 Ник в игре</span>
              <span v-if="!isEditingProfile" class="info-value">{{ localProfile.gameNickname || '—' }}</span>
              <input v-else v-model="localProfile.gameNickname" class="profile-input" placeholder="Игровой ник" />
            </div>
            <div class="info-row">
              <span class="info-label">📧 E-mail</span>
              <span v-if="!isEditingProfile" class="info-value">{{ localProfile.email || '—' }}</span>
              <input v-else v-model="localProfile.email" type="email" class="profile-input"
                placeholder="email@example.com" />
            </div>
            <div class="info-row">
              <span class="info-label">📱 Телефон</span>
              <span v-if="!isEditingProfile" class="info-value">{{ localProfile.phone || '—' }}</span>
              <input v-else v-model="localProfile.phone" class="profile-input" placeholder="+7 (999) 000-00-00" />
            </div>
            <div class="info-row">
              <span class="info-label">📅 Регистрация</span>
              <span class="info-value">{{ formatDate(localProfile.registeredAt) }}</span>
            </div>
          </div>

          <!-- Bio -->
          <div class="bio-section">
            <span class="info-label">О себе</span>
            <p v-if="!isEditingProfile" class="bio-text">{{ localProfile.bio || 'Нет описания' }}</p>
            <textarea v-else v-model="localProfile.bio" class="profile-input bio-input"
              placeholder="Расскажите о себе..." rows="3"></textarea>
          </div>
        </div>

        <!-- Balance History -->
        <div class="glass-card history-card">
          <div class="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            История баланса
          </div>
          <div class="history-list">
            <div v-for="(entry, i) in balanceHistory" :key="i" class="history-item"
              :style="{ animationDelay: `${i * 0.06}s` }">
              <div class="history-dot" :class="entry.amount > 0 ? 'dot-green' : 'dot-red'"></div>
              <div class="history-body">
                <span class="history-desc">{{ entry.description }}</span>
                <span class="history-date">{{ entry.date }}</span>
              </div>
              <span class="history-amount" :class="entry.amount > 0 ? 'pos' : 'neg'">
                {{ entry.amount > 0 ? '+' : '' }}{{ formatCurrency(entry.amount) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column -->
      <div class="profile-right">

        <!-- Balance Card -->
        <div class="glass-card balance-card card-3d">
          <div class="balance-header">
            <span class="card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              Текущий баланс
            </span>
          </div>
          <div class="balance-display">
            <span class="balance-value"
              :class="{ 'pos-glow': localProfile.balance >= 0, 'neg-glow': localProfile.balance < 0 }">
              {{ formatCurrency(localProfile.balance) }}
            </span>
            <span class="balance-sub">Баланс продавца</span>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card card-3d" v-for="stat in statCards" :key="stat.label">
            <div class="stat-icon" :style="{ background: stat.iconBg }">{{ stat.icon }}</div>
            <div class="stat-body">
              <span class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</span>
              <span class="stat-label">{{ stat.label }}</span>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="glass-card quick-actions-card">
          <div class="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 8 12 12 14 14" />
            </svg>
            Быстрые действия
          </div>
          <div class="action-list">
            <button class="action-btn green" @click="$router.push('/suppliers')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Список поставщиков
            </button>
            <button class="action-btn blue" @click="$router.push('/')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Вернуться на главную
            </button>
            <button class="action-btn orange" @click="exportData">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Экспортировать данные
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'
import {
  checkBackendHealth,
  fetchProfile,
  fetchBalance,
  fetchActualDeals
} from '../utils/playerok'

const router = useRouter()
const authStore = useAuthStore()
const avatarInput = ref(null)

const isGuest = computed(() => authStore.isGuestMode)

// Local editable copy of the profile
const localProfile = reactive({ ...authStore.sellerProfile })

const isEditingProfile = ref(false)
const saving = ref(false)
const loadingFromAPI = ref(false)
const backendStatus = ref('unknown') // 'unknown' | 'connected' | 'offline' | 'no-cookies'

// Keep a snapshot for cancel
let editSnapshot = {}

const balanceHistory = ref([
  { date: '06.03.2026 11:20', description: 'Пополнение баланса', amount: 5000 },
  { date: '05.03.2026 09:15', description: 'Оплата поставщику', amount: -3200 },
  { date: '04.03.2026 16:45', description: 'Пополнение баланса', amount: 10000 },
  { date: '03.03.2026 14:30', description: 'Оплата поставщику', amount: -8700 },
])

// ── Playerok API integration ────────────────
const loadFromPlayerokAPI = async () => {
  if (isGuest.value) return
  loadingFromAPI.value = true
  try {
    // 1. Check backend health first
    const health = await checkBackendHealth()
    if (!health.healthy) {
      backendStatus.value = health.cookies_file === false ? 'no-cookies' : 'offline'
      return
    }

    // 2. Load profile from Playerok
    const [profile, balance] = await Promise.all([
      fetchProfile().catch(() => null),
      fetchBalance().catch(() => null),
    ])

    if (profile) {
      localProfile.name = profile.nickname || localProfile.name
      localProfile.gameNickname = profile.nickname || localProfile.gameNickname
      localProfile.totalItems = profile.totalItems
      localProfile.activeItems = profile.activeItems
      localProfile.finishedItems = profile.finishedItems
      localProfile.salesTotal = profile.salesTotal
      localProfile.purchasesTotal = profile.purchasesTotal
      localProfile.testimonials = profile.testimonials
    }

    if (balance) {
      localProfile.balance = balance.available ?? localProfile.balance
      localProfile.allBalance = balance.allBalance
      localProfile.pendingIncome = balance.pendingIncome
      localProfile.frozen = balance.frozen
    }

    // Save enriched profile to store
    authStore.updateProfile({ ...localProfile })
    backendStatus.value = 'connected'
    ElMessage.success('Данные синхронизированы с Playerok!')
  } catch (e) {
    console.warn('Playerok API load failed:', e)
    backendStatus.value = 'offline'
  } finally {
    loadingFromAPI.value = false
  }
}

const openReadme = () => {
  ElMessage.info('Откройте backend_python/README.md для инструкции по настройке cookies.json')
}

const statCards = computed(() => [
  {
    icon: '💳',
    value: formatCurrency(localProfile.balance),
    label: 'Доступный баланс',
    color: localProfile.balance >= 0 ? 'var(--success)' : 'var(--danger)',
    iconBg: 'rgba(16,185,129,0.15)'
  },
  {
    icon: '💰',
    value: localProfile.allBalance ? formatCurrency(localProfile.allBalance) : '—',
    label: 'Общий баланс',
    color: 'var(--accent-light)',
    iconBg: 'rgba(59,130,246,0.15)'
  },
  {
    icon: '⏳',
    value: localProfile.pendingIncome ? formatCurrency(localProfile.pendingIncome) : '—',
    label: 'Ожидает зачисления',
    color: 'var(--warning)',
    iconBg: 'rgba(245,158,11,0.15)'
  },
  {
    icon: '📦',
    value: localProfile.activeItems ?? '24',
    label: 'Активных товаров',
    color: 'var(--purple)',
    iconBg: 'rgba(139,92,246,0.15)'
  },
])

const initials = computed(() => {
  const name = localProfile.name || 'П'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
})

const avatarColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']
const avatarStyle = computed(() => ({
  background: localProfile.avatar
    ? 'transparent'
    : `linear-gradient(135deg, ${avatarColors[0]}, ${avatarColors[1]})`
}))

const formatCurrency = (v) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(v)

const formatDate = (d) => {
  try { return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }) }
  catch { return d }
}

const startEdit = () => {
  editSnapshot = { ...localProfile }
  isEditingProfile.value = true
}

const cancelEdit = () => {
  Object.assign(localProfile, editSnapshot)
  isEditingProfile.value = false
}

const saveProfile = async () => {
  saving.value = true
  await new Promise(r => setTimeout(r, 600)) // simulate async
  authStore.updateProfile({ ...localProfile })
  isEditingProfile.value = false
  saving.value = false
  ElMessage({ message: 'Профиль успешно обновлён!', type: 'success', grouping: true })
}

const triggerAvatarUpload = () => {
  if (isEditingProfile.value) avatarInput.value?.click()
}

const handleAvatarChange = (e) => {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { localProfile.avatar = reader.result }
  reader.readAsDataURL(file)
}

const exportData = () => {
  const data = { profile: { ...localProfile }, balanceHistory: balanceHistory.value, exportDate: new Date().toISOString() }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `seller-profile-${Date.now()}.json`
  a.click()
  ElMessage.success('Данные экспортированы')
}

onMounted(async () => {
  // Try to load real data from the Playerok Python backend
  await loadFromPlayerokAPI()
})
</script>

<style scoped>
.seller-profile {
  max-width: 1200px;
}

/* ── PAGE HEADER ──────────────────────── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 28px;
  gap: 16px;
  flex-wrap: wrap;
}

.header-left h1 {
  margin: 0 0 4px 0;
  font-size: 30px;
  font-weight: 800;
}

.header-left p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

/* ── BUTTONS ─────────────────────────── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  background: linear-gradient(135deg, var(--accent), var(--purple));
  color: white;
  border: none;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: var(--font);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px var(--accent-glow);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-primary svg {
  width: 15px;
  height: 15px;
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: 9px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: var(--font);
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.btn-ghost svg {
  width: 15px;
  height: 15px;
}

.spin-icon {
  display: inline-block;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── ALERT BANNER ───────────────────── */
.alert-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: var(--r-md);
  color: var(--warning);
  margin-bottom: 24px;
  font-size: 14px;
}

.alert-banner svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* ── GRID ───────────────────────────── */
.profile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}

.profile-left,
.profile-right {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── AVATAR CARD ────────────────────── */
.avatar-card {
  padding: 28px;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  border: 3px solid rgba(59, 130, 246, 0.4);
  transition: border-color 0.3s;
}

.avatar:hover {
  border-color: var(--accent);
}

.avatar:hover .avatar-overlay {
  opacity: 1;
}

.avatar-initials {
  font-size: 28px;
  font-weight: 700;
  color: white;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  color: white;
}

.avatar-glow {
  position: absolute;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--accent-glow), transparent 70%);
  top: 0;
  left: 0;
  animation: glowPulse 3s ease-in-out infinite;
  z-index: -1;
}

.avatar-info h2 {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 700;
}

.nickname {
  margin: 0 0 8px;
  color: var(--text-secondary);
  font-size: 13px;
}

.online-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--success);
  font-weight: 500;
}

.online-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--success);
  animation: pulse 2s infinite;
}

@keyframes pulse {

  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5)
  }

  50% {
    box-shadow: 0 0 0 5px transparent
  }
}

/* ── INFO LIST ──────────────────────── */
.info-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.info-row:last-child {
  border: none;
}

.info-label {
  color: var(--text-muted);
  font-size: 13px;
  flex-shrink: 0;
}

.info-value {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  text-align: right;
}

.info-value.mono {
  font-family: monospace;
  font-size: 13px;
}

/* ── BIO ───────────────────────────── */
.bio-section {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bio-text {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

/* ── PROFILE INPUT ──────────────────── */
.profile-input {
  width: 100%;
  background: rgba(11, 17, 32, 0.6);
  border: 1px solid var(--border-bright);
  border-radius: 8px;
  padding: 8px 12px;
  color: var(--text-primary);
  font-family: var(--font);
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  resize: none;
  box-sizing: border-box;
}

.profile-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.name-input {
  font-size: 18px;
  font-weight: 700;
  padding: 8px 12px;
}

.bio-input {
  line-height: 1.5;
}

/* ── HISTORY CARD ───────────────────── */
.history-card {
  padding: 20px 24px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: 16px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  animation: fadeSlideUp 0.4s ease both;
}

.history-item:last-child {
  border: none;
}

.history-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-green {
  background: var(--success);
  box-shadow: 0 0 6px var(--success-glow);
}

.dot-red {
  background: var(--danger);
  box-shadow: 0 0 6px var(--danger-glow);
}

.history-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.history-desc {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

.history-date {
  font-size: 11px;
  color: var(--text-muted);
}

.history-amount {
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.history-amount.pos {
  color: var(--success);
}

.history-amount.neg {
  color: var(--danger);
}

/* ── BALANCE CARD ─────────────────── */
.balance-card {
  padding: 24px 28px;
}

.balance-display {
  text-align: center;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.balance-value {
  font-size: 40px;
  font-weight: 800;
  font-feature-settings: "tnum";
  letter-spacing: -1px;
}

.pos-glow {
  color: var(--success);
  text-shadow: 0 0 30px rgba(16, 185, 129, 0.4);
}

.neg-glow {
  color: var(--danger);
  text-shadow: 0 0 30px rgba(239, 68, 68, 0.4);
}

.balance-sub {
  font-size: 13px;
  color: var(--text-secondary);
}

.separator {
  height: 1px;
  background: var(--border);
  margin: 8px 0 20px;
}

.balance-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

/* ── STATS GRID ─────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.stat-card {
  background: var(--glass-bg);
  backdrop-filter: blur(18px);
  border: 1px solid var(--glass-border);
  border-radius: var(--r-lg);
  padding: 18px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.stat-icon {
  font-size: 22px;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
}

.stat-label {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ── QUICK ACTIONS ──────────────── */
.quick-actions-card {
  padding: 20px 24px;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid transparent;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: var(--font);
  text-align: left;
}

.action-btn svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.action-btn:hover {
  transform: translateX(4px);
}

.action-btn.green {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
  border-color: rgba(16, 185, 129, 0.2);
}

.action-btn.green:hover {
  background: rgba(16, 185, 129, 0.15);
}

.action-btn.blue {
  background: rgba(59, 130, 246, 0.1);
  color: var(--accent-light);
  border-color: rgba(59, 130, 246, 0.2);
}

.action-btn.blue:hover {
  background: rgba(59, 130, 246, 0.15);
}

.action-btn.orange {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
  border-color: rgba(245, 158, 11, 0.2);
}

.action-btn.orange:hover {
  background: rgba(245, 158, 11, 0.15);
}

/* ── CARD TITLE ─────────────────── */
.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.card-title svg {
  width: 17px;
  height: 17px;
  color: var(--text-secondary);
}

.balance-header {
  margin-bottom: 4px;
}

/* ── BACKEND STATUS ─────────────────── */
.backend-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 20px;
  border: 1px solid transparent;
}

.backend-status.connected {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.2);
  color: var(--success);
}

.backend-status.offline {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.2);
  color: var(--danger);
}

.backend-status.no-cookies {
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.2);
  color: var(--warning);
}

.backend-status a {
  color: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.backend-status code {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 11px;
}

/* ── RESPONSIVE ─────────────────── */

@media (max-width: 1100px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .header-actions {
    flex-wrap: wrap;
  }

  .balance-value {
    font-size: 30px;
  }
}
</style>