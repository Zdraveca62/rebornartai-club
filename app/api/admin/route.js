import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fvwdivmxczsqwsdgxkdc.supabase.co';
const supabaseKey = 'sb_publishable_SfL6326kgKiLQGcIHgJLCw_KJx7YXq0';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const { token } = await request.json();
    
    console.log('🔐 Проверка на токен:', token ? 'получен' : 'липсва');
    
    if (!token) {
      return NextResponse.json({ valid: false, error: 'Липсва токен' });
    }
    
    // Взимаме токена от базата данни
    const { data, error } = await supabase
      .from('admin_settings')
      .select('admin_token')
      .eq('id', 1)
      .maybeSingle();
    
    if (error) {
      console.error('Грешка при зареждане на токен:', error);
      return NextResponse.json({ valid: false, error: 'Грешка в базата данни' });
    }
    
    if (!data || !data.admin_token) {
      console.error('Няма запис в admin_settings');
      return NextResponse.json({ valid: false, error: 'Няма конфигуриран токен' });
    }
    
    const isValid = (token === data.admin_token);
    console.log('🔐 Токенът е', isValid ? 'валиден' : 'невалиден');
    
    return NextResponse.json({ valid: isValid });
  } catch (error) {
    console.error('Грешка:', error);
    return NextResponse.json({ valid: false, error: error.message });
  }
}