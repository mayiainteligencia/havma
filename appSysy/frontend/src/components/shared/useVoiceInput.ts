// Dictado por voz (Web Speech API, es-MX) para preguntarle a MAYIA o dictar un
// cambio — front-only, sin backend. Si el navegador no soporta reconocimiento
// de voz (Safari, Firefox), `hayReconocimiento` queda en false y quien lo usa
// oculta su botón de micrófono sin romper nada.
import { useEffect, useRef, useState } from 'react';

// SpeechRecognition no está en lib.dom — forma mínima propia en vez de `any`.
interface RecognitionResultLike { transcript: string }
interface RecognitionEventLike { results: RecognitionResultLike[][] }
interface SpeechRecognitionLike {
  lang: string; continuous: boolean; interimResults: boolean;
  start: () => void; abort: () => void;
  onresult: ((e: RecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export function useVoiceInput() {
  const [hayReconocimiento, setHayReconocimiento] = useState(false);
  const [escuchando, setEscuchando] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const inicializar = () => {
      const w = window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor; SpeechRecognition?: SpeechRecognitionCtor };
      const SR = w.webkitSpeechRecognition ?? w.SpeechRecognition;
      if (!SR) return;
      setHayReconocimiento(true);
      const rec = new SR();
      rec.lang = 'es-MX';
      rec.continuous = false;
      rec.interimResults = false;
      recRef.current = rec;
    };
    inicializar();
    return () => { try { recRef.current?.abort(); } catch { /* noop */ } };
  }, []);

  /** Escucha una sola frase y resuelve con su transcripción; null si falla o no hay soporte. */
  const escuchar = (): Promise<string | null> => new Promise(resolve => {
    const rec = recRef.current;
    if (!rec) { resolve(null); return; }
    setEscuchando(true);
    rec.onresult = e => { resolve(e.results[0]?.[0]?.transcript ?? null); };
    rec.onerror = () => { setEscuchando(false); resolve(null); };
    rec.onend = () => setEscuchando(false);
    try { rec.start(); } catch { setEscuchando(false); resolve(null); }
  });

  return { hayReconocimiento, escuchando, escuchar };
}
