<template>
  <div class="seller-profile">
    <div class="page-header">
      <h1>Мой профиль</h1>
      <p v-if="isGuest">Просмотр профиля в гостевом режиме</p>
      <p v-else>Управление вашей учетной записью и балансом</p>
    </div>

    <!-- Гостевой режим уведомление -->
    <div v-if="isGuest" class="guest-notice">
      <el-alert
        title="Гостевой режим"
        type="warning"
        description="Эта страница доступна только авторизованным продавцам. Войдите в систему для управления профилем."
        show-icon
        closable
      >
        <template #action>
          <el-button type="primary" size="small" @click="goToLogin">
            Войти как продавец
          </el-button>
        </template>
      </el-alert>
    </div>

    <div v-else class="profile-content">
      <!-- Левая колонка - информация профиля -->
      <div class="profile-info">
        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <span>Информация о продавце</span>
              <el-button type="primary" size="small" @click="editProfile">
                <!-- <el-icon><Edit /></el-icon> -->
                Редактировать
              </el-button>
            </div>
          </template>

          <div class="info-content">
            <div class="info-item">
              <span class="label">ID:</span>
              <span class="value">{{ seller.id }}</span>
            </div>
            <div class="info-item">
              <span class="label">Имя:</span>
              <span class="value">{{ seller.name }}</span>
            </div>
            <div class="info-item">
              <span class="label">Игровой ник:</span>
              <span class="value">{{ seller.gameNickname }}</span>
            </div>
            <div class="info-item">
              <span class="label">Баланс:</span>
              <span class="value balance" :class="{ positive: seller.balance >= 0, negative: seller.balance < 0 }">
                {{ formatCurrency(seller.balance) }}
              </span>
            </div>
            <div class="info-item">
              <span class="label">Дата регистрации:</span>
              <span class="value">{{ formatDate(registrationDate) }}</span>
            </div>
          </div>
        </el-card>

        <!-- История изменений баланса -->
        <el-card class="history-card">
          <template #header>
            <span>Последние изменения баланса</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(change, index) in balanceHistory"
              :key="index"
              :timestamp="change.date"
              :type="change.type"
            >
              {{ change.description }}
              <div class="change-amount" :class="{ positive: change.amount > 0, negative: change.amount < 0 }">
                {{ change.amount > 0 ? '+' : '' }}{{ formatCurrency(change.amount) }}
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </div>

      <!-- Правая колонка - управление балансом -->
      <div class="balance-management">
        <el-card class="balance-card">
          <template #header>
            <span>Управление балансом</span>
          </template>

          <div class="balance-actions">
            <div class="balance-form">
              <el-form :model="balanceForm" label-width="150px">
                <el-form-item label="Новый баланс">
                  <el-input-number 
                    v-model="balanceForm.balance" 
                    :precision="2" 
                    :step="100" 
                    :min="-100000" 
                    :max="1000000"
                    style="width: 100%"
                  />
                </el-form-item>
                <el-form-item label="Причина изменения">
                  <el-input 
                    v-model="balanceForm.reason" 
                    type="textarea" 
                    :rows="3" 
                    placeholder="Укажите причину изменения баланса"
                  />
                </el-form-item>
              </el-form>
            </div>

            <div class="action-buttons">
              <el-button 
                type="primary" 
                @click="updateBalance"
                :loading="updatingBalance"
              >
                <!-- <el-icon><Check /></el-icon> -->
                Сохранить изменения
              </el-button>
              <el-button type="info" @click="resetBalanceForm">
                <!-- <el-icon><RefreshLeft /></el-icon> -->
                Сбросить
              </el-button>
            </div>
          </div>
        </el-card>

        <!-- Статистика -->
        <el-card class="stats-card">
          <template #header>
            <span>Финансовая статистика</span>
          </template>

          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">Общая задолженность</span>
              <span class="stat-value debt">{{ formatCurrency(stats.totalDebt) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Поставщиков</span>
              <span class="stat-value">{{ stats.supplierCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Всего заказов</span>
              <span class="stat-value">{{ stats.totalOrders }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Баланс после выплат</span>
              <span class="stat-value" :class="{ positive: balanceAfter >= 0, negative: balanceAfter < 0 }">
                {{ formatCurrency(balanceAfter) }}
              </span>
            </div>
          </div>
        </el-card>

        <!-- Быстрые действия -->
        <el-card class="quick-actions-card">
          <template #header>
            <span>Быстрые действия</span>
          </template>

          <div class="quick-actions">
            <el-button type="success" @click="addSupplier">
              <!-- <el-icon><Plus /></el-icon> -->
              Добавить поставщика
            </el-button>
            <el-button type="warning" @click="viewSuppliers">
              <!-- <el-icon><List /></el-icon> -->
              Список поставщиков
            </el-button>
            <el-button type="info" @click="exportData">
              <!-- <el-icon><Download /></el-icon> -->
              Экспорт данных
            </el-button>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'
// import { Edit, Check, RefreshLeft, Plus, List, Download } from '../utils/icons'
import api from '../utils/api'

const router = useRouter()
const authStore = useAuthStore()

// Проверка режима
const isGuest = computed(() => {
  return authStore.isGuestMode
})

// Данные
const seller = ref({
  id: 1,
  name: '',
  balance: 0,
  gameNickname: ''
})

const stats = ref({
  totalDebt: 0,
  totalOrders: 0,
  supplierCount: 0
})

const registrationDate = ref(new Date().toISOString())

const balanceHistory = ref([
  { date: '2024-01-15 14:30', type: 'success', description: 'Пополнение баланса', amount: 5000 },
  { date: '2024-01-10 11:20', type: 'warning', description: 'Оплата поставщику', amount: -3200 },
  { date: '2024-01-05 09:15', type: 'success', description: 'Пополнение баланса', amount: 10000 },
  { date: '2024-01-01 16:45', type: 'warning', description: 'Оплата поставщику', amount: -8700 }
])

// Формы и состояния
const balanceForm = reactive({
  balance: 0,
  reason: ''
})

const updatingBalance = ref(false)

// Вычисляемые свойства
const balanceAfter = computed(() => {
  return seller.value.balance - stats.value.totalDebt
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

const loadData = async () => {
  try {
    // Загружаем данные продавца
    const sellerResponse = await api.get('/seller')
    seller.value = sellerResponse.data
    balanceForm.balance = seller.value.balance
    
    // Загружаем статистику
    const statsResponse = await api.get('/stats')
    stats.value = statsResponse.data
  } catch (error) {
    console.error('Error loading profile data:', error)
    ElMessage.error('Ошибка загрузки данных профиля')
  }
}

const editProfile = () => {
  ElMessage.info('Редактирование профиля будет доступно в следующей версии')
}

const updateBalance = async () => {
  if (!balanceForm.reason.trim()) {
    ElMessage.warning('Пожалуйста, укажите причину изменения баланса')
    return
  }

  updatingBalance.value = true
  try {
    await api.put('/seller/balance', { balance: balanceForm.balance })
    
    // Добавляем запись в историю
    balanceHistory.value.unshift({
      date: new Date().toISOString(),
      type: 'success',
      description: balanceForm.reason,
      amount: balanceForm.balance - seller.value.balance
    })
    
    seller.value.balance = balanceForm.balance
    ElMessage.success('Баланс успешно обновлен')
  } catch (error) {
    console.error('Error updating balance:', error)
    ElMessage.error('Ошибка обновления баланса')
  } finally {
    updatingBalance.value = false
  }
}

const resetBalanceForm = () => {
  balanceForm.balance = seller.value.balance
  balanceForm.reason = ''
}

const addSupplier = () => {
  router.push('/suppliers')
}

const viewSuppliers = () => {
  router.push('/suppliers')
}

const exportData = () => {
  const data = {
    seller: seller.value,
    stats: stats.value,
    balanceHistory: balanceHistory.value,
    exportDate: new Date().toISOString()
  }
  
  const dataStr = JSON.stringify(data, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `seller_profile_${new Date().toISOString().split('T')[0]}.json`
  link.click()
  
  ElMessage.success('Данные экспортированы в JSON')
}

const goToLogin = () => {
  router.push('/login')
}

// Блокируем загрузку данных для гостя
onMounted(() => {
  if (!isGuest.value) {
    loadData()
  } else {
    // Можно загрузить только публичные данные
    loadPublicData()
  }
})

const loadPublicData = async () => {
  try {
    const response = await api.get('/seller')
    seller.value = response.data
  } catch (error) {
    console.error('Error loading public data:', error)
  }
}
</script>

<style scoped>
.seller-profile {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  margin: 0 0 10px 0;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #909399;
}

.guest-notice {
  margin-bottom: 30px;
}

.profile-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

@media (max-width: 1200px) {
  .profile-content {
    grid-template-columns: 1fr;
  }
}

.info-card,
.history-card,
.balance-card,
.stats-card,
.quick-actions-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  color: #606266;
  font-weight: 500;
}

.info-item .value {
  font-weight: 600;
}

.info-item .balance {
  font-size: 18px;
}

.info-item .balance.positive {
  color: #67c23a;
}

.info-item .balance.negative {
  color: #f56c6c;
}

.change-amount {
  font-weight: 600;
  margin-top: 5px;
}

.change-amount.positive {
  color: #67c23a;
}

.change-amount.negative {
  color: #f56c6c;
}

.balance-actions {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
}

.stat-value.debt {
  color: #e6a23c;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-actions .el-button {
    width: 100%;
  }
}
</style>