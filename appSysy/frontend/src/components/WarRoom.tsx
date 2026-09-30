import React, { useState, useEffect } from 'react';
import { brandingConfig } from '../config/branding';
import { WelcomeHeader } from './modules/dashboardModules/WelcomeHeader';
import { HeroCard } from './modules/dashboardModules/Herocard';
import { ProductivityChart } from './modules/dashboardModules/Productivitychart';
import { ResumenMediosCards } from './modules/dashboardModules/ResumenMediosCards';
import { MapaMexicoDashboard } from './modules/dashboardModules/MapaMexicoDashboard';
import { RadiosEscuchadasCard } from './modules/dashboardModules/RadiosEscuchadasCard';
import { PalabrasBuscadasCard } from './modules/dashboardModules/PalabrasBuscadasCard';
import { CSVGeneradosCard } from './modules/dashboardModules/CSVGeneradosCard';
import { CarteraClientes } from './modules/dashboardModules/CarteraClientes';

interface WarRoomProps {
  onSectionChange?: (section: string) => void;
}

export const WarRoom: React.FC<WarRoomProps> = ({ onSectionChange }) => {
  const { colores } = brandingConfig;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: colores.fondoPrincipal, padding: isMobile ? '16px' : '32px' }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        {/* ── Fila 1: bienvenida + MAYIA a su derecha ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.55fr 1fr',
          gap: isMobile ? 16 : 24,
          marginBottom: isMobile ? 16 : 24,
          alignItems: 'stretch',
        }}>
          <WelcomeHeader isMobile={isMobile} />
          <div style={{ height: isMobile ? 300 : 'auto', minHeight: isMobile ? 0 : 260 }}>
            <HeroCard onNavigate={onSectionChange} />
          </div>
        </div>

        {/* ── Fila 2: cartera de cuentas ── */}
        <div style={{ marginBottom: isMobile ? 16 : 24 }}>
          <CarteraClientes />
        </div>

        {/* ── Fila 3: [resumen] | [Mapa + Radios/Palabras/CSV] ── */}
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
            <ResumenMediosCards onSectionChange={onSectionChange} />
            <MapaMexicoDashboard />
            <RadiosEscuchadasCard />
            <PalabrasBuscadasCard />
            <CSVGeneradosCard />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '0.62fr 1.38fr', gap: 24, marginBottom: 24, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <ResumenMediosCards onSectionChange={onSectionChange} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ height: 620 }}>
                <MapaMexicoDashboard />
              </div>
              <RadiosEscuchadasCard />
              <PalabrasBuscadasCard />
              <CSVGeneradosCard />
            </div>
          </div>
        )}

        {/* ── Fila 4: ProductivityChart full width ── */}
        <div style={{ marginBottom: 24 }}>
          <ProductivityChart />
        </div>

        <style>{`
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            -webkit-font-smoothing: antialiased;
          }
          ::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-track { background: ${colores.fondoSecundario}40; border-radius: 4px; }
          ::-webkit-scrollbar-thumb { background: ${colores.primario}60; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: ${colores.primario}80; }
        `}</style>
      </div>
    </div>
  );
};