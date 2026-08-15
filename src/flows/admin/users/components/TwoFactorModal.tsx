'use client';

import { MfaTotpQrCode } from '@common/components/MfaTotpQrCode';
import { downloadRecoveryCodesTxt } from '@common/lib/recovery-codes-download';
import { useAccountMfaSettingsController } from '@flows/mfa-account-settings/general/hooks/useAccountMfaSettingsController';

/**
 * Why: gestión de 2FA de la PROPIA cuenta, dentro de la consola (estilo Diamante) — no una pantalla
 * aparte. Reutiliza la lógica existente (`useAccountMfaSettingsController`, endpoints /api/account/mfa/*);
 * acá solo cambia la piel y el "done" cierra + recarga la grilla en vez de navegar a /dashboard.
 *
 * Regenerar = correr el setup de nuevo: el servidor emite un secreto nuevo y PISA el anterior (útil
 * para handoff: el que testea escanea el QR nuevo y enrola su authenticator, sin la baja por email).
 */
interface TwoFactorModalProps {
    enabled: boolean;
    email: string;
    onClose: () => void;
    onDone: () => void;
}

export function TwoFactorModal({ enabled, email, onClose, onDone }: TwoFactorModalProps) {
    const flow = useAccountMfaSettingsController();

    return (
        <div className="stepup-overlay" onClick={onClose}>
            <div className="stepup-modal" onClick={(e) => e.stopPropagation()}>
                <p className="stepup-eyebrow">Tu cuenta · seguridad</p>
                <h2 className="stepup-title">Autenticación en dos pasos</h2>

                {/* ── Intro: elegir acción ─────────────────────────────────── */}
                {flow.step === 'intro' && (
                    <>
                        <p className="stepup-sub">
                            {enabled
                                ? `2FA activo en ${email}. Regenerar emite un secreto nuevo y reemplaza el anterior — el QR viejo deja de servir.`
                                : `Protegé ${email} con un código temporal (TOTP) de tu app de autenticación.`}
                        </p>
                        <div className="twofa-options">
                            <button
                                type="button"
                                className="stepup-confirm"
                                onClick={() => void flow.startServerSetup()}
                                disabled={flow.loading}
                            >
                                {flow.loading
                                    ? 'Solicitando…'
                                    : enabled
                                      ? 'Regenerar 2FA'
                                      : 'Activar 2FA'}
                            </button>
                            <button
                                type="button"
                                className="twofa-opt"
                                onClick={() => {
                                    flow.setError('');
                                    flow.setCode('');
                                    flow.setStep('verify');
                                }}
                            >
                                Ya tengo 2FA — verificar código
                            </button>
                            {enabled && (
                                <button
                                    type="button"
                                    className="twofa-opt twofa-opt--danger"
                                    onClick={() => {
                                        flow.setError('');
                                        flow.setStep('disable');
                                    }}
                                >
                                    Desactivar 2FA
                                </button>
                            )}
                        </div>
                        {flow.error && <p className="stepup-error">{flow.error}</p>}
                        <p className="stepup-hint" onClick={onClose} role="button">
                            Cerrar
                        </p>
                    </>
                )}

                {/* ── Escanear QR ──────────────────────────────────────────── */}
                {flow.step === 'scan' && (
                    <>
                        <p className="stepup-sub">
                            Escaneá el QR (o copiá la clave) en tu app de autenticación. El secreto lo
                            emitió el servidor; la app tiene que estar en hora (NTP).
                        </p>
                        <div className="twofa-qr">
                            <MfaTotpQrCode value={flow.otpAuthUri} size={196} />
                        </div>
                        <div className="twofa-key">
                            <code>{flow.manualKey}</code>
                        </div>
                        <div className="stepup-actions">
                            <button
                                type="button"
                                className="stepup-cancel"
                                onClick={() => flow.setStep('intro')}
                            >
                                Volver
                            </button>
                            <button
                                type="button"
                                className="stepup-confirm"
                                onClick={() => {
                                    flow.setError('');
                                    flow.setCode('');
                                    flow.setStep('sync');
                                }}
                            >
                                Ya escaneé
                            </button>
                        </div>
                    </>
                )}

                {/* ── Sincronizar (activar) ────────────────────────────────── */}
                {flow.step === 'sync' && (
                    <form onSubmit={flow.submitSync}>
                        <p className="stepup-sub">
                            Ingresá el código de 6 dígitos que muestra la app para confirmar la sincronización.
                        </p>
                        <input
                            className="stepup-code"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            value={flow.code}
                            onChange={(e) => flow.setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            autoFocus
                        />
                        {flow.error && <p className="stepup-error">{flow.error}</p>}
                        <div className="stepup-actions">
                            <button
                                type="button"
                                className="stepup-cancel"
                                onClick={() => flow.setStep('scan')}
                            >
                                Volver al QR
                            </button>
                            <button
                                type="submit"
                                className="stepup-confirm"
                                disabled={flow.loading || flow.code.length !== 6}
                            >
                                {flow.loading ? 'Verificando…' : 'Confirmar y activar'}
                            </button>
                        </div>
                    </form>
                )}

                {/* ── Activado: códigos de recuperación ────────────────────── */}
                {flow.step === 'done' && (
                    <>
                        <p className="stepup-sub">
                            2FA activo. Guardá los códigos de recuperación (se muestran una sola vez).
                        </p>
                        <div className="twofa-recovery">
                            {flow.recoveryCodes.map((rc) => (
                                <code key={rc}>{rc}</code>
                            ))}
                        </div>
                        <div className="stepup-actions">
                            <button
                                type="button"
                                className="stepup-cancel"
                                onClick={() =>
                                    void navigator.clipboard?.writeText(flow.recoveryCodes.join('\n'))
                                }
                            >
                                Copiar
                            </button>
                            <button
                                type="button"
                                className="stepup-cancel"
                                onClick={() => downloadRecoveryCodesTxt(flow.recoveryCodes)}
                            >
                                Descargar .txt
                            </button>
                        </div>
                        <button
                            type="button"
                            className="stepup-confirm"
                            style={{ width: '100%', marginTop: '0.75rem' }}
                            onClick={onDone}
                        >
                            Listo
                        </button>
                    </>
                )}

                {/* ── Verificar código (probar sin regenerar) ──────────────── */}
                {flow.step === 'verify' && (
                    <form onSubmit={flow.submitVerify}>
                        <p className="stepup-sub">
                            Ingresá el código de 6 dígitos de tu app para verificar que el 2FA funciona.
                        </p>
                        <input
                            className="stepup-code"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            value={flow.code}
                            onChange={(e) => flow.setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            autoFocus
                        />
                        {flow.error && <p className="stepup-error">{flow.error}</p>}
                        <div className="stepup-actions">
                            <button
                                type="button"
                                className="stepup-cancel"
                                onClick={() => {
                                    flow.setError('');
                                    flow.setStep('intro');
                                }}
                            >
                                Volver
                            </button>
                            <button
                                type="submit"
                                className="stepup-confirm"
                                disabled={flow.loading || flow.code.length !== 6}
                            >
                                {flow.loading ? 'Verificando…' : 'Verificar'}
                            </button>
                        </div>
                    </form>
                )}

                {flow.step === 'verify_ok' && (
                    <>
                        <p className="stepup-sub">Código válido — tu 2FA está funcionando.</p>
                        <button
                            type="button"
                            className="stepup-confirm"
                            style={{ width: '100%' }}
                            onClick={onDone}
                        >
                            Cerrar
                        </button>
                    </>
                )}

                {/* ── Desactivar (confirmación por email) ──────────────────── */}
                {flow.step === 'disable' && (
                    <form onSubmit={flow.requestDisableEmail}>
                        <p className="stepup-sub">
                            Te mandamos un correo con un enlace de un solo uso (~10 min) para confirmar la
                            baja. En local, el mail llega a Mailpit (http://localhost:8026).
                        </p>
                        {flow.error && <p className="stepup-error">{flow.error}</p>}
                        <div className="stepup-actions">
                            <button
                                type="button"
                                className="stepup-cancel"
                                onClick={() => {
                                    flow.setError('');
                                    flow.setStep('intro');
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="stepup-confirm is-danger"
                                disabled={flow.loading}
                            >
                                {flow.loading ? 'Enviando…' : 'Enviar correo'}
                            </button>
                        </div>
                    </form>
                )}

                {flow.step === 'disable_email_sent' && (
                    <>
                        <p className="stepup-sub">
                            Correo enviado. Abrí el enlace (en local: Mailpit, http://localhost:8026) para
                            desactivar el 2FA. El enlace sirve una sola vez.
                        </p>
                        <button
                            type="button"
                            className="stepup-confirm"
                            style={{ width: '100%' }}
                            onClick={onDone}
                        >
                            Listo
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
