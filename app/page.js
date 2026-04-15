'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const isLocalIp = (ip) => {
  if (process.env.NODE_ENV === 'development') {
    return false;
  }
  return !ip || ip === '::1' || ip === '127.0.0.1' || ip === 'localhost' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.');
};

export default function Home() {
  const [visitCount, setVisitCount] = useState(null);
  const [isNew, setIsNew] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const pathname = usePathname();
  const startTimeRef = useRef(null);
  const sessionIdRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const finalTimeSentRef = useRef(false);

  useEffect(() => {
    let savedSessionId = localStorage.getItem('session_id');
    if (!savedSessionId) {
      const browserId = Math.random().toString(36).substr(2, 9);
      savedSessionId = 'session_' + Date.now() + '_' + browserId;
      localStorage.setItem('session_id', savedSessionId);
      console.log('🆕 Нов sessionId създаден за този браузър:', savedSessionId);
    } else {
      console.log('🔄 Използвам съществуващ sessionId:', savedSessionId);
    }
    sessionIdRef.current = savedSessionId;
  }, []);

  const sendDuration = async (seconds, isFinal = false) => {
    if (seconds < 15 && !isFinal) return;
    
    try {
      const geoRes = await fetch('/api/proxy-geo');
      const geoData = await geoRes.json();
      
      const userAgent = navigator.userAgent;
      let deviceType = 'desktop';
      if (/mobile|android|iphone|phone/i.test(userAgent)) deviceType = 'mobile';
      else if (/tablet|ipad/i.test(userAgent)) deviceType = 'tablet';
      
      await fetch('/api/visit-duration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          durationSeconds: seconds,
          ip: geoData.query,
          deviceType: deviceType
        })
      });
      console.log(`💓 Heartbeat: ${Math.floor(seconds / 60)} минути, ${seconds % 60} секунди`);
    } catch (err) {
      console.error('Грешка:', err);
    }
  };

  useEffect(() => {
    startTimeRef.current = Date.now();
    
    heartbeatIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        sendDuration(elapsed);
      }
    }, 15000);
    
    const handleBeforeUnload = () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (startTimeRef.current && !finalTimeSentRef.current) {
        finalTimeSentRef.current = true;
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        sendDuration(elapsed, true);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (startTimeRef.current && !finalTimeSentRef.current) {
        finalTimeSentRef.current = true;
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        sendDuration(elapsed, true);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (pathname === '/admin' || pathname === '/admin-login' || pathname.startsWith('/admin')) {
      return;
    }
    
    const trackVisitor = async () => {
      try {
        const lastVisit = localStorage.getItem('last_visit_time');
        const now = Date.now();
        const THIRTY_SECONDS = 30 * 1000;
        
        if (lastVisit && (now - parseInt(lastVisit)) < THIRTY_SECONDS) {
          console.log('⏭️ Последното посещение е от по-малко от 30 секунди');
          return;
        }
        
        const geoRes = await fetch('/api/proxy-geo');
        const geoData = await geoRes.json();
        
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
            deviceType: deviceType,
            sessionId: sessionIdRef.current
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          localStorage.setItem('last_visit_time', now.toString());
          setVisitCount(result.visitCount);
          setIsNew(result.isNew);
          setShowBanner(true);
          setTimeout(() => setShowBanner(false), 5000);
        }
      } catch (err) {
        console.error('Грешка:', err);
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
          <span>{isNew ? '✨ Добре дошли!' : '👋 Добре дошли отново!'}</span>
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
      
      <div style={{
        height: '100vh',
        scrollSnapAlign: 'start',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #4c1d95, #000000, #312e81)'
      }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>
          Reborn Art AI
        </h1>
        <p style={{ fontSize: '1.5rem', color: '#d1d5db', textAlign: 'center', maxWidth: '42rem', padding: '0 1rem' }}>
          Където изкуственият интелект създава музика, видео и анимация
        </p>
      </div>

      <div style={{
        height: '100vh',
        scrollSnapAlign: 'start',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e1b4b, #000000, #4c1d95)'
      }}>
        <h2 style={{ fontSize: '3rem', fontWeight: 'bold', color: 'white', marginBottom: '3rem' }}>
          AI Творчество
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
          <Link href="/ai-music" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '2rem', textAlign: 'center', border: '1px solid rgba(139, 92, 246, 0.5)' }}>
              <div style={{ fontSize: '4rem' }}>🎵</div>
              <h3 style={{ color: 'white' }}>AI Music</h3>
            </div>
          </Link>
          
          <Link href="/ai-videos" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '2rem', textAlign: 'center', border: '1px solid rgba(236, 72, 153, 0.5)' }}>
              <div style={{ fontSize: '4rem' }}>🎬</div>
              <h3 style={{ color: 'white' }}>AI Videos</h3>
            </div>
          </Link>
          
          <Link href="/blog" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '2rem', textAlign: 'center', border: '1px solid rgba(245, 158, 11, 0.5)' }}>
              <div style={{ fontSize: '4rem' }}>📝</div>
              <h3 style={{ color: 'white' }}>AI Blog</h3>
            </div>
          </Link>
          
          <Link href="/jukebox" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '2rem', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.5)' }}>
              <div style={{ fontSize: '4rem' }}>🎧</div>
              <h3 style={{ color: 'white' }}>Jukebox</h3>
            </div>
          </Link>
        </div>
        
        <Link href="/admin" style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 100 }}>
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            padding: '0.75rem 1.5rem',
            cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <span style={{ color: 'white' }}>⚙️ Admin</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
