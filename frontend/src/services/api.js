// ai-shopping-search/frontend/src/services/api.js
import axios from 'axios'
import { getGuestId } from './guest'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const client = axios.create({ baseURL: API_URL })

client.interceptors.request.use(async (cfg) => {
  const guestId = await getGuestId()
  if (guestId) cfg.headers['X-Guest-Id'] = guestId
  return cfg
})

const CHAT_ENDPOINT = '/chat/session' // تم تصحيح المسار ليتوافق مع urls.py
const SAVED_ENDPOINT = '/chat/saved-products'

// --- Sessions ---
export const fetchUserSessions = async (guestId) => {
  return client.get(CHAT_ENDPOINT, { params: { guest_id: guestId } })
}

export const fetchSessionMessages = async (guestId, sessionId) => {
    return client.get(CHAT_ENDPOINT, { params: { guest_id: guestId, session_id: sessionId } })
}

export const sendChatMessage = async (guestId, message, sessionId) => {
  return client.post(CHAT_ENDPOINT, { guest_id: guestId, message, session_id: sessionId })
}

export const deleteSession = async (guestId, sessionId) => {
    return client.delete(CHAT_ENDPOINT, { data: { guest_id: guestId, session_id: sessionId } })
}

export const renameSession = async (guestId, sessionId, newTitle) => {
    return client.patch(CHAT_ENDPOINT, { 
        guest_id: guestId, 
        session_id: sessionId,
        title: newTitle 
    })
}

// --- My Stuff (Saved Products) ---
export const saveProduct = async (productData) => {
    return client.post(SAVED_ENDPOINT, productData)
}

export const getSavedProducts = async () => {
    return client.get(SAVED_ENDPOINT)
}

export const removeSavedProduct = async (dbId) => {
    return client.delete(SAVED_ENDPOINT, { data: { id: dbId } })
}

export default client