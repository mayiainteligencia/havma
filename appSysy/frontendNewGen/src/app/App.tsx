import { useState } from 'react';
import { crearCasosDeUsoAuth } from '../application/auth/casosDeUso';
import { authLocal } from '../infrastructure/auth/authLocal';
import type { Sesion } from '../domain/auth/types';
import { LoginPage } from '../features/login/LoginPage';
import { Shell } from '../features/shell/Shell';

// Composición: único lugar donde se elige la implementación concreta.
const auth = crearCasosDeUsoAuth(authLocal);

export default function App() {
  const [sesion, setSesion] = useState<Sesion | null>(auth.sesionActual());

  if (!sesion) {
    return <LoginPage onLogin={async (u, p) => { const s = await auth.iniciarSesion({ usuario: u, password: p }); setSesion(s); return s; }} />;
  }
  return (
    <Shell
      sesion={sesion}
      onSalir={() => { auth.cerrarSesion(); setSesion(null); }}
    />
  );
}
