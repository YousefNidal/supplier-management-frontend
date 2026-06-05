<template>
  <div class="supplier-orders">
    <!-- Хедер с информацией о поставщике -->
    <div class="supplier-header">
      <el-page-header @back="goBack" title="Назад к поставщикам">
        <template #content>
          <div class="header-content">
            <h1>{{ supplier.name }}</h1>
            <p class="supplier-info">
              <span>Игровой ник: {{ supplier.gameNickname }}</span>
              <span class="debt-info">
                Общая задолженность: 
                <span class="debt-amount">{{ formatCurrency(supplier.debt) }}</span>
              </span>
              <span>Активных заказов: {{ supplier.ordersCount }}</span>
            </p>
          </div>
        </template>
      </el-page-header>
      
      <div class="header-actions">
        <el-button 
          v-if="!isGuest" 
          type="success" 
          @click="showAddOrderDialog = true"
        >
          Добавить заказ
        </el-button>
        <el-button type="info" @click="loadOrders">
          Обновить
        </el-button>
      </div>
    </div>

    <!-- Гостевой режим уведомление -->
    <div v-if="isGuest" class="guest-notice">
      <el-alert
        title="Гостевой режим"
        type="info"
        description="Вы просматриваете заказы в режиме гостя. Для внесения изменений войдите как продавец."
        show-icon
        closable
        @close="closeGuestNotice"
      >
        <template #action>
          <el-button type="primary" size="small" @click="goToLogin">
            Войти как продавец
          </el-button>
        </template>
      </el-alert>
    </div>

    <!-- Статистика заказов -->
    <div class="orders-stats">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-statistic title="Всего заказов" :value="stats.totalOrders" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="Общая стоимость" :value="stats.totalCost" :precision="2">
            <template #suffix>₽</template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="Общий премиум" :value="stats.totalPremium" :precision="2">
            <template #suffix>₽</template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="Общая задолженность" :value="stats.totalDebt" :precision="2">
            <template #suffix>₽</template>
          </el-statistic>
        </el-col>
      </el-row>
    </div>

    <!-- Фильтры и поиск -->
    <div class="orders-filters">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-input
            v-model="searchQuery"
            placeholder="Поиск по описанию..."
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="8">
          <el-select
            v-model="statusFilter"
            placeholder="Фильтр по статусу"
            clearable
            style="width: 100%"
          >
            <el-option label="Активные" value="active" />
            <el-option label="Завершенные" value="completed" />
            <el-option label="Отмененные" value="cancelled" />
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-select
            v-model="sortBy"
            placeholder="Сортировка"
            style="width: 100%"
          >
            <el-option label="Дата создания (новые)" value="newest" />
            <el-option label="Дата создания (старые)" value="oldest" />
            <el-option label="Стоимость (дорогие)" value="cost_high" />
            <el-option label="Стоимость (дешевые)" value="cost_low" />
            <el-option label="Задолженность (большая)" value="debt_high" />
            <el-option label="Задолженность (маленькая)" value="debt_low" />
          </el-select>
        </el-col>
      </el-row>
    </div>

    <!-- Сетка заказов -->
    <div class="orders-grid">
      <div v-if="filteredOrders.length === 0" class="empty-state">
        <el-empty description="Нет заказов для этого поставщика">
          <el-button v-if="!isGuest" type="primary" @click="showAddOrderDialog = true">
            Добавить первый заказ
          </el-button>
          <el-button v-else type="info" disabled>
            Войдите как продавец для добавления заказов
          </el-button>
        </el-empty>
      </div>

      <div v-else class="orders-list">
        <el-row :gutter="20">
          <el-col 
            v-for="order in paginatedOrders" 
            :key="order.id" 
            :xs="24" 
            :sm="12" 
            :md="8" 
            :lg="6"
            :xl="6"
          >
            <OrderCard 
              :order="order" 
              :is-guest="isGuest"
              @edit="editOrder"
              @delete="deleteOrder"
              @status-change="changeOrderStatus"
              @split="splitOrder"
            />
          </el-col>
        </el-row>
      </div>

      <!-- Пагинация -->
      <div v-if="filteredOrders.length > 0" class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[8, 16, 24, 32]"
          :total="filteredOrders.length"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </div>

    <!-- Диалог добавления/редактирования заказа (только для продавца) -->
    <el-dialog 
      v-if="!isGuest"
      v-model="showAddOrderDialog" 
      :title="isEditing ? 'Редактирование заказа' : 'Добавление нового заказа'" 
      width="600px"
      @close="resetDialog"
    >
      <el-form 
        ref="orderFormRef" 
        :model="orderForm" 
        :rules="orderRules" 
        label-width="150px"
        label-position="top"
      >
        <el-form-item label="Изображение заказа" prop="imageUrl">
          <div class="image-upload-container">
            <div v-if="orderForm.imageUrl" class="image-preview">
              <img :src="orderForm.imageUrl" alt="Preview" class="preview-image" />
              <div class="image-overlay">
                <el-button type="danger" size="small" @click="orderForm.imageUrl = ''">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
            <div v-else class="image-upload-placeholder">
              <el-icon size="50"><Picture /></el-icon>
              <p>Нажмите для загрузки изображения</p>
            </div>
            <el-input
              v-model="orderForm.imageUrl"
              placeholder="Введите URL изображения или загрузите файл"
              class="image-url-input"
            >
              <template #append>
                <el-button @click="showImageUrlInput = !showImageUrlInput">
                  <el-icon><Link /></el-icon>
                </el-button>
              </template>
            </el-input>
            <div v-if="showImageUrlInput" class="image-tips">
              <p class="tip-title">Примеры URL изображений:</p>
              <ul class="tip-list">
                <li>https://picsum.photos/300/200</li>
                <li>https://picsum.photos/seed/order1/300/200</li>
                <li>https://via.placeholder.com/300x200</li>
              </ul>
            </div>
          </div>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Стоимость заказа (₽)" prop="cost">
              <el-input-number
                v-model="orderForm.cost"
                :precision="2"
                :step="100"
                :min="0"
                :max="1000000"
                style="width: 100%"
                placeholder="Введите стоимость"
                @change="recalculateDebt"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Премиум (₽)" prop="premium">
              <el-input-number
                v-model="orderForm.premium"
                :precision="2"
                :step="50"
                :min="0"
                :max="50000"
                style="width: 100%"
                placeholder="Дополнительная плата"
                @change="recalculateDebt"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Расчет задолженности">
          <div class="debt-calculation">
            <div class="calculation-row">
              <span>Стоимость заказа:</span>
              <span class="calculation-value">{{ formatCurrency(orderForm.cost) }}</span>
            </div>
            <div v-if="!orderForm.isSplit" class="calculation-row">
              <span>Вычитаем 30% (ваша комиссия):</span>
              <span class="calculation-value minus">-{{ formatCurrency(orderForm.cost * 0.3) }}</span>
            </div>
            <div class="calculation-row">
              <span>Вычитаем премиум:</span>
              <span class="calculation-value minus">-{{ formatCurrency(orderForm.premium) }}</span>
            </div>
            <div class="calculation-row total">
              <span>Задолженность поставщику:</span>
              <span class="calculation-value total-value">
                {{ formatCurrency(calculateDebt()) }}
              </span>
            </div>
            <div class="calculation-explanation">
              <small v-if="!orderForm.isSplit">
                Формула: <strong>Стоимость - 30% - Премиум = Задолженность</strong>
              </small>
              <small v-else>
                <strong>Формула для разделенного заказа:</strong>
                <br><strong>(Стоимость / 2) - (Премиум / 2) = Задолженность</strong>
                <br><em>При создании разделенного заказа введите полную стоимость и премиум.</em>
                <br><em>Система автоматически разделит их пополам при сохранении.</em>
              </small>
              <br>
              <small>Это сумма, которую вы должны заплатить поставщику</small>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="Разделить заказ пополам">
          <el-switch
            v-model="orderForm.isSplit"
            active-text="Да"
            inactive-text="Нет"
            @change="handleSplitToggle"
          />
        </el-form-item>

        <el-form-item v-if="orderForm.isSplit" label="Разделить с кем?" prop="splitWith">
          <el-input
            v-model="orderForm.splitWith"
            placeholder="Введите ник продавца для разделения"
            clearable
          />
          <div class="split-explanation">
            <small>При разделении заказа пополам:</small>
            <ul>
              <li>Полная стоимость: {{ formatCurrency(orderForm.cost) }}</li>
              <li>Полный премиум: {{ formatCurrency(orderForm.premium) }}</li>
              <li>После разделения (на каждого):</li>
              <li>• Стоимость: {{ formatCurrency(orderForm.cost / 2) }}</li>
              <li>• Премиум: {{ formatCurrency(orderForm.premium / 2) }}</li>
              <li>• Задолженность: {{ formatCurrency((orderForm.cost / 2) - (orderForm.premium / 2)) }}</li>
            </ul>
          </div>
        </el-form-item>

        <el-form-item label="Статус заказа" v-if="isEditing">
          <el-select v-model="orderForm.status" style="width: 100%">
            <el-option label="Активный" value="active" />
            <el-option label="Завершенный" value="completed" />
            <el-option label="Отмененный" value="cancelled" />
          </el-select>
        </el-form-item>

        <el-form-item label="Примечания">
          <el-input
            v-model="orderForm.notes"
            type="textarea"
            :rows="3"
            placeholder="Дополнительная информация о заказе"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddOrderDialog = false">Отмена</el-button>
          <el-button 
            type="primary" 
            @click="submitOrderForm"
            :loading="submitting"
          >
            {{ isEditing ? 'Обновить' : 'Добавить' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Диалог разделения заказа пополам -->
    <el-dialog
      v-model="showSplitDialog"
      title="Разделить заказ пополам"
      width="500px"
    >
      <el-form :model="splitForm" label-width="150px">
        <el-form-item label="Стоимость заказа">
          <el-input :value="formatCurrency(currentOrder?.cost)" readonly />
        </el-form-item>
        
        <el-form-item label="Премиум">
          <el-input :value="formatCurrency(currentOrder?.premium)" readonly />
        </el-form-item>
        
        <el-form-item label="После разделения">
          <div class="split-calculation">
            <div class="split-row">
              <span>Полная стоимость:</span>
              <span class="split-value">{{ formatCurrency(currentOrder?.cost) }}</span>
            </div>
            <div class="split-row">
              <span>Полный премиум:</span>
              <span class="split-value">{{ formatCurrency(currentOrder?.premium) }}</span>
            </div>
            <div class="split-row">
              <span>Стоимость (половина):</span>
              <span class="split-value">{{ formatCurrency(currentOrder?.cost / 2) }}</span>
            </div>
            <div class="split-row">
              <span>Премиум (половина):</span>
              <span class="split-value">{{ formatCurrency(currentOrder?.premium / 2) }}</span>
            </div>
            <div class="split-row total">
              <span>Задолженность (половина):</span>
              <span class="split-value total">
                <!-- ИСПРАВЛЕННЫЙ РАСЧЕТ: (стоимость/2) - (премиум/2) -->
                {{ formatCurrency((currentOrder?.cost / 2) - (currentOrder?.premium / 2)) }}
              </span>
            </div>
            <div class="calculation-example" v-if="currentOrder">
              <small>Пример расчета:</small>
              <small>Формула: <strong>(Стоимость / 2) - (Премиум / 2)</strong></small>
              <small>{{ formatCurrency(currentOrder.cost) }} / 2 - {{ formatCurrency(currentOrder.premium) }} / 2 =</small>
              <small>{{ formatCurrency(currentOrder.cost / 2) }} - {{ formatCurrency(currentOrder.premium / 2) }} =</small>
              <small><strong>{{ formatCurrency((currentOrder.cost / 2) - (currentOrder.premium / 2)) }}</strong></small>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="Разделить с кем?" prop="splitWith" required>
          <el-input
            v-model="splitForm.splitWith"
            placeholder="Введите ник продавца для разделения"
            clearable
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showSplitDialog = false">Отмена</el-button>
          <el-button 
            type="warning" 
            @click="confirmSplit"
            :loading="splitting"
          >
            Разделить пополам
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Delete, Picture, Link } from '@element-plus/icons-vue'
import OrderCard from '../components/OrderCard.vue'
import api from '../utils/api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Проверка режима
const isGuest = computed(() => {
  return authStore.isGuestMode
})

// Данные
const supplier = ref({
  id: null,
  name: '',
  gameNickname: '',
  debt: 0,
  ordersCount: 0
})

const orders = ref([])
const loading = ref(false)

// Фильтры и пагинация
const searchQuery = ref('')
const statusFilter = ref('')
const sortBy = ref('newest')
const currentPage = ref(1)
const pageSize = ref(8)

// Диалоги
const showAddOrderDialog = ref(false)
const showSplitDialog = ref(false)
const isEditing = ref(false)
const showImageUrlInput = ref(false)
const submitting = ref(false)
const splitting = ref(false)

// Текущий заказ для операций
const currentOrder = ref(null)

// Формы
const orderFormRef = ref(null)
const orderForm = reactive({
  id: null,
  imageUrl: 'https://picsum.photos/300/200',
  cost: 1000,
  premium: 100,
  status: 'active',
  notes: '',
  isSplit: false,
  splitWith: ''
})

const splitForm = reactive({
  splitWith: ''
})

const orderRules = {
  imageUrl: [
    { required: true, message: 'Пожалуйста, добавьте изображение', trigger: 'blur' },
    { type: 'url', message: 'Пожалуйста, введите корректный URL', trigger: 'blur' }
  ],
  cost: [
    { required: true, message: 'Пожалуйста, введите стоимость', trigger: 'blur' },
    { type: 'number', min: 0, message: 'Стоимость не может быть отрицательной', trigger: 'blur' }
  ],
  premium: [
    { type: 'number', min: 0, message: 'Премиум не может быть отрицательным', trigger: 'blur' }
  ]
}

// Вычисляемые свойства
const filteredOrders = computed(() => {
  let filtered = orders.value

  // Фильтрация по поиску
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(order => 
      order.notes?.toLowerCase().includes(query) ||
      (order.createdAt && order.createdAt.toLowerCase().includes(query))
    )
  }

  // Фильтрация по статусу
  if (statusFilter.value) {
    filtered = filtered.filter(order => order.status === statusFilter.value)
  }

  // Сортировка
  filtered = [...filtered].sort((a, b) => {
    switch (sortBy.value) {
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt)
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt)
      case 'cost_high':
        return b.cost - a.cost
      case 'cost_low':
        return a.cost - b.cost
      case 'debt_high':
        return b.debtAmount - a.debtAmount
      case 'debt_low':
        return a.debtAmount - b.debtAmount
      default:
        return new Date(b.createdAt) - new Date(a.createdAt)
    }
  })

  return filtered
})

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredOrders.value.slice(start, end)
})

