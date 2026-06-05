/**
 * Playerok Python Backend API Client
 * =====================================
 * Talks to the FastAPI backend at /playerok-api/*
 * which internally uses the playerok-requests-api library.
 *
 * The Vite proxy forwards /playerok-api → http://localhost:8080
 */
import axios from 'axios'

const playerokApi = axios.create({
  baseURL: '/playerok-api',
  timeout: 30000, // Playerok GraphQL can be slow
  headers: { 'Content-Type': 'application/json' }
})

// ── Response interceptor ─────────────────────────────
playerokApi.interceptors.response.use(
  res => res,
  err => {
    const msg = err?.response?.data?.detail || err.message || 'Playerok API error'
    console.warn('[PlayerokAPI]', msg)
    return Promise.reject(new Error(msg))
  }
)

// ── Helper to unwrap the { success, data } envelope ─
const unwrap = (res) => res.data.data

// ══════════════════════════════════
// Users
// ══════════════════════════════════

/** Full profile: nickname, testimonials, total_items, purchases, sales, active, finished */
export async function fetchProfile() {
  return unwrap(await playerokApi.get('/api/user/profile'))
}

/** Get authenticated user's username & id */
export async function fetchUsername() {
  return unwrap(await playerokApi.get('/api/user/username'))
}

/** Full balance: allBalance, available, pendingIncome, frozen */
export async function fetchBalance() {
  return unwrap(await playerokApi.get('/api/user/balance'))
}

/** Full user info object from Playerok */
export async function fetchFullUserInfo() {
  return unwrap(await playerokApi.get('/api/user/full-info'))
}

/** Resolve a Playerok username → user ID */
export async function fetchUserIdByUsername(username) {
  return unwrap(await playerokApi.get(`/api/user/id/${username}`))
}

// ══════════════════════════════════
// Deals (Сделки)
// ══════════════════════════════════

/** Get all current/paid deals */
export async function fetchActualDeals() {
  return unwrap(await playerokApi.get('/api/deals/actual'))
}

/** Confirm a deal by ID */
export async function confirmDeal(dealId) {
  return unwrap(await playerokApi.post('/api/deals/confirm', { deal_id: dealId }))
}

// ══════════════════════════════════
// Items / Lots (Товары)
// ══════════════════════════════════

/** Fetch lots page (paginated) */
export async function fetchLots(afterCursor = null) {
  const params = afterCursor ? { after_cursor: afterCursor } : {}
  return unwrap(await playerokApi.get('/api/items/lots', { params }))
}

/** Fetch ALL lots (auto-paginated, may be slow) */
export async function fetchAllLots(searchFilter = null) {
  const params = searchFilter ? { search_filter: searchFilter } : {}
  return unwrap(await playerokApi.get('/api/items/lots/all', { params }))
}

/** Get exhibited (listed/active) lots */
export async function fetchExhibitedLots(userId = null, afterCursor = null) {
  const params = {}
  if (userId) params.userid = userId
  if (afterCursor) params.after_cursor = afterCursor
  return unwrap(await playerokApi.get('/api/items/exhibited', { params }))
}

/** Get ALL exhibited lots (auto-paginated) */
export async function fetchAllExhibitedLots(userId = null) {
  const params = userId ? { userid: userId } : {}
  return unwrap(await playerokApi.get('/api/items/exhibited/all', { params }))
}

/** Get item search position by slug */
export async function fetchItemPosition(itemSlug) {
  return unwrap(await playerokApi.get(`/api/items/position/${itemSlug}`))
}

/** Boost item priority */
export async function increaseItemPriority(itemId) {
  return unwrap(await playerokApi.post(`/api/items/${itemId}/priority`))
}

/** Refill (re-list) a finished item */
export async function refillItem(itemId) {
  return unwrap(await playerokApi.post(`/api/items/${itemId}/refill`))
}

/** Copy product from a Playerok URL */
export async function copyProduct(link) {
  return unwrap(await playerokApi.post('/api/items/copy', { link }))
}

/** Get product data from a Playerok URL */
export async function fetchProductData(link) {
  return unwrap(await playerokApi.get('/api/items/product-data', { params: { link } }))
}

// ══════════════════════════════════
// Chats (Чаты)
// ══════════════════════════════════

/** Fetch a page of chats */
export async function fetchChats(afterCursor = null) {
  const params = afterCursor ? { after_cursor: afterCursor } : {}
  return unwrap(await playerokApi.get('/api/chats', { params }))
}

/** Get chat messages info */
export async function fetchMessagesInfo(unreadOnly = false) {
  return unwrap(await playerokApi.get('/api/chats/messages', { params: { unread: unreadOnly } }))
}

/** Get unread message count */
export async function fetchUnreadCount() {
  return unwrap(await playerokApi.get('/api/chats/unread'))
}

/** Get new messages */
export async function fetchNewMessages(interval = 5, maxInterval = 30) {
  return unwrap(await playerokApi.get('/api/chats/new-messages', { params: { interval, max_interval: maxInterval } }))
}

/** Get status messages in time window */
export async function fetchStatusMessages(difference = 300) {
  return unwrap(await playerokApi.get('/api/chats/status-messages', { params: { difference } }))
}

/** Send a message to a user */
export async function sendMessage(username, text) {
  return unwrap(await playerokApi.post('/api/chats/send', { username, text }))
}

/** Get chat ID for a username */
export async function fetchChatUserId(profileUsername, username) {
  return unwrap(await playerokApi.get(`/api/chats/user-id/${profileUsername}/${username}`))
}

// ══════════════════════════════════
// Health
// ══════════════════════════════════

/** Check if the Python backend is reachable and cookies are configured */
export async function checkBackendHealth() {
  try {
    const res = await playerokApi.get('/health', { timeout: 3000 })
    return res.data
  } catch {
    return { healthy: false, playerok_lib: false, cookies_file: false }
  }
}

export default playerokApi
