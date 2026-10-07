import React, { useEffect, useRef, useState } from 'react';

/** Número que cuenta hacia su nuevo valor en ~500ms — el "efecto cascada" se sienta mejor cuando se ve llegar. */
export const NumeroAnimado: React.FC<{ valor: number; formatear: (n: number) => string; style?: React.CSSProperties }> =
({ valor, formatear, style }) => {
  const [mostrado, setMostrado] = useState(valor);
  const previo = useRef(valor);
  const frame = useRef<number>(0);

  useEffect(() => {
    const desde = previo.current;
    const hasta = valor;
    if (desde === hasta) return;
    const inicio = performance.now();
    const duracion = 450;
    const paso = (ahora: number) => {
      const t = Math.min(1, (ahora - inicio) / duracion);
      const ease = 1 - (1 - t) * (1 - t); // ease-out
      setMostrado(desde + (hasta - desde) * ease);
      if (t < 1) frame.current = requestAnimationFrame(paso);
      else previo.current = hasta;
    };
    frame.current = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(frame.current);
  }, [valor]);

  return <span style={style}>{formatear(mostrado)}</span>;
};
