'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminChat() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    try {
      const res = await fetch('/api/chat/admin');
      const data = await res.json();
      setSessions(data.sessions || []);
      setLoading(false);
    } catch (err) {
      console.error('Грешка при зареждане на сесии:', err);
      setLoading(false);
    }
  };

  const loadMessages = async (sessionId) => {
    try {
      const res = await fetch(`/api/chat?sessionId=${sessionId}&admin=true`);
      const data = await res.json();
      setMessages(data.messages || []);
      await loadSessions();
    } catch (err) {
      console.error('Грешка при зареждане на съобщения:', err);
    }
  };

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
        await loadSessions();
      }
    } catch (err) {
      console.error('Грешка при изпращане:', err);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!confirm('Сигурни ли сте?')) return;
    try {
      const res = await fetch(`/api/chat?id=${messageId}`, { method: 'DELETE' });
      if (res.ok) {
        await loadMessages(selectedSession.session_id);
        await loadSessions();
      }
    } catch (err) {
      console.error(err);
    }
  };

const deleteSelectedSession = async () => {
  console.log('1. deleteSelectedSession извикана');
  if (!selectedSession) {
    console.log('2. Няма selectedSession');
    return;
  }
  console.log('3. Session ID:', selectedSession.session_id);
  
  if (!confirm(`Изтриване на чата с ${selectedSession.visitor_name || 'Анонимен'}?`)) {
    console.log('4. Потребителят отказа');
    return;
  }
  
  try {
    console.log('5. Изпращам DELETE заявка към /api/chat/messages');
    const res = await fetch(`/api/chat/messages?sessionId=${selectedSession.session_id}`, {
      method: 'DELETE'
    });
    console.log('6. Отговор:', res.status);
    
    if (res.ok) {
      setMessages([]);
      await loadSessions();
      alert('Чатът е изтрит');
    } else {
      const text = await res.text();
      console.log('7. Грешка:', text);
      alert(`Грешка: ${res.status}`);
    }
  } catch (err) {
    console.error('8. Грешка:', err);
    alert('Възникна грешка');
  }
};

const blockUser = async () => {
  console.log('🔍 blockUser извикана');
  if (!selectedSession) {
    alert('Няма избран потребител');
    return;
  }
  
  if (!confirm(`Блокиране на ${selectedSession.visitor_name || 'Анонимен'}?`)) return;
  
  try {
    const res = await fetch('/api/chat/admin/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: selectedSession.session_id })
    });
    console.log('📡 Отговор blockUser:', res.status);
    
    if (res.ok) {
      await loadSessions();
      alert('Потребителят е блокиран');
    } else {
      alert(`Грешка: ${res.status}`);
    }
  } catch (err) {
    console.error('❌ Грешка:', err);
    alert('Възникна грешка');
  }
};

const deleteUser = async () => {
  console.log('🔍 deleteUser извикана');
  if (!selectedSession) {
    alert('Няма избран потребител');
    return;
  }
  
  if (!confirm(`Изтриване на ${selectedSession.visitor_name || 'Анонимен'}?`)) return;
  
  try {
    const res = await fetch(`/api/chat/admin?sessionId=${selectedSession.session_id}`, {
      method: 'DELETE'
    });
    console.log('📡 Отговор deleteUser:', res.status);
    
    if (res.ok) {
      await loadSessions();
      setSelectedSession(null);
      setMessages([]);
      alert('Потребителят е изтрит');
    } else {
      alert(`Грешка: ${res.status}`);
    }
  } catch (err) {
    console.error('❌ Грешка:', err);
    alert('Възникна грешка');
  }
};

  const saveChatToFile = () => {
    if (!selectedSession || messages.length === 0) return;
    const now = new Date();
    const fileName = `${selectedSession.visitor_name || 'anonymous'}_${now.toISOString().slice(0,19)}.txt`;
    let content = `=== Чат с ${selectedSession.visitor_name || 'Анонимен'} ===\n`;
    messages.forEach(msg => {
      const sender = msg.sender === 'admin' ? 'Администратор' : (selectedSession.visitor_name || 'Посетител');
      content += `[${new Date(msg.created_at).toLocaleString()}] ${sender}: ${msg.message}\n`;
    });
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 5000);
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
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', overflowY: 'auto' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 style={{ color: 'white' }}>Активни чатове</h3>
              <p style={{ color: '#64748b', fontSize: '12px' }}>{sessions.length} активни разговора</p>
            </div>
            {sessions.length === 0 ? (
              <div style={{ padding: '1rem', color: '#64748b', textAlign: 'center' }}>Няма активни чатове</div>
            ) : (
              sessions.map(ses => (
                <div
                  key={ses.session_id}
                  onClick={() => setSelectedSession(ses)}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    background: selectedSession?.session_id === ses.session_id ? 'rgba(139, 92, 246, 0.2)' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'white', fontWeight: 'bold' }}>{ses.visitor_name || 'Анонимен'}</span>
                    {ses.unreadCount > 0 && (
                      <span style={{ background: '#ef4444', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', color: 'white' }}>
                        {ses.unreadCount}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    {ses.lastMessage?.message?.substring(0, 40) || 'Няма съобщения'}...
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
            {selectedSession ? (
              <>
                <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <h3 style={{ color: 'white' }}>Чат с {selectedSession.visitor_name || 'Анонимен'}</h3>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                  {messages.map((msg, idx) => (
                    <div key={idx} style={{ marginBottom: '1rem', textAlign: msg.sender === 'admin' ? 'right' : 'left' }}>
                      <div style={{ display: 'inline-block', padding: '0.5rem 1rem', borderRadius: '12px', background: msg.sender === 'admin' ? '#8b5cf6' : 'rgba(255,255,255,0.1)', color: 'white', maxWidth: '70%' }}>
                        {msg.message}
                      </div>
                      <button onClick={() => deleteMessage(msg.id)} style={{ marginLeft: '0.5rem', background: 'rgba(255,0,0,0.3)', border: 'none', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer' }}>🗑️</button>
                    </div>
                  ))}
                </div>
                
                <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button onClick={deleteSelectedSession} style={{ background: '#ea580c', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', color: 'white' }}>🗑️ Изтрий чат</button>
                  <button onClick={blockUser} style={{ background: '#7c3aed', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', color: 'white' }}>🚫 Блокирай</button>
                  <button onClick={deleteUser} style={{ background: '#dc2626', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', color: 'white' }}>❌ Изтрий потребител</button>
                  <button onClick={saveChatToFile} style={{ background: '#059669', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', color: 'white' }}>💾 Запиши чат</button>
                  <div style={{ flex: 1 }}></div>
                  <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder="Отговор..." style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #8b5cf6', background: 'rgba(0,0,0,0.5)', color: 'white', width: '200px' }} />
                  <button onClick={sendMessage} style={{ background: '#8b5cf6', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', color: 'white' }}>📤</button>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                  <p>Избери чат от ляво</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}