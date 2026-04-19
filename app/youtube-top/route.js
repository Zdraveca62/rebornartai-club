export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fvwdivmxczsqwsdgxkdc.supabase.co';
const supabaseKey = 'sb_publishable_SfL6326kgKiLQGcIHgJLCw_KJx7YXq0';
const supabase = createClient(supabaseUrl, supabaseKey);

// YouTube API ключ – сложи си истинския в .env.local
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
// ID на твоя YouTube канал (примерен, смени с твоя)
const CHANNEL_ID = 'UCt_1r_mkL9w_vXr2WlLqA6w';

// Функция за вземане на видеата от YouTube (само 1 заявка на ден)
async function fetchYouTubeVideos() {
  if (!YOUTUBE_API_KEY) {
    console.error('❌ YouTube API key липсва');
    return null;
  }

  // 1. Вземаме ID-тата на топ 5 видеата по гледания (евтино: 100 единици)
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${CHANNEL_ID}&part=snippet&order=viewCount&maxResults=5&type=video`;
  
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();
  
  if (searchData.error) {
    console.error('YouTube search error:', searchData.error);
    return null;
  }
  
  const videoIds = searchData.items.map(item => item.id.videoId).join(',');
  
  // 2. Вземаме детайли и гледанията (много евтино: 1 единица за 50 видеа)
  const videosUrl = `https://www.googleapis.com/youtube/v3/videos?key=${YOUTUBE_API_KEY}&id=${videoIds}&part=snippet,statistics`;
  
  const videosRes = await fetch(videosUrl);
  const videosData = await videosRes.json();
  
  if (videosData.error) {
    console.error('YouTube videos error:', videosData.error);
    return null;
  }
  
  // 3. Форматираме резултата
  return videosData.items.map(item => ({
    video_id: item.id,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
    views: parseInt(item.statistics.viewCount, 10),
    video_url: `https://www.youtube.com/watch?v=${item.id}`
  }));
}

export async function GET() {
  try {
    // 1. Проверка за кеш
    const { data: cached, error: cacheError } = await supabase
      .from('youtube_cache')
      .select('*')
      .order('cached_at', { ascending: false })
      .limit(5);
    
    if (cacheError) console.error('Cache read error:', cacheError);
    
    // 2. Ако има кеш от последните 24 часа, връщаме него
    if (cached && cached.length === 5) {
      const lastCache = new Date(cached[0].cached_at);
      const now = new Date();
      const hoursPassed = (now - lastCache) / (1000 * 60 * 60);
      
      if (hoursPassed < 24) {
        console.log(`📦 Връщам кеширани данни (${Math.floor(hoursPassed)} часа стари)`);
        return NextResponse.json({
          success: true,
          videos: cached,
          cached: true,
          expiresIn: Math.floor(24 - hoursPassed)
        });
      }
    }
    
    // 3. Няма кеш или е стар – викаме YouTube API
    console.log('🔄 Кешът е стар, викам YouTube API...');
    const videos = await fetchYouTubeVideos();
    
    if (!videos || videos.length === 0) {
      // Ако API не работи, връщаме стария кеш (ако има)
      if (cached && cached.length > 0) {
        console.log('⚠️ YouTube API грешка, връщам стар кеш');
        return NextResponse.json({
          success: true,
          videos: cached,
          cached: true,
          stale: true
        });
      }
      throw new Error('No data from YouTube API');
    }
    
    // 4. Обновяваме кеша
    // Изтриваме старите записи
    await supabase.from('youtube_cache').delete().neq('id', 0);
    
    // Вмъкваме новите
    const { error: insertError } = await supabase
      .from('youtube_cache')
      .insert(videos);
    
    if (insertError) {
      console.error('Cache insert error:', insertError);
    } else {
      console.log('✅ Кешът е обновен с нови данни от YouTube');
    }
    
    return NextResponse.json({
      success: true,
      videos: videos,
      cached: false
    });
    
  } catch (error) {
    console.error('YouTube API error:', error);
    
    // При всяка грешка – опитваме да върнем какъвто и да е кеш
    const { data: cached } = await supabase
      .from('youtube_cache')
      .select('*')
      .limit(5);
    
    if (cached && cached.length > 0) {
      return NextResponse.json({
        success: true,
        videos: cached,
        cached: true,
        error: error.message
      });
    }
    
    return NextResponse.json(
      { success: false, error: error.message, videos: [] },
      { status: 500 }
    );
  }
}