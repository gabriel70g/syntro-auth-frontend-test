'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { postAuthMfaEnable, postAuthMfaSetup } from '@common/api/clients/mfa.http.client';
import { mapMfaSetupHttpToOutcome } from '@common/api/mappers/mfa.mapper';
import { readMfaTempToken } from '@common/lib/storage/auth-session.storage';

type Step = 'loading' | 'qr' | 'success' | 'error';

/**
 * Why: Alta TOTP con JWT temporal (login forzado).
 */
export function useMfaForcedSetup() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('loading');
    const [otpAuthUri, setOtpAuthUri] = useState('');
    const [manualKey, setManualKey] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [tempToken, setTempToken] = useState<string | null>(null);

    useEffect(() => {
        const run = async () => {
            if (typeof window === 'undefined') return;
            const token = readMfaTempToken();
            const auth = localStorage.getItem('auth_token');
            const usable = token || auth;
            if (!usable) {
                router.replace('/login');
                return;
            }
            setTempToken(usable);
            const { ok, body } = await postAuthMfaSetup(usable);
            const mapped = mapMfaSetupHttpToOutcome(ok, body);
            if (mapped.success && mapped.setup) {
                setOtpAuthUri(mapped.setup.qrCodeUri);
                setManualKey(mapped.setup.manualEntryKey);
                setStep('qr');
            } else {
                setError(mapped.error || 'Error');
                setStep('error');
            }
        };
        void run();
    }, [router]);

    const submitEnable = useCallback(async () => {
        if (!tempToken || code.length !== 6) return;
        setLoading(true);
        setError('');
        const { ok } = await postAuthMfaEnable(tempToken, code);
        setLoading(false);
        if (!ok) {
            setError('Código incorrecto');
            return;
        }
        setStep('success');
        setTimeout(() => router.push('/login/2fa'), 2000);
    }, [code, tempToken, router]);

    return {
        step,
        otpAuthUri,
        manualKey,
        code,
        setCode,
        error,
        loading,
        submitEnable,
        router,
    };
}
