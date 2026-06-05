<template>
  <div class="dashboard animate-in">

    <!-- Welcome Banner -->
    <div class="welcome-banner entrance-anim" v-3d-tilt="{ max: 5, perspective: 1200 }">
      <div class="welcome-text">
        <h1>Добро пожаловать, <span class="gradient-text">{{ authStore.sellerProfile?.name || 'Продавец' }}!</span></h1>
        <p v-if="isGuest">Вы просматриваете информацию в гостевом режиме</p>
        <p v-else>Управляйте поставщиками и следите за балансом в режиме реального времени</p>
      </div>
      <div class="welcome-badge">
        <span>{{ currentDate }}</span>
      </div>
    </div>

    <!-- Guest Notice -->
    <div v-if="isGuest" class="alert-info">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>Гостевой доступ — только просмотр.</span>
      <button class="link-btn" @click="$router.push('/login')">Войти как продавец →</button>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div v-for="(card, i) in statCards" :key="card.label" class="stat-card card-3d entrance-anim"
        v-3d-tilt="{ max: 15, speed: 400 }" :style="{ animationDelay: `${i * 0.1}s` }">
        <div class="stat-icon-wrap" :style="{ background: card.iconBg }">
          <span class="stat-emoji">{{ card.icon }}</span>
        </div>
        <div class="stat-body">
          <div class="stat-value" :class="card.cls">{{ card.value }}</div>
          <div class="stat-label">{{ card.label }}</div>
          <div v-if="card.sub" class="stat-sub">{{ card.sub }}</div>
        </div>
        <button v-if="card.action && !isGuest" class="stat-action" @click="card.action">
          {{ card.actionLabel }}
        </button>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="section-row">
      <div class="glass-card actions-card">
        <h3 class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="13" cy="13" r="10" />
            <polyline points="12 8 12 12 14 14" />
          </svg>
          {{ isGuest ? 'Доступные действия' : 'Быстрые действия' }}
        </h3>
        <div class="action-btns">
          <button class="action-btn-card green" @click="$router.push('/suppliers')">
            <div class="ab-icon">👥</div>
            <div class="ab-body">
              <span class="ab-title">{{ isGuest ? 'Просмотр поставщиков' : 'Управление поставщиками' }}</span>
              <span class="ab-sub">{{ isGuest ? 'Список поставщиков' : 'Добавить, изменить, удалить' }}</span>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="ab-arrow">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <button v-if="!isGuest" class="action-btn-card blue" @click="showAddDialog = true">
            <div class="ab-icon">➕</div>
            <div class="ab-body">
              <span class="ab-title">Добавить поставщика</span>
              <span class="ab-sub">Новый поставщик</span>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="ab-arrow">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <button v-if="!isGuest" class="action-btn-card purple" @click="$router.push('/seller')">
            <div class="ab-icon">👤</div>
            <div class="ab-body">
              <span class="ab-title">Мой профиль</span>
              <span class="ab-sub">Данные и баланс</span>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="ab-arrow">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <button v-else class="action-btn-card orange" @click="$router.push('/login')">
            <div class="ab-icon">🔐</div>
            <div class="ab-body">
              <span class="ab-title">Войти как продавец</span>
              <span class="ab-sub">Полный доступ</span>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="ab-arrow">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="glass-card activity-card">
        <h3 class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Последние поставщики
        </h3>
        <div v-if="recentSuppliers.length === 0" class="empty-state">
          <span>📭</span>
          <p>Поставщики ещё не добавлены</p>
        </div>
        <div v-else class="suppliers-list">
          <div v-for="s in recentSuppliers" :key="s.id" class="supplier-row" @click="$router.push('/suppliers')">
            <div class="supplier-avatar">{{ (s.name || '?')[0] }}</div>
            <div class="supplier-info">
              <span class="supplier-name">{{ s.name }}</span>
              <span class="supplier-nick">{{ s.gameNickname }}</span>
            </div>
            <div class="supplier-debt" :class="s.debt > 0 ? 'neg' : 'ok'">
              {{ formatCurrency(s.debt || 0) }}
            </div>
          </div>
        </div>
        <button class="view-all-btn" @click="$router.push('/suppliers')">Показать всех →</button>
      </div>
    </div>

    <!-- Playerok Active Section -->
    <div v-if="!isGuest" class="section-row mt-24">
      <!-- Active Orders (Deals) -->
      <div class="glass-card deals-card">
        <h3 class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="m16 10-4 4-4-4" />
          </svg>
          Активные заказы (Playerok)
          <span v-if="activeDeals.length > 0" class="badge-count">{{ activeDeals.length }}</span>
        </h3>
        <div v-if="activeDeals.length === 0" class="empty-state">
          <span>🛍️</span>
          <p>Нет активных оплаченных заказов</p>
        </div>
        <div v-else class="data-list scrollable">
          <div v-for="deal in activeDeals" :key="deal.id" class="data-row">
            <div class="data-main">
              <span class="data-title">{{ deal.itemName }}</span>
              <span class="data-sub">{{ formatCurrency(deal.itemPrice) }} • ID: {{ deal.id.slice(-6) }}</span>
            </div>
            <button class="confirm-btn" @click="handleConfirmDeal(deal.id)">Подтвердить</button>
          </div>
        </div>
      </div>

      <!-- My Products (Lots) -->
      <div class="glass-card products-card">
        <h3 class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m7.5 4.27 9 5.15" />
            <path
              d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
          </svg>
          Мои товары
          <span v-if="exhibitedLots.length > 0" class="badge-count">{{ exhibitedLots.length }}</span>
        </h3>
        <div v-if="exhibitedLots.length === 0" class="empty-state">
          <span>📦</span>
          <p>Товары не найдены</p>
        </div>
        <div v-else class="data-list scrollable">
          <div v-for="lot in exhibitedLots" :key="lot.id" class="data-row">
            <div class="data-main">
              <span class="data-title">{{ lot.name }}</span>
              <span class="data-sub">{{ formatCurrency(lot.price) }} • {{ lot.status }}</span>
            </div>
            <button class="boost-btn" @click="handleBoost(lot.id)">Поднять</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Balance Dialog -->
    <el-dialog v-model="showBalanceDialog" title="Изменить баланс" width="420px" align-center>
      <el-form :model="balanceForm" label-position="top">
        <el-form-item label="Новый баланс (₽)">
          <el-input-number v-model="balanceForm.balance" :precision="2" :step="100" :min="-1000000" :max="1000000"
            style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBalanceDialog = false">Отмена</el-button>
        <el-button type="primary" @click="updateBalance">Сохранить</el-button>
      </template>
    </el-dialog>

    <AddSupplierDialog v-if="!isGuest" v-model="showAddDialog" @supplier-added="handleSupplierAdded" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'
