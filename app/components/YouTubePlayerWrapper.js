'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

const YouTubePlayerWrapper = forwardRef(({ videoId, isPlaying, onEnded, onDuration }, ref) => {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const isDestroyingRef = useRef(false);
  const durationRef = useRef(240);
  const apiReadyRef = useRef(false);

  useImperativeHandle(ref, () => ({
    getDuration: () => durationRef.current,
    playVideo: () => {
      if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
        playerRef.current.playVideo();
      }
    },
    pauseVideo: () => {
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo();
      }
    }
  }));

  // Зареждане на YouTube API
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      
      window.onYouTubeIframeAPIReady = () => {
        console.log('🎬 YouTube API готов');
        apiReadyRef.current = true;
      };
    } else {
      apiReadyRef.current = true;
    }
  }, []);

  // Създаване на плейър
  useEffect(() => {
    if (!apiReadyRef.current || !window.YT || !window.YT.Player || !videoId) return;

    // Изчистване на стар плейър
    if (playerRef.current) {
      isDestroyingRef.current = true;
      try {
        playerRef.current.destroy();
      } catch (e) {
        // Игнорираме
      }
      playerRef.current = null;
      isDestroyingRef.current = false;
    }

    const player = new window.YT.Player(containerRef.current, {
      height: '200',
      width: '100%',
      videoId: videoId,
      playerVars: {
        autoplay: isPlaying ? 1 : 0,
        controls: 1,
        rel: 0,
        modestbranding: 1
      },
      events: {
        onReady: (event) => {
          const duration = event.target.getDuration();
          if (duration && duration > 0) {
            durationRef.current = duration;
            if (onDuration) onDuration(duration);
          }
        },
        onStateChange: (event) => {
          if (event.data === 0 && onEnded) {
            onEnded();
          }
        },
        onError: (event) => {
          console.error('YouTube error:', event.data);
        }
      }
    });

    playerRef.current = player;

    return () => {
      if (playerRef.current && !isDestroyingRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
        playerRef.current = null;
      }
    };
  }, [videoId, apiReadyRef.current]);

  // Контрол на плей/пауза
  useEffect(() => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [isPlaying]);

  return <div ref={containerRef}></div>;
});

YouTubePlayerWrapper.displayName = 'YouTubePlayerWrapper';

export default YouTubePlayerWrapper;
