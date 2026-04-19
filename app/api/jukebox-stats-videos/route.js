export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fvwdivmxczsqwsdgxkdc.supabase.co';
const supabaseKey = 'sb_publishable_SfL6326kgKiLQGcIHgJLCw_KJx7YXq0';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // 1. Изграждане на заявката
    let query = supabase
      .from('jukebox_stats')
      .select('*')
      .eq('item_type', 'video');
    
    // 2. Филтър по категория (ако е подадена)
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    
    // 3. Сортиране и лимит
    query = query.order('listen_count', { ascending: false }).limit(5);
    
    const { data: stats, error: statsError } = await query;

    if (statsError) throw statsError;

    // 4. Обогатяване с детайли от videos таблицата (за тъмбнейли и заглавия)
    const videosWithDetails = await Promise.all(
      (stats || []).map(async (stat) => {
        const { data: video } = await supabase
          .from('videos')
          .select('id, title, youtube_id, cover_url, category')
          .eq('id', stat.song_id)
          .single();
        
        return {
          id: stat.song_id,
          title: video?.title || stat.song_title,
          song_title: stat.song_title,
          youtube_id: video?.youtube_id,
          listen_count: stat.listen_count,
          category: stat.category || video?.category,
          thumbnail: video?.cover_url || `https://img.youtube.com/vi/${video?.youtube_id}/mqdefault.jpg`,
          video_url: `https://www.youtube.com/watch?v=${video?.youtube_id}`
        };
      })
    );

    return NextResponse.json({
      success: true,
      videos: videosWithDetails,
      category: category || 'all'
    });

  } catch (error) {
    console.error('Error fetching video stats:', error);
    return NextResponse.json(
      { success: false, error: error.message, videos: [] },
      { status: 500 }
    );
  }
}