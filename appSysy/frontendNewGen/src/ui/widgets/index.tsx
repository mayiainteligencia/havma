import { useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import './widgets.css';

type FieldProps = { label: string } & InputHTMLAttributes<HTMLInputElement>;

export function TextField({ label, ...rest }: FieldProps) {
  return (
    <label className="w-field">
      <span className="w-label">{label}</span>
      <span className="w-input-wrap"><input className="w-input" {...rest} /></span>
    </label>
  );
}

export function PasswordField({ label, ...rest }: FieldProps) {
  const [ver, setVer] = useState(false);
  return (
    <label className="w-field">
      <span className="w-label">{label}</span>
      <span className="w-input-wrap">
        <input className="w-input" {...rest} type={ver ? 'text' : 'password'} />
        <button type="button" className="w-input-icon" aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setVer(v => !v)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />
            {ver && <path d="M3 3l18 18" />}
          </svg>
        </button>
      </span>
    </label>
  );
}

export function Button({ variant, ...rest }: { variant?: 'ghost' } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...rest} className={`w-btn ${variant ? `w-btn--${variant}` : ''}`} />;
}

export const Divider = ({ children }: { children: ReactNode }) => <div className="w-divider">{children}</div>;

export const SocialButton = ({ label, children, onClick }: { label: string; children: ReactNode; onClick?: () => void }) => (
  <button type="button" className="w-social" aria-label={label} onClick={onClick}>{children}</button>
);

export const ErrorText = ({ children }: { children: ReactNode }) => <p className="w-error" role="alert">{children}</p>;

export const Panel = ({ children, className = '' }: { children?: ReactNode; className?: string }) => (
  <section className={`w-panel ${className}`}>{children}</section>
);

export const IconButton = ({ label, className = '', ...rest }: { label: string } & ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button type="button" aria-label={label} title={label} {...rest} className={`w-iconbtn ${className}`} />
);

export { SearchBox, NotificationsMenu, MayiaOrb, Avatar, Chip, HeroCard } from './parts';

export * from './cards';
