'use client';

import { useState, useEffect } from 'react';

export default function TopVideosStats({ category }) {
  const [topVideos, setTopVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = category && category !== 'all'
      ? `/api/jukebox-stats-videos?category=${category}`
      : '/api/jukebox-stats-videos';
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.videos) {
          setTopVideos(data.videos);
        } else {
          setTopVideos([]);
        }
      })
      .catch(err => {
        console.warn('Грешка при зареждане на топ видеата:', err);
        setTopVideos([]);
      })
      .finally(() => setLoading(false));
  }, [category]);

  const getCategoryTitle = () => {
    switch(category) {
      case 'impressions': return 'Видео Импресии';
      case 'music_videos': return 'Музикални Видеа';
      case 'animations': return 'Анимации';
      case 'clients': return 'Клиенти';
      default: return 'Всички Видеа';
    }
  };

  if (loading) {
    return (
      <div style={{
        background: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '24px',
        padding: '1.5rem',
        border: '2px solid #00ffff',
        textAlign: 'center'
      }}>
        <p style={{ color: '#888' }}>Зареждане на Топ 5...</p>
      </div>
    );
  }

  return (
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
        {getCategoryTitle()} • {new Date().toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
      
      {topVideos.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center' }}>Все още няма гледания на видеа от тази категория</p>
      ) : (
        topVideos.map((video, idx) => (
          <a 
            key={video.id} 
            href={video.video_url} 
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
                  src={video.thumbnail}
                  alt={video.title}
                  style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }}
                  onError={(e) => e.target.src = 'https://via.placeholder.com/40'}
                />
                <div>
                  <div style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    {video.title?.length > 25 ? video.title.substring(0, 25) + '...' : video.title}
                  </div>
                  <div style={{ color: '#888', fontSize: '0.7rem' }}>
                    🎬 {video.category} • 🎵 {video.listen_count} гледания
                  </div>
                </div>
              </div>
              <div style={{ color: '#66ffff', fontSize: '0.8rem' }}>▶️</div>
            </div>
          </a>
        ))
      )}
      
      <style jsx>{`
        @keyframes slideCyan {
          0% { transform: translateX(0); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}