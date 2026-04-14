'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminChat() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);

  // Зареждане на сесиите
  const loadSessions = async () => {
    try {
      const res = await fetch('/api/chat/admin');
      const data = await res.json();
      setSessions(data.sessions || []);
      setLoading(false);
    } catch (err) {
      console.error('Грешка:', err);
    }
  };

  // Зареждане на съобщения за избрана сесия
  const loadMessages = async (sessionId) => {
    try {
      const res = await fetch(`/api/chat?sessionId=${sessionId}&admin=true`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Грешка:', err);
    }
  };

  // Изпращане на съобщение от админ
  const sendMessage = async () => {
    if (!input.trim() || !selectedSession) return;
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSession.session_id,
          sender: 'admin',
          message: input
        })
      });
      
      if (res.ok) {
        setInput('');
        await loadMessages(selectedSession.session_id);
      }
    } catch (err) {
      console.error('Грешка:', err);
    }
  };

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 5000); // Опресняване на всеки 5 секунди
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedSession) {
      loadMessages(selectedSession.session_id);
      const interval = setInterval(() => loadMessages(selectedSession.session_id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedSession]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a, #1e1b4b, #2e1065)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'white' }}>Зареждане на чатовете...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a, #1e1b4b, #2e1065)', padding: '2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>💬 Администраторски чат</h1>
          <Link href="/admin" style={{ background: '#8b5cf6', padding: '0.5rem 1rem', borderRadius: '8px', color: 'white', textDecoration: 'none' }}>
            ← Назад към админ панела
          </Link>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1rem', height: 'calc(100vh - 120px)' }}>
          {/* Списък със сесии */}
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', overflowY: 'auto' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 style={{ color: 'white' }}>Активни чатове</h3>
              <p style={{ color: '#64748b', fontSize: '12px' }}>{sessions.length} активни разговора</p>
            </div>
            {sessions.length === 0 ? (
              <div style={{ padding: '1rem', color: '#64748b', textAlign: 'center' }}>
                Няма активни чатове
              </div>
            ) : (
              sessions.map(session => (
                <div
                  key={session.session_id}
                  onClick={() => setSelectedSession(session)}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    background: selectedSession?.session_id === session.session_id ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'white', fontWeight: 'bold' }}>
                      {session.visitor_name || 'Анонимен'}
                    </span>
                    {session.unreadCount > 0 && (
                      <span style={{ 
                        background: '#ef4444', 
                        borderRadius: '50%', 
                        padding: '2px 6px', 
                        fontSize: '12px', 
                        color: 'white',
                        fontWeight: 'bold'
                      }}>
                        {session.unreadCount}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    {session.lastMessage?.message?.substring(0, 40) || 'Няма съобщения'}...
                  </div>
                  <div style={{ fontSize: '10px', color: '#475569', marginTop: '4px' }}>
                    {new Date(session.last_message_at).toLocaleString('bg-BG')}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Чат прозорец за админ */}
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
            {selectedSession ? (
              <>
                <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <h3 style={{ color: 'white' }}>Чат с {selectedSession.visitor_name || 'Анонимен'}</h3>
                  <p style={{ color: '#64748b', fontSize: '12px' }}>
                    ID на сесията: {selectedSession.session_id}
                  </p>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                  {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#64748b', marginTop: '2rem' }}>
                      Няма съобщения в този чат
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <div key={idx} style={{
                        marginBottom: '1rem',
                        textAlign: msg.sender === 'admin' ? 'right' : 'left'
                      }}>
                        <div style={{
                          display: 'inline-block',
                          padding: '0.5rem 1rem',
                          borderRadius: '12px',
                          background: msg.sender === 'admin' ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
                          color: 'white',
                          maxWidth: '70%',
                          wordWrap: 'break-word'
                        }}>
                          {msg.message}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                          {new Date(msg.created_at).toLocaleString('bg-BG')}
                          {msg.sender === 'visitor' && !msg.is_read && ' (непрочетено)'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Напиши отговор..."
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(139, 92, 246, 0.5)',
                      background: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      outline: 'none'
                    }}
                  />
                  <button onClick={sendMessage} style={{
                    padding: '0.75rem 1rem',
                    background: '#8b5cf6',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer'
                  }}>
                    📤 Изпрати
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                  <p>Избери чат от ляво, за да отговориш на клиент</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}