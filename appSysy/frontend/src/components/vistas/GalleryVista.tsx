import React from 'react';
import { Panel, KpiCard } from '../../ui/widgets';
import { BarsHatched, FlowThreads, LineArea, Gauge } from '../../ui/widgets/data';

export const GalleryVista: React.FC = () => {
  const barsData1 = [
    { id: '1', label: 'TV Abierta', value: 45000, secondaryValue: 50000 },
    { id: '2', label: 'Digital', value: 30000, secondaryValue: 25000 },
  ];
  const barsData2 = [
    { id: '1', label: 'OOH', value: 12000 },
    { id: '2', label: 'Radio', value: 8000 },
  ];
  const flowData1 = [
    { id: '1', label: 'TV', points: [10, 20, 50, 40, 80, 20], color: 'var(--color-primary)' },
    { id: '2', label: 'Digital', points: [5, 10, 15, 20, 25, 30], color: 'var(--color-success)' }
  ];
  const flowData2 = [
    { id: '1', label: 'Radio', points: [50, 40, 30, 20, 10, 0], color: 'var(--color-warning)' }
  ];
  const areaData1 = [
    { time: 'Ene', value: 100 }, { time: 'Feb', value: 200 }, { time: 'Mar', value: 150 }
  ];
  const areaData2 = [
    { time: 'Sem 1', value: 50 }, { time: 'Sem 2', value: 80 }, { time: 'Sem 3', value: 60 }
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: 'var(--color-background)', minHeight: '100vh' }}>
      <h1 style={{ color: 'var(--color-text-main)', marginBottom: '24px' }}>Galería de Widgets (Dev Only)</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <Panel title="BarsHatched (Dataset 1)">
          <div style={{ height: 200 }}>
            <BarsHatched data={barsData1} />
          </div>
        </Panel>
        <Panel title="BarsHatched (Dataset 2)">
          <div style={{ height: 200 }}>
            <BarsHatched data={barsData2} config={{ primaryColor: 'var(--color-success)' }} />
          </div>
        </Panel>
        
        <Panel title="FlowThreads (Dataset 1)">
          <FlowThreads data={flowData1} />
        </Panel>
        <Panel title="FlowThreads (Dataset 2)">
          <FlowThreads data={flowData2} />
        </Panel>

        <Panel title="LineArea (Dataset 1)">
          <LineArea data={areaData1} />
        </Panel>
        <Panel title="LineArea (Dataset 2)">
          <LineArea data={areaData2} config={{ color: 'var(--color-warning)' }} />
        </Panel>

        <Panel title="Gauge (Dataset 1)">
          <Gauge value={75} label="Alcance %" />
        </Panel>
        <Panel title="Gauge (Dataset 2)">
          <Gauge value={32} max={50} label="Frecuencia" config={{ color: 'var(--color-success)' }} />
        </Panel>

        {/* Empty / Loading / Error states */}
        <Panel title="Estados Base (Cargando)">
          <BarsHatched data={[]} loading={true} />
        </Panel>
        <Panel title="Estados Base (Error)">
          <BarsHatched data={[]} error="Fallo al cargar datos del backend" />
        </Panel>
        <Panel title="Estados Base (Vacío)">
          <BarsHatched data={[]} />
        </Panel>
      </div>
    </div>
  );
};
