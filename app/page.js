const trackVisitor = async () => {
  try {
    const geoRes = await fetch('http://ip-api.com/json/');
    const geoData = await geoRes.json();
    
    const userAgent = navigator.userAgent;
    let deviceType = 'desktop';
    if (/mobile|android|iphone|phone/i.test(userAgent)) deviceType = 'mobile';
    else if (/tablet|ipad/i.test(userAgent)) deviceType = 'tablet';
    
    const response = await fetch('/api/visitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ip: geoData.query,
        country: geoData.country,
        city: geoData.city,
        region: geoData.regionName,
        userAgent: userAgent,
        deviceType: deviceType
      })
    });
    
    const result = await response.json();
    console.log('📊 Резултат:', result);
    
    setVisitCount(result.visitCount);
    setIsNew(result.isNew);
    setShowBanner(true);
    
    setTimeout(() => setShowBanner(false), 5000);
  } catch (err) {
    console.error('❌ Грешка:', err);
  }
};