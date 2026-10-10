import { useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, Bell, BellOff, CheckCheck, CheckCircle, CornerDownLeft, Info, Search, X, Zap } from 'lucide-react';
import type { Notificacion } from '../../domain/notificaciones/types';
import { useClickOutside } from '../hooks/useClickOutside';
import { BrainCanvas } from './BrainCanvas';
import { IconButton } from '.';

export function SearchBox({ buscar, onElegir, placeholder = 'Buscar…' }: {
  buscar: (q: string) => { id: string; titulo: string }[]; onElegir: (id: string) => void; placeholder?: string;
}) {
  const [q, setQ] = useState('');
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const res = buscar(q);
  useClickOutside(ref, () => setAbierto(false));
  const elegir = (id: string) => { onElegir(id); setQ(''); setAbierto(false); };

  return (
    <div className="w-search" ref={ref}>
      <div className={`w-search__box ${abierto ? 'is-open' : ''}`}>
        <Search size={16} className="w-search__icon" />
        <input
          value={q} placeholder={placeholder} aria-label={placeholder}
          onChange={e => { setQ(e.target.value); setAbierto(true); }}
          onFocus={() => setAbierto(true)}
          onKeyDown={e => { if (e.key === 'Enter' && res[0]) elegir(res[0].id); if (e.key === 'Escape') setAbierto(false); }}
        />
        {q && <button type="button" className="w-search__clear" aria-label="Limpiar" onClick={() => setQ('')}><X size={15} /></button>}
      </div>
      {abierto && q.trim() && (
        <div className="w-pop w-search__res">
          {res.length === 0
            ? <p className="w-pop__empty">Sin coincidencias para "{q}"</p>
            : res.map(r => (
              <button key={r.id} className="w-pop__row" onClick={() => elegir(r.id)}>
                <Search size={14} /><span>{r.titulo}</span><CornerDownLeft size={13} />
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

const ICONO_NOTIF: Record<Notificacion['tipo'], ReactNode> = {
  urgente: <AlertTriangle size={17} />, alerta: <Zap size={17} />, exito: <CheckCircle size={17} />, info: <Info size={17} />,
};

export function NotificationsMenu({ items }: { items: Notificacion[] }) {
  const [lista, setLista] = useState(items);
  const [abierto, setAbierto] = useState(false);
  const [filtro, setFiltro] = useState<'todas' | 'nuevas'>('todas');
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setAbierto(false), abierto);
  const noLeidas = lista.filter(n => !n.leida).length;
  const visibles = filtro === 'nuevas' ? lista.filter(n => !n.leida) : lista;
  const leer = (id?: number) => setLista(l => l.map(n => (id === undefined || n.id === id) ? { ...n, leida: true } : n));
  const quitar = (id: number) => setLista(l => l.filter(n => n.id !== id));

  return (
    <div className="w-notif" ref={ref}>
      <IconButton label="Notificaciones" onClick={() => setAbierto(o => !o)}>
        <Bell size={18} />
        {noLeidas > 0 && <span className="w-notif__badge">{noLeidas}</span>}
      </IconButton>
      {abierto && (
        <div className="w-pop w-notif__panel">
          <div className="w-notif__head">
            <strong>Notificaciones</strong>
            {noLeidas > 0 && <span className="w-notif__count">{noLeidas} nuevas</span>}
            {noLeidas > 0 && <button className="w-link-btn" onClick={() => leer()}><CheckCheck size={14} /> Marcar todas</button>}
          </div>
          <div className="w-notif__tabs">
            {(['todas', 'nuevas'] as const).map(f => (
              <button key={f} className={filtro === f ? 'is-on' : ''} onClick={() => setFiltro(f)}>{f === 'todas' ? 'Todas' : 'Sin leer'}</button>
            ))}
          </div>
          <div className="w-notif__list">
            {visibles.length === 0 && (
              <div className="w-notif__empty"><BellOff size={26} /><span>{filtro === 'nuevas' ? 'Estás al día' : 'No hay notificaciones'}</span></div>
            )}
            {visibles.map(n => (
              <div key={n.id} className={`w-notif__item w-notif__item--${n.tipo} ${n.leida ? '' : 'is-new'}`} onClick={() => leer(n.id)}>
                <span className="w-notif__ico">{ICONO_NOTIF[n.tipo]}</span>
                <div className="w-notif__txt">
                  <div className="w-notif__row"><b>{n.titulo}</b>{!n.leida && <i className="w-notif__dot" />}</div>
                  <p>{n.mensaje}</p>
                  <small>{n.tiempo}</small>
                </div>
                <button className="w-notif__x" aria-label="Descartar" onClick={e => { e.stopPropagation(); quitar(n.id); }}><X size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Mini núcleo animado de la IA: abre el asistente. `acento` en hex. */
export const MayiaOrb = ({ acento, onClick }: { acento: string; onClick: () => void }) => (
  <button type="button" className="w-orb" aria-label="Abrir asistente MAYIA" title="Abrir MAYIA" onClick={onClick}>
    <div className="w-orb__canvas"><BrainCanvas accent={acento} height={60} nodes={55} /></div>
  </button>
);

export const Avatar = ({ iniciales, titulo }: { iniciales: string; titulo?: string }) => (
  <span className="w-avatar" title={titulo}>{iniciales}</span>
);

export const Chip = ({ icono, children }: { icono?: ReactNode; children: ReactNode }) => (
  <span className="w-chip">{icono}{children}</span>
);

/** Tarjeta principal de MAYIA: núcleo animado + invitación a hablar. Pulsarla abre el asistente. */
export function HeroCard({ acento, titulo, subtitulo, onClick }: { acento: string; titulo: string; subtitulo: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className="w-hero" onClick={onClick} aria-label={titulo}
      style={{ ['--hero' as string]: acento }}>
      <span className="w-hero__glow" />
      <span className="w-hero__brain"><BrainCanvas accent={acento} height={130} /></span>
      <h2 className="w-hero__title">{titulo}</h2>
      <p className="w-hero__sub">{subtitulo}</p>
    </button>
  );
}
