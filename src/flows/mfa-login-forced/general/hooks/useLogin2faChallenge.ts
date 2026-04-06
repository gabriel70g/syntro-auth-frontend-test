'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { postLogin2fa } from '@common/api/clients/auth.http.client';
import { mapLoginResponseBodyToResult } from '@common/api/mappers/login-result.mapper';
import { clearMfaTempToken, readMfaTempToken, writeAuthSessionToStorage } from '@common/lib/storage/auth-session.storage';

/**
 * Why: Completar login con TOTP tras mfa_required.
 */
export function useLogin2faChallenge() {
    const router = useRouter();
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [tempToken, setTempToken] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const t = readMfaTempToken();
        if (!t) {
            router.replace('/login');
            return;
        }
        setTempToken(t);
        inputRefs.current[0]?.focus();
    }, [router]);

    const verifyCode = useCallback(async (fullCode: string, token: string | null) => {
        if (!token) return;
        setIsLoading(true);
        setError('');
        try {
            const { ok, body } = await postLogin2fa({ tempToken: token, code: fullCode });
            const result = mapLoginResponseBodyToResult(ok, body);
            if (result.success && result.session) {
                writeAuthSessionToStorage(result.session);
                clearMfaTempToken();
                router.push('/dashboard');
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
            void verifyCode(next.join(''), tempToken);
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
        void verifyCode(code.join(''), tempToken);
    };

    return {
        code,
        inputRefs,
        isLoading,
        error,
        tempToken,
        handleInputChange,
        handleKeyDown,
        handleSubmit,
    };
}
