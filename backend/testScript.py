import requests
import json

# الإعدادات (تأتي من .env)
ALGOLIA_AGENT_URL = "https://shopping-agent.algolia.com/api/v1/chat" # مثال للرابط
HEADERS = {
    "Authorization": "Bearer YOUR_ALGOLIA_API_KEY",
    "Content-Type": "application/json"
}

# 1. تجهيز الطلب (البيانات الخام)
payload = {
    "message": "i need a 30 inchs width screen laptop ..if it possible to find ..and with 32GB RAM and 1TP ssd m2 mnve ..AMD rizone 9 9 generation or more",
    "session_id": "chat_session_550e8400-e29b", # لربط السياق
    "user_context": {
        "is_guest": True,
        "location": "Egypt"
    }
}

# 2. إرسال الطلب فعلياً
response = requests.post(ALGOLIA_AGENT_URL, json=payload, headers=HEADERS)

# 3. طباعة النتيجة
print(response.json())