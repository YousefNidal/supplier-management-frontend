<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>Supplier Management</h1>
        <p>Войдите в систему для управления поставщиками</p>
      </div>
      
      <div class="login-form">
        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          label-position="top"
          @keyup.enter="handleLogin"
        >
          <el-form-item label="Логин" prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="Введите логин"
              size="large"
              :prefix-icon="User"
            />
          </el-form-item>
          
          <el-form-item label="Пароль" prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="Введите пароль"
              size="large"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>
          
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              @click="handleLogin"
              style="width: 100%"
            >
              Войти
            </el-button>
          </el-form-item>
          
          <div class="guest-access">
            <el-divider>
              <span class="divider-text">или</span>
            </el-divider>
            <el-button
              type="info"
              size="large"
              @click="enterAsGuest"
              style="width: 100%"
            >
              Продолжить как гость
            </el-button>
            <p class="guest-note">Гостевой доступ позволяет просматривать информацию без возможности изменений</p>
          </div>
        </el-form>
      </div>
      
      
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
// import { User, Lock, InfoFilled } from '../utils/icons'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: 'Пожалуйста, введите логин', trigger: 'blur' }
  ],
  password: [
    { required: true, message: 'Пожалуйста, введите пароль', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
    loading.value = true
    
    const success = await authStore.login(loginForm.username, loginForm.password)
    
    if (success) {
      ElMessage.success('Успешный вход!')
      router.push('/')
    } else {
      ElMessage.error('Неверные учетные данные')
    }
  } catch (error) {
    console.error('Login error:', error)
    ElMessage.error('Ошибка входа. Проверьте соединение.')
  } finally {
    loading.value = false
  }
}

const enterAsGuest = () => {
  authStore.setGuestMode()
  ElMessage.info('Вы вошли в режиме гостя. Только просмотр.')
  router.push('/')
}

// Проверяем, если уже авторизован, перенаправляем на главную
onMounted(() => {
  if (authStore.isAuthenticated) {
    router.push('/')
  }
})
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 450px;
  padding: 40px;
  animation: slideUp 0.5s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-header h1 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 28px;
  font-weight: 600;
}

.login-header p {
  margin: 0;
  color: #7f8c8d;
  font-size: 16px;
}

.login-form {
  margin-bottom: 30px;
}

.guest-access {
  margin-top: 20px;
}

.divider-text {
  color: #95a5a6;
  font-size: 14px;
  padding: 0 15px;
  background: white;
}

.guest-note {
  margin-top: 15px;
  color: #7f8c8d;
  font-size: 13px;
  text-align: center;
  line-height: 1.4;
}

.login-footer {
  border-top: 1px solid #ecf0f1;
  padding-top: 20px;
  text-align: center;
}

.credentials-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #34495e;
  font-size: 14px;
  margin: 0;
}

.credentials-info .el-icon {
  color: #3498db;
}

@media (max-width: 480px) {
  .login-card {
    padding: 30px 20px;
  }
  
  .login-header h1 {
    font-size: 24px;
  }
  
  .login-header p {
    font-size: 14px;
  }
}
</style>