import AddSupplierDialog from '../components/AddSupplierDialog.vue'
import api from '../utils/api'
import {
  fetchBalance as fetchPlayerokBalance,
  fetchProfile as fetchPlayerokProfile,
  fetchAllExhibitedLots,
  fetchActualDeals,
  confirmDeal,
  increaseItemPriority,
  fetchUnreadCount
} from '../utils/playerok'

const router = useRouter()
const authStore = useAuthStore()

const isGuest = computed(() => authStore.isGuestMode)

const recentSuppliers = ref([])
const showBalanceDialog = ref(false)
const showAddDialog = ref(false)
const balanceForm = reactive({ balance: authStore.sellerProfile?.balance || 0 })

const stats = ref({ totalDebt: 0, totalOrders: 0, supplierCount: 0 })
const playerokBalance = ref({ available: 0, pendingIncome: 0, frozen: 0, allBalance: 0 })
const unreadChats = ref(0)
const exhibitedLots = ref([])
const activeDeals = ref([])

const currentDate = computed(() => {
  return new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
})

const formatCurrency = (v) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(v)

const balanceAfter = computed(() => (playerokBalance.value?.available || 0) - stats.value.totalDebt)

const statCards = computed(() => [
  {
    icon: '💰',
    value: formatCurrency(playerokBalance.value?.available || 0),
    label: 'Баланс',
    sub: 'Текущий баланс',
    cls: (authStore.sellerProfile?.balance || 0) >= 0 ? 'pos' : 'neg',
    iconBg: 'rgba(16,185,129,0.12)',
    action: () => { balanceForm.balance = authStore.sellerProfile?.balance || 0; showBalanceDialog.value = true },
    actionLabel: 'Изменить'
  },
  {
    icon: '📉',
    value: formatCurrency(stats.value.totalDebt),
    label: 'Задолженность',
    sub: `${stats.value.supplierCount} поставщика(ов)`,
    cls: 'warn',
    iconBg: 'rgba(245,158,11,0.12)'
  },
  {
    icon: '📦',
    value: stats.value.totalOrders,
    label: 'Всего заказов',
    sub: 'у поставщиков',
    cls: '',
    iconBg: 'rgba(59,130,246,0.12)'
  },
  {
    icon: '💼',
    value: formatCurrency(balanceAfter.value),
    label: 'Баланс после выплат',
    sub: 'расчётный',
    cls: balanceAfter.value >= 0 ? 'pos' : 'neg',
    iconBg: 'rgba(139,92,246,0.12)'
  },
  {
    icon: '🎮',
    value: formatCurrency(playerokBalance.value.available || 0),
    label: 'Playerok Доступно',
    sub: `Всего: ${formatCurrency(playerokBalance.value.allBalance || 0)}`,
    cls: 'pos',
    iconBg: 'rgba(236,72,153,0.12)'
  },
  {
    icon: '💬',
    value: unreadChats.value,
    label: 'Сообщения',
    sub: 'Непрочитанные',
    cls: unreadChats.value > 0 ? 'neg' : '',
    iconBg: 'rgba(20,184,166,0.12)',
    action: () => window.open('https://playerok.com/chats', '_blank'),
    actionLabel: 'Открыть'
  }
])

