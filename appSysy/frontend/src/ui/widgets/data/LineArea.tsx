import React from 'react';
import { WidgetWrapper } from './WidgetWrapper';

export interface AreaData {
  time: string;
  value: number;
}

export interface LineAreaProps {
  data: AreaData[];
  config?: { color?: string; height?: number };
  loading?: boolean;
  error?: string;
}

export const LineArea: React.FC<LineAreaProps> = ({ data, config = {}, loading, error }) => {
  const height = config.height || 150;
  if (!data || data.length === 0) return <WidgetWrapper loading={loading} error={error} empty height={height}><div/></WidgetWrapper>;

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const color = config.color || 'var(--color-primary)';

  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (d.value / maxVal) * 90;
    return `${x},${y}`;
  });
  
  const polyPoints = `0,100 ${pts.join(' ')} 100,100`;

  return (
    <WidgetWrapper loading={loading} error={error} height={height}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <polygon points={polyPoints} fill="url(#area-grad)" />
        <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </WidgetWrapper>
  );
};
