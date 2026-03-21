'use client';

import { useEffect, useState } from 'react';
import { postOAuthLogin } from '@common/api/clients/auth.http.client';
import { mapOAuthLoginResponseBodyToResult } from '@common/api/mappers/login-result.mapper';
import { parseOAuthCallback, validateOAuthCallback } from '@common/lib/oauth';
import { getRedirectUri } from '@common/lib/config';
import {
    readAndClearOAuthRedirectUri,
    storeMfaTempToken,
    writeAuthSessionToStorage,
} from '@common/lib/storage/auth-session.storage';

type Status = 'loading' | 'success' | 'error';

/**
 * Why: Callback OAuth en static export (lee window.location).
 */
export function useOAuthCallbackController() {
    const [status, setStatus] = useState<Status>('loading');
    const [error, setError] = useState('');

    useEffect(() => {
        const run = async () => {
            if (typeof window === 'undefined') return;

            const params = parseOAuthCallback(new URLSearchParams(window.location.search));
            const validation = validateOAuthCallback(params);
            if (!validation.valid) {
                setStatus('error');
                setError(validation.error || 'Error');
                return;
            }
            if (!params.code) {
                setStatus('error');
                setError('No se recibió código de autorización');
                return;
            }

            const provider = params.state || 'google';
            const saved = readAndClearOAuthRedirectUri();
            const redirectUri = saved || getRedirectUri();

            try {
                const { ok, body } = await postOAuthLogin({
                    provider,
                    code: params.code,
                    redirectUri,
                });
                const result = mapOAuthLoginResponseBodyToResult(ok, body);

                if (!result.success) {
                    setStatus('error');
                    setError(result.error || 'Error al autenticar');
                    return;
                }

                if (result.mfaRequired && result.tempToken) {
                    storeMfaTempToken(result.tempToken);
                    if (result.message === 'SETUP_REQUIRED') {
                        window.location.href = '/mfa/setup';
                    } else {
                        window.location.href = '/login/2fa';
                    }
                    return;
                }

                if (result.session) {
                    writeAuthSessionToStorage(result.session);
                    setStatus('success');
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 1000);
                    return;
                }

                setStatus('error');
                setError('Respuesta inválida');
            } catch {
                setStatus('error');
                setError('Error inesperado al procesar autenticación');
            }
        };

        void run();
    }, []);

    return { status, error };
}
