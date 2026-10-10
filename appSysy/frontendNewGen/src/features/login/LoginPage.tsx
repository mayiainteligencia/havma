import { useState, type FormEvent } from 'react';
import type { Sesion } from '../../domain/auth/types';
import { AuthLayout } from '../../ui/layouts/AuthLayout';
import { Button, Divider, ErrorText, PasswordField, SocialButton, TextField } from '../../ui/widgets';
import './LoginPage.css';

interface Props { onLogin: (usuario: string, password: string) => Promise<Sesion> }

export function LoginPage({ onLogin }: Props) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setCargando(true);
    try { await onLogin(usuario, password); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión'); }
    finally { setCargando(false); }
  };

  return (
    <AuthLayout>
      <form className="login" onSubmit={enviar}>
        <h1 className="login__title">Log in</h1>
        <TextField label="Login, email or phone number" value={usuario} onChange={e => setUsuario(e.target.value)} autoComplete="username" />
        <PasswordField label="Password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
        {error && <ErrorText>{error}</ErrorText>}
        <Button type="submit" disabled={cargando}>Log in</Button>
        <Divider>or log in with</Divider>
        <div className="login__social">
          <SocialButton label="Google">
            <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>
          </SocialButton>
          <SocialButton label="Microsoft">
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#F25022" d="M1 1h10v10H1z"/><path fill="#7FBA00" d="M13 1h10v10H13z"/><path fill="#00A4EF" d="M1 13h10v10H1z"/><path fill="#FFB900" d="M13 13h10v10H13z"/></svg>
          </SocialButton>
        </div>
        <a className="w-link" href="#" onClick={e => e.preventDefault()}>Forgot login or password?</a>
      </form>
    </AuthLayout>
  );
}
