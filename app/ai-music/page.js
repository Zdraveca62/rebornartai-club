'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import TopSongsBlocks from '@/app/components/TopSongsBlocks';

export default function AIMusic() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'bg', 'en'
  const carouselRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Зареждане на песните
  useEffect(() => {
    fetch('/api/songs')
      .then(res => res.json())
      .then(data => {
        setSongs(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Грешка при зареждане на песните:', err);
        setLoading(false);
      });
  }, []);

  // Функция за отчитане на статистика
  const trackListen = async (song) => {
    try {
      await fetch('/api/jukebox-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songId: song.id,
          songTitle: song.title,
          songLanguage: song.language
        })
      });
      console.log('📊 Отчетено слушане:', song.title);
    } catch (err) {
      console.error('Грешка при отчитане:', err);
    }
  };

  // Функция за отваряне на YouTube + отчитане
  const handleListen = (song) => {
    trackListen(song);
    setTimeout(() => {
      window.open(`https://www.youtube.com/watch?v=${song.youtube_id}`, '_blank');
    }, 100);
  };

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
  }, [songs]);

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

  const getThumbnail = (song) => {
    if (song.cover_url && song.cover_url !== '') {
      return song.cover_url;
    }
    if (song.youtube_id) {
      return `https://img.youtube.com/vi/${song.youtube_id}/mqdefault.jpg`;
    }
    return 'https://via.placeholder.com/100x56?text=No+Image';
  };

  const filteredSongs = songs.filter(song => {
    if (filter === 'all') return true;
    return song.language === filter;
  });

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e1b4b, #000000, #4c1d95)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Зареждане...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e1b4b, #000000, #4c1d95)', padding: '2rem', color: 'white' }}>
      
      <Link href="/">
        <button style={{ position: 'fixed', top: '1rem', left: '1rem', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', zIndex: 20 }}>
          ← Назад
        </button>
      </Link>

      <h1 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎵 AI Music</h1>
      <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#9ca3af' }}>Открий музиката, генерирана с изкуствен интелект</p>

      {/* Двата неонови блока */}
      <TopSongsBlocks />

      {/* Филтър бутони */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={() => setFilter('all')}
          style={{ 
            background: filter === 'all' ? '#8b5cf6' : 'rgba(255,255,255,0.2)', 
            border: 'none', 
            color: 'white', 
            padding: '0.5rem 1.5rem', 
            borderRadius: '8px', 
            cursor: 'pointer'
          }}
        >
          Всички
        </button>
        <button 
          onClick={() => setFilter('bg')}
          style={{ 
            background: filter === 'bg' ? '#8b5cf6' : 'rgba(255,255,255,0.2)', 
            border: 'none', 
            color: 'white', 
            padding: '0.5rem 1.5rem', 
            borderRadius: '8px', 
            cursor: 'pointer'
          }}
        >
          🇧🇬 Български
        </button>
        <button 
          onClick={() => setFilter('en')}
          style={{ 
            background: filter === 'en' ? '#8b5cf6' : 'rgba(255,255,255,0.2)', 
            border: 'none', 
            color: 'white', 
            padding: '0.5rem 1.5rem', 
            borderRadius: '8px', 
            cursor: 'pointer'
          }}
        >
          🇬🇧 English
        </button>
      </div>

      {/* КАРУСЕЛ С ПЕСНИ */}
      <h2 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1.8rem' }}>📀 Всички песни</h2>
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
          {filteredSongs.map((song) => (
            <div key={song.id} style={{ 
              flex: '0 0 auto', 
              textAlign: 'center',
              width: '120px'
            }}>
              <div style={{
                width: '100px',
                height: '56px',
                backgroundColor: '#1e1b4b',
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img 
                  src={getThumbnail(song)}
                  alt={song.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/100x56?text=No+Image';
                  }}
                />
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', maxWidth: '100px' }}>
                {truncateText(song.title, 15)}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                {song.language === 'bg' ? '🇧🇬' : '🇬🇧'}
              </div>
              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '4px' }}>
                <button 
                  onClick={() => handleListen(song)}
                  style={{ 
                    background: '#ef4444', 
                    color: 'white', 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '4px', 
                    border: 'none', 
                    fontSize: '0.7rem',
                    cursor: 'pointer'
                  }}
                >
                  🎬 Слушай
                </button>
                <Link href={`/ai-music/${song.id}`}>
                  <button style={{ 
                    background: '#8b5cf6', 
                    color: 'white', 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '4px', 
                    border: 'none', 
                    fontSize: '0.7rem',
                    cursor: 'pointer'
                  }}>
                    📄 Текст
                  </button>
                </Link>
              </div>
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