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
          <!-- <el-icon><Plus /></el-icon> -->
          Добавить заказ
        </el-button>
        <el-button type="info" @click="loadOrders">
          <!-- <el-icon><Refresh /></el-icon> -->
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
              <!-- <el-icon><Search /></el-icon> -->
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
                  <!-- <el-icon><Delete /></el-icon> -->
                </el-button>
              </div>
            </div>
            <div v-else class="image-upload-placeholder">
              <!-- <el-icon size="50"><Picture /></el-icon> -->
              <p>Нажмите для загрузки изображения</p>
            </div>
            <el-input
              v-model="orderForm.imageUrl"
              placeholder="Введите URL изображения или загрузите файл"
              class="image-url-input"
            >
              <template #append>
                <el-button @click="showImageUrlInput = !showImageUrlInput">
                  <!-- <el-icon><Link /></el-icon> -->
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
            <div class="calculation-row">
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
                {{ formatCurrency(orderForm.cost - (orderForm.cost * 0.3) - orderForm.premium) }}
              </span>
            </div>
            <div class="calculation-explanation">
              <small>Формула: <strong>Стоимость - 30% - Премиум = Задолженность</strong></small>
              <br>
              <small>Это сумма, которую вы должны заплатить поставщику</small>
            </div>
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
// import { Plus, Refresh, Search, Delete, Picture, Link } from '../utils/icons'
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
const isEditing = ref(false)
const showImageUrlInput = ref(false)
const submitting = ref(false)

// Формы
const orderFormRef = ref(null)
const orderForm = reactive({
  id: null,
  imageUrl: 'https://picsum.photos/300/200',
  cost: 1000,
  premium: 100,
  status: 'active',
  notes: ''
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
      order.notes?.toLowerCase().includes(query)
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
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2
  }).format(value)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadSupplier = async () => {
  try {
    const supplierId = route.params.id
    const response = await api.get(`/suppliers/${supplierId}`)
    supplier.value = response.data
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
  Object.assign(orderForm, {
    id: order.id,
    imageUrl: order.imageUrl,
    cost: order.cost,
    premium: order.premium,
    status: order.status,
    notes: order.notes || ''
  })
  showAddOrderDialog.value = true
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
    orders.value = orders.value.filter(o => o.id !== order.id)
    await loadSupplier() // Обновляем данные поставщика
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
    
    // Обновляем локальные данные
    const index = orders.value.findIndex(o => o.id === order.id)
    if (index !== -1) {
      orders.value[index].status = newStatus
    }
    
    await loadSupplier() // Обновляем данные поставщика
    ElMessage.success(`Статус заказа изменен на "${newStatus === 'active' ? 'Активный' : newStatus === 'completed' ? 'Завершенный' : 'Отмененный'}"`)
  } catch (error) {
    console.error('Error changing order status:', error)
    ElMessage.error('Ошибка изменения статуса заказа')
  }
}

const resetDialog = () => {
  isEditing.value = false
  orderForm.id = null
  orderForm.imageUrl = 'https://picsum.photos/300/200'
  orderForm.cost = 1000
  orderForm.premium = 100
  orderForm.status = 'active'
  orderForm.notes = ''
  
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
    
    console.log('Submitting order form:', orderForm);
    
    const orderData = {
      supplierId: supplier.value.id,
      imageUrl: orderForm.imageUrl,
      cost: orderForm.cost,
      premium: orderForm.premium,
      notes: orderForm.notes,
      status: orderForm.status
    }
    
    console.log('Sending order data:', orderData);
    
    if (isEditing.value) {
      // Используем правильный endpoint для обновления
      await api.put(`/orders/${orderForm.id}`, orderData)
      ElMessage.success('Заказ успешно обновлен')
    } else {
      // Используем правильный endpoint для создания
      const response = await api.post('/orders', orderData)
      console.log('Order created:', response.data)
      ElMessage.success('Заказ успешно добавлен')
    }
    
    showAddOrderDialog.value = false
    await loadOrders()
    await loadSupplier()
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
  padding: 20px;
}

.supplier-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.header-content h1 {
  margin: 0 0 10px 0;
  font-size: 24px;
  color: #303133;
}

.supplier-info {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  color: #606266;
  font-size: 14px;
}

.supplier-info span {
  display: flex;
  align-items: center;
}

.debt-info {
  font-weight: 600;
}

.debt-amount {
  color: #e6a23c;
  font-weight: 700;
  margin-left: 5px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.guest-notice {
  margin-bottom: 20px;
}

.orders-stats {
  background: white;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.orders-filters {
  background: white;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.orders-grid {
  min-height: 400px;
}

.empty-state {
  background: white;
  padding: 50px 20px;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.orders-list {
  margin-bottom: 20px;
}

.pagination {
  background: white;
  padding: 20px;
  border-radius: 10px;
  display: flex;
  justify-content: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* Диалог стили */
.image-upload-container {
  text-align: center;
}

.image-preview {
  position: relative;
  width: 100%;
  height: 200px;
  margin-bottom: 15px;
  border-radius: 8px;
  overflow: hidden;
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
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  margin-bottom: 15px;
  cursor: pointer;
  transition: border-color 0.3s;
}

.image-upload-placeholder:hover {
  border-color: #409eff;
}

.image-upload-placeholder p {
  margin-top: 10px;
  color: #909399;
}

.image-url-input {
  margin-bottom: 10px;
}

.image-tips {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  margin-top: 10px;
  text-align: left;
}

.tip-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #606266;
}

.tip-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.tip-list li {
  padding: 3px 0;
  font-family: monospace;
}

.debt-calculation {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
}

.calculation-row {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px solid #ebeef5;
}

.calculation-row:last-child {
  border-bottom: none;
}

.calculation-value {
  font-weight: 600;
  color: #606266;
}

.calculation-value.minus {
  color: #f56c6c;
}

.calculation-row.total {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 2px solid #409eff;
}

.calculation-row.total .calculation-value.total-value {
  color: #e6a23c;
  font-size: 18px;
}

.calculation-explanation {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #dcdfe6;
  font-size: 12px;
  color: #909399;
  text-align: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 768px) {
  .supplier-header {
    flex-direction: column;
    gap: 15px;
  }
  
  .supplier-info {
    flex-direction: column;
    gap: 8px;
  }
  
  .header-actions {
    width: 100%;
  }
  
  .header-actions .el-button {
    width: 100%;
  }
}
</style>