'use client'

import { useState, useEffect } from 'react'
import VisitorTracking from './VisitorTracking'

export default function WelcomeMessage() {
  const [message, setMessage] = useState('')
  const [visitNumber, setVisitNumber] = useState(null)

  const handleVisitData = (data) => {
    if (data.isNew) {
      setMessage('✨ Добре дошли в Reborn Art AI!')
    } else {
      setMessage('👋 Добре дошли отново!')
      setVisitNumber(data.visitCount)
    }
    
    // Скриваме съобщението след 5 секунди
    setTimeout(() => {
      setMessage('')
      setVisitNumber(null)
    }, 5000)
  }

  if (!message) return null

  return (
    <>
      <VisitorTracking onVisitData={handleVisitData} />
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: '#8b5cf6',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        zIndex: 1000,
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        animation: 'slideIn 0.3s ease-out'
      }}>
        {message}
        {visitNumber && (
          <span style={{ 
            display: 'inline-block', 
            marginLeft: '10px', 
            background: 'white', 
            color: '#8b5cf6',
            padding: '2px 8px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            # {visitNumber}
          </span>
        )}
      </div>
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  )
}