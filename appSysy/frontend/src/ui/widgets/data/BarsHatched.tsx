import React from 'react';
import { WidgetWrapper } from './WidgetWrapper';

export interface BarsData {
  id: string;
  label: string;
  value: number;
  secondaryValue?: number;
}

export interface BarsConfig {
  primaryColor?: string;
  secondaryColor?: string;
  showLabels?: boolean;
  maxValue?: number;
}

export interface BarsHatchedProps {
  data: BarsData[];
  config?: BarsConfig;
  loading?: boolean;
  error?: string;
  onBarClick?: (item: BarsData) => void;
}

export const BarsHatched: React.FC<BarsHatchedProps> = ({ data, config = {}, loading, error, onBarClick }) => {
  const { primaryColor = 'var(--color-primary)', secondaryColor = 'var(--color-border)', showLabels = true } = config;
  const max = config.maxValue || Math.max(...data.map(d => Math.max(d.value, d.secondaryValue || 0)), 1);

  return (
    <WidgetWrapper loading={loading} error={error} empty={!data || data.length === 0}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', height: '100%', overflowY: 'auto' }}>
        {data.map(item => {
          const widthPct = (item.value / max) * 100;
          const secWidthPct = item.secondaryValue ? (item.secondaryValue / max) * 100 : 0;
          
          return (
            <div 
              key={item.id} 
              style={{ display: 'flex', flexDirection: 'column', gap: '4px', cursor: onBarClick ? 'pointer' : 'default' }}
              onClick={() => onBarClick?.(item)}
            >
              {showLabels && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{item.label}</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-text-muted)' }}>{item.value}</span>
                </div>
              )}
              <div style={{ position: 'relative', height: '16px', backgroundColor: 'var(--color-surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                {item.secondaryValue && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, height: '100%', width: `${secWidthPct}%`,
                    backgroundColor: secondaryColor, opacity: 0.5,
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.05) 5px, rgba(0,0,0,0.05) 10px)'
                  }} />
                )}
                <div style={{
                  position: 'absolute', top: 0, left: 0, height: '100%', width: `${widthPct}%`,
                  backgroundColor: primaryColor, transition: 'width 0.4s ease'
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </WidgetWrapper>
  );
};
