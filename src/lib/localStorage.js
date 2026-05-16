const USERS_KEY = 'focus_users'
const SESSION_KEY = 'focus_session'
const TODOS_PREFIX = 'focus_todos_'
const SHOPPING_PREFIX = 'focus_shopping_'
const TODO_SYNC_PREFIX = 'focus_todo_sync_'
const SHOPPING_SYNC_PREFIX = 'focus_shopping_sync_'

/** Einfacher Hash für lokale Passwörter (nur Offline-Demo) */
function hashPassword(password) {
  let h = 0
  for (let i = 0; i < password.length; i++) {
    h = (Math.imul(31, h) + password.charCodeAt(i)) | 0
  }
  return `h${h}`
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

// ——— Auth (lokaler Fallback) ———

export function localGetSession() {
  return readJSON(SESSION_KEY, null)
}

export function localSetSession(user) {
  if (user) {
    writeJSON(SESSION_KEY, {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
    })
  } else localStorage.removeItem(SESSION_KEY)
}

export function localUpdateProfile(userId, { display_name }) {
  const session = localGetSession()
  if (!session || session.id !== userId) {
    return { error: { message: 'Nicht angemeldet.' } }
  }
  const users = readJSON(USERS_KEY, [])
  const idx = users.findIndex((u) => u.id === userId)
  if (idx >= 0) {
    users[idx].display_name = display_name
    writeJSON(USERS_KEY, users)
  }
  localSetSession({ ...session, display_name })
  return { success: true }
}

export function normalizeEmail(email) {
  return email.trim().toLowerCase()
}

export function localRegister(email, password, displayName) {
  const normalized = normalizeEmail(email)
  const users = readJSON(USERS_KEY, [])
  if (users.some((u) => u.email === normalized)) {
    return { error: { message: 'E-Mail ist bereits registriert.' } }
  }
  const user = {
    id: crypto.randomUUID(),
    email: normalized,
    display_name: displayName || normalized.split('@')[0],
    passwordHash: hashPassword(password),
  }
  users.push(user)
  writeJSON(USERS_KEY, users)
  localSetSession(user)
  return {
    user: { id: user.id, email: user.email, display_name: user.display_name },
  }
}

export function localLogin(email, password) {
  const normalized = normalizeEmail(email)
  const users = readJSON(USERS_KEY, [])
  const user = users.find((u) => u.email === normalized && u.passwordHash === hashPassword(password))
  if (!user) return { error: { message: 'E-Mail oder Passwort falsch.' } }
  localSetSession(user)
  return {
    user: {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
    },
  }
}

export function localLogout() {
  localSetSession(null)
}

// ——— Todos (lokaler Fallback) ———

function todosKey(userId) {
  return `${TODOS_PREFIX}${userId}`
}

function todoSyncKey(userId) {
  return `${TODO_SYNC_PREFIX}${userId}`
}

export function localGetTodos(userId) {
  return readJSON(todosKey(userId), [])
}

export function localSaveTodos(userId, todos) {
  writeJSON(todosKey(userId), todos)
}

export function localCreateTodo(userId, data) {
  const todos = localGetTodos(userId)
  const todo = {
    id: crypto.randomUUID(),
    user_id: userId,
    ...data,
    completed: false,
    pinned: !!data.pinned,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  todos.unshift(todo)
  localSaveTodos(userId, todos)
  return todo
}

export function localUpdateTodo(userId, id, updates) {
  const todos = localGetTodos(userId)
  const idx = todos.findIndex((t) => t.id === id)
  if (idx === -1) return null
  todos[idx] = { ...todos[idx], ...updates, updated_at: new Date().toISOString() }
  localSaveTodos(userId, todos)
  return todos[idx]
}

export function localDeleteTodo(userId, id) {
  const todos = localGetTodos(userId).filter((t) => t.id !== id)
  localSaveTodos(userId, todos)
}

export function localGetTodoSyncQueue(userId) {
  return readJSON(todoSyncKey(userId), [])
}

export function localSaveTodoSyncQueue(userId, queue) {
  writeJSON(todoSyncKey(userId), queue)
}

export function localQueueTodoSync(userId, op) {
  const queue = localGetTodoSyncQueue(userId)
  queue.push({ ...op, queued_at: new Date().toISOString() })
  localSaveTodoSyncQueue(userId, queue)
}

export function localClearTodoSyncQueue(userId) {
  localStorage.removeItem(todoSyncKey(userId))
}

// ——— Einkaufsliste (lokaler Fallback) ———

function shoppingKey(userId) {
  return `${SHOPPING_PREFIX}${userId}`
}

function shoppingSyncKey(userId) {
  return `${SHOPPING_SYNC_PREFIX}${userId}`
}

export function localGetShoppingItems(userId) {
  return readJSON(shoppingKey(userId), [])
}

export function localSaveShoppingItems(userId, items) {
  writeJSON(shoppingKey(userId), items)
}

export function localCreateShoppingItem(userId, data) {
  const items = localGetShoppingItems(userId)
  const item = {
    id: crypto.randomUUID(),
    user_id: userId,
    name: data.name.trim(),
    quantity: data.quantity?.trim() || '1',
    category: data.category || 'Sonstiges',
    note: data.note?.trim() || '',
    checked: false,
    _pendingSync: !!data._pendingSync,
    _syncState: data._syncState,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  items.unshift(item)
  localSaveShoppingItems(userId, items)
  return item
}

export function localUpdateShoppingItem(userId, id, updates) {
  const items = localGetShoppingItems(userId)
  const idx = items.findIndex((item) => item.id === id)
  if (idx === -1) return null
  items[idx] = { ...items[idx], ...updates, updated_at: new Date().toISOString() }
  localSaveShoppingItems(userId, items)
  return items[idx]
}

export function localDeleteShoppingItem(userId, id) {
  localSaveShoppingItems(
    userId,
    localGetShoppingItems(userId).filter((item) => item.id !== id),
  )
}

export function localGetShoppingSyncQueue(userId) {
  return readJSON(shoppingSyncKey(userId), [])
}

export function localSaveShoppingSyncQueue(userId, queue) {
  writeJSON(shoppingSyncKey(userId), queue)
}

export function localQueueShoppingSync(userId, op) {
  const queue = localGetShoppingSyncQueue(userId)
  queue.push({ ...op, queued_at: new Date().toISOString() })
  localSaveShoppingSyncQueue(userId, queue)
}

export function localClearShoppingSyncQueue(userId) {
  localStorage.removeItem(shoppingSyncKey(userId))
}
