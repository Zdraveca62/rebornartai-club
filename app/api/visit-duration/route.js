import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fvwdivmxczsqwsdgxkdc.supabase.co';
const supabaseKey = 'sb_publishable_SfL6326kgKiLQGcIHgJLCw_KJx7YXq0';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const { sessionId, durationSeconds } = await request.json();
    
    // Взимаме IP адреса от хедърите
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    
    const { error } = await supabase
      .from('visit_duration')
      .insert({
        ip_address: ip,
        session_id: sessionId,
        duration_seconds: durationSeconds
      });
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Грешка:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Връща статистика за времената (за админ панела)
    const { data, error } = await supabase
      .from('visit_duration')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}