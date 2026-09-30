import { useEffect, useState } from 'react';
import { ResponsiveLayout } from './components/ResponsiveLayout';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { InicioResumen } from './components/InicioResumen';
import { VistaRouter } from './components/vistas/VistaRouter';
import { ToastProvider } from './components/shared/toast';
import { ConfirmProvider } from './components/shared/confirm';
import { brandingConfig } from './config/branding';
import { esVista, vistas, vistaActiva } from './config/menu';
import { VISTAS_POR_ROL } from './data/types';
import { useOverrides } from './data/store';

import './responsive.css';

function App() {
  const overrides = useOverrides();
  const rol = overrides.rol;
  const vistasVisibles = vistas.filter(v => VISTAS_POR_ROL[rol].includes(v.id));

  const [activeVista, setActiveVista] = useState(vistasVisibles[0]?.id ?? vistas[0].id);
  const [activeSub, setActiveSub] = useState(vistaActiva(activeVista).subsecciones[0]?.id ?? '');
  const { colores } = brandingConfig;

  // Si el rol cambia y la vista activa deja de estar permitida, se cae a la
  // primera vista que ese rol sí ve — nunca se queda en una pantalla vacía.
  useEffect(() => {
    if (!vistasVisibles.some(v => v.id === activeVista)) {
      const primera = vistasVisibles[0];
      if (primera) {
        setActiveVista(primera.id);
        setActiveSub(primera.subsecciones[0]?.id ?? '');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rol]);

  // Único punto de navegación de la plataforma. Acepta 'planeacion' (vista) o
  // 'planeacion:mix-medios' (vista + subsección) — el mismo formato que arma
  // el buscador del Header y el asistente MAYIA en sus respuestas.
  const navigate = (target: string) => {
    const [vistaId, subId] = target.split(':');
    if (!esVista(vistaId)) return;
    const vista = vistaActiva(vistaId);
    setActiveVista(vistaId);
    setActiveSub(subId && vista.subsecciones.some(s => s.id === subId) ? subId : (vista.subsecciones[0]?.id ?? ''));
  };

  // El resumen de Inicio solo se ve en la pantalla de arranque de cada vista
  // (su primera subsección); al entrar a las demás, esa vista ya solo
  // muestra lo suyo.
  const enPantallaInicial = vistaActiva(activeVista).subsecciones[0]?.id === activeSub;

  return (
    <ToastProvider>
     <ConfirmProvider>
      <ResponsiveLayout
        vistasVisibles={vistasVisibles}
        activeVista={activeVista}
        onVistaChange={navigate}
        activeSub={activeSub}
        onSubChange={setActiveSub}
        header={<Header activeVista={activeVista} onNavigate={navigate} vistasVisibles={vistasVisibles} rol={rol} />}
        sidebar={
          <Sidebar
            activeVista={activeVista}
            activeSub={activeSub}
            onSubChange={setActiveSub}
          />
        }
      >
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: colores.fondoPrincipal }}>
          {enPantallaInicial && <InicioResumen key={activeVista} activeVista={activeVista} onNavigate={navigate} />}
          <VistaRouter vistaId={activeVista} subId={activeSub} onNavigate={navigate} />
        </div>
      </ResponsiveLayout>
     </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;
