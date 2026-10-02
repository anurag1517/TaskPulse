import { useState } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: ReactNode;
    hint?: string;
}

export function Input({
    label,
    error,
    icon,
    hint,
    type = 'text',
    className = '',
    id,
    ...props
}: InputProps) {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const computedType = isPassword ? (showPassword ? 'text' : 'password') : type;
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className={`input-field-group ${error ? 'has-error' : ''} ${className}`}>
            {label && (
                <label htmlFor={inputId} className="input-label">
                    {label}
                </label>
            )}
            <div className="input-wrapper">
                {icon && <span className="input-prefix-icon">{icon}</span>}
                <input
                    id={inputId}
                    type={computedType}
                    className={`custom-input ${icon ? 'with-prefix' : ''} ${isPassword ? 'with-suffix' : ''}`}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword((prev) => !prev)}
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? '👁️' : '🙈'}
                    </button>
                )}
            </div>
            {error && <span className="input-error-msg">{error}</span>}
            {hint && !error && <span className="input-hint-msg">{hint}</span>}
        </div>
    );
}
