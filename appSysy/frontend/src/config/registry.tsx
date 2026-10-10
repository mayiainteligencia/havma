import React from 'react';
import { KpiCard, Panel } from '../ui/widgets';
import { BarsHatched, FlowThreads, LineArea, Gauge } from '../ui/widgets/data';

// Componente fallback cuando un widget no existe en el registro
const MissingWidget = ({ type }: { type: string }) => (
  <div style={{ padding: 16, border: '1px dashed var(--color-danger)', color: 'var(--color-danger)', borderRadius: 8 }}>
    Widget no encontrado: {type}
  </div>
);

// El registro mapea nombres de strings a componentes de React
export const WIDGET_REGISTRY: Record<string, React.FC<any>> = {
  'KpiCard': KpiCard,
  'Panel': Panel,
  'BarsHatched': BarsHatched,
  'FlowThreads': FlowThreads,
  'LineArea': LineArea,
  'Gauge': Gauge,
};

export interface WidgetDef {
  id: string;
  type: string;
  props?: Record<string, any>;
  children?: WidgetDef[];
}

export interface WidgetRendererProps {
  def: WidgetDef;
  dataMap?: Record<string, any>; // Map de data inyectada dinámicamente
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({ def, dataMap = {} }) => {
  const Component = WIDGET_REGISTRY[def.type] || MissingWidget;
  const data = def.id && dataMap[def.id] ? dataMap[def.id] : undefined;

  const resolvedProps = {
    ...def.props,
    ...(data !== undefined ? { data } : {}),
    ...(Component === MissingWidget ? { type: def.type } : {})
  };

  if (def.children && def.children.length > 0) {
    return (
      <Component {...resolvedProps} key={def.id}>
        {def.children.map(child => <WidgetRenderer key={child.id} def={child} dataMap={dataMap} />)}
      </Component>
    );
  }

  return <Component {...resolvedProps} key={def.id} />;
};
