import { useState, type ReactNode } from 'react';
import { Menu, X, LayoutDashboard, ClipboardList, Workflow, CheckSquare, Wallet, BarChart3, Boxes, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import logo from '../../../assets/image.png';
import { IconButton, Panel } from '../widgets';
import './DashboardLayout.css';

const ICONOS = { inicio: LayoutDashboard, plan: ClipboardList, flow: Workflow, check: CheckSquare, dinero: Wallet, grafica: BarChart3, widgets: Boxes, PanelLeftClose, PanelLeftOpen };

export interface ItemMenu { id: string; titulo: string; icono: keyof typeof ICONOS }

interface Props {
  items: ItemMenu[];
  activo: string;
  titulo: string;
  onNavegar: (id: string) => void;
  /** Buscador de la cabecera (se oculta en pantallas chicas). */
  buscador?: ReactNode;
  /** Acciones de la derecha de la cabecera. */
  acciones?: ReactNode;
  /** Barra bajo la cabecera (p. ej. subsecciones como pestañas). */
  subnav?: ReactNode;
  /** Bloque extra al pie del sidebar. */
  pie?: ReactNode;
  children?: ReactNode;
}

/** Sidebar de color de marca + tarjeta de cabecera + área de contenido. En móvil el sidebar es un cajón. */
const KEY_COLAPSO = 'havasdata:sidebar-colapsado';

export function DashboardLayout({ items, activo, titulo, onNavegar, buscador, acciones, subnav, pie, children }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [colapsado, setColapsado] = useState(() => { try { return localStorage.getItem(KEY_COLAPSO) === '1'; } catch { return false; } });
  const alternarColapso = () => setColapsado(c => {
    try { localStorage.setItem(KEY_COLAPSO, c ? '0' : '1'); } catch { /* noop */ }
    return !c;
  });
  const ir = (id: string) => { onNavegar(id); setAbierto(false); };

  return (
    <div className={`dash ${colapsado ? 'is-collapsed' : ''}`}>
      <div className={`dash__scrim ${abierto ? 'is-open' : ''}`} onClick={() => setAbierto(false)} />
      <aside className={`dash__side ${abierto ? 'is-open' : ''}`}>
        <div className="dash__brand">
          <img src={logo} alt="Havas" />
          <button className="dash__collapse" aria-label={colapsado ? 'Expandir menú' : 'Colapsar menú'} onClick={alternarColapso}>
            {colapsado ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
          <button className="dash__close" aria-label="Cerrar menú" onClick={() => setAbierto(false)}><X size={20} /></button>
        </div>
        <nav className="dash__nav">
          {items.map(({ id, titulo: t, icono }) => {
            const Icono = ICONOS[icono];
            return (
              <button key={id} className={`dash__item ${id === activo ? 'is-active' : ''}`} onClick={() => ir(id)} title={t} aria-current={id === activo ? 'page' : undefined}>
                <Icono size={18} /><span>{t}</span>
              </button>
            );
          })}
        </nav>
        {pie && <div className="dash__foot">{pie}</div>}
      </aside>

      <div className="dash__main">
        <Panel className="dash__header">
          <IconButton label="Menú" className="dash__burger" onClick={() => setAbierto(true)}><Menu size={20} /></IconButton>
          <h1 className="dash__title">{titulo}</h1>
          {buscador && <div className="dash__buscador">{buscador}</div>}
          <div className="dash__actions">{acciones}</div>
        </Panel>
        {subnav && <div className="dash__subnav">{subnav}</div>}
        <div className="dash__content">{children}</div>
      </div>
    </div>
  );
}
