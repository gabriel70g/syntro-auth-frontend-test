'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { postLogin2fa } from '@common/api/clients/auth.http.client';
import { mapApiError } from '@common/api/mappers/api-error.mapper';
import { mapLoginResponseBodyToResult } from '@common/api/mappers/login-result.mapper';
import { homePathForRole } from '@common/lib/home-path';

/**
 * Why: Completar login con TOTP tras mfa_required. El token temporal vive en una cookie HttpOnly del BFF: si
 * venció, se vuelve al login.
 */
export function useLogin2faChallenge() {
    const router = useRouter();
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    // M13: quien perdió el acceso a su app usa uno de los códigos que guardó al activar 2FA.
    const [usingRecoveryCode, setUsingRecoveryCode] = useState(false);
    const [recoveryCode, setRecoveryCode] = useState('');

    useEffect(() => {
        if (!usingRecoveryCode) inputRefs.current[0]?.focus();
    }, [usingRecoveryCode]);

    const verifyCode = useCallback(async (fullCode: string) => {
        setIsLoading(true);
        setError('');
        try {
            const { ok, body } = await postLogin2fa({ code: fullCode });
            const result = mapLoginResponseBodyToResult(ok, body);
            if (result.success && result.session) {
                router.push(homePathForRole(result.session.role));
                return;
            }
            if (mapApiError(0, body, '').code === 'MFA_SESSION_EXPIRED') {
                router.replace('/login');
                return;
            }
            setError(result.error || 'Código inválido');
        } catch {
            setError('Error de conexión');
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    const handleInputChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const next = [...code];
        next[index] = value;
        setCode(next);
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
        if (value && index === 5 && next.every((c) => c)) {
            void verifyCode(next.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
        if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        void verifyCode(usingRecoveryCode ? recoveryCode.trim().toUpperCase() : code.join(''));
    };

    const toggleRecoveryCode = () => {
        setError('');
        setRecoveryCode('');
        setCode(['', '', '', '', '', '']);
        setUsingRecoveryCode((v) => !v);
    };

    const canSubmit = usingRecoveryCode ? recoveryCode.trim().length >= 10 : code.join('').length === 6;

    return {
        code,
        inputRefs,
        isLoading,
        error,
        usingRecoveryCode,
        recoveryCode,
        setRecoveryCode,
        toggleRecoveryCode,
        canSubmit,
        handleInputChange,
        handleKeyDown,
        handleSubmit,
    };
}
