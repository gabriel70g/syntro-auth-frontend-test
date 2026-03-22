'use client';

import { useCallback, useState } from 'react';
import { postAuthForgotPassword } from '@common/api/clients/auth.http.client';
import { mapForgotPasswordResponse } from '@common/api/mappers/password-recovery.mapper';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Why: Orquesta solicitud de recuperación; validación y mapeo fuera del JSX.
 */
export function useForgotPasswordPageController() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setError('');
            setSuccessMessage('');

            const trimmed = email.trim();
            if (!trimmed) {
                setError('Ingresa tu email');
                return;
            }
            if (!emailRegex.test(trimmed)) {
                setError('Email inválido');
                return;
            }

            setIsLoading(true);
            try {
                const http = await postAuthForgotPassword({ email: trimmed });
                const outcome = mapForgotPasswordResponse(http.ok, http.body);
                if (outcome.kind === 'error') {
                    setError(outcome.message);
                    return;
                }
                setSuccessMessage(outcome.message);
            } catch {
                setError('Error inesperado. Intenta nuevamente.');
            } finally {
                setIsLoading(false);
            }
        },
        [email]
    );

    return {
        email,
        setEmail,
        isLoading,
        error,
        successMessage,
        handleSubmit,
    };
}
