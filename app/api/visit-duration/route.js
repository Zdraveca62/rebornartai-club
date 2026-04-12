export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fvwdivmxczsqwsdgxkdc.supabase.co';
const supabaseKey = 'sb_publishable_SfL6326kgKiLQGcIHgJLCw_KJx7YXq0';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const { sessionId, durationSeconds, ip } = await request.json();
    
    let finalIp = ip;
    if (!finalIp || finalIp === '0.0.0.0') {
      finalIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    }
    
    console.log('💓 Записване на време:', { sessionId, durationSeconds, ip: finalIp });
    
    const { error } = await supabase
      .from('visit_duration')
      .insert({
        ip_address: finalIp,
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
    const { data, error } = await supabase
      .from('visit_duration')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('❌ Грешка при GET:', error);
    return NextResponse.json([]); // Връщаме празен масив при грешка
  }
}