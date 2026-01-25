export const GUEST_KEY = 'guest_id'

export function getGuestIdFromCookie() {
  const m = document.cookie.match(/(?:^|; )guest_id=([^;]+)/)
  return m ? m[1] : null
}
export function getGuestIdFromLocal() {
  return localStorage.getItem(GUEST_KEY)
}
export async function getGuestId() {
  return typeof window !== 'undefined'
    ? getGuestIdFromLocal() || getGuestIdFromCookie()
    : null
}
export function setGuestId(id, { cookie = true } = {}) {
  localStorage.setItem(GUEST_KEY, id)
  if (cookie) {
    // adjust max-age as you like (e.g., 30 days)
    document.cookie = `guest_id=${id};path=/;max-age=${60 * 60 * 24 * 30};SameSite=Lax`
  }
}
export function clearGuestId() {
  localStorage.removeItem(GUEST_KEY)
  document.cookie = `guest_id=;path=/;max-age=0`
}
import api from './api'
export async function createGuest() {
  // correct backend endpoint: /chat/guest/create
  const res = await api.post('/chat/guest/create')
  // backend returns guest serializer => { guest_id: '...', created_at: ... }
  const id = res.data.guest_id || res.data.id
  if (!id) throw new Error('No guest id returned')
  setGuestId(id)
  return id
}
export async function ensureGuest() {
  let id = await getGuestId()
  if (id) return id
  return createGuest()
}