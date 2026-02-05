/**
 * Página de Login - Demo/Maqueta SyntroAuth
 * 
 * Muestra cómo integrar:
 * - Login con email/password (RSA-OAEP handshake)
 * - OAuth providers (Google, Apple, etc.)
 * 
 * Configurado para Railway por defecto.
 * Localhost solo como fallback si es necesario.
 */
'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { authService } from '@/lib/services/auth.service';
import type { AuthCredentials } from '@/lib/types/auth.types';
import { API_URL } from '@/lib/constants/config';
import './login.css';

interface OAuthProvider {
    enabled: boolean;
    clientId: string | null;
}

export default function LoginPage() {
    const [credentials, setCredentials] = useState<AuthCredentials>({
        email: '',
        password: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [showPassword, setShowPassword] = useState(false);
    const [oauthProviders, setOauthProviders] = useState<Record<string, OAuthProvider>>({});

    /**
     * PASO 1: Cargar configuración OAuth del backend
     * 
     * Esto obtiene qué proveedores están habilitados y sus Client IDs públicos.
     * El backend decide qué está disponible según la configuración en Railway.
     * 
     * IMPORTANTE: El frontend NO tiene credenciales secretas.
     * Solo obtiene el Client ID (público) del backend automáticamente.
     * El Client Secret queda solo en el backend.
     * 
     * Para copiar: Este useEffect completo es lo que necesitás.
     */
    useEffect(() => {
        const loadOAuthConfig = async () => {
            try {
                const response = await fetch(`${API_URL}/api/auth/oauth/config`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data?.providers) {
                        setOauthProviders(data.data.providers);
                    }
                }
            } catch (err) {
                console.error('Error cargando configuración OAuth:', err);
            }
        };
        loadOAuthConfig();
    }, []);

    /**
     * PASO 2: Handler para iniciar OAuth
     * 
     * Cuando el usuario hace clic en "Continuar con Google", esto:
     * 1. Verifica que Google esté habilitado
     * 2. Obtiene el Client ID (público) del backend
     * 3. Redirige a Google OAuth
     * 
     * El frontend solo redirige. El backend hace el trabajo pesado
     * (intercambiar código por tokens usando Client Secret).
     * 
     * Para copiar: Esta función completa.
     */
    const handleOAuthLogin = (provider: string) => {
        // Guard clause: verificar que el proveedor esté disponible
        const providerConfig = oauthProviders[provider.toLowerCase()];
        if (!providerConfig?.enabled || !providerConfig.clientId) {
            setError(`OAuth con ${provider} no está disponible`);
            return;
        }

        // Redirigir a OAuth provider (función pura en authService)
        authService.initiateOAuth(provider, providerConfig.clientId);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Guard clause: reset error
        setError('');

        // Guard clause: validación básica
        if (!credentials.email.trim() || !credentials.password.trim()) {
            setError('Por favor completa todos los campos');
            return;
        }

        // Guard clause: validación de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(credentials.email)) {
            setError('Email inválido');
            return;
        }

        setIsLoading(true);

        try {
            const result = await authService.login(credentials);

            if (!result.success) {
                setError(result.error || 'Error al iniciar sesión');
                return;
            }

            // Login exitoso - redirección o acción
            console.log('Login exitoso:', result.session);
            window.location.href = '/dashboard'; // O usar router de Next.js
        } catch (err) {
            setError('Error inesperado. Intenta nuevamente.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            {/* Fondo artístico con gradientes */}
            <div className="background-art">
                <div className="gradient-orb gradient-orb-1"></div>
                <div className="gradient-orb gradient-orb-2"></div>
                <div className="gradient-orb gradient-orb-3"></div>
            </div>

            {/* Card de Login */}
            <div className="login-card">
                <div className="login-header">
                    <div className="logo-ring">
                        <div className="logo-inner"></div>
                    </div>
                    <h1 className="login-title">Bienvenido</h1>
                    <p className="login-subtitle">Ingresa tus credenciales para continuar</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="error-message">
                            <svg className="error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email" className="form-label">
                            Email
                        </label>
                        <div className="input-wrapper">
                            <svg className="input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                            <input
                                id="email"
                                type="email"
                                value={credentials.email}
                                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                                className="form-input"
                                placeholder="tu@email.com"
                                disabled={isLoading}
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">
                            Contraseña
                        </label>
                        <div className="input-wrapper">
                            <svg className="input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={credentials.password}
                                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                className="form-input"
                                placeholder="••••••••"
                                disabled={isLoading}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="toggle-password"
                                disabled={isLoading}
                            >
                                {showPassword ? (
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="submit-button"
                    >
                        {isLoading ? (
                            <>
                                <svg className="spinner" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Ingresando...
                            </>
                        ) : (
                            'Ingresar'
                        )}
                    </button>

                    {/* PASO 3: Botón OAuth - Copiar este bloque completo */}
                    {/* 
                     * Este bloque muestra el botón de Google OAuth solo si:
                     * 1. Hay proveedores configurados
                     * 2. Google está habilitado en el backend
                     * 3. Tiene Client ID disponible
                     * 
                     * Para copiar: Todo este bloque desde aquí hasta el cierre del div
                     */}
                    {Object.keys(oauthProviders).length > 0 && (
                        <div style={{ marginTop: '1.5rem' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '1rem',
                            }}>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(148, 163, 184, 0.2)' }} />
                                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>o</span>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(148, 163, 184, 0.2)' }} />
                            </div>


                            {/* Lista de botones OAuth */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {/* Google - Activo si enabled=true */}
                                {oauthProviders.google?.enabled && oauthProviders.google.clientId ? (
                                    <button
                                        type="button"
                                        onClick={() => handleOAuthLogin('google')}
                                        disabled={isLoading}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            background: 'white',
                                            color: '#1f2937',
                                            border: '1px solid rgba(148, 163, 184, 0.2)',
                                            borderRadius: '8px',
                                            fontWeight: '500',
                                            cursor: isLoading ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isLoading) e.currentTarget.style.background = '#f9fafb';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isLoading) e.currentTarget.style.background = 'white';
                                        }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 18 18">
                                            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                                            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
                                            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" />
                                            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" />
                                        </svg>
                                        Continuar con Google
                                    </button>
                                ) : null}

                                {/* Otros Providers - Coming Soon */}
                                {/* Helper para renderizar botón disabled */}
                                {['Microsoft', 'Apple', 'X', 'GitHub'].map(providerName => {
                                    // Iconos SVG para cada provider
                                    const icons: Record<string, React.ReactNode> = {
                                        Microsoft: <svg width="18" height="18" viewBox="0 0 23 23"><path fill="#f35325" d="M1 1h10v10H1z" /><path fill="#81bc06" d="M12 1h10v10H12z" /><path fill="#05a6f0" d="M1 12h10v10H1z" /><path fill="#ffba08" d="M12 12h10v10H12z" /></svg>,
                                        Apple: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.02 3.96-.83 1.25.15 2.53.64 3.44 1.77-3.01 1.76-2.48 6.01.6 7.26-.51 1.55-1.28 3.1-2.08 4.03zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" /></svg>,
                                        X: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
                                        GitHub: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-3.795-.735-.54-1.38-1.335-1.755-1.335-1.755-1.005-.675.075-.66.075-.66 1.11.075 1.695 1.155 1.695 1.155.99 1.695 2.61 1.2 3.225.915.105-.72.39-1.2.705-1.485-2.565-.285-5.265-1.29-5.265-5.73 0-1.26.45-2.295 1.185-3.105-.12-.285-.51-1.47.105-3.06 0 0 .975-.315 3.195 1.185A11.16 11.16 0 0112 5.805c.99.045 1.98.225 3.285.675 2.22-1.5 3.195-1.185 3.195-1.185.615 1.59.225 2.775.105 3.06.735.81 1.185 1.845 1.185 3.105 0 4.455-2.7 5.43-5.28 5.715.39.345.75 1.02.75 2.055 0 1.485-.015 2.685-.015 3.045 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
                                    };

                                    return (
                                        <div key={providerName} style={{ position: 'relative' }}>
                                            <button
                                                type="button"
                                                disabled={true} // Deshabilitado porque es "Coming Soon"
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    background: '#f3f4f6', // Gris claro
                                                    color: '#9ca3af', // Texto gris
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '8px',
                                                    fontWeight: '500',
                                                    cursor: 'default', // No pointer
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '0.5rem',
                                                    opacity: 0.8,
                                                }}
                                            >
                                                <span style={{ opacity: 0.5 }}>{icons[providerName]}</span>
                                                Continuar con {providerName}
                                            </button>

                                            {/* Badge "Próximamente" */}
                                            <span style={{
                                                position: 'absolute',
                                                top: '-2px',
                                                right: '10px',
                                                background: '#ec4899', // Pink moderno
                                                color: 'white',
                                                fontSize: '0.65rem',
                                                fontWeight: '700',
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                letterSpacing: '0.5px',
                                                boxShadow: '0 2px 4px rgba(236, 72, 153, 0.2)',
                                                transform: 'rotate(5deg)' // Un toquecito de estilo
                                            }}>
                                                PRÓXIMAMENTE
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </form>

                <div className="login-footer">
                    <a href="#" className="footer-link">¿Olvidaste tu contraseña?</a>
                    <Link href="/register" className="footer-link">
                        ¿No tienes cuenta? Regístrate
                    </Link>
                </div>
            </div>
        </div>
    );
}
