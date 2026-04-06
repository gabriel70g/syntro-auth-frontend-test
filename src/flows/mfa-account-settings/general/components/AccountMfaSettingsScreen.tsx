'use client';

/**
 * Flujo exclusivo de cuenta: generar semilla TOTP en el servidor → escanear / manual →
 * probar sincronización con código de 6 dígitos → servidor valida y activa 2FA.
 * No usar con token MFA temporal; ese flujo vive en /mfa/setup + /api/auth/mfa/*.
 */
import { type CSSProperties } from 'react';
import { MfaTotpQrCode } from '@common/components/MfaTotpQrCode';
import { downloadRecoveryCodesTxt } from '@common/lib/recovery-codes-download';
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
                            Elegí una opción según el estado actual de tu cuenta.
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
                            {flow.loading ? 'Solicitando…' : 'Configurar 2FA'}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                flow.setError('');
                                flow.setCode('');
                                flow.setStep('verify');
                            }}
                            style={{
                                width: '100%',
                                padding: '0.875rem',
                                borderRadius: '8px',
                                border: '1px solid rgba(34, 197, 94, 0.4)',
                                background: 'rgba(34, 197, 94, 0.1)',
                                color: '#86efac',
                                fontWeight: 600,
                                cursor: 'pointer',
                                marginBottom: '0.75rem',
                            }}
                        >
                            Ya tengo 2FA — Verificar código
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
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                background: 'rgba(239, 68, 68, 0.08)',
                                color: '#fca5a5',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                            }}
                        >
                            Desactivar 2FA
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
                            <MfaTotpQrCode value={flow.otpAuthUri} size={200} />
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
                        <p style={{ color: '#86efac', marginBottom: '0.5rem' }}>
                            2FA activado. Guardá los códigos de recuperación.
                        </p>
                        <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                            Podés copiarlos o descargar un archivo .txt y guardarlo en un gestor de contraseñas o carpeta
                            cifrada.
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
                        <div
                            style={{
                                display: 'flex',
                                gap: '0.5rem',
                                marginBottom: '0.75rem',
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => void navigator.clipboard.writeText(flow.recoveryCodes.join('\n'))}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid #475569',
                                    background: 'transparent',
                                    color: '#e2e8f0',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                }}
                            >
                                Copiar
                            </button>
                            <button
                                type="button"
                                onClick={() => downloadRecoveryCodesTxt(flow.recoveryCodes)}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: '#334155',
                                    color: '#fff',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                }}
                            >
                                Descargar .txt
                            </button>
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

                {flow.step === 'verify' && (
                    <form onSubmit={flow.submitVerify}>
                        <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: 1.6 }}>
                            Ingresá el código de 6 dígitos que muestra tu app de autenticación para verificar que 2FA
                            funciona correctamente.
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
                            {flow.loading ? 'Verificando…' : 'Verificar código'}
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
                            Volver
                        </button>
                    </form>
                )}

                {flow.step === 'verify_ok' && (
                    <div>
                        <p style={{ color: '#86efac', fontSize: '1rem', marginBottom: '1rem' }}>
                            Código válido — tu 2FA está funcionando correctamente.
                        </p>
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
                    <form onSubmit={flow.requestDisableEmail}>
                        <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: 1.6 }}>
                            Te enviaremos un correo con un enlace de un solo uso (válido unos 10 minutos). Abrilo desde el
                            dispositivo donde podés leer el mail con calma; el enlace confirma la baja de 2FA.
                        </p>
                        {flow.error && (
                            <p style={{ color: '#fca5a5', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{flow.error}</p>
                        )}
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
                            {flow.loading ? 'Enviando…' : 'Enviar correo de confirmación'}
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

                {flow.step === 'disable_email_sent' && (
                    <div>
                        <p style={{ color: '#86efac', marginBottom: '0.75rem' }}>Correo enviado.</p>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                            Revisá tu bandeja (y spam). Cuando abras el enlace del mail, 2FA se desactivará en esta cuenta.
                            El enlace solo sirve una vez.
                        </p>
                        <button
                            type="button"
                            onClick={() => flow.setStep('intro')}
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
                            Volver
                        </button>
                    </div>
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
