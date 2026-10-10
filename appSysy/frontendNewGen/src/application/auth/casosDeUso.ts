import type { AuthRepository, Credenciales } from '../../domain/auth/types';

export const crearCasosDeUsoAuth = (repo: AuthRepository) => ({
  iniciarSesion: (c: Credenciales) => {
    if (!c.usuario.trim() || !c.password) return Promise.reject(new Error('Ingresa usuario y contraseña'));
    return repo.iniciarSesion(c);
  },
  cambiarRol: repo.cambiarRol,
  sesionActual: repo.sesionActual,
  cerrarSesion: repo.cerrarSesion,
});
