import React from 'react';
import { WidgetWrapper } from './WidgetWrapper';

export interface GaugeProps {
  value: number;
  max?: number;
  label?: string;
  config?: { color?: string; size?: number };
  loading?: boolean;
  error?: string;
}

export const Gauge: React.FC<GaugeProps> = ({ value, max = 100, label, config = {}, loading, error }) => {
  const size = config.size || 120;
  const color = config.color || 'var(--color-primary)';
  const pct = Math.min(Math.max(value / max, 0), 1);
  const dashArray = `${pct * 126} 126`; // 126 is approx half circumference of r=40

  return (
    <WidgetWrapper loading={loading} error={error} empty={value === undefined} height={size}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <svg width={size} height={size * 0.6} viewBox="0 0 100 60">
          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="var(--color-surface-hover)" strokeWidth="12" strokeLinecap="round" />
          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeDasharray={dashArray} className="el-anim" />
        </svg>
        <div style={{ marginTop: '-15px', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-main)' }}>{value}</div>
          {label && <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>{label}</div>}
        </div>
      </div>
    </WidgetWrapper>
  );
};
