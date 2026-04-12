export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Взимаме реалния IP на потребителя (проверяваме няколко хедъра)
    let realIp = request.headers.get('x-forwarded-for');
    if (realIp) {
      realIp = realIp.split(',')[0].trim();
    } else {
      realIp = request.headers.get('x-real-ip');
    }
    
    // Ако няма IP, използваме default
    if (!realIp) {
      realIp = '';
    }
    
    console.log('📡 IP за геолокация:', realIp);
    
    // Изпращаме IP адреса към ip-api.com
    const apiUrl = realIp ? `http://ip-api.com/json/${realIp}` : 'http://ip-api.com/json/';
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    console.log('📍 Отговор от ip-api.com:', data);
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Грешка в прокси заявката:', error);
    return new Response(JSON.stringify({ 
      status: 'fail',
      country: 'Unknown',
      city: 'Unknown',
      query: '0.0.0.0'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}