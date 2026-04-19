// app/components/TopVideosBlocks.js
'use client';

import { useState, useEffect } from 'react';

export default function TopVideosBlocks({ category }) {
  const [topVideos, setTopVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = category 
      ? `/api/youtube-top-videos?category=${category}`
      : '/api/youtube-top-videos';
    
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

  if (loading) {
    return (
      <div style={{
        background: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '24px',
        padding: '1.5rem',
        border: '2px solid #ff0040',
        textAlign: 'center'
      }}>
        <p style={{ color: '#888' }}>Зареждане на YouTube топ...</p>
      </div>
    );
  }

  return (
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
      
      <h2 style={{ color: '#ff0040', textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.5rem', textShadow: '0 0 10px #ff0040' }}>
        🔥 ТОП 5 В YOUTUBE
      </h2>
      <p style={{ color: '#ff6699', textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
        {category === 'impressions' ? 'Видео Импресии' : 
         category === 'music_videos' ? 'Музикални Видеа' :
         category === 'animations' ? 'Анимации' :
         category === 'clients' ? 'Клиенти' : 'Видеа'}
      </p>
      
      {topVideos.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center' }}>Няма данни в момента</p>
      ) : (
        topVideos.map((video, idx) => (
          <a key={video.id} href={video.video_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
              padding: '0.7rem',
              marginBottom: '0.5rem',
              background: 'rgba(255, 0, 64, 0.1)',
              borderRadius: '12px',
              borderLeft: '3px solid #ff0040',
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }}>
              <span style={{ color: '#ff0040', fontWeight: 'bold', minWidth: '30px' }}>#{idx + 1}</span>
              <img 
                src={video.thumbnail} 
                alt={video.title} 
                style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }}
                onError={(e) => e.target.src = 'https://via.placeholder.com/40'}
              />
              <div style={{ flex: 1 }}>
                <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  {video.title?.length > 30 ? video.title.substring(0, 30) + '...' : video.title}
                </div>
                <div style={{ color: '#888', fontSize: '0.7rem' }}>
                  ▶ {video.views ? video.views.toLocaleString() : 'N/A'} гледания
                </div>
              </div>
            </div>
          </a>
        ))
      )}
      
      <style jsx>{`
        @keyframes slideRed {
          0% { transform: translateX(0); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}