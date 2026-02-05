'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mfaService } from '@/lib/services/mfa.service';

export default function MfaSetupPage() {
    const router = useRouter();
    const [step, setStep] = useState<'loading' | 'qr' | 'success'>('loading');
    const [qrUri, setQrUri] = useState('');
    const [manualKey, setManualKey] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState(''); // Need password to confirm enable
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // We expect a temp token for enforced setup, OR maybe a full token if this page is reused for settings.
    // But this page is specifically for the enforced flow (based on Plan).
    // If settings flow needed, we can adapt.
    const [tempToken, setTempToken] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            if (typeof window !== 'undefined') {
                const token = sessionStorage.getItem('mfa_temp_token');

                // If no temp token, check if we have a full auth token (settings flow fallback)
                // But specifically for enforced flow, we prefer temp token.
                const authToken = localStorage.getItem('auth_token');

                const usableToken = token || authToken;

                if (!usableToken) {
                    router.replace('/login');
                    return;
                }
                setTempToken(usableToken);

                // Start setup
                const result = await mfaService.initiateSetup(usableToken);
                if (result.success && result.qrCodeUri) {
                    setQrUri(result.qrCodeUri);
                    setManualKey(result.manualEntryKey || '');
                    setStep('qr');
                } else {
                    setError(result.error || 'Error al iniciar setup');
                }
            }
        };
        init();
    }, [router]);

    const handleEnable = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code || !password) {
            setError('Código y contraseña requeridos');
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            // Enable MFA using the token we have
            // Wait, enable endpoint expects token in header too?
            // mfaService.enable uses getDefaultHeaders which uses local storage auth_token!
            // If we are in Enforced flow, we only have tempToken in sessionStorage.
            // We updated mfaService.enable to accept token override.
            const result = await mfaService.enable(code, password, tempToken || undefined);

            if (result.success) {
                setStep('success');
                // Auto redirect after success??
                // If enforced flow, we are now "Enabled". But we are NOT logged in fully yet?
                // The temp token is still just a temp token.
                // We likely need to re-login or verify the login challenge now?
                // Backend flow:
                // 1. Login -> MfaRequired(SetupRequired) -> TempToken
                // 2. Setup -> Enable (with TempToken) -> Success
                // 3. What now?
                // The user still needs AccessToken/RefreshToken.
                // The Enable endpoint returns 200 OK Empty. It does NOT return new tokens.
                // So the user must now go to "Verify Login" using the same TempToken?
                // Or re-login?
                // Re-login is safer. Or we can try to verify immediately.
                // Let's redirect to /login/2fa to verify the newly setup code.
                setTimeout(() => {
                    router.push('/login/2fa');
                }, 2000);
            } else {
                setError(result.error || 'Código incorrecto o contraseña inválida');
                setIsLoading(false);
            }
        } catch (err) {
            setError('Error de conexión');
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#f1f5f9'
        }}>
            <div style={{
                maxWidth: '450px', width: '100%',
                background: 'rgba(30, 41, 59, 0.9)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '16px', padding: '2rem'
            }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}>
                    Configurar 2FA
                </h1>

                {step === 'loading' && <p className="text-center text-gray-400">Cargando...</p>}

                {step === 'qr' && (
                    <div>
                        <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
                            Tu organización requiere autenticación de dos factores. Escanea este código con Google Authenticator o Authy.
                        </p>

                        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', margin: '0 auto 1.5rem', width: 'fit-content' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={qrUri} alt="QR Code" style={{ width: '200px', height: '200px' }} />
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>O ingresa esta clave manualmente:</p>
                            <code style={{ fontSize: '1.1rem', letterSpacing: '1px', color: '#fbbf24' }}>{manualKey}</code>
                        </div>

                        <form onSubmit={handleEnable}>
                            {error && (
                                <div style={{ color: '#fca5a5', background: 'rgba(239,68,68,0.1)', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                                    {error}
                                </div>
                            )}

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Código de 6 dígitos</label>
                                <input
                                    type="text"
                                    value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #475569', background: '#1e293b', color: 'white', fontSize: '1.2rem', textAlign: 'center', letterSpacing: '2px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Confirma tu contraseña</label>
                                <input
                                    type="password"
                                    value={password} onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #475569', background: '#1e293b', color: 'white' }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || code.length !== 6 || !password}
                                style={{
                                    width: '100%', padding: '0.875rem',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                    color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold',
                                    cursor: (isLoading || code.length !== 6 || !password) ? 'not-allowed' : 'pointer',
                                    opacity: (isLoading || code.length !== 6 || !password) ? 0.7 : 1
                                }}
                            >
                                {isLoading ? 'Verificando...' : 'Activar y Continuar'}
                            </button>
                        </form>
                    </div>
                )}

                {step === 'success' && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#22c55e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"></path></svg>
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>¡Configuración Exitosa!</h2>
                        <p style={{ color: '#cbd5e1' }}>Redirigiendo a verificación...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
