<template>
  <div v-if="!isLoginPage" class="app-container">
    <el-container>
      <!-- Боковая панель навигации -->
      <el-aside width="200px" class="sidebar">
        <div class="logo">
          <h2>Supplier Manager</h2>
          <div class="user-info">
            <el-tag :type="userRoleTagType" size="small">
              {{ userRoleText }}
            </el-tag>
          </div>
        </div>
        <el-menu
          :default-active="activeMenu"
          class="el-menu-vertical"
          @select="handleMenuSelect"
          router
        >
          <el-menu-item index="/">
            <!-- <el-icon><House /></el-icon> -->
            <span>Главная</span>
          </el-menu-item>
          <el-menu-item index="/suppliers">
            <!-- <el-icon><User /></el-icon> -->
            <span>Поставщики</span>
          </el-menu-item>
          <el-menu-item 
            v-if="isSeller || isGuest" 
            index="/seller"
            :disabled="isGuest"
          >
            <!-- <el-icon><UserFilled /></el-icon> -->
            <span>Мой профиль</span>
            <el-tag v-if="isGuest" size="mini" type="info">только просмотр</el-tag>
          </el-menu-item>
          
          <el-divider />
          
          <el-menu-item v-if="!isGuest" @click="handleLogout">
            <!-- <el-icon><SwitchButton /></el-icon> -->
            <span>Выйти</span>
          </el-menu-item>
          <el-menu-item v-else @click="handleLoginRedirect">
            <!-- <el-icon><Login /></el-icon> -->
            <span>Войти как продавец</span>
          </el-menu-item>
        </el-menu>
        
        <div class="sidebar-footer">
          <div class="system-info">
            <p>База данных: SQLite</p>
            <p>Версия: 1.1.0</p>
            <p v-if="isGuest" class="guest-warning">
              <!-- <el-icon><Warning /></el-icon> -->
              Гостевой режим
            </p>
          </div>
        </div>
      </el-aside>

      <!-- Основное содержимое -->
      <el-container>
        <el-header class="main-header">
          <div class="header-content">
            <div class="breadcrumb">
              <el-breadcrumb separator="/">
                <el-breadcrumb-item :to="{ path: '/' }">Главная</el-breadcrumb-item>
                <el-breadcrumb-item v-if="$route.name !== 'Dashboard'">
                  {{ $route.name }}
                </el-breadcrumb-item>
              </el-breadcrumb>
            </div>
            <div class="header-actions">
              <el-button v-if="isGuest" type="warning" @click="handleLoginRedirect" size="small">
                <!-- <el-icon><Login /></el-icon> -->
                Войти
              </el-button>
              <el-button v-else type="info" @click="refreshData" size="small">
                <!-- <el-icon><Refresh /></el-icon> -->
                Обновить
              </el-button>
            </div>
          </div>
        </el-header>

        <el-main>
          <router-view />
        </el-main>

        <el-footer class="main-footer">
          <div class="footer-content">
            <span>© 2024 Supplier Management System</span>
            <span>{{ authInfo }}</span>
          </div>
        </el-footer>
      </el-container>
    </el-container>
  </div>
  
  <!-- Для страницы логина используем другой layout -->
  <router-view v-else />
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
// import { 
//   House, User, UserFilled, Refresh, SwitchButton, Login, Warning 
// } from '@element-plus/icons-vue'
import { useAuthStore } from './stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isLoginPage = computed(() => {
  return route.path === '/login'
})

const isSeller = computed(() => {
  return authStore.isSeller
})

const isGuest = computed(() => {
  return authStore.isGuestMode
})

const activeMenu = computed(() => {
  return route.path
})

const userRoleTagType = computed(() => {
  if (authStore.isSeller) return 'success'
  if (authStore.isGuestMode) return 'info'
  return 'warning'
})

const userRoleText = computed(() => {
  if (authStore.isSeller) return 'Продавец'
  if (authStore.isGuestMode) return 'Гость'
  return 'Неавторизован'
})

const authInfo = computed(() => {
  if (authStore.isSeller) return `Продавец: ${authStore.user?.username}`
  if (authStore.isGuestMode) return 'Режим гостя (только просмотр)'
  return ''
})

const handleMenuSelect = (index) => {
  console.log('Selected menu:', index)
}

const refreshData = () => {
  window.location.reload()
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      'Вы уверены, что хотите выйти?',
      'Подтверждение выхода',
      {
        confirmButtonText: 'Выйти',
        cancelButtonText: 'Отмена',
        type: 'warning',
      }
    )
    
    authStore.logout()
    router.push('/login')
  } catch (error) {
    // Пользователь отменил выход
  }
}

const handleLoginRedirect = () => {
  router.push('/login')
}

// Слушаем изменения аутентификации
watch(() => authStore.isAuthenticated, (newValue) => {
  if (!newValue && route.path !== '/login') {
    router.push('/login')
  }
})
</script>

<style scoped>
.app-container {
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  background: linear-gradient(180deg, #2c3e50 0%, #34495e 100%);
  color: white;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.logo {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo h2 {
  margin: 0 0 10px 0;
  color: white;
  font-size: 18px;
}

.user-info {
  margin-top: 10px;
}

.el-menu-vertical {
  border-right: none;
  flex: 1;
  background: transparent;
}

.el-menu-vertical :deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.8);
  height: 56px;
  line-height: 56px;
}

.el-menu-vertical :deep(.el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.1);
}

.el-menu-vertical :deep(.el-menu-item.is-active) {
  background-color: #409EFF;
  color: white;
}

.el-menu-vertical :deep(.el-menu-item.is-disabled) {
  opacity: 0.6;
  cursor: not-allowed;
}

.el-menu-vertical :deep(.el-menu-item .el-tag) {
  margin-left: 10px;
}

.el-menu-vertical :deep(.el-icon) {
  color: inherit;
}

.el-divider {
  margin: 10px 0;
  background-color: rgba(255, 255, 255, 0.1);
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.system-info p {
  margin: 5px 0;
}

.guest-warning {
  color: #ffcc00;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 10px;
}

.main-header {
  background: white;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.breadcrumb {
  flex: 1;
}

.header-actions {
  margin-left: 20px;
}

.el-main {
  padding: 20px;
  background-color: #f5f7fa;
  overflow-y: auto;
}

.main-footer {
  background: white;
  border-top: 1px solid #e6e6e6;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  font-size: 14px;
  color: #666;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

@media (max-width: 768px) {
  .sidebar {
    width: 60px;
  }
  
  .logo h2 {
    font-size: 14px;
  }
  
  .sidebar-footer {
    display: none;
  }
  
  .footer-content {
    flex-direction: column;
    text-align: center;
    gap: 5px;
  }
}
</style>