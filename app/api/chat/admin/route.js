import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// GET – взима всички активни сесии за админа
export async function GET(request) {
  try {
    // Вземи всички активни сесии
    const { data: sessions, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('status', 'active')
      .order('last_message_at', { ascending: false });
    
    if (error) throw error;
    
    // За всяка сесия вземи последното съобщение и брой непрочетени
    const sessionsWithData = await Promise.all(
      (sessions || []).map(async (session) => {
        const { data: lastMessage } = await supabase
          .from('chat_messages')
          .select('message, created_at, sender')
          .eq('session_id', session.session_id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        const { count: unreadCount } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', session.session_id)
          .eq('sender', 'visitor')
          .eq('is_read', false);
        
        return {
          ...session,
          lastMessage: lastMessage?.[0] || null,
          unreadCount: unreadCount || 0
        };
      })
    );
    
    return NextResponse.json({ sessions: sessionsWithData });
    
  } catch (error) {
    console.error('Admin chat грешка:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}