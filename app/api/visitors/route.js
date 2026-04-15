import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// GET – взима статистика за посетителите
export async function GET() {
  try {
    // Общ брой уникални посетители (по session_id)
    const { count: totalVisitors, error: countError } = await supabase
      .from('visitors')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    
    // Всички посетители за детайлната таблица
    const { data: allVisitors, error: visitorsError } = await supabase
      .from('visitors')
      .select('*')
      .order('last_visit', { ascending: false });
    
    if (visitorsError) throw visitorsError;
    
    // Статистика по устройства
    const { data: deviceStats, error: deviceError } = await supabase
      .from('visitors')
      .select('device_type, visit_count')
      .not('device_type', 'is', null);
    
    if (deviceError) throw deviceError;
    
    const deviceAgg = {
      desktop: 0,
      mobile: 0,
      tablet: 0
    };
    
    deviceStats?.forEach(stat => {
      const type = stat.device_type || 'desktop';
      deviceAgg[type] += (stat.visit_count || 1);
    });
    
    return NextResponse.json({
      totalVisits: totalVisitors || 0,
      allVisitors: allVisitors || [],
      deviceStats: deviceAgg
    });
    
  } catch (error) {
    console.error('❌ Грешка при GET /api/visitors:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST – записва ново посещение
export async function POST(request) {
  try {
    const body = await request.json();
    const { ip, country, city, region, userAgent, deviceType, sessionId } = body;
    
    console.log('📝 Записвам посещение:', { ip, country, city, sessionId });
    
    // ============================================
    // ЗА ТЕСТВАНЕ ЛОКАЛНО: Всяко посещение се записва
    // ============================================
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Development mode: записвам всяко посещение (без 10-минутна защита)');
      
      // Провери дали вече съществува visitor със същия session_id
      const { data: existingVisitor, error: existingError } = await supabase
        .from('visitors')
        .select('id, visit_count')
        .eq('session_id', sessionId)
        .maybeSingle();
      
      if (existingVisitor) {
        // Актуализирай съществуващия visitor
        const { error: updateError } = await supabase
          .from('visitors')
          .update({ 
            last_visit: new Date().toISOString(),
            visit_count: (existingVisitor.visit_count || 1) + 1,
            country: country || 'Ireland',
            city: city || 'Cashel',
            region: region || 'County Tipperary',
            device_type: deviceType || 'desktop'
          })
          .eq('id', existingVisitor.id);
        
        if (updateError) throw updateError;
        
        console.log('✅ Актуализиран съществуващ visitor (dev mode):', sessionId);
        
        const { count: totalCount } = await supabase
          .from('visitors')
          .select('*', { count: 'exact', head: true });
        
        return NextResponse.json({ 
          success: true, 
          isNew: false, 
          visitCount: totalCount || 1,
          message: 'Посещението е актуализирано (dev mode)'
        });
      }
      
      // Създаване на нов visitor
      const { data: newVisitor, error: insertError } = await supabase
        .from('visitors')
        .insert([{
          ip_address: ip,
          country: country || 'Ireland',
          city: city || 'Cashel',
          region: region || 'County Tipperary',
          user_agent: userAgent,
          device_type: deviceType || 'desktop',
          session_id: sessionId,
          first_visit: new Date().toISOString(),
          last_visit: new Date().toISOString(),
          visit_count: 1
        }])
        .select();
      
      if (insertError) throw insertError;
      
      console.log('✅ Нов visitor създаден (dev mode):', sessionId);
      
      const { count: totalCount } = await supabase
        .from('visitors')
        .select('*', { count: 'exact', head: true });
      
      return NextResponse.json({ 
        success: true, 
        isNew: true, 
        visitCount: totalCount || 1,
        message: 'Ново посещение е записано (dev mode)'
      });
    }
    
    // ============================================
    // ЗА PRODUCTION (VERCEL): С 10-минутна защита
    // ============================================
    console.log('🌍 Production mode: проверка за скорошно посещение');
    
    // Проверка дали има скорошно посещение от този sessionId (последните 10 минути)
    const TEN_MINUTES_AGO = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const { data: recentVisit, error: recentError } = await supabase
      .from('visitors')
      .select('id, visit_count')
      .eq('session_id', sessionId)
      .gte('first_visit', TEN_MINUTES_AGO)
      .maybeSingle();
    
    if (recentVisit) {
      // Актуализирай съществуващото посещение
      const { error: updateError } = await supabase
        .from('visitors')
        .update({ 
          last_visit: new Date().toISOString(),
          visit_count: (recentVisit.visit_count || 1) + 1
        })
        .eq('id', recentVisit.id);
      
      if (updateError) throw updateError;
      
      console.log('✅ Актуализиран visitor (в рамките на 10 минути)');
      
      const { count: totalCount } = await supabase
        .from('visitors')
        .select('*', { count: 'exact', head: true });
      
      return NextResponse.json({ 
        success: true, 
        isNew: false, 
        visitCount: totalCount || 1,
        message: 'Посещението е актуализирано (в рамките на 10 минути)'
      });
    }
    
    // Няма скорошно посещение – създаваме нов запис
    console.log('📝 Няма скорошно посещение – създавам нов visitor');
    
    // Провери дали вече съществува visitor със същия session_id (за общата статистика)
    const { data: existingVisitor, error: existingError } = await supabase
      .from('visitors')
      .select('id, visit_count')
      .eq('session_id', sessionId)
      .maybeSingle();
    
    if (existingVisitor) {
      // Актуализирай съществуващия visitor
      const { error: updateError } = await supabase
        .from('visitors')
        .update({ 
          last_visit: new Date().toISOString(),
          visit_count: (existingVisitor.visit_count || 1) + 1,
          country: country || 'Ireland',
          city: city || 'Dublin',
          region: region || 'County Dublin',
          device_type: deviceType || 'desktop'
        })
        .eq('id', existingVisitor.id);
      
      if (updateError) throw updateError;
      
      console.log('✅ Актуализиран съществуващ visitor (production):', sessionId);
      
      const { count: totalCount } = await supabase
        .from('visitors')
        .select('*', { count: 'exact', head: true });
      
      return NextResponse.json({ 
        success: true, 
        isNew: false, 
        visitCount: totalCount || 1,
        message: 'Посещението е актуализирано'
      });
    }
    
    // Създаване на нов visitor
    const { data: newVisitor, error: insertError } = await supabase
      .from('visitors')
      .insert([{
        ip_address: ip,
        country: country || 'Ireland',
        city: city || 'Dublin',
        region: region || 'County Dublin',
        user_agent: userAgent,
        device_type: deviceType || 'desktop',
        session_id: sessionId,
        first_visit: new Date().toISOString(),
        last_visit: new Date().toISOString(),
        visit_count: 1
      }])
      .select();
    
    if (insertError) throw insertError;
    
    console.log('✅ Нов visitor създаден (production):', sessionId);
    
    const { count: totalCount } = await supabase
      .from('visitors')
      .select('*', { count: 'exact', head: true });
    
    return NextResponse.json({ 
      success: true, 
      isNew: true, 
      visitCount: totalCount || 1,
      message: 'Новото посещение е записано'
    });
    
  } catch (error) {
    console.error('❌ Грешка при POST /api/visitors:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}