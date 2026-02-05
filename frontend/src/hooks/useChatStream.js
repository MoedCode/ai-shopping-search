// src/hooks/useChatStream.js
import { useState, useRef } from 'react';
import { getGuestId, setGuestId } from '../services/guest';

export function useChatStream() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const abortControllerRef = useRef(null);

  // 1. Fetch History (GET)
  const loadHistory = async () => {
    const guestId = getGuestId();
    if (!guestId) return; // No history for new users

    // Get the last known session ID from local storage if you want to resume specific chat
    // For now, let's assume we want the last active session or handle it via UI later
    // This part depends on if you store session_id in localStorage too.
    const savedSessionId = localStorage.getItem('last_session_id'); 
    
    if(!savedSessionId) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/chat/session?session_id=${savedSessionId}`, {
        headers: { 'X-Guest-Id': guestId }
      });
      
      if (res.ok) {
        const history = await res.json();
        setSessionId(savedSessionId);
        // Map backend format to frontend format
        const formatted = history.map(msg => ({
          role: msg.role, // 'user' or 'assistant'
          content: msg.content,
          products: msg.metadata?.products || []
        }));
        setMessages(formatted);
      }
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  // 2. Send Message & Stream Response (POST)
  const sendMessage = async (content) => {
    setIsLoading(true);
    const guestId = getGuestId(); // Get existing ID or null

    // Optimistic Update: Show user message immediately
    const tempUserMsg = { role: 'user', content: content };
    setMessages(prev => [...prev, tempUserMsg]);

    // Prepare Assistant Placeholder
    setMessages(prev => [...prev, { role: 'assistant', content: '', products: [] }]);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/chat/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(guestId && { 'X-Guest-Id': guestId }) // Send ID if we have it
        },
        body: JSON.stringify({
          message: content,
          session_id: sessionId // Send current session ID to maintain context
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error('Network error');

      // --- STREAMING LOGIC ---
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = (buffer + chunk).split('\n\n');
        buffer = lines.pop() || ''; // Keep incomplete lines in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.replace('data: ', '').trim();
            if (jsonStr === '[DONE]') continue;

            try {
              const data = JSON.parse(jsonStr);

              // 1. Handle Metadata (Guest ID & Session ID)
              if (data.type === 'meta') {
                if (data.guest_id) setGuestId(data.guest_id);
                if (data.session_id) {
                    setSessionId(data.session_id);
                    localStorage.setItem('last_session_id', data.session_id);
                }
              }
              
              // 2. Handle Text Delta (Typing Effect)
              else if (data.type === 'text_delta') {
                setMessages(prev => {
                  const newMsgs = [...prev];
                  const lastMsg = newMsgs[newMsgs.length - 1];
                  if (lastMsg.role === 'assistant') {
                    lastMsg.content += data.delta;
                  }
                  return newMsgs;
                });
              }

              // 3. Handle Products (Tool Output)
              else if (data.type === 'tools-output-available' || data.type === 'tool-output-available') {
                 // Check if the output has 'hits' (Algolia structure)
                 const hits = data.output?.hits || [];
                 if (hits.length > 0) {
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        const lastMsg = newMsgs[newMsgs.length - 1];
                        lastMsg.products = hits;
                        return newMsgs;
                    });
                 }
              }

              // 4. Handle Errors
              else if (data.type === 'error') {
                console.error("Stream Error:", data.message);
                // Optionally append error to chat
              }

            } catch (e) {
              console.error("JSON Parse Error", e);
            }
          }
        }
      }

    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Fetch error:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    if(!sessionId) return;
    // Call delete endpoint if needed, then clear local state
    setMessages([]);
    setSessionId(null);
    localStorage.removeItem('last_session_id');
  };

  return { messages, isLoading, sendMessage, loadHistory, clearChat, sessionId };
}