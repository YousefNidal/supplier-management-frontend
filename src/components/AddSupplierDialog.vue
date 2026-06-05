<template>
  <el-dialog 
    v-model="dialogVisible" 
    :title="isEditing ? 'Редактирование поставщика' : 'Добавление нового поставщика'" 
    width="500px"
    @close="handleClose"
  >
    <el-form 
      ref="formRef" 
      :model="form" 
      :rules="rules" 
      label-width="150px"
      label-position="left"
    >
      <el-form-item label="Имя поставщика" prop="name">
        <el-input 
          v-model="form.name" 
          placeholder="Введите полное имя поставщика"
          clearable
        />
      </el-form-item>
      
      <el-form-item label="Игровой ник" prop="gameNickname">
        <el-input 
          v-model="form.gameNickname" 
          placeholder="Введите игровой никнейм"
          clearable
        />
      </el-form-item>
      
      <el-form-item label="Начальная задолженность">
        <el-input-number 
          v-model="form.debt" 
          :precision="2" 
          :step="100" 
          :min="0" 
          :max="100000"
          style="width: 100%"
        />
        <div class="form-help">Начальная сумма задолженности</div>
      </el-form-item>
      
      <el-form-item label="Начальное количество заказов">
        <el-input-number 
          v-model="form.ordersCount" 
          :step="1" 
          :min="0" 
          :max="1000"
          style="width: 100%"
        />
        <div class="form-help">Начальное количество заказов у поставщика</div>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">Отмена</el-button>
        <el-button 
          type="primary" 
          @click="submitForm" 
          :loading="submitting"
        >
          {{ isEditing ? 'Обновить' : 'Добавить' }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../utils/api'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  supplier: {
    type: Object,
    default: null
  },
  isEditing: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:modelValue',
  'supplier-saved',
  'close'
])

const dialogVisible = ref(false)
const formRef = ref(null)
const submitting = ref(false)

const form = reactive({
  name: '',
  gameNickname: '',
  debt: 0,
  ordersCount: 0
})

const rules = {
  name: [
    { required: true, message: 'Пожалуйста, введите имя поставщика', trigger: 'blur' },
    { min: 2, message: 'Имя должно содержать минимум 2 символа', trigger: 'blur' }
  ],
  gameNickname: [
    { required: true, message: 'Пожалуйста, введите игровой ник', trigger: 'blur' },
    { min: 2, message: 'Ник должен содержать минимум 2 символа', trigger: 'blur' }
  ]
}

// Наблюдаем за изменениями props
watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
})

watch(() => dialogVisible.value, (val) => {
  emit('update:modelValue', val)
})

watch(() => props.supplier, (val) => {
  if (val) {
    Object.assign(form, {
      name: val.name,
      gameNickname: val.gameNickname,
      debt: val.debt,
      ordersCount: val.ordersCount
    })
  }
})

watch(() => props.isEditing, (val) => {
  if (!val) {
    resetForm()
  }
})

const resetForm = () => {
  Object.assign(form, {
    name: '',
    gameNickname: '',
    debt: 0,
    ordersCount: 0
  })
  
  if (formRef.value) {
    nextTick(() => {
      formRef.value.clearValidate()
    })
  }
}

const handleClose = () => {
  resetForm()
  emit('close')
}

const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    if (props.isEditing && props.supplier) {
      // Обновление существующего поставщика
      await api.put(`/suppliers/${props.supplier.id}`, form)
      ElMessage.success('Поставщик успешно обновлен')
    } else {
      // Добавление нового поставщика
      await api.post('/suppliers', form)
      ElMessage.success('Поставщик успешно добавлен')
    }
    
    dialogVisible.value = false
    emit('supplier-saved')
  } catch (error) {
    if (error.response) {
      ElMessage.error(`Ошибка: ${error.response.data.error || 'Неизвестная ошибка'}`)
    } else if (error.name !== 'Error') {
      // Это ошибка валидации, не показываем сообщение
      return
    } else {
      console.error('Error saving supplier:', error)
      ElMessage.error('Не удалось сохранить поставщика')
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.form-help {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 6px;
  line-height: 1.4;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-form-item) {
  margin-bottom: 24px;
}

:deep(.el-form-item__label) {
  color: var(--text-secondary);
  font-weight: 500;
}
</style>