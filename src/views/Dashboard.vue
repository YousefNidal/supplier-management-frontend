<template>
  <div class="dashboard">
    <div class="welcome-section">
      <h1>Добро пожаловать, {{ seller.name }}!</h1>
      <p v-if="isGuest" class="subtitle">Просмотр информации в гостевом режиме</p>
      <p v-else class="subtitle">Управление поставщиками и отслеживание баланса</p>
    </div>

    <!-- Гостевой режим уведомление -->
    <div v-if="isGuest" class="guest-notice">
      <el-alert
        title="Гостевой режим"
        type="info"
        description="Вы просматриваете информацию в режиме гостя. Для внесения изменений войдите как продавец."
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

    <!-- Карточки статистики -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <template #header>
          <div class="card-header">
            <span>Баланс</span>
            <!-- <el-icon><Money /></el-icon> -->
          </div>
        </template>
        <div class="stat-content">
          <div class="stat-value" :class="{ positive: seller.balance >= 0, negative: seller.balance < 0 }">
            {{ formatCurrency(seller.balance) }}
          </div>
          <el-button 
            v-if="!isGuest" 
            type="primary" 
            size="small" 
            @click="editBalance"
          >
            Изменить баланс
          </el-button>
          <el-button 
            v-else 
            type="info" 
            size="small" 
            disabled
          >
            Только просмотр
          </el-button>
        </div>
      </el-card>

      <el-card class="stat-card">
        <template #header>
          <div class="card-header">
            <span>Общая задолженность</span>
            <!-- <el-icon><CreditCard /></el-icon> -->
          </div>
        </template>
        <div class="stat-content">
          <div class="stat-value debt">
            {{ formatCurrency(stats.totalDebt) }}
          </div>
          <div class="stat-label">от {{ stats.supplierCount }} поставщиков</div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <template #header>
          <div class="card-header">
            <span>Всего заказов</span>
            <!-- <el-icon><ShoppingCart /></el-icon> -->
          </div>
        </template>
        <div class="stat-content">
          <div class="stat-value">
            {{ stats.totalOrders }}
          </div>
          <div class="stat-label">заказов у поставщиков</div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <template #header>
          <div class="card-header">
            <span>Баланс после выплат</span>
            <!-- <el-icon><Wallet /></el-icon> -->
          </div>
        </template>
        <div class="stat-content">
          <div class="stat-value" :class="{ positive: balanceAfter >= 0, negative: balanceAfter < 0 }">
            {{ formatCurrency(balanceAfter) }}
          </div>
          <div class="stat-label">после всех выплат</div>
        </div>
      </el-card>
    </div>

    <!-- Быстрые действия -->
    <div v-if="!isGuest" class="quick-actions">
      <h2>Быстрые действия</h2>
      <div class="action-buttons">
        <el-button type="success" @click="goToSuppliers">
          <!-- <el-icon><User /></el-icon> -->
          Управление поставщиками
        </el-button>
        <el-button type="primary" @click="addNewSupplier">
          <!-- <el-icon><Plus /></el-icon> -->
          Добавить поставщика
        </el-button>
        <el-button type="info" @click="goToProfile">
          <!-- <el-icon><UserFilled /></el-icon> -->
          Мой профиль
        </el-button>
      </div>
    </div>

    <!-- Гостевые действия -->
    <div v-else class="quick-actions">
      <h2>Доступные действия</h2>
      <div class="action-buttons">
        <el-button type="success" @click="goToSuppliers">
          <!-- <el-icon><User /></el-icon> -->
          Просмотр поставщиков
        </el-button>
        <el-button type="primary" @click="goToLogin" class="login-button">
          <!-- <el-icon><SwitchButton /></el-icon> -->
          Войти как продавец
        </el-button>
      </div>
    </div>

    <!-- Последние поставщики -->
    <div class="recent-suppliers">
      <div class="section-header">
        <h2>Последние поставщики</h2>
        <el-button type="text" @click="goToSuppliers">Показать всех</el-button>
      </div>
      <el-table :data="recentSuppliers" stripe style="width: 100%">
        <el-table-column prop="name" label="Имя" />
        <el-table-column prop="gameNickname" label="Игровой ник" />
        <el-table-column prop="debt" label="Задолженность">
          <template #default="scope">
            {{ formatCurrency(scope.row.debt) }}
          </template>
        </el-table-column>
        <el-table-column prop="ordersCount" label="Заказы" />
        <el-table-column label="Действия" width="120">
          <template #default="scope">
            <el-button 
              v-if="!isGuest" 
              size="small" 
              @click="editSupplier(scope.row)"
            >
              Изменить
            </el-button>
            <el-button 
              v-else 
              size="small" 
              type="info" 
              disabled
            >
              Просмотр
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Диалог изменения баланса (только для продавца) -->
    <el-dialog 
      v-if="!isGuest"
      v-model="showBalanceDialog" 
      title="Изменение баланса" 
      width="400px"
    >
      <el-form :model="balanceForm" label-width="120px">
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
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showBalanceDialog = false">Отмена</el-button>
          <el-button type="primary" @click="updateBalance">Сохранить</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Диалог добавления поставщика (только для продавца) -->
    <AddSupplierDialog 
      v-if="!isGuest"
      v-model="showAddDialog" 
      @supplier-added="handleSupplierAdded"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'
