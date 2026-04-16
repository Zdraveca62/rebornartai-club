import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// GET – взима всички активни сесии за админа (без да иска sessionId)
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

// POST – изпраща ново съобщение
export async function POST(request) {
  try {
    const body = await request.json();
    const { sessionId, sender, message, visitorName, visitorEmail } = body;
    
    if (!sessionId || !sender || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Провери дали сесията съществува
    const { data: existingSession } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('session_id', sessionId)
      .single();
    
    if (!existingSession) {
      // Създай нова сесия
      await supabase
        .from('chat_sessions')
        .insert([{ 
          session_id: sessionId, 
          visitor_name: visitorName || 'Анонимен',
          visitor_email: visitorEmail || null,
          status: 'active'
        }]);
    } else if (visitorName) {
      // Обнови името на посетителя
      await supabase
        .from('chat_sessions')
        .update({ visitor_name: visitorName })
        .eq('session_id', sessionId);
    }
    
    // Запази съобщението
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{
        session_id: sessionId,
        sender: sender,
        message: message,
        is_read: sender === 'admin' ? true : false
      }])
      .select();
    
    if (error) throw error;
    
    // Обнови last_message_at
    await supabase
      .from('chat_sessions')
      .update({ last_message_at: new Date().toISOString() })
      .eq('session_id', sessionId);
    
    return NextResponse.json({ success: true, message: data[0] });
    
  } catch (error) {
    console.error('Chat POST грешка:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
}
// DELETE – изтрива конкретно съобщение (само за админ)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('id');
    
    if (!messageId) {
      return NextResponse.json({ error: 'Missing message id' }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, message: 'Съобщението е изтрито' });
    
  } catch (error) {
    console.error('Грешка при DELETE:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}