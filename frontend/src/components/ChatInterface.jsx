// ai-shopping-search/frontend/src/components/ChatInterface.jsx
'use client'
import { useEffect, useState, useRef } from 'react'
import api from '../services/api'
import { ensureGuest, getGuestId } from '../services/guest'

export default function ChatInterface() {
  const [guestId, setGuestId] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [error, setError] = useState(null)

  const listRef = useRef(null)
  const textareaRef = useRef(null) // 1. مرجع جديد للتحكم في حجم الصندوق

  useEffect(() => {
    ;(async () => {
      const id = await getGuestId()
      if (id) {
        setGuestId(id)
        await fetchHistory(id)
      }
    })()
  }, [])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  // 2. هذا هو السحر: كود لتمديد الصندوق تلقائياً مع كل حرف
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // تصفير الارتفاع أولاً
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'; // وضعه على حجم النص الجديد
    }
  }, [text])

  async function fetchHistory(id) {
    try {
      setError(null)
      const res = await api.get('/chat/guest', { params: { guest_id: id } })
      setMessages(res.data || [])
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setGuestId(null)
      } else {
        console.error(err)
        setError('Failed to load chat history')
      }
    }
  }

  async function sendMessage() {
    if (!text.trim()) return
    try {
      setError(null)
      const id = await ensureGuest()
      setGuestId(id)
      const res = await api.post('/chat/guest', { guest_id: id, message: text })
      setMessages((m) => [...m, res.data])
      setText('')

      // إعادة ارتفاع الصندوق للوضع الطبيعي بعد الإرسال
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.error(err)
      setError('Failed to send message')
    }
  }

  async function deleteAll() {
    if (!guestId) return
    await api.delete('/chat/guest', { data: { guest_id: guestId } })
    setMessages([])
  }

  // دالة لمعالجة زر Enter (بدون شيفت يرسل، مع شيفت ينزل سطر)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="chat-wrapper">
      <div className="chat-header">
        <div className="chat-title">Support Chat</div>
        <button className="delete-button" onClick={deleteAll} title="Clear chat" disabled={!guestId || messages.length === 0}>Delete All</button>
      </div>

      {error && <div className="error-banner" role="alert">{error}</div>}

      <div ref={listRef} className="messages scrollbar-hide" role="list">
        {messages.length === 0 && (
          <div className="message-pair animation-fade-in">
            <div className="message-bubble incoming" style={{ maxWidth: '90%', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}>
              <div className="space-y-3 p-1">
                <h4 className="text-lg font-bold text-blue-900">👋 Stop searching, start finding.</h4>
                <p className="text-gray-700 leading-relaxed">Finding the <span className="font-bold text-blue-600">Best Product</span> with the <span className="font-bold text-green-600">Best Price</span> shouldn't be boring or time-consuming.</p>
                <p className="text-gray-700 leading-relaxed">Just tell me what you need! I will instantly scout the market for <strong>Top Quality</strong>, <strong>Lowest Prices</strong>, and <strong>Fastest Shipping</strong>.</p>
                <div className="mt-3 pt-3 border-t border-blue-200 text-blue-800 font-medium">🚀 Let me do the hard work for you in seconds. What are you looking for today?</div>
              </div>
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className="message-pair">
            {m.message && <div className="message-bubble outgoing">{m.message}</div>}
            {m.response && <div className="message-bubble incoming">{m.response}</div>}
          </div>
        ))}
      </div>

      {/* 3. استبدال input بـ textarea */}
      <div className="input-area">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="chat-input"
          rows={1}
          style={{ resize: 'none', overflow: 'hidden' }} // منع المستخدم من تغيير الحجم يدوياً
        />
        <button onClick={sendMessage} className="send-button" aria-label="Send message" disabled={!text.trim()}>
          ➤
        </button>
      </div>
    </div>
  )
}