// import { Money, CreditCard, ShoppingCart, Wallet, User, Plus, UserFilled, SwitchButton } from '@element-plus/icons-vue'
import AddSupplierDialog from '../components/AddSupplierDialog.vue'
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

const recentSuppliers = ref([])

// Диалоги
const showBalanceDialog = ref(false)
const showAddDialog = ref(false)

// Формы
const balanceForm = reactive({
  balance: 0
})

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

const loadData = async () => {
  try {
    // Загружаем данные продавца
    const sellerResponse = await api.get('/seller')
    seller.value = sellerResponse.data
    
    // Загружаем статистику
    const statsResponse = await api.get('/stats')
    stats.value = statsResponse.data
    
    // Загружаем последних поставщиков
    const suppliersResponse = await api.get('/suppliers')
    recentSuppliers.value = suppliersResponse.data.slice(0, 5)
  } catch (error) {
    console.error('Error loading dashboard data:', error)
    ElMessage.error('Ошибка загрузки данных')
  }
}

const editBalance = () => {
  balanceForm.balance = seller.value.balance
  showBalanceDialog.value = true
}

const updateBalance = async () => {
  try {
    await api.put('/seller/balance', { balance: balanceForm.balance })
    seller.value.balance = balanceForm.balance
    showBalanceDialog.value = false
    ElMessage.success('Баланс успешно обновлен')
  } catch (error) {
    console.error('Error updating balance:', error)
    ElMessage.error('Ошибка обновления баланса')
  }
}

const goToSuppliers = () => {
  router.push('/suppliers')
}

const goToProfile = () => {
  if (!isGuest.value) {
    router.push('/seller')
  } else {
    ElMessage.warning('Профиль доступен только авторизованным продавцам')
  }
}

const addNewSupplier = () => {
  showAddDialog.value = true
}

const editSupplier = (supplier) => {
  if (isGuest.value) {
    ElMessage.warning('Редактирование доступно только авторизованным продавцам')
    return
  }
  ElMessage.info(`Редактирование поставщика: ${supplier.name}`)
  // В реальном приложении здесь был бы переход к редактированию
}

const handleSupplierAdded = () => {
  loadData()
  ElMessage.success('Поставщик успешно добавлен')
}

const goToLogin = () => {
  // Выходим из гостевого режима и переходим на страницу логина
  authStore.logout()
  router.push('/login')
}

const closeGuestNotice = () => {
  // Можно сохранить в localStorage
  localStorage.setItem('guest_notice_closed', 'true')
}

// Хуки жизненного цикла
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.welcome-section {
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  color: white;
}

.welcome-section h1 {
  margin: 0 0 10px 0;
  font-size: 28px;
}

.subtitle {
  margin: 0;
  opacity: 0.9;
  font-size: 16px;
}

.guest-notice {
  margin-bottom: 20px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.stat-content {
  text-align: center;
  padding: 10px 0;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 10px;
}

.stat-value.positive {
  color: #67c23a;
}

.stat-value.negative {
  color: #f56c6c;
}

.stat-value.debt {
  color: #e6a23c;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.quick-actions {
  background: white;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 30px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.quick-actions h2 {
  margin: 0 0 20px 0;
}

.action-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.login-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
}

.login-button:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  color: white;
}

.recent-suppliers {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0;
}

@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons .el-button {
    width: 100%;
  }
}
</style>