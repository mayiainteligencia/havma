import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface KpiCardProps {
  label: string;
  value: string;
  delta?: string;
  up?: boolean;
  sub?: string;
  style?: React.CSSProperties;
}

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, delta, up, sub, style }) => {
  return (
    <div style={{
      backgroundColor: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: '16px',
      boxShadow: 'var(--shadow-sm)',
      ...style
    }}>
      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text-main)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {value}
      </div>
      {(delta || sub) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 12, color: up === false ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 600 }}>
          {up !== undefined && (up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />)}
          <span style={{ color: delta ? undefined : 'var(--color-text-muted)' }}>{delta || sub}</span>
          {delta && sub && <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>· {sub}</span>}
        </div>
      )}
    </div>
  );
};
