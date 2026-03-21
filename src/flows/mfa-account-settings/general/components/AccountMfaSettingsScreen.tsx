'use client';

/**
 * Flujo exclusivo de cuenta: generar semilla TOTP en el servidor → escanear / manual →
 * probar sincronización con código de 6 dígitos → servidor valida y activa 2FA.
 * No usar con token MFA temporal; ese flujo vive en /mfa/setup + /api/auth/mfa/*.
 */
import { type CSSProperties } from 'react';
import QRCode from 'react-qr-code';
import { useAccountMfaSettingsController } from '@flows/mfa-account-settings/general/hooks/useAccountMfaSettingsController';

export function AccountMfaSettingsScreen() {
    const flow = useAccountMfaSettingsController();

    const cardStyle: CSSProperties = {
        maxWidth: '480px',
        width: '100%',
        background: 'rgba(30, 41, 59, 0.92)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: '16px',
        padding: '2rem',
    };

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
                padding: '1.5rem',
            }}
        >
            <div style={cardStyle}>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                    Cuenta · Seguridad · Autenticación en dos pasos
                </p>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>
                    Configurar 2FA (TOTP)
                </h1>

                {flow.step === 'intro' && (
                    <div>
                        <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                            Este asistente solo aplica con sesión iniciada. El servidor genera la semilla; tu teléfono debe
                            mostrar el mismo código de 6 dígitos que ingresás acá para dar el alta por válida.
                        </p>
                        <button
                            type="button"
                            onClick={() => void flow.startServerSetup()}
                            disabled={flow.loading}
                            style={{
                                width: '100%',
                                padding: '0.875rem',
                                borderRadius: '8px',
                                border: 'none',
                                fontWeight: 700,
                                cursor: flow.loading ? 'not-allowed' : 'pointer',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                color: '#fff',
                                marginBottom: '0.75rem',
                            }}
                        >
                            {flow.loading ? 'Solicitando…' : '1. Generar semilla en el servidor'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                flow.setError('');
                                flow.setStep('disable');
                            }}
                            style={{
                                width: '100%',
                                padding: '0.625rem',
                                borderRadius: '8px',
                                border: '1px solid #475569',
                                background: 'transparent',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                            }}
                        >
                            Desactivar 2FA (ya configurado)
                        </button>
                        {flow.error && (
                            <p style={{ color: '#fca5a5', fontSize: '0.875rem', marginTop: '1rem' }}>{flow.error}</p>
                        )}
                    </div>
                )}

                {flow.step === 'scan' && (
                    <div>
                        <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            2. Escaneá el QR o copiá la clave. El secreto lo emitió el servidor; la app debe estar
                            sincronizada con la hora (NTP).
                        </p>
                        <div
                            style={{
                                background: '#fff',
                                padding: '1rem',
                                borderRadius: '8px',
                                width: 'fit-content',
                                margin: '0 auto 1rem',
                            }}
                        >
                            <QRCode value={flow.otpAuthUri} size={200} level="M" />
                        </div>
                        <div
                            style={{
                                background: 'rgba(0,0,0,0.25)',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                marginBottom: '1.25rem',
                                textAlign: 'center',
                            }}
                        >
                            <code style={{ color: '#fbbf24', wordBreak: 'break-all', fontSize: '0.95rem' }}>
                                {flow.manualKey}
                            </code>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                flow.setError('');
                                flow.setCode('');
                                flow.setStep('sync');
                            }}
                            style={{
                                width: '100%',
                                padding: '0.875rem',
                                borderRadius: '8px',
                                border: 'none',
                                fontWeight: 700,
                                background: '#334155',
                                color: '#fff',
                                cursor: 'pointer',
                            }}
                        >
                            3. Ya escaneé — probar sincronización
                        </button>
                        <button
                            type="button"
                            onClick={() => flow.setStep('intro')}
                            style={{
                                marginTop: '0.75rem',
                                width: '100%',
                                padding: '0.5rem',
                                border: 'none',
                                background: 'transparent',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                            }}
                        >
                            Cancelar
                        </button>
                    </div>
                )}

                {flow.step === 'sync' && (
                    <form onSubmit={flow.submitSync}>
                        <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            4. Ingresá el código que muestra la app. Si coincide con la semilla del servidor, damos por
                            válida la configuración.
                        </p>
                        {flow.error && (
                            <p style={{ color: '#fca5a5', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{flow.error}</p>
                        )}
                        <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            value={flow.code}
                            onChange={(e) => flow.setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid #475569',
                                background: '#1e293b',
                                color: '#fff',
                                fontSize: '1.25rem',
                                textAlign: 'center',
                                letterSpacing: '0.25em',
                                marginBottom: '1rem',
                            }}
                        />
                        <button
                            type="submit"
                            disabled={flow.loading || flow.code.length !== 6}
                            style={{
                                width: '100%',
                                padding: '0.875rem',
                                borderRadius: '8px',
                                border: 'none',
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                color: '#fff',
                                cursor: flow.loading || flow.code.length !== 6 ? 'not-allowed' : 'pointer',
                                opacity: flow.loading || flow.code.length !== 6 ? 0.7 : 1,
                            }}
                        >
                            {flow.loading ? 'Verificando…' : 'Confirmar y activar 2FA'}
                        </button>
                        <button
                            type="button"
                            onClick={() => flow.setStep('scan')}
                            style={{
                                marginTop: '0.75rem',
                                width: '100%',
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                            }}
                        >
                            Volver al QR
                        </button>
                    </form>
                )}

                {flow.step === 'done' && (
                    <div>
                        <p style={{ color: '#86efac', marginBottom: '1rem' }}>
                            2FA activado. Guardá los códigos de recuperación.
                        </p>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '0.5rem',
                                marginBottom: '1.25rem',
                            }}
                        >
                            {flow.recoveryCodes.map((rc) => (
                                <code
                                    key={rc}
                                    style={{
                                        display: 'block',
                                        textAlign: 'center',
                                        padding: '0.5rem',
                                        background: 'rgba(0,0,0,0.3)',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                    }}
                                >
                                    {rc}
                                </code>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => flow.router.push('/dashboard')}
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
                            Volver al panel
                        </button>
                    </div>
                )}

                {flow.step === 'disable' && (
                    <form onSubmit={flow.submitDisable}>
                        <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            Confirmá con tu contraseña para desactivar 2FA en esta cuenta.
                        </p>
                        {flow.error && (
                            <p style={{ color: '#fca5a5', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{flow.error}</p>
                        )}
                        <input
                            type="password"
                            value={flow.disablePassword}
                            onChange={(e) => flow.setDisablePassword(e.target.value)}
                            placeholder="Contraseña"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid #475569',
                                background: '#1e293b',
                                color: '#fff',
                                marginBottom: '1rem',
                            }}
                        />
                        <button
                            type="submit"
                            disabled={flow.loading}
                            style={{
                                width: '100%',
                                padding: '0.875rem',
                                borderRadius: '8px',
                                border: 'none',
                                fontWeight: 700,
                                background: '#b91c1c',
                                color: '#fff',
                                cursor: flow.loading ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {flow.loading ? '…' : 'Desactivar 2FA'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                flow.setError('');
                                flow.setStep('intro');
                            }}
                            style={{
                                marginTop: '0.75rem',
                                width: '100%',
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                            }}
                        >
                            Cancelar
                        </button>
                    </form>
                )}
            </div>

            <button
                type="button"
                onClick={() => flow.router.push('/dashboard')}
                style={{
                    marginTop: '1.5rem',
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                }}
            >
                ← Dashboard
            </button>
        </div>
    );
}
