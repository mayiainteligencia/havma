import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, Radio } from 'lucide-react';

export type StatusType = 'success' | 'warning' | 'error' | 'info' | 'live';

export interface StatusBadgeProps {
  status: StatusType;
  label: string;
  pulsing?: boolean;
  style?: React.CSSProperties;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, pulsing, style }) => {
  const getConfig = () => {
    switch (status) {
      case 'success': return { color: 'var(--color-success)', Icon: CheckCircle2 };
      case 'warning': return { color: 'var(--color-warning)', Icon: AlertTriangle };
      case 'error': return { color: 'var(--color-danger)', Icon: AlertCircle };
      case 'live': return { color: 'var(--color-success)', Icon: Radio };
      case 'info':
      default: return { color: 'var(--color-text-muted)', Icon: Info };
    }
  };

  const { color, Icon } = getConfig();

  return (
    <span style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '6px', 
      fontSize: '12px', 
      fontWeight: 700, 
      letterSpacing: '0.02em', 
      color,
      ...style 
    }}>
      <div style={{ position: 'relative', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={14} color={color} />
        {(pulsing || status === 'live') && (
          <span 
            style={{ 
              position: 'absolute',
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: color,
              animation: 'elPulse 1.4s ease-in-out infinite',
              opacity: 0.5
            }} 
          />
        )}
      </div>
      {label}
    </span>
  );
};
