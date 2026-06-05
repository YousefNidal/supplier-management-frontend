<template>
  <div class="chats-page animate-in">
    <div class="page-header">
      <div class="header-content">
        <h1 class="gradient-text">Сообщения</h1>
        <p class="subtitle">Ваши диалоги на Playerok</p>
      </div>
      <div class="header-actions">
        <el-button @click="loadChats" :loading="loading" :icon="Refresh">
          Обновить
        </el-button>
      </div>
    </div>

    <div class="chats-container glass-card">
      <!-- Sidebar / List -->
      <div class="chats-sidebar">
        <div v-if="loading && chats.length === 0" class="loading-list">
          <el-skeleton :rows="10" animated />
        </div>
        <div v-else-if="chats.length === 0" class="empty-list">
          <p>Нет активных диалогов</p>
        </div>
        <div v-else class="chats-list">
          <div 
            v-for="chat in chats" 
            :key="chat.node.id" 
            class="chat-item" 
            :class="{ active: selectedChatId === chat.node.id, unread: chat.node.unreadMessagesCounter > 0 }"
            @click="selectChat(chat.node)"
          >
            <div class="chat-avatar">
              {{ (getOtherParticipant(chat.node).username || '?')[0] }}
            </div>
            <div class="chat-info">
              <div class="chat-top">
                <span class="chat-name">{{ getOtherParticipant(chat.node).username }}</span>
                <span class="chat-time">{{ formatTime(chat.node.lastMessage?.createdAt) }}</span>
              </div>
              <div class="chat-preview">
                <span v-if="chat.node.unreadMessagesCounter > 0" class="unread-dot"></span>
                {{ chat.node.lastMessage?.text || 'Нет сообщений' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Chat Area -->
      <div class="chat-main">
        <div v-if="!selectedChat" class="no-selection">
          <div class="no-selection-icon">💬</div>
          <h3>Выберите чат для просмотра</h3>
          <p>Выберите диалог из списка слева, чтобы увидеть подробности</p>
        </div>

        <div v-else class="chat-details">
          <div class="chat-header">
            <div class="header-user">
              <div class="header-avatar">{{ (getOtherParticipant(selectedChat).username || '?')[0] }}</div>
              <div class="header-info">
                <h3>{{ getOtherParticipant(selectedChat).username }}</h3>
                <span class="status">Диалог на Playerok</span>
              </div>
            </div>
            <el-button type="primary" size="small" @click="openExternalChat(selectedChat.id)">
              Открыть на Playerok
            </el-button>
          </div>

          <div class="chat-content">
            <div class="message-card glass-card">
              <div class="msg-header">Последнее сообщение:</div>
              <p class="msg-text">{{ selectedChat.lastMessage?.text }}</p>
              <span class="msg-date">{{ formatDate(selectedChat.lastMessage?.createdAt) }}</span>
            </div>

            <div v-if="selectedChat.lastMessage?.deal" class="deal-card glass-card">
              <div class="deal-header">📦 Связанная сделка:</div>
              <div class="deal-body">
                <span class="item-name">{{ selectedChat.lastMessage.deal.item.name }}</span>
                <span class="item-price">{{ formatCurrency(selectedChat.lastMessage.deal.item.price) }}</span>
                <el-tag size="small" :type="selectedChat.lastMessage.deal.status === 'PAID' ? 'success' : 'info'">
                  {{ selectedChat.lastMessage.deal.status }}
                </el-tag>
              </div>
            </div>

            <div class="chat-actions">
              <el-input
                v-model="replyText"
                placeholder="Введите сообщение..."
                type="textarea"
                :rows="3"
                resize="none"
              />
              <div class="actions-bottom">
                <p class="hint">Сообщение будет отправлено через API Playerok</p>
                <el-button type="primary" @click="handleSend" :loading="sending" :disabled="!replyText">
                  Отправить
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { fetchChats, sendMessage } from '../utils/playerok'

const chats = ref([])
const loading = ref(false)
const selectedChatId = ref(null)
const selectedChat = ref(null)
const replyText = ref('')
const sending = ref(false)

const formatCurrency = (v) => 
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(v)

const formatTime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

const formatDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('ru-RU')
}

const getOtherParticipant = (chatNode) => {
  // Simplistic logic: returns the first participant that isn't null
  // In a real app we'd filter out our own username
  return chatNode.participants?.[0] || { username: 'Пользователь' }
}

const loadChats = async () => {
  loading.value = true
  try {
    const res = await fetchChats()
    chats.value = res?.data?.chats?.edges || []
  } catch (e) {
    ElMessage.error('Ошибка загрузки чатов: ' + e.message)
  } finally {
    loading.value = false
  }
}

const selectChat = (chatNode) => {
  selectedChatId.value = chatNode.id
  selectedChat.value = chatNode
}

const openExternalChat = (id) => {
  window.open(`https://playerok.com/chats/${id}`, '_blank')
}

const handleSend = async () => {
  if (!replyText.value || !selectedChat.value) return
  sending.value = true
  try {
    const other = getOtherParticipant(selectedChat.value)
    await sendMessage(other.username, replyText.value)
    ElMessage.success('Сообщение отправлено!')
    replyText.value = ''
    loadChats()
  } catch (e) {
    ElMessage.error('Ошибка отправки: ' + e.message)
  } finally {
    sending.value = false
  }
}

onMounted(loadChats)
</script>

<style scoped>
.chats-page {
  max-width: 1200px;
  margin: 0 auto;
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chats-container {
  flex: 1;
  display: flex;
  overflow: hidden;
  padding: 0 !important;
}

/* ── SIDEBAR ─────────────────────────── */
.chats-sidebar {
  width: 320px;
  border-right: 1px solid rgba(255,255,255,0.06);
  display: flex;
  flex-direction: column;
  background: rgba(255,255,255,0.01);
}

.chats-list {
  overflow-y: auto;
  flex: 1;
}

.chat-item {
  padding: 16px;
  display: flex;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid rgba(255,255,255,0.03);
}

.chat-item:hover {
  background: rgba(255,255,255,0.03);
}

.chat-item.active {
  background: rgba(59,130,246,0.1);
  border-right: 3px solid var(--accent);
}

.chat-avatar, .header-avatar {
  width: 44px;
  height: 44px;
  background: var(--accent-gradient);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.chat-info {
  flex: 1;
  min-width: 0;
}

.chat-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.chat-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}

.chat-time {
  font-size: 11px;
  color: var(--text-muted);
}

.chat-preview {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 6px;
}

.unread-dot {
  width: 8px;
  height: 8px;
  background: var(--accent);
  border-radius: 50%;
  flex-shrink: 0;
}

.chat-item.unread .chat-name {
  color: var(--accent-light);
}

/* ── MAIN CHAT AREA ───────────────────── */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(0,0,0,0.1);
}

.no-selection {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.no-selection-icon { font-size: 64px; margin-bottom: 16px; opacity: 0.3; }

.chat-details {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  padding: 16px 24px;
  background: rgba(255,255,255,0.02);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-info h3 { font-size: 16px; margin: 0; }
.header-info .status { font-size: 12px; color: var(--text-muted); }

.chat-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.message-card {
  padding: 16px;
  max-width: 80%;
  align-self: flex-start;
}

.msg-header { font-size: 11px; color: var(--accent-light); font-weight: 700; margin-bottom: 8px; text-transform: uppercase; }
.msg-text { font-size: 15px; line-height: 1.5; margin-bottom: 8px; }
.msg-date { font-size: 11px; color: var(--text-muted); }

.deal-card {
  padding: 12px 16px;
  border: 1px solid rgba(16, 185, 129, 0.2);
  background: rgba(16, 185, 129, 0.03);
}

.deal-header { font-size: 12px; font-weight: 700; color: var(--success); margin-bottom: 8px; }
.deal-body { display: flex; align-items: center; gap: 12px; }
.item-name { font-weight: 600; font-size: 14px; }
.item-price { color: var(--accent-light); font-weight: 700; }

.chat-actions {
  margin-top: auto;
  background: rgba(255,255,255,0.02);
  padding: 16px;
  border-top: 1px solid rgba(255,255,255,0.05);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.actions-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hint { font-size: 11px; color: var(--text-muted); }

@media (max-width: 900px) {
  .chats-sidebar { width: 80px; }
  .chat-info, .chat-name, .chat-time, .chat-preview, .chats-sidebar p { display: none; }
  .chat-avatar { margin: 0 auto; }
}
</style>
