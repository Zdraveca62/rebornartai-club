import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fvwdivmxczsqwsdgxkdc.supabase.co';
const supabaseKey = 'sb_publishable_SfL6326kgKiLQGcIHgJLCw_KJx7YXq0';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const { data: allVisitors, error } = await supabase
      .from('visitors')
      .select('*')
      .order('last_visit', { ascending: false });

    if (error) throw error;

    if (!allVisitors || allVisitors.length === 0) {
      return NextResponse.json({
        totalVisits: 0,
        totalMinutes: 0,
        deviceStats: { desktop: 0, mobile: 0, tablet: 0 },
        allVisitors: []
      });
    }

    const deviceStats = { desktop: 0, mobile: 0, tablet: 0 };
    let totalVisits = 0;
    let totalMinutes = 0;

    allVisitors.forEach(v => {
      const visitCount = v.visit_count || 1;
      totalVisits += visitCount;
      totalMinutes += visitCount * 5;
      
      if (v.device_type === 'desktop') deviceStats.desktop += visitCount;
      else if (v.device_type === 'mobile') deviceStats.mobile += visitCount;
      else if (v.device_type === 'tablet') deviceStats.tablet += visitCount;
    });

    return NextResponse.json({
      totalVisits,
      totalMinutes,
      deviceStats,
      allVisitors
    });
  } catch (error) {
    console.error('❌ Грешка:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { ip, country, city, region, userAgent, deviceType } = await request.json();
    
    // Ако IP е 0.0.0.0 или Unknown, използваме реалния IP от заявката
    let realIp = ip;
    if (ip === '0.0.0.0' || ip === 'Unknown' || !ip) {
      realIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';
    }
    
    console.log('📱 Получени данни:', { ip: realIp, country, city, deviceType });
    
    if (!realIp || realIp === 'unknown') {
      console.log('⚠️ Не може да се определи IP адрес');
      return NextResponse.json({ success: true, isNew: false, visitCount: 0 });
    }
    
    // Търсим по IP адрес
    const { data: existing } = await supabase
      .from('visitors')
      .select('id, visit_count, country, city')
      .eq('ip_address', realIp)
      .maybeSingle();
    
    const now = new Date().toISOString();
    
    if (existing) {
      const newCount = existing.visit_count + 1;
      console.log(`📊 Обновяване на IP ${realIp}: посещение ${newCount}`);
      
      // ПРЕДПАЗВАМЕ съществуващите данни – не ги презаписваме с Unknown
      const finalCountry = (country && country !== 'Unknown') ? country : (existing.country || 'Unknown');
      const finalCity = (city && city !== 'Unknown') ? city : (existing.city || 'Unknown');
      
      await supabase
        .from('visitors')
        .update({ 
          visit_count: newCount, 
          last_visit: now,
          country: finalCountry,
          city: finalCity,
          region: region || existing.region || 'Unknown',
          user_agent: userAgent,
          device_type: deviceType
        })
        .eq('id', existing.id);
      
      return NextResponse.json({ 
        success: true, 
        isNew: false, 
        visitCount: newCount,
        deviceType 
      });
    } else {
      console.log(`📊 Нов IP: ${realIp}`);
      
      await supabase.from('visitors').insert([{
        ip_address: realIp,
        country: country || 'Unknown',
        city: city || 'Unknown',
        region: region || 'Unknown',
        user_agent: userAgent,
        device_type: deviceType,
        visit_count: 1,
        first_visit: now,
        last_visit: now,
      }]);
      
      return NextResponse.json({ 
        success: true, 
        isNew: true, 
        visitCount: 1,
        deviceType 
      });
    }
  } catch (error) {
    console.error('❌ Грешка:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}