import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Send, X } from 'lucide-react';
import { responder } from '../../domain/asistente/responder';
import type { Destino } from '../../domain/navegacion/secciones';
import { BrainCanvas } from '../../ui/widgets/BrainCanvas';
import { useDictado } from '../../ui/hooks/useDictado';
import './MayiaChat.css';

interface Mensaje { rol: 'user' | 'assistant'; texto: string }
interface Props { abierto: boolean; onCerrar: () => void; secciones: Destino[]; onNavegar: (id: string) => void; acento: string; nombre?: string }

const PALABRA_ENVIO = /\b(mayia|enviar|envía|manda)\b/gi;

/** Asistente a pantalla completa: núcleo animado al centro, hilo de texto y barra de entrada. */
export function MayiaChat({ abierto, onCerrar, secciones, onNavegar, acento, nombre = 'MAYIA' }: Props) {
  const saludo = `Soy ${nombre}. Dime «ve a ${secciones[0]?.titulo ?? 'inicio'}» o pregúntame lo que necesites.`;
  const [mensajes, setMensajes] = useState<Mensaje[]>([{ rol: 'assistant', texto: saludo }]);
  const [input, setInput] = useState('');
  const finRef = useRef<HTMLDivElement>(null);

  const enviar = (texto: string) => {
    if (!texto.trim()) return;
    const r = responder(texto, secciones);
    setInput('');
    if (r.irA) { onNavegar(r.irA); onCerrar(); return; }
    setMensajes(m => [...m, { rol: 'user', texto }, { rol: 'assistant', texto: r.texto }]);
  };

  const dictado = useDictado((texto, esFinal) => {
    if (esFinal && PALABRA_ENVIO.test(texto)) {
      PALABRA_ENVIO.lastIndex = 0;
      dictado.detener();
      enviar(texto.replace(PALABRA_ENVIO, '').trim());
      return;
    }
    PALABRA_ENVIO.lastIndex = 0;
    setInput(texto);
  });

  useEffect(() => {
    if (!abierto) { dictado.detener(); return; }
    dictado.iniciar();
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', tecla);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', tecla); document.body.style.overflow = prev; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  useEffect(() => { finRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [mensajes]);

  if (!abierto) return null;
  const estado = dictado.escuchando ? 'Escuchando…' : 'En línea';

  return (
    <div className="mayia" role="dialog" aria-modal="true" aria-label={`Asistente ${nombre}`} onClick={e => { if (e.target === e.currentTarget) onCerrar(); }}>
      <button className="mayia__close" aria-label="Cerrar asistente" onClick={onCerrar}><X size={20} /></button>

      <div className="mayia__core">
        <div className={`mayia__halo ${dictado.escuchando ? 'is-on' : ''}`} style={{ background: `radial-gradient(circle, ${acento}66 0%, transparent 70%)` }} />
        <div className="mayia__brain"><BrainCanvas accent={acento} height={260} nodes={300} /></div>
        <div className="mayia__name">{nombre}</div>
        <div className="mayia__state"><span className={`mayia__dot ${dictado.escuchando ? 'is-on' : ''}`} />{estado}</div>
      </div>

      <div className="mayia__thread">
        {mensajes.map((m, i) => {
          const ultimo = i === mensajes.length - 1;
          return (
            <div key={i} className={`mayia__msg ${m.rol === 'user' ? 'is-user' : ''} ${ultimo ? 'is-last' : ''}`}>
              {m.rol === 'user' && <small>Tú</small>}
              <p>{m.texto}</p>
            </div>
          );
        })}
        <div ref={finRef} />
      </div>

      <div className="mayia__bar">
        <button
          className={`mayia__btn ${dictado.escuchando ? 'is-rec' : ''}`}
          style={dictado.escuchando ? undefined : { background: acento }}
          aria-label={dictado.escuchando ? 'Detener dictado' : 'Hablar'}
          disabled={!dictado.soportado}
          title={dictado.soportado ? undefined : 'Tu navegador no soporta voz. Usa Chrome o Edge.'}
          onClick={() => (dictado.escuchando ? dictado.detener() : dictado.iniciar())}
        >
          {dictado.escuchando ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        <input
          autoFocus value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && enviar(input)}
          placeholder={dictado.escuchando ? 'Escuchando… di «MAYIA» para enviar' : 'Escribe o habla…'}
        />
        <button className="mayia__btn mayia__send" style={input.trim() ? { background: acento } : undefined} disabled={!input.trim()} aria-label="Enviar" onClick={() => enviar(input)}>
          <Send size={19} />
        </button>
      </div>
      <p className="mayia__hint">Esc para cerrar</p>
    </div>
  );
}
