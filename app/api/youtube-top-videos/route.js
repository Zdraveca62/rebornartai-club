// app/api/youtube-top-videos/route.js
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fvwdivmxczsqwsdgxkdc.supabase.co';
const supabaseKey = 'sb_publishable_SfL6326kgKiLQGcIHgJLCw_KJx7YXq0';
const supabase = createClient(supabaseUrl, supabaseKey);

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    // 1. Вземи видеата от Supabase (филтрирани по категория)
    let query = supabase.from('videos').select('*');
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    
    const { data: videos, error: videosError } = await query;
    
    if (videosError) throw videosError;
    
    if (!videos || videos.length === 0) {
      return NextResponse.json({
        success: true,
        videos: []
      });
    }
    
    // 2. Ако няма YouTube API ключ, върни видеата без гледания
    if (!YOUTUBE_API_KEY) {
      const videosWithoutViews = videos.map(video => ({
        id: video.id,
        title: video.title,
        video_id: video.youtube_id,
        thumbnail: video.cover_url || `https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`,
        views: null,
        video_url: `https://www.youtube.com/watch?v=${video.youtube_id}`,
        category: video.category
      }));
      
      return NextResponse.json({
        success: true,
        videos: videosWithoutViews
      });
    }
    
    // 3. Вземи ID-тата на видеата за YouTube API
    const videoIds = videos.map(v => v.youtube_id).filter(id => id).join(',');
    
    if (!videoIds) {
      return NextResponse.json({
        success: true,
        videos: []
      });
    }
    
    // 4. Заяви към YouTube API за гледанията
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/videos?key=${YOUTUBE_API_KEY}&id=${videoIds}&part=statistics`;
    
    const response = await fetch(youtubeUrl);
    const data = await response.json();
    
    if (data.error) {
      console.error('YouTube API error:', data.error);
      const videosWithoutViews = videos.map(video => ({
        id: video.id,
        title: video.title,
        video_id: video.youtube_id,
        thumbnail: video.cover_url || `https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`,
        views: null,
        video_url: `https://www.youtube.com/watch?v=${video.youtube_id}`,
        category: video.category
      }));
      
      return NextResponse.json({
        success: true,
        videos: videosWithoutViews,
        error: data.error.message
      });
    }
    
    // 5. Създай мап на гледанията
    const viewsMap = {};
    data.items.forEach(item => {
      viewsMap[item.id] = parseInt(item.statistics.viewCount, 10);
    });
    
    // 6. Комбинирай данните
    const videosWithViews = videos.map(video => ({
      id: video.id,
      title: video.title,
      video_id: video.youtube_id,
      thumbnail: video.cover_url || `https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`,
      views: viewsMap[video.youtube_id] || 0,
      video_url: `https://www.youtube.com/watch?v=${video.youtube_id}`,
      category: video.category
    }));
    
    // 7. Сортирай по гледания и вземи топ 5
    const top5Videos = videosWithViews
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);
    
    return NextResponse.json({
      success: true,
      videos: top5Videos
    });
    
  } catch (error) {
    console.error('YouTube videos API error:', error);
    return NextResponse.json(
      { success: false, error: error.message, videos: [] },
      { status: 500 }
    );
  }
}