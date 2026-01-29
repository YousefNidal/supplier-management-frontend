import axios from 'axios'
import { useAuthStore } from '../stores/auth'

// Определяем базовый URL в зависимости от окружения
const getBaseURL = () => {
  if (import.meta.env.DEV) {
    return '/api' // Для разработки используем прокси
  } else {
    // Для продакшена - используем реальный URL бэкенда
    // Замените на ваш реальный домен бэкенда из Vercel
    return 'https://supplier-management-backend.vercel.app/api'
  }
}

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000, // Увеличиваем таймаут для продакшена
  headers: {
    'Content-Type': 'application/json'
  }
})

// Интерцептор для добавления токена авторизации
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    
    // Если пользователь авторизован как продавец, добавляем токен
    if (authStore.token && !authStore.isGuestMode) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Интерцептор для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Ошибка от сервера
      console.error('API Error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.response.config.url
      })
      
      // Обработка ошибки авторизации
      if (error.response.status === 401) {
        const authStore = useAuthStore()
        
        // Если это не гость и не запрос на логин, показываем сообщение
        if (!authStore.isGuestMode && !error.response.config.url.includes('/login')) {
          console.error('Unauthorized access detected')
        }
      }
    } else if (error.request) {
      // Запрос был сделан, но ответ не получен
      console.error('Network Error:', error.request)
    } else {
      // Ошибка при настройке запроса
      console.error('Request Error:', error.message)
    }
    
    return Promise.reject(error)
  }
)

export default api