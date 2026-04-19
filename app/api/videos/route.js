// app/api/videos/route.js
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fvwdivmxczsqwsdgxkdc.supabase.co';
const supabaseKey = 'sb_publishable_SfL6326kgKiLQGcIHgJLCw_KJx7YXq0';
const supabase = createClient(supabaseUrl, supabaseKey);

// GET – взима видеа, опционално филтрирани по категория
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    let query = supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Ако има параметър category, филтрираме
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data || []);
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST – добавя ново видео (ако ти трябва)
export async function POST(request) {
  try {
    const body = await request.json();
    const { title, youtube_id, description, category, cover_url } = body;
    
    const { data, error } = await supabase
      .from('videos')
      .insert([{
        title,
        youtube_id,
        description,
        category,
        cover_url: cover_url || `https://img.youtube.com/vi/${youtube_id}/maxresdefault.jpg`
      }])
      .select();
    
    if (error) throw error;
    
    return NextResponse.json(data[0]);
    
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}