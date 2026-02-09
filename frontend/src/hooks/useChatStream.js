// src/hooks/useChatStream.js
// ai-shopping-search/frontend/src/hooks/useChatStream.js
import { useState, useRef, useEffect } from 'react';
import { getGuestId, setGuestId, ensureGuest } from '../services/guest';
import { fetchSessionMessages } from '../services/api'; // Ensure this is imported

export function useChatStream() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null); // New Error State
  const [sessionId, setSessionId] = useState(null);
  const [guestId, setGuestIdState] = useState(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const initGuest = async () => {
      const id = await ensureGuest();
      setGuestIdState(id);
    };
    initGuest();
  }, []);

  useEffect(() => {
    if (guestId) {
      loadHistory();
    }
  }, [guestId]);

  // Helper: Fetch latest state from DB (Fixes Problem #2)
  const syncWithBackend = async (currentSessionId) => {
    if (!guestId || !currentSessionId) return;
    try {
        const res = await fetchSessionMessages(guestId, currentSessionId);
        const history = res.data;
        
        const formatted = history.map(msg => ({
          role: msg.role,
          content: msg.content,
          products: msg.metadata?.products || []
        }));
        setMessages(formatted);
    } catch (err) {
        console.error("Sync failed:", err);
    }
  };

  const loadHistory = async () => {
    if (!guestId) return;
    const savedSessionId = localStorage.getItem('last_session_id'); 
    if (!savedSessionId) return;
    setSessionId(savedSessionId);
    await syncWithBackend(savedSessionId);
  };

  // Modified sendMessage to support Retries and Timeouts
  const sendMessage = async (content, existingClientMessageId = null) => {
    setIsLoading(true);
    setError(null);
    
    // Generate ID if not providing one (Retries provide the old ID)
    const clientMessageId = existingClientMessageId || crypto.randomUUID();

    // Optimistic Update (Only if new message)
    if (!existingClientMessageId) {
        const tempUserMsg = { role: 'user', content: content };
        setMessages(prev => [...prev, tempUserMsg]);
        setMessages(prev => [...prev, { role: 'assistant', content: '', products: [] }]);
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // 1. TIMEOUT LOGIC (8 Seconds)
    const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setError("timeout"); // Trigger specific timeout error
        }
    }, 8000);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/chat/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(guestId && { 'X-Guest-Id': guestId })
        },
        body: JSON.stringify({
          message: content,
          session_id: sessionId,
          client_message_id: clientMessageId // Pass ID for Deduplication
        }),
        signal: signal,
      });

      // Clear timeout as soon as we get headers back
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Network error');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentSessionId = sessionId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = (buffer + chunk).split('\n\n');
        buffer = lines.pop() || ''; 

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.replace('data: ', '').trim();
            if (jsonStr === '[DONE]') continue;

            try {
              const data = JSON.parse(jsonStr);

              if (data.type === 'meta') {
                if (data.session_id) {
                    currentSessionId = data.session_id;
                    setSessionId(data.session_id);
                    localStorage.setItem('last_session_id', data.session_id);
                }
              }
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
              else if (data.type === 'tools-output-available' || data.type === 'tool-output-available') {
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
              else if (data.type === 'error') {
                throw new Error(data.message);
              }

            } catch (e) { console.error("Parse Error", e); }
          }
        }
      }

      // 2. REFETCH LOGIC (Problem #2 Fix)
      // As soon as stream ends successfully, force a fetch from DB
      // This guarantees the UI matches the persisted DB state (products + text)
      if (currentSessionId) {
          await syncWithBackend(currentSessionId); 
      }

    } catch (error) {
      if (error.name === 'AbortError' || error.message === 'timeout') {
        setError('timeout');
      } else {
        setError('network');
        console.error('Fetch error:', error);
      }
      
      // Update UI to show error message in the chat bubble
      setMessages(prev => {
          const newMsgs = [...prev];
          const lastMsg = newMsgs[newMsgs.length - 1];
          if (lastMsg.role === 'assistant') {
              lastMsg.isError = true;
              lastMsg.content = "Something went wrong.";
          }
          return newMsgs;
      });

    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    setMessages([]);
    setSessionId(null);
    localStorage.removeItem('last_session_id');
  };

  return { messages, isLoading, error, sendMessage, loadHistory, clearChat, sessionId };
}