const stats = computed(() => {
  const totalOrders = orders.value.length
  const totalCost = orders.value.reduce((sum, order) => sum + order.cost, 0)
  const totalPremium = orders.value.reduce((sum, order) => sum + order.premium, 0)
  const totalDebt = orders.value.reduce((sum, order) => sum + order.debtAmount, 0)

  return {
    totalOrders,
    totalCost,
    totalPremium,
    totalDebt
  }
})

// Методы
const formatCurrency = (value) => {
  if (value === undefined || value === null) return '0 ₽'
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

const formatDate = (dateString) => {
  if (!dateString) return 'Нет даты'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return dateString
  }
}

// ИСПРАВЛЕННЫЙ РАСЧЕТ ЗАДОЛЖЕННОСТИ
const calculateDebt = () => {
  if (orderForm.isSplit) {
    // Для разделенных заказов: (стоимость/2) - (премиум/2)
    // При создании пользователь вводит полную стоимость
    return (orderForm.cost / 2) - (orderForm.premium / 2)
  } else {
    // Для обычных заказов: стоимость - 30% - премиум
    return orderForm.cost - (orderForm.cost * 0.3) - orderForm.premium
  }
}

const recalculateDebt = () => {
  // Метод вызывается при изменении стоимости или премиума
  // Обновляем расчет в реальном времени
}

