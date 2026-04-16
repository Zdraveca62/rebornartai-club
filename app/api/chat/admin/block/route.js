import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { sessionId } = await request.json();
    
    console.log('🚫 Блокиране на сесия:', sessionId);
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }
    
    // Първо провери дали колоната blocked съществува
    // Ако не съществува, добави я с тази заявка в Supabase SQL:
    // ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT FALSE;
    
    const { error } = await supabase
      .from('chat_sessions')
      .update({ blocked: true, status: 'blocked' })
      .eq('session_id', sessionId);
    
    if (error) {
      console.error('Грешка при блокиране:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('❌ Грешка:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}