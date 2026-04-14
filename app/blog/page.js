'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        
        // Добави timeout от 10 секунди
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const res = await fetch('/api/blog', {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        
        const data = await res.json();
        
        // Ако data е масив, използвай него, иначе ако има posts поле
        const postsArray = Array.isArray(data) ? data : (data.posts || []);
        setPosts(postsArray);
        
      } catch (err) {
        console.error('Грешка при зареждане:', err);
        setError(err.message === 'abort' ? 'Заявката отне твърде много време' : 'Неуспешно зареждане на статиите');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a, #1e1b4b, #2e1065)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div style={{ color: 'white', fontSize: '1.2rem' }}>Зареждане...</div>
        <div style={{ color: '#8b5cf6', marginTop: '1rem' }}>⏳ Моля, изчакайте</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a, #1e1b4b, #2e1065)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div style={{ color: '#ef4444', fontSize: '1.2rem' }}>❌ {error}</div>
        <button 
          onClick={() => window.location.reload()} 
          style={{ marginTop: '1rem', background: '#8b5cf6', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}
        >
          Опитай отново
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a, #1e1b4b, #2e1065)' }}>
      {/* Hero секция */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(0,0,0,0.8))',
        padding: '4rem 2rem',
        textAlign: 'center',
        borderBottom: '1px solid rgba(139, 92, 246, 0.3)'
      }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>
          📝 AI Блог
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#cbd5e1', maxWidth: '600px', margin: '0 auto' }}>
          Последни новини, уроци и вдъхновение от света на изкуствения интелект
        </p>
      </div>

      {/* Списък със статии */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#cbd5e1' }}>
            📭 Все още няма публикувани статии
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
            {posts.map(post => (
              <Link href={`/blog/${post.slug}`} key={post.id} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  transition: 'transform 0.3s ease',
                  cursor: 'pointer',
                  height: '100%'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    {post.tags?.slice(0, 2).map(tag => (
                      <span key={tag} style={{
                        background: 'rgba(139, 92, 246, 0.3)',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '50px',
                        fontSize: '0.75rem',
                        color: '#c4b5fd'
                      }}>#{tag}</span>
                    ))}
                  </div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.75rem' }}>
                    {post.title}
                  </h2>
                  <p style={{ color: '#cbd5e1', marginBottom: '1rem', lineHeight: '1.5' }}>
                    {post.excerpt}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#8b5cf6' }}>
                    <span>{new Date(post.date).toLocaleDateString('bg-BG')}</span>
                    <span>Прочети повече →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      {/* Чат компонент */}
      <ChatWidget />
    </div>
  );
}

// Chat компонент за клиенти
function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  // Инициализирай сесията
  useEffect(() => {
    let storedSessionId = localStorage.getItem('chat_session_id');
    if (!storedSessionId) {
      storedSessionId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('chat_session_id', storedSessionId);
    }
    setSessionId(storedSessionId);
    
    // Провери за запазено име
    const storedName = localStorage.getItem('visitor_name');
    if (storedName) {
      setVisitorName(storedName);
      setShowNamePrompt(false);
    }
  }, []);

  // Зареждане на съобщенията
  const loadMessages = async () => {
    if (!sessionId) return;
    
    try {
      const res = await fetch(`/api/chat?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
        scrollToBottom();
      }
    } catch (err) {
      console.error('Грешка при зареждане:', err);
    }
  };

  // Автоматично зареждане на съобщения на всеки 3 секунди
  useEffect(() => {
    if (!sessionId || !isOpen) return;
    
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [sessionId, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!input.trim() || !sessionId) return;
    
    const messageText = input.trim();
    setInput('');
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          sender: 'visitor',
          message: messageText,
          visitorName: visitorName || 'Анонимен'
        })
      });
      
      if (res.ok) {
        await loadMessages();
      }
    } catch (err) {
      console.error('Грешка при изпращане:', err);
    }
  };

  const saveName = () => {
    if (visitorName.trim()) {
      localStorage.setItem('visitor_name', visitorName);
      setShowNamePrompt(false);
    }
  };

  if (!sessionId) return null;

  return (
    <>
      {/* Чат бутон */}
      <button onClick={() => setIsOpen(!isOpen)} style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        zIndex: 1000,
        fontSize: '24px',
        transition: 'transform 0.3s ease'
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
        💬
      </button>

      {/* Чат прозорец */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          right: '20px',
          width: '380px',
          height: '550px',
          background: 'rgba(15, 23, 42, 0.98)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid rgba(139, 92, 246, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
        }}>
          <div style={{
            padding: '1rem',
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            borderRadius: '16px 16px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ color: 'white', fontWeight: 'bold' }}>🤖 Reborn Art AI Чат</span>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                {visitorName ? `Здравей, ${visitorName}!` : 'Представи се, за да започнем'}
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✕</button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            {showNamePrompt ? (
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>👋 Здравей! Как да се обръщаме към теб?</p>
                <input
                  type="text"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="Твоето име..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(139, 92, 246, 0.5)',
                    background: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    marginBottom: '0.5rem'
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && saveName()}
                />
                <button onClick={saveName} style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#8b5cf6',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer'
                }}>Започни</button>
              </div>
            ) : (
              <>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '2rem' }}>
                    <p>👋 Здравей, {visitorName}!</p>
                    <p style={{ fontSize: '14px', marginTop: '1rem' }}>Задай ни въпрос относно AI музика, видео или поръчка. Ще ти отговорим възможно най-скоро!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} style={{
                      marginBottom: '0.75rem',
                      textAlign: msg.sender === 'visitor' ? 'right' : 'left'
                    }}>
                      <div style={{
                        display: 'inline-block',
                        padding: '0.5rem 1rem',
                        borderRadius: '12px',
                        background: msg.sender === 'visitor' ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
                        color: 'white',
                        maxWidth: '80%',
                        wordWrap: 'break-word'
                      }}>
                        {msg.message}
                      </div>
                      <div style={{
                        fontSize: '10px',
                        color: '#64748b',
                        marginTop: '4px',
                        textAlign: msg.sender === 'visitor' ? 'right' : 'left'
                      }}>
                        {new Date(msg.created_at).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          
          {!showNamePrompt && (
            <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Напиши съобщение..."
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
              }}>📤</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}