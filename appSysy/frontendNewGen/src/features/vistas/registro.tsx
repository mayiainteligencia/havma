import type { ComponentType } from 'react';
import { AprobacionesVista } from './AprobacionesVista';
import type { VistaProps } from './compartido/util';
import { EjecutivaVista } from './EjecutivaVista';
import { FlowchartVista } from './FlowchartVista';
import { PlaneacionVista } from './PlaneacionVista';
import { PresupuestoVista } from './PresupuestoVista';
import { ResultadosVista } from './ResultadosVista';
import { WidgetsVista } from './WidgetsVista';

/** id de sección → vista. Agregar una sección nueva = una línea aquí + su entrada en domain/navegacion. */
export const VISTAS: Record<string, ComponentType<VistaProps>> = {
  ejecutiva: EjecutivaVista, planeacion: PlaneacionVista, flowchart: FlowchartVista, aprobaciones: AprobacionesVista,
  presupuesto: PresupuestoVista, resultados: ResultadosVista, widgets: WidgetsVista,
};
