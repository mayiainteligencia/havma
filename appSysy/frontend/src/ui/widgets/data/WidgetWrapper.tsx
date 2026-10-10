import React from 'react';
import { Loader2, AlertCircle, Database } from 'lucide-react';

export interface BaseWidgetProps {
  loading?: boolean;
  error?: string;
  empty?: boolean;
  children: React.ReactNode;
  height?: number | string;
}

export const WidgetWrapper: React.FC<BaseWidgetProps> = ({ loading, error, empty, children, height = 300 }) => {
  if (loading) {
    return (
      <div style={{ height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)' }}>
        <Loader2 size={32} color="var(--color-primary)" className="el-pulse" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ marginTop: '12px', fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Cargando datos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)' }}>
        <AlertCircle size={32} color="var(--color-danger)" />
        <span style={{ marginTop: '12px', fontSize: '13px', color: 'var(--color-danger)', fontWeight: 500 }}>{error}</span>
      </div>
    );
  }

  if (empty) {
    return (
      <div style={{ height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)' }}>
        <Database size={32} color="var(--color-text-muted)" opacity={0.5} />
        <span style={{ marginTop: '12px', fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 500 }}>No hay datos disponibles</span>
      </div>
    );
  }

  return <div style={{ height, width: '100%', position: 'relative' }}>{children}</div>;
};
