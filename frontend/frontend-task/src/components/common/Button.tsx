import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'p1';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: ReactNode;
    children: ReactNode;
}

export function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    children,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    return (
        <button
            className={`btn btn-${variant} btn-${size} ${loading ? 'btn-loading' : ''} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <span className="spinner" />
            ) : (
                <>
                    {icon && <span className="btn-icon">{icon}</span>}
                    <span className="btn-text">{children}</span>
                </>
            )}
        </button>
    );
}
