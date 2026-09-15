'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { postAuthMfaEnable, postAuthMfaSetup } from '@common/api/clients/mfa.http.client';
import { mapMfaSetupHttpToOutcome } from '@common/api/mappers/mfa.mapper';

type Step = 'loading' | 'qr' | 'success' | 'error';

/**
 * Why: Alta TOTP con JWT temporal (login forzado). El token temporal lo agrega el BFF desde su cookie.
 */
export function useMfaForcedSetup() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('loading');
    const [otpAuthUri, setOtpAuthUri] = useState('');
    const [manualKey, setManualKey] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let alive = true;
        void (async () => {
            const { ok, body } = await postAuthMfaSetup();
            if (!alive) return;
            const mapped = mapMfaSetupHttpToOutcome(ok, body);
            if (mapped.success && mapped.setup) {
                setOtpAuthUri(mapped.setup.qrCodeUri);
                setManualKey(mapped.setup.manualEntryKey);
                setStep('qr');
            } else {
                setError(mapped.error || 'Error');
                setStep('error');
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    const submitEnable = useCallback(async () => {
        if (code.length !== 6) return;
        setLoading(true);
        setError('');
        const { ok } = await postAuthMfaEnable(code);
        setLoading(false);
        if (!ok) {
            setError('Código incorrecto');
            return;
        }
        setStep('success');
        setTimeout(() => router.push('/login/2fa'), 2000);
    }, [code, router]);

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
