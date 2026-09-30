import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { brandingConfig } from '../../config/branding';

const { colores, ia } = brandingConfig;

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  time: string;
};

export interface AsistenteIAChatHandle {
  sendExternal: (texto: string) => void;
  focusInput: () => void;
}

export const AsistenteIAChat = forwardRef<AsistenteIAChatHandle>((_, ref) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (texto?: string) => {
    const contenido = texto ?? input;
    if (!contenido.trim() || loading) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage: ChatMessage = { role: 'user', content: contenido, time: now };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: contenido, departamento: 'Recursos Humanos' }),
      });

      if (!response.ok) throw new Error('Error IA');
      const data = await response.json();

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.respuesta,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'No fue posible conectar con el asistente.', time: now },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Expone métodos al padre
  useImperativeHandle(ref, () => ({
    sendExternal: (texto: string) => sendMessage(texto),
    focusInput: () => inputRef.current?.focus(),
  }));

  return (
    <div
      style={{
        height: '100%',
        backgroundColor: colores.fondoPrincipal,
        display: 'flex',
        flexDirection: 'column',
        padding: 16,
      }}
    >
      {/* Header del chat */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 36, height: 36, borderRadius: '50%',
            backgroundColor: colores.primario, color: '#fff',
            fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          AI
        </div>
        <div>
          <div style={{ fontWeight: 600, color: colores.textoClaro }}>{ia.nombre}</div>
          <div style={{ fontSize: 12, color: colores.textoMedio }}>Asistente corporativo</div>
        </div>
      </div>

      {/* Mensajes */}
      <div
        style={{
          flex: 1, overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 14, paddingRight: 4,
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: 'flex', gap: 8,
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              animation: 'fadeIn 0.25s ease',
            }}
          >
            {m.role === 'assistant' && (
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                backgroundColor: colores.primario, color: '#fff',
                fontSize: 13, fontWeight: 'bold',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                AI
              </div>
            )}
            <div
              style={{
                backgroundColor: m.role === 'user' ? colores.primario : colores.fondoTerciario,
                color: m.role === 'user' ? '#fff' : colores.textoClaro,
                padding: '12px 16px',
                borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                maxWidth: '72%',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ fontSize: 14, lineHeight: 1.5 }}>{m.content}</div>
              <div style={{
                fontSize: 11,
                color: m.role === 'user' ? 'rgba(255,255,255,0.8)' : colores.textoMedio,
                marginTop: 6, textAlign: 'right',
              }}>
                {m.time}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: colores.textoMedio, fontSize: 13 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              backgroundColor: colores.primario, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
            }}>
              AI
            </div>
            <div className="typing-dots"><span /><span /><span /></div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 10, paddingTop: 12, borderTop: `1px solid ${colores.borde}` }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Escribe tu mensaje…"
          style={{
            flex: 1, padding: '12px 16px',
            borderRadius: 999,
            border: `1px solid ${colores.borde}`,
            backgroundColor: colores.fondoSecundario,
            color: colores.textoClaro,
            outline: 'none', fontSize: 14,
          }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading}
          style={{
            padding: '0 22px', borderRadius: 999, border: 'none',
            backgroundColor: colores.primario, color: '#fff',
            fontWeight: 500, cursor: 'pointer', opacity: loading ? 0.6 : 1,
          }}
        >
          Enviar
        </button>
      </div>
    </div>
  );
});

AsistenteIAChat.displayName = 'AsistenteIAChat';