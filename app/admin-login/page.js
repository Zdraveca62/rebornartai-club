'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      
      const data = await res.json();
      
      if (data.valid) {
        sessionStorage.setItem('admin_token', token);
        router.push('/admin');
      } else {
        setError(data.error || 'Невалиден администраторски токен!');
        // След 2 секунди пренасочваме към началната страница
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    } catch (err) {
      setError('Грешка при свързване със сървъра');
      setTimeout(() => {
        router.push('/');
      }, 2000);
    }
    
    setIsLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e1b4b, #000000, #4c1d95)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '2rem', width: '350px' }}>
        <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '1rem' }}>🔐 Администраторски вход</h2>
        
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Въведете администраторски токен"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            autoFocus
            style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white' }}
          />
          
          <button
            type="submit"
            disabled={isLoading}
            style={{ width: '100%', background: '#8b5cf6', border: 'none', color: 'white', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? 'Проверка...' : 'Вход'}
          </button>
          
          {error && (
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <p style={{ color: '#ef4444', marginBottom: '0.5rem' }}>{error}</p>
              <p style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Пренасочване към началната страница...</p>
            </div>
          )}
        </form>
        
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button
            onClick={() => router.push('/')}
            style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '0.875rem', cursor: 'pointer', textDecoration: 'underline' }}
          >
            ← Към началната страница
          </button>
        </div>
        
        <p style={{ color: '#9ca3af', fontSize: '0.75rem', textAlign: 'center', marginTop: '1rem' }}>
          Токенът се изтрива при затваряне на браузъра
        </p>
      </div>
    </div>
  );
}