import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// GET – взима съобщенията за дадена сесия
export async function GET(request) {
  try {
    const { data: sessions, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('status', 'active')
    .order('last_message_at', { ascending: false });
  
  console.log('📊 Резултат от Supabase:', sessions);
  console.log('❌ Грешка:', error);

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const admin = searchParams.get('admin') === 'true';
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }
    
    // Вземи съобщенията
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    
    if (messagesError) throw messagesError;
    
    // Ако е admin, маркирай съобщенията като прочетени
    if (admin && messages && messages.length > 0) {
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('session_id', sessionId)
        .eq('sender', 'visitor')
        .eq('is_read', false);
    }
    
    return NextResponse.json({ messages: messages || [] });
    
  } catch (error) {
    console.error('Chat GET грешка:', error);
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