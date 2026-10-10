import React from 'react';

export type TagVariant = 'real' | 'importado' | 'simulado' | 'default';

export interface TagProps {
  variant: TagVariant;
  label?: string;
  style?: React.CSSProperties;
}

export const Tag: React.FC<TagProps> = ({ variant, label, style }) => {
  const getConfig = () => {
    switch (variant) {
      case 'real': return { text: 'real', color: 'var(--color-success)' };
      case 'importado': return { text: 'importado', color: '#3B82F6' };
      case 'simulado': return { text: 'simulado', color: 'var(--color-text-muted)' };
      default: return { text: label || '', color: 'var(--color-text-main)' };
    }
  };

  const { text, color } = getConfig();

  return (
    <span style={{
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '4px', 
      fontSize: '10px', 
      fontWeight: 700,
      textTransform: 'uppercase', 
      letterSpacing: '0.04em', 
      color, 
      backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
      border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`, 
      borderRadius: '999px', 
      padding: '2px 8px', 
      lineHeight: 1.6, 
      ...style,
    }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: color }} />
      {label || text}
    </span>
  );
};
