import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../utils/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('auth_token') || null)
  const user = ref(JSON.parse(localStorage.getItem('auth_user')) || null)
  const isGuest = ref(localStorage.getItem('is_guest') === 'true' || false)

  const isAuthenticated = computed(() => {
    return !!token.value || isGuest.value
  })

  const isSeller = computed(() => {
    return user.value?.role === 'seller'
  })

  const isGuestMode = computed(() => {
    return isGuest.value
  })

  const login = async (username, password) => {
    try {
      const response = await api.post('/login', { username, password })
      
      if (response.data.success) {
        token.value = response.data.token
        user.value = response.data.user
        isGuest.value = false
        
        localStorage.setItem('auth_token', token.value)
        localStorage.setItem('auth_user', JSON.stringify(user.value))
        localStorage.setItem('is_guest', 'false')
        
        // Устанавливаем токен для всех последующих запросов
        api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
        
        return true
      }
    } catch (error) {
      console.error('Login error:', error)
    }
    
    return false
  }

  const logout = () => {
    token.value = null
    user.value = null
    isGuest.value = false
    
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('is_guest')
    
    delete api.defaults.headers.common['Authorization']
  }

  const setGuestMode = () => {
    isGuest.value = true
    token.value = null
    user.value = { username: 'guest', role: 'guest' }
    
    localStorage.setItem('is_guest', 'true')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    
    delete api.defaults.headers.common['Authorization']
  }

  const verifyAuth = async () => {
    if (isGuest.value) {
      return true
    }
    
    if (!token.value) {
      return false
    }

    try {
      // Устанавливаем токен для проверочного запроса
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      const response = await api.get('/verify-auth')
      
      if (response.data.authenticated) {
        return true
      }
    } catch (error) {
      console.error('Auth verification error:', error)
    }
    
    // Если проверка не удалась, разлогиниваем
    logout()
    return false
  }

  // Инициализация при загрузке
  const initialize = async () => {
    if (token.value && !isGuest.value) {
      return await verifyAuth()
    }
    return isGuest.value
  }

  return {
    token,
    user,
    isGuest,
    isAuthenticated,
    isSeller,
    isGuestMode,
    login,
    logout,
    setGuestMode,
    verifyAuth,
    initialize
  }
})