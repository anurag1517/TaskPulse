import { useEffect } from 'react';
import type { ReactNode } from 'react';
import './Modal.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    subtitle?: string;
    maxWidth?: string;
}

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    subtitle,
    maxWidth = '540px',
}: ModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div
                className="modal-content"
                style={{ maxWidth }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-drag-handle" />
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">{title}</h2>
                        {subtitle && <p className="modal-subtitle">{subtitle}</p>}
                    </div>
                    <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
                        ✕
                    </button>
                </div>
                <div className="modal-body">{children}</div>
            </div>
        </div>
    );
}
