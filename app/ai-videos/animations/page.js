'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import TopVideosBlocks from '@/app/components/TopVideosBlocks';
import TopVideosStats from '@/app/components/TopVideosStats';
import CategoryPage from '@/app/components/CategoryPage';

export default function AnimationsPage() {
  <CategoryPage 
        category="impressions" 
        title="Видео Импресии" 
        description="Късометражни вдъхновяващи видео импресии" 
        icon="🎬" 
      />
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    fetch('/api/videos?category=animations')
      .then(res => res.json())
      .then(data => {
        setVideos(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Грешка при зареждане на видеа:', err);
        setLoading(false);
      });
  }, []);

  const checkScrollButtons = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    window.addEventListener('resize', checkScrollButtons);
    return () => window.removeEventListener('resize', checkScrollButtons);
  }, [videos]);

  const scroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 200;
      const newScrollPosition = carouselRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      carouselRef.current.scrollTo({ left: newScrollPosition, behavior: 'smooth' });
      setTimeout(checkScrollButtons, 300);
    }
  };

  const truncateText = (text, maxLength = 12) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e1b4b, #000000, #4c1d95)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Зареждане...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e1b4b, #000000, #4c1d95)', padding: '2rem', color: 'white' }}>
      
      <Link href="/ai-videos">
        <button style={{ position: 'fixed', top: '1rem', left: '1rem', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', zIndex: 20 }}>
          ← Назад
        </button>
      </Link>

      <h1 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎬 Видео Импресии</h1>
      <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#9ca3af' }}>Късометражни вдъхновяващи видео импресии</p>

      {/* Двата неонови блока */}
      <div style={{ maxWidth: '1200px', margin: '0 auto 3rem auto', padding: '0 1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          <TopVideosBlocks category="animations" />
          <TopVideosStats category="animations" />
        </div>
      </div>

      {/* КАРУСЕЛ С ВИДЕА */}
      <h2 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1.8rem' }}>📽️ Всички видеа</h2>
      <div style={{ position: 'relative', marginBottom: '2rem' }}>
        <button
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          style={{
            position: 'absolute',
            left: '-20px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            background: 'rgba(0,0,0,0.5)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: canScrollLeft ? 'pointer' : 'not-allowed',
            opacity: canScrollLeft ? 1 : 0.4,
            color: 'white',
            fontSize: '1.5rem'
          }}
        >
          ◀
        </button>

        <div
          ref={carouselRef}
          onScroll={checkScrollButtons}
          style={{
            display: 'flex',
            overflowX: 'auto',
            gap: '1rem',
            padding: '1rem',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '16px',
            scrollBehavior: 'smooth',
            scrollbarWidth: 'thin'
          }}
        >
          {videos.map((video) => (
            <div key={video.id} style={{ 
              flex: '0 0 auto', 
              textAlign: 'center',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '120px'
            }}>
              <div style={{
                width: '100px',
                height: '56px',
                backgroundColor: '#bfdbfe',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '8px',
                overflow: 'hidden'
              }}>
                <img 
                  src={video.cover_url || `https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                  alt={video.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', maxWidth: '100px' }}>
                {truncateText(video.title, 15)}
              </div>
              <a 
                href={`https://www.youtube.com/watch?v=${video.youtube_id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  background: '#ef4444', 
                  color: 'white', 
                  padding: '0.2rem 0.5rem', 
                  borderRadius: '4px', 
                  textDecoration: 'none', 
                  fontSize: '0.7rem',
                  marginTop: '4px',
                  display: 'inline-block'
                }}
              >
                Гледай
              </a>
            </div>
          ))}
        </div>

        <button
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          style={{
            position: 'absolute',
            right: '-20px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            background: 'rgba(0,0,0,0.5)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: canScrollRight ? 'pointer' : 'not-allowed',
            opacity: canScrollRight ? 1 : 0.4,
            color: 'white',
            fontSize: '1.5rem'
          }}
        >
          ▶
        </button>
      </div>
    </div>
  );
}