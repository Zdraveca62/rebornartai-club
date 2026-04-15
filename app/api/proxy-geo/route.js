// app/api/proxy-geo/route.js
// Прокси за геолокация – използва ip2location.io (по-точен от ip-api.com)

export async function GET() {
  // Ако сме в development режим (локално тестване)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Development mode: връщам тестова геолокация за localhost');
    
    return Response.json({
      query: '2001:bb6:9422:800:ccb7:778e:e297:e5a3',
      status: 'success',
      country: 'Ireland',
      countryCode: 'IE',
      region: 'M',
      regionName: 'Munster',
      city: 'Cashel',
      zip: 'E25',
      lat: 52.5148,
      lon: -7.8776,
      timezone: 'Europe/Dublin',
      isp: 'Eircom Limited',
      org: 'Eircom',
      as: 'AS5466 Eircom Limited'
    });
  }
  
  // За production (Vercel) – използваме ip2location.io
  try {
    const apiKey = process.env.C1673B621F144C145C14B23C98C3BCCE;
    let url = 'https://api.ip2location.io/?format=json';
    
    // Ако има API ключ, добавяме го за повече заявки
    if (apiKey) {
      url += `&key=${apiKey}`;
    }
    
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 0 }
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    
    // Успешен отговор
    console.log('📍 Геолокация (ip2location):', data.city_name, data.country_name);
    
    return Response.json({
      query: data.ip,
      status: 'success',
      country: data.country_name || 'Ireland',
      countryCode: data.country_code,
      region: data.region,
      regionName: data.region_name,
      city: data.city_name || 'Dublin',
      zip: data.zip_code,
      lat: data.latitude,
      lon: data.longitude,
      timezone: data.time_zone,
      isp: data.isp,
      org: data.org,
      as: data.as
    });
    
  } catch (error) {
    console.error('❌ Грешка при геолокация:', error);
    
    // Fallback при грешка – показваме данни по подразбиране
    return Response.json({
      query: 'unknown',
      status: 'fail',
      message: error.message || 'Грешка при заявката',
      country: 'Ireland',
      city: 'Dublin',
      regionName: 'County Dublin'
    });
  }
}