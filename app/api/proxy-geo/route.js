export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const response = await fetch('http://ip-api.com/json/');
    const data = await response.json();
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