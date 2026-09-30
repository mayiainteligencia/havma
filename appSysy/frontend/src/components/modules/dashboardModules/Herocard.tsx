
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Mic, MicOff } from 'lucide-react';
import { brandingConfig } from '../../../config/branding';
import { BrainCanvas } from './BrainCanvas';
import { responder } from '../../../data/asistente';

// Tema opcional (color de acento). Definido local para no depender de un export
// específico de branding: así HeroCard es genérico y copiable entre ramas.
type TemaBesco = { acento: string; acentoOscuro: string; sobreAcento: string };

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  time: string;
};

interface HeroCardProps {
  tema?: TemaBesco;
  onNavigate?: (id: string) => void;
  /** Título y pie del estado inactivo — cambian según la vista activa. */
  titulo?: string;
  subtitulo?: React.ReactNode;
  /** Primer mensaje del chat al abrirlo — cambia según la vista activa. */
  saludo?: string;
}

export const HeroCard: React.FC<HeroCardProps> = ({ tema, onNavigate, titulo, subtitulo, saludo }) => {
  const { colores, ia } = brandingConfig;
  const acc = tema ? tema.acento : '#374151';
  const accDark = tema ? tema.acentoOscuro : '#1F2937';
  const [isHovered, setIsHovered] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: saludo ?? `Soy ${ia.nombre}. Pregúntame "¿cómo vamos en plazas?", "¿cuánto invertimos?", "¿qué dicen de la marca?" o dime "ve a Alertas".`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);
  // Refs para que el reconocimiento (creado una sola vez) siempre lea lo último
  const listeningRef = useRef(false);
  const onNavigateRef = useRef(onNavigate);
  const openRef = useRef<() => void>(() => {});
  useEffect(() => { listeningRef.current = isListening; }, [isListening]);
  useEffect(() => { onNavigateRef.current = onNavigate; }, [onNavigate]);
  // Permite abrir el asistente desde fuera (mini-jarvis del header).
  useEffect(() => {
    const h = () => openRef.current();
    window.addEventListener('jarvis:open', h);
    return () => window.removeEventListener('jarvis:open', h);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Inicializar Web Speech API
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPart + ' ';
          } else {
            interimTranscript += transcriptPart;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        console.log('[voz] transcripción:', currentText, finalTranscript ? '(final)' : '(parcial)');

        // Navegación por voz (front-only): "ve a <sección>" → navega, sin backend
        if (finalTranscript) {
          const r = responder(currentText);
          if (r.navigateTo && onNavigateRef.current) {
            listeningRef.current = false;
            setIsListening(false);
            try { recognitionRef.current?.abort(); } catch { /* nada */ }
            onNavigateRef.current(r.navigateTo);
            handleCloseModal();
            return;
          }
        }

        // Detectar palabras clave para enviar
        const textLower = currentText.toLowerCase().trim();
        const hasKeyword = textLower.includes('mayia') || 
                          textLower.includes('enviar') || 
                          textLower.includes('envía') ||
                          textLower.includes('manda');
        
        if (hasKeyword && finalTranscript) {
          // Remover la palabra clave del mensaje
          let cleanedText = currentText
            .replace(/\bmayia\b/gi, '')
            .replace(/\benviar\b/gi, '')
            .replace(/\benvía\b/gi, '')
            .replace(/\bmanda\b/gi, '')
            .trim();
          
          setInput(cleanedText);
          
          // Detener el reconocimiento y enviar
          setIsListening(false);
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
          
          // Enviar el mensaje después de un pequeño delay
          setTimeout(() => {
            if (cleanedText.trim()) {
              // Simular el envío
              const messageToSend = cleanedText;
              sendMessageWithText(messageToSend);
            }
          }, 300);
        } else {
          setInput(currentText);
        }
      };

      recognitionRef.current.onstart = () => console.log('[voz] iniciado, escuchando…');
      recognitionRef.current.onaudiostart = () => console.log('[voz] micrófono capturando audio');
      recognitionRef.current.onsoundstart = () => console.log('[voz] hay sonido');
      recognitionRef.current.onspeechstart = () => console.log('[voz] detectó voz');
      recognitionRef.current.onspeechend = () => console.log('[voz] fin de voz');
      recognitionRef.current.onnomatch = () => console.log('[voz] no coincidió');
      recognitionRef.current.onerror = (event: any) => {
        console.error('[voz] error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        console.log('[voz] terminó; reiniciar?', listeningRef.current);
        if (listeningRef.current) {
          try { recognitionRef.current.start(); } catch { /* ya iniciado */ }
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleMicClick = () => {
    setShowModal(true);
    if (!recognitionRef.current) {
      alert('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.');
      return;
    }
    setInput('');
    listeningRef.current = true;   // sincrónico: evita que onend reinicie fuera de tiempo
    setIsListening(true);
    // abort() resetea cualquier sesión previa colgada antes de arrancar de nuevo
    try { recognitionRef.current.abort(); } catch { /* nada */ }
    // SpeechRecognition pide su propio permiso de micrófono; no llamamos getUserMedia aparte
    setTimeout(() => {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('[voz] error al iniciar:', error);
      }
    }, 300);
  };
  openRef.current = handleMicClick;

  const toggleListening = async () => {
    if (isListening) {
      setIsListening(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (input.trim()) {
        setTimeout(() => sendMessage(), 500);
      }
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        setIsListening(true);
        setInput('');
        
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.error('Error al iniciar:', error);
            // Si ya está iniciado, reiniciar
            recognitionRef.current.stop();
            setTimeout(() => {
              recognitionRef.current.start();
            }, 100);
          }
        }
      } catch (error) {
        console.error('Error de permisos:', error);
        alert('Por favor permite el acceso al micrófono');
      }
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    await sendMessageWithText(input);
  };

  const sendMessageWithText = async (messageText: string) => {
    if (!messageText.trim() || loading) return;

    const now = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMessage: ChatMessage = {
      role: 'user',
      content: messageText,
      time: now,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Respuesta local (front-only, sin backend): navega o contesta con los datos.
    const r = responder(messageText);
    if (r.navigateTo && onNavigate) {
      onNavigate(r.navigateTo);
      handleCloseModal();
      return;
    }
    setMessages((prev) => [...prev, { role: 'assistant', content: r.text, time: now }]);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    listeningRef.current = false;   // sincrónico: corta el auto-reinicio de onend
    setIsListening(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* nada */ }
    }
  };

  // Con el asistente abierto: Escape cierra y el fondo no hace scroll.
  useEffect(() => {
    if (!showModal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCloseModal(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [showModal]);

  const estado = isListening ? 'Escuchando…' : loading ? 'Pensando…' : 'En línea';

  return (
    <>
      <div
        className="group relative transition-all duration-500"
        onClick={handleMicClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          background: `linear-gradient(135deg, ${acc}20 0%, ${accDark}20 100%)`,
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '14px',
          border: `2px solid ${acc}40`,
          position: 'relative',
          overflow: 'hidden',
          height: '100%',
          minHeight: '0',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Resplandor de fondo */}

        
        <div 
          style={{ 
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          <div 
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '700px',
              height: '700px',
              opacity: isHovered ? 0.7 : 0,
              transition: 'opacity 700ms ease-in-out',
              filter: 'blur(100px)',
              background: acc,
              borderRadius: '50%',
            }}
          />
        </div>

        {/* Animated gradient blobs */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '400px',
            height: '400px',
            background: `radial-gradient(circle, ${acc}40 0%, transparent 70%)`,
            filter: 'blur(60px)',
            animation: 'float 6s ease-in-out infinite',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-20%',
            left: '-10%',
            width: '350px',
            height: '350px',
            background: `radial-gradient(circle, ${accDark}40 0%, transparent 70%)`,
            filter: 'blur(60px)',
            animation: 'float 8s ease-in-out infinite reverse',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* Contenido principal con z-index más alto */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Núcleo IA 3D animado */}
          <div style={{ width: '150px', marginBottom: '4px' }}>
            <BrainCanvas accent={acc} height={130} />
          </div>

          {/* Title */}
          <h2
            style={{
              fontSize: '16px',
              fontWeight: '700',
              color: acc,
              marginBottom: '4px',
              letterSpacing: '-0.3px',
            }}
          >
            {titulo ?? `${ia.nombre} · tu asesor de campaña`}
          </h2>

          {/* Instrucción condensada */}
          <p
            style={{
              fontSize: '11px',
              color: colores.textoMedio,
              margin: '0 0 6px 0',
              maxWidth: '260px',
              lineHeight: 1.4,
            }}
          >
            {subtitulo ?? (
              <>Pulsa y pregunta por voz · di <strong style={{ color: acc, fontStyle: 'normal' }}>"MAYIA"</strong> para enviar</>
            )}
          </p>
        </div>

        <style>
          {`
            @keyframes float {
              0%, 100% { transform: translate(0, 0) rotate(0deg); }
              33% { transform: translate(30px, -20px) rotate(5deg); }
              66% { transform: translate(-20px, 20px) rotate(-5deg); }
            }
          `}
        </style>
      </div>

      {/* ── Superficie del asistente: núcleo al centro, fondo desenfocado ── */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Asistente ${ia.nombre}`}
          onClick={e => { if (e.target === e.currentTarget) handleCloseModal(); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(10,10,10,0.55)',
            backdropFilter: 'blur(22px) saturate(120%)',
            WebkitBackdropFilter: 'blur(22px) saturate(120%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '24px 20px 28px',
            animation: 'mayia-in .35s ease both',
          }}
        >
          {/* Cerrar */}
          <button
            onClick={handleCloseModal}
            aria-label="Cerrar asistente"
            style={{
              position: 'absolute', top: 22, right: 24, width: 42, height: 42, borderRadius: '50%',
              background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)',
              color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(6px)',
            }}
          >
            <X size={20} color="#fff" />
          </button>

          {/* Núcleo girando */}
          <div style={{
            position: 'relative', marginTop: 'auto',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            {/* Halo: late cuando escucha */}
            <div
              className={isListening ? 'mayia-halo mayia-halo-on' : 'mayia-halo'}
              style={{ background: `radial-gradient(circle, ${acc}66 0%, transparent 70%)` }}
            />
            <div style={{ width: 260, height: 260, position: 'relative', zIndex: 1 }}>
              <BrainCanvas accent={acc} height={260} nodes={300} />
            </div>

            <div style={{ textAlign: 'center', marginTop: 4, zIndex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>{ia.nombre}</div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 6,
                fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.72)',
              }}>
                <span
                  className={isListening ? 'mayia-dot mayia-dot-on' : 'mayia-dot'}
                  style={{ background: isListening ? colores.peligro : colores.exito }}
                />
                {estado}
              </div>
            </div>
          </div>

          {/* Conversación: texto flotante, sin burbujas ni tarjeta */}
          <div
            className="mayia-hilo"
            style={{
              width: '100%', maxWidth: 680, marginTop: 26, marginBottom: 'auto',
              maxHeight: '34vh', overflowY: 'auto',
              display: 'flex', flexDirection: 'column', gap: 16,
              padding: '4px 6px', zIndex: 1,
            }}
          >
            {messages.map((m, i) => {
              const esUltimo = i === messages.length - 1;
              const mio = m.role === 'user';
              return (
                <div key={i} style={{ textAlign: 'center', animation: 'mayia-msg .4s ease both' }}>
                  {mio && (
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 5 }}>
                      Tú
                    </div>
                  )}
                  <p style={{
                    margin: 0,
                    fontSize: mio ? 15 : esUltimo ? 20 : 16,
                    lineHeight: 1.55,
                    fontWeight: mio ? 500 : esUltimo ? 600 : 500,
                    color: mio ? 'rgba(255,255,255,0.62)' : esUltimo ? '#fff' : 'rgba(255,255,255,0.55)',
                    fontStyle: mio ? 'italic' : 'normal',
                    transition: 'font-size .3s ease, color .3s ease',
                  }}>
                    {m.content}
                  </p>
                </div>
              );
            })}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 7 }}>
                <span className="mayia-typing" />
                <span className="mayia-typing" style={{ animationDelay: '.2s' }} />
                <span className="mayia-typing" style={{ animationDelay: '.4s' }} />
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Barra de entrada flotante */}
          <div style={{
            width: '100%', maxWidth: 680, display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 999, padding: 8, backdropFilter: 'blur(10px)', zIndex: 1,
          }}>
            <button
              onClick={toggleListening}
              aria-label={isListening ? 'Detener dictado' : 'Hablar'}
              className={isListening ? 'mayia-mic mayia-mic-on' : 'mayia-mic'}
              style={{
                width: 46, height: 46, borderRadius: '50%', border: 'none', flexShrink: 0,
                background: isListening ? colores.peligro : acc,
                color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={isListening ? 'Escuchando… di "MAYIA" para enviar' : 'Escribe o habla…'}
              disabled={loading}
              autoFocus
              style={{
                flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
                color: '#fff', fontSize: 15, padding: '0 6px',
              }}
            />

            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              aria-label="Enviar"
              style={{
                width: 46, height: 46, borderRadius: '50%', border: 'none', flexShrink: 0,
                background: loading || !input.trim() ? 'rgba(255,255,255,0.12)' : acc,
                color: loading || !input.trim() ? 'rgba(255,255,255,0.35)' : '#fff',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s',
              }}
            >
              <Send size={19} />
            </button>
          </div>

          <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.42)', margin: '12px 0 0', zIndex: 1 }}>
            Esc para cerrar
          </p>

          <style>{`
            @keyframes mayia-in { from { opacity: 0; } to { opacity: 1; } }
            @keyframes mayia-msg { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
            @keyframes mayia-breathe { 0%,100% { transform: translate(-50%,-50%) scale(1); opacity: .5; } 50% { transform: translate(-50%,-50%) scale(1.18); opacity: .85; } }
            @keyframes mayia-ping { 0% { box-shadow: 0 0 0 0 ${colores.peligro}66; } 70% { box-shadow: 0 0 0 18px ${colores.peligro}00; } 100% { box-shadow: 0 0 0 0 ${colores.peligro}00; } }
            @keyframes mayia-blink { 0%,100% { opacity: 1; } 50% { opacity: .25; } }
            @keyframes mayia-type { 0%,60%,100% { transform: translateY(0); opacity: .5; } 30% { transform: translateY(-7px); opacity: 1; } }

            .mayia-halo {
              position: absolute; left: 50%; top: 45%;
              width: 460px; height: 460px; border-radius: 50%;
              transform: translate(-50%,-50%);
              filter: blur(40px); opacity: .5; pointer-events: none; z-index: 0;
              animation: mayia-breathe 6s ease-in-out infinite;
            }
            .mayia-halo-on { animation-duration: 2.2s; }

            .mayia-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
            .mayia-dot-on { animation: mayia-blink 1s ease-in-out infinite; }

            .mayia-mic-on { animation: mayia-ping 1.5s infinite; }

            .mayia-typing {
              width: 8px; height: 8px; border-radius: 50%;
              background: rgba(255,255,255,.8); display: inline-block;
              animation: mayia-type 1.4s infinite;
            }

            .mayia-hilo { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.25) transparent; }
            .mayia-hilo::-webkit-scrollbar { width: 5px; }
            .mayia-hilo::-webkit-scrollbar-thumb { background: rgba(255,255,255,.25); border-radius: 999px; }

            .mayia-hilo input::placeholder { color: rgba(255,255,255,.45); }

            @media (max-width: 640px) {
              .mayia-halo { width: 300px; height: 300px; }
            }
            @media (prefers-reduced-motion: reduce) {
              .mayia-halo, .mayia-dot-on, .mayia-mic-on, .mayia-typing { animation: none !important; }
            }
          `}</style>
        </div>
      )}

    </>
  );
};
