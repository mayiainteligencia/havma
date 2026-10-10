import type { Notificacion } from '../../domain/notificaciones/types';

export const NOTIFICACIONES_MOCK: Notificacion[] = [
  { id: 1, tipo: 'urgente', titulo: 'Pauta no emitida', mensaje: 'Se detectaron spots contratados que no salieron al aire. El monto es reclamable al medio.', tiempo: 'Hace 3 min', leida: false },
  { id: 2, tipo: 'alerta', titulo: 'Spike de competencia', mensaje: 'Un competidor aumentó su presencia en una plaza clave durante el drive time.', tiempo: 'Hace 22 min', leida: false },
  { id: 3, tipo: 'exito', titulo: 'Cálculo completado', mensaje: 'El análisis de Share of Voice del periodo terminó correctamente.', tiempo: 'Hace 1 hora', leida: true },
  { id: 4, tipo: 'info', titulo: 'Nueva versión pendiente', mensaje: 'Hay una versión del plan esperando aprobación.', tiempo: 'Hace 2 horas', leida: true },
];
