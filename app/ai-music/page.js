'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import TopSongs from '@/app/components/TopSongs'

export default function AIMusicPage() {
  const [songs, setSongs] = useState([])
  const [selectedSong, setSelectedSong] = useState(null)
  const [showLyrics, setShowLyrics] = useState(false)
  const [language, setLanguage] = useState('bg')

  useEffect(() => {
    fetch('/api/songs')
      .then(res => res.json())
      .then(data => setSongs(data))
  }, [])

  const filteredSongs = songs.filter(song => song.language === language)

  const handleListen = async (song) => {
    // Отчитане за Топ 5
    await fetch('/api/jukebox-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        songId: song.id,
        songTitle: song.title,
        songLanguage: song.language
      })
    });
    window.open(`https://youtube.com/watch?v=${song.youtube_id}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e1b4b, #000000, #4c1d95)', padding: '2rem' }}>
      
      <Link href="/">
        <button style={{ position: 'fixed', top: '1rem', left: '1rem', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', zIndex: 10 }}>
          ← Назад
        </button>
      </Link>

      <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: '2rem' }}>AI Music</h1>

      {/* Топ 5 компонент */}
      <div style={{ maxWidth: '1200px', margin: '0 auto 2rem auto' }}>
        <TopSongs />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '3rem' }}>
        <button onClick={() => setLanguage('bg')} style={{ background: language === 'bg' ? '#8b5cf6' : 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.75rem 2rem', borderRadius: '8px', cursor: 'pointer' }}>
          🎵 Български песни
        </button>
        <button onClick={() => setLanguage('en')} style={{ background: language === 'en' ? '#8b5cf6' : 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.75rem 2rem', borderRadius: '8px', cursor: 'pointer' }}>
          🎵 English Songs
        </button>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center', maxWidth: '1200px', margin: '0 auto' }}>
        {filteredSongs.map(song => (
          <div key={song.id} style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '1.5rem', width: '250px', textAlign: 'center', border: '1px solid rgba(139,92,246,0.5)' }}>
            <img src={song.cover_url} alt={song.title} style={{ width: '100%', borderRadius: '12px', marginBottom: '1rem' }} />
            <h3 style={{ color: 'white', marginBottom: '1rem' }}>{song.title}</h3>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button onClick={() => handleListen(song)} style={{ background: '#8b5cf6', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>🎧 Слушай</button>
              <button onClick={() => { setSelectedSong(song); setShowLyrics(true); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>📜 Текст</button>
            </div>
          </div>
        ))}
      </div>

      {showLyrics && selectedSong && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setShowLyrics(false)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>{selectedSong.title}</h3>
            <p style={{ whiteSpace: 'pre-wrap' }}>{selectedSong.lyrics}</p>
          </div>
        </div>
      )}
    </div>
  )
}