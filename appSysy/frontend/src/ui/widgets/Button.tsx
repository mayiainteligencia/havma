import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, style, ...props }) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: 'var(--color-primary)', color: '#fff', border: 'none' };
      case 'secondary':
        return { backgroundColor: 'var(--color-surface-hover)', color: 'var(--color-text-main)', border: 'none' };
      case 'outline':
        return { backgroundColor: 'transparent', color: 'var(--color-text-main)', border: '1px solid var(--color-border)' };
      case 'ghost':
        return { backgroundColor: 'transparent', color: 'var(--color-text-muted)', border: 'none' };
    }
  };

  return (
    <button
      style={{
        padding: '10px 18px',
        borderRadius: 'var(--radius-md)',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        ...getVariantStyles(),
        ...style,
      }}
      onMouseEnter={(e) => {
        if (variant === 'primary') e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)';
        else if (variant === 'outline') e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
        else if (variant === 'ghost') e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
      }}
      onMouseLeave={(e) => {
        if (variant === 'primary') e.currentTarget.style.backgroundColor = 'var(--color-primary)';
        else if (variant === 'outline') e.currentTarget.style.backgroundColor = 'transparent';
        else if (variant === 'ghost') e.currentTarget.style.backgroundColor = 'transparent';
      }}
      {...props}
    >
      {children}
    </button>
  );
};
