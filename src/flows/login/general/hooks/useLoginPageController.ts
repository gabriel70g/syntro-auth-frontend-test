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
import { startOAuthRedirect } from '@common/lib/oauth-redirect';
import { storeMfaTempToken, writeAuthSessionToStorage } from '@common/lib/storage/auth-session.storage';
import { readActiveTenant, writeActiveTenant } from '@common/lib/storage/tenant.storage';
import { getTenantByName } from '@common/api/clients/tenants.http.client';
import { mapTenantLookupResponse } from '@common/api/mappers/tenant.mapper';
import { formatApiError, mapApiError } from '@common/api/mappers/api-error.mapper';
import { homePathForRole } from '@common/lib/home-path';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Why: Orquesta login + carga OAuth config; efectos de red/storage acotados al hook.
 */
export function useLoginPageController() {
    const router = useRouter();
    const [credentials, setCredentials] = useState<AuthCredentials>({ email: '', password: '', tenantName: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [oauthProviders, setOauthProviders] = useState<Record<string, OAuthProviderView>>({});

    useEffect(() => {
        const active = readActiveTenant();
        if (active) setCredentials((c) => ({ ...c, tenantName: active.name }));
        void (async () => {
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
        startOAuthRedirect(provider, cfg.clientId);
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

                if (result.success && result.mfaRequired && result.tempToken) {
                    storeMfaTempToken(result.tempToken);
                    if (result.message === 'SETUP_REQUIRED') {
                        router.push('/mfa/setup');
                    } else {
                        router.push('/login/2fa');
                    }
                    return;
                }

                if (!result.success) {
                    // Con envelope de error se muestra el código del backend (RATE_LIMIT_EXCEEDED, UNAUTHORIZED…).
                    const apiError = mapApiError(0, body, result.error || 'Error al iniciar sesión');
                    setError(apiError.code === 'NETWORK_ERROR' ? apiError.message : formatApiError(apiError));
                    return;
                }

                if (result.session) {
                    writeAuthSessionToStorage(result.session);
                    router.push(homePathForRole(result.session.user.role));
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
