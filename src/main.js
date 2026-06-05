import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import './assets/main.css'
import App from './App.vue'
import router from './router'

// Создаем приложение
const app = createApp(App)
const pinia = createPinia()

// Регистрируем все иконки Element Plus
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// Используем Pinia, Element Plus и роутер
app.use(pinia)
app.use(ElementPlus)
app.use(router)

// Монтируем приложение
app.mount('#app')