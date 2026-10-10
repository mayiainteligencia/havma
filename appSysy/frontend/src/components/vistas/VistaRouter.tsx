import React from 'react';
import { EjecutivaVista } from './EjecutivaVista';
import { ClienteVista } from './ClienteVista';
import { PlaneacionVista } from './PlaneacionVista';
import { FlowchartVista } from './FlowchartVista';
import { AprobacionesVista } from './AprobacionesVista';
import { PresupuestoVista } from './PresupuestoVista';
import { ResultadosVista } from './ResultadosVista';
import { GalleryVista } from './GalleryVista';

interface Props { vistaId: string; subId: string; onNavigate: (target: string) => void }

/** Despacha a la vista real por id — reemplaza al VistaPlaceholder de la Fase 1. */
export const VistaRouter: React.FC<Props> = ({ vistaId, subId, onNavigate }) => {
  if (import.meta.env.DEV && vistaId === 'widgets') return <GalleryVista />;
  switch (vistaId) {
    case 'ejecutiva': return <EjecutivaVista subId={subId} onNavigate={onNavigate} />;
    case 'cliente': return <ClienteVista subId={subId} onNavigate={onNavigate} />;
    case 'planeacion': return <PlaneacionVista subId={subId} onNavigate={onNavigate} />;
    case 'flowchart': return <FlowchartVista subId={subId} onNavigate={onNavigate} />;
    case 'aprobaciones': return <AprobacionesVista subId={subId} onNavigate={onNavigate} />;
    case 'presupuesto': return <PresupuestoVista subId={subId} onNavigate={onNavigate} />;
    case 'resultados': return <ResultadosVista subId={subId} onNavigate={onNavigate} />;
    default: return null;
  }
};
