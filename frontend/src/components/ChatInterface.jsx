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

  useEffect(() => {
    // on mount, check cookie/localStorage and fetch history if present
    ;(async () => {
      const id = await getGuestId()
      if (id) {
        setGuestId(id)
        await fetchHistory(id)
      }
    })()
  }, [])

  // scroll to bottom when messages change
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  async function fetchHistory(id) {
    try {
      setError(null)
      const res = await api.get('/chat/guest', { params: { guest_id: id } })
      setMessages(res.data || [])
    } catch (err) {
      // if guest not found: clear and let user create new on first message
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
      // ensure guest exists (create if needed)
      const id = await ensureGuest()
      setGuestId(id)
      // send chat
      const res = await api.post('/chat/guest', { guest_id: id, message: text })
      setMessages((m) => [...m, res.data])
      setText('')
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

  return (
    <div className="chat-wrapper">
      <div className="chat-header">
        <div className="chat-title">Support Chat</div>
        <button className="delete-button" onClick={deleteAll} title="Clear chat" disabled={!guestId || messages.length === 0}>Delete All</button>
      </div>

      {error && <div className="error-banner" role="alert">{error}</div>}
      <div ref={listRef} className="messages" role="list">
        {messages.length === 0 && (
          <div className="empty-state">No messages yet. Start chatting!</div>
        )}

        {messages.map((m, i) => (
          <div key={i} className="message-pair">
            {/* user message */}
            {m.message && (
              <div className="message-bubble outgoing" role="listitem">
                {m.message}
              </div>
            )}
            {/* bot response */}
            {m.response && (
              <div className="message-bubble incoming" role="listitem">
                {m.response}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="input-area">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') sendMessage() }}
          placeholder="Type a message..."
          className="chat-input"
        />
        <button onClick={sendMessage} className="send-button" aria-label="Send message" disabled={!text.trim()}>
          ➤
        </button>
      </div>
    </div>
  )
}