const loadSupplier = async () => {
  try {
    const supplierId = route.params.id
    const response = await api.get(`/suppliers/${supplierId}`)
    supplier.value = response.data
    console.log('Загружен поставщик:', supplier.value)
  } catch (error) {
    console.error('Error loading supplier:', error)
    ElMessage.error('Ошибка загрузки информации о поставщике')
    router.push('/suppliers')
  }
}

const loadOrders = async () => {
  loading.value = true
  try {
    const supplierId = route.params.id
    const response = await api.get(`/suppliers/${supplierId}/orders`)
    orders.value = response.data
    console.log('Загружено заказов:', orders.value.length)
    
    // Перезагружаем информацию о поставщике для обновления счетчиков
    await loadSupplier()
  } catch (error) {
    console.error('Error loading orders:', error)
    ElMessage.error('Ошибка загрузки заказов')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/suppliers')
}

const editOrder = (order) => {
  if (isGuest.value) {
    ElMessage.warning('Редактирование доступно только авторизованным продавцам')
    return
  }
  
  isEditing.value = true
  
  // Если заказ разделен, показываем полную стоимость (а не половину)
  // для удобства редактирования
  let displayCost = order.cost
  let displayPremium = order.premium
  
  if (order.isSplit) {
    // Разделенный заказ хранит половину стоимости, но для редактирования
    // показываем полную стоимость (удваиваем)
    displayCost = order.cost * 2
    displayPremium = order.premium * 2
  }
  
  Object.assign(orderForm, {
    id: order.id,
    imageUrl: order.imageUrl,
    cost: displayCost,
    premium: displayPremium,
    status: order.status,
    notes: order.notes || '',
    isSplit: order.isSplit || false,
    splitWith: order.splitWith || ''
  })
  showAddOrderDialog.value = true
}

const splitOrder = (order) => {
  if (isGuest.value) {
    ElMessage.warning('Разделение доступно только авторизованным продавцам')
    return
  }
  
  if (order.isSplit) {
    ElMessage.warning('Этот заказ уже разделен')
    return
  }
  
  if (order.status !== 'active') {
    ElMessage.warning('Можно разделить только активные заказы')
    return
  }
  
  currentOrder.value = order
  splitForm.splitWith = ''
  showSplitDialog.value = true
  
  // Показываем пример расчета
  console.log('Пример расчета для разделения:')
  console.log(`Стоимость: ${order.cost}, Премиум: ${order.premium}`)
  console.log(`Расчет: (${order.cost}/2) - (${order.premium}/2) = ${order.cost/2} - ${order.premium/2} = ${(order.cost/2) - (order.premium/2)}`)
  
  // Показываем информационное сообщение пользователю
  ElMessage.info({
    message: `Заказ будет разделен пополам:
      Полная стоимость: ${formatCurrency(order.cost)}
      Полный премиум: ${formatCurrency(order.premium)}
      Задолженность за половину: ${formatCurrency((order.cost / 2) - (order.premium / 2))}`,
    duration: 8000,
    showClose: true
  })
}

const confirmSplit = async () => {
  if (!splitForm.splitWith.trim()) {
    ElMessage.warning('Пожалуйста, укажите, с кем разделить заказ')
    return
  }
  
  splitting.value = true
  try {
    const response = await api.post(`/orders/${currentOrder.value.id}/split`, {
      splitWith: splitForm.splitWith
    })
    
    const halfCost = currentOrder.value.cost / 2
    const halfPremium = currentOrder.value.premium / 2
    const halfDebt = halfCost - halfPremium
    
    ElMessage.success({
      message: `Заказ успешно разделен пополам!
        Стоимость (половина): ${formatCurrency(halfCost)}
        Премиум (половина): ${formatCurrency(halfPremium)}
        Задолженность (половина): ${formatCurrency(halfDebt)}`,
      duration: 6000,
      showClose: true
    })
    
    showSplitDialog.value = false
    await loadOrders()
  } catch (error) {
    console.error('Error splitting order:', error)
    ElMessage.error('Ошибка при разделении заказа')
  } finally {
    splitting.value = false
  }
}

const deleteOrder = async (order) => {
  if (isGuest.value) {
    ElMessage.warning('Удаление доступно только авторизованным продавцам')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `Вы уверены, что хотите удалить заказ от ${formatDate(order.createdAt)}?`,
      'Подтверждение удаления',
      {
        confirmButtonText: 'Удалить',
        cancelButtonText: 'Отмена',
        type: 'warning',
      }
    )
    
    await api.delete(`/orders/${order.id}`)
    await loadOrders() // Обновляем данные
    ElMessage.success('Заказ успешно удален')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting order:', error)
      ElMessage.error('Ошибка удаления заказа')
    }
  }
}

