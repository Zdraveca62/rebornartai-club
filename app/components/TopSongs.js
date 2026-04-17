'use client';

import { useState, useEffect } from 'react';

export default function TopSongs({ onSongClick }) {
  const [topSongs, setTopSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/jukebox-stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTopSongs(data.stats.slice(0, 5));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Грешка при зареждане на Топ 5:', err);
        setLoading(false);
      });
  }, []);

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
      {/* Анимирани светлинки */}
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
      
      {topSongs.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center' }}>Все още няма слушания</p>
      ) : (
        topSongs.map((item, idx) => (
          <div key={item.song_id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.7rem',
            marginBottom: '0.5rem',
            background: 'rgba(0, 255, 255, 0.1)',
            borderRadius: '12px',
            borderLeft: `3px solid #00ffff`,
            cursor: onSongClick ? 'pointer' : 'default',
            transition: 'transform 0.2s'
          }}
          onClick={() => onSongClick && onSongClick(item)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <span style={{ color: '#00ffff', fontWeight: 'bold' }}>#{idx + 1}</span>
              <div>
                <div style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  {item.song_title.length > 25 ? item.song_title.substring(0, 25) + '...' : item.song_title}
                </div>
                <div style={{ color: '#888', fontSize: '0.7rem' }}>
                  {item.song_language === 'bg' ? '🇧🇬 Българска' : '🇬🇧 English'}
                </div>
              </div>
            </div>
            <div style={{ color: '#66ffff', fontSize: '0.8rem' }}>🎵 {item.listen_count}</div>
          </div>
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