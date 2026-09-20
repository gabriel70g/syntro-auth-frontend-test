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
                background: 'linear-gradient(135deg, var(--color-surface-bg-from) 0%, var(--color-surface-bg-to) 100%)',
                color: 'var(--color-text-strong)',
            }}
        >
            <div
                style={{
                    maxWidth: '400px',
                    width: '100%',
                    background: 'var(--color-surface-card-strong)',
                    border: '1px solid var(--color-border-soft)',
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
                        background: 'var(--color-info-bg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto',
                    }}
                >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-action-fg)" strokeWidth="2">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                    </svg>
                </div>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Verificación Segura</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                    {c.usingRecoveryCode
                        ? 'Ingresá uno de los códigos de recuperación que guardaste al activar la verificación en dos pasos. Cada código sirve una sola vez.'
                        : 'Ingresa el código de 6 dígitos de tu aplicación autenticadora.'}
                </p>

                {c.error && (
                    <div
                        style={{
                            background: 'var(--color-danger-bg)',
                            color: 'var(--color-danger-fg)',
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
                    {c.usingRecoveryCode ? (
                        <div style={{ marginBottom: '2rem' }}>
                            <label
                                htmlFor="recovery-code"
                                style={{ display: 'block', textAlign: 'left', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-dim)' }}
                            >
                                Código de recuperación
                            </label>
                            <input
                                id="recovery-code"
                                type="text"
                                autoFocus
                                autoComplete="one-time-code"
                                spellCheck={false}
                                placeholder="XXXXX-XXXXX"
                                value={c.recoveryCode}
                                onChange={(e) => c.setRecoveryCode(e.target.value.toUpperCase())}
                                disabled={c.isLoading}
                                style={{
                                    width: '100%',
                                    padding: '0.875rem',
                                    fontSize: '1.125rem',
                                    letterSpacing: '0.1em',
                                    textAlign: 'center',
                                    background: 'var(--color-surface-input)',
                                    border: '1px solid var(--color-border-soft)',
                                    borderRadius: '8px',
                                    color: 'var(--color-text-strong)',
                                    outline: 'none',
                                }}
                            />
                        </div>
                    ) : (
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
                                    background: 'var(--color-surface-input)',
                                    border: '1px solid var(--color-border-soft)',
                                    borderRadius: '8px',
                                    color: 'var(--color-text-strong)',
                                    outline: 'none',
                                }}
                            />
                        ))}
                    </div>
                    )}

                    <button
                        type="submit"
                        disabled={c.isLoading || !c.canSubmit}
                        style={{
                            width: '100%',
                            padding: '0.875rem',
                            background: c.isLoading ? 'var(--color-surface-raised)' : 'linear-gradient(135deg, var(--color-action-from) 0%, var(--color-action-to) 100%)',
                            color: c.isLoading ? 'var(--color-text-strong)' : 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: c.isLoading ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {c.isLoading ? 'Verificando...' : 'Verificar'}
                    </button>

                    <button
                        type="button"
                        onClick={c.toggleRecoveryCode}
                        disabled={c.isLoading}
                        style={{
                            width: '100%',
                            marginTop: '1rem',
                            padding: '0.5rem',
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-action-fg)',
                            fontSize: '0.875rem',
                            textDecoration: 'underline',
                            cursor: c.isLoading ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {c.usingRecoveryCode
                            ? 'Volver al código de la aplicación'
                            : '¿Perdiste el acceso a tu aplicación? Usá un código de recuperación'}
                    </button>
                </form>
            </div>
        </div>
    );
}
