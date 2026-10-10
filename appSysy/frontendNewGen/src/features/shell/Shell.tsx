import { useEffect, useState } from 'react';
import { CalendarDays, LogOut, Moon, Sun } from 'lucide-react';
import { NOMBRE_ROL, type Sesion } from '../../domain/auth/types';
import { buscarDestino, destinosDe, SECCIONES_POR_ROL } from '../../domain/navegacion/secciones';
import { NOTIFICACIONES_MOCK } from '../../infrastructure/notificaciones/notificacionesMock';
import { setRol } from '../../infrastructure/planeacion/store';
import { MayiaChat } from '../asistente/MayiaChat';
import { VISTAS } from '../vistas/registro';
import { BentoGrid, BentoItem } from '../../ui/layouts/BentoGrid';
import { DashboardLayout } from '../../ui/layouts/DashboardLayout';
import { branding } from '../../ui/theme/branding';
import { useTema } from '../../ui/theme/useTema';
import { Avatar, Chip, HeroCard, IconButton, MayiaOrb, NotificationsMenu, SearchBox, Tabs, ToastProvider } from '../../ui/widgets';

interface Props { sesion: Sesion; onSalir: () => void }

const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

/** Contenedor por rol: cabecera, sidebar, pestañas de subsección y la rejilla bento (HeroCard siempre primero). */
export function Shell({ sesion, onSalir }: Props) {
  const { tema, alternar } = useTema();
  const secciones = SECCIONES_POR_ROL[sesion.rol];
  const destinos = destinosDe(secciones);
  const [seccionId, setSeccionId] = useState(secciones[0].id);
  const [subId, setSubId] = useState(secciones[0].subsecciones[0]?.id ?? '');
  const [mayiaAbierta, setMayiaAbierta] = useState(false);
  const seccion = secciones.find(s => s.id === seccionId) ?? secciones[0];
  const Vista = VISTAS[seccion.id];

  useEffect(() => { setRol(sesion.rol); }, [sesion.rol]);

  /** 'flowchart' o 'flowchart:por-medio'. */
  const navegar = (destino: string) => {
    const [s, sub] = destino.split(':');
    const sec = secciones.find(x => x.id === s);
    if (!sec) return;
    setSeccionId(sec.id);
    setSubId(sub ?? sec.subsecciones[0]?.id ?? '');
  };

  // El canvas no lee variables CSS: oscuro = blanco, claro = guinda de marca.
  const acento = tema === 'oscuro' ? '#FFFFFF' : getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || branding.marca.rojo;

  return (
    <ToastProvider>
      <DashboardLayout
        items={secciones}
        activo={seccion.id}
        titulo={seccion.titulo}
        onNavegar={navegar}
        buscador={<SearchBox placeholder="Buscar sección…" buscar={q => buscarDestino(destinos, q)} onElegir={navegar} />}
        subnav={seccion.subsecciones.length > 0 && <Tabs items={seccion.subsecciones} activo={subId} onChange={setSubId} />}
        acciones={<>
          <span className="dash__ocultar-movil"><Chip icono={<CalendarDays size={14} />}>{fecha}</Chip></span>
          <MayiaOrb acento={acento} onClick={() => setMayiaAbierta(true)} />
          <IconButton label={tema === 'claro' ? 'Modo oscuro' : 'Modo claro'} onClick={alternar}>
            {tema === 'claro' ? <Moon size={18} /> : <Sun size={18} />}
          </IconButton>
          <NotificationsMenu items={NOTIFICACIONES_MOCK} />
          <span className="dash__ocultar-movil">
            <Avatar iniciales={sesion.usuario.slice(0, 2)} titulo={`${sesion.usuario} · ${NOMBRE_ROL[sesion.rol]}`} />
          </span>
          <IconButton label="Salir" onClick={onSalir}><LogOut size={18} /></IconButton>
        </>}
      >
        <BentoGrid>
          <BentoItem size="md">
            <HeroCard
              acento={acento}
              titulo="MAYIA · tu asesor de campaña"
              subtitulo={<>Pulsa y pregunta por voz · di <strong>«MAYIA»</strong> para enviar</>}
              onClick={() => setMayiaAbierta(true)}
            />
          </BentoItem>
          {Vista && <Vista key={`${seccion.id}:${subId}`} subId={subId} rol={sesion.rol} onNavegar={navegar} />}
        </BentoGrid>
      </DashboardLayout>
      <MayiaChat
        abierto={mayiaAbierta}
        onCerrar={() => setMayiaAbierta(false)}
        secciones={destinos}
        onNavegar={navegar}
        acento={branding.marca.rojoHover}
      />
    </ToastProvider>
  );
}
