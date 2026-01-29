<template>
  <el-card class="order-card" :class="`status-${order.status}`">
    <template #header>
      <div class="card-header">
        <div class="order-status">
          <el-tag :type="getStatusType(order.status)" size="small" round>
            {{ getStatusText(order.status) }}
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
            {{ formatCurrency(order.cost) }} - 30% - {{ formatCurrency(order.premium) }}
          </span>
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
import { More, Edit, Delete, CircleCheck, CircleClose, ZoomIn } from '@element-plus/icons-vue'

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

const emit = defineEmits(['edit', 'delete', 'status-change'])

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
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  margin-bottom: 20px;
}

.order-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.order-actions .el-button {
  padding: 0;
}

.order-actions .el-tag {
  margin-left: 10px;
}

.order-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.order-image {
  position: relative;
  width: 100%;
  height: 180px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

.order-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.order-image:hover img {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
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
  font-size: 30px;
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
  padding: 5px 0;
  border-bottom: 1px solid #f5f7fa;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
  flex-shrink: 0;
  width: 120px;
}

.info-item .value {
  font-size: 14px;
  font-weight: 600;
  text-align: right;
  word-break: break-word;
}

.info-item .cost {
  color: #409eff;
}

.info-item .premium {
  color: #67c23a;
}

.info-item .debt {
  color: #e6a23c;
}

.info-item .calculation {
  font-size: 11px;
  color: #909399;
  font-weight: normal;
}

.info-item.notes {
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
}

.notes-text {
  width: 100%;
  text-align: left;
  font-size: 12px;
  color: #606266;
  font-weight: normal;
  font-style: italic;
  line-height: 1.4;
  background: #f5f7fa;
  padding: 8px;
  border-radius: 4px;
  margin-top: 5px;
}

.info-item.date {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #ebeef5;
}

.info-item.date .value {
  font-size: 12px;
  font-weight: normal;
  color: #909399;
}

/* Статусные стили */
.order-card.status-active {
  border-top: 3px solid #409eff;
}

.order-card.status-completed {
  border-top: 3px solid #67c23a;
}

.order-card.status-cancelled {
  border-top: 3px solid #f56c6c;
}

@media (max-width: 768px) {
  .info-item {
    flex-direction: column;
    gap: 2px;
  }
  
  .info-item .label,
  .info-item .value {
    width: 100%;
    text-align: left;
  }
}
</style>