'use client';

import Link from 'next/link';
import { AuthFlowBrandMark } from '@common/components/AuthFlowBrandMark';
import { LoginArtBackground } from '@flows/login/general/components/LoginArtBackground';
import { useForgotPasswordPageController } from '@flows/forgot-password/general/hooks/useForgotPasswordPageController';
import '@flows/login/general/login.css';

/**
 * Why: Pantalla “olvidé contraseña” alineada al estilo del login/registro.
 */
export function ForgotPasswordScreen() {
    const c = useForgotPasswordPageController();

    return (
        <div className="login-container">
            <LoginArtBackground />
            <div className="login-card">
                <div className="login-header">
                    <AuthFlowBrandMark />
                    <h1 className="login-title">Recuperar contraseña</h1>
                    <p className="login-subtitle">
                        Te enviaremos un enlace si el correo está registrado en este espacio de trabajo.
                    </p>
                </div>

                {c.successMessage ? (
                    <div className="login-form">
                        <p className="login-subtitle">{c.successMessage}</p>
                        <Link href="/login" className="submit-button">
                            Volver al inicio de sesión
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
                            <label htmlFor="forgot-email" className="form-label">
                                Email
                            </label>
                            <div className="input-wrapper">
                                <svg className="input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                                    />
                                </svg>
                                <input
                                    id="forgot-email"
                                    type="email"
                                    value={c.email}
                                    onChange={(e) => c.setEmail(e.target.value)}
                                    className="form-input"
                                    placeholder="tu@email.com"
                                    disabled={c.isLoading}
                                    autoComplete="email"
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
                                    Enviando...
                                </>
                            ) : (
                                'Enviar enlace'
                            )}
                        </button>
                    </form>
                )}

                <div className="login-footer">
                    <Link href="/login" className="footer-link">
                        Volver al inicio de sesión
                    </Link>
                </div>
            </div>
        </div>
    );
}