const changeOrderStatus = async (order, newStatus) => {
  if (isGuest.value) {
    ElMessage.warning('Изменение статуса доступно только авторизованным продавцам')
    return
  }
  
  try {
    await api.put(`/orders/${order.id}`, {
      ...order,
      status: newStatus
    })
    
    await loadOrders() // Обновляем все данные
    ElMessage.success(`Статус заказа изменен на "${newStatus === 'active' ? 'Активный' : newStatus === 'completed' ? 'Завершенный' : 'Отмененный'}"`)
  } catch (error) {
    console.error('Error changing order status:', error)
    ElMessage.error('Ошибка изменения статуса заказа')
  }
}

const handleSplitToggle = (value) => {
  if (!value) {
    orderForm.splitWith = ''
  } else {
    // При включении разделения показываем предупреждение
    ElMessage.info({
      message: 'При создании разделенного заказа введите полную стоимость и премиум. Система автоматически разделит их пополам.',
      duration: 5000,
      showClose: true
    })
  }
  recalculateDebt()
}

const resetDialog = () => {
  isEditing.value = false
  orderForm.id = null
  orderForm.imageUrl = 'https://picsum.photos/300/200'
  orderForm.cost = 1000
  orderForm.premium = 100
  orderForm.status = 'active'
  orderForm.notes = ''
  orderForm.isSplit = false
  orderForm.splitWith = ''
  
  if (orderFormRef.value) {
    orderFormRef.value.resetFields()
  }
}

