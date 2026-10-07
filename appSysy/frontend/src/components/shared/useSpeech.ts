// Lectura por voz de las tarjetas de ayuda de MAYIA (speechSynthesis, es-MX).
// Front-only, sin backend: si el navegador no tiene voz en español, el que la
// usa debe ocultar su propio botón (hayVozEsMx) y nada se rompe.
import { useEffect, useRef, useState } from 'react';

const LS_KEY = 'havasdata:voz-activada';

function leerPreferenciaVoz(): boolean {
  try { return localStorage.getItem(LS_KEY) !== '0'; } catch { return true; }
}

export function useSpeech() {
  const [vozActivada, setVozActivadaState] = useState(leerPreferenciaVoz);
  const [hablando, setHablando] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [hayVozEsMx, setHayVozEsMx] = useState(false);
  const vozRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const cargarVoces = () => {
      const voces = window.speechSynthesis.getVoices();
      const esMx = voces.find(v => /es-mx/i.test(v.lang));
      const esAlguno = voces.find(v => /^es/i.test(v.lang));
      vozRef.current = esMx ?? esAlguno ?? null;
      setHayVozEsMx(!!(esMx ?? esAlguno));
    };
    cargarVoces();
    window.speechSynthesis.onvoiceschanged = cargarVoces;
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  const setVozActivada = (v: boolean) => {
    setVozActivadaState(v);
    try { localStorage.setItem(LS_KEY, v ? '1' : '0'); } catch { /* ventana privada: solo en memoria */ }
    if (!v && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  const hablar = (texto: string) => {
    if (!vozActivada || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto.replace(/\*\*/g, ''));
    u.lang = 'es-MX';
    // Asignar una voz inválida (quirks de algunos navegadores) no debe tirar toda la lectura — sin ella, el navegador usa su voz por default.
    if (vozRef.current) { try { u.voice = vozRef.current; } catch { /* sigue sin voz específica */ } }
    u.onstart = () => { setHablando(true); setPausado(false); };
    u.onend = () => { setHablando(false); setPausado(false); };
    u.onerror = () => { setHablando(false); setPausado(false); };
    window.speechSynthesis.speak(u);
  };

  const pausar = () => { window.speechSynthesis?.pause(); setPausado(true); };
  const reanudar = () => { window.speechSynthesis?.resume(); setPausado(false); };
  const detener = () => { window.speechSynthesis?.cancel(); setHablando(false); setPausado(false); };

  return { vozActivada, setVozActivada, hayVozEsMx, hablando, pausado, hablar, pausar, reanudar, detener };
}
