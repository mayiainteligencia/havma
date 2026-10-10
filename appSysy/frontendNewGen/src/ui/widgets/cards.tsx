import { createContext, useCallback, useContext, useState, type ButtonHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle, Info, X } from 'lucide-react';
import './cards.css';

/** Tarjeta de dashboard: título en mayúsculas, acciones a la derecha y cuerpo que hace scroll dentro de la celda bento. */
export function Card({ titulo, derecha, children, flush }: { titulo?: string; derecha?: ReactNode; children?: ReactNode; flush?: boolean }) {
  return (
    <section className="card">
      {(titulo || derecha) && (
        <header className="card__head">
          <h3 className="card__title">{titulo}</h3>
          {derecha && <div className="card__right">{derecha}</div>}
        </header>
      )}
      <div className={`card__body ${flush ? 'is-flush' : ''}`}>{children}</div>
    </section>
  );
}

export function KpiCard({ etiqueta, valor, delta, subir, sub, icono }: { etiqueta: string; valor: string; delta?: string; subir?: boolean; sub?: string; icono?: ReactNode }) {
  return (
    <section className="kpi">
      <div className="kpi__main">
        <span className="kpi__lbl">{etiqueta}</span>
        <strong className="kpi__val">{valor}</strong>
        <span className="kpi__sub">
          {delta && <span className={`kpi__delta ${subir ? 'is-up' : ''}`}>{subir ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{delta}</span>}
          {sub}
        </span>
      </div>
      {icono && <span className="kpi__icon">{icono}</span>}
    </section>
  );
}

export function Tabs({ items, activo, onChange }: { items: { id: string; titulo: string }[]; activo: string; onChange: (id: string) => void }) {
  return (
    <nav className="tabs" aria-label="Subsecciones">
      {items.map(i => (
        <button key={i.id} className={`tabs__item ${i.id === activo ? 'is-active' : ''}`} aria-current={i.id === activo ? 'page' : undefined} onClick={() => onChange(i.id)}>{i.titulo}</button>
      ))}
    </nav>
  );
}

export interface Columna<T> { titulo: string; render: (fila: T) => ReactNode; derecha?: boolean }

export function DataTable<T>({ columnas, filas, keyOf, vacio = 'Sin datos.' }: { columnas: Columna<T>[]; filas: T[]; keyOf: (f: T) => string; vacio?: string }) {
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead><tr>{columnas.map((c, i) => <th key={i} className={c.derecha ? 'r' : ''}>{c.titulo}</th>)}</tr></thead>
        <tbody>
          {filas.map(f => <tr key={keyOf(f)}>{columnas.map((c, i) => <td key={i} className={c.derecha ? 'r' : ''}>{c.render(f)}</td>)}</tr>)}
          {filas.length === 0 && <tr><td colSpan={columnas.length} className="tbl__empty">{vacio}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={`sel ${p.className ?? ''}`} />;

export const Etiqueta = ({ children, tono }: { children: ReactNode; tono?: 'real' | 'importado' | 'simulado' | 'ok' | 'alerta' | 'pend' }) => (
  <span className={`tag tag--${tono ?? 'simulado'}`}>{children}</span>
);

export const Aviso = ({ children, tipo = 'info' }: { children: ReactNode; tipo?: 'info' | 'alerta' | 'ok' }) => (
  <div className={`aviso aviso--${tipo}`}>{tipo === 'alerta' ? <AlertTriangle size={16} /> : tipo === 'ok' ? <CheckCircle size={16} /> : <Info size={16} />}<span>{children}</span></div>
);

export const Boton = ({ variante = 'solido', ...rest }: { variante?: 'solido' | 'borde' | 'peligro' } & ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button type="button" {...rest} className={`btn btn--${variante} ${rest.className ?? ''}`} />
);

export function Modal({ titulo, onCerrar, children }: { titulo: string; onCerrar: () => void; children: ReactNode }) {
  return (
    <div className="modal" onClick={onCerrar}>
      <div className="modal__box" role="dialog" aria-modal="true" aria-label={titulo} onClick={e => e.stopPropagation()}>
        <header><h3>{titulo}</h3><button aria-label="Cerrar" onClick={onCerrar}><X size={18} /></button></header>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}

// ── Toasts ──
interface ToastMsg { id: number; titulo: string; msg?: string }
const ToastCtx = createContext<(t: Omit<ToastMsg, 'id'>) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [lista, setLista] = useState<ToastMsg[]>([]);
  const push = useCallback((t: Omit<ToastMsg, 'id'>) => {
    const id = Date.now() + Math.random();
    setLista(l => [...l, { ...t, id }]);
    setTimeout(() => setLista(l => l.filter(x => x.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">{lista.map(t => <div key={t.id} className="toast"><b>{t.titulo}</b>{t.msg && <span>{t.msg}</span>}</div>)}</div>
    </ToastCtx.Provider>
  );
}
