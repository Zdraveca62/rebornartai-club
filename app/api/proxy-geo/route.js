export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Вземаме реалния IP на потребителя от хедърите на заявката
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = forwardedFor ? forwardedFor.split(',')[0] : request.headers.get('x-real-ip');
    
    console.log('📡 Реален IP на потребителя:', realIp);
    
    // Изпращаме IP адреса към ip-api.com
    const apiUrl = realIp ? `http://ip-api.com/json/${realIp}` : 'http://ip-api.com/json/';
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    console.log('📍 Локация от ip-api.com:', data);
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Грешка в прокси заявката:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch location' }), {
      status: 500,
    });
  }
}