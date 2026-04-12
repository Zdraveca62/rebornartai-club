import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fvwdivmxczsqwsdgxkdc.supabase.co';
const supabaseKey = 'sb_publishable_SfL6326kgKiLQGcIHgJLCw_KJx7YXq0';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('❌ Грешка при GET:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { title, youtubeId, description, category } = await request.json();
    
    const coverUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
    
    const { data, error } = await supabase
      .from('videos')
      .insert([{
        title,
        youtube_id: youtubeId,
        description,
        category,
        cover_url: coverUrl
      }])
      .select();
    
    if (error) throw error;
    
    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error('❌ Грешка при POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Грешка при DELETE:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}