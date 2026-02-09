// ai-shopping-search/frontend/src/services/api.js
import axios from 'axios'
import { getGuestId } from './guest'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const client = axios.create({ baseURL: API_URL })

// Add Guest ID header to every request
client.interceptors.request.use(async (cfg) => {
  const guestId = await getGuestId()
  if (guestId) cfg.headers['X-Guest-Id'] = guestId
  return cfg
})

// --- Endpoints ---
const CHAT_ENDPOINT = '/chat/session'
const SAVED_ENDPOINT = '/chat/saved-products'
const AUTH_ENDPOINT = '/accounts/auth'
const SOCIAL_GOOGLE_ENDPOINT = '/accounts/google/'
const LOGOUT_ENDPOINT = '/accounts/logout'

// --- Chat & Session APIs ---

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

// FIX: Renamed 'title' to 'session_title' to match backend expectation
export const renameSession = async (guestId, sessionId, newTitle) => {
    return client.patch(CHAT_ENDPOINT, { 
        guest_id: guestId, 
        session_id: sessionId, 
        session_title: newTitle 
    })
}

// FIX: Use Query Params for Delete Message to prevent 404/Body parsing issues
export const deleteMessage = async (guestId, messageId) => {
    return client.delete(`${CHAT_ENDPOINT}?message_id=${messageId}&guest_id=${guestId}`)
}

// --- My Stuff (Saved Products) ---

export const saveProduct = async (productData) => client.post(SAVED_ENDPOINT, productData)
export const getSavedProducts = async () => client.get(SAVED_ENDPOINT)
export const removeSavedProduct = async (dbId) => client.delete(SAVED_ENDPOINT, { data: { id: dbId } })

// --- Authentication APIs (Restored) ---

export const authenticateUser = async (email, password, guestId) => {
    return client.post(AUTH_ENDPOINT, { 
        email, 
        password, 
        guest_id: guestId 
    });
}

export const socialLogin = async (provider, accessToken) => {
    // Dynamically select endpoint based on provider
    const endpoint = provider === 'google' ? SOCIAL_GOOGLE_ENDPOINT : `/accounts/${provider}/`;
    
    // dj-rest-auth expects 'access_token' in the body
    return client.post(endpoint, { 
        access_token: accessToken 
    });
}

export const logoutUser = async () => {
    return client.post(LOGOUT_ENDPOINT);
}

export const deleteAccount = async (guestId) => {
    return client.delete(AUTH_ENDPOINT, { data: { guest_id: guestId } });
}

export default client