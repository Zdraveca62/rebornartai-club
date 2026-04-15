// app/api/proxy-geo/route.js
// Прокси за геолокация – работи и на localhost, и на Vercel

export async function GET() {
  // Ако сме в development режим (локално тестване)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Development mode: връщам тестова геолокация за localhost');
    
    return Response.json({
      query: '192.168.1.100',        // Тестов IP
      status: 'success',
      country: 'Ireland',
      countryCode: 'IE',
      region: 'Munster',
      regionName: 'County Tipperary',
      city: 'Cashel',
      zip: 'E25',
      lat: 52.5167,
      lon: -7.8833,
      timezone: 'Europe/Dublin',
      isp: 'Local Development',
      org: 'Reborn Art AI',
      as: 'ASN - Test'
    });
  }
  
  // За production (Vercel) – реална заявка към ip-api.com
  try {
    // Използваме fetch към публичното API за геолокация
    const res = await fetch('http://ip-api.com/json/', {
      headers: {
        'Accept': 'application/json',
      },
      // Важно: казваме на ip-api.com, че искаме JSON отговор
      next: { revalidate: 0 } // Не кешираме за максимално точни данни
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    
    // Ако ip-api.com върне fail (напр. за reserved range)
    if (data.status === 'fail') {
      console.log('⚠️ ip-api.com върна fail:', data.message);
      // Връщаме fallback данни, за да не се чупи сайта
      return Response.json({
        query: 'unknown',
        status: 'fail',
        message: data.message,
        // Fallback данни
        country: 'Ireland',
        city: 'Dublin',
        regionName: 'County Dublin'
      });
    }
    
    // Успешен отговор
    console.log('📍 Геолокация за production:', data.city, data.country);
    return Response.json(data);
    
  } catch (error) {
    console.error('❌ Грешка при геолокация:', error);
    
    // Fallback при грешка – показваме данни по подразбиране
    return Response.json({
      query: 'error',
      status: 'fail',
      message: error.message || 'Грешка при заявката',
      // Fallback за да не се показва "Unknown"
      country: 'Ireland',
      city: 'Dublin',
      regionName: 'County Dublin'
    });
  }
}