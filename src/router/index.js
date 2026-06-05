import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// const r = [
//   {
//     path:'/login',
//     name:'Lol',
//     component: () => import('../views/Login.vue'),
//     meta: {requiresAuth:false, hideSidebar:true}
//   }
// ]

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false, hideSidebar: true }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/suppliers',
    name: 'Suppliers',
    component: () => import('../views/Suppliers.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/suppliers/:id/orders',
    name: 'SupplierOrders',
    component: () => import('../views/SupplierOrders.vue'),
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/seller',
    name: 'SellerProfile',
    component: () => import('../views/SellerProfile.vue'),
    meta: { requiresAuth: true, requiresSeller: true }
  },
  {
    path: '/chats',
    name: 'Chats',
    component: () => import('../views/Chats.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/products',
    name: 'MyProducts',
    component: () => import('../views/MyProducts.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Навигационный гард
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Инициализируем аутентификацию при первом посещении
  if (!authStore.isAuthenticated && to.path !== '/login') {
    await authStore.initialize()
  }
  
  // Если требуется аутентификация
  if (to.meta.requiresAuth) {
    if (authStore.isAuthenticated) {
      // Проверяем, требует ли маршрут прав продавца
      if (to.meta.requiresSeller && !authStore.isSeller && !authStore.isGuestMode) {
        next('/login')
      } else {
        next()
      }
    } else {
      next('/login')
    }
  } else {
    // Если пользователь уже авторизован и пытается зайти на логин
    if (to.path === '/login' && authStore.isAuthenticated) {
      next('/')
    } else {
      next()
    }
  }
})

export default router