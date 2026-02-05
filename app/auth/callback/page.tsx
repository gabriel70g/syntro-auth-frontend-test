'use client';

import { useEffect, useState } from 'react';
import { authService } from '@/lib/services/auth.service';
import { parseOAuthCallback, validateOAuthCallback } from '@/lib/utils/oauth';
import { getRedirectUri } from '@/lib/constants/config';

/**
 * Página de Callback OAuth - Demo/Maqueta SyntroAuth
 * 
 * Muestra cómo procesar el callback de OAuth providers:
 * - Recibe código de autorización
 * - Intercambia código por tokens JWT
 * - Redirige al dashboard
 * 
 * Arquitectura:
 * - Single Responsibility: solo maneja UI y orquesta el flujo
 * - Guard Clauses: validación temprana
 * - La lógica de negocio está en authService y utils/oauth
 * 
 * IMPORTANTE: Static Export (output: 'export')
 * - No usa useSearchParams() porque requiere servidor
 * - Lee query params directamente de window.location.search
 * - Compatible con HTML estático servido por nginx
 * 
 * Configurado para Railway por defecto.
 */
export default function OAuthCallbackPage() {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const handleCallback = async () => {
            // Guard clause: solo ejecutar en cliente
            if (typeof window === 'undefined') return;

            // Parsear query params desde URL (compatible con static export)
            // useSearchParams() no funciona con output: 'export'
            const urlParams = new URLSearchParams(window.location.search);
            const params = parseOAuthCallback(urlParams);

            // Validar parámetros (función pura)
            const validation = validateOAuthCallback(params);
            if (!validation.valid) {
                setStatus('error');
                setError(validation.error || 'Error desconocido');
                return;
            }

            // Guard clause: código debe existir (ya validado arriba, pero TypeScript necesita esto)
            if (!params.code) {
                setStatus('error');
                setError('No se recibió código de autorización');
                return;
            }

            // Extraer provider del state o usar default
            const provider = params.state || 'google';

            // CRÍTICO: Usar el mismo redirect URI que se usó para iniciar OAuth
            // Debe ser EXACTAMENTE el mismo o Google rechazará el intercambio
            // Prioridad: sessionStorage (el usado para iniciar) > getRedirectUri() (fallback)
            const savedRedirectUri = sessionStorage.getItem('oauth_redirect_uri');
            const redirectUri = savedRedirectUri || getRedirectUri();

            // Limpiar sessionStorage después de usarlo
            if (savedRedirectUri) {
                sessionStorage.removeItem('oauth_redirect_uri');
            }

            try {
                // Intercambiar código por tokens (delegado al servicio)
                const result = await authService.oauthLogin({
                    provider,
                    code: params.code,
                    redirectUri,
                });

                // Guard clause: resultado debe ser exitoso
                if (!result.success) {
                    setStatus('error');
                    setError(result.error || 'Error al autenticar con OAuth');
                    return;
                }

                // Check for MFA Required
                if (result.mfaRequired && result.tempToken) {
                    // Store temp token for the next step
                    if (typeof window !== 'undefined') {
                        sessionStorage.setItem('mfa_temp_token', result.tempToken);
                    }

                    if (result.message === 'SETUP_REQUIRED') {
                        window.location.href = '/mfa/setup';
                    } else {
                        window.location.href = '/login/2fa';
                    }
                    return;
                }

                // Happy path: éxito
                setStatus('success');

                // Side effect aislado: redirección después de delay
                const redirectTimer = setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1000);

                // Cleanup: limpiar timer si el componente se desmonta
                return () => clearTimeout(redirectTimer);
            } catch (err) {
                console.error('Error en callback OAuth:', {
                    error: err,
                    provider: params.state || 'unknown',
                    redirectUri,
                    codeReceived: !!params.code,
                    currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A',
                });
                setStatus('error');
                setError('Error inesperado al procesar autenticación');
            }
        };

        handleCallback();
        // Sin dependencias: solo se ejecuta una vez al montar
        // Los query params se leen directamente de window.location.search
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#f1f5f9',
            padding: '2rem',
        }}>
            <div style={{
                textAlign: 'center',
                maxWidth: '500px',
                width: '100%',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '16px',
                padding: '2rem',
            }}>
                {status === 'loading' && (
                    <>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            border: '4px solid rgba(59, 130, 246, 0.3)',
                            borderTopColor: '#3b82f6',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 1.5rem',
                        }} />
                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: '600',
                            marginBottom: '0.5rem',
                        }}>
                            Procesando autenticación...
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                            Por favor espera mientras completamos tu inicio de sesión
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: 'rgba(34, 197, 94, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                        }}>
                            <span style={{ fontSize: '2rem' }}>✓</span>
                        </div>
                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: '600',
                            marginBottom: '0.5rem',
                            color: '#22c55e',
                        }}>
                            ¡Autenticación exitosa!
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                            Redirigiendo al dashboard...
                        </p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                        }}>
                            <span style={{ fontSize: '2rem' }}>✗</span>
                        </div>
                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: '600',
                            marginBottom: '1rem',
                            color: '#ef4444',
                        }}>
                            Error de autenticación
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            {error}
                        </p>
                        <button
                            onClick={() => window.location.href = '/login'}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                color: 'white',
                                fontWeight: '600',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                            }}
                        >
                            Volver al Login
                        </button>
                    </>
                )}
            </div>

            <style jsx>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
