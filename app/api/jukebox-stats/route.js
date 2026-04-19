export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fvwdivmxczsqwsdgxkdc.supabase.co';
const supabaseKey = 'sb_publishable_SfL6326kgKiLQGcIHgJLCw_KJx7YXq0';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Вземаме Топ 5 от jukebox_stats
    const { data: topStats, error: statsError } = await supabase
      .from('jukebox_stats')
      .select('*')
      .order('listen_count', { ascending: false })
      .limit(5);

    if (statsError) throw statsError;

    // Обогатяваме с youtube_id и thumbnail
    const topSiteWithDetails = await Promise.all(
      (topStats || []).map(async (item) => {
        let youtube_id = null;
        
        if (item.item_type === 'song') {
          const { data } = await supabase
            .from('music2')
            .select('youtube_id')
            .eq('id', item.song_id)
            .single();
          youtube_id = data?.youtube_id;
        } else if (item.item_type === 'video') {
          const { data } = await supabase
            .from('videos')
            .select('youtube_id')
            .eq('id', item.song_id)
            .single();
          youtube_id = data?.youtube_id;
        }
        
        return {
          ...item,
          youtube_id,
          thumbnail: youtube_id ? `https://img.youtube.com/vi/${youtube_id}/mqdefault.jpg` : null
        };
      })
    );

    return NextResponse.json({
      success: true,
      topSite: topSiteWithDetails
    });

  } catch (error) {
    console.error('Error fetching jukebox stats:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST запазва съществуващата ти логика
export async function POST(request) {
  try {
    const { songId, songTitle, songLanguage } = await request.json();
    
    // Проверка дали вече съществува запис за тази песен
    const { data: existing } = await supabase
      .from('jukebox_stats')
      .select('id, listen_count')
      .eq('song_id', songId)
      .single();
    
    if (existing) {
      // Обновяване на съществуващ запис
      const { error } = await supabase
        .from('jukebox_stats')
        .update({ 
          listen_count: existing.listen_count + 1,
          last_listened: new Date().toISOString()
        })
        .eq('song_id', songId);
      
      if (error) throw error;
    } else {
      // Създаване на нов запис
      const { error } = await supabase
        .from('jukebox_stats')
        .insert({
          song_id: songId,
          song_title: songTitle,
          song_language: songLanguage || 'bg',
          listen_count: 1,
          item_type: 'song',
          last_listened: new Date().toISOString()
        });
      
      if (error) throw error;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating jukebox stats:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}