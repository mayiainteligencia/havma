export interface Notificacion {
  id: number;
  tipo: 'urgente' | 'alerta' | 'exito' | 'info';
  titulo: string;
  mensaje: string;
  tiempo: string;
  leida: boolean;
}
