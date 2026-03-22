'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { postAuthMfaDisableConfirm } from '@common/api/clients/mfa.http.client';
import { mapUnknownToErrorMessage } from '@common/api/mappers/error-message.mapper';

type Phase = 'loading' | 'ok' | 'error';

/**
 * Why: Consume el token del correo (sin JWT); confirma baja de 2FA en el API.
 */
export function MfaDisableConfirmScreen() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [phase, setPhase] = useState<Phase>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setPhase('error');
            setMessage('Enlace inválido: falta el token.');
            return;
        }

        const run = async () => {
            const { ok, body } = await postAuthMfaDisableConfirm(token);
            if (ok) {
                setPhase('ok');
                setMessage('2FA desactivado correctamente.');
                return;
            }
            setPhase('error');
            setMessage(mapUnknownToErrorMessage(body, 'No se pudo confirmar. El enlace puede haber vencido o ya se usó.'));
        };

        void run();
    }, [searchParams]);

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#f1f5f9',
                padding: '1.5rem',
            }}
        >
            <div
                style={{
                    maxWidth: '420px',
                    width: '100%',
                    background: 'rgba(30, 41, 59, 0.92)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '16px',
                    padding: '2rem',
                    textAlign: 'center',
                }}
            >
                {phase === 'loading' && <p style={{ color: '#94a3b8' }}>Confirmando…</p>}
                {phase === 'ok' && (
                    <>
                        <p style={{ color: '#86efac', marginBottom: '1.25rem' }}>{message}</p>
                        <button
                            type="button"
                            onClick={() => router.push('/login')}
                            style={{
                                width: '100%',
                                padding: '0.875rem',
                                borderRadius: '8px',
                                border: 'none',
                                fontWeight: 700,
                                background: '#3b82f6',
                                color: '#fff',
                                cursor: 'pointer',
                            }}
                        >
                            Ir al inicio de sesión
                        </button>
                    </>
                )}
                {phase === 'error' && (
                    <>
                        <p style={{ color: '#fca5a5', marginBottom: '1.25rem' }}>{message}</p>
                        <button
                            type="button"
                            onClick={() => router.push('/settings/security/mfa')}
                            style={{
                                width: '100%',
                                padding: '0.875rem',
                                borderRadius: '8px',
                                border: 'none',
                                fontWeight: 700,
                                background: '#475569',
                                color: '#fff',
                                cursor: 'pointer',
                            }}
                        >
                            Volver a seguridad
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
