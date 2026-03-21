'use client';

import { useOAuthCallbackController } from '@flows/oauth-callback/general/hooks/useOAuthCallbackController';

/**
 * Why: UI mínima del callback; lógica en hook.
 */
export function OAuthCallbackScreen() {
    const { status, error } = useOAuthCallbackController();

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#f1f5f9',
                padding: '2rem',
            }}
        >
            <div
                style={{
                    textAlign: 'center',
                    maxWidth: '500px',
                    width: '100%',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '16px',
                    padding: '2rem',
                }}
            >
                {status === 'loading' && (
                    <>
                        <div
                            style={{
                                width: '48px',
                                height: '48px',
                                border: '4px solid rgba(59, 130, 246, 0.3)',
                                borderTopColor: '#3b82f6',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto 1.5rem',
                            }}
                        />
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                            Procesando autenticación...
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Por favor espera</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div
                            style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                background: 'rgba(34, 197, 94, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem',
                            }}
                        >
                            <span style={{ fontSize: '2rem' }}>✓</span>
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem', color: '#22c55e' }}>
                            ¡Autenticación exitosa!
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Redirigiendo al dashboard...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div
                            style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                background: 'rgba(239, 68, 68, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem',
                            }}
                        >
                            <span style={{ fontSize: '2rem' }}>✗</span>
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#ef4444' }}>
                            Error de autenticación
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{error}</p>
                        <button
                            type="button"
                            onClick={() => {
                                window.location.href = '/login';
                            }}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                color: 'white',
                                fontWeight: '600',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                            }}
                        >
                            Volver al Login
                        </button>
                    </>
                )}
            </div>

            <style jsx>{`
                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </div>
    );
}
