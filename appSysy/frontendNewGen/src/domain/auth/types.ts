export type Rol = 'ceo' | 'planner';
export const ROLES: Rol[] = ['ceo', 'planner'];
export const NOMBRE_ROL: Record<Rol, string> = { ceo: 'CEO', planner: 'Planner' };

export interface Sesion { usuario: string; rol: Rol }

export interface Credenciales { usuario: string; password: string }

/** Puerto: la UI y los casos de uso solo conocen esto, no cómo se guarda la sesión. */
export interface AuthRepository {
  iniciarSesion(c: Credenciales): Promise<Sesion>;
  cambiarRol(rol: Rol): Sesion | null;
  sesionActual(): Sesion | null;
  cerrarSesion(): void;
}
