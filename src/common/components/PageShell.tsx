import { ReactNode } from 'react';

/**
 * PageShell — contenedor full-screen para pantallas de flujo auth.
 *
 * Aplica las utility classes `page-shell` (centrado, padding, overflow) +
 * opcionalmente el background art con orbs flotantes (login feel).
 *
 * Variantes:
 *  - 'centered' (default) → align-items: center (login / 2fa / etc.)
 *  - 'stack'              → align-items: flex-start (dashboard, scroll natural)
 */
interface PageShellProps {
    children: ReactNode;
    /** Si true, renderiza el background art con 3 orbs animados (login feel). */
    withOrbs?: boolean;
    variant?: 'centered' | 'stack';
    className?: string;
}

export function PageShell({
    children,
    withOrbs = false,
    variant = 'centered',
    className = '',
}: PageShellProps) {
    const shellClass = variant === 'stack' ? 'page-shell page-shell--stack' : 'page-shell';
    return (
        <div className={`${shellClass} ${className}`.trim()}>
            {withOrbs && (
                <div className="background-art">
                    <div className="gradient-orb gradient-orb--gold" />
                    <div className="gradient-orb gradient-orb--violet" />
                    <div className="gradient-orb gradient-orb--pink" />
                </div>
            )}
            {children}
        </div>
    );
}
