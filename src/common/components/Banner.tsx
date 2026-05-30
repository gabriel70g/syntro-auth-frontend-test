import { ReactNode } from 'react';

/**
 * Banner — caja de notificación inline (error, info, warning, success).
 *
 * Variantes mapean a los tokens de feedback del theme:
 *  - 'error'   → banner-error (rojo, shake animation)
 *  - 'info'    → banner-info  (azul)
 *  - 'success' → banner-info shell + fg verde
 *  - 'warning' → banner-info shell + fg amarillo
 */
interface BannerProps {
    children: ReactNode;
    variant?: 'error' | 'info' | 'success' | 'warning';
    icon?: ReactNode;
    className?: string;
}

const SHELL_BY_VARIANT: Record<NonNullable<BannerProps['variant']>, string> = {
    error: 'banner-error',
    info: 'banner-info',
    success: 'banner-info',
    warning: 'banner-info',
};

const OVERRIDE_FG: Record<NonNullable<BannerProps['variant']>, string> = {
    error: '',
    info: '',
    success: 'text-[var(--color-success-fg-soft)]',
    warning: 'text-yellow-300',
};

export function Banner({
    children,
    variant = 'info',
    icon,
    className = '',
}: BannerProps) {
    const shell = SHELL_BY_VARIANT[variant];
    const fg = OVERRIDE_FG[variant];

    return (
        <div className={`${shell} ${fg} ${className}`.trim()}>
            {icon && <span className="w-5 h-5 flex-shrink-0">{icon}</span>}
            <div className="flex-1">{children}</div>
        </div>
    );
}

/** Iconos SVG comunes para Banner — re-exportables para evitar duplicar. */
export const BannerIcons = {
    Alert: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    Info: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    Check: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
};
