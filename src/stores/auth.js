import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../utils/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('auth_token') || null)
  const user = ref(JSON.parse(localStorage.getItem('auth_user')) || null)
  const isGuest = ref(localStorage.getItem('is_guest') === 'true' || false)

  // Seller profile data (persisted in localStorage)
  const sellerProfile = ref(JSON.parse(localStorage.getItem('seller_profile')) || {
    id: 1,
    name: 'Продавец',
    gameNickname: 'PlayerokUser',
    balance: 15000,
    email: '',
    phone: '',
    registeredAt: new Date().toISOString(),
    avatar: null,
    bio: ''
  })

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
        // Initialize profile from server data
        if (response.data.user) {
          sellerProfile.value = {
            ...sellerProfile.value,
            name: response.data.user.username || sellerProfile.value.name,
            gameNickname: response.data.user.gameNickname || sellerProfile.value.gameNickname
          }
        }
        localStorage.setItem('auth_token', token.value)
        localStorage.setItem('auth_user', JSON.stringify(user.value))
        localStorage.setItem('is_guest', 'false')
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

  // ── Profile Management ──────────────────────
  const updateProfile = (data) => {
    sellerProfile.value = { ...sellerProfile.value, ...data }
    localStorage.setItem('seller_profile', JSON.stringify(sellerProfile.value))
    return true
  }

  const updateBalance = (newBalance, reason) => {
    const old = sellerProfile.value.balance
    sellerProfile.value.balance = newBalance
    localStorage.setItem('seller_profile', JSON.stringify(sellerProfile.value))
    return { oldBalance: old, newBalance, reason }
  }

  const verifyAuth = async () => {
    if (isGuest.value) return true
    if (!token.value) return false
    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      const response = await api.get('/verify-auth')
      if (response.data.authenticated) return true
    } catch (error) {
      console.error('Auth verification error:', error)
    }
    logout()
    return false
  }

  const initialize = async () => {
    if (token.value && !isGuest.value) return await verifyAuth()
    return isGuest.value
  }

  return {
    token,
    user,
    isGuest,
    isAuthenticated,
    isSeller,
    isGuestMode,
    sellerProfile,
    login,
    logout,
    setGuestMode,
    updateProfile,
    updateBalance,
    verifyAuth,
    initialize
  }
})