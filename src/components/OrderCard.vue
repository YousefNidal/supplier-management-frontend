<template>
  <el-card class="order-card" :class="`status-${order.status}`">
    <template #header>
      <div class="card-header">
        <div class="order-status">
          <el-tag :type="getStatusType(order.status)" size="small" round>
            {{ getStatusText(order.status) }}
          </el-tag>
          <el-tag v-if="order.isSplit" type="warning" size="small" style="margin-left: 5px;">
            Разделен
          </el-tag>
        </div>
        <div v-if="!isGuest" class="order-actions">
          <el-dropdown trigger="click" @command="handleCommand">
            <el-button type="text" size="small">
              <el-icon><More /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit">
                  <el-icon><Edit /></el-icon>
                  Редактировать
                </el-dropdown-item>
                <el-dropdown-item 
                  v-if="order.status !== 'completed' && !order.isSplit" 
                  command="split"
                >
                  <el-icon><Share /></el-icon>
                  Разделить пополам
                </el-dropdown-item>
                <el-dropdown-item 
                  v-if="order.status !== 'completed'" 
                  command="complete"
                >
                  <el-icon><CircleCheck /></el-icon>
                  Завершить
                </el-dropdown-item>
                <el-dropdown-item 
                  v-if="order.status !== 'cancelled'" 
                  command="cancel"
                >
                  <el-icon><CircleClose /></el-icon>
                  Отменить
                </el-dropdown-item>
                <el-dropdown-item command="delete" divided>
                  <el-icon><Delete /></el-icon>
                  <span style="color: #f56c6c">Удалить</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div v-else class="order-actions">
          <el-tag type="info" size="small">Только просмотр</el-tag>
        </div>
      </div>
    </template>

    <div class="order-content">
      <!-- Изображение -->
      <div class="order-image" @click="viewImage">
        <img :src="order.imageUrl" :alt="'Заказ #' + order.id" />
        <div class="image-overlay">
          <el-icon><ZoomIn /></el-icon>
        </div>
      </div>

      <!-- Информация о заказе -->
      <div class="order-info">
        <div class="info-item">
          <span class="label">Стоимость:</span>
          <span class="value cost">{{ formatCurrency(order.cost) }}</span>
        </div>
        
        <div class="info-item">
          <span class="label">Премиум:</span>
          <span class="value premium">{{ formatCurrency(order.premium) }}</span>
        </div>
        
        <div class="info-item">
          <span class="label">Задолженность:</span>
          <span class="value debt">{{ formatCurrency(order.debtAmount) }}</span>
        </div>
        
        <div class="info-item">
          <span class="label">Расчет:</span>
          <span class="value calculation">
            <template v-if="order.isSplit">
              {{ formatCurrency(order.cost) }} - {{ formatCurrency(order.premium) }}
            </template>
            <template v-else>
              {{ formatCurrency(order.cost) }} - 30% - {{ formatCurrency(order.premium) }}
            </template>
          </span>
        </div>
        
        <div v-if="order.isSplit" class="info-item split-info">
          <span class="label">Разделен с:</span>
          <span class="value">{{ order.splitWith || 'Не указано' }}</span>
        </div>
        
        <div v-if="order.notes" class="info-item notes">
          <span class="label">Примечания:</span>
          <div class="value notes-text">{{ order.notes }}</div>
        </div>
        
        <div class="info-item date">
          <span class="label">Добавлен:</span>
          <span class="value">{{ formatDate(order.createdAt) }}</span>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'
import { More, Edit, Delete, CircleCheck, CircleClose, ZoomIn, Share } from '@element-plus/icons-vue'

const props = defineProps({
  order: {
    type: Object,
    required: true
  },
  isGuest: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['edit', 'delete', 'status-change', 'split'])

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

const getStatusType = (status) => {
  switch (status) {
    case 'active': return 'primary'
    case 'completed': return 'success'
    case 'cancelled': return 'danger'
    default: return 'info'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'active': return 'Активный'
    case 'completed': return 'Завершен'
    case 'cancelled': return 'Отменен'
    default: return status
  }
}

const handleCommand = (command) => {
  switch (command) {
    case 'edit':
      emit('edit', props.order)
      break
    case 'split':
      emit('split', props.order)
      break
    case 'complete':
      emit('status-change', props.order, 'completed')
      break
    case 'cancel':
      emit('status-change', props.order, 'cancelled')
      break
    case 'delete':
      emit('delete', props.order)
      break
  }
}

const viewImage = () => {
  window.open(props.order.imageUrl, '_blank')
}
</script>

<style scoped>
.order-card {
  height: 100%;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  margin-bottom: 24px;
  background: rgba(30, 41, 59, 0.8) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-color) !important;
  border-radius: 16px;
}

.order-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
  border-color: rgba(59, 130, 246, 0.3) !important;
}

:deep(.el-card__header) {
  padding: 16px;
  border-bottom: 1px solid var(--border-color) !important;
  background: rgba(15, 23, 42, 0.4);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-actions .el-button {
  padding: 0;
  color: var(--text-secondary);
}

.order-actions .el-button:hover {
  color: var(--text-primary);
}

.order-actions .el-tag {
  margin-left: 10px;
}

.order-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px;
}

.order-image {
  position: relative;
  width: 100%;
  height: 180px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.order-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.order-image:hover img {
  transform: scale(1.08);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.order-image:hover .image-overlay {
  opacity: 1;
}

.image-overlay .el-icon {
  color: white;
  font-size: 32px;
  transform: scale(0.8);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.order-image:hover .image-overlay .el-icon {
  transform: scale(1);
}

.order-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
  flex-shrink: 0;
  width: 120px;
}

.info-item .value {
  font-size: 14px;
  font-weight: 600;
  text-align: right;
  word-break: break-word;
  color: var(--text-primary);
  font-feature-settings: "tnum";
}

.info-item .cost {
  color: var(--accent-hover);
}

.info-item .premium {
  color: var(--success);
}

.info-item .debt {
  color: var(--warning);
}

.info-item .calculation {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 400;
}

.info-item.split-info {
  background-color: rgba(245, 158, 11, 0.1);
  padding: 10px;
  border-radius: 8px;
  margin: 6px 0;
  border: 1px dashed rgba(245, 158, 11, 0.3);
}

.info-item.split-info .label {
  color: var(--warning);
}

.info-item.split-info .value {
  color: var(--warning);
  font-weight: 700;
}

.info-item.notes {
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.notes-text {
  width: 100%;
  text-align: left;
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 400;
  font-style: italic;
  line-height: 1.5;
  background: rgba(15, 23, 42, 0.5);
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-top: 4px;
}

.info-item.date {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
}

.info-item.date .value {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-secondary);
}

/* Статусные стили */
.order-card.status-active {
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.1);
  border-top: 3px solid var(--accent-color) !important;
}

.order-card.status-completed {
  border-top: 3px solid var(--success) !important;
}

.order-card.status-cancelled {
  border-top: 3px solid var(--danger) !important;
  opacity: 0.8;
}

.order-card.status-active.is-split {
  border-left: 4px solid var(--warning) !important;
}

:deep(.el-dropdown-menu) {
  background: var(--bg-surface) !important;
  border: 1px solid var(--border-color) !important;
}

:deep(.el-dropdown-menu__item) {
  color: var(--text-primary) !important;
}

:deep(.el-dropdown-menu__item:hover) {
  background: rgba(255, 255, 255, 0.05) !important;
}

@media (max-width: 768px) {
  .info-item {
    flex-direction: column;
    gap: 4px;
  }
  
  .info-item .label,
  .info-item .value {
    width: 100%;
    text-align: left;
  }
}
</style>