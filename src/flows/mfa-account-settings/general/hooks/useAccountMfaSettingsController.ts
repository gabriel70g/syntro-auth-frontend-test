'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    deleteAccountMfaDisable,
    postAccountMfaConfirmSync,
    postAccountMfaSetup,
} from '@common/api/clients/mfa.http.client';
import { mapMfaConfirmHttpToOutcome, mapMfaSetupHttpToOutcome } from '@common/api/mappers/mfa.mapper';
import { mapUnknownToErrorMessage } from '@common/api/mappers/error-message.mapper';
import { readStoredAccessToken } from '@common/lib/storage/auth-session.storage';

export type AccountMfaStep = 'intro' | 'scan' | 'sync' | 'done' | 'disable';

/**
 * Why: Wizard 2FA desde cuenta (JWT completo); HTTP + mapeo fuera del JSX.
 */
export function useAccountMfaSettingsController() {
    const router = useRouter();
    const [step, setStep] = useState<AccountMfaStep>('intro');
    const [otpAuthUri, setOtpAuthUri] = useState('');
    const [manualKey, setManualKey] = useState('');
    const [code, setCode] = useState('');
    const [disablePassword, setDisablePassword] = useState('');
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!readStoredAccessToken()) router.replace('/login');
    }, [router]);

    const startServerSetup = useCallback(async () => {
        const token = readStoredAccessToken();
        if (!token) return;
        setLoading(true);
        setError('');
        const { ok, body } = await postAccountMfaSetup(token);
        const mapped = mapMfaSetupHttpToOutcome(ok, body);
        setLoading(false);
        if (!mapped.success || !mapped.setup) {
            setError(mapped.error || 'Error');
            return;
        }
        setOtpAuthUri(mapped.setup.qrCodeUri);
        setManualKey(mapped.setup.manualEntryKey);
        setStep('scan');
    }, []);

    const submitSync = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (code.length !== 6) {
                setError('Ingresá 6 dígitos');
                return;
            }
            const token = readStoredAccessToken();
            if (!token) return;
            setLoading(true);
            setError('');
            const { ok, body } = await postAccountMfaConfirmSync(token, code);
            const mapped = mapMfaConfirmHttpToOutcome(ok, body);
            setLoading(false);
            if (!mapped.success) {
                setError(mapped.error || 'Código incorrecto');
                return;
            }
            setRecoveryCodes(mapped.recoveryCodes ?? []);
            setStep('done');
        },
        [code]
    );

    const submitDisable = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            const token = readStoredAccessToken();
            if (!token || !disablePassword) {
                setError('Contraseña requerida');
                return;
            }
            setLoading(true);
            setError('');
            const { ok, body } = await deleteAccountMfaDisable(token, disablePassword);
            setLoading(false);
            if (!ok) {
                setError(mapUnknownToErrorMessage(body, 'No se pudo desactivar 2FA'));
                return;
            }
            setDisablePassword('');
            setStep('intro');
            alert('2FA desactivado.');
        },
        [disablePassword]
    );

    return {
        step,
        setStep,
        otpAuthUri,
        manualKey,
        code,
        setCode,
        disablePassword,
        setDisablePassword,
        recoveryCodes,
        error,
        setError,
        loading,
        router,
        startServerSetup,
        submitSync,
        submitDisable,
    };
}
