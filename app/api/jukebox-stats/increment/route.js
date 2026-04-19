// app/api/jukebox-stats/increment/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fvwdivmxczsqwsdgxkdc.supabase.co';
const supabaseKey = 'sb_publishable_SfL6326kgKiLQGcIHgJLCw_KJx7YXq0';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const { song_id, song_title, song_language, item_type, category } = await request.json();
    
    // Проверка дали записът съществува
    const { data: existing } = await supabase
      .from('jukebox_stats')
      .select('id, listen_count')
      .eq('song_id', song_id)
      .eq('item_type', item_type)
      .single();
    
    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('jukebox_stats')
        .update({
          listen_count: existing.listen_count + 1,
          last_listened: new Date().toISOString(),
          category: category // Обновяване на категорията (ако е променена)
        })
        .eq('song_id', song_id)
        .eq('item_type', item_type);
      
      if (error) throw error;
    } else {
      // Insert new
      const { error } = await supabase
        .from('jukebox_stats')
        .insert({
          song_id: song_id,
          song_title: song_title,
          song_language: song_language || 'bg',
          item_type: item_type || 'song',
          category: category || null,
          listen_count: 1,
          last_listened: new Date().toISOString()
        });
      
      if (error) throw error;
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error incrementing stats:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}