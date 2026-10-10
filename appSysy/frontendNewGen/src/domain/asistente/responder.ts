import { norm } from '../comun/texto';
import type { Destino } from '../navegacion/secciones';

export interface Respuesta { texto: string; irA?: string }

const VERBOS_NAV = ['ve al', 've a', 'ir al', 'ir a', 'entra', 'llevame', 'vamos a', 'muestrame', 'muestra', 'abre', 'abrir'];

// ponytail: asistente mock — solo navega y orienta. Respuestas con datos reales llegan con el backend.
export function responder(texto: string, secciones: Destino[]): Respuesta {
  const t = norm(texto);
  const mencionada = secciones.find(s => [s.titulo, ...s.alias].some(a => t.includes(norm(a))));
  if (mencionada && VERBOS_NAV.some(v => t.includes(v))) {
    return { texto: `Abriendo ${mencionada.titulo}.`, irA: mencionada.id };
  }
  const lista = secciones.filter(s => !s.id.includes(':')).map(s => s.titulo).join(', ');
  return { texto: `Puedo llevarte a: ${lista}. Di, por ejemplo, «ve a ${secciones[0]?.titulo ?? 'inicio'}».` };
}
