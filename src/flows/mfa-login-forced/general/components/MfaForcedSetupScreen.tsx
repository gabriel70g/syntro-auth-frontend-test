'use client';

import { MfaTotpQrCode } from '@common/components/MfaTotpQrCode';
import { useMfaForcedSetup } from '@flows/mfa-login-forced/general/hooks/useMfaForcedSetup';

/**
 * Why: UI flujo MFA forzado (servidor → QR → código).
 */
export function MfaForcedSetupScreen() {
    const c = useMfaForcedSetup();

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
                    maxWidth: '450px',
                    width: '100%',
                    background: 'rgba(30, 41, 59, 0.9)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '16px',
                    padding: '2rem',
                }}
            >
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}>
                    Configurar 2FA
                </h1>

                {c.step === 'loading' && <p style={{ textAlign: 'center', color: '#94a3b8' }}>Obteniendo semilla del servidor…</p>}

                {c.step === 'error' && (
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: '#fca5a5', marginBottom: '1rem' }}>{c.error}</p>
                        <button
                            type="button"
                            onClick={() => c.router.push('/login')}
                            style={{
                                padding: '0.75rem 1.25rem',
                                borderRadius: '8px',
                                border: 'none',
                                background: '#3b82f6',
                                color: 'white',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            Volver al login
                        </button>
                    </div>
                )}

                {c.step === 'qr' && (
                    <div>
                        <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
                            Escaneá el código con tu app autenticadora. La semilla la generó el servidor.
                        </p>
                        {c.otpAuthUri ? (
                            <div
                                style={{
                                    background: 'white',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    margin: '0 auto 1.5rem',
                                    width: 'fit-content',
                                }}
                            >
                                <MfaTotpQrCode value={c.otpAuthUri} size={200} />
                            </div>
                        ) : null}
                        <div
                            style={{
                                background: 'rgba(0,0,0,0.2)',
                                padding: '0.75rem',
                                borderRadius: '6px',
                                marginBottom: '1.5rem',
                                textAlign: 'center',
                            }}
                        >
                            <code style={{ fontSize: '1.1rem', letterSpacing: '1px', color: '#fbbf24', wordBreak: 'break-all' }}>
                                {c.manualKey}
                            </code>
                        </div>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                void c.submitEnable();
                            }}
                        >
                            {c.error && c.otpAuthUri && (
                                <p style={{ color: '#fca5a5', fontSize: '0.875rem', marginBottom: '1rem' }}>{c.error}</p>
                            )}
                            <input
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                value={c.code}
                                onChange={(e) => c.setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid #475569',
                                    background: '#1e293b',
                                    color: 'white',
                                    fontSize: '1.2rem',
                                    textAlign: 'center',
                                    marginBottom: '1rem',
                                }}
                            />
                            <button
                                type="submit"
                                disabled={c.loading || c.code.length !== 6 || !c.otpAuthUri}
                                style={{
                                    width: '100%',
                                    padding: '0.875rem',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: c.loading || c.code.length !== 6 ? 'not-allowed' : 'pointer',
                                    opacity: c.loading || c.code.length !== 6 ? 0.7 : 1,
                                }}
                            >
                                {c.loading ? 'Verificando…' : 'Activar y continuar'}
                            </button>
                        </form>
                    </div>
                )}

                {c.step === 'success' && (
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: '#86efac' }}>Listo. Redirigiendo…</p>
                    </div>
                )}
            </div>
        </div>
    );
}
