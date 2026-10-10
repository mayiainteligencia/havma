import React from 'react';
import { WidgetWrapper } from './WidgetWrapper';

export interface ThreadData {
  id: string;
  label: string;
  points: number[];
  color?: string;
}

export interface FlowThreadsConfig {
  height?: number;
  showGrid?: boolean;
}

export interface FlowThreadsProps {
  data: ThreadData[];
  config?: FlowThreadsConfig;
  loading?: boolean;
  error?: string;
  onThreadClick?: (item: ThreadData) => void;
}

export const FlowThreads: React.FC<FlowThreadsProps> = ({ data, config = {}, loading, error, onThreadClick }) => {
  const height = config.height || 120;
  
  if (!data || data.length === 0) return <WidgetWrapper loading={loading} error={error} empty height={height}><div/></WidgetWrapper>;

  const maxLen = Math.max(...data.map(d => d.points.length), 1);
  const maxVal = Math.max(...data.flatMap(d => d.points), 1);

  return (
    <WidgetWrapper loading={loading} error={error}>
      <svg width="100%" height={height} viewBox={`0 0 ${maxLen * 10} ${height}`} preserveAspectRatio="none">
        {data.map((thread, i) => {
          const path = thread.points.map((p, j) => {
            const x = j * 10;
            const y = height - (p / maxVal) * (height - 20) - 10;
            return `${j === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' ');

          return (
            <g key={thread.id} onClick={() => onThreadClick?.(thread)} style={{ cursor: onThreadClick ? 'pointer' : 'default' }}>
              <path 
                d={path} 
                fill="none" 
                stroke={thread.color || `var(--color-primary)`} 
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.8}
                className="el-anim"
              />
            </g>
          );
        })}
      </svg>
    </WidgetWrapper>
  );
};
