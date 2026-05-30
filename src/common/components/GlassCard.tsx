import { ReactNode } from 'react';

/**
 * GlassCard — superficie principal de cada pantalla auth.
 *
 * Background semi-transparente con backdrop-blur, border subtle, radius grande.
 * Variantes:
 *  - 'default'  → card grande (login/register), con hover lift
 *  - 'compact'  → card chico (2FA, popups), bg más opaco
 *  - 'static'   → como default pero sin hover (dashboard, evita movimiento)
 */
interface GlassCardProps {
    children: ReactNode;
    variant?: 'default' | 'compact' | 'static';
    /** max-width del card. Default '440px' para default, '400px' para compact. */
    maxWidth?: string;
    className?: string;
}

export function GlassCard({
    children,
    variant = 'default',
    maxWidth,
    className = '',
}: GlassCardProps) {
    const variantClass =
        variant === 'compact' ? 'glass-card glass-card--compact'
            : variant === 'static' ? 'glass-card'
                : 'glass-card glass-card--hover';

    const defaultMaxWidth = variant === 'compact' ? '400px' : '440px';

    return (
        <div
            className={`${variantClass} ${className}`.trim()}
            style={{
                width: '100%',
                maxWidth: maxWidth ?? defaultMaxWidth,
                padding: '3rem',
            }}
        >
            {children}
        </div>
    );
}
