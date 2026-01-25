import axios from 'axios'
import { getGuestId } from './guest'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const client = axios.create({ baseURL: API_URL })

client.interceptors.request.use(async (cfg) => {
  const guestId = await getGuestId()
  if (guestId) cfg.headers['X-Guest-Id'] = guestId
  return cfg
})

const CHAT_ENDPOINT = '/chat/guest'

export const fetchChatHistory = async (guestId) => {
  return client.get(CHAT_ENDPOINT, { params: { guest_id: guestId } })
}

export const sendChatMessage = async (guestId, message) => {
  return client.post(CHAT_ENDPOINT, { guest_id: guestId, message })
}

export const deleteChatHistory = async (guestId) => {
  return client.delete(CHAT_ENDPOINT, { data: { guest_id: guestId } })
}

export default client