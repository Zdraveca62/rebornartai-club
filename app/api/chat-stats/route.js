import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Общ брой съобщения
    const { count: totalMessages, error: countError } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    
    // Брой непрочетени съобщения (от посетители, които не са прочетени)
    const { count: unreadMessages, error: unreadError } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('sender', 'visitor')
      .eq('is_read', false);
    
    if (unreadError) throw unreadError;
    
    // Брой активни сесии (със съобщения от последните 24 часа)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: activeSessions, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('session_id')
      .eq('status', 'active')
      .gte('last_message_at', yesterday);
    
    if (sessionError) throw sessionError;
    
    return NextResponse.json({
      success: true,
      stats: {
        totalMessages: totalMessages || 0,
        unreadMessages: unreadMessages || 0,
        activeSessions: activeSessions?.length || 0
      }
    });
    
  } catch (error) {
    console.error('Грешка при GET chat-stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}