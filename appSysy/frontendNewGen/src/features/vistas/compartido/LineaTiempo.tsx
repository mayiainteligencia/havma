import { fmtMXNCorto } from '../../../domain/comun/formato';
import { INICIALES_POR_ROL, type Version } from '../../../domain/planeacion/types';
import { Etiqueta } from '../../../ui/widgets';
import { signo } from './util';

const iniciales = (autor: string, rol?: Version['rol']) =>
  rol ? INICIALES_POR_ROL[rol] : (autor.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || 'NA');

/** Quién cambió qué y cuándo: la trazabilidad de versiones. */
export function LineaTiempo({ versiones }: { versiones: Version[] }) {
  const orden = [...versiones].sort((a, b) => (b.fecha + (b.hora ?? '')).localeCompare(a.fecha + (a.hora ?? '')));
  if (!orden.length) return <p className="insights"><span>Sin versiones todavía.</span></p>;
  return (
    <ol className="timeline">
      {orden.map(v => {
        const d = v.delta_inversion ?? 0;
        return (
          <li key={v.id}>
            <span className="timeline__av">{iniciales(v.autor, v.rol)}</span>
            <div>
              <div className="timeline__top"><b>{v.autor}</b><small>{v.fecha}{v.hora ? ` · ${v.hora}` : ''}</small><Etiqueta tono={v.estado === 'aprobada' ? 'ok' : v.estado === 'rechazada' ? 'alerta' : 'pend'}>{v.estado}</Etiqueta></div>
              <p><strong>{v.etiqueta}</strong> — {v.motivo}</p>
              {v.delta_inversion !== undefined && <span className="timeline__delta">{d >= 0 ? '▲' : '▼'} {signo(d)}{fmtMXNCorto(Math.abs(d))}</span>}
              {v.comentarioResolucion && <p className="timeline__note">"{v.comentarioResolucion}"</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
