'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthFlowBrandMark } from '@common/components/AuthFlowBrandMark';
import { LoginArtBackground } from '@flows/login/general/components/LoginArtBackground';
import { useResetPasswordPageController } from '@flows/reset-password/general/hooks/useResetPasswordPageController';
import '@flows/login/general/login.css';

/**
 * Why: Nueva contraseña tras click en el correo (`?token=`).
 */
export function ResetPasswordScreen() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token')?.trim() ?? '';
    const c = useResetPasswordPageController(token);

    const missingToken = !token;

    return (
        <div className="login-container">
            <LoginArtBackground />
            <div className="login-card">
                <div className="login-header">
                    <AuthFlowBrandMark />
                    <h1 className="login-title">Nueva contraseña</h1>
                    <p className="login-subtitle">
                        Ejemplo: cualquier contraseña no vacía (igual que registro y dashboard).
                    </p>
                </div>

                {missingToken ? (
                    <div className="login-form">
                        <div className="error-message">
                            <svg className="error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            Falta el token en el enlace. Abre el enlace del correo o solicita uno nuevo.
                        </div>
                        <Link href="/forgot-password" className="submit-button">
                            Solicitar nuevo enlace
                        </Link>
                        <div className="login-footer">
                            <Link href="/login" className="footer-link">
                                Volver al inicio de sesión
                            </Link>
                        </div>
                    </div>
                ) : c.success ? (
                    <div className="login-form">
                        <p className="login-subtitle">
                            Contraseña actualizada. Te enviamos un correo de confirmación. Todas las sesiones anteriores se
                            cerraron; ya puedes iniciar sesión.
                        </p>
                        <Link href="/login" className="submit-button">
                            Ir al inicio de sesión
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={c.handleSubmit} className="login-form">
                        {c.error && (
                            <div className="error-message">
                                <svg className="error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                {c.error}
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="reset-password" className="form-label">
                                Nueva contraseña
                            </label>
                            <div className="input-wrapper">
                                <svg className="input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    />
                                </svg>
                                <input
                                    id="reset-password"
                                    type="password"
                                    value={c.password}
                                    onChange={(e) => c.setPassword(e.target.value)}
                                    className="form-input"
                                    placeholder="Cualquier valor no vacío"
                                    disabled={c.isLoading}
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="reset-password-confirm" className="form-label">
                                Confirmar contraseña
                            </label>
                            <div className="input-wrapper">
                                <svg className="input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    />
                                </svg>
                                <input
                                    id="reset-password-confirm"
                                    type="password"
                                    value={c.confirmPassword}
                                    onChange={(e) => c.setConfirmPassword(e.target.value)}
                                    className="form-input"
                                    placeholder="Cualquier valor no vacío"
                                    disabled={c.isLoading}
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={c.isLoading} className="submit-button">
                            {c.isLoading ? (
                                <>
                                    <svg className="spinner" viewBox="0 0 24 24">
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            fill="none"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Guardando...
                                </>
                            ) : (
                                'Guardar contraseña'
                            )}
                        </button>

                        <div className="login-footer">
                            <Link href="/login" className="footer-link">
                                Volver al inicio de sesión
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
