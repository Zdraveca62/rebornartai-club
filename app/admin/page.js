'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats');
  const [songs, setSongs] = useState([]);
  const [stats, setStats] = useState({ totalVisits: 0, deviceStats: { desktop: 0, mobile: 0, tablet: 0 }, ipStats: [] });
  const [newSong, setNewSong] = useState({ title: '', youtubeId: '', lyrics: '', language: 'bg' });
  const [status, setStatus] = useState('');
  const router = useRouter();

  // Проверка за токен при зареждане (използва sessionStorage)
  useEffect(() => {
    const checkAuth = async () => {
      // Взимаме от sessionStorage (не localStorage)
      const token = sessionStorage.getItem('admin_token');
      
      if (!token) {
        router.push('/admin-login');
        return;
      }
      
      try {
        const res = await fetch('/api/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        
        const data = await res.json();
        
        if (data.valid) {
          setIsAuthenticated(true);
          fetchSongs();
          fetchStats();
        } else {
          sessionStorage.removeItem('admin_token');
          router.push('/admin-login?error=expired');
        }
      } catch (err) {
        router.push('/admin-login?error=connection');
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, [router]);

  const fetchSongs = async () => {
    const res = await fetch('/api/songs');
    const data = await res.json();
    setSongs(data);
  };

  const fetchStats = async () => {
    const res = await fetch('/api/visitors');
    const data = await res.json();
    console.log('📊 Статистика от API:', data);
    setStats(data);
  };

  const handleAddSong = async (e) => {
    e.preventDefault();
    setStatus('Запазване...');
    const res = await fetch('/api/songs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSong)
    });
    if (res.ok) {
      await fetchSongs();
      setNewSong({ title: '', youtubeId: '', lyrics: '', language: 'bg' });
      setStatus('✅ Песента е добавена!');
      setTimeout(() => setStatus(''), 3000);
    } else {
      setStatus('❌ Грешка');
    }
  };

  const handleDeleteSong = async (id) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете тази песен?')) return;
    const res = await fetch('/api/songs', { 
      method: 'DELETE', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ id }) 
    });
    if (res.ok) {
      await fetchSongs();
      setStatus('✅ Песента е изтрита!');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e1b4b, #000000, #4c1d95)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'white', fontSize: '1.5rem' }}>Зареждане...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e1b4b, #000000, #4c1d95)', padding: '2rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <Link href="/">
          <button 
  onClick={() => {
    sessionStorage.removeItem('admin_token');
    window.location.href = '/';
  }}
  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}
>
  ← Към сайта
          </button>
        </Link>
        <button 
  onClick={() => {
    sessionStorage.removeItem('admin_token');
    router.push('/');
  }}
  style={{ background: 'rgba(255,0,0,0.3)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}
>
  🚪 Изход
</button>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: '2rem' }}>
          🎵 Административен панел
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => setActiveTab('stats')} style={{ background: activeTab === 'stats' ? '#8b5cf6' : 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '1rem', borderRadius: '16px', cursor: 'pointer', fontSize: '1rem' }}>
            📊 Статистика
          </button>
          <button onClick={() => setActiveTab('music')} style={{ background: activeTab === 'music' ? '#8b5cf6' : 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '1rem', borderRadius: '16px', cursor: 'pointer', fontSize: '1rem' }}>
            🎵 Добави песен
          </button>
          <button onClick={() => setActiveTab('videos')} style={{ background: activeTab === 'videos' ? '#8b5cf6' : 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '1rem', borderRadius: '16px', cursor: 'pointer', fontSize: '1rem' }}>
            🎬 Добави видео
          </button>
        </div>

        {activeTab === 'stats' && (
  <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '2rem' }}>
    
    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
      <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>ОБЩ БРОЙ ВЛИЗАНИЯ В САЙТА</p>
      <p style={{ fontSize: '3rem', fontWeight: 'bold', color: '#8b5cf6' }}>{stats.totalVisits || 0}</p>
    </div>

    <h3 style={{ color: 'white', marginBottom: '1rem' }}>🌍 Статистика по IP адреси</h3>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>IP Адрес / Локация</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Посещения</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Устройство</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Последно посещение</th>
          </tr>
        </thead>
        <tbody>
          {stats.ipStats && stats.ipStats.length > 0 ? (
            stats.ipStats.map((ip, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <td style={{ padding: '0.5rem' }}>{ip.ip_address || 'Неизвестен'} - {ip.city || ''} {ip.country || ''}</td>
                <td style={{ padding: '0.5rem' }}>{ip.totalVisits || 0}</td>
                <td style={{ padding: '0.5rem' }}>{ip.deviceType || 'desktop'}</td>
                <td style={{ padding: '0.5rem' }}>{ip.lastVisit ? new Date(ip.lastVisit).toLocaleString() : 'Неизвестно'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af' }}>
                Няма данни за посетители
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    <div style={{ marginTop: '2rem' }}>
      <h3 style={{ color: 'white', marginBottom: '1rem' }}>📱 ТОТАЛ по устройства</h3>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', minWidth: '120px' }}>
          <p style={{ color: '#9ca3af' }}>💻 Desktop</p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>{stats.deviceStats?.desktop || 0}</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', minWidth: '120px' }}>
          <p style={{ color: '#9ca3af' }}>📱 Mobile</p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ec4899' }}>{stats.deviceStats?.mobile || 0}</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', minWidth: '120px' }}>
          <p style={{ color: '#9ca3af' }}>📟 Tablet</p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#14b8a6' }}>{stats.deviceStats?.tablet || 0}</p>
        </div>
      </div>
    </div>

    <button onClick={fetchStats} style={{ marginTop: '2rem', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>
      🔄 Опресни статистиката
    </button>
  </div>
)}

        {activeTab === 'music' && (
          <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>🎵 Добави нова песен</h2>
            
            <form onSubmit={handleAddSong}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ color: '#9ca3af', display: 'block', marginBottom: '0.5rem' }}>Заглавие:</label>
                <input
                  type="text"
                  placeholder="Заглавие на песента"
                  value={newSong.title}
                  onChange={(e) => setNewSong({...newSong, title: e.target.value})}
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ color: '#9ca3af', display: 'block', marginBottom: '0.5rem' }}>YouTube ID:</label>
                <input
                  type="text"
                  placeholder="напр. uxSIvsoWIH8"
                  value={newSong.youtubeId}
                  onChange={(e) => setNewSong({...newSong, youtubeId: e.target.value})}
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
                <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  Вземи ID от URL: https://youtube.com/watch?v=<strong>ТУК Е ID</strong>
                </p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ color: '#9ca3af', display: 'block', marginBottom: '0.5rem' }}>Текст (lyrics):</label>
                <textarea
                  placeholder="Текст на песента..."
                  value={newSong.lyrics}
                  onChange={(e) => setNewSong({...newSong, lyrics: e.target.value})}
                  required
                  rows="6"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ color: '#9ca3af', display: 'block', marginBottom: '0.5rem' }}>Език:</label>
                <select
                  value={newSong.language}
                  onChange={(e) => setNewSong({...newSong, language: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white' }}
                >
                  <option value="bg">🇧🇬 Български</option>
                  <option value="en">🇬🇧 English</option>
                </select>
              </div>

              <button type="submit" style={{ background: '#8b5cf6', border: 'none', color: 'white', padding: '0.75rem 2rem', borderRadius: '8px', cursor: 'pointer' }}>
                + Добави песен
              </button>
            </form>
            
            {status && <p style={{ marginTop: '1rem', color: '#8b5cf6' }}>{status}</p>}
            
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ color: 'white', marginBottom: '1rem' }}>📋 Съществуващи песни</h3>
              {songs.length === 0 ? (
                <p style={{ color: '#9ca3af' }}>Няма добавени песни</p>
              ) : (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {songs.filter(s => s.language === 'bg').map(song => (
                    <div key={song.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <span style={{ color: 'white' }}>🇧🇬 {song.title}</span>
                      <button onClick={() => handleDeleteSong(song.id)} style={{ background: 'rgba(255,0,0,0.3)', border: 'none', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer' }}>Изтрий</button>
                    </div>
                  ))}
                  {songs.filter(s => s.language === 'en').map(song => (
                    <div key={song.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <span style={{ color: 'white' }}>🇬🇧 {song.title}</span>
                      <button onClick={() => handleDeleteSong(song.id)} style={{ background: 'rgba(255,0,0,0.3)', border: 'none', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'videos' && (
          <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>🎬 Добави видео</h2>
            <p style={{ color: '#9ca3af' }}>Функционалността за видеа ще бъде добавена скоро.</p>
          </div>
        )}
      </div>
    </div>
  );
}