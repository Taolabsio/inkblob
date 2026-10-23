import React, { useEffect, useRef, useId } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    className?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const titleId = useId();
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        const previousFocus = document.activeElement as HTMLElement | null;
        const previousOverflow = document.body.style.overflow;
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCloseRef.current();
            if (e.key === 'Tab' && modalRef.current) {
                const items = Array.from(modalRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select, textarea, a[href], [tabindex="0"]'));
                const first = items[0], last = items.at(-1);
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
            const field = modalRef.current?.querySelector<HTMLElement>('input, textarea, select');
            (field ?? modalRef.current?.querySelector<HTMLElement>('button, [tabindex="0"]'))?.focus();
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = previousOverflow;
            if (isOpen) previousFocus?.focus();
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={`bg-web3-card w-full max-w-lg rounded-xl border border-web3-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ${className || ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-web3-border/50">
                    <h3 id={titleId} className="text-lg font-bold text-web3-text">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-web3-textMuted hover:text-web3-text transition-colors p-1 rounded-lg hover:bg-web3-cardHover"
                        aria-label="Close dialog"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};
