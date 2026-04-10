import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fvwdivmxczsqwsdgxkdc.supabase.co'
const supabaseKey = 'sb_publishable_SfL6326kgKiLQGcIHgJLCw_KJx7YXq0'

const supabase = createClient(supabaseUrl, supabaseKey)

// GET – взима всички песни
export async function GET() {
  const { data, error } = await supabase
    .from('music2')
    .select('*')
    .order('id', { ascending: true })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

// POST – добавя нова песен
export async function POST(request) {
  try {
    const body = await request.json()
    console.log('📝 Получени данни:', body)
    
    const { title, youtubeId, lyrics, language } = body
    
    // Валидация
    if (!title || !youtubeId || !lyrics || !language) {
      return NextResponse.json({ error: 'Липсват задължителни полета' }, { status: 400 })
    }
    
    const coverUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
    
    const { data, error } = await supabase
      .from('music2')
      .insert([
        { 
          title: title.trim(),
          youtube_id: youtubeId.trim(),
          lyrics: lyrics,
          cover_url: coverUrl,
          language: language.trim()
        }
      ])
      .select()
    
    if (error) {
      console.error('❌ Supabase грешка:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ Добавена песен:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Грешка:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE – изтрива песен
export async function DELETE(request) {
  try {
    const { id } = await request.json()
    
    const { error } = await supabase
      .from('music2')
      .delete()
      .eq('id', id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}