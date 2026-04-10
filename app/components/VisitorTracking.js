'use client'

import { useEffect, useRef } from 'react'

export default function VisitorTracking({ onVisitData }) {
  const hasTracked = useRef(false)

  useEffect(() => {
    if (hasTracked.current) return
    hasTracked.current = true

    const trackVisitor = async () => {
      try {
        const geoRes = await fetch('https://ipapi.co/json/')
        const geoData = await geoRes.json()
        
        const response = await fetch('/api/visitors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ip: geoData.ip,
            country: geoData.country_name,
            city: geoData.city,
            region: geoData.region,
            userAgent: navigator.userAgent
          })
        })
        
        const result = await response.json()
        
        if (onVisitData) {
          onVisitData(result)
        }
      } catch (err) {
        console.error('❌ Грешка:', err)
      }
    }
    
    trackVisitor()
  }, [onVisitData])
  
  return null
}