'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function Jukebox() {
  const [allSongs, setAllSongs] = useState([]);
  const [queue, setQueue] = useState([]);
  const [currentIndexInQueue, setCurrentIndexInQueue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [shuffle, setShuffle] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const carouselRef = useRef(null);
  const playerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);

  const truncateText = (text, maxLength = 12) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Зареждане на песните
  useEffect(() => {
    fetch('/api/songs')
      .then(res => res.json())
      .then(data => {
        setAllSongs(data);
        setLoading(false);
      });
  }, []);

  // Зареждане на YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      
      window.onYouTubeIframeAPIReady = () => {
        setPlayerReady(true);
      };
    } else {
      setPlayerReady(true);
    }
  }, []);

  // Създаване на YouTube плейър
  useEffect(() => {
    if (playerReady && currentSong && window.YT && window.YT.Player) {
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
      
      playerRef.current = new window.YT.Player('youtube-player', {
        height: '200',
        width: '100%',
        videoId: currentSong.youtube_id,
        playerVars: {
          autoplay: isPlaying ? 1 : 0,
          controls: 1,
          rel: 0
        },
        events: {
          onStateChange: (event) => {
            // Видеото е свършило
            if (event.data === window.YT.PlayerState.ENDED) {
              playNext();
            }
          }
        }
      });
    }
  }, [playerReady, currentSong, isPlaying]);

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
  }, [allSongs]);

  const scroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 200;
      const newScrollPosition = carouselRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      carouselRef.current.scrollTo({ left: newScrollPosition, behavior: 'smooth' });
      setTimeout(checkScrollButtons, 300);
    }
  };

  const addToQueue = (song) => {
    setQueue(prev => [...prev, song]);
  };

  const removeFromQueue = (index) => {
    const newQueue = [...queue];
    newQueue.splice(index, 1);
    setQueue(newQueue);
    if (currentIndexInQueue >= index && currentIndexInQueue > 0) {
      setCurrentIndexInQueue(prev => prev - 1);
    }
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const newQueue = [...queue];
    [newQueue[index - 1], newQueue[index]] = [newQueue[index], newQueue[index - 1]];
    setQueue(newQueue);
    if (currentIndexInQueue === index) setCurrentIndexInQueue(index - 1);
    else if (currentIndexInQueue === index - 1) setCurrentIndexInQueue(index);
  };

  const moveDown = (index) => {
    if (index === queue.length - 1) return;
    const newQueue = [...queue];
    [newQueue[index + 1], newQueue[index]] = [newQueue[index], newQueue[index + 1]];
    setQueue(newQueue);
    if (currentIndexInQueue === index) setCurrentIndexInQueue(index + 1);
    else if (currentIndexInQueue === index + 1) setCurrentIndexInQueue(index);
  };

  const currentSong = queue[currentIndexInQueue];

  const playNext = () => {
    if (queue.length === 0) return;
    let nextIndex = currentIndexInQueue + 1;
    if (shuffle && queue.length > 1) {
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * queue.length);
      } while (newIndex === currentIndexInQueue);
      nextIndex = newIndex;
    }
    if (nextIndex >= queue.length) {
      nextIndex = 0;
    }
    setCurrentIndexInQueue(nextIndex);
    setIsPlaying(true);
  };

  const playPrev = () => {
    if (queue.length === 0) return;
    let prevIndex = currentIndexInQueue - 1;
    if (prevIndex < 0) prevIndex = queue.length - 1;
    setCurrentIndexInQueue(prevIndex);
    setIsPlaying(true);
  };

  if (loading) return <div style={{ minHeight: '100vh', background: '#1e1b4b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Зареждане на музикалната библиотека...</div>;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e1b4b, #000000, #4c1d95)',
      padding: '2rem',
      color: 'white'
    }}>
      
      <Link href="/">
        <button style={{ position: 'fixed', top: '1rem', left: '1rem', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', zIndex: 20 }}>
          ← Назад
        </button>
      </Link>

      <h1 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '1rem' }}>🎵 Джубокс</h1>
      <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#9ca3af' }}>Кликни върху песен, за да я добавиш в списъка за изпълнение</p>

      {/* КАРУСЕЛ С ПЕСНИ */}
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
            opacity: canScrollLeft ? 1 : 0.4
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
          {allSongs.map((song) => (
            <div key={song.id} style={{ 
              flex: '0 0 auto', 
              textAlign: 'center',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }} onClick={() => addToQueue(song)}>
              <div style={{
                width: '30px',
                height: '80px',
                backgroundColor: '#bfdbfe',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '500',
                  color: '#1e3a8a',
                  whiteSpace: 'nowrap',
                  display: 'inline-block',
                  transform: 'rotate(-90deg)',
                  transformOrigin: 'center center',
                  width: '80px',
                  textAlign: 'center'
                }}>
                  {truncateText(song.title, 12)}
                </span>
              </div>
              <img 
                src={song.cover_url} 
                alt={song.title}
                style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
                onError={(e) => e.target.src = 'https://via.placeholder.com/50'}
              />
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
            opacity: canScrollRight ? 1 : 0.4
          }}
        >
          ▶
        </button>
      </div>

      {/* ОПАШКА ЗА ИЗПЪЛНЕНИЕ */}
      <h2 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1.5rem' }}>📋 Опашка за изпълнение</h2>
      <div style={{
        display: 'flex',
        overflowX: 'auto',
        gap: '1rem',
        padding: '1rem',
        marginBottom: '2rem',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '16px',
        minHeight: '180px',
        alignItems: 'center'
      }}>
        {queue.length === 0 && (
          <p style={{ color: '#9ca3af', textAlign: 'center', width: '100%' }}>Няма добавени песни. Кликни върху песен от библиотеката, за да я добавиш.</p>
        )}
        {queue.map((song, idx) => (
          <div key={idx} style={{ 
            flex: '0 0 auto', 
            textAlign: 'center',
            position: 'relative',
            background: currentIndexInQueue === idx ? 'rgba(139,92,246,0.2)' : 'transparent',
            borderRadius: '8px',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{
              width: '30px',
              height: '80px',
              backgroundColor: currentIndexInQueue === idx ? '#8b5cf6' : '#bfdbfe',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }}>
              <span style={{
                fontSize: '11px',
                fontWeight: '500',
                color: currentIndexInQueue === idx ? 'white' : '#1e3a8a',
                whiteSpace: 'nowrap',
                display: 'inline-block',
                transform: 'rotate(-90deg)',
                transformOrigin: 'center center',
                width: '80px',
                textAlign: 'center'
              }}>
                {truncateText(song.title, 12)}
              </span>
            </div>
            <img 
              src={song.cover_url} 
              alt={song.title}
              style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
            />
            {currentIndexInQueue === idx && (
              <div style={{ fontSize: '1.5rem', marginTop: '4px' }}>▼</div>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '8px' }}>
              <button onClick={() => moveUp(idx)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}>↑</button>
              <button onClick={() => moveDown(idx)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}>↓</button>
              <button onClick={() => removeFromQueue(idx)} style={{ background: 'rgba(255,0,0,0.3)', border: 'none', color: 'white', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}>✕</button>
            </div>
          </div>
        ))}
      </div>

      {/* ПЛЕЪЪР */}
      {currentSong && (
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>🎧 {currentSong.title}</h2>
          <div id="youtube-player" style={{ marginBottom: '1rem' }}></div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={() => {
              if (playerRef.current && playerRef.current.pauseVideo) {
                playerRef.current.pauseVideo();
                setIsPlaying(false);
              }
            }} style={{ background: '#8b5cf6', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>⏸️ Пауза</button>
            <button onClick={() => {
              if (playerRef.current && playerRef.current.playVideo) {
                playerRef.current.playVideo();
                setIsPlaying(true);
              }
            }} style={{ background: '#8b5cf6', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>▶️ Плей</button>
            <button onClick={playNext} style={{ background: '#8b5cf6', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>⏩ Напред</button>
            <button onClick={playPrev} style={{ background: '#8b5cf6', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>⏪ Назад</button>
            <button onClick={() => setShuffle(!shuffle)} style={{ background: shuffle ? '#ec4899' : '#8b5cf6', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>🔀 Разбъркай</button>
          </div>
          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: '#9ca3af' }}>
            {shuffle ? '✅ Режим "Разбъркай" е активен' : '❌ Режим "Разбъркай" е изключен'}
          </p>
        </div>
      )}
    </div>
  );
}