// Форматирование валюты
export const formatCurrency = (value, currency = 'RUB') => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(value)
}

// Форматирование даты
export const formatDate = (dateString, options = {}) => {
  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
  
  return new Date(dateString).toLocaleDateString('ru-RU', { ...defaultOptions, ...options })
}

// Валидация email
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

// Обрезка текста
export const truncateText = (text, maxLength = 50) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Генерация уникального ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Форматирование числа с разделителями
export const formatNumber = (num) => {
  return new Intl.NumberFormat('ru-RU').format(num)
}

// Проверка на пустой объект
export const isEmptyObject = (obj) => {
  return Object.keys(obj).length === 0 && obj.constructor === Object
}

// Копирование в буфер обмена
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy text: ', err)
    return false
  }
}