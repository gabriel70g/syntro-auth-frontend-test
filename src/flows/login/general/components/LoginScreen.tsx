'use client';

import Link from 'next/link';
import { AuthFlowBrandMark } from '@common/components/AuthFlowBrandMark';
import { useLoginPageController } from '@flows/login/general/hooks/useLoginPageController';
import { LoginArtBackground } from '@flows/login/general/components/LoginArtBackground';
import { LoginCredentialForm } from '@flows/login/general/components/LoginCredentialForm';
import { LoginOAuthPanel } from '@flows/login/general/components/LoginOAuthPanel';
import '@flows/login/general/login.css';

/**
 * Why: Composición del flujo login (presentación + hook).
 */
export function LoginScreen() {
    const c = useLoginPageController();

    return (
        <div className="login-container">
            <LoginArtBackground />
            <div className="login-card">
                <div className="login-header">
                    <AuthFlowBrandMark />
                    <h1 className="login-title">Bienvenido</h1>
                    <p className="login-subtitle">Ingresa tus credenciales para continuar</p>
                </div>

                <LoginCredentialForm
                    credentials={c.credentials}
                    setCredentials={c.setCredentials}
                    error={c.error}
                    isLoading={c.isLoading}
                    showPassword={c.showPassword}
                    setShowPassword={c.setShowPassword}
                    onSubmit={c.handleSubmit}
                />

                <LoginOAuthPanel
                    oauthProviders={c.oauthProviders}
                    isLoading={c.isLoading}
                    onGoogle={() => c.handleOAuthLogin('google')}
                />

                <div className="login-footer">
                    <Link href="/forgot-password" className="footer-link">
                        ¿Olvidaste tu contraseña?
                    </Link>
                    <Link href="/register" className="footer-link">
                        ¿No tienes cuenta? Regístrate
                    </Link>
                </div>
            </div>
        </div>
    );
}
