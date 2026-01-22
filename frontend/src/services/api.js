// src/services/api.js
import axios from 'axios';

// عنوان الباك إند (تأكد إنه نفس بورت جانغو)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const chatService = {
  // دالة إرسال الرسالة
  sendMessage: async (message, history = []) => {
    try {
      // Endpoint: /shopping-chat/ (تأكد من الاسم في urls.py عندك)
      const response = await apiClient.post('/shopping-chat/', {
        query: message,
        history: history
      });
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      throw error; // بنرمي الخطأ عشان الواجهة تتعامل معاه
    }
  }
};