import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fvwdivmxczsqwsdgxkdc.supabase.co';
const supabaseKey = 'sb_publishable_SfL6326kgKiLQGcIHgJLCw_KJx7YXq0';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  const { data, error } = await supabase.from('visitors').select('*').order('last_visit', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  const totalVisits = data.reduce((sum, v) => sum + (v.visit_count || 1), 0);
  const deviceStats = { desktop: 0, mobile: 0, tablet: 0 };
  const ipStats = [];
  
  data.forEach(v => {
    const count = v.visit_count || 1;
    if (v.device_type === 'desktop') deviceStats.desktop += count;
    else if (v.device_type === 'mobile') deviceStats.mobile += count;
    else if (v.device_type === 'tablet') deviceStats.tablet += count;
    
    const existingIp = ipStats.find(ip => ip.ip_address === v.ip_address);
    if (existingIp) {
      existingIp.totalVisits += count;
    } else {
      ipStats.push({
        ip_address: v.ip_address,
        city: v.city || 'Неизвестен',
        country: v.country || 'Неизвестна',
        deviceType: v.device_type || 'desktop',
        totalVisits: count,
        lastVisit: v.last_visit
      });
    }
  });
  
  return NextResponse.json({
    totalVisits,
    deviceStats,
    ipStats,
    uniqueIps: ipStats.length
  });
}

export async function POST(request) {
  try {
    const { ip, country, city, region, userAgent, deviceType } = await request.json();
    
    // Проверка дали IP съществува
    const { data: existing } = await supabase
      .from('visitors')
      .select('id, visit_count')
      .eq('ip_address', ip)
      .maybeSingle();
    
    const now = new Date().toISOString();
    
    if (existing) {
      // УВЕЛИЧАВАМЕ БРОЯЧА
      const newCount = (existing.visit_count || 1) + 1;
      
      const { error } = await supabase
        .from('visitors')
        .update({ 
          visit_count: newCount, 
          last_visit: now,
          country, 
          city, 
          region, 
          user_agent: userAgent,
          device_type: deviceType
        })
        .eq('id', existing.id);
      
      if (error) throw error;
      
      return NextResponse.json({ success: true, isNew: false, visitCount: newCount });
    } else {
      // Нов запис
      const { error } = await supabase.from('visitors').insert([{
        ip_address: ip,
        country,
        city,
        region,
        user_agent: userAgent,
        device_type: deviceType,
        visit_count: 1,
        first_visit: now,
        last_visit: now,
      }]);
      
      if (error) throw error;
      
      return NextResponse.json({ success: true, isNew: true, visitCount: 1 });
    }
  } catch (error) {
    console.error('❌ Грешка:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}