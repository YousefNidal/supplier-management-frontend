<template>
  <div class="suppliers-page">
    <div class="page-header">
      <h1>Управление поставщиками</h1>
      <p v-if="isGuest">Гостевой режим: только просмотр</p>
      <p v-else>Добавляйте, редактируйте и удаляйте поставщиков</p>
    </div>

    <!-- Кнопки действий (только для продавца) -->
    <div v-if="!isGuest" class="action-buttons">
      <el-button type="success" @click="showAddDialog = true">
        Добавить поставщика
      </el-button>
      <el-button type="info" @click="loadSuppliers">
        Обновить список
      </el-button>
      <el-button type="warning" @click="exportToCSV">
        Экспорт в CSV
      </el-button>
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

    <!-- Таблица поставщиков -->
    <el-card class="suppliers-table-card">
      <template #header>
        <div class="table-header">
          <span>Список поставщиков ({{ suppliers.length }})</span>
          <el-input
            v-model="searchQuery"
            placeholder="Поиск поставщиков..."
            style="width: 300px"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </template>

      <el-table 
        :data="filteredSuppliers" 
        stripe 
        border 
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column prop="id" label="ID" width="80" sortable />
        <el-table-column prop="name" label="Имя" min-width="200" sortable />
        <el-table-column prop="gameNickname" label="Игровой ник" min-width="150" sortable />
        <el-table-column prop="debt" label="Задолженность" width="150" sortable>
          <template #default="scope">
            <span :class="{ 'debt-highlight': scope.row.debt > 0 }">
              {{ formatCurrency(scope.row.debt) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="ordersCount" label="Заказы" width="120" sortable>
          <template #default="scope">
            <el-tag :type="scope.row.ordersCount > 0 ? 'primary' : 'info'" size="small">
              {{ scope.row.ordersCount }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="Добавлен" width="180" sortable>
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="Действия" width="250" fixed="right">
          <template #default="scope">
            <el-button-group>
              <el-button 
                size="small" 
                type="primary" 
                @click="viewOrders(scope.row)"
              >
                Заказы
              </el-button>
              <el-button 
                v-if="!isGuest"
                size="small" 
                @click="editSupplier(scope.row)"
              >
                Edit
              </el-button>
              <el-button 
                v-if="!isGuest"
                size="small" 
                type="danger" 
                @click="deleteSupplier(scope.row)"
              >
                X
              </el-button>
              <el-button 
                v-if="isGuest"
                size="small"
                type="info"
                disabled
              >
                Просмотр
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <!-- Пагинация -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredSuppliers.length"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </el-card>

    <!-- Диалог добавления/редактирования (только для продавца) -->
    <AddSupplierDialog 
      v-if="!isGuest"
      v-model="showAddDialog" 
      :supplier="editingSupplier"
      :is-editing="isEditing"
      @supplier-saved="handleSupplierSaved"
      @close="resetDialog"
    />

    <!-- Статистика -->
    <el-card class="stats-card">
      <template #header>
        <span>Статистика поставщиков</span>
      </template>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">Всего поставщиков</div>
          <div class="stat-value">{{ suppliers.length }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Общая задолженность</div>
          <div class="stat-value debt">{{ formatCurrency(totalDebt) }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Всего заказов</div>
          <div class="stat-value">{{ totalOrders }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Средняя задолженность</div>
          <div class="stat-value">{{ formatCurrency(averageDebt) }}</div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import AddSupplierDialog from '../components/AddSupplierDialog.vue'
import api from '../utils/api'

const router = useRouter()
const authStore = useAuthStore()

// Проверка режима
const isGuest = computed(() => {
  return authStore.isGuestMode
})

// Данные
const suppliers = ref([])
const loading = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

// Диалоги
const showAddDialog = ref(false)
const isEditing = ref(false)
const editingSupplier = ref(null)

// Фильтрация и пагинация
const filteredSuppliers = computed(() => {
  let filtered = suppliers.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(supplier =>
      supplier.name.toLowerCase().includes(query) ||
      supplier.gameNickname.toLowerCase().includes(query) ||
      (supplier.createdAt && supplier.createdAt.toLowerCase().includes(query))
    )
  }
  
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filtered.slice(start, end)
})

// Статистика
const totalDebt = computed(() => {
  return suppliers.value.reduce((sum, supplier) => sum + supplier.debt, 0)
})

const totalOrders = computed(() => {
  return suppliers.value.reduce((sum, supplier) => sum + supplier.ordersCount, 0)
})

const averageDebt = computed(() => {
  return suppliers.value.length > 0 ? totalDebt.value / suppliers.value.length : 0
})

// Методы
const formatCurrency = (value) => {
  if (value === undefined || value === null) return '0 ₽'
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2
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

const loadSuppliers = async () => {
  loading.value = true
  try {
    const response = await api.get('/suppliers')
    suppliers.value = response.data
    console.log('Загружено поставщиков:', suppliers.value.length)
  } catch (error) {
    console.error('Error loading suppliers:', error)
    ElMessage.error('Ошибка загрузки поставщиков')
  } finally {
    loading.value = false
  }
}

const viewOrders = (supplier) => {
  router.push(`/suppliers/${supplier.id}/orders`)
}

const editSupplier = (supplier) => {
  if (isGuest.value) {
    ElMessage.warning('Редактирование доступно только авторизованным продавцам')
    return
  }
  
  isEditing.value = true
  editingSupplier.value = { ...supplier }
  showAddDialog.value = true
}

const deleteSupplier = async (supplier) => {
  if (isGuest.value) {
    ElMessage.warning('Удаление доступно только авторизованным продавцам')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `Вы уверены, что хотите удалить поставщика "${supplier.name}"?`,
      'Подтверждение удаления',
      {
        confirmButtonText: 'Удалить',
        cancelButtonText: 'Отмена',
        type: 'warning',
      }
    )
    
    await api.delete(`/suppliers/${supplier.id}`)
    await loadSuppliers()
    ElMessage.success('Поставщик успешно удален')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting supplier:', error)
      ElMessage.error('Ошибка удаления поставщика')
    }
  }
}

const handleSupplierSaved = () => {
  loadSuppliers()
  resetDialog()
}

const resetDialog = () => {
  showAddDialog.value = false
  isEditing.value = false
  editingSupplier.value = null
}

const exportToCSV = () => {
  const headers = ['ID', 'Имя', 'Игровой ник', 'Задолженность', 'Количество заказов', 'Дата добавления']
  const data = suppliers.value.map(s => [
    s.id,
    s.name,
    s.gameNickname,
    s.debt,
    s.ordersCount,
    formatDate(s.createdAt)
  ])
  
  const csvContent = [
    headers.join(','),
    ...data.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `suppliers_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  
  ElMessage.success('Данные экспортированы в CSV')
}

const closeGuestNotice = () => {
  // Можно сохранить в localStorage, что пользователь закрыл уведомление
}

const goToLogin = () => {
  router.push('/login')
}

// Хуки жизненного цикла
onMounted(() => {
  loadSuppliers()
})
</script>

<style scoped>
.suppliers-page {
  padding: 10px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  color: var(--text-primary);
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.page-header p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 15px;
}

.action-buttons {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.action-buttons .el-button {
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 600;
  height: auto;
  transition: all 0.2s;
}

.action-buttons .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.guest-notice {
  margin-bottom: 24px;
}

:deep(.el-alert) {
  border-radius: 12px;
  background-color: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.suppliers-table-card {
  margin-bottom: 30px;
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-color);
  border-radius: 16px;
}

:deep(.el-card__header) {
  border-bottom: 1px solid var(--border-color) !important;
  padding: 16px 20px !important;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: var(--text-primary);
}

.debt-highlight {
  color: var(--warning);
  font-weight: 600;
  text-shadow: 0 0 10px rgba(245, 158, 11, 0.3);
}

:deep(.el-table) {
  background: transparent !important;
  --el-table-border-color: var(--border-color);
  --el-table-header-bg-color: rgba(15, 23, 42, 0.6);
  --el-table-tr-bg-color: transparent;
}

:deep(.el-table th.el-table__cell) {
  background-color: var(--bg-surface) !important;
  color: var(--text-secondary) !important;
  font-weight: 600;
}

:deep(.el-table tr) {
  background-color: transparent !important;
  transition: background-color 0.2s;
}

:deep(.el-table tr:hover > td.el-table__cell) {
  background-color: rgba(255, 255, 255, 0.05) !important;
}

:deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid var(--border-color) !important;
}

.pagination {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

.stats-card {
  margin-top: 24px;
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-color);
  border-radius: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background-color: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  transition: transform 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  border-color: rgba(59, 130, 246, 0.3);
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  font-feature-settings: "tnum";
}

.stat-value.debt {
  color: var(--warning);
}

@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .table-header .el-input {
    width: 100% !important;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons .el-button {
    width: 100%;
    margin-left: 0 !important;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .stat-item {
    padding: 16px 12px;
  }
  
  .stat-value {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>