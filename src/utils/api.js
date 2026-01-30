import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.DEV ? '/api' : 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Интерцептор для добавления токена авторизации (если понадобится)
api.interceptors.request.use(
  config => {
    // Здесь можно добавить токен авторизации
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Интерцептор для обработки ошибок
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // Ошибка от сервера
      console.error('API Error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.response.config.url
      })
      
      // Можно добавить обработку определенных статусов
      if (error.response.status === 401) {
        // Обработка неавторизованного доступа
        // localStorage.removeItem('token')
        // window.location.href = '/login'
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