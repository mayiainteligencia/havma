import { Activity, BadgeDollarSign, Eye, Radio } from 'lucide-react';
import { fmtMXNCorto } from '../../domain/comun/formato';
import { BentoItem } from '../../ui/layouts/BentoGrid';
import { BarChart, BarList, DonutChart, Gauge, LineChart } from '../../ui/charts/charts';
import { Card, KpiCard } from '../../ui/widgets';
import type { VistaProps } from './compartido/util';

const MEDIOS = ['TV Abierta', 'Digital', 'OOH', 'Radio', 'Cine', 'TV Paga'];
const VALS = [48e6, 36e6, 21e6, 14e6, 9e6, 6e6];
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago'];

/** Galería de widgets: muestra cada pieza de ui/charts y ui/widgets con datos de ejemplo. */
export function WidgetsVista(_: VistaProps) {
  return (
    <>
      <BentoItem size="kpi"><KpiCard etiqueta="Inversión" valor="$134.0 M" delta="21.6%" subir icono={<BadgeDollarSign size={20} />} /></BentoItem>
      <BentoItem size="kpi"><KpiCard etiqueta="Alcance" valor="68.4%" delta="3.1%" subir icono={<Eye size={20} />} /></BentoItem>
      <BentoItem size="kpi"><KpiCard etiqueta="Frecuencia" valor="4.2" delta="0.6%" icono={<Activity size={20} />} /></BentoItem>
      <BentoItem size="kpi"><KpiCard etiqueta="Canales activos" valor="12" icono={<Radio size={20} />} /></BentoItem>
      <BentoItem size="lg"><Card titulo="Barras (resalta el mayor)"><BarChart data={MEDIOS.map((m, i) => ({ label: m, valores: [VALS[i]] }))} formato={fmtMXNCorto} /></Card></BentoItem>
      <BentoItem size="lg"><Card titulo="Barras agrupadas"><BarChart series={['Planeado', 'Real']} data={MEDIOS.slice(0, 5).map((m, i) => ({ label: m, valores: [VALS[i], VALS[i] * (0.8 + i * 0.07)] }))} formato={fmtMXNCorto} /></Card></BentoItem>
      <BentoItem size="lg"><Card titulo="Línea y área"><LineChart labels={MESES} series={[{ nombre: 'Ingresos', valores: [12, 18, 15, 22, 30, 26, 34, 40] }, { nombre: 'Gasto', valores: [8, 11, 14, 13, 18, 20, 22, 25] }]} /></Card></BentoItem>
      <BentoItem size="lg"><Card titulo="Dona"><DonutChart datos={MEDIOS.map((m, i) => ({ nombre: m, valor: VALS[i] }))} formato={fmtMXNCorto} /></Card></BentoItem>
      <BentoItem size="wide"><Card titulo="Lista de barras"><BarList items={MEDIOS.map((m, i) => ({ label: m, valor: VALS[i] }))} formato={fmtMXNCorto} /></Card></BentoItem>
      <BentoItem size="sm"><Card titulo="Medidor"><Gauge valor={75} etiqueta="Alcance" /></Card></BentoItem>
      <BentoItem size="sm"><Card titulo="Medidor"><Gauge valor={32} max={50} etiqueta="Frecuencia" formato={v => v.toFixed(0)} /></Card></BentoItem>
    </>
  );
}
