'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function CategoryVideosPage() {
  const { category } = useParams();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showDescription, setShowDescription] = useState(false);

  const categoryLabels = {
    impressions: { title: '🎹 Видео Импресии', icon: '🎹', color: '#8b5cf6' },
    musicVideos: { title: '🎬 Музикални видеа', icon: '🎬', color: '#ec4899' },
    animations: { title: '✨ Анимации', icon: '✨', color: '#14b8a6' },
    clients: { title: '🎥 Видео - Клиенти', icon: '🎥', color: '#f59e0b' }
  };

  const currentCategory = categoryLabels[category] || { title: 'Видеа', icon: '🎬', color: '#8b5cf6' };

  useEffect(() => {
    fetchVideos();
  }, [category]);

  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/videos');
      const data = await res.json();
      const filtered = data.filter(v => v.category === category);
      setVideos(filtered);
      setLoading(false);
    } catch (error) {
      console.error('Грешка при зареждане на видеа:', error);
      setLoading(false);
    }
  };

  const handleVideoClick = (video) => {
    setSelectedVideo(video);
    setShowDescription(false);
    window.open(`https://youtube.com/watch?v=${video.youtube_id}`, '_blank');
  };

  const handleDescriptionClick = (video) => {
    setSelectedVideo(video);
    setShowDescription(true);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e1b4b, #000000, #4c1d95)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'white', fontSize: '1.5rem' }}>Зареждане на видеата...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e1b4b, #000000, #4c1d95)', padding: '2rem' }}>
      
      <Link href="/ai-videos">
        <button style={{ position: 'fixed', top: '1rem', left: '1rem', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', zIndex: 10 }}>
          ← Назад към категориите
        </button>
      </Link>

      <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: '2rem' }}>
        {currentCategory.icon} {currentCategory.title}
      </h1>

      {videos.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '3rem' }}>
          <p style={{ fontSize: '1.2rem' }}>❌ Няма добавени видеа в тази категория.</p>
          <p style={{ marginTop: '1rem' }}>Очаквайте скоро!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '2rem', maxWidth: '1200px', margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
          {videos.map((video) => (
            <div key={video.id} style={{ 
              background: 'rgba(255,255,255,0.1)', 
              backdropFilter: 'blur(10px)', 
              borderRadius: '16px', 
              padding: '1.5rem', 
              width: '280px', 
              textAlign: 'center', 
              border: `1px solid ${currentCategory.color}`,
              transition: 'transform 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              <img 
                src={video.cover_url} 
                alt={video.title}
                style={{ width: '100%', height: 'auto', borderRadius: '12px', marginBottom: '1rem' }}
              onError={(e) => {
              // Ако maxresdefault.jpg не се зареди, опитай със стандартен hqdefault.jpg
              if (!e.target.src.includes('hqdefault')) {
               e.target.src = `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`;
              } else {
              // Ако и hqdefault.jpg не успее, покажи placeholder
               e.target.onerror = null;
               e.target.src = 'https://via.placeholder.com/250x150?text=No+Image';
                      }
                  }}
              />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>{video.title}</h3>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <button 
                  onClick={() => handleVideoClick(video)} 
                  style={{ background: currentCategory.color, border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>
                  🎬 Гледай
                </button>
                <button 
                  onClick={() => handleDescriptionClick(video)} 
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>
                  📄 Описание
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDescription && selectedVideo && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setShowDescription(false)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>{selectedVideo.title}</h3>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{selectedVideo.description || 'Няма описание за това видео.'}</p>
          </div>
        </div>
      )}
    </div>
  );
}