'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Функция за форматиране на дата в DD/MM/YY
const formatDate = (dateString) => {
  if (!dateString) return 'Неизвестно';
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  return `${day}/${month}/${year}`;
};

// Функция за форматиране на секунди
const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) return `${minutes}min`;
  return `${minutes}min ${remainingSeconds}s`;
};

// Функция за получаване на текущия ден и час
const getCurrentDateTime = () => {
  const now = new Date();
  const day = now.getDate();
  const month = now.toLocaleString('default', { month: 'long' });
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${day} ${month}, ${hours}:${minutes}`;
};

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats');
  const [songs, setSongs] = useState([]);
  const [videos, setVideos] = useState([]);
  const [stats, setStats] = useState({ 
    totalVisits: 0, 
    totalSeconds: 0,
    deviceStats: { desktop: 0, mobile: 0, tablet: 0 }, 
    locationStats: [],
    currentPage: 1,
    itemsPerPage: 5
  });
  const [newSong, setNewSong] = useState({ title: '', youtubeId: '', lyrics: '', language: 'bg' });
  const [newVideo, setNewVideo] = useState({ title: '', youtubeId: '', description: '', category: 'impressions' });
  const [status, setStatus] = useState('');
  const [songsCurrentPage, setSongsCurrentPage] = useState(1);
  const [videosCurrentPage, setVideosCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const router = useRouter();

  const fetchSongs = async () => {
    const res = await fetch('/api/songs');
    const data = await res.json();
    const sortedSongs = data.sort((a, b) => b.id - a.id);
    setSongs(sortedSongs);
  };

  const fetchVideos = async () => {
    const res = await fetch('/api/videos');
    const data = await res.json();
    const sortedVideos = data.sort((a, b) => b.id - a.id);
    setVideos(sortedVideos);
  };

  const fetchStats = async () => {
    try {
      const visitorsRes = await fetch('/api/visitors');
      const visitorsData = await visitorsRes.json();
      
      const durationRes = await fetch('/api/visit-duration');
      const durations = await durationRes.json();
      
      const ipDurationMap = new Map();
      durations.forEach(d => {
        const ip = d.ip_address;
        if (ip) {
          const current = ipDurationMap.get(ip) || 0;
          ipDurationMap.set(ip, current + d.duration_seconds);
        }
      });
      
      const locationMap = new Map();
      const todayISO = new Date().toISOString().split('T')[0];
      
      if (visitorsData.allVisitors) {
        visitorsData.allVisitors.forEach(visitor => {
          const key = `${visitor.country || 'Unknown'}|${visitor.city || 'Unknown'}`;
          const visitISO = new Date(visitor.last_visit).toISOString().split('T')[0];
          const isToday = visitISO === todayISO;
          
          const realSeconds = ipDurationMap.get(visitor.ip_address) || 0;
          
          if (!locationMap.has(key)) {
            locationMap.set(key, {
              country: visitor.country || 'Unknown',
              city: visitor.city || 'Unknown',
              todayVisits: 0,
              todaySeconds: 0,
              totalVisits: 0,
              totalSeconds: 0,
              lastVisit: visitor.last_visit
            });
          }
          
          const loc = locationMap.get(key);
          if (isToday) {
            loc.todayVisits += (visitor.visit_count || 1);
            loc.todaySeconds += realSeconds;
          }
          loc.totalVisits += (visitor.visit_count || 1);
          loc.totalSeconds += realSeconds;
          
          if (new Date(visitor.last_visit) > new Date(loc.lastVisit)) {
            loc.lastVisit = visitor.last_visit;
          }
          
          locationMap.set(key, loc);
        });
      }
      
      let locationStats = Array.from(locationMap.values())
        .sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit));
      
      const totalSeconds = locationStats.reduce((sum, loc) => sum + loc.totalSeconds, 0);
      
      setStats({ 
        ...visitorsData, 
        totalSeconds,
        locationStats,
        currentPage: 1,
        itemsPerPage: 5
      });
    } catch (error) {
      console.error('Грешка при зареждане на статистика:', error);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
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
          await fetchSongs();
          await fetchVideos();
          await fetchStats();
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

  const handleAddVideo = async (e) => {
    e.preventDefault();
    setStatus('Запазване...');
    const res = await fetch('/api/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVideo)
    });
    if (res.ok) {
      await fetchVideos();
      setNewVideo({ title: '', youtubeId: '', description: '', category: 'impressions' });
      setStatus('✅ Видеото е добавено!');
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

  const handleDeleteVideo = async (id) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете това видео?')) return;
    const res = await fetch('/api/videos', { 
      method: 'DELETE', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ id }) 
    });
    if (res.ok) {
      await fetchVideos();
      setStatus('✅ Видеото е изтрито!');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const totalPages = Math.ceil((stats.locationStats?.length || 0) / itemsPerPage);
  const paginatedLocations = stats.locationStats?.slice(
    (stats.currentPage - 1) * itemsPerPage,
    stats.currentPage * itemsPerPage
  ) || [];

  const goToPage = (page) => {
    setStats(prev => ({ ...prev, currentPage: page }));
  };

  const totalSongsPages = Math.ceil(songs.length / itemsPerPage);
  const paginatedSongs = songs.slice(
    (songsCurrentPage - 1) * itemsPerPage,
    songsCurrentPage * itemsPerPage
  );

  const totalVideosPages = Math.ceil(videos.length / itemsPerPage);
  const paginatedVideos = videos.slice(
    (videosCurrentPage - 1) * itemsPerPage,
    videosCurrentPage * itemsPerPage
  );

  const categoryLabels = {
    impressions: '🎹 Видео Импресии',
    musicVideos: '🎬 Музикални видеа',
    animations: '✨ Анимации',
    clients: '🎥 Видео - Клиенти'
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
        <button 
          onClick={() => {
            sessionStorage.removeItem('admin_token');
            window.location.href = '/';
          }}
          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}
        >
          ← Към сайта
        </button>
        <button 
          onClick={() => {
            sessionStorage.removeItem('admin_token');
            window.location.href = '/';
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
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Общо време: <strong style={{ color: '#8b5cf6' }}>{formatDuration(stats.totalSeconds || 0)}</strong>
              </p>
            </div>

            <h3 style={{ color: 'white', marginBottom: '1rem' }}>🌍 Статистика по локации</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Локация</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }} colSpan="2">Сега ({getCurrentDateTime()})</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }} colSpan="2">Общо</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Последно</th>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}></th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>Visits</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>time</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>Visits</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>time</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLocations.length > 0 ? (
                    paginatedLocations.map((loc, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <td style={{ padding: '0.5rem' }}>{loc.city}, {loc.country}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>{loc.todayVisits || 0}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>{formatDuration(loc.todaySeconds || 0)}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>{loc.totalVisits || 0}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>{formatDuration(loc.totalSeconds || 0)}</td>
                        <td style={{ padding: '0.5rem' }}>{formatDate(loc.lastVisit)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af' }}>
                        Няма данни за посетители
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <button onClick={() => goToPage(1)} disabled={stats.currentPage === 1} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: stats.currentPage === 1 ? 'not-allowed' : 'pointer', opacity: stats.currentPage === 1 ? 0.5 : 1 }}>«</button>
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => goToPage(i + 1)} style={{ background: stats.currentPage === i + 1 ? '#8b5cf6' : 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer' }}>{i + 1}</button>
                ))}
                <button onClick={() => goToPage(totalPages)} disabled={stats.currentPage === totalPages} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: stats.currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: stats.currentPage === totalPages ? 0.5 : 1 }}>»</button>
              </div>
            )}

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
                <input type="text" placeholder="Заглавие на песента" value={newSong.title} onChange={(e) => setNewSong({...newSong, title: e.target.value})} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white' }} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ color: '#9ca3af', display: 'block', marginBottom: '0.5rem' }}>YouTube ID:</label>
                <input type="text" placeholder="напр. uxSIvsoWIH8" value={newSong.youtubeId} onChange={(e) => setNewSong({...newSong, youtubeId: e.target.value})} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white' }} />
                <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.25rem' }}>Вземи ID от URL: https://youtube.com/watch?v=<strong>ТУК Е ID</strong></p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ color: '#9ca3af', display: 'block', marginBottom: '0.5rem' }}>Текст (lyrics):</label>
                <textarea placeholder="Текст на песента..." value={newSong.lyrics} onChange={(e) => setNewSong({...newSong, lyrics: e.target.value})} required rows="6" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white' }} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ color: '#9ca3af', display: 'block', marginBottom: '0.5rem' }}>Език:</label>
                <select value={newSong.language} onChange={(e) => setNewSong({...newSong, language: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                  <option value="bg">🇧🇬 Български</option>
                  <option value="en">🇬🇧 English</option>
                </select>
              </div>

              <button type="submit" style={{ background: '#8b5cf6', border: 'none', color: 'white', padding: '0.75rem 2rem', borderRadius: '8px', cursor: 'pointer' }}>+ Добави песен</button>
            </form>
            
            {status && <p style={{ marginTop: '1rem', color: '#8b5cf6' }}>{status}</p>}
            
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ color: 'white', marginBottom: '1rem' }}>
                📋 Съществуващи песни ({songs.length})
              </h3>
              
              {paginatedSongs.length === 0 ? (
                <p style={{ color: '#9ca3af' }}>Няма добавени песни</p>
              ) : (
                paginatedSongs.map(song => (
                  <div key={song.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ color: 'white' }}>
                      {song.language === 'bg' ? '🇧🇬' : '🇬🇧'} {song.title}
                    </span>
                    <button onClick={() => handleDeleteSong(song.id)} style={{ background: 'rgba(255,0,0,0.3)', border: 'none', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer' }}>
                      {song.language === 'bg' ? 'Изтрий' : 'Delete'}
                    </button>
                  </div>
                ))
              )}
              
              {totalSongsPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <button onClick={() => setSongsCurrentPage(1)} disabled={songsCurrentPage === 1} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: songsCurrentPage === 1 ? 'not-allowed' : 'pointer', opacity: songsCurrentPage === 1 ? 0.5 : 1 }}>«</button>
                  {[...Array(totalSongsPages)].map((_, i) => (
                    <button key={i} onClick={() => setSongsCurrentPage(i + 1)} style={{ background: songsCurrentPage === i + 1 ? '#8b5cf6' : 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer' }}>{i + 1}</button>
                  ))}
                  <button onClick={() => setSongsCurrentPage(totalSongsPages)} disabled={songsCurrentPage === totalSongsPages} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: songsCurrentPage === totalSongsPages ? 'not-allowed' : 'pointer', opacity: songsCurrentPage === totalSongsPages ? 0.5 : 1 }}>»</button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'videos' && (
          <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>🎬 Добави ново видео</h2>
            
            <form onSubmit={handleAddVideo}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ color: '#9ca3af', display: 'block', marginBottom: '0.5rem' }}>Заглавие:</label>
                <input type="text" placeholder="Заглавие на видеото" value={newVideo.title} onChange={(e) => setNewVideo({...newVideo, title: e.target.value})} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white' }} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ color: '#9ca3af', display: 'block', marginBottom: '0.5rem' }}>YouTube ID:</label>
                <input type="text" placeholder="напр. uxSIvsoWIH8" value={newVideo.youtubeId} onChange={(e) => setNewVideo({...newVideo, youtubeId: e.target.value})} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white' }} />
                <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.25rem' }}>Вземи ID от URL: https://youtube.com/watch?v=<strong>ТУК Е ID</strong></p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ color: '#9ca3af', display: 'block', marginBottom: '0.5rem' }}>Описание:</label>
                <textarea placeholder="Описание на видеото..." value={newVideo.description} onChange={(e) => setNewVideo({...newVideo, description: e.target.value})} required rows="6" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white' }} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ color: '#9ca3af', display: 'block', marginBottom: '0.5rem' }}>Категория:</label>
                <select value={newVideo.category} onChange={(e) => setNewVideo({...newVideo, category: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                  <option value="impressions">🎹 Видео Импресии</option>
                  <option value="musicVideos">🎬 Музикални видеа</option>
                  <option value="animations">✨ Анимации</option>
                  <option value="clients">🎥 Видео - Клиенти</option>
                </select>
              </div>

              <button type="submit" style={{ background: '#8b5cf6', border: 'none', color: 'white', padding: '0.75rem 2rem', borderRadius: '8px', cursor: 'pointer' }}>+ Добави видео</button>
            </form>
            
            {status && <p style={{ marginTop: '1rem', color: '#8b5cf6' }}>{status}</p>}
            
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ color: 'white', marginBottom: '1rem' }}>
                📋 Съществуващи видеа ({videos.length})
              </h3>
              
              {paginatedVideos.length === 0 ? (
                <p style={{ color: '#9ca3af' }}>Няма добавени видеа</p>
              ) : (
                paginatedVideos.map(video => (
                  <div key={video.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ color: 'white' }}>
                      {categoryLabels[video.category] || video.category} - {video.title}
                    </span>
                    <button onClick={() => handleDeleteVideo(video.id)} style={{ background: 'rgba(255,0,0,0.3)', border: 'none', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer' }}>
                      Изтрий
                    </button>
                  </div>
                ))
              )}
              
              {totalVideosPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <button onClick={() => setVideosCurrentPage(1)} disabled={videosCurrentPage === 1} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: videosCurrentPage === 1 ? 'not-allowed' : 'pointer', opacity: videosCurrentPage === 1 ? 0.5 : 1 }}>«</button>
                  {[...Array(totalVideosPages)].map((_, i) => (
                    <button key={i} onClick={() => setVideosCurrentPage(i + 1)} style={{ background: videosCurrentPage === i + 1 ? '#8b5cf6' : 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer' }}>{i + 1}</button>
                  ))}
                  <button onClick={() => setVideosCurrentPage(totalVideosPages)} disabled={videosCurrentPage === totalVideosPages} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: videosCurrentPage === totalVideosPages ? 'not-allowed' : 'pointer', opacity: videosCurrentPage === totalVideosPages ? 0.5 : 1 }}>»</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}