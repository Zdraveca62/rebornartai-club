'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function Jukebox() {
  const [allSongs, setAllSongs] = useState([]);
  const [queue, setQueue] = useState([]);
  const queueRef = useRef(queue);
  const [currentIndexInQueue, setCurrentIndexInQueue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [shuffle, setShuffle] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const carouselRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [playerKey, setPlayerKey] = useState(0);
  const timerRef = useRef(null);
  const playerRef = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [topSite, setTopSite] = useState([]);
  const [topYouTube, setTopYouTube] = useState([]);
  const currentDurationRef = useRef(240000); // 4 минути по подразбиране

  // Синхронизиране на queueRef с queue
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const truncateText = (text, maxLength = 12) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const currentSong = queue[currentIndexInQueue];

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    clearTimer();
    // Използваме реалната дължина на видеото или fallback 4 минути
    const duration = currentDurationRef.current || 240000;
    console.log(`⏰ Стартирам таймер за ${duration / 1000} секунди`);
    
    timerRef.current = setTimeout(() => {
      console.log('🏁 Таймерът изтече, превключвам към следваща песен');
      playNext();
    }, duration);
  };

  const playNext = () => {
    console.log('⏩ playNext извикана');
    const currentQueue = queueRef.current;
    if (currentQueue.length === 0) {
      console.log('⚠️ Опашката е празна');
      return;
    }
    
    setCurrentIndexInQueue(prevIndex => {
      let nextIndex = prevIndex + 1;
      if (shuffle && currentQueue.length > 1) {
        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * currentQueue.length);
        } while (newIndex === prevIndex);
        nextIndex = newIndex;
      }
      if (nextIndex >= currentQueue.length) {
        nextIndex = 0;
      }
      
      console.log(`🔄 Превключвам от индекс ${prevIndex} на ${nextIndex}`);
      clearTimer();
      setPlayerKey(p => p + 1);
      
      return nextIndex;
    });
  };

  const playPrev = () => {
    console.log('⏪ playPrev извикана');
    const currentQueue = queueRef.current;
    if (currentQueue.length === 0) return;
    
    setCurrentIndexInQueue(prevIndex => {
      let prevIndexNew = prevIndex - 1;
      if (prevIndexNew < 0) prevIndexNew = currentQueue.length - 1;
      
      clearTimer();
      setPlayerKey(p => p + 1);
      
      return prevIndexNew;
    });
  };

  // Зареждане на YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setPlayerReady(true);
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      console.log('🎬 YouTube API е готов');
      setPlayerReady(true);
    };

    return () => {
      delete window.onYouTubeIframeAPIReady;
    };
  }, []);

  // Създаване на YouTube плейър
  useEffect(() => {
    if (!playerReady || !currentSong) return;

    if (playerRef.current && typeof playerRef.current.destroy === 'function') {
      playerRef.current.destroy();
    }

    playerRef.current = new window.YT.Player('youtube-player', {
      height: '200',
      width: '100%',
      videoId: currentSong.youtube_id,
      playerVars: {
        autoplay: isPlaying ? 1 : 0,
        controls: 1,
        rel: 0,
        modestbranding: 1
      },
      events: {
        onReady: (event) => {
          console.log('✅ Плейърът е готов');
          // Вземаме реалната дължина на видеото
          const duration = event.target.getDuration();
          if (duration && duration > 0) {
            currentDurationRef.current = duration * 1000; // конвертираме в милисекунди
            console.log(`📏 Реална дължина на видеото: ${duration} секунди (${Math.floor(duration / 60)} мин ${Math.floor(duration % 60)} сек)`);
          } else {
            // Fallback на 4 минути, ако не може да се определи
            currentDurationRef.current = 240000;
            console.log(`⚠️ Не може да се определи дължината, използвам fallback: 4 минути`);
          }
          if (isPlaying) {
            event.target.playVideo();
          }
        },
        onStateChange: (event) => {
          console.log('📺 Състояние на плейъра:', event.data);
          if (event.data === 1) { // Видеото върви
            setIsPlaying(true);
            startTimer();
          } else if (event.data === 2) { // Пауза
            setIsPlaying(false);
            clearTimer();
          } else if (event.data === 0) { // Видеото свърши
            console.log('🏁 Видеото свърши чрез API');
            clearTimer();
            playNext();
          }
        },
        onError: (event) => {
          console.error('❌ Грешка в YouTube плейъра:', event.data);
        }
      }
    });

    return () => {
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
      }
    };
  }, [playerReady, currentSong]);

  // Синхронизиране на isPlaying с плейъра
  useEffect(() => {
    if (!playerRef.current || typeof playerRef.current.playVideo !== 'function') return;
    
    if (isPlaying) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [isPlaying]);

  // Зареждане на песните
  useEffect(() => {
    fetch('/api/songs')
      .then(res => res.json())
      .then(data => {
        setAllSongs(data);
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
  // Отчитане на слушането за Топ 5
  fetch('/api/jukebox-stats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      songId: song.id,
      songTitle: song.title,
      songLanguage: song.language
    })
  }).catch(err => console.error('Грешка при отчитане:', err));
  
  setQueue(prev => [...prev, song]);
};

  const removeFromQueue = (index) => {
    console.log(`❌ Премахнати от избрани песни индекс ${index}`);
    setQueue(prev => {
      const newQueue = [...prev];
      newQueue.splice(index, 1);
      return newQueue;
    });
    if (currentIndexInQueue >= index && currentIndexInQueue > 0) {
      setCurrentIndexInQueue(prev => prev - 1);
      setPlayerKey(p => p + 1);
    }
  };
  
  // Зареди топ 5 от сайта (от базата данни)
useEffect(() => {
  fetch('/api/jukebox-stats')
    .then(res => res.json())
    .then(data => {
      if (data.success && data.stats) {
        setTopSite(data.stats.slice(0, 5));
      }
    })
    .catch(err => console.error('Грешка при зареждане на топ 5 от сайта:', err));
}, []);

// Зареди топ 5 от YouTube (реален API)
useEffect(() => {
  fetch('/api/youtube-top')
    .then(res => res.json())
    .then(data => {
      if (data.success && data.videos) {
        setTopYouTube(data.videos);
      } else {
        console.error('Грешка при зареждане на YouTube топ 5:', data.error);
        setTopYouTube([]);
      }
    })
    .catch(err => {
      console.error('Грешка при заявка към YouTube API:', err);
      setTopYouTube([]);
    });
}, []);

  const moveUp = (index) => {
    console.log(`⬆️ Местя нагоре индекс ${index}`);
    if (index === 0) return;
    setQueue(prev => {
      const newQueue = [...prev];
      [newQueue[index - 1], newQueue[index]] = [newQueue[index], newQueue[index - 1]];
      return newQueue;
    });
    if (currentIndexInQueue === index) {
      setCurrentIndexInQueue(prev => prev - 1);
    } else if (currentIndexInQueue === index - 1) {
      setCurrentIndexInQueue(prev => prev + 1);
    }
    setPlayerKey(p => p + 1);
  };

  const moveDown = (index) => {
    console.log(`⬇️ Местя надолу индекс ${index}`);
    if (index === queue.length - 1) return;
    setQueue(prev => {
      const newQueue = [...prev];
      [newQueue[index + 1], newQueue[index]] = [newQueue[index], newQueue[index + 1]];
      return newQueue;
    });
    if (currentIndexInQueue === index) {
      setCurrentIndexInQueue(prev => prev + 1);
    } else if (currentIndexInQueue === index + 1) {
      setCurrentIndexInQueue(prev => prev - 1);
    }
    setPlayerKey(p => p + 1);
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
      
      {/* НЕОНОВИ БЛОКОВЕ – ТОП 5 КЛАСАЦИИ */}
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
              <p style={{ color: '#888', textAlign: 'center' }}>Зареждане на YouTube статистика...</p>
            ) : (
              topYouTube.map((video, idx) => (
                <a key={video.id} href={video.videoUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
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
                      />
                      <div>
                        <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: 'bold', maxWidth: '180px' }}>
                          {video.title.length > 30 ? video.title.substring(0, 30) + '...' : video.title}
                        </div>
                        <div style={{ color: '#888', fontSize: '0.7rem' }}>▶ {video.views} гледания</div>
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
                const fullSong = allSongs.find(song => song.id === item.song_id);
                return (
                  <div key={item.song_id} style={{
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
                  }}
                  onClick={() => fullSong && addToQueue(fullSong)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <span style={{ color: '#00ffff', fontWeight: 'bold' }}>#{idx + 1}</span>
                      <img 
                        src={fullSong?.cover_url || 'https://via.placeholder.com/40'} 
                        alt={item.song_title}
                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }}
                        onError={(e) => e.target.src = 'https://via.placeholder.com/40'}
                      />
                      <div>
                        <div style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold' }}>
                          {item.song_title.length > 20 ? item.song_title.substring(0, 20) + '...' : item.song_title}
                        </div>
                        <div style={{ color: '#888', fontSize: '0.7rem' }}>
                          {item.song_language === 'bg' ? '🇧🇬 Българска' : '🇬🇧 English'}
                        </div>
                      </div>
                    </div>
                    <div style={{ color: '#66ffff', fontSize: '0.8rem' }}>🎵 {item.listen_count}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

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
      <h2 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1.5rem' }}>📋 Лист Избрани песни</h2>
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
          <p style={{ color: '#9ca3af', textAlign: 'center', width: '100%' }}>Няма добавени песни. Кликни върху песен от Джубокса, за да я добавиш.</p>
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
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <button onClick={() => setIsPlaying(false)} style={{ background: '#8b5cf6', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>⏸️ Пауза</button>
            <button onClick={() => setIsPlaying(true)} style={{ background: '#8b5cf6', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>▶️ Плей</button>
            <button onClick={playNext} style={{ background: '#8b5cf6', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>⏩ Напред</button>
            <button onClick={playPrev} style={{ background: '#8b5cf6', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>⏪ Назад</button>
            <button onClick={() => setShuffle(!shuffle)} style={{ background: shuffle ? '#ec4899' : '#8b5cf6', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>🔀 Разбъркай</button>
          </div>
          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: '#9ca3af' }}>
            {shuffle ? '✅ Режим "Разбъркай" е активен' : '❌ Режим "Разбъркай" е изключен'}
          </p>
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
        
      )}
    </div>

    
  );
}