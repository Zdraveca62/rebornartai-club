import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// GET – взима статистиката за Jukebox
export async function GET() {
  try {
    const { data: stats, error } = await supabase
      .from('jukebox_stats')
      .select('*')
      .order('listen_count', { ascending: false });
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, stats: stats || [] });
    
  } catch (error) {
    console.error('Грешка при GET jukebox-stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST – увеличава броя на слушанията за дадена песен
export async function POST(request) {
  try {
    const body = await request.json();
    const { songId, songTitle, songLanguage } = body;
    
    if (!songId || !songTitle) {
      return NextResponse.json({ error: 'Missing songId or songTitle' }, { status: 400 });
    }
    
    // Провери дали съществува запис за тази песен
    const { data: existing, error: findError } = await supabase
      .from('jukebox_stats')
      .select('id, listen_count')
      .eq('song_id', songId)
      .maybeSingle();
    
    if (existing) {
      // Актуализирай съществуващия запис
      const { error: updateError } = await supabase
        .from('jukebox_stats')
        .update({ 
          listen_count: existing.listen_count + 1,
          last_listened: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      
      if (updateError) throw updateError;
      
      return NextResponse.json({ success: true, message: 'Слушането е отчетено' });
    } else {
      // Създай нов запис
      const { error: insertError } = await supabase
        .from('jukebox_stats')
        .insert([{
          song_id: songId,
          song_title: songTitle,
          song_language: songLanguage || 'bg',
          listen_count: 1,
          last_listened: new Date().toISOString()
        }]);
      
      if (insertError) throw insertError;
      
      return NextResponse.json({ success: true, message: 'Нова песен добавена в статистиката' });
    }
    
  } catch (error) {
    console.error('Грешка при POST jukebox-stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}