const loadData = async () => {
  try {
    const [sellerRes, statsRes, suppRes, pBalance, pProfile, pLots, pDeals, pUnread] = await Promise.all([
      api.get('/seller').catch(() => null),
      api.get('/stats').catch(() => null),
      api.get('/suppliers').catch(() => null),
      fetchPlayerokBalance().catch(() => null),
      fetchPlayerokProfile().catch(() => null),
      fetchAllExhibitedLots().catch(() => []),
      fetchActualDeals().catch(() => []),
      fetchUnreadCount().catch(() => ({ unread: 0 }))
    ])
    if (sellerRes?.data) authStore.updateProfile(sellerRes.data)
    if (pProfile) {
      authStore.updateProfile({
        name: pProfile.nickname,
        gameNickname: pProfile.nickname
      })
    }
    if (statsRes?.data) stats.value = statsRes.data
    if (suppRes?.data) recentSuppliers.value = suppRes.data.slice(0, 5)
    if (pBalance) playerokBalance.value = pBalance
    if (pLots) exhibitedLots.value = pLots
    if (pDeals) activeDeals.value = pDeals
    if (pUnread) unreadChats.value = pUnread.unread || 0
  } catch (e) {
    console.warn('Could not load dashboard data:', e)
  }
}

const handleConfirmDeal = async (id) => {
  try {
    await confirmDeal(id)
    ElMessage.success('Заказ подтверждён!')
    loadData()
  } catch (e) {
    ElMessage.error('Ошибка подтверждения: ' + e.message)
  }
}

const handleBoost = async (id) => {
  try {
    await increaseItemPriority(id)
    ElMessage.success('Товар поднят в поиске!')
    loadData()
  } catch (e) {
    ElMessage.error('Ошибка: ' + e.message)
  }
}

const updateBalance = async () => {
  authStore.updateBalance(balanceForm.balance, 'Изменено с главной страницы')
  showBalanceDialog.value = false
  ElMessage.success('Баланс обновлён!')
}

const handleSupplierAdded = () => {
  loadData()
  ElMessage.success('Поставщик добавлен!')
}

