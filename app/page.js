'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const [visitCount, setVisitCount] = useState(null);
  const [isNew, setIsNew] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // НЕ броим посещения в административните страници
    if (pathname === '/admin' || pathname === '/admin-login' || pathname.startsWith('/admin')) {
      console.log('⏭️ Пропускане на броене (административна страница)');
      return;
    }
    
    // Проверка дали е пълно зареждане, а не навигация в кеша
    const isHardReload = window.performance?.getEntriesByType('navigation')[0]?.type === 'reload';
    const isNewPageLoad = window.performance?.getEntriesByType('navigation')[0]?.type === 'navigate';
    
    // Ако е навигация (връщане назад, преход от друга страница) – НЕ БРОИМ
    if (!isHardReload && !isNewPageLoad) {
      console.log('⏭️ Пропускане (кеширана навигация)');
      return;
    }
    
    const trackVisitor = async () => {
      try {
        console.log('📡 Започва проследяване (пълно зареждане)...');
        
        // Взимаме локацията
        const geoRes = await fetch('http://ip-api.com/json/');
        const geoData = await geoRes.json();
        console.log('📍 Локация:', geoData);
        
        // Определяне на устройство
        const userAgent = navigator.userAgent;
        let deviceType = 'desktop';
        if (/mobile|android|iphone|phone/i.test(userAgent)) deviceType = 'mobile';
        else if (/tablet|ipad/i.test(userAgent)) deviceType = 'tablet';
        
        const response = await fetch('/api/visitors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ip: geoData.query,
            country: geoData.country,
            city: geoData.city,
            region: geoData.regionName,
            userAgent: userAgent,
            deviceType: deviceType
          })
        });
        
        const result = await response.json();
        console.log('📊 Резултат:', result);
        
        setVisitCount(result.visitCount);
        setIsNew(result.isNew);
        setShowBanner(true);
        
        setTimeout(() => setShowBanner(false), 5000);
      } catch (err) {
        console.error('❌ Грешка при проследяване:', err);
      }
    };
    
    trackVisitor();
  }, [pathname]);

  return (
    <div style={{ height: '100vh', overflowY: 'scroll', scrollSnapType: 'y mandatory' }}>
      
      {showBanner && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#8b5cf6',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          zIndex: 1000,
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span>{isNew ? '✨ Добре дошли в Reborn Art AI!' : '👋 Добре дошли отново!'}</span>
          {visitCount && (
            <span style={{
              background: 'white',
              color: '#8b5cf6',
              padding: '2px 8px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              # {visitCount}
            </span>
          )}
          <button onClick={() => setShowBanner(false)} style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer'
          }}>✕</button>
        </div>
      )}
      
      {/* СТРАНИЦА 1 - HOME */}
      <div style={{
        height: '100vh',
        scrollSnapAlign: 'start',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        background: 'linear-gradient(135deg, #4c1d95, #000000, #312e81)'
      }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 'bold', color: 'white', marginBottom: '1.5rem', textAlign: 'center' }}>
          Reborn Art AI
        </h1>
        <p style={{ fontSize: '1.5rem', color: '#d1d5db', textAlign: 'center', maxWidth: '42rem', padding: '0 1rem' }}>
          Където изкуственият интелект създава музика, видео и анимация
        </p>
        <div style={{ position: 'absolute', bottom: '2rem', color: 'white', fontSize: '1.5rem', animation: 'bounce 2s infinite' }}>
          ↓ Скролвай надолу ↓
        </div>
      </div>

      {/* СТРАНИЦА 2 - AI Творчество */}
      <div style={{
        height: '100vh',
        scrollSnapAlign: 'start',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e1b4b, #000000, #4c1d95)'
      }}>
        <h2 style={{ fontSize: '3rem', fontWeight: 'bold', color: 'white', marginBottom: '3rem', textAlign: 'center' }}>
          AI Творчество
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', maxWidth: '80rem', margin: '0 auto', padding: '0 1rem', width: '100%' }}>
          
          <Link href="/ai-music" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '2rem', cursor: 'pointer', textAlign: 'center', border: '1px solid rgba(139, 92, 246, 0.5)' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎵</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>AI Music</h3>
              <p style={{ color: '#d1d5db' }}>Генерирани мелодии</p>
            </div>
          </Link>
          
          <Link href="/ai-videos" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '2rem', cursor: 'pointer', textAlign: 'center', border: '1px solid rgba(236, 72, 153, 0.5)' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎬</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>AI Videos</h3>
              <p style={{ color: '#d1d5db' }}>Видео от AI</p>
            </div>
          </Link>
          
          <Link href="/admin" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '2rem', cursor: 'pointer', textAlign: 'center', border: '1px solid rgba(99, 102, 241, 0.5)' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚙️</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>Admin</h3>
              <p style={{ color: '#d1d5db' }}>Управление</p>
            </div>
          </Link>
        </div>
        
        <p style={{ color: '#9ca3af', marginTop: '2rem', fontSize: '0.875rem' }}>
          ⚡ Всяка плочка води към съответната секция
        </p>
      </div>
      
      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(10px); }
        }
      `}</style>
    </div>
  );
}