import type { AuthRepository, Rol, Sesion } from '../../domain/auth/types';
import { ROLES } from '../../domain/auth/types';

const KEY = 'havasdata:sesion';

const leer = (): Sesion | null => {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    return s && ROLES.includes(s.rol) ? s : null;
  } catch { return null; }
};
const guardar = (s: Sesion) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* sin storage: solo memoria */ } };

let actual = leer();

// ponytail: usuarios mock hardcodeados; ceo@mayi.com tal cual lo pidieron, se acepta también ceo@mayia.com.
const PASSWORD = '123456martin';
const USUARIOS: Record<string, Rol> = {
  'planner@mayia.com': 'planner',
  'ceo@mayi.com': 'ceo',
  'ceo@mayia.com': 'ceo',
};

export const authLocal: AuthRepository = {
  async iniciarSesion({ usuario, password }) {
    const email = usuario.trim().toLowerCase();
    const rol = USUARIOS[email];
    if (!rol || password !== PASSWORD) throw new Error('Usuario o contraseña incorrectos');
    actual = { usuario: email, rol };
    guardar(actual);
    return actual;
  },
  cambiarRol(rol: Rol) {
    if (!actual) return null;
    actual = { ...actual, rol };
    guardar(actual);
    return actual;
  },
  sesionActual: () => actual,
  cerrarSesion() { actual = null; try { localStorage.removeItem(KEY); } catch { /* noop */ } },
};
