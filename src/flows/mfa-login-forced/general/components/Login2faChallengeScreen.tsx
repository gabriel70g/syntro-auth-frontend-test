'use client';

import { useLogin2faChallenge } from '@flows/mfa-login-forced/general/hooks/useLogin2faChallenge';

export function Login2faChallengeScreen() {
    const c = useLogin2faChallenge();

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#f1f5f9',
            }}
        >
            <div
                style={{
                    maxWidth: '400px',
                    width: '100%',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '16px',
                    padding: '2rem',
                    textAlign: 'center',
                }}
            >
                <div
                    style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'rgba(59, 130, 246, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto',
                    }}
                >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                    </svg>
                </div>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Verificación Segura</h2>
                <p style={{ color: '#94a3b8', marginBottom: '2rem', fontSize: '0.9rem' }}>
                    Ingresa el código de 6 dígitos de tu aplicación autenticadora.
                </p>

                {c.error && (
                    <div
                        style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#fca5a5',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                        }}
                    >
                        {c.error}
                    </div>
                )}

                <form onSubmit={c.handleSubmit}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '2rem' }}>
                        {c.code.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => {
                                    c.inputRefs.current[index] = el;
                                }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => c.handleInputChange(index, e.target.value)}
                                onKeyDown={(e) => c.handleKeyDown(index, e)}
                                disabled={c.isLoading}
                                style={{
                                    width: '3rem',
                                    height: '3.5rem',
                                    fontSize: '1.5rem',
                                    textAlign: 'center',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(148, 163, 184, 0.2)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    outline: 'none',
                                }}
                            />
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={c.isLoading || c.code.join('').length < 6}
                        style={{
                            width: '100%',
                            padding: '0.875rem',
                            background: c.isLoading ? '#475569' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: c.isLoading ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {c.isLoading ? 'Verificando...' : 'Verificar'}
                    </button>
                </form>
            </div>
        </div>
    );
}
