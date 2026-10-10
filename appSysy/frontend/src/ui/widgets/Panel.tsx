import React from 'react';

export interface PanelProps {
  title?: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export const Panel: React.FC<PanelProps> = ({ title, icon, right, children, style, className = '' }) => {
  return (
    <section 
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px',
        boxShadow: 'var(--shadow-md)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        ...style
      }} 
      className={`panel-widget ${className}`}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
    >
      {(title || right) && (
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {icon && (
              <div style={{ 
                width: '36px', height: '36px', borderRadius: 'var(--radius-md)', 
                backgroundColor: 'rgba(178, 34, 34, 0.1)', display: 'flex', 
                alignItems: 'center', justifyContent: 'center' 
              }}>
                {icon}
              </div>
            )}
            {title && (
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-main)', margin: 0 }}>
                {title}
              </h3>
            )}
          </div>
          {right && <div>{right}</div>}
        </header>
      )}
      {children}
    </section>
  );
};