const submitOrderForm = async () => {
  if (isGuest.value) {
    ElMessage.warning('Добавление заказов доступно только авторизованным продавцам')
    return
  }
  
  if (!orderFormRef.value) return
  
  try {
    await orderFormRef.value.validate()
    submitting.value = true
    
    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Правильная подготовка данных
    let costToSend = orderForm.cost
    let premiumToSend = orderForm.premium
    
    if (orderForm.isSplit) {
      // Для разделенных заказов:
      // 1. Если это редактирование и заказ уже был разделен, 
      //    то orderForm содержит полную стоимость
      if (isEditing.value) {
        // Проверяем, был ли оригинальный заказ разделенным
        const originalOrder = orders.value.find(o => o.id === orderForm.id)
        if (originalOrder && originalOrder.isSplit) {
          // Заказ уже разделен, пользователь отредактировал полную стоимость
          // Делим на 2 для сохранения
          costToSend = orderForm.cost / 2
          premiumToSend = orderForm.premium / 2
        } else {
          // Заказ не был разделен, пользователь хочет сделать его разделенным
          // Делим на 2 для сохранения
          costToSend = orderForm.cost / 2
          premiumToSend = orderForm.premium / 2
        }
      } else {
        // Для нового разделенного заказа: делим введенные значения на 2
        costToSend = orderForm.cost / 2
        premiumToSend = orderForm.premium / 2
      }
    }
    
    const orderData = {
      supplierId: supplier.value.id,
      imageUrl: orderForm.imageUrl,
      cost: costToSend,
      premium: premiumToSend,
      notes: orderForm.notes,
      status: orderForm.status,
      isSplit: orderForm.isSplit,
      splitWith: orderForm.splitWith
    }
    
    console.log('Отправка данных заказа:', orderData)
    console.log('Исходные данные:', {
      isSplit: orderForm.isSplit,
      originalCost: orderForm.cost,
      originalPremium: orderForm.premium,
      sendingCost: costToSend,
      sendingPremium: premiumToSend,
      expectedDebt: calculateDebt()
    })
    
    if (isEditing.value) {
      await api.put(`/orders/${orderForm.id}`, orderData)
      ElMessage.success('Заказ успешно обновлен')
    } else {
      await api.post('/orders', orderData)
      ElMessage.success('Заказ успешно добавлен')
    }
    
    showAddOrderDialog.value = false
    await loadOrders()
  } catch (error) {
    console.error('Error in submitOrderForm:', error)
    
    if (error.response) {
      console.error('Response error:', error.response)
      ElMessage.error(`Ошибка сервера: ${error.response.data?.error || error.response.statusText}`)
    } else if (error.request) {
      console.error('Request error:', error.request)
      ElMessage.error('Ошибка сети: Не удалось отправить запрос')
    } else if (error.name !== 'Error') {
      // Это ошибка валидации
      console.error('Validation error:', error)
      return
    } else {
      console.error('Unknown error:', error)
      ElMessage.error('Неизвестная ошибка при сохранении заказа')
    }
  } finally {
    submitting.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}

const closeGuestNotice = () => {
  // Можно сохранить в localStorage, что пользователь закрыл уведомление
}

// Хуки жизненного цикла
onMounted(() => {
  loadSupplier()
  loadOrders()
})
</script>

<style scoped>
.supplier-orders {
  padding: 10px;
}

.supplier-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 24px;
  border-radius: 16px;
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

:deep(.el-page-header__content) {
  color: var(--text-primary);
}
:deep(.el-page-header__back) {
  color: var(--text-secondary);
}
:deep(.el-page-header__back:hover) {
  color: var(--accent-color);
}

.header-content h1 {
  margin: 0 0 12px 0;
  font-size: 26px;
  color: var(--text-primary);
  font-weight: 700;
  letter-spacing: -0.5px;
}

.supplier-info {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  color: var(--text-secondary);
  font-size: 14px;
}

.supplier-info span {
  display: flex;
  align-items: center;
}

.debt-info {
  font-weight: 500;
}

.debt-amount {
  color: var(--warning);
  font-weight: 700;
  margin-left: 6px;
  font-feature-settings: "tnum";
}

.header-actions {
  display: flex;
  gap: 12px;
}

.guest-notice {
  margin-bottom: 24px;
}

:deep(.el-alert) {
  border-radius: 12px;
  background-color: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.orders-stats, .orders-filters {
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 24px;
  border-radius: 16px;
  margin-bottom: 24px;
  border: 1px solid var(--border-color);
}

:deep(.el-statistic__head) {
  color: var(--text-secondary) !important;
  font-weight: 500;
}

:deep(.el-statistic__content) {
  color: var(--text-primary) !important;
  font-weight: 700;
  font-size: 28px;
}

.orders-grid {
  min-height: 400px;
}

.empty-state {
  background: rgba(30, 41, 59, 0.5);
  backdrop-filter: blur(8px);
  padding: 60px 20px;
  border-radius: 16px;
  text-align: center;
  border: 1px dashed var(--border-color);
}

:deep(.el-empty__description p) {
  color: var(--text-secondary);
}

.orders-list {
  margin-bottom: 24px;
}

.pagination {
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 20px;
  border-radius: 16px;
  display: flex;
  justify-content: center;
  border: 1px solid var(--border-color);
}

/* Диалог стили */
:deep(.el-dialog) {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 16px;
}

:deep(.el-dialog__title) {
  color: var(--text-primary);
  font-weight: 600;
}

:deep(.el-form-item__label) {
  color: var(--text-secondary);
  font-weight: 500;
}

.image-upload-container {
  text-align: center;
}

.image-preview {
  position: relative;
  width: 100%;
  height: 200px;
  margin-bottom: 16px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
}

.image-upload-placeholder {
  width: 100%;
  height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 2px dashed var(--border-color);
  background: rgba(15, 23, 42, 0.3);
  border-radius: 12px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.image-upload-placeholder:hover {
  border-color: var(--accent-color);
  background: rgba(59, 130, 246, 0.05);
}

.image-upload-placeholder p {
  margin-top: 12px;
  color: var(--text-secondary);
}

.image-url-input {
  margin-bottom: 12px;
}

.image-tips {
  background-color: rgba(15, 23, 42, 0.5);
  padding: 16px;
  border-radius: 12px;
  margin-top: 12px;
  text-align: left;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.tip-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-secondary);
}

.tip-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.tip-list li {
  padding: 4px 0;
  font-family: monospace;
}

.debt-calculation, .split-calculation {
  background: rgba(15, 23, 42, 0.5);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  margin-top: 10px;
}

.calculation-row, .split-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
}

.calculation-row:last-child, .split-row:last-child {
  border-bottom: none;
}

.calculation-value, .split-value {
  font-weight: 600;
  color: var(--text-primary);
}

.calculation-value.minus {
  color: var(--danger);
}

.calculation-row.total, .split-row.total {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 2px solid var(--accent-color);
}

.calculation-row.total .calculation-value.total-value, .split-row.total .split-value.total {
  color: var(--warning);
  font-size: 18px;
}

.calculation-explanation {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-color);
  font-size: 13px;
  color: var(--text-secondary);
  text-align: left;
}

.calculation-explanation small {
  display: block;
  margin-bottom: 6px;
}

.split-explanation, .calculation-example {
  margin-top: 12px;
  padding: 12px;
  background-color: rgba(59, 130, 246, 0.1);
  border-radius: 8px;
  font-size: 13px;
  color: var(--accent-hover);
  border-left: 4px solid var(--accent-color);
}

.split-explanation ul {
  margin: 6px 0 0 16px;
  padding: 0;
}

.split-explanation li {
  margin: 3px 0;
}

.calculation-example small {
  display: block;
  margin: 4px 0;
  font-family: monospace;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  .supplier-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .supplier-info {
    flex-direction: column;
    gap: 10px;
  }
  
  .header-actions {
    width: 100%;
    margin-top: 8px;
  }
  
  .header-actions .el-button {
    width: 100%;
  }
}
</style>