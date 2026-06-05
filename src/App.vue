<template>
  <div v-if="!isLoginPage" class="app-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="logo-icon">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#lg1)" />
            <path d="M10 22L16 10L22 22" stroke="white" stroke-width="2.5" stroke-linecap="round"
              stroke-linejoin="round" />
            <circle cx="16" cy="17" r="2" fill="white" />
            <defs>
              <linearGradient id="lg1" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                <stop stop-color="#3b82f6" />
                <stop offset="1" stop-color="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div class="logo-text">
          <span class="logo-name">PlayerokSeller</span>
          <el-tag :type="userTagType" size="small" class="role-tag">{{ userRoleText }}</el-tag>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Главная</span>
        </router-link>

        <router-link to="/suppliers" class="nav-item" :class="{ active: $route.path === '/suppliers' }">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>Поставщики</span>
        </router-link>

        <router-link v-if="isSeller || isGuest" to="/seller" class="nav-item"
          :class="{ active: $route.path === '/seller', disabled: isGuest }"
          @click.prevent="isGuest ? null : $router.push('/seller')">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Мой профиль</span>
          <el-tag v-if="isGuest" size="small" type="info" class="nav-badge">гость</el-tag>
        </router-link>

        <router-link to="/products" class="nav-item" :class="{ active: $route.path === '/products' }">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path
              d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
          </svg>
          <span>Мои товары</span>
        </router-link>

        <router-link to="/chats" class="nav-item" :class="{ active: $route.path === '/chats' }">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>Чаты</span>
        </router-link>
      </nav>

      <!-- Divider -->
      <div class="sidebar-divider"></div>

      <!-- Bottom actions -->
      <div class="sidebar-bottom">
        <button v-if="!isGuest" class="nav-item logout-btn" @click="handleLogout">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Выйти</span>
        </button>
        <button v-else class="nav-item" @click="$router.push('/login')">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          <span>Войти как продавец</span>
        </button>
        <div class="sidebar-footer-info">
          <span>v2.0.0</span>
        </div>
      </div>
    </aside>

    <!-- 3D Atmosphere -->
    <ThreeDBackground />

    <!-- Orbiting Glass Shards -->
    <div class="glass-shard shard-orbit" style="top:20%; left:10%; width:40px; height:40px; animation-duration: 25s;">
    </div>
    <div class="glass-shard shard-orbit"
      style="top:70%; left:85%; width:60px; height:60px; animation-duration: 35s; animation-delay: -5s;"></div>
    <div class="glass-shard shard-orbit"
      style="top:40%; left:50%; width:30px; height:30px; animation-duration: 18s; animation-delay: -2s;"></div>

    <!-- Main content -->
    <div class="main-wrapper">
      <!-- Header -->
      <header class="top-header">
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">Главная</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.name && $route.name !== 'Dashboard'">
              {{ $route.name }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <div v-if="isGuest" class="guest-badge">
            <svg viewBox="0 0 16 16" fill="currentColor" style="width:13px;height:13px;margin-right:5px;">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM0 8a8 8 0 1116 0A8 8 0 010 8z" />
              <path
                d="M8.93 6.588l-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
            Гостевой режим
          </div>
          <button class="header-btn" @click="toggleTheme" :title="isDark ? 'Светлая тема' : 'Темная тема'">
            <svg v-if="isDark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </button>
          <button class="header-btn" @click="refreshData" title="Обновить">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
        </div>
      </header>

      <!-- Page content -->
      <main class="page-content">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>

  <!-- Login page layout -->
  <router-view v-else />
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useAuthStore } from './stores/auth'
import ThreeDBackground from './components/ThreeDBackground.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isLoginPage = computed(() => route.path === '/login')
const isSeller = computed(() => authStore.isSeller)
const isGuest = computed(() => authStore.isGuestMode)

const userTagType = computed(() => {
  if (authStore.isSeller) return 'success'
  if (authStore.isGuestMode) return 'info'
  return 'warning'
})

const userRoleText = computed(() => {
  if (authStore.isSeller) return 'Продавец'
  if (authStore.isGuestMode) return 'Гость'
  return 'Пользователь'
})

const isDark = ref(localStorage.getItem('theme') !== 'light')

const toggleTheme = () => {
  isDark.value = !isDark.value
  const theme = isDark.value ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
}

// Set initial theme
onMounted(() => {
  const savedTheme = localStorage.getItem('theme') || 'dark'
  document.documentElement.setAttribute('data-theme', savedTheme)
  isDark.value = savedTheme === 'dark'
})

const refreshData = () => {
  window.location.reload()
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      'Вы уверены, что хотите выйти?',
      'Подтверждение',
      { confirmButtonText: 'Выйти', cancelButtonText: 'Отмена', type: 'warning' }
    )
    authStore.logout()
    router.push('/login')
    ElMessage.success('Вы вышли из системы')
  } catch { }
}
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* ── SIDEBAR ─────────────────────────── */
.sidebar {
  width: 240px;
  min-width: 240px;
  display: flex;
  flex-direction: column;
  background: rgba(10, 15, 28, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 4px 0 30px rgba(0, 0, 0, 0.4);
  z-index: 20;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%);
}

.logo-icon svg {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.logo-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.logo-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.role-tag {
  font-size: 11px !important;
}

/* ── NAV ─────────────────────────────── */
.sidebar-nav {
  flex: 1;
  padding: 16px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  position: relative;
}

.nav-item:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
  transform: translateX(3px);
}

.nav-item.active {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.05) 100%);
  color: #93c5fd;
  border-left: 3px solid var(--accent);
  padding-left: 11px;
}

.nav-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.nav-badge {
  margin-left: auto;
}

.sidebar-divider {
  height: 1px;
  margin: 0 16px;
  background: rgba(255, 255, 255, 0.05);
}

.sidebar-bottom {
  padding: 16px 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.logout-btn {
  color: rgba(239, 68, 68, 0.8);
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.1) !important;
  color: var(--danger) !important;
}

.sidebar-footer-info {
  text-align: center;
  font-size: 11px;
  color: var(--text-muted);
  padding: 8px 0 0;
}

/* ── MAIN AREA ───────────────────────── */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  height: 58px;
  min-height: 58px;
  background: rgba(10, 15, 28, 0.6);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.guest-badge {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--text-muted);
  background: rgba(148, 163, 184, 0.08);
  padding: 5px 12px;
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.header-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.header-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 28px;
}

/* ── PAGE TRANSITIONS ────────────────── */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ── BREADCRUMB ──────────────────────── */
:deep(.el-breadcrumb__inner) {
  color: var(--text-muted) !important;
  font-size: 13px;
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: var(--text-secondary) !important;
  font-weight: 500;
}

@media (max-width: 768px) {
  .sidebar {
    width: 64px;
    min-width: 64px;
  }

  .logo-text,
  .nav-item span,
  .sidebar-footer-info {
    display: none;
  }

  .logo-icon {
    margin: auto;
  }

  .sidebar-logo {
    justify-content: center;
    padding: 16px;
  }

  .nav-item {
    justify-content: center;
    padding: 12px;
  }

  .page-content {
    padding: 16px;
  }
}
</style>