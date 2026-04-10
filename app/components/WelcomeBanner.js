'use client';

export default function WelcomeBanner({ message, visitCount, isVisible, onClose }) {
  if (!isVisible) return null;

  return (
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
      animation: 'slideIn 0.3s ease-out',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <span>{message}</span>
      {visitCount && (
        <span style={{
          background: 'white',
          color: '#8b5cf6',
          padding: '2px 8px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          # {visitCount}
        </span>
      )}
      <button onClick={onClose} style={{
        background: 'none',
        border: 'none',
        color: 'white',
        fontSize: '18px',
        cursor: 'pointer',
        marginLeft: '8px'
      }}>✕</button>
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
    </div>
  );
}