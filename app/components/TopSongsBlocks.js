'use client';

import { useState, useEffect } from 'react';

export default function TopSongsBlocks() {
  const [topSite, setTopSite] = useState([]);
  const [topYouTube, setTopYouTube] = useState([]);
  const [loading, setLoading] = useState(true);

  // Зареждане на Топ 5 в сайта
  useEffect(() => {
    fetch('/api/jukebox-stats')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.topSite) {
          setTopSite(data.topSite.slice(0, 5));
        }
      })
      .catch(err => console.error('Грешка при зареждане на топ 5 от сайта:', err));
  }, []);

  // Зареждане на Топ 5 в YouTube – без грешки в конзолата
  useEffect(() => {
    fetch('/api/youtube-top')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.videos && data.videos.length > 0) {
          setTopYouTube(data.videos);
        } else {
          // Тихо логване – само предупреждение, не грешка
          if (data.error && !data.error.includes('quota')) {
            console.warn('YouTube API проблем:', data.error);
          }
          setTopYouTube([]);
        }
      })
      .catch(err => {
        // Мълчаливо хващане – само предупреждение
        console.warn('YouTube API заявката не успя:', err.message);
        setTopYouTube([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto 3rem auto', padding: '0 1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {[1, 2].map(i => (
            <div key={i} style={{ background: 'rgba(0, 0, 0, 0.7)', borderRadius: '24px', padding: '1.5rem', border: '2px solid #555', textAlign: 'center' }}>
              <p style={{ color: '#888' }}>Зареждане...</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto 3rem auto', padding: '0 1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        
        {/* Блок 1: Топ 5 в YouTube */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.7)',
          borderRadius: '24px',
          padding: '1.5rem',
          border: '2px solid #ff0040',
          boxShadow: '0 0 20px #ff0040, inset 0 0 10px rgba(255, 0, 64, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #ff0040, transparent)',
            animation: 'slideRed 2s linear infinite'
          }} />
          <div style={{
            position: 'absolute',
            bottom: 0,
            right: '-100%',
            width: '100%',
            height: '2px',
            background: 'linear-gradient(270deg, transparent, #ff0040, transparent)',
            animation: 'slideRed 2s linear infinite reverse'
          }} />
          
          <h2 style={{ 
            color: '#ff0040', 
            textAlign: 'center', 
            marginBottom: '0.5rem',
            fontSize: '1.5rem',
            textShadow: '0 0 10px #ff0040'
          }}>
            🔥 ТОП 5 В YOUTUBE
          </h2>
          <p style={{ color: '#ff6699', textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
            Най-гледани от канала
          </p>
          
          {topYouTube.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center' }}>
              {loading ? 'Зареждане...' : 'Няма данни в момента'}
            </p>
          ) : (
            topYouTube.map((video, idx) => (
              <a key={video.id || video.video_id} href={video.video_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.7rem',
                  marginBottom: '0.5rem',
                  background: 'rgba(255, 0, 64, 0.1)',
                  borderRadius: '12px',
                  borderLeft: `3px solid #ff0040`,
                  transition: 'transform 0.2s',
                  cursor: 'pointer'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <span style={{ color: '#ff0040', fontWeight: 'bold' }}>#{idx + 1}</span>
                    <img 
                      src={video.thumbnail} 
                      alt={video.title}
                      style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }}
                      onError={(e) => e.target.src = 'https://via.placeholder.com/40'}
                    />
                    <div>
                      <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: 'bold', maxWidth: '180px' }}>
                        {video.title?.length > 30 ? video.title.substring(0, 30) + '...' : video.title}
                      </div>
                      <div style={{ color: '#888', fontSize: '0.7rem' }}>
                        ▶ {video.views ? video.views.toLocaleString() : 'N/A'} гледания
                      </div>
                    </div>
                  </div>
                  <div style={{ color: '#ff6699', fontSize: '0.8rem' }}>🎬</div>
                </div>
              </a>
            ))
          )}
        </div>
        
        {/* Блок 2: Топ 5 в сайта */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.7)',
          borderRadius: '24px',
          padding: '1.5rem',
          border: '2px solid #00ffff',
          boxShadow: '0 0 20px #00ffff, inset 0 0 10px rgba(0, 255, 255, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            right: '-100%',
            width: '100%',
            height: '2px',
            background: 'linear-gradient(270deg, transparent, #00ffff, transparent)',
            animation: 'slideCyan 2s linear infinite'
          }} />
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: '-100%',
            width: '100%',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #00ffff, transparent)',
            animation: 'slideCyan 2s linear infinite reverse'
          }} />
          
          <h2 style={{ 
            color: '#00ffff', 
            textAlign: 'center', 
            marginBottom: '0.5rem',
            fontSize: '1.5rem',
            textShadow: '0 0 10px #00ffff'
          }}>
            🎧 ТОП 5 В САЙТА
          </h2>
          <p style={{ color: '#66ffff', textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
            {new Date().toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          
          {topSite.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center' }}>Все още няма слушания</p>
          ) : (
            topSite.map((item, idx) => {
              const youtubeUrl = item.youtube_id ? `https://www.youtube.com/watch?v=${item.youtube_id}` : '#';
              return (
                <a 
                  key={item.song_id} 
                  href={youtubeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.7rem',
                    marginBottom: '0.5rem',
                    background: 'rgba(0, 255, 255, 0.1)',
                    borderRadius: '12px',
                    borderLeft: `3px solid #00ffff`,
                    transition: 'transform 0.2s',
                    cursor: 'pointer'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <span style={{ color: '#00ffff', fontWeight: 'bold' }}>#{idx + 1}</span>
                      <img 
                        src={item.thumbnail || `https://img.youtube.com/vi/${item.youtube_id}/mqdefault.jpg` || 'https://via.placeholder.com/40'}
                        alt={item.song_title}
                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }}
                        onError={(e) => e.target.src = 'https://via.placeholder.com/40'}
                      />
                      <div>
                        <div style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold' }}>
                          {item.song_title?.length > 20 ? item.song_title.substring(0, 20) + '...' : item.song_title}
                        </div>
                        <div style={{ color: '#888', fontSize: '0.7rem' }}>
                          {item.song_language === 'bg' ? '🇧🇬 Българска' : '🇬🇧 English'}
                        </div>
                      </div>
                    </div>
                    <div style={{ color: '#66ffff', fontSize: '0.8rem' }}>🎵 {item.listen_count}</div>
                  </div>
                </a>
              );
            })
          )}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slideRed {
          0% { transform: translateX(0); }
          100% { transform: translateX(200%); }
        }
        @keyframes slideCyan {
          0% { transform: translateX(0); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}