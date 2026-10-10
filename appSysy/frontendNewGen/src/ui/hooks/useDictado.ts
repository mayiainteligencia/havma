import { useCallback, useEffect, useRef, useState } from 'react';

type Reconocimiento = {
  continuous: boolean; interimResults: boolean; lang: string;
  start(): void; abort(): void;
  onresult: ((e: any) => void) | null; onerror: (() => void) | null; onend: (() => void) | null;
};

/** Dictado por voz (Web Speech API). Reinicia solo mientras el usuario quiera escuchar. */
export function useDictado(onTexto: (texto: string, esFinal: boolean) => void) {
  const recRef = useRef<Reconocimiento | null>(null);
  const quiere = useRef(false);
  const cb = useRef(onTexto);
  cb.current = onTexto;
  const [escuchando, setEscuchando] = useState(false);
  const w = window as any;
  const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
  const soportado = !!SR;

  const detener = useCallback(() => {
    quiere.current = false; setEscuchando(false);
    try { recRef.current?.abort(); } catch { /* noop */ }
  }, []);

  const iniciar = useCallback(() => {
    if (!SR) return false;
    detener();
    const rec: Reconocimiento = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = 'es-MX';
    rec.onresult = e => {
      let parcial = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t + ' '; else parcial += t;
      }
      cb.current(final || parcial, !!final);
    };
    rec.onerror = () => { quiere.current = false; setEscuchando(false); };
    rec.onend = () => { if (quiere.current) { try { rec.start(); } catch { /* ya iniciado */ } } else setEscuchando(false); };
    recRef.current = rec; quiere.current = true; setEscuchando(true);
    try { rec.start(); } catch { /* noop */ }
    return true;
  }, [SR, detener]);

  useEffect(() => detener, [detener]);
  return { soportado, escuchando, iniciar, detener };
}
