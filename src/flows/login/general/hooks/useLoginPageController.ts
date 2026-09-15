'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthCredentials } from '@common/domain/auth.domain';
import type { OAuthProviderView } from '@common/domain/auth.domain';
import { postAuthLogin } from '@common/api/clients/auth.http.client';
import { getOAuthConfig } from '@common/api/clients/oauth-config.http.client';
import { mapLoginResponseBodyToResult } from '@common/api/mappers/login-result.mapper';
import { mapOAuthConfigBodyToProviders } from '@common/api/mappers/oauth-config.mapper';
import { encryptPassword } from '@common/lib/crypto';
import { readActiveTenant, writeActiveTenant } from '@common/lib/storage/tenant.storage';
import { getTenantByName } from '@common/api/clients/tenants.http.client';
import { mapTenantLookupResponse } from '@common/api/mappers/tenant.mapper';
import { formatApiError, mapApiError } from '@common/api/mappers/api-error.mapper';
import { homePathForRole } from '@common/lib/home-path';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Why: Orquesta login + carga OAuth config; efectos de red/storage acotados al hook.
 * `initialError` viene del servidor (`/login?error=`, ya filtrado por lista cerrada).
 */
export function useLoginPageController(initialError = '') {
    const router = useRouter();
    const [credentials, setCredentials] = useState<AuthCredentials>({ email: '', password: '', tenantName: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(initialError);
    const [showPassword, setShowPassword] = useState(false);
    const [oauthProviders, setOauthProviders] = useState<Record<string, OAuthProviderView>>({});

    useEffect(() => {
        const active = readActiveTenant();
        void (async () => {
            if (active) setCredentials((c) => ({ ...c, tenantName: active.name }));
            const { ok, body } = await getOAuthConfig();
            if (ok) setOauthProviders(mapOAuthConfigBodyToProviders(body));
        })();
    }, []);

    const handleOAuthLogin = useCallback((provider: string) => {
        const cfg = oauthProviders[provider.toLowerCase()];
        if (!cfg?.enabled || !cfg.clientId) {
            setError(`OAuth con ${provider} no está disponible`);
            return;
        }
        // El servidor genera el `state`, lo ata a este navegador y redirige al proveedor.
        const params = new URLSearchParams({ provider: provider.toLowerCase() });
        const tenant = readActiveTenant();
        if (tenant) params.set('tenant', tenant.id);
        // Navegación completa: es un route handler que redirige al proveedor, no una página.
        window.location.assign(new URL(`/api/bff/oauth/start?${params.toString()}`, window.location.origin));
    }, [oauthProviders]);

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setError('');
            if (!credentials.email.trim() || !credentials.password.trim()) {
                setError('Por favor completa todos los campos');
                return;
            }
            if (!emailRegex.test(credentials.email)) {
                setError('Email inválido');
                return;
            }

            setIsLoading(true);
            try {
                // syntroAuth busca al usuario dentro del tenant del header: resolverlo primero.
                const tenantName = credentials.tenantName.trim();
                if (!tenantName) {
                    writeActiveTenant(null);
                } else if (readActiveTenant()?.name !== tenantName) {
                    const lookup = await getTenantByName(tenantName);
                    const tenant = mapTenantLookupResponse(lookup.status, lookup.body);
                    if (tenant.kind === 'error') {
                        setError(formatApiError(tenant.error));
                        return;
                    }
                    writeActiveTenant({ id: tenant.id, name: tenant.name });
                }

                const encrypted = await encryptPassword(credentials.password);
                const { ok, body } = await postAuthLogin({
                    email: credentials.email,
                    password: encrypted,
                });
                const result = mapLoginResponseBodyToResult(ok, body);

                if (result.success && result.mfaRequired) {
                    router.push(result.message === 'SETUP_REQUIRED' ? '/mfa/setup' : '/login/2fa');
                    return;
                }

                if (!result.success) {
                    // Con envelope de error se muestra el código del backend (RATE_LIMIT_EXCEEDED, UNAUTHORIZED…).
                    const apiError = mapApiError(0, body, result.error || 'Error al iniciar sesión');
                    setError(apiError.code === 'NETWORK_ERROR' ? apiError.message : formatApiError(apiError));
                    return;
                }

                if (result.session) {
                    router.push(homePathForRole(result.session.role));
                }
            } catch {
                setError('Error inesperado. Intenta nuevamente.');
            } finally {
                setIsLoading(false);
            }
        },
        [credentials, router]
    );

    return {
        credentials,
        setCredentials,
        isLoading,
        error,
        showPassword,
        setShowPassword,
        oauthProviders,
        handleSubmit,
        handleOAuthLogin,
    };
}