// Custom 3D Tilt Directive
const v3dTilt = {
  mounted(el, binding) {
    const settings = {
      max: binding.value?.max || 15,
      perspective: binding.value?.perspective || 1000,
      speed: binding.value?.speed || 300
    }

    el.style.transition = `transform ${settings.speed}ms cubic-bezier(.23,1,.32,1)`
    el.style.transformStyle = 'preserve-3d'

    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      const rotateX = ((y - centerY) / centerY) * -settings.max
      const rotateY = ((x - centerX) / centerX) * settings.max

      el.style.transform = `perspective(${settings.perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
    })

    el.addEventListener('mouseleave', () => {
      el.style.transform = `perspective(${settings.perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`
    })
  }
}

onMounted(loadData)
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
}

/* ── WELCOME BANNER ────────────────────── */
.welcome-banner {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.18) 0%, rgba(139, 92, 246, 0.12) 50%, rgba(16, 185, 129, 0.08) 100%);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 18px;
  padding: 30px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
}

.welcome-banner::before {
  content: '';
  position: absolute;
  top: -30px;
  right: -30px;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.2), transparent 70%);
}

.welcome-text h1 {
  margin: 0 0 6px;
  font-size: 26px;
  font-weight: 800;
}

.welcome-text p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.welcome-badge {
  font-size: 13px;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--border);
  padding: 8px 16px;
  border-radius: 20px;
  white-space: nowrap;
}

/* ── ALERT ─────────────────────────────── */
.alert-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 10px;
  color: var(--accent-light);
  font-size: 14px;
  margin-bottom: 24px;
}

.alert-info svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.link-btn {
  background: none;
  border: none;
  color: var(--accent-light);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  text-decoration: underline;
  font-family: var(--font);
  padding: 0;
  margin-left: 4px;
}

/* ── STATS ─────────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--glass-bg);
  backdrop-filter: blur(18px);
  border: 1px solid var(--glass-border);
  border-radius: var(--r-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: fadeSlideUp 0.4s ease both;
}

.stat-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-emoji {
  font-size: 22px;
}

.stat-body {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 2px;
}

.stat-value.pos {
  color: var(--success);
}

.stat-value.neg {
  color: var(--danger);
}

.stat-value.warn {
  color: var(--warning);
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-sub {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

.stat-action {
  font-size: 12px;
  font-weight: 600;
  background: rgba(59, 130, 246, 0.12);
  color: var(--accent-light);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 6px;
  padding: 5px 10px;
  cursor: pointer;
  transition: background 0.2s;
  font-family: var(--font);
}

.stat-action:hover {
  background: rgba(59, 130, 246, 0.2);
}

/* ── SECTION ROW ───────────────────────── */
.section-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.actions-card,
.activity-card {
  padding: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 18px;
}

.section-title svg {
  width: 18px;
  height: 18px;
  color: var(--text-secondary);
}

/* ── ACTION BUTTON CARDS ───────────────── */
.action-btns {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-btn-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.22s ease;
  text-align: left;
  font-family: var(--font);
  background: transparent;
}

.action-btn-card:hover {
  transform: translateX(5px);
}

.ab-icon {
  font-size: 22px;
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.ab-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ab-title {
  font-size: 14px;
  font-weight: 600;
}

.ab-sub {
  font-size: 12px;
  opacity: 0.7;
}

.ab-arrow {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  opacity: 0.5;
}

.action-btn-card.green {
  background: rgba(16, 185, 129, 0.07);
  border-color: rgba(16, 185, 129, 0.15);
  color: #6ee7b7;
}

.action-btn-card.green:hover {
  background: rgba(16, 185, 129, 0.12);
}

.action-btn-card.blue {
  background: rgba(59, 130, 246, 0.07);
  border-color: rgba(59, 130, 246, 0.15);
  color: #93c5fd;
}

.action-btn-card.blue:hover {
  background: rgba(59, 130, 246, 0.12);
}

.action-btn-card.purple {
  background: rgba(139, 92, 246, 0.07);
  border-color: rgba(139, 92, 246, 0.15);
  color: #c4b5fd;
}

.action-btn-card.purple:hover {
  background: rgba(139, 92, 246, 0.12);
}

.action-btn-card.orange {
  background: rgba(245, 158, 11, 0.07);
  border-color: rgba(245, 158, 11, 0.15);
  color: #fcd34d;
}

.action-btn-card.orange:hover {
  background: rgba(245, 158, 11, 0.12);
}

/* ── SUPPLIER LIST ─────────────────────── */
.suppliers-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.supplier-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  cursor: pointer;
  transition: background 0.2s;
  border-radius: 6px;
  padding: 10px 8px;
}

.supplier-row:hover {
  background: rgba(255, 255, 255, 0.04);
}

.supplier-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), var(--purple));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.supplier-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.supplier-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.supplier-nick {
  font-size: 11px;
  color: var(--text-muted);
}

.supplier-debt {
  font-size: 13px;
  font-weight: 700;
}

.supplier-debt.neg {
  color: var(--danger);
}

.supplier-debt.ok {
  color: var(--success);
}

.empty-state {
  text-align: center;
  padding: 32px 0;
  color: var(--text-muted);
}

.empty-state span {
  font-size: 36px;
  display: block;
  margin-bottom: 10px;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.view-all-btn {
  margin-top: 14px;
  width: 100%;
  padding: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: var(--font);
  transition: all 0.2s;
}

.confirm-btn {
  background: var(--success);
  color: white;
}

.confirm-btn:hover {
  background: #10b981;
  transform: scale(1.05);
}

.boost-btn {
  background: rgba(139, 92, 246, 0.15);
  color: #c4b5fd;
  border-color: rgba(139, 92, 246, 0.3);
}

.boost-btn:hover {
  background: rgba(139, 92, 246, 0.25);
  color: white;
}

@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .section-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .welcome-banner {
    flex-direction: column;
    align-items: flex-start;
  }

  .welcome-badge {
    display: none;
  }
}
</style>