<template>
  <div class="products-page animate-in">
    <div class="page-header">
      <div class="header-content">
        <h1 class="gradient-text">Мои товары</h1>
        <p class="subtitle">Управление вашими лотами на Playerok</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showCopyDialog = true" :icon="Plus">
          Копировать товар по ссылке
        </el-button>
        <el-button @click="loadProducts" :loading="loading" :icon="Refresh">
          Обновить
        </el-button>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-box glass-card">
      <el-alert :title="error" type="error" :closable="false" show-icon />
    </div>

    <!-- Stats Section -->
    <div class="products-stats">
      <div class="mini-stat glass-card">
        <span class="label">Всего товаров</span>
        <span class="value">{{ products.length }}</span>
      </div>
      <div class="mini-stat glass-card">
        <span class="label">Активных</span>
        <span class="value success">{{ activeCount }}</span>
      </div>
    </div>

    <!-- Products Grid/List -->
    <div v-if="loading && products.length === 0" class="loading-state">
      <el-skeleton :rows="5" animated />
    </div>

    <div v-else-if="products.length === 0" class="empty-state glass-card">
      <div class="empty-icon">📦</div>
      <h3>Товары не найдены</h3>
      <p>Вы еще не выставили ни одного товара или не настроили API.</p>
    </div>

    <div v-else class="products-grid">
      <div v-for="product in products" :key="product.id" class="product-card glass-card card-3d">
        <div class="card-header">
          <el-tag :type="getStatusType(product.status)" size="small">
            {{ product.status }}
          </el-tag>
          <span class="product-id">ID: {{ product.id.slice(-6) }}</span>
        </div>

        <div class="card-body">
          <h3 class="product-title">{{ product.name }}</h3>
          <div class="product-price">{{ formatCurrency(product.price) }}</div>
        </div>

        <div class="card-footer">
          <el-button size="small" type="primary" plain @click="handleBoost(product.id)" :loading="boostingId === product.id">
            🚀 Поднять в поиске
          </el-button>
          <el-button size="small" @click="openLink(product.slug)">
            🔗 Ссылка
          </el-button>
        </div>
      </div>
    </div>

    <!-- Copy Dialog -->
    <el-dialog v-model="showCopyDialog" title="Копировать товар" width="500px">
      <el-form label-position="top">
        <el-form-item label="Ссылка на товар Playerok">
          <el-input v-model="copyLink" placeholder="https://playerok.com/products/..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCopyDialog = false">Отмена</el-button>
        <el-button type="primary" @click="handleCopy" :loading="copyLoading">
          Копировать
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { fetchAllExhibitedLots, increaseItemPriority, copyProduct } from '../utils/playerok'

const products = ref([])
const loading = ref(false)
const error = ref(null)
const boostingId = ref(null)

const showCopyDialog = ref(false)
const copyLink = ref('')
const copyLoading = ref(false)

const activeCount = computed(() => products.value.filter(p => p.status === 'APPROVED').length)

const formatCurrency = (v) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(v)

const getStatusType = (status) => {
  switch (status) {
    case 'APPROVED': return 'success'
    case 'PENDING': return 'warning'
    case 'DECLINED': return 'danger'
    default: return 'info'
  }
}

const loadProducts = async () => {
  loading.value = true
  error.value = null
  try {
    const data = await fetchAllExhibitedLots()
    products.value = data || []
  } catch (e) {
    error.value = 'Не удалось загрузить товары: ' + e.message
  } finally {
    loading.value = false
  }
}

const handleBoost = async (id) => {
  boostingId.value = id
  try {
    await increaseItemPriority(id)
    ElMessage.success('Товар успешно поднят!')
  } catch (e) {
    ElMessage.error('Ошибка: ' + e.message)
  } finally {
    boostingId.value = null
  }
}

const handleCopy = async () => {
  if (!copyLink.value) return
  copyLoading.value = true
  try {
    const res = await copyProduct(copyLink.value)
    ElMessage.success('Данные товара скопированы!')
    showCopyDialog.value = false
    copyLink.value = ''
    console.log('Product data:', res)
  } catch (e) {
    ElMessage.error('Ошибка копирования: ' + e.message)
  } finally {
    copyLoading.value = false
  }
}

const openLink = (slug) => {
  window.open(`https://playerok.com/products/${slug}`, '_blank')
}

onMounted(loadProducts)
</script>

<style scoped>
.products-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-content h1 {
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 4px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.products-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.mini-stat {
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 160px;
}

.mini-stat .label {
  font-size: 12px;
  color: var(--text-muted);
  text-transform: uppercase;
  font-weight: 600;
}

.mini-stat .value {
  font-size: 20px;
  font-weight: 800;
}

.mini-stat .value.success {
  color: var(--success);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.product-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-id {
  font-size: 11px;
  color: var(--text-muted);
}

.card-body {
  flex: 1;
}

.product-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
  line-height: 1.4;
}

.product-price {
  font-size: 18px;
  font-weight: 800;
  color: var(--accent-light);
}

.card-footer {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,0.05);
}

.empty-state {
  text-align: center;
  padding: 60px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.loading-state {
  padding: 40px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>
