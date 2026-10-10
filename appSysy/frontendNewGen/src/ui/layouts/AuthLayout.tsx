import type { ReactNode } from 'react';
import fondo from '../../../assets/fondoLogin.jpeg';
import logo from '../../../assets/image.png';
import './AuthLayout.css';

/** Fondo a pantalla completa; el contenido va a la izquierda con el logo centrado arriba. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth" data-theme="oscuro" style={{ backgroundImage: `url(${fondo})` }}>
      <section className="auth__panel">
        <img className="auth__logo" src={logo} alt="Havas" />
        {children}
      </section>
    </main>
  );
}
