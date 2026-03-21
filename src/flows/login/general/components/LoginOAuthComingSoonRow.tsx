import type { ReactNode } from 'react';

type Props = { providerName: string };

const icons: Record<string, ReactNode> = {
    Microsoft: (
        <svg width="18" height="18" viewBox="0 0 23 23">
            <path fill="#f35325" d="M1 1h10v10H1z" />
            <path fill="#81bc06" d="M12 1h10v10H12z" />
            <path fill="#05a6f0" d="M1 12h10v10H1z" />
            <path fill="#ffba08" d="M12 12h10v10H12z" />
        </svg>
    ),
    Apple: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.02 3.96-.83 1.25.15 2.53.64 3.44 1.77-3.01 1.76-2.48 6.01.6 7.26-.51 1.55-1.28 3.1-2.08 4.03zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
        </svg>
    ),
    X: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    ),
    GitHub: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-3.795-.735-.54-1.38-1.335-1.755-1.335-1.755-1.005-.675.075-.66.075-.66 1.11.075 1.695 1.155 1.695 1.155.99 1.695 2.61 1.2 3.225.915.105-.72.39-1.2.705-1.485-2.565-.285-5.265-1.29-5.265-5.73 0-1.26.45-2.295 1.185-3.105-.12-.285-.51-1.47.105-3.06 0 0 .975-.315 3.195 1.185A11.16 11.16 0 0112 5.805c.99.045 1.98.225 3.285.675 2.22-1.5 3.195-1.185 3.195-1.185.615 1.59.225 2.775.105 3.06.735.81 1.185 1.845 1.185 3.105 0 4.455-2.7 5.43-5.28 5.715.39.345.75 1.02.75 2.055 0 1.485-.015 2.685-.015 3.045 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
    ),
};

/**
 * Why: Fila “próximamente” aislada (lista en panel).
 */
export function LoginOAuthComingSoonRow({ providerName }: Props) {
    return (
        <div style={{ position: 'relative' }}>
            <button
                type="button"
                disabled
                style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#f3f4f6',
                    color: '#9ca3af',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontWeight: '500',
                    cursor: 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    opacity: 0.8,
                }}
            >
                <span style={{ opacity: 0.5 }}>{icons[providerName]}</span>
                Continuar con {providerName}
            </button>
            <span
                style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '10px',
                    background: '#ec4899',
                    color: 'white',
                    fontSize: '0.65rem',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    letterSpacing: '0.5px',
                    boxShadow: '0 2px 4px rgba(236, 72, 153, 0.2)',
                    transform: 'rotate(5deg)',
                }}
            >
                PRÓXIMAMENTE
            </span>
        </div>
